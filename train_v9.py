"""
V9 cohort-based S-curve voluntary prepayment model — training pipeline.

V9 enhancements vs V8.1:
  R1. Richards 5-parameter S-curve (asymmetric)
  R2. Per-cohort min/max bounds (program-class informed)
  R3. Refit M_maturity, M_lockout with widened amplitude bounds
      (V7's training is left frozen; V9 refits these on V9-cohort residuals)
  R5. Re-anchor age_ramp at cohort median age (Case B with cohort-specific a₀)
"""
from __future__ import annotations
import argparse, copy, json, math, os, re, sys, warnings
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.optimize import curve_fit, minimize
from sklearn.metrics import roc_auc_score, log_loss

import cohort_v9 as c9
import v7_multipliers as v7m

warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=RuntimeWarning)

HERE = Path(__file__).resolve().parent
PANEL_PATH = Path(os.environ.get('GNMA_PANEL_PARQUET',
                                  HERE / 'working' / 'gnma_mf_panel.parquet'))
OUT_JSON = HERE / 'model_data_v9.json'
V8_JSON = HERE / 'model_data_v8.json'
V7_JSON = HERE / 'model_data_v7.json'
DASHBOARD = HERE / 'v9_dashboard.jsx'
SEED = 42
MIN_EVENTS_PER_COHORT = 100
N_BINS_PER_COHORT = 12
N_CURVE_GRID_POINTS = 50


# ===========================================================================
# Panel loading (same as V8.1; copy not import to keep V8 frozen)
# ===========================================================================
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
    print(f"  Filtered: {len(df):,}  (-{pre - len(df):,})")
    return df, last_period


def derive_features(df: pd.DataFrame) -> pd.DataFrame:
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
    df.drop(columns=['_itm'], inplace=True)
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
    feat_cols = ['loan_age_months', 'net_refi_incentive_bps', 'log_upb',
                 'months_since_lockout_end', 'months_to_maturity', 'burn_ratio']
    nans = df[feat_cols].isna().any(axis=1)
    if nans.any():
        df = df[~nans].copy()
    print(f"  Final training-eligible rows: {len(df):,}")
    return df


def features_dict(df: pd.DataFrame) -> dict:
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


def train_split(df: pd.DataFrame, seed: int = SEED):
    loans = df['loan_id'].unique()
    rng = np.random.default_rng(seed)
    shuf = rng.permutation(loans)
    cut = int(0.8 * len(shuf))
    train_loans = set(shuf[:cut])
    is_train = df['loan_id'].isin(train_loans).values
    return is_train, ~is_train


# ===========================================================================
# Per-cohort joint fit: Richards sigmoid + age ramp
#   R1: Richards 5-param shape (vs V8.1's 4-param)
#   R2: Per-cohort bounds via cohort_v9.get_bounds_for()
#   R5: Anchor age_ramp at cohort median age (vs V8.1's fixed knot[2]=96m)
# ===========================================================================
def _richards(x, floor, asymp, mid, slope, asym_factor):
    """5-param Richards function. Mirrors cohort_v9.cohort_sigmoid."""
    z = np.clip(-(x - mid) / slope, -50, 50)
    base = 1.0 + np.exp(z)
    return floor + asymp * base ** (-1.0 / max(asym_factor, 1e-3))


def _fit_age_ramp_at_median(ages: np.ndarray, residual_ratio: np.ndarray,
                              median_age: float, weights: np.ndarray | None = None) -> list:
    """R5: fit knot heights, then normalize so ramp(median_age) = 1.0.

    The cohort's sigmoid params then describe the rate response at the
    cohort's TYPICAL age, not at a global 96m anchor.
    """
    knots_x = c9.AGE_RAMP_KNOTS_X
    knots_y = list(c9.AGE_RAMP_INITIAL_Y.copy())
    if weights is None:
        weights = np.ones_like(residual_ratio)

    # Bucket each age to its nearest knot; weighted-mean residual ratio
    nearest = np.argmin(np.abs(ages[:, None] - knots_x[None, :]), axis=1)
    for k in range(len(knots_x)):
        mask = nearest == k
        if mask.sum() < 50:
            continue
        knots_y[k] = float(np.clip(
            np.average(residual_ratio[mask], weights=weights[mask]), 0.05, 5.0))

    # R5: normalize at the cohort's MEDIAN age (vs V8.1's fixed knot[2])
    ramp_at_median = float(np.interp(median_age, knots_x, knots_y))
    if ramp_at_median > 1e-6:
        knots_y = [float(y / ramp_at_median) for y in knots_y]
    return knots_y


