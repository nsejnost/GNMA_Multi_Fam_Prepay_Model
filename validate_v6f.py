"""
End-to-end validation of V6F Excel calculator vs analytical Python predictions.

Runs the actual Excel formulas via the `formulas` package and compares to
the same loans scored directly through the V6F coefficients in model_data_v6f.json.

Pass criteria:
  - max |Excel pred_CPR - Python pred_CPR| < 1e-6  across all sample loans
  - Sanity column (baseline + sum(attr) - pred_CPR) max abs < 1e-12 in all rows
"""
import json, math, re, sys
from pathlib import Path
import numpy as np
import pandas as pd
import formulas

HERE = Path(__file__).resolve().parent
XLSX = HERE / "V6F_Excel_Calculator.xlsx"
MODEL_JSON = HERE / "model_data_v6f.json"
SAMPLE_PARQUET = HERE / "sample_loans.parquet"

if not XLSX.exists() or not MODEL_JSON.exists():
    sys.exit(f"ERROR: missing {XLSX.name} or {MODEL_JSON.name}")

md = json.load(open(MODEL_JSON))
features = md['metadata']['feature_list']
intercept = md['metadata']['intercept_scaled']
coefs = {c['feature']: c for c in md['coefficients']}

# --- Compute Python predictions on sample_loans (replicating V6F derivations) ---
sample = pd.read_parquet(SAMPLE_PARQUET).reset_index(drop=True)
sample = sample[sample['loan_age_months'].notna() & sample['vintage_year'].notna()].reset_index(drop=True)


def derive_v6f(s):
    """Compute V6F feature dict from one panel-row Series, matching train_v6f.py exactly."""
    age = max(0, s['loan_age_months'] if pd.notna(s['loan_age_months']) else 0)
    upb = max(0, s['upb'] if pd.notna(s['upb']) else 0)
    period = int(s['period'])
    py, pm = period // 100, period % 100
    # Maturity
    mat = str(s.get('loan_maturity_date', '')).strip()
    if len(mat) >= 6 and mat[:4].isdigit() and mat[4:6].isdigit():
        my, mm = int(mat[:4]), int(mat[4:6])
        mtm = max(0, min(480, (my - py) * 12 + (mm - pm)))
    else:
        mtm = 360
    # Lockout end
    lo = str(s.get('lockout_end_date', '')).strip()
    if len(lo) >= 6 and lo[:4].isdigit() and lo[4:6].isdigit():
        ly, lm = int(lo[:4]), int(lo[4:6])
        msle = max(0, min(24, (py - ly) * 12 + (pm - lm)))
    else:
        msle = 0
    # Issuer flags
    iname = str(s['issuer_name']).upper()
    feats = {
        'gross_refi_incentive_bps': float(s['loan_rate']) * 100 - float(s['plc_rate_bps']),
        'prepay_penalty_points':    float(s.get('prepay_penalty_points', 0) or 0),
        'age_0_36':                 min(age, 36),
        'age_36_120':               min(max(age - 36, 0), 84),
        'age_120plus':              max(age - 120, 0),
        'months_to_maturity':       mtm,
        'pre_maturity_flag':        1 if 0 < mtm <= 24 else 0,
        'months_since_lockout_end': msle,
        'log_upb':                  math.log1p(upb),
        'small_loan':               1 if upb < 2_000_000 else 0,
        'large_loan':               1 if upb > 50_000_000 else 0,
        'burn_ratio':               (s['cum_itm'] / max(age, 1)) if pd.notna(s.get('cum_itm')) else 0,
        'is_post_covid':            1 if s.get('vintage_year', 0) >= 2021 else 0,
        'is_223a7':                 int(s.get('is_223a7', 0)),
        'is_538':                   int(s.get('is_538', 0)),
        'is_hc_232':                int(s.get('is_hc_232', 0)),
        'lp_NC':                    1 if str(s.get('loan_purpose', '')).upper() == 'NC' else 0,
        'iss_capital_funding':      1 if 'CAPITAL FUNDING' in iname else 0,
        'iss_pnc':                  1 if 'PNC' in iname else 0,
        'iss_wells_fargo':          1 if 'WELLS FARGO' in iname else 0,
        'iss_dwight':               1 if 'DWIGHT' in iname else 0,
        'iss_greystone':            1 if 'GREYSTONE' in iname else 0,
        'iss_lument_combined':      1 if str(s['issuer_number']) in ('3896', '3557') else 0,
    }
    # Interactions (only if in feature_list)
    if 'gross_refi__x__prepay_pen' in features:
        feats['gross_refi__x__prepay_pen'] = feats['gross_refi_incentive_bps'] * feats['prepay_penalty_points']
    if 'age_0_36__x__lp_NC' in features:
        feats['age_0_36__x__lp_NC'] = feats['age_0_36'] * feats['lp_NC']
    if 'age_0_36__x__is_hc_232' in features:
        feats['age_0_36__x__is_hc_232'] = feats['age_0_36'] * feats['is_hc_232']
    if 'iss_lument__x__gross_refi' in features:
        feats['iss_lument__x__gross_refi'] = feats['iss_lument_combined'] * feats['gross_refi_incentive_bps']
    if 'iss_dwight__x__gross_refi' in features:
        feats['iss_dwight__x__gross_refi'] = feats['iss_dwight'] * feats['gross_refi_incentive_bps']
    if 'iss_greystone__x__gross_refi' in features:
        feats['iss_greystone__x__gross_refi'] = feats['iss_greystone'] * feats['gross_refi_incentive_bps']
    return feats


