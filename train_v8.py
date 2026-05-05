"""
V8 cohort-based S-curve voluntary prepayment model — training pipeline.

Workflow:
  1. Load panel + derive features (re-using V7 patterns; copy not import to
     keep V7 frozen as comparison baseline).
  2. Assign each loan-month to a primary cohort (program × purpose × size).
  3. For each cohort with ≥ MIN_EVENTS prepays, bin loan-months on
     net_refi_bps into ~12 quantile bins and fit a 4-parameter sigmoid via
     weighted least squares (curve_fit).
  4. Cohorts that fall below MIN_EVENTS get rolled up the fallback hierarchy
     (program × purpose, then program-only, then GLOBAL).
  5. Compute V8a (pure cohort) and V8b (cohort × V7 structural multipliers)
     predictions on the test fold.
  6. Emit model_data_v8.json with dashboard-feeding blocks:
        cohort_definitions[]   - sigmoid params per surviving cohort
        cohort_scurves[]       - empirical scatter points (bin_mid, actual)
        cohort_curve_grids[]   - smooth fitted curves (50-point grid)
        per-V7 diagnostics (period/year/scurve/calibration/cuts/sample_loans)
        comparison_to_v7

Outputs:
  - model_data_v8.json
  - issuer_residuals_v8.json (separate; matches V7 pattern)

CLI:
  GNMA_PANEL_PARQUET=working/gnma_mf_panel.parquet python3 train_v8.py
  python3 train_v8.py --emit-dashboard            # train AND re-template dashboard
  python3 train_v8.py --only-emit-dashboard       # skip training; refresh dashboard
"""
from __future__ import annotations
import argparse, copy, json, math, os, re, sys, warnings
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
from sklearn.metrics import roc_auc_score, log_loss

import cohort_v8 as c8
import v7_multipliers as v7m

warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=RuntimeWarning)

HERE = Path(__file__).resolve().parent
PANEL_PATH = Path(os.environ.get('GNMA_PANEL_PARQUET',
                                  HERE / 'working' / 'gnma_mf_panel.parquet'))
OUT_JSON = HERE / 'model_data_v8.json'
ISSUER_JSON = HERE / 'issuer_residuals_v8.json'
V7_JSON = HERE / 'model_data_v7.json'
DASHBOARD = HERE / 'v8_dashboard.jsx'
SEED = 42
MIN_EVENTS_PER_COHORT = 100        # Threshold to keep a primary cohort
N_BINS_PER_COHORT = 12             # Quantile bins for the empirical scatter
N_CURVE_GRID_POINTS = 50           # Smooth-curve grid for the dashboard line


# ---------------------------------------------------------------------------
# Panel loading + feature derivation (copies V7 patterns; do not import V7's
# train module — keeps V7 frozen)
# ---------------------------------------------------------------------------
def load_panel(panel_path: Path) -> tuple[pd.DataFrame, str]:
    print(f"Loading panel: {panel_path}")
    df = pd.read_parquet(panel_path)
    print(f"  Loaded {len(df):,} rows × {df.shape[1]} cols")
    last_period = sorted(df['period'].astype(str).unique())[-1]
    print(f"  Last panel period (excluded from training): {last_period}")
    pre = len(df)
    df = df[(df['prepay_eligible'] == 1)
            & (df['is_mature_loan'] != 1)
            & (df['period'].astype(str) != last_period)].copy()
    print(f"  Filtered to eligible, non-mature, non-last-period: {len(df):,}  (-{pre - len(df):,})")
    return df, last_period


def derive_features(df: pd.DataFrame) -> pd.DataFrame:
    """Same as V7's derivation: net_refi_bps, mtm, msle, log_upb, burn_ratio."""
    period_dt = pd.to_datetime(df['period'].astype(str), format='%Y%m')
    mat_dt = pd.to_datetime(df['loan_maturity_date'].astype(str).str.strip(),
                            format='%Y%m%d', errors='coerce')
    df['months_to_maturity'] = (
        ((mat_dt.dt.year - period_dt.dt.year) * 12
         + (mat_dt.dt.month - period_dt.dt.month))
        .fillna(360).clip(0, 480).astype(float)
    )
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
    df.drop(columns=['_itm'], inplace=True)

    df['gross_refi_incentive_bps'] = df['gross_refi_incentive_bps'].astype(float).fillna(0)
    df['prepay_penalty_points']    = df['prepay_penalty_points'].astype(float).fillna(0).clip(0, 10)
    df['loan_age_months']          = df['loan_age_months'].fillna(0).clip(lower=0).astype(float)
    df['fha_category']             = df['fha_category'].fillna('').astype(str)
    df['loan_purpose']             = df['loan_purpose'].fillna('').astype(str)
    df['upb']                      = df['upb'].fillna(0).clip(lower=0).astype(float)

    if 'refi_incentive_bps' in df.columns:
        df['net_refi_incentive_bps'] = df['refi_incentive_bps'].astype(float).fillna(
            df['gross_refi_incentive_bps'] - 12.5 * (df['prepay_penalty_points'] + 1)
        )
    else:
        df['net_refi_incentive_bps'] = (df['gross_refi_incentive_bps']
                                         - 12.5 * (df['prepay_penalty_points'] + 1)).astype(float)

    feat_cols = ['loan_age_months', 'net_refi_incentive_bps',
                 'log_upb', 'months_since_lockout_end', 'months_to_maturity', 'burn_ratio']
    nans = df[feat_cols].isna().any(axis=1)
    if nans.any():
        print(f"  Dropping {nans.sum()} rows with NaN features")
        df = df[~nans].copy()

    print(f"  Final training-eligible rows: {len(df):,}")
    return df