def _fit_one_cohort_v9(cohort_id: str, ages: np.ndarray, net_bps: np.ndarray,
                        actual_smm: np.ndarray, n_iters: int = 3) -> tuple:
    """Joint fit: Richards sigmoid + age_ramp via iterative refinement.
    Bounds come from cohort_v9.get_bounds_for(cohort_id).
    """
    n_total = len(net_bps)
    if actual_smm.sum() < 5:
        return None, [], [], {'fit_quality': 'too_few_events',
                               'n': int(n_total), 'n_events': int(actual_smm.sum())}

    median_age = float(np.median(ages))
    age_knots_y = list(c9.AGE_RAMP_INITIAL_Y.copy())
    sig_params = None
    sig_residual_std = None
    sig_agg = None

    bounds_lo, bounds_hi = c9.get_bounds_for(cohort_id)

    for it in range(n_iters):
        # Step A: divide actual_smm by current ramp(age), then fit Richards
        ramp_per_row = np.interp(ages, c9.AGE_RAMP_KNOTS_X, age_knots_y,
                                  left=age_knots_y[0], right=age_knots_y[-1])
        adj_smm = actual_smm / np.maximum(ramp_per_row, 1e-3)

        n_bins = min(N_BINS_PER_COHORT, max(3, int(n_total / 200)))
        try:
            bins = pd.qcut(net_bps, n_bins, labels=False, duplicates='drop')
        except ValueError:
            return None, [], [], {'fit_quality': 'binning_failed', 'n': int(n_total)}
        agg = (pd.DataFrame({'net_bp': net_bps, 'smm': adj_smm, 'bin': bins})
                 .groupby('bin').agg(n=('smm', 'size'),
                                       actual_smm=('smm', 'mean'),
                                       bin_mid_bp=('net_bp', 'mean'))
                 .reset_index().sort_values('bin_mid_bp').reset_index(drop=True))
        if len(agg) < 5:                        # 5 free params now → need ≥5 bins
            return None, [], [], {'fit_quality': 'too_few_bins',
                                    'n': int(n_total), 'n_bins': int(len(agg))}

        seed = (c9.INITIAL_SIGMOID_SEED if sig_params is None else sig_params)
        p0 = [seed['floor'], seed['asymp'], seed['mid'], seed['slope'],
              seed.get('asym_factor', 1.0)]
        # Clip seed into the cohort's allowed range
        p0 = [max(lo, min(p, hi)) for p, lo, hi in zip(p0, bounds_lo, bounds_hi)]
        sigma = 1.0 / np.maximum(np.sqrt(agg['n'].values), 1e-9)
        try:
            popt, _ = curve_fit(_richards,
                                 agg['bin_mid_bp'].values,
                                 agg['actual_smm'].values,
                                 p0=p0, sigma=sigma,
                                 bounds=(bounds_lo, bounds_hi),
                                 maxfev=5000)
        except Exception as exc:
            return None, [], [], {'fit_quality': f'sigmoid_failed: {exc.__class__.__name__}',
                                    'n': int(n_total)}
        sig_params = {'floor': float(popt[0]), 'asymp': float(popt[1]),
                      'mid':   float(popt[2]), 'slope': float(popt[3]),
                      'asym_factor': float(popt[4])}
        sig_agg = agg.copy()
        pred_at_bins = _richards(agg['bin_mid_bp'].values, *popt)
        sig_residual_std = float(np.sqrt(np.average(
            (agg['actual_smm'].values - pred_at_bins) ** 2,
            weights=agg['n'].values)))

        # Step B: divide actual_smm by sigmoid, then fit ramp anchored at median age
        sig_per_row = _richards(net_bps, *popt)
        residual_ratio = actual_smm / np.maximum(sig_per_row, 1e-9)
        age_knots_y = _fit_age_ramp_at_median(ages, residual_ratio, median_age,
                                                weights=np.ones_like(residual_ratio))

    # Final params + scatter
    params = {**sig_params,
              'age_knots_y': [float(y) for y in age_knots_y],
              'median_age': float(median_age)}

    # Sigmoid scatter (rate-bins on age-adjusted SMM)
    sig_scatter = [
        {'bin_mid_bp': round(float(r['bin_mid_bp']), 1),
         'n': int(r['n']),
         'actual_smm': round(float(r['actual_smm']), 6),
         'actual_cpr': round(float((1 - (1 - r['actual_smm']) ** 12) * 100), 3)}
        for _, r in sig_agg.iterrows()
    ]

    # Age-ramp scatter (age-bins on rate-adjusted SMM)
    sig_per_row = _richards(net_bps, *[sig_params[k] for k in
                                         ['floor', 'asymp', 'mid', 'slope', 'asym_factor']])
    residual_ratio = actual_smm / np.maximum(sig_per_row, 1e-9)
    n_age_bins = min(8, max(3, int(n_total / 1000)))
    try:
        a_bins = pd.qcut(ages, n_age_bins, labels=False, duplicates='drop')
        a_agg = (pd.DataFrame({'age': ages, 'rr': residual_ratio,
                                 'smm': actual_smm, 'bin': a_bins})
                   .groupby('bin').agg(n=('age', 'size'),
                                         bin_mid_age=('age', 'mean'),
                                         ramp_y=('rr', 'mean'),
                                         actual_smm=('smm', 'mean'))
                   .reset_index().sort_values('bin_mid_age').reset_index(drop=True))
        age_scatter = [
            {'bin_mid_age': round(float(r['bin_mid_age']), 1),
             'n': int(r['n']),
             'ramp_y': round(float(r['ramp_y']), 4),
             'actual_smm': round(float(r['actual_smm']), 6),
             'actual_cpr': round(float((1 - (1 - r['actual_smm']) ** 12) * 100), 3)}
            for _, r in a_agg.iterrows()
        ]
    except (ValueError, IndexError):
        age_scatter = []

    # Boundary checks (R2: per-cohort bounds)
    asymp_pinned = (sig_params['asymp'] > bounds_hi[1] - 1e-4)
    floor_pinned = (sig_params['floor'] > bounds_hi[0] - 1e-5)
    asym_pinned  = (sig_params['asym_factor'] < bounds_lo[4] + 1e-3) or \
                   (sig_params['asym_factor'] > bounds_hi[4] - 1e-3)
    quality = 'good'
    if asymp_pinned: quality = 'asymp_pinned'
    elif sig_residual_std > 0.01: quality = 'high_residual'
    elif n_total < 1000: quality = 'low_sample'

    fit_summary = {
        'fit_quality': quality, 'residual_std': round(sig_residual_std, 6),
        'n': int(n_total), 'n_events': int(actual_smm.sum()),
        'n_bins': int(len(sig_agg)), 'n_iters': int(n_iters),
        'asymp_pinned': bool(asymp_pinned),
        'floor_pinned': bool(floor_pinned),
        'asym_pinned':  bool(asym_pinned),
        'median_age':   round(median_age, 1),
    }
    return params, sig_scatter, age_scatter, fit_summary