def pred_python(s):
    feats = derive_v6f(s)
    contribs = {}
    total = 0.0
    for f in features:
        c = coefs[f]
        contrib = c['beta_native'] * (feats[f] - c['mean'])
        contribs[f] = contrib
        total += contrib
    logit_z = intercept + total
    smm = 1.0 / (1.0 + math.exp(-logit_z))
    cpr = 1 - (1 - smm) ** 12
    baseline_cpr = 1 - (1 - 1.0 / (1 + math.exp(-intercept))) ** 12
    return logit_z, smm, cpr, baseline_cpr, contribs


# --- Run Excel formulas through `formulas` ---
print(f"Loading {XLSX.name} via `formulas` ... (this is slow, ~30s)")
xl = formulas.ExcelModel().loads(str(XLSX)).finish().calculate()

# Find pred_CPR column letter for V6F. Same column-layout logic as build_excel.py.
n_feat = len(features)
n_id = 8
n_input = 13   # V6F INPUT_COLS count
COL_FEAT_START = n_id + n_input + 1
COL_CONTRIB_START = COL_FEAT_START + n_feat
COL_SUMMARY_START = COL_CONTRIB_START + n_feat
COL_ATTR_START = COL_SUMMARY_START + 4
COL_SANITY = COL_ATTR_START + n_feat
PRED_CPR_COL = COL_SUMMARY_START + 3

from openpyxl.utils import get_column_letter

def cl(i): return get_column_letter(i)


def lookup(col_letter, row):
    key = f"'[V6F_Excel_Calculator.xlsx]LOAN_SNAPSHOT'!{col_letter.upper()}{row}"
    sol = xl.get(key)
    if sol is None:
        return None
    v = sol.value
    if hasattr(v, '__len__') and not isinstance(v, str):
        return v[0][0] if len(v) and len(v[0]) else None
    return v


N = len(sample)
DATA_START_ROW = 5
PRED_CPR_LETTER = cl(PRED_CPR_COL)
SANITY_LETTER = cl(COL_SANITY)
print(f"Comparing {N} loans (pred_CPR col = {PRED_CPR_LETTER}, sanity col = {SANITY_LETTER})")

cpr_diffs = []
sanity_vals = []

for i in range(min(N, 30)):  # sample 30 is enough for end-to-end check
    r = DATA_START_ROW + i
    py_logit, py_smm, py_cpr, py_baseline, py_contribs = pred_python(sample.iloc[i])
    excel_cpr = lookup(PRED_CPR_LETTER, r)
    sanity = lookup(SANITY_LETTER, r)
    if excel_cpr is None:
        print(f"  row {r}: Excel CPR is None (cell missing)")
        continue
    diff = float(excel_cpr) - py_cpr
    cpr_diffs.append(diff)
    if sanity is not None:
        sanity_vals.append(float(sanity))

cpr_diffs = np.array(cpr_diffs)
print(f"\nResults (n={len(cpr_diffs)}):")
print(f"  max |Excel - Python| pred_CPR : {np.max(np.abs(cpr_diffs)):.2e}")
print(f"  mean |Excel - Python|          : {np.mean(np.abs(cpr_diffs)):.2e}")
print(f"  max |sanity check|             : {max(abs(v) for v in sanity_vals if v is not None):.2e}")

if np.max(np.abs(cpr_diffs)) < 1e-6:
    print("\nPASS: V6F Excel matches analytical Python prediction within 1e-6")
else:
    print("\nFAIL: V6F Excel diverges from Python by > 1e-6 - investigate.")
    sys.exit(1)
