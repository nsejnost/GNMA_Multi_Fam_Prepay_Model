"""
V9 validation — four layers, mirrors validate_v8.py with V9 column layout.
  Layer 1: Excel↔Python parity on 30 sample loans (max diff < 1e-6)
  Layer 2: Tail-blowup detector — full panel max CPR check
  Layer 3: SanCap per-cohort grid (informational)
  Layer 4: V8 head-to-head comparison (informational)
"""
import json, math, os, sys
from pathlib import Path
import numpy as np
import pandas as pd
import formulas
from openpyxl.utils import get_column_letter

import cohort_v9 as c9

HERE = Path(__file__).resolve().parent
XLSX = HERE / "V9_Excel_Calculator.xlsx"
MODEL_JSON = HERE / "model_data_v9.json"
SAMPLE_PARQUET = HERE / "sample_loans.parquet"
PANEL_PATH = Path(os.environ.get('GNMA_PANEL_PARQUET',
                                  HERE / 'working' / 'gnma_mf_panel.parquet'))

if not all(p.exists() for p in (XLSX, MODEL_JSON, SAMPLE_PARQUET)):
    sys.exit(f"ERROR: missing one of {XLSX.name}, {MODEL_JSON.name}, {SAMPLE_PARQUET.name}")

md = json.load(open(MODEL_JSON))
cohort_table = md['cohort_table']
structural   = md['structural_params']


def derive_features_for_sample(s):
    age = max(0.0, s['loan_age_months'] if pd.notna(s['loan_age_months']) else 0.0)
    upb = max(0.0, s['upb'] if pd.notna(s['upb']) else 0.0)
    period = int(s['period'])
    py, pm = period // 100, period % 100
    mat = str(s.get('loan_maturity_date', '')).strip()
    if len(mat) >= 6 and mat[:4].isdigit() and mat[4:6].isdigit():
        mtm = max(0, min(480, (int(mat[:4]) - py) * 12 + (int(mat[4:6]) - pm)))
    else:
        mtm = 360
    lo = str(s.get('lockout_end_date', '')).strip()
    if len(lo) >= 6 and lo[:4].isdigit() and lo[4:6].isdigit():
        msle = max(0, min(24, (py - int(lo[:4])) * 12 + (pm - int(lo[4:6]))))
    else:
        msle = 0
    cum_itm = float(s.get('cum_itm', 0))
    burn_ratio = min(1.0, max(0.0, cum_itm / max(1.0, age)))
    grf = float(s['loan_rate']) * 100 - float(s['plc_rate_bps'])
    ppp = float(s.get('prepay_penalty_points', 0) or 0)
    net_refi = grf - 12.5 * (ppp + 1)
    return {
        'loan_age_months':          np.array([age]),
        'net_refi_incentive_bps':   np.array([net_refi]),
        'log_upb':                  np.array([math.log1p(upb)]),
        'fha_category':             np.array([str(s.get('fha_category', ''))]),
        'loan_purpose':             np.array([str(s.get('loan_purpose', ''))]),
        'upb':                      np.array([float(upb)]),
        'months_since_lockout_end': np.array([float(msle)]),
        'months_to_maturity':       np.array([float(mtm)]),
        'burn_ratio':               np.array([burn_ratio]),
    }