def fit_all_cohorts(df_train: pd.DataFrame, min_events: int = MIN_EVENTS_PER_COHORT):
    feats = features_dict(df_train)
    cohorts = c9.assign_cohort(feats)
    df_train = df_train.assign(_cohort=cohorts)
    smm_actual = df_train['prepaid_voluntary'].astype(float).values
    age_arr = df_train['loan_age_months'].values

    cohort_table = {}
    cohort_diag  = {}
    seen_keys = set()

    print(f"\nCohort fitting (min_events = {min_events}):")
    print(f"  {'cohort':<35}  {'level':<5}  {'n':>9}  {'events':>7}  {'med_age':>7}  {'fit':<14}")

    primary_cohorts = sorted(set(cohorts))
    levels_for = {
        0: primary_cohorts,
        1: sorted({c9.fallback_id(c, 1) for c in primary_cohorts}),
        2: sorted({c9.fallback_id(c, 2) for c in primary_cohorts}),
        3: sorted({c9.fallback_id(c, 3) for c in primary_cohorts}),
        4: ['GLOBAL'],
    }

    for level in [0, 1, 2, 3, 4]:
        for fb_key in levels_for[level]:
            if fb_key in cohort_table or fb_key in seen_keys:
                continue
            seen_keys.add(fb_key)
            if level == 4:
                mask = np.ones(len(df_train), dtype=bool)
            else:
                primary_match = [c for c in primary_cohorts
                                  if c9.fallback_id(c, level) == fb_key]
                mask = df_train['_cohort'].isin(primary_match).values
            sub_age = age_arr[mask]
            sub_net = df_train.loc[mask, 'net_refi_incentive_bps'].values
            sub_smm = smm_actual[mask]
            if sub_smm.sum() < min_events and level < 4:
                continue
            params, sig_scatter, age_scatter, summary = _fit_one_cohort_v9(
                fb_key, sub_age, sub_net, sub_smm)
            if params is None:
                continue
            cohort_table[fb_key] = params
            if level == 0:
                axes = dict(zip(['program', 'purpose', 'size', 'age_bucket'],
                                  c9.cohort_axes(fb_key)))
                cohort_diag[fb_key] = {
                    'cohort_id':    fb_key,
                    'level':        0,
                    'axes':         axes,
                    'params':       params,
                    'scatter':      sig_scatter,
                    'age_scatter':  age_scatter,
                    **summary,
                }
            print(f"  {fb_key:<35}  {level:<5}  {summary['n']:>9,}  "
                  f"{summary['n_events']:>7,}  {summary['median_age']:>7.1f}  "
                  f"{summary['fit_quality']:<14}")

    if 'GLOBAL' not in cohort_table:
        print("  WARNING: GLOBAL fallback fit failed; using initial seeds")
        cohort_table['GLOBAL'] = {**c9.INITIAL_SIGMOID_SEED,
                                   'age_knots_y': c9.AGE_RAMP_INITIAL_Y.tolist(),
                                   'median_age': 96.0}

    print(f"\nFitted {len(cohort_table)} cohort/fallback fits "
          f"({sum(1 for k in cohort_table if k in cohort_diag)} primary)")
    return cohort_table, cohort_diag