def features_dict(df: pd.DataFrame) -> dict:
    """Pack a DataFrame slice into the dict cohort_v8 expects."""
    return {
        'loan_age_months':          df['loan_age_months'].values,
        'net_refi_incentive_bps':   df['net_refi_incentive_bps'].values,
        'log_upb':                  df['log_upb'].values,
        'fha_category':             df['fha_category'].values,
        'loan_purpose':             df['loan_purpose'].values,
        'upb':                      df['upb'].values,
        'months_since_lockout_end': df['months_since_lockout_end'].values,
        'months_to_maturity':       df['months_to_maturity'].values,
        'burn_ratio':               df['burn_ratio'].values,
    }


def train_split(df: pd.DataFrame, seed: int = SEED) -> tuple[np.ndarray, np.ndarray]:
    loans = df['loan_id'].unique()
    rng = np.random.default_rng(seed)
    shuf = rng.permutation(loans)
    cut = int(0.8 * len(shuf))
    train_loans = set(shuf[:cut])
    is_train = df['loan_id'].isin(train_loans).values
    return is_train, ~is_train


# ---------------------------------------------------------------------------
# Cohort fitting (the heart of V8)
# ---------------------------------------------------------------------------
def _fit_one_cohort(net_bps: np.ndarray, actual_smm: np.ndarray,
                     min_events: int = 5) -> tuple[dict, list, dict]:
    """Bin loan-months on net_bps, compute mean actual_SMM per bin, fit the
    4-param sigmoid via weighted least squares.

    Returns:
        params       : {floor, asymp, mid, slope}
        scatter      : [{bin_mid_bp, n, actual_smm, actual_cpr}, ...]
        fit_summary  : {residual_std, fit_quality, asymp_pinned, ...}
    """
    n_total = len(net_bps)
    if actual_smm.sum() < min_events:
        return None, [], {'fit_quality': 'too_few_events',
                          'n': int(n_total), 'n_events': int(actual_smm.sum())}

    # Quantile bins on net_bps; require at least 12 distinct values
    n_bins = min(N_BINS_PER_COHORT, max(3, int(n_total / 200)))
    try:
        bins = pd.qcut(net_bps, n_bins, labels=False, duplicates='drop')
    except ValueError:
        return None, [], {'fit_quality': 'binning_failed', 'n': int(n_total)}

    # Aggregate per bin
    df_bin = pd.DataFrame({'net_bp': net_bps, 'smm': actual_smm, 'bin': bins})
    agg = df_bin.groupby('bin').agg(
        n=('smm', 'size'),
        actual_smm=('smm', 'mean'),
        bin_mid_bp=('net_bp', 'mean'),
    ).reset_index().sort_values('bin_mid_bp').reset_index(drop=True)

    if len(agg) < 4:
        return None, [], {'fit_quality': 'too_few_bins', 'n': int(n_total),
                          'n_bins': int(len(agg))}

    # Fit the sigmoid via curve_fit
    def sigmoid(x, floor, asymp, mid, slope):
        z = -(x - mid) / slope
        z = np.clip(z, -50, 50)
        return floor + asymp / (1 + np.exp(z))

    seed = c8.INITIAL_SIGMOID_SEED
    p0 = [seed['floor'], seed['asymp'], seed['mid'], seed['slope']]
    weights = np.sqrt(agg['n'].values)
    sigma = 1.0 / np.maximum(weights, 1e-9)

    try:
        popt, pcov = curve_fit(
            sigmoid, agg['bin_mid_bp'].values, agg['actual_smm'].values,
            p0=p0, sigma=sigma, bounds=c8.SIGMOID_BOUNDS, maxfev=5000,
        )
    except Exception as exc:
        return None, [], {'fit_quality': f'curve_fit_failed: {exc.__class__.__name__}',
                          'n': int(n_total)}

    floor_v, asymp_v, mid_v, slope_v = popt.tolist()
    params = {'floor': float(floor_v), 'asymp': float(asymp_v),
              'mid':   float(mid_v),   'slope': float(slope_v)}

    # Compute residuals at the bin level
    pred_at_bins = sigmoid(agg['bin_mid_bp'].values, *popt)
    residuals = agg['actual_smm'].values - pred_at_bins
    residual_std = float(np.sqrt(np.average(residuals**2, weights=agg['n'].values)))

    # Pinning checks
    lo_b, hi_b = c8.SIGMOID_BOUNDS
    asymp_pinned = (asymp_v < lo_b[1] + 1e-4) or (asymp_v > hi_b[1] - 1e-4)
    floor_pinned = (floor_v < lo_b[0] + 1e-5) or (floor_v > hi_b[0] - 1e-5)

    quality = 'good'
    if asymp_pinned: quality = 'asymp_pinned'
    elif residual_std > 0.01: quality = 'high_residual'
    elif n_total < 1000: quality = 'low_sample'

    scatter = [
        {'bin_mid_bp': round(float(r['bin_mid_bp']), 1),
         'n': int(r['n']),
         'actual_smm': round(float(r['actual_smm']), 6),
         'actual_cpr': round(float((1 - (1 - r['actual_smm'])**12) * 100), 3)}
        for _, r in agg.iterrows()
    ]
    fit_summary = {
        'fit_quality': quality, 'residual_std': round(residual_std, 6),
        'n': int(n_total), 'n_events': int(actual_smm.sum()),
        'n_bins': int(len(agg)),
        'asymp_pinned': bool(asymp_pinned),
        'floor_pinned': bool(floor_pinned),
    }
    return params, scatter, fit_summary