def layer1():
    print(f"Layer 1 — loading {XLSX.name} via `formulas` (~30s)...")
    xl = formulas.ExcelModel().loads(str(XLSX)).finish().calculate()
    sample = pd.read_parquet(SAMPLE_PARQUET).reset_index(drop=True)
    sample = sample[sample['loan_age_months'].notna() & sample['vintage_year'].notna()
                    ].reset_index(drop=True)

    # V9 column layout (must match build_excel_v9.py):
    #   ID(6) + Inputs(9) + Derived(7) + Sigmoid(6, +asym_factor) +
    #   Age_ramp(5) + Structural(3) + Output(2) = 38 total
    pred_cpr_letter = get_column_letter(38)
    DATA_START_ROW = 3
    print(f"  pred_CPR col = {pred_cpr_letter}")

    def lookup(col_letter, row):
        key = f"'[V9_Excel_Calculator.xlsx]LOAN_SNAPSHOT'!{col_letter}{row}"
        sol = xl.get(key)
        if sol is None: return None
        v = sol.value
        if hasattr(v, '__len__') and not isinstance(v, str):
            return v[0][0] if len(v) and len(v[0]) else None
        return v

    cpr_diffs, sample_dump = [], []
    for i in range(min(30, len(sample))):
        r = DATA_START_ROW + i
        feats = derive_features_for_sample(sample.iloc[i])
        smm = float(c9.predict_smm_v9b(feats, cohort_table, structural,
                                         smm_cap=md['metadata']['smm_cap'])[0])
        py_cpr = (1 - (1 - smm) ** 12) * 100
        excel_cpr = lookup(pred_cpr_letter, r)
        if excel_cpr is None:
            print(f"  row {r}: Excel CPR is None - skip")
            continue
        excel_cpr_pct = float(excel_cpr) * 100
        diff = excel_cpr_pct - py_cpr
        cpr_diffs.append(diff)
        sample_dump.append((sample.iloc[i]['loan_id'], py_cpr, excel_cpr_pct, diff))

    diffs = np.array(cpr_diffs)
    if len(diffs) == 0:
        print("  no rows compared"); return False
    print(f"  n={len(diffs)}  max|Excel-Python| pred_CPR = {np.max(np.abs(diffs)):.2e}%")
    if np.max(np.abs(diffs)) < 1e-6:
        print("  PASS")
        return True
    print("  FAIL — first divergent rows:")
    for loan_id, py, ex, d in sample_dump[:5]:
        print(f"    {str(loan_id)[:30]:>30}  py={py:7.4f}%  excel={ex:7.4f}%  diff={d:+.4e}")
    return False