# ===========================================================================
# R3: Refit M_maturity, M_lockout (and M_burnout) on V9 cohort residuals
#     with WIDER bounds than V7 used.
# ===========================================================================
def fit_v9_structural(df_train: pd.DataFrame, cohort_table: dict) -> dict:
    """V9 refit of M_maturity / M_lockout / M_burnout via Bernoulli MLE on
    actual SMM after dividing out the V9 cohort prediction.

    R3: amplitude bounds widened (M_lockout 4→8; M_maturity 8→16). M_burnout
    bounds unchanged (slope is 'free' anyway).
    """
    print("\nR3: Refit V9 structural multipliers on cohort residuals...")
    feats = features_dict(df_train)
    y = df_train['prepaid_voluntary'].astype(float).values
    cohort_pred = c9.predict_smm_v9a(feats, cohort_table, smm_cap=1.0)

    sample_weights = np.ones_like(y)
    msle = feats['months_since_lockout_end']
    sample_weights[(msle > 0) & (msle <= 12)] = 50.0          # post-lockout up-weight (V7 R5)

    # ----- M_maturity (R3: amplitude 0..16; was 0..8) -----
    def mat_nll(params):
        amp, cutoff = float(params[0]), float(params[1])
        amp = max(0.0, min(16.0, amp))                         # widened
        cutoff = max(1.0, min(60.0, cutoff))
        m_mat = v7m.m_maturity(feats['months_to_maturity'],
                                {'amplitude': amp, 'cutoff': cutoff})
        smm = np.clip(cohort_pred * m_mat, 1e-9, 1 - 1e-9)
        ll = sample_weights * (y * np.log(smm) + (1 - y) * np.log(1 - smm))
        return -ll.sum()
    r_mat = minimize(mat_nll, x0=[3.0, 24.0], method='Nelder-Mead',
                      options={'maxiter': 200, 'xatol': 0.01})
    M_maturity = {'amplitude': float(np.clip(r_mat.x[0], 0, 16)),
                   'cutoff':    float(np.clip(r_mat.x[1], 1, 60))}
    print(f"  M_maturity: amplitude={M_maturity['amplitude']:.3f}  cutoff={M_maturity['cutoff']:.1f}m")

    # Apply M_maturity, then fit M_lockout
    m_mat_full = v7m.m_maturity(feats['months_to_maturity'], M_maturity)
    cohort_mat = cohort_pred * m_mat_full

    # ----- M_lockout (R3: amplitude 0..8; was 0..4) -----
    def lck_nll(params):
        amp, tau = float(params[0]), float(params[1])
        amp = max(0.0, min(8.0, amp))                          # widened
        tau = max(0.5, min(24.0, tau))
        m_lck = v7m.m_lockout(feats['months_since_lockout_end'],
                                {'amplitude': amp, 'tau': tau})
        smm = np.clip(cohort_mat * m_lck, 1e-9, 1 - 1e-9)
        ll = sample_weights * (y * np.log(smm) + (1 - y) * np.log(1 - smm))
        return -ll.sum()
    r_lck = minimize(lck_nll, x0=[2.0, 4.0], method='Nelder-Mead',
                      options={'maxiter': 200, 'xatol': 0.01})
    M_lockout = {'amplitude': float(np.clip(r_lck.x[0], 0, 8)),
                  'tau':       float(np.clip(r_lck.x[1], 0.5, 24))}
    print(f"  M_lockout:  amplitude={M_lockout['amplitude']:.3f}  tau={M_lockout['tau']:.2f}m")

    # ----- M_burnout (slope unconstrained; reuse V7 V7.1 form) -----
    m_lck_full = v7m.m_lockout(feats['months_since_lockout_end'], M_lockout)
    cohort_lk = cohort_mat * m_lck_full
    def brn_nll(params):
        floor, slope = float(params[0]), float(params[1])
        floor = max(0.05, min(0.95, floor))
        slope = max(-2.0, min(2.0, slope))
        m_brn = v7m.m_burnout(feats['burn_ratio'],
                                {'floor': floor, 'slope': slope})
        smm = np.clip(cohort_lk * m_brn, 1e-9, 1 - 1e-9)
        ll = sample_weights * (y * np.log(smm) + (1 - y) * np.log(1 - smm))
        return -ll.sum()
    r_brn = minimize(brn_nll, x0=[0.5, -0.3], method='Nelder-Mead',
                      options={'maxiter': 200, 'xatol': 0.01})
    M_burnout = {'floor': float(np.clip(r_brn.x[0], 0.05, 0.95)),
                  'slope': float(np.clip(r_brn.x[1], -2, 2))}
    print(f"  M_burnout:  floor={M_burnout['floor']:.4f}  slope={M_burnout['slope']:.4f}")
    return {'M_maturity': M_maturity, 'M_lockout': M_lockout, 'M_burnout': M_burnout}