def fit_all_cohorts(df_train: pd.DataFrame, min_events: int = MIN_EVENTS_PER_COHORT
                     ) -> tuple[dict, dict, dict]:
    """Walk every primary cohort + each fallback level. Fit a sigmoid wherever
    we have ≥ min_events prepay events. The fallback hierarchy ensures every
    loan-month maps to *some* fitted cohort.

    Returns:
        cohort_table     : {cohort_id_or_fallback: {floor, asymp, mid, slope}}
        cohort_diag      : {cohort_id: {scatter, fit_summary, axes, sancap_ref?}}
        global_fit_summary
    """
    feats = features_dict(df_train)
    cohorts = c8.assign_cohort(feats)
    df_train = df_train.assign(_cohort=cohorts)
    smm_actual = df_train['prepaid_voluntary'].astype(float).values

    cohort_table = {}     # populated below
    cohort_diag  = {}     # cohort_id → {scatter, fit_summary, axes}
    seen_keys = set()

    print(f"\nCohort fitting (min_events = {min_events}):")
    print(f"  {'cohort':<28}  {'level':<5}  {'n':>9}  {'events':>7}  {'fit_quality':<14}")

    # Build a canonical list of fallback keys, most-specific first
    primary_cohorts = sorted(set(cohorts))
    levels_for = {0: primary_cohorts,
                  1: sorted({c8.fallback_id(c, 1) for c in primary_cohorts}),
                  2: sorted({c8.fallback_id(c, 2) for c in primary_cohorts}),
                  3: ['GLOBAL']}

    # FIT each cohort that has enough events. We fit at every level so the
    # fallback chain has somewhere to land for sparse cells.
    for level in [0, 1, 2, 3]:
        for fb_key in levels_for[level]:
            if fb_key in cohort_table or fb_key in seen_keys:
                continue
            seen_keys.add(fb_key)
            # Members of this cohort = primary cohorts whose fallback at `level` matches
            if level == 3:
                mask = np.ones(len(df_train), dtype=bool)
            else:
                primary_match = [c for c in primary_cohorts
                                  if c8.fallback_id(c, level) == fb_key]
                mask = df_train['_cohort'].isin(primary_match).values
            sub_net = df_train.loc[mask, 'net_refi_incentive_bps'].values
            sub_smm = smm_actual[mask]
            if sub_smm.sum() < min_events:
                if level < 3: continue
            params, scatter, summary = _fit_one_cohort(sub_net, sub_smm)
            if params is None:
                continue
            cohort_table[fb_key] = params
            # Only record full diagnostics for primary cohorts (level 0)
            if level == 0:
                cohort_diag[fb_key] = {
                    'cohort_id':    fb_key,
                    'level':        0,
                    'axes':         dict(zip(['program', 'purpose', 'size'],
                                              c8.cohort_axes(fb_key))),
                    'params':       params,
                    'scatter':      scatter,
                    **summary,
                }
            print(f"  {fb_key:<28}  {level:<5}  {summary['n']:>9,}  "
                  f"{summary['n_events']:>7,}  {summary['fit_quality']:<14}")

    # Ensure GLOBAL fallback exists no matter what
    if 'GLOBAL' not in cohort_table:
        print("  WARNING: GLOBAL fallback fit failed; using initial seed sigmoid")
        cohort_table['GLOBAL'] = dict(c8.INITIAL_SIGMOID_SEED)

    print(f"\nFitted {len(cohort_table)} cohort/fallback sigmoids "
          f"({sum(1 for k in cohort_table if k in cohort_diag)} primary)")
    return cohort_table, cohort_diag, {}


def build_curve_grids(cohort_table: dict, n_points: int = N_CURVE_GRID_POINTS,
                       net_bp_range: tuple = (-500, 500)) -> dict:
    """For each fitted cohort, evaluate the sigmoid on a smooth grid for the
    dashboard's fitted-curve overlay.
    """
    grids = {}
    xs = np.linspace(net_bp_range[0], net_bp_range[1], n_points)
    for cohort_id, p in cohort_table.items():
        ys_smm = c8.cohort_sigmoid(xs, p)
        ys_cpr = (1 - (1 - ys_smm) ** 12) * 100
        grids[cohort_id] = [
            {'net_bp': round(float(x), 1),
             'pred_smm': round(float(s), 6),
             'pred_cpr': round(float(c), 3)}
            for x, s, c in zip(xs, ys_smm, ys_cpr)
        ]
    return grids


# ---------------------------------------------------------------------------
# Diagnostics builders (parallel to V7's structure)
# ---------------------------------------------------------------------------
def smm_to_cpr(smm):
    return (1 - (1 - np.asarray(smm)) ** 12) * 100


def _predict_for_diag(df: pd.DataFrame, cohort_table: dict, v7_params: dict | None,
                       flavor: str = 'v8b') -> np.ndarray:
    """Predict SMM for a slice of df under V8a or V8b."""
    feats = features_dict(df)
    return c8.predict_smm_v8a(feats, cohort_table) if flavor == 'v8a' \
        else c8.predict_smm_v8b(feats, cohort_table, v7_params)