def layer2():
    print(f"\nLayer 2 — full-panel tail-blowup detector...")
    df = pd.read_parquet(PANEL_PATH)
    last = sorted(df['period'].astype(str).unique())[-1]
    df = df[(df['prepay_eligible'] == 1) & (df['is_mature_loan'] != 1)
            & (df['period'].astype(str) != last)].copy()
    period_dt = pd.to_datetime(df['period'].astype(str), format='%Y%m')
    mat_dt = pd.to_datetime(df['loan_maturity_date'].astype(str).str.strip(),
                            format='%Y%m%d', errors='coerce')
    df['months_to_maturity'] = (((mat_dt.dt.year - period_dt.dt.year) * 12
                                  + (mat_dt.dt.month - period_dt.dt.month))
                                 .fillna(360).clip(0, 480).astype(float))
    lo_dt = pd.to_datetime(df['lockout_end_date'].astype(str).str.strip(),
                           format='%Y%m%d', errors='coerce')
    msle = ((period_dt.dt.year - lo_dt.dt.year) * 12
            + (period_dt.dt.month - lo_dt.dt.month))
    df['months_since_lockout_end'] = msle.where(msle.notna(), 0).clip(0, 24).astype(float)
    df['log_upb'] = np.log1p(df['upb'].fillna(0).clip(lower=0)).astype(float)
    df = df.sort_values(['loan_id', 'period']).reset_index(drop=True)
    df['_itm'] = (df['refi_incentive_bps'].fillna(-9999) > 0).astype(int)
    df['cum_itm'] = df.groupby('loan_id')['_itm'].cumsum()
    df['burn_ratio'] = (df['cum_itm'] / np.maximum(df['loan_age_months'].fillna(1), 1)
                        ).clip(0, 1).astype(float)
    df['gross_refi_incentive_bps'] = df['gross_refi_incentive_bps'].astype(float).fillna(0)
    df['prepay_penalty_points']    = df['prepay_penalty_points'].astype(float).fillna(0).clip(0, 10)
    df['loan_age_months']          = df['loan_age_months'].fillna(0).clip(lower=0).astype(float)
    df['fha_category']             = df['fha_category'].fillna('').astype(str)
    df['loan_purpose']             = df['loan_purpose'].fillna('').astype(str)
    df['upb']                      = df['upb'].fillna(0).clip(lower=0).astype(float)
    if 'refi_incentive_bps' in df.columns:
        df['net_refi_incentive_bps'] = df['refi_incentive_bps'].astype(float).fillna(
            df['gross_refi_incentive_bps'] - 12.5 * (df['prepay_penalty_points'] + 1))
    else:
        df['net_refi_incentive_bps'] = (df['gross_refi_incentive_bps']
                                         - 12.5 * (df['prepay_penalty_points'] + 1)).astype(float)

    feats = {k: df[k].values for k in
             ['loan_age_months', 'net_refi_incentive_bps', 'log_upb',
              'fha_category', 'loan_purpose', 'upb',
              'months_since_lockout_end', 'months_to_maturity', 'burn_ratio']}
    smm = c9.predict_smm_v9b(feats, cohort_table, structural,
                              smm_cap=md['metadata']['smm_cap'])
    cpr = (1 - (1 - smm) ** 12) * 100
    max_cpr = float(cpr.max())
    n_above_90 = int((cpr > 90).sum())
    n_above_75 = int((cpr > 75).sum())
    print(f"  n loans scored: {len(cpr):,}")
    print(f"  max(pred_CPR) = {max_cpr:.2f}%")
    print(f"  count(pred_CPR > 90%) = {n_above_90:,}  > 75% = {n_above_75:,}")
    # V9's per-cohort bounds (R2) tighten the tail dramatically vs V8.1
    # (V8.1 had 4,023 loans above 90%; V9 typically has < 1000).
    # Max CPR can approach the global cap (~98% with smm_cap=0.30) on legitimate
    # streamlined-refi cohorts. Hard threshold: count > 90% under 1000.
    if n_above_90 < 1000:
        print(f"  PASS — V9 per-cohort bounds (R2) constrain tail effectively "
              f"(n>90%={n_above_90} ≪ V8.1's 4,023)")
        return True
    print(f"  FAIL — V9 has {n_above_90:,} loans above 90% CPR (over 1000-loan threshold)")
    return False


def layer3():
    print(f"\nLayer 3 — SanCap per-cohort grid (informational):")
    grid = md.get('sancap_benchmarks', [])
    n_review = sum(1 for r in grid if r['flag'] == 'REVIEW')
    print(f"  {n_review}/{len(grid)} scenarios diverge > 10pp")
    for r in grid:
        flag = '⚠' if r['flag'] == 'REVIEW' else ' '
        print(f"  {flag} {r['scenario']:<35}  cohort={r['cohort']:<26}  "
              f"SanCap={r['sancap_cpr']:>3} CPR  V9={r['v9_pred_cpr']:>5.1f}  "
              f"Δ={r['divergence_pp']:>5.1f}pp")
    return True


def layer4():
    print(f"\nLayer 4 — V8 vs V9 head-to-head (informational):")
    cmp = md.get('comparison_to_v8', {})
    if not cmp.get('available'):
        print("  V8 artifact not available — skip")
        return True
    print(f"  V8 AUC      : {cmp['v8_test_auc']:.4f}")
    print(f"  V9 AUC      : {cmp['v9_test_auc']:.4f}  (Δ {cmp['auc_delta']:+.4f})")
    print(f"  V8 log-loss : {cmp['v8_log_loss']:.5f}")
    print(f"  V9 log-loss : {cmp['v9_log_loss']:.5f}  (Δ {cmp['log_loss_delta']:+.5f})")
    return True


if __name__ == '__main__':
    p1 = layer1()
    p2 = layer2()
    layer3()
    layer4()
    print()
    if p1 and p2:
        print("ALL HARD CHECKS PASS  (Layers 3 & 4 are informational)")
        sys.exit(0)
    print("FAILURES:", "Layer 1" if not p1 else "", "Layer 2" if not p2 else "")
    sys.exit(1)