# ===========================================================================
# Diagnostics builders (parallel V8.1 patterns)
# ===========================================================================
def smm_to_cpr(smm):
    return (1 - (1 - np.asarray(smm)) ** 12) * 100


def _predict(df, cohort_table, structural, flavor='v9b'):
    feats = features_dict(df)
    return (c9.predict_smm_v9a(feats, cohort_table) if flavor == 'v9a'
            else c9.predict_smm_v9b(feats, cohort_table, structural))


def build_curve_grids(cohort_table, n_points=N_CURVE_GRID_POINTS,
                       net_bp_range=(-500, 500)):
    grids = {}
    xs = np.linspace(net_bp_range[0], net_bp_range[1], n_points)
    for cid, p in cohort_table.items():
        ys_smm = c9.cohort_sigmoid(xs, p)
        ys_cpr = (1 - (1 - ys_smm) ** 12) * 100
        grids[cid] = [{'net_bp': round(float(x), 1),
                       'pred_smm': round(float(s), 6),
                       'pred_cpr': round(float(c), 3)}
                      for x, s, c in zip(xs, ys_smm, ys_cpr)]
    return grids


def build_age_ramp_grids(cohort_table, n_points=60, age_range=(0, 360)):
    grids = {}
    xs = np.linspace(age_range[0], age_range[1], n_points)
    for cid, p in cohort_table.items():
        knots_y = p.get('age_knots_y', [1.0, 1.0, 1.0, 1.0])
        ys = np.interp(xs, c9.AGE_RAMP_KNOTS_X, knots_y,
                        left=knots_y[0], right=knots_y[-1])
        grids[cid] = [{'age': round(float(a), 1), 'ramp_y': round(float(y), 4)}
                      for a, y in zip(xs, ys)]
    return grids