def build_period_arrays(df, cohort_table, v7_params, flavor):
    pred_smm = _predict_for_diag(df, cohort_table, v7_params, flavor)
    work = df.assign(_pred=pred_smm,
                     _act=df['prepaid_voluntary'].astype(float).values).copy()
    monthly, yearly = [], []
    for per, g in work.groupby('period'):
        a, pr = g['_act'].mean(), g['_pred'].mean()
        monthly.append({'period': str(per), 'n': int(len(g)),
                        'actual_smm': round(a, 7), 'pred_smm': round(pr, 7),
                        'actual_cpr': round(float(smm_to_cpr(a)), 4),
                        'pred_cpr':   round(float(smm_to_cpr(pr)), 4)})
    work['_year'] = work['period'].astype(str).str[:4].astype(int)
    for yr, g in work.groupby('_year'):
        a, pr = g['_act'].mean(), g['_pred'].mean()
        yearly.append({'year': int(yr), 'n': int(len(g)),
                       'actual_smm': round(a, 7), 'pred_smm': round(pr, 7),
                       'actual_cpr': round(float(smm_to_cpr(a)), 4),
                       'pred_cpr':   round(float(smm_to_cpr(pr)), 4)})
    return monthly, yearly


def build_scurve(df, cohort_table, v7_params, flavor):
    pred_smm = _predict_for_diag(df, cohort_table, v7_params, flavor)
    edges = [-1e9, -300, -200, -100, -50, 0, 50, 100, 150, 200, 300, 500, 1e9]
    work = df.assign(_pred=pred_smm,
                     _act=df['prepaid_voluntary'].astype(float).values,
                     _ri=df['gross_refi_incentive_bps']).copy()
    work['_buck'] = pd.cut(work['_ri'], edges, labels=False)
    out = []
    for b, g in work.groupby('_buck'):
        if len(g) == 0: continue
        a, pr = g['_act'].mean(), g['_pred'].mean()
        out.append({'ri_bucket': int(b), 'n': int(len(g)),
                    'ri_mid': round(float(g['_ri'].mean()), 2),
                    'actual_smm': round(a, 7), 'pred_smm': round(pr, 7),
                    'actual_cpr': round(float(smm_to_cpr(a)), 4),
                    'pred_cpr':   round(float(smm_to_cpr(pr)), 4)})
    return out


def build_calibration(p_arr, y_arr, n=10):
    df = pd.DataFrame({'p': p_arr, 'y': y_arr})
    df['_dec'] = pd.qcut(df['p'].rank(method='first'), n, labels=False)
    out = []
    for dec, g in df.groupby('_dec'):
        a, pr = g['y'].mean(), g['p'].mean()
        out.append({'decile': int(dec), 'n': int(len(g)),
                    'pred_smm': round(pr, 7), 'actual_smm': round(a, 7),
                    'pred_cpr': round(float(smm_to_cpr(pr)), 4),
                    'actual_cpr': round(float(smm_to_cpr(a)), 4)})
    return out


def build_cuts(df, key, cohort_table, v7_params, flavor, ordered=False):
    pred_smm = _predict_for_diag(df, cohort_table, v7_params, flavor)
    work = df.assign(_pred=pred_smm,
                     _act=df['prepaid_voluntary'].astype(float).values).copy()
    grouped = work.groupby(key)
    keys = sorted(grouped.groups.keys()) if ordered else list(grouped.groups.keys())
    out = []
    for k in keys:
        g = grouped.get_group(k)
        if len(g) == 0: continue
        a, pr = g['_act'].mean(), g['_pred'].mean()
        out.append({'key': str(k), 'n': int(len(g)),
                    'actual_smm': round(a, 7), 'pred_smm': round(pr, 7),
                    'actual_cpr': round(float(smm_to_cpr(a)), 4),
                    'pred_cpr':   round(float(smm_to_cpr(pr)), 4)})
    return out


def build_bucket_cuts(df, col, edges, labels, cohort_table, v7_params, flavor):
    pred_smm = _predict_for_diag(df, cohort_table, v7_params, flavor)
    work = df.assign(_pred=pred_smm,
                     _act=df['prepaid_voluntary'].astype(float).values).copy()
    work['_b'] = pd.cut(work[col], edges, labels=labels, include_lowest=True)
    out = []
    for lab in labels:
        g = work[work['_b'] == lab]
        if len(g) == 0: continue
        a, pr = g['_act'].mean(), g['_pred'].mean()
        out.append({'key': str(lab), 'n': int(len(g)),
                    'actual_smm': round(a, 7), 'pred_smm': round(pr, 7),
                    'actual_cpr': round(float(smm_to_cpr(a)), 4),
                    'pred_cpr':   round(float(smm_to_cpr(pr)), 4)})
    return out


def build_cohort_cuts(df, cohort_table, v7_params, flavor):
    """Per-cohort actual vs predicted CPR — the V8 analogue of V7's fha_cuts."""
    feats = features_dict(df)
    cohorts = c8.assign_cohort(feats)
    pred_smm = _predict_for_diag(df, cohort_table, v7_params, flavor)
    work = df.assign(_pred=pred_smm,
                     _act=df['prepaid_voluntary'].astype(float).values,
                     _coh=cohorts).copy()
    out = []
    for c, g in work.groupby('_coh'):
        if len(g) == 0: continue
        a, pr = g['_act'].mean(), g['_pred'].mean()
        out.append({'key': str(c), 'n': int(len(g)),
                    'actual_smm': round(a, 7), 'pred_smm': round(pr, 7),
                    'actual_cpr': round(float(smm_to_cpr(a)), 4),
                    'pred_cpr':   round(float(smm_to_cpr(pr)), 4)})
    out.sort(key=lambda r: -r['n'])
    return out