def build_period_arrays(df, cohort_table, structural, flavor):
    pred = _predict(df, cohort_table, structural, flavor)
    work = df.assign(_pred=pred,
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


def build_scurve(df, cohort_table, structural, flavor):
    pred = _predict(df, cohort_table, structural, flavor)
    edges = [-1e9, -300, -200, -100, -50, 0, 50, 100, 150, 200, 300, 500, 1e9]
    work = df.assign(_pred=pred,
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


def build_cuts(df, key, cohort_table, structural, flavor):
    pred = _predict(df, cohort_table, structural, flavor)
    work = df.assign(_pred=pred,
                     _act=df['prepaid_voluntary'].astype(float).values).copy()
    out = []
    for k, g in work.groupby(key):
        if len(g) == 0: continue
        a, pr = g['_act'].mean(), g['_pred'].mean()
        out.append({'key': str(k), 'n': int(len(g)),
                    'actual_smm': round(a, 7), 'pred_smm': round(pr, 7),
                    'actual_cpr': round(float(smm_to_cpr(a)), 4),
                    'pred_cpr':   round(float(smm_to_cpr(pr)), 4)})
    return out


def build_bucket_cuts(df, col, edges, labels, cohort_table, structural, flavor):
    pred = _predict(df, cohort_table, structural, flavor)
    work = df.assign(_pred=pred,
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


def build_cohort_cuts(df, cohort_table, structural, flavor):
    feats = features_dict(df)
    cohorts = c9.assign_cohort(feats)
    pred = _predict(df, cohort_table, structural, flavor)
    work = df.assign(_pred=pred,
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


def build_sample_loans_table(df_test, cohort_table, structural, flavor='v9b', n=50):
    latest = sorted(df_test['period'].astype(str).unique())[-1]
    pool = df_test[df_test['period'].astype(str) == latest].copy()
    if len(pool) < n:
        pool = df_test.copy()
    if len(pool) == 0:
        return []
    feats_pool = features_dict(pool)
    smm_pool = _predict(pool, cohort_table, structural, flavor)
    cpr_pool = (1 - (1 - smm_pool) ** 12) * 100
    pool = pool.assign(_cpr=cpr_pool, _cohort=c9.assign_cohort(feats_pool)
                       ).reset_index(drop=True)
    pool['_dec'] = pd.qcut(pool['_cpr'].rank(method='first'), 10,
                            labels=False, duplicates='drop')
    per_dec = max(1, n // 10)
    rng = np.random.default_rng(SEED)
    chunks = []
    for dec in sorted(pool['_dec'].dropna().unique()):
        sub = pool[pool['_dec'] == dec]
        take_idx = rng.choice(len(sub), size=min(per_dec, len(sub)), replace=False)
        chunks.append(sub.iloc[take_idx])
    sample = pd.concat(chunks).reset_index(drop=True).head(n)

    feats = features_dict(sample)
    smm = _predict(sample, cohort_table, structural, flavor)
    cpr = (1 - (1 - smm) ** 12) * 100
    cohorts_assigned = c9.assign_cohort(feats)
    sig_per_row, age_knots_per_row = c9._lookup_cohort_params(cohorts_assigned, cohort_table)
    cohort_sig_smm = c9.cohort_sigmoid(feats['net_refi_incentive_bps'], sig_per_row)
    age_ramp_per_row = c9._vectorized_age_ramp(feats['loan_age_months'], age_knots_per_row)
    cohort_smm = cohort_sig_smm * age_ramp_per_row
    if flavor == 'v9b':
        m_mat = v7m.m_maturity(feats['months_to_maturity'], structural['M_maturity'])
        m_lck = v7m.m_lockout(feats['months_since_lockout_end'], structural['M_lockout'])
        m_brn = v7m.m_burnout(feats['burn_ratio'], structural['M_burnout'])
    else:
        m_mat = m_lck = m_brn = np.ones_like(cohort_smm)

    out = []
    for i in range(len(sample)):
        row = sample.iloc[i]
        cohort_cpr = float((1 - (1 - cohort_smm[i]) ** 12) * 100)
        post_cohort_gap = float(cpr[i]) - cohort_cpr
        log_components = {
            'M_maturity': math.log(max(float(m_mat[i]), 1e-9)),
            'M_lockout':  math.log(max(float(m_lck[i]), 1e-9)),
            'M_burnout':  math.log(max(float(m_brn[i]), 1e-9)),
        }
        sum_log_mults = sum(log_components.values())
        # M_age_cohort attribution = cohort_cpr - cohort_sigmoid_only_cpr
        sigmoid_only_cpr = float((1 - (1 - cohort_sig_smm[i]) ** 12) * 100)
        mult_attr = {'M_age_cohort': round(cohort_cpr - sigmoid_only_cpr, 4)}
        if abs(sum_log_mults) > 1e-9:
            for k in ['M_maturity', 'M_lockout', 'M_burnout']:
                mult_attr[k] = round(log_components[k] / sum_log_mults * post_cohort_gap, 4)
        else:
            for k in ['M_maturity', 'M_lockout', 'M_burnout']:
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
                'M_age_cohort': round(float(age_ramp_per_row[i]), 4),
                'M_maturity':   round(float(m_mat[i]), 4),
                'M_lockout':    round(float(m_lck[i]), 4),
                'M_burnout':    round(float(m_brn[i]), 4),
            },
            'attribution':   mult_attr,
        })
    return out


def build_comparison_to_v8(v8_path: Path, v9_test_auc, v9_test_logloss,
                             v9_yearly, v9_cal):
    if not v8_path.exists():
        return {'available': False}
    v8 = json.load(open(v8_path))
    out = {
        'available': True,
        'v8_test_auc':       v8['metadata']['test_auc'],
        'v9_test_auc':       v9_test_auc,
        'auc_delta':         round(v9_test_auc - v8['metadata']['test_auc'], 4),
        'v8_log_loss':       v8['metadata']['test_log_loss'],
        'v9_log_loss':       v9_test_logloss,
        'log_loss_delta':    round(v9_test_logloss - v8['metadata']['test_log_loss'], 5),
    }
    v8_year_map = {y['year']: y for y in v8.get('yearly', [])}
    out['yearly_compare'] = []
    for yr in v9_yearly:
        ye = v8_year_map.get(yr['year'], {})
        out['yearly_compare'].append({'year': yr['year'], 'n': yr['n'],
                                       'actual_cpr': yr['actual_cpr'],
                                       'v8_pred_cpr': ye.get('pred_cpr'),
                                       'v9_pred_cpr': yr['pred_cpr']})
    out['calibration_compare'] = []
    v8_cal = v8.get('calibration', [])
    for i, cv in enumerate(v9_cal):
        cv8 = v8_cal[i] if i < len(v8_cal) else {}
        out['calibration_compare'].append({'decile': cv['decile'],
                                            'v8_pred_cpr':   cv8.get('pred_cpr'),
                                            'v8_actual_cpr': cv8.get('actual_cpr'),
                                            'v9_pred_cpr':    cv['pred_cpr'],
                                            'v9_actual_cpr':  cv['actual_cpr']})
    return out


def sancap_per_cohort_match(cohort_table: dict, structural: dict) -> list:
    scenarios = [
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
        coh = c9.assign_cohort(feats)[0]
        smm = c9.predict_smm_v9b(feats, cohort_table, structural)[0]
        cpr = float(smm_to_cpr(smm))
        diverge = abs(cpr - sancap_cpr)
        out.append({'scenario': label, 'cohort': coh,
                    'sancap_cpr': sancap_cpr,
                    'v9_pred_cpr': round(cpr, 2),
                    'divergence_pp': round(diverge, 2),
                    'flag': 'REVIEW' if diverge > 10 else 'ok'})
    return out


# ===========================================================================
# Main orchestrator
# ===========================================================================
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--emit-dashboard',      action='store_true')
    parser.add_argument('--only-emit-dashboard', action='store_true')
    parser.add_argument('--flavor', choices=['v9a', 'v9b'], default='v9b')
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

    # R1+R2+R5: Joint sigmoid + ramp fit per cohort with Richards + per-cohort
    # bounds + median-age anchor
    cohort_table, cohort_diag = fit_all_cohorts(df_train, MIN_EVENTS_PER_COHORT)
    cohort_curve_grids = build_curve_grids(cohort_table)
    cohort_age_ramp_grids = build_age_ramp_grids(cohort_table)

    # R3: refit V9 structural multipliers with widened bounds
    structural = fit_v9_structural(df_train, cohort_table)

    # Test-fold predictions
    flavor = args.flavor
    pred_test = _predict(df_test, cohort_table, structural, flavor)
    y_test = df_test['prepaid_voluntary'].astype(float).values
    auc = roc_auc_score(y_test, pred_test) if y_test.sum() > 0 else float('nan')
    ll = log_loss(y_test, np.clip(pred_test, 1e-9, 1 - 1e-9))
    print(f"\nFinal V9 ({flavor}): test AUC={auc:.4f}  test log_loss={ll:.5f}")

    # Tail-blowup check
    pred_full = _predict(df, cohort_table, structural, flavor)
    cpr_full = smm_to_cpr(pred_full)
    max_cpr = float(cpr_full.max())
    n_above_90 = int((cpr_full > 90).sum())
    n_above_75 = int((cpr_full > 75).sum())
    print(f"Tail-blowup check: max(pred_CPR full panel) = {max_cpr:.2f}%  "
          f"(n>90% = {n_above_90}; n>75% = {n_above_75})")

    # SanCap per-cohort
    sancap = sancap_per_cohort_match(cohort_table, structural)
    n_review = sum(1 for s in sancap if s['flag'] == 'REVIEW')
    print(f"\nSanCap per-cohort match ({n_review}/{len(sancap)} flagged):")
    for s in sancap:
        print(f"  {'⚠' if s['flag']=='REVIEW' else ' '} {s['scenario']:<35}  "
              f"cohort={s['cohort']:<26}  SanCap={s['sancap_cpr']:>3} CPR  "
              f"V9={s['v9_pred_cpr']:>5.1f}  Δ={s['divergence_pp']:>5.1f}pp")

    # Diagnostic builders
    monthly, yearly = build_period_arrays(df_test, cohort_table, structural, flavor)
    scurve = build_scurve(df_test, cohort_table, structural, flavor)
    cal = build_calibration(pred_test, y_test)
    cohort_cuts = build_cohort_cuts(df_test, cohort_table, structural, flavor)
    fha_cuts = build_cuts(df_test, 'fha_category', cohort_table, structural, flavor)
    lp_cuts  = build_cuts(df_test, 'loan_purpose',  cohort_table, structural, flavor)
    age_cuts = build_bucket_cuts(df_test, 'loan_age_months',
                                 [-1, 12, 36, 60, 120, 180, 1e9],
                                 ['0-12m','12-36m','36-60m','60-120m','120-180m','180m+'],
                                 cohort_table, structural, flavor)
    mtm_cuts = build_bucket_cuts(df_test, 'months_to_maturity',
                                 [-1, 12, 24, 36, 60, 120, 1e9],
                                 ['0-12m','12-24m','24-36m','36-60m','60-120m','120m+'],
                                 cohort_table, structural, flavor)
    size_cuts = build_bucket_cuts(df_test, 'upb',
                                   [-1, 2e6, 5e6, 10e6, 25e6, 50e6, 1e10],
                                   ['<2M','2-5M','5-10M','10-25M','25-50M','50M+'],
                                   cohort_table, structural, flavor)
    sample_loans = build_sample_loans_table(df_test, cohort_table, structural, flavor, n=50)
    comparison = build_comparison_to_v8(V8_JSON, auc, ll, yearly, cal)

    panel_actual_smm = float(df_train['prepaid_voluntary'].mean())
    artifact = {
        'metadata': {
            'training_pop_n':   int(is_train.sum()),
            'training_events':  int(df_train['prepaid_voluntary'].sum()
                                     + df_test['prepaid_voluntary'].sum()),
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
            'model_version':    'v9',
            'description':      f'V9 ({flavor}): Richards 5PL + per-cohort bounds + median-age anchor + widened structural bounds',
            'max_cpr_full_panel': round(max_cpr, 2),
            'n_above_90_cpr':   n_above_90,
            'n_above_75_cpr':   n_above_75,
            'smm_cap':          c9.SMM_CAP_DEFAULT,
            'enhancements':     ['R1: Richards 5PL', 'R2: per-cohort bounds',
                                 'R3: widened structural bounds',
                                 'R5: median-age anchor'],
        },
        'cohort_table':         cohort_table,
        'cohort_definitions':   list(cohort_diag.values()),
        'cohort_curve_grids':   cohort_curve_grids,
        'cohort_age_ramp_grids':cohort_age_ramp_grids,
        'age_ramp_knots_x':     c9.AGE_RAMP_KNOTS_X.tolist(),
        'age_bucket_breaks':    c9.AGE_BUCKET_BREAKS,
        'age_bucket_keys':      c9.AGE_BUCKET_KEYS,
        'program_bounds':       c9.PROGRAM_BOUNDS,
        'structural_params':    structural,
        'monthly': monthly, 'yearly': yearly, 'scurve': scurve,
        'calibration': cal,
        'cohort_cuts': cohort_cuts,
        'fha_cuts': fha_cuts, 'lp_cuts': lp_cuts,
        'age_cuts': age_cuts, 'mtm_cuts': mtm_cuts, 'size_cuts': size_cuts,
        'sample_loans': sample_loans,
        'sancap_benchmarks': sancap,
        'comparison_to_v8': comparison,
    }
    OUT_JSON.write_text(json.dumps(artifact, indent=1, default=str))
    print(f"\nWrote {OUT_JSON}  ({OUT_JSON.stat().st_size / 1024:.1f} KB)")

    if args.emit_dashboard:
        emit_dashboard(artifact)


def emit_dashboard(v9_artifact: dict):
    if not DASHBOARD.exists():
        print(f"  Skipping --emit-dashboard: {DASHBOARD} not yet present")
        return
    src = DASHBOARD.read_text()
    v8 = json.load(open(V8_JSON)) if V8_JSON.exists() else {}
    v9_repl = f'/* __MODEL_DATA_V9__ */ const MODEL_DATA_V9 = {json.dumps(v9_artifact)};'
    v8_repl = f'/* __MODEL_DATA_V8__ */ const MODEL_DATA_V8 = {json.dumps(v8)};'
    # Match the ENTIRE LINE containing the placeholder (not [^;]*?;) — JSON content
    # may legitimately contain ';' inside string values (e.g. "0 YEAR LOCK; 10,9,...").
    # The const declarations are emitted on a single line, so line-anchored is safe.
    new = re.sub(r'/\* __MODEL_DATA_V9__ \*/[^\n]*', lambda _: v9_repl, src, count=1)
    new = re.sub(r'/\* __MODEL_DATA_V8__ \*/[^\n]*', lambda _: v8_repl, new, count=1)
    DASHBOARD.write_text(new)
    print(f"  Re-templated {DASHBOARD} ({len(new)/1024:.1f} KB)")


if __name__ == '__main__':
    main()