def build_sample_loans_table_v8(df_test: pd.DataFrame, cohort_table: dict,
                                  v7_params: dict, flavor: str = 'v8b',
                                  n: int = 50) -> list:
    """V8 sample-loans table for the dashboard. Mirrors V7's structure but
    swaps the per-multiplier attribution for: cohort_sigmoid contribution
    plus the four V8b structural multipliers (M_age/maturity/lockout/burnout).
    """
    latest = sorted(df_test['period'].astype(str).unique())[-1]
    pool = df_test[df_test['period'].astype(str) == latest].copy()
    if len(pool) < n:
        pool = df_test.copy()
    if len(pool) == 0:
        return []

    feats_pool = features_dict(pool)
    smm_pool = _predict_for_diag(pool, cohort_table, v7_params, flavor)
    cpr_pool = (1 - (1 - smm_pool) ** 12) * 100
    pool = pool.assign(_cpr=cpr_pool, _cohort=c8.assign_cohort(feats_pool)).reset_index(drop=True)
    pool['_dec'] = pd.qcut(pool['_cpr'].rank(method='first'), 10, labels=False, duplicates='drop')

    per_dec = max(1, n // 10)
    rng = np.random.default_rng(SEED)
    chunks = []
    for dec in sorted(pool['_dec'].dropna().unique()):
        sub = pool[pool['_dec'] == dec]
        take_idx = rng.choice(len(sub), size=min(per_dec, len(sub)), replace=False)
        chunks.append(sub.iloc[take_idx])
    sample = pd.concat(chunks).reset_index(drop=True).head(n)

    feats = features_dict(sample)
    smm = _predict_for_diag(sample, cohort_table, v7_params, flavor)
    cpr = (1 - (1 - smm) ** 12) * 100

    # Per-row decomposition: cohort_sigmoid (the "rate" component) +
    # M_age, M_maturity, M_lockout, M_burnout (V8b only)
    cohorts_assigned = c8.assign_cohort(feats)
    p_per_row = c8._lookup_sigmoid_params(cohorts_assigned, cohort_table)
    cohort_smm = c8.cohort_sigmoid(feats['net_refi_incentive_bps'], p_per_row)
    if flavor == 'v8b':
        m_age = v7m.m_age(feats['loan_age_months'], v7_params['M_age'])
        m_mat = v7m.m_maturity(feats['months_to_maturity'], v7_params['M_maturity'])
        m_lck = v7m.m_lockout(feats['months_since_lockout_end'], v7_params['M_lockout'])
        m_brn = v7m.m_burnout(feats['burn_ratio'], v7_params['M_burnout'])
    else:
        m_age = m_mat = m_lck = m_brn = np.ones_like(cohort_smm)

    # Use a simple log-attribution decomposition for the dashboard's color cells
    out = []
    for i in range(len(sample)):
        row = sample.iloc[i]
        cohort_cpr = float((1 - (1 - cohort_smm[i]) ** 12) * 100)
        log_components = {
            'cohort_sigmoid': math.log(max(float(cohort_smm[i]) /
                                            max(float(cohort_smm[i]) /
                                                max(float(cohort_smm[i]), 1e-12), 1.0), 1e-12)),
            'M_age':      math.log(max(float(m_age[i]), 1e-9)),
            'M_maturity': math.log(max(float(m_mat[i]), 1e-9)),
            'M_lockout':  math.log(max(float(m_lck[i]), 1e-9)),
            'M_burnout':  math.log(max(float(m_brn[i]), 1e-9)),
        }
        # Attribution: cohort_sigmoid takes the (cohort_cpr - global_baseline)
        # component, and each multiplier takes its log share of (pred - cohort).
        global_cpr = (1 - (1 - 0.0078) ** 12) * 100   # ≈ panel mean
        cohort_attr = cohort_cpr - global_cpr
        post_cohort_gap = float(cpr[i]) - cohort_cpr
        sum_log_mults = (log_components['M_age'] + log_components['M_maturity']
                          + log_components['M_lockout'] + log_components['M_burnout'])
        mult_attr = {}
        if abs(sum_log_mults) > 1e-9:
            for k in ['M_age', 'M_maturity', 'M_lockout', 'M_burnout']:
                mult_attr[k] = round(log_components[k] / sum_log_mults * post_cohort_gap, 4)
        else:
            for k in ['M_age', 'M_maturity', 'M_lockout', 'M_burnout']:
                mult_attr[k] = 0.0

        def yyyymm(v):
            try:
                s = str(int(float(v))).strip()
                if len(s) >= 6 and s[:4].isdigit() and s[4:6].isdigit():
                    return f"{s[:4]}-{s[4:6]}"
            except (TypeError, ValueError):
                pass
            return ''

        prepay_desc = str(row.get('prepay_desc', '') or '').strip()
        if len(prepay_desc) > 22:
            prepay_desc = prepay_desc[:22] + '…'

        out.append({
            'loan_id':       str(row['loan_id'])[-12:],
            'pool_cusip':    str(row.get('pool_cusip', ''))[:9],
            'period':        str(row['period']),
            'cohort_id':     str(row['_cohort']),
            'fha_category':  str(row.get('fha_category', '')),
            'loan_purpose':  str(row.get('loan_purpose', '')),
            'issuer':        str(row.get('issuer_name', ''))[:18],
            'state':         str(row.get('property_state', ''))[:2],
            'num_units':     int(row['num_units']) if pd.notna(row.get('num_units')) else None,
            'coupon_pct':    round(float(row['loan_rate']), 3) if pd.notna(row.get('loan_rate')) else None,
            'plc_pct':       round(float(row['plc_rate_bps']) / 100, 3)
                              if pd.notna(row.get('plc_rate_bps')) else None,
            'vintage':       int(row['vintage_year']) if pd.notna(row.get('vintage_year')) else None,
            'origination':   yyyymm(row.get('origination_date')),
            'maturity_date': yyyymm(row.get('loan_maturity_date')),
            'orig_term_mo':  int(row['loan_term']) if pd.notna(row.get('loan_term')) else None,
            'orig_upb_M':    round(float(row['upb_at_issuance']) / 1e6, 2)
                              if pd.notna(row.get('upb_at_issuance')) else None,
            'upb_M':         round(float(row['upb']) / 1e6, 2),
            'lockout_yrs':   int(row['lockout_term_yrs']) if pd.notna(row.get('lockout_term_yrs')) else 0,
            'prepay_yrs':    int(row['prepay_premium_period_yrs'])
                              if pd.notna(row.get('prepay_premium_period_yrs')) else 0,
            'lockout_end':   yyyymm(row.get('lockout_end_date')),
            'prepay_end':    yyyymm(row.get('prepay_end_date')),
            'prepay_desc':   prepay_desc,
            'age':           int(round(float(row['loan_age_months']))),
            'mtm':           int(round(float(row['months_to_maturity']))),
            'msle':          int(round(float(row['months_since_lockout_end']))),
            'burn_ratio':    round(float(row['burn_ratio']), 3),
            'grf_bps':       round(float(row['gross_refi_incentive_bps']), 0),
            'ppp':           round(float(row['prepay_penalty_points']), 1),
            'net_refi_bps':  round(float(row['net_refi_incentive_bps']), 0),
            'cohort_smm':    round(float(cohort_smm[i]), 6),
            'cohort_cpr':    round(cohort_cpr, 2),
            'pred_smm':      round(float(smm[i]), 6),
            'pred_cpr':      round(float(cpr[i]), 2),
            'actual_prepay': int(row['prepaid_voluntary']),
            'multipliers':   {
                'M_age':      round(float(m_age[i]), 4),
                'M_maturity': round(float(m_mat[i]), 4),
                'M_lockout':  round(float(m_lck[i]), 4),
                'M_burnout':  round(float(m_brn[i]), 4),
            },
            'attribution':   mult_attr,
        })
    return out


def build_comparison_to_v7(v7_path: Path, v8_test_auc, v8_test_logloss,
                             v8_yearly, v8_cal):
    if not v7_path.exists():
        return {'available': False}
    v7 = json.load(open(v7_path))
    out = {
        'available': True,
        'v7_test_auc':       v7['metadata']['test_auc'],
        'v8_test_auc':       v8_test_auc,
        'auc_delta':         round(v8_test_auc - v7['metadata']['test_auc'], 4),
        'v7_log_loss':       v7['metadata']['test_log_loss'],
        'v8_log_loss':       v8_test_logloss,
        'log_loss_delta':    round(v8_test_logloss - v7['metadata']['test_log_loss'], 5),
    }
    v7_year_map = {y['year']: y for y in v7.get('yearly', [])}
    out['yearly_compare'] = []
    for yr in v8_yearly:
        ye = v7_year_map.get(yr['year'], {})
        out['yearly_compare'].append({'year': yr['year'], 'n': yr['n'],
                                       'actual_cpr': yr['actual_cpr'],
                                       'v7_pred_cpr': ye.get('pred_cpr'),
                                       'v8_pred_cpr': yr['pred_cpr']})
    out['calibration_compare'] = []
    v7_cal = v7.get('calibration', [])
    for i, cv in enumerate(v8_cal):
        cv7 = v7_cal[i] if i < len(v7_cal) else {}
        out['calibration_compare'].append({'decile': cv['decile'],
                                            'v7_pred_cpr':   cv7.get('pred_cpr'),
                                            'v7_actual_cpr': cv7.get('actual_cpr'),
                                            'v8_pred_cpr':    cv['pred_cpr'],
                                            'v8_actual_cpr':  cv['actual_cpr']})
    return out


# ---------------------------------------------------------------------------
# SanCap per-cohort match (Layer 3 verification — informational here, hard in validate_v8.py)
# ---------------------------------------------------------------------------
def sancap_per_cohort_match(cohort_table: dict, v7_params: dict) -> list:
    """Map each SanCap reference scenario to a V8 cohort and check the fit."""
    scenarios = [
        # (label, prog, purp, upb, grf, ppp, age, mtm, br, msle, sancap_cpr)
        ('ATM, avg-pen, 5M / 223f / RP',     '223f', 'RP', 5e6, 0,    5, 60, 300, 0.2, 0, 20),
        ('+50bp, 5M / 223f / RP',            '223f', 'RP', 5e6, 50,   5, 60, 300, 0.2, 0, 35),
        ('+100bp, 5M / 223f / RP',           '223f', 'RP', 5e6, 100,  5, 60, 300, 0.2, 0, 45),
        ('+100bp 7%pen, 5M / 223f / RP',     '223f', 'RP', 5e6, 100,  7, 60, 300, 0.2, 0, 30),
        ('+100bp 9%pen, 5M / 223f / RP',     '223f', 'RP', 5e6, 100,  9, 60, 300, 0.2, 0, 18),
        ('$15M @ +50bp / 223f / RP',         '223f', 'RP', 15e6, 50,  5, 60, 300, 0.2, 0, 40),
        ('NC @ +100bp age 30m / 232 / NC',   '232',  'NC', 5e6, 100,  5, 30, 300, 0.2, 0, 70),
        ('Rural-538 @ +100bp / RP',          '538',  'RP', 5e6, 100,  5, 60, 300, 0.2, 0, 10),
        ('HC-232 @ +100bp / RP',             '232',  'RP', 5e6, 100,  5, 60, 300, 0.2, 0, 30),
    ]
    out = []
    for label, prog, purp, upb, grf, ppp, age, mtm, br, msle, sancap_cpr in scenarios:
        net_refi = float(grf) - 12.5 * (float(ppp) + 1)
        feats = {
            'loan_age_months':          np.array([float(age)]),
            'net_refi_incentive_bps':   np.array([net_refi]),
            'log_upb':                  np.array([float(np.log1p(upb))]),
            'fha_category':             np.array([prog]),
            'loan_purpose':             np.array([purp]),
            'upb':                      np.array([float(upb)]),
            'months_since_lockout_end': np.array([float(msle)]),
            'months_to_maturity':       np.array([float(mtm)]),
            'burn_ratio':               np.array([float(br)]),
        }
        cohort_assigned = c8.assign_cohort(feats)[0]
        smm = c8.predict_smm_v8b(feats, cohort_table, v7_params)[0]
        cpr = float(smm_to_cpr(smm))
        diverge = abs(cpr - sancap_cpr)
        out.append({'scenario': label, 'cohort': cohort_assigned,
                    'sancap_cpr': sancap_cpr,
                    'v8_pred_cpr': round(cpr, 2),
                    'divergence_pp': round(diverge, 2),
                    'flag': 'REVIEW' if diverge > 10 else 'ok'})
    return out


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--emit-dashboard',      action='store_true')
    parser.add_argument('--only-emit-dashboard', action='store_true')
    parser.add_argument('--flavor', choices=['v8a', 'v8b'], default='v8b',
                        help='Production flavor: V8a pure cohort, V8b cohort × multipliers')
    args = parser.parse_args()

    if args.only_emit_dashboard:
        if not OUT_JSON.exists():
            sys.exit(f"ERROR: {OUT_JSON} not found - train first.")
        emit_dashboard(json.load(open(OUT_JSON)))
        return

    if not PANEL_PATH.exists():
        sys.exit(f"ERROR: panel parquet not found at {PANEL_PATH}")

    df, last_period = load_panel(PANEL_PATH)
    df = derive_features(df)
    is_train, is_test = train_split(df)
    df_train = df[is_train].copy()
    df_test  = df[is_test].copy()
    print(f"  Train rows: {len(df_train):,}  events: {int(df_train['prepaid_voluntary'].sum()):,}")
    print(f"  Test  rows: {len(df_test):,}  events: {int(df_test['prepaid_voluntary'].sum()):,}")

    # Fit per-cohort sigmoids
    cohort_table, cohort_diag, _ = fit_all_cohorts(df_train, MIN_EVENTS_PER_COHORT)
    cohort_curve_grids = build_curve_grids(cohort_table)

    # Pull V7's structural multipliers (for V8b)
    v7_md = json.load(open(V7_JSON)) if V7_JSON.exists() else None
    if v7_md is None:
        sys.exit(f"ERROR: V8b requires {V7_JSON}; run train_v7.py first")
    v7_params = v7_md['multipliers']

    # Predict on test fold
    flavor = args.flavor
    pred_test = _predict_for_diag(df_test, cohort_table, v7_params, flavor)
    y_test = df_test['prepaid_voluntary'].astype(float).values
    auc = roc_auc_score(y_test, pred_test) if y_test.sum() > 0 else float('nan')
    ll = log_loss(y_test, np.clip(pred_test, 1e-9, 1 - 1e-9))
    print(f"\nFinal V8 ({flavor}): test AUC={auc:.4f}  test log_loss={ll:.5f}")

    # Tail-blowup check on full panel
    pred_full = _predict_for_diag(df, cohort_table, v7_params, flavor)
    cpr_full = smm_to_cpr(pred_full)
    max_cpr = float(cpr_full.max())
    n_above_90 = int((cpr_full > 90).sum())
    n_above_75 = int((cpr_full > 75).sum())
    print(f"Tail-blowup check: max(pred_CPR full panel) = {max_cpr:.2f}%  "
          f"(n>90% = {n_above_90}; n>75% = {n_above_75})")

    # SanCap per-cohort
    sancap = sancap_per_cohort_match(cohort_table, v7_params)
    n_review = sum(1 for s in sancap if s['flag'] == 'REVIEW')
    print(f"\nSanCap per-cohort match ({n_review}/{len(sancap)} flagged):")
    for s in sancap:
        print(f"  {'⚠' if s['flag']=='REVIEW' else ' '} {s['scenario']:<35}  "
              f"cohort={s['cohort']:<22}  SanCap={s['sancap_cpr']:>3} CPR  "
              f"V8={s['v8_pred_cpr']:>5.1f}  Δ={s['divergence_pp']:>5.1f}pp")

    # Diagnostic builders
    monthly, yearly = build_period_arrays(df_test, cohort_table, v7_params, flavor)
    scurve = build_scurve(df_test, cohort_table, v7_params, flavor)
    cal = build_calibration(pred_test, y_test)
    cohort_cuts = build_cohort_cuts(df_test, cohort_table, v7_params, flavor)
    fha_cuts = build_cuts(df_test, 'fha_category', cohort_table, v7_params, flavor)
    lp_cuts  = build_cuts(df_test, 'loan_purpose',  cohort_table, v7_params, flavor)
    age_cuts = build_bucket_cuts(df_test, 'loan_age_months',
                                 [-1, 12, 36, 60, 120, 180, 1e9],
                                 ['0-12m','12-36m','36-60m','60-120m','120-180m','180m+'],
                                 cohort_table, v7_params, flavor)
    mtm_cuts = build_bucket_cuts(df_test, 'months_to_maturity',
                                 [-1, 12, 24, 36, 60, 120, 1e9],
                                 ['0-12m','12-24m','24-36m','36-60m','60-120m','120m+'],
                                 cohort_table, v7_params, flavor)
    size_cuts = build_bucket_cuts(df_test, 'upb',
                                   [-1, 2e6, 5e6, 10e6, 25e6, 50e6, 1e10],
                                   ['<2M','2-5M','5-10M','10-25M','25-50M','50M+'],
                                   cohort_table, v7_params, flavor)
    sample_loans = build_sample_loans_table_v8(df_test, cohort_table, v7_params, flavor, n=50)
    comparison = build_comparison_to_v7(V7_JSON, auc, ll, yearly, cal)

    panel_actual_smm = float(df_train['prepaid_voluntary'].mean())
    artifact = {
        'metadata': {
            'training_pop_n':   int(is_train.sum()),
            'training_events':  int(y_test.sum() + df_train['prepaid_voluntary'].sum()),
            'flavor':           flavor,
            'panel_actual_smm': round(panel_actual_smm, 7),
            'panel_actual_cpr': round(float(smm_to_cpr(panel_actual_smm)), 4),
            'n_cohorts_fit':    len(cohort_diag),
            'n_fallback_levels':sum(1 for k in cohort_table if k not in cohort_diag),
            'min_events_per_cohort': MIN_EVENTS_PER_COHORT,
            'test_auc':         round(float(auc), 7),
            'test_log_loss':    round(float(ll), 7),
            'period_range':     [str(df['period'].min()), str(df['period'].max())],
            'last_period':      last_period,
            'model_version':    'v8',
            'description':      f'V8 cohort-based S-curve model ({flavor})',
            'max_cpr_full_panel': round(max_cpr, 2),
            'n_above_90_cpr':   n_above_90,
            'n_above_75_cpr':   n_above_75,
            'smm_cap':          c8.SMM_CAP_DEFAULT,
        },
        'cohort_table':         cohort_table,
        'cohort_definitions':   list(cohort_diag.values()),
        'cohort_curve_grids':   cohort_curve_grids,
        'v7_structural_params': {k: v7_params[k] for k in ['M_age', 'M_maturity', 'M_lockout', 'M_burnout']
                                  if k in v7_params},
        'monthly': monthly, 'yearly': yearly, 'scurve': scurve,
        'calibration': cal,
        'cohort_cuts': cohort_cuts,
        'fha_cuts': fha_cuts, 'lp_cuts': lp_cuts,
        'age_cuts': age_cuts, 'mtm_cuts': mtm_cuts, 'size_cuts': size_cuts,
        'sample_loans': sample_loans,
        'sancap_benchmarks': sancap,
        'comparison_to_v7': comparison,
    }

    OUT_JSON.write_text(json.dumps(artifact, indent=1, default=str))
    print(f"\nWrote {OUT_JSON}  ({OUT_JSON.stat().st_size / 1024:.1f} KB)")

    if args.emit_dashboard:
        emit_dashboard(artifact)


def emit_dashboard(v8_artifact: dict):
    if not DASHBOARD.exists():
        print(f"  Skipping --emit-dashboard: {DASHBOARD} not yet present")
        return
    src = DASHBOARD.read_text()
    v7 = json.load(open(V7_JSON)) if V7_JSON.exists() else {}
    v8_repl = f'/* __MODEL_DATA_V8__ */ const MODEL_DATA_V8 = {json.dumps(v8_artifact)};'
    v7_repl = f'/* __MODEL_DATA_V7__ */ const MODEL_DATA_V7 = {json.dumps(v7)};'
    new = re.sub(r'/\* __MODEL_DATA_V8__ \*/[^;]*?;', lambda _: v8_repl, src,
                  count=1, flags=re.DOTALL)
    new = re.sub(r'/\* __MODEL_DATA_V7__ \*/[^;]*?;', lambda _: v7_repl, new,
                  count=1, flags=re.DOTALL)
    DASHBOARD.write_text(new)
    print(f"  Re-templated {DASHBOARD} ({len(new)/1024:.1f} KB)")


if __name__ == '__main__':
    main()
