"""
V7 multiplicative voluntary prepayment model — training pipeline.

Two-stage MLE on the GNMA panel:
  Stage 1 — Iterative empirical refinement: for each multiplier, hold others fixed,
            compute the bin-level ratio of actual_SMM to predicted_SMM (using other
            multipliers), fit the multiplier's parametric form via WLS. 5 passes.
  Stage 2 — Joint Poisson MLE via scipy.optimize.minimize(L-BFGS-B) over the packed
            ~28-parameter theta vector. Constraints enforced via reparameterization
            (see v7_multipliers.pack_params).

Inputs:
  - working/gnma_mf_panel.parquet (or GNMA_PANEL_PARQUET env var)
  - model_data_v6f.json (for the V6F-vs-V7 comparison block)

Outputs:
  - model_data_v7.json
  - issuer_residuals.json   (separate; not a core multiplier — overlay-only)

CLI:
  GNMA_PANEL_PARQUET=working/gnma_mf_panel.parquet python3 train_v7.py
  python3 train_v7.py --emit-dashboard           # train AND re-template dashboard
  python3 train_v7.py --only-emit-dashboard      # skip training; just refresh dashboard
"""
from __future__ import annotations
import argparse, copy, json, math, os, re, sys, warnings
from pathlib import Path
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from sklearn.metrics import roc_auc_score, log_loss

import v7_multipliers as v7m

warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

HERE = Path(__file__).resolve().parent
PANEL_PATH = Path(os.environ.get('GNMA_PANEL_PARQUET',
                                  HERE / 'working' / 'gnma_mf_panel.parquet'))
OUT_JSON = HERE / 'model_data_v7.json'
ISSUER_JSON = HERE / 'issuer_residuals.json'
V6F_JSON = HERE / 'model_data_v6f.json'
DASHBOARD = HERE / 'v7_dashboard.jsx'
SEED = 42
NEG_TO_POS_RATIO = 5
TAIL_BLOWUP_THRESHOLD = 0.75   # max allowed pred_CPR over full panel


# ---------------------------------------------------------------------------
# Panel loading + feature derivation (reuses V6F's logic; copy not import)
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
    """Add the V7-feature columns the multipliers expect."""
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

    upb = df['upb'].fillna(0).clip(lower=0)
    df['log_upb'] = np.log1p(upb).astype(float)

    # Burn ratio: cum_itm / age (path-dependent)
    df = df.sort_values(['loan_id', 'period']).reset_index(drop=True)
    df['_itm'] = (df['refi_incentive_bps'].fillna(-9999) > 0).astype(int)
    df['cum_itm'] = df.groupby('loan_id')['_itm'].cumsum()
    df['burn_ratio'] = (
        df['cum_itm'] / np.maximum(df['loan_age_months'].fillna(1), 1)
    ).clip(0, 1).astype(float)
    df.drop(columns=['_itm'], inplace=True)

    # Pass-throughs needed by multipliers
    df['gross_refi_incentive_bps'] = df['gross_refi_incentive_bps'].astype(float).fillna(0)
    df['prepay_penalty_points']    = df['prepay_penalty_points'].astype(float).fillna(0).clip(0, 10)
    df['loan_age_months']          = df['loan_age_months'].fillna(0).clip(lower=0).astype(float)
    df['fha_category']             = df['fha_category'].fillna('').astype(str)
    df['loan_purpose']             = df['loan_purpose'].fillna('').astype(str)

    # R8: net (penalty-adjusted) refi incentive — feeds the single M_rate sigmoid.
    # The panel column `refi_incentive_bps` is already gross_refi_bps − penalty_bps_eq
    # (penalty translation: 12.5 × (ppp + 1) bp; verified from panel directly).
    if 'refi_incentive_bps' in df.columns:
        df['net_refi_incentive_bps'] = df['refi_incentive_bps'].astype(float).fillna(
            df['gross_refi_incentive_bps'] - 12.5 * (df['prepay_penalty_points'] + 1)
        )
    else:
        df['net_refi_incentive_bps'] = (df['gross_refi_incentive_bps']
                                         - 12.5 * (df['prepay_penalty_points'] + 1)).astype(float)

    # Pre-encode categorical features for fast vectorized lookups in MLE
    df['fha_code'] = v7m.encode_fha_code(df['fha_category'].values)
    df['is_nc']    = v7m.encode_is_nc(df['loan_purpose'].values)

    # Drop any remaining NaNs in the feature inputs
    feat_cols = ['loan_age_months', 'net_refi_incentive_bps', 'prepay_penalty_points',
                 'log_upb', 'months_since_lockout_end', 'months_to_maturity', 'burn_ratio']
    nans = df[feat_cols].isna().any(axis=1)
    if nans.any():
        print(f"  Dropping {nans.sum()} rows with NaN features")
        df = df[~nans].copy()

    print(f"  Final training-eligible rows: {len(df):,}")
    return df


def features_dict(df: pd.DataFrame) -> dict:
    """Pack a DataFrame slice into the dict format compute_multipliers expects.

    Pre-encoded fha_code and is_nc are passed through (computed once in derive_features)
    to keep the MLE inner loop pure-numpy with zero Python iteration over 1M rows.
    """
    return {
        'loan_age_months':          df['loan_age_months'].values,
        'net_refi_incentive_bps':   df['net_refi_incentive_bps'].values,
        'gross_refi_incentive_bps': df['gross_refi_incentive_bps'].values,
        'prepay_penalty_points':    df['prepay_penalty_points'].values,
        'log_upb':                  df['log_upb'].values,
        'fha_code':                 df['fha_code'].values,
        'is_nc':                    df['is_nc'].values,
        'fha_category':             df['fha_category'].values,
        'loan_purpose':             df['loan_purpose'].values,
        'months_since_lockout_end': df['months_since_lockout_end'].values,
        'months_to_maturity':       df['months_to_maturity'].values,
        'burn_ratio':               df['burn_ratio'].values,
    }


# ---------------------------------------------------------------------------
# Train/test split + downsampling
# ---------------------------------------------------------------------------
def train_split(df: pd.DataFrame, seed: int = SEED) -> tuple[np.ndarray, np.ndarray]:
    loans = df['loan_id'].unique()
    rng = np.random.default_rng(seed)
    shuf = rng.permutation(loans)
    cut = int(0.8 * len(shuf))
    train_loans = set(shuf[:cut])
    is_train = df['loan_id'].isin(train_loans).values
    return is_train, ~is_train


def downsample_indices(y: np.ndarray, ratio: int = NEG_TO_POS_RATIO,
                       seed: int = SEED) -> np.ndarray:
    pos = np.where(y == 1)[0]
    neg = np.where(y == 0)[0]
    rng = np.random.default_rng(seed)
    keep_neg = rng.choice(neg, size=min(len(neg), ratio * len(pos)), replace=False)
    keep = np.concatenate([pos, keep_neg])
    rng.shuffle(keep)
    return keep


# ---------------------------------------------------------------------------
# Stage 2 — Joint Poisson MLE
# ---------------------------------------------------------------------------
def neg_log_likelihood(theta: np.ndarray, schema, template, feats, y, sample_weight=None):
    """Bernoulli NLL (rare-event SMM is well-approximated by Poisson; we use
    proper Bernoulli for stability)."""
    params = v7m.unpack_params(theta, schema, template)
    smm = v7m.predict_smm(feats, params)
    smm = np.clip(smm, 1e-9, 1 - 1e-9)
    ll = y * np.log(smm) + (1 - y) * np.log(1 - smm)
    if sample_weight is not None:
        ll = ll * sample_weight
    return -ll.sum()


def stage2_fit(feats_train, y_train, init_params, max_iter=200, sample_weight=None):
    """Joint Poisson/Bernoulli MLE via L-BFGS-B.

    `sample_weight` is an optional per-row weight array. We use it to up-weight
    post-lockout rows (R5) so the optimizer sees the ~9.5K-row 0-12m surge
    signal despite competition from the 982K-row in-lockout/none signal.
    """
    print("\nStage 2: joint Poisson/Bernoulli MLE (L-BFGS-B)...")
    theta0, schema = v7m.pack_params(init_params)
    print(f"  Free parameters: {len(theta0)}")
    print(f"  Train rows: {len(y_train):,}  events: {int(y_train.sum()):,}")
    if sample_weight is not None:
        n_up = int((sample_weight > 1.0).sum())
        print(f"  Sample-weighted rows: {n_up:,}  (max weight: {float(sample_weight.max()):.1f})")

    def f(theta):
        return neg_log_likelihood(theta, schema, init_params, feats_train, y_train,
                                  sample_weight=sample_weight)

    result = minimize(f, theta0, method='L-BFGS-B',
                      options={'maxiter': max_iter, 'disp': False})
    print(f"  Converged: {result.success}  iterations: {result.nit}  NLL: {result.fun:.4f}")
    fitted = v7m.unpack_params(result.x, schema, init_params)

    # R7: flag any parameter pinned at a bound or fit to ~0
    issues = v7m.assert_no_pinned_params(result.x, schema)
    if issues:
        print("  WARNING: parameters at boundary or fit to ~0:")
        for i in issues:
            print(f"    - {i}")
    else:
        print("  All parameters fit within bounds (no pinning)")

    return fitted, result, schema


def reanchor_multipliers(params: dict, feats_train: dict) -> dict:
    """R3: Re-parameterize so each scale-equivariant multiplier has panel-mean = 1.0.

    For multipliers whose functional form is scale-equivariant (M_age piecewise
    linear, M_rate sigmoid floor+asymp, M_program lookup, M_size clipped linear),
    we can scale their parameters by a constant k to scale ALL their outputs by k.
    By choosing k = 1/panel_mean(multiplier), each multiplier becomes mean-1.0
    over the panel. We then absorb the products of those mean factors into
    base_smm — predictions are mathematically unchanged.

    M_penalty, M_purpose, M_lockout, M_maturity, M_burnout already average ~1.0
    by construction (each is a "1 + ..." form), so we leave them alone.
    """
    import copy
    out = copy.deepcopy(params)
    mults_before = v7m.compute_multipliers(feats_train, out)

    print("\nR3: re-anchoring scale-equivariant multipliers to panel-mean=1.0")
    print(f"  base_smm before: {out['base_smm']:.5f}")
    base_factor = 1.0

    # M_age: piecewise linear (scale knots_y by k)
    mean_age = float(mults_before['M_age'].mean())
    if mean_age > 0:
        k = mean_age
        out['M_age']['knots_y'] = [y / k for y in out['M_age']['knots_y']]
        base_factor *= k
        print(f"  M_age:    panel mean = {mean_age:.4f}  →  knots_y / {k:.4f}")

    # M_rate: sigmoid floor + asymp/(1+exp(...)) (scale floor and asymp by k)
    mean_rate = float(mults_before['M_rate'].mean())
    if mean_rate > 0:
        k = mean_rate
        out['M_rate']['floor']     /= k
        out['M_rate']['asymptote'] /= k
        base_factor *= k
        print(f"  M_rate:   panel mean = {mean_rate:.4f}  →  floor & asymp / {k:.4f}")

    # M_program: lookup table (scale every value by k)
    mean_prog = float(mults_before['M_program'].mean())
    if mean_prog > 0:
        k = mean_prog
        for key in out['M_program']:
            out['M_program'][key] /= k
        base_factor *= k
        print(f"  M_program: panel mean = {mean_prog:.4f}  →  all entries / {k:.4f}")

    # M_size: clipped linear (scale intercept, slope, low, high by k)
    mean_size = float(mults_before['M_size'].mean())
    if mean_size > 0:
        k = mean_size
        out['M_size']['intercept'] /= k
        out['M_size']['slope']     /= k
        out['M_size']['low']       /= k
        out['M_size']['high']      /= k
        base_factor *= k
        print(f"  M_size:    panel mean = {mean_size:.4f}  →  intercept/slope/low/high / {k:.4f}")

    # Absorb the product of panel means into base_smm
    out['base_smm'] *= base_factor
    print(f"  base_smm after: {out['base_smm']:.5f}  (× {base_factor:.4f})")

    # Sanity-check: predictions must be unchanged
    smm_before = v7m.predict_smm(feats_train, params)
    smm_after  = v7m.predict_smm(feats_train, out)
    diff = float(np.abs(smm_after - smm_before).max())
    print(f"  Max |smm_before - smm_after| (should be near 0): {diff:.2e}")

    # Verify each rescaled multiplier now averages ~1.0
    mults_after = v7m.compute_multipliers(feats_train, out)
    for name in ['M_age', 'M_rate', 'M_program', 'M_size']:
        m = float(mults_after[name].mean())
        print(f"  {name} new panel mean: {m:.4f}")

    return out


# ---------------------------------------------------------------------------
# Stage 1 — Iterative empirical refinement (one pass per multiplier)
# ---------------------------------------------------------------------------
def stage1_refine(df_train: pd.DataFrame, params: dict, n_passes: int = 3) -> dict:
    """For each multiplier, bin the panel, compute empirical ratio, smooth into
    parametric form. Iterate. This serves to seed Stage 2 from a sensible region."""
    print("\nStage 1: iterative empirical refinement...")
    p = copy.deepcopy(params)
    feats = features_dict(df_train)
    y = df_train['prepaid_voluntary'].astype(float).values

    for pass_idx in range(n_passes):
        # Predict using current params
        all_mults = v7m.compute_multipliers(feats, p)
        # For each multiplier, compute empirical correction
        # corrected = actual_SMM / (base × Π other multipliers)
        for target in v7m.MULTIPLIER_NAMES:
            # base × product of other multipliers
            other_product = np.ones_like(y)
            for name in v7m.MULTIPLIER_NAMES:
                if name == target:
                    continue
                other_product = other_product * all_mults[name]
            denom = p['base_smm'] * other_product
            denom = np.clip(denom, 1e-9, 1.0)

            # Refine the parametric form by a closed-form per-multiplier nudge.
            # We scale the multiplier by a single scalar = mean(y) / mean(denom × M_target)
            # This converges to base alignment; finer shapes are picked up in Stage 2.
            current = all_mults[target]
            pred = denom * current
            scalar = y.sum() / max(pred.sum(), 1e-9)
            # Clip extreme rescaling to keep params in plausible range
            scalar = float(np.clip(scalar, 0.5, 2.0))

            # Nudge the multiplier's scale by adjusting one representative parameter
            if target == 'M_rate':
                p['M_rate']['asymptote'] = float(np.clip(p['M_rate']['asymptote'] * scalar, 0.5, 12.0))
            elif target == 'M_age':
                p['M_age']['knots_y'] = [float(np.clip(y_ * scalar, 0.05, 5.0))
                                          for y_ in p['M_age']['knots_y']]
            elif target == 'M_size':
                p['M_size']['intercept'] = float(np.clip(p['M_size']['intercept'] * scalar, 0.1, 3.0))
            elif target == 'M_program':
                for k in list(p['M_program']):
                    p['M_program'][k] = float(np.clip(p['M_program'][k] * scalar, 0.05, 5.0))
            elif target == 'M_purpose':
                p['M_purpose']['NC_bump'] = float(np.clip(p['M_purpose']['NC_bump'] * scalar, 0.0, 3.0))
            elif target == 'M_lockout':
                p['M_lockout']['amplitude'] = float(np.clip(p['M_lockout']['amplitude'] * scalar, 0.0, 4.0))
            elif target == 'M_maturity':
                p['M_maturity']['amplitude'] = float(np.clip(p['M_maturity']['amplitude'] * scalar, 0.0, 8.0))
            elif target == 'M_burnout':
                p['M_burnout']['slope'] = float(np.clip(p['M_burnout']['slope'] / scalar, 0.001, 2.0))

            # Recompute affected multiplier so the next iteration sees fresh values
            all_mults[target] = v7m.compute_multipliers(feats, p)[target]

        # Recalibrate base_SMM after this pass
        smm = v7m.predict_smm(feats, p)
        scale = y.sum() / max(smm.sum(), 1e-9)
        scale = float(np.clip(scale, 0.5, 2.0))
        p['base_smm'] = float(np.clip(p['base_smm'] * scale, 0.0001, 0.05))

        smm_now = v7m.predict_smm(feats, p)
        ll = log_loss(y, np.clip(smm_now, 1e-9, 1 - 1e-9))
        print(f"  Pass {pass_idx+1}/{n_passes}: base_SMM={p['base_smm']:.5f}  log_loss={ll:.5f}")

    return p


# ---------------------------------------------------------------------------
# Diagnostics builders (parallel V6F's structure)
# ---------------------------------------------------------------------------
def smm_to_cpr(smm):
    return (1 - (1 - np.asarray(smm)) ** 12) * 100


def build_period_arrays(df, p):
    pred_smm = v7m.predict_smm(features_dict(df), p)
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


def build_scurve(df, p):
    pred_smm = v7m.predict_smm(features_dict(df), p)
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


def build_cuts(df, key, params, ordered=False):
    pred_smm = v7m.predict_smm(features_dict(df), params)
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


def build_bucket_cuts(df, col, edges, labels, params):
    pred_smm = v7m.predict_smm(features_dict(df), params)
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


def build_multiplier_curves(params: dict) -> dict:
    """Render each numeric multiplier's curve over its input range — for the dashboard."""
    curves = {}
    # M_rate now plots over the NET (penalty-adjusted) refi incentive domain
    grids = {
        'M_age':      np.linspace(0, 360, 60),
        'M_rate':     np.linspace(-500, 500, 50),    # net_refi_bps domain
        'M_size':     np.linspace(np.log1p(5e5), np.log1p(1e8), 40),
        'M_lockout':  np.linspace(0, 24, 25),
        'M_maturity': np.linspace(0, 60, 30),
        'M_burnout':  np.linspace(0, 1, 21),
    }
    fns = {
        'M_age':      v7m.m_age,
        'M_rate':     v7m.m_rate,
        'M_size':     v7m.m_size,
        'M_lockout':  v7m.m_lockout,
        'M_maturity': v7m.m_maturity,
        'M_burnout':  v7m.m_burnout,
    }
    for name, x in grids.items():
        y = fns[name](x, params[name])
        curves[name] = [{'x': round(float(xi), 4), 'y': round(float(yi), 4)}
                        for xi, yi in zip(x, y)]
    # Categorical multipliers as bar tables
    curves['M_program'] = [{'x': k, 'y': round(float(v), 4)}
                            for k, v in params['M_program'].items()]
    # M_purpose now a triangular hump centered at peak_age over the NC age domain
    pa = params['M_purpose']['peak_age']; w = params['M_purpose']['width']
    bump = params['M_purpose']['NC_bump']
    nc_ages = sorted(set([0, max(0, pa - w), pa - w/2, pa, pa + w/2, pa + w, 90, 120]))
    curves['M_purpose'] = [
        {'x': f'NC@age={int(round(a))}m',
         'y': round(float(1.0 + bump * max(0, 1 - abs(a - pa) / w)), 4)}
        for a in nc_ages
    ]
    curves['M_purpose'].append({'x': 'RP/OTHER', 'y': 1.0})
    return curves


def build_attribution_loans(df_test: pd.DataFrame, params: dict, n: int = 8) -> list:
    """Pick representative loans and compute per-multiplier contribution to log(CPR)."""
    latest = sorted(df_test['period'].astype(str).unique())[-1]
    cands = df_test[df_test['period'].astype(str) == latest].copy()
    if len(cands) == 0:
        cands = df_test.copy()
    archetypes = []
    seen = set()
    for fha, lp in (('232', 'RP'), ('223(F)', 'RP'), ('221(D)(4)', 'NC'),
                    ('223(A)(7)', 'RP'), ('538', 'RP'), ('OTHER', 'RP'),
                    ('232', 'NC'), ('223(F)', 'NC')):
        sub = cands[(cands['fha_category'].str.contains(fha, regex=False, na=False))
                    & (cands['loan_purpose'].str.upper() == lp.upper())]
        if len(sub) == 0:
            continue
        loan = sub.iloc[(sub['upb'].rank() - len(sub) / 2).abs().argsort()[:1]].iloc[0]
        key = f"{fha}_{lp}"
        if key in seen:
            continue
        seen.add(key)
        archetypes.append((key, loan))
        if len(archetypes) >= n:
            break

    out = []
    for key, loan in archetypes:
        feats_one = features_dict(loan.to_frame().T)
        mults = v7m.compute_multipliers(feats_one, params)
        smm = float(v7m.predict_smm(feats_one, params)[0])
        cpr = float(smm_to_cpr(smm))
        contributions = []
        for name in v7m.MULTIPLIER_NAMES:
            mval = float(mults[name][0])
            contributions.append({
                'feature':            name,
                'multiplier':         round(mval, 4),
                'log_multiplier':     round(math.log(max(mval, 1e-9)), 4),
                'contribution_logit': round(math.log(max(mval, 1e-9)), 4),
            })
        out.append({
            'label':         key,
            'archetype_id':  key,
            'loan_id':       str(loan['loan_id']),
            'period':        str(loan['period']),
            'fha_category':  str(loan.get('fha_category', '')),
            'loan_purpose':  str(loan.get('loan_purpose', '')),
            'issuer_key':    str(loan.get('issuer_name', ''))[:30],
            'logit_z':       round(sum(c['log_multiplier'] for c in contributions), 4),
            'pred_smm':      round(smm, 7),
            'pred_cpr':      round(cpr, 4),
            'actual_prepay': int(loan['prepaid_voluntary']),
            'contributions': contributions,
        })
    return out


def build_sample_loans_table(df_test: pd.DataFrame, params: dict, n: int = 50) -> list:
    """Stratified sample of test loans (5 per pred_CPR decile) with per-multiplier
    log-attribution. Used by the dashboard's "Sample Loans" tab to show a population-
    level view of where each multiplier is pulling each loan's CPR up vs down.

    Attribution math (matches the Loan_Snapshot tab in V7_Excel_Calculator.xlsx):
        log_mult_j = LN(M_factor_j)
        attribution_j = log_mult_j / SUM(log_mults) × (pred_CPR − base_CPR)
    Sum of attribution_j across multipliers ≈ pred_CPR − base_CPR (within rounding).
    """
    # Restrict to most recent test period to keep the sample interpretable
    latest = sorted(df_test['period'].astype(str).unique())[-1]
    pool = df_test[df_test['period'].astype(str) == latest].copy()
    if len(pool) < n:
        pool = df_test.copy()
    if len(pool) == 0:
        return []

    # Score the pool, then stratified-sample by pred_CPR decile
    feats_pool = features_dict(pool)
    smm_pool = v7m.predict_smm(feats_pool, params)
    cpr_pool = (1 - (1 - smm_pool) ** 12) * 100
    pool = pool.assign(_cpr=cpr_pool).reset_index(drop=True)
    pool['_dec'] = pd.qcut(pool['_cpr'].rank(method='first'), 10, labels=False, duplicates='drop')

    per_dec = max(1, n // 10)
    rng = np.random.default_rng(42)
    chunks = []
    for dec in sorted(pool['_dec'].dropna().unique()):
        sub = pool[pool['_dec'] == dec]
        take_idx = rng.choice(len(sub), size=min(per_dec, len(sub)), replace=False)
        chunks.append(sub.iloc[take_idx])
    sample = pd.concat(chunks).reset_index(drop=True).head(n)

    # Compute multipliers + attribution per row
    feats = features_dict(sample)
    mults = v7m.compute_multipliers(feats, params)
    smm = v7m.predict_smm(feats, params)
    cpr = (1 - (1 - smm) ** 12) * 100
    base_cpr = float(smm_to_cpr(params['base_smm']))

    out = []
    for i in range(len(sample)):
        row = sample.iloc[i]
        log_mults = {name: math.log(max(float(mults[name][i]), 1e-9))
                     for name in v7m.MULTIPLIER_NAMES}
        sum_log = sum(log_mults.values())
        gap = float(cpr[i]) - base_cpr
        # If sum_log ≈ 0 (rare: all multipliers ≈ 1), attribution is 0 by definition
        attribution = {
            name: round(log_mults[name] / sum_log * gap, 4) if abs(sum_log) > 1e-9 else 0.0
            for name in v7m.MULTIPLIER_NAMES
        }
        # Helper: YYYYMMDD int/string → YYYY-MM display
        def yyyymm(v):
            try:
                s = str(int(float(v))).strip()
                if len(s) >= 6 and s[:4].isdigit() and s[4:6].isdigit():
                    return f"{s[:4]}-{s[4:6]}"
            except (TypeError, ValueError):
                pass
            return ''

        # Penalty schedule: keep first 18 chars of prepay_desc (most common is
        # "10,9,8,7,6,5,4,3,2,1,0" which fits)
        prepay_desc = str(row.get('prepay_desc', '') or '').strip()
        if len(prepay_desc) > 22:
            prepay_desc = prepay_desc[:22] + '…'

        out.append({
            'loan_id':       str(row['loan_id'])[-12:],
            'pool_cusip':    str(row.get('pool_cusip', ''))[:9],
            'period':        str(row['period']),
            'fha_category':  str(row.get('fha_category', '')),
            'loan_purpose':  str(row.get('loan_purpose', '')),
            'issuer':        str(row.get('issuer_name', ''))[:18],
            'state':         str(row.get('property_state', ''))[:2],
            'num_units':     int(row['num_units']) if pd.notna(row.get('num_units')) else None,
            # Loan terms (constant over a loan's life)
            'coupon_pct':    round(float(row['loan_rate']), 3) if pd.notna(row.get('loan_rate')) else None,
            'plc_pct':       round(float(row['plc_rate_bps']) / 100, 3) if pd.notna(row.get('plc_rate_bps')) else None,
            'vintage':       int(row['vintage_year']) if pd.notna(row.get('vintage_year')) else None,
            'origination':   yyyymm(row.get('origination_date')),
            'maturity_date': yyyymm(row.get('loan_maturity_date')),
            'orig_term_mo':  int(row['loan_term']) if pd.notna(row.get('loan_term')) else None,
            'orig_upb_M':    round(float(row['upb_at_issuance']) / 1e6, 2)
                              if pd.notna(row.get('upb_at_issuance')) else None,
            'upb_M':         round(float(row['upb']) / 1e6, 2),
            # Penalty / lockout (structural)
            'lockout_yrs':   int(row['lockout_term_yrs']) if pd.notna(row.get('lockout_term_yrs')) else 0,
            'prepay_yrs':    int(row['prepay_premium_period_yrs'])
                              if pd.notna(row.get('prepay_premium_period_yrs')) else 0,
            'lockout_end':   yyyymm(row.get('lockout_end_date')),
            'prepay_end':    yyyymm(row.get('prepay_end_date')),
            'prepay_desc':   prepay_desc,
            # Time-varying
            'age':           int(round(float(row['loan_age_months']))),
            'mtm':           int(round(float(row['months_to_maturity']))),
            'msle':          int(round(float(row['months_since_lockout_end']))),
            'burn_ratio':    round(float(row['burn_ratio']), 3),
            # Incentive
            'grf_bps':       round(float(row['gross_refi_incentive_bps']), 0),
            'ppp':           round(float(row['prepay_penalty_points']), 1),
            'net_refi_bps':  round(float(row['net_refi_incentive_bps']), 0),
            # Prediction
            'pred_smm':      round(float(smm[i]), 6),
            'pred_cpr':      round(float(cpr[i]), 2),
            'actual_prepay': int(row['prepaid_voluntary']),
            'multipliers':   {n: round(float(mults[n][i]), 4) for n in v7m.MULTIPLIER_NAMES},
            'attribution':   attribution,
        })
    return out


# ---------------------------------------------------------------------------
# Issuer residuals (separate artifact)
# ---------------------------------------------------------------------------
def build_issuer_residuals(df: pd.DataFrame, params: dict, min_n: int = 1000) -> dict:
    pred_smm = v7m.predict_smm(features_dict(df), params)
    work = df.assign(_pred=pred_smm,
                     _act=df['prepaid_voluntary'].astype(float).values).copy()
    rows = []
    for issuer_num, g in work.groupby('issuer_number'):
        if len(g) < min_n: continue
        actual = g['_act'].mean()
        pred = g['_pred'].mean()
        ratio = float(actual / max(pred, 1e-9))
        rows.append({
            'issuer_number': str(issuer_num),
            'issuer_name': str(g['issuer_name'].iloc[0]),
            'n': int(len(g)),
            'actual_smm': round(float(actual), 7),
            'pred_smm':   round(float(pred), 7),
            'residual_ratio': round(ratio, 4),
            'actual_cpr': round(float(smm_to_cpr(actual)), 4),
            'pred_cpr':   round(float(smm_to_cpr(pred)),   4),
        })
    rows.sort(key=lambda r: -r['n'])
    return {'description': 'Per-issuer empirical residual ratio (actual_smm / pred_smm). '
                            'Apply as optional overlay multiplier in dashboard / Excel. '
                            'Default 1.0 keeps the core model issuer-neutral.',
            'min_n': min_n,
            'issuers': rows}


# ---------------------------------------------------------------------------
# SanCap benchmark grid (informational)
# ---------------------------------------------------------------------------
def sancap_benchmark_grid(params: dict) -> list:
    scenarios = [
        ('ATM, avg penalty (5pp)',                      0,    5,  5e6,  '223(f)', 'RP', 60, 300, 0.2, 20),
        ('-50bp, avg penalty',                         -50,   5,  5e6,  '223(f)', 'RP', 60, 300, 0.2, 6),
        ('+50bp, avg penalty',                         +50,   5,  5e6,  '223(f)', 'RP', 60, 300, 0.2, 35),
        ('+100bp, avg penalty',                        +100,  5,  5e6,  '223(f)', 'RP', 60, 300, 0.2, 45),
        ('+100bp, 7% penalty',                         +100,  7,  5e6,  '223(f)', 'RP', 60, 300, 0.2, 30),
        ('+100bp, 9% penalty',                         +100,  9,  5e6,  '223(f)', 'RP', 60, 300, 0.2, 18),
        ('$5M @ +50bp',                                +50,   5,  5e6,  '223(f)', 'RP', 60, 300, 0.2, 20),
        ('$15M @ +50bp',                               +50,   5,  15e6, '223(f)', 'RP', 60, 300, 0.2, 40),
        ('NC @ +100bp, age 30m',                       +100,  5,  5e6,  '223(f)', 'NC', 30, 300, 0.2, 70),
        ('Rural-538 @ +100bp',                         +100,  5,  5e6,  '538',    'RP', 60, 300, 0.2, 10),
        ('HC-232 @ +100bp',                            +100,  5,  5e6,  '232',    'RP', 60, 300, 0.2, 30),
        ('msle=2 (post-lockout, ATM)',                 0,     5,  5e6,  '223(f)', 'RP', 60, 300, 0.2, 40),
    ]
    out = []
    for label, grf, ppp, upb, prog, purp, age, mtm, br, sancap_target in scenarios:
        # msle for the post-lockout scenario only
        msle = 2 if 'post-lockout' in label else 0
        net_refi = float(grf) - 12.5 * (float(ppp) + 1)
        # Translate program name to fha_code: SanCap uses '232', '538', '223(f)', etc.;
        # the panel uses bare-key form '232', '538', '223f', etc.
        prog_panel = prog.replace('(f)', 'f').replace('(a)(7)', 'a7')
        feats = {
            'loan_age_months':          np.array([float(age)]),
            'net_refi_incentive_bps':   np.array([net_refi]),
            'gross_refi_incentive_bps': np.array([float(grf)]),
            'prepay_penalty_points':    np.array([float(ppp)]),
            'log_upb':                  np.array([float(np.log1p(upb))]),
            'fha_category':             np.array([prog_panel]),
            'loan_purpose':             np.array([purp]),
            'months_since_lockout_end': np.array([float(msle)]),
            'months_to_maturity':       np.array([float(mtm)]),
            'burn_ratio':               np.array([float(br)]),
        }
        cpr = float(smm_to_cpr(v7m.predict_smm(feats, params)[0]))
        diverge = abs(cpr - sancap_target)
        out.append({'scenario': label,
                    'sancap_cpr': sancap_target,
                    'v7_pred_cpr': round(cpr, 2),
                    'divergence_pp': round(diverge, 2),
                    'flag': 'REVIEW' if diverge > 10 else 'ok'})
    return out


# ---------------------------------------------------------------------------
# Comparison-to-V6F block (for dashboard)
# ---------------------------------------------------------------------------
def build_comparison(v6f_path: Path, v7_test_auc, v7_test_logloss, v7_yearly, v7_cal):
    if not v6f_path.exists():
        return {'available': False}
    v6f = json.load(open(v6f_path))
    out = {
        'available': True,
        'v6f_test_auc':      v6f['metadata']['test_auc'],
        'v7_test_auc':       v7_test_auc,
        'auc_delta':         round(v7_test_auc - v6f['metadata']['test_auc'], 4),
        'v6f_log_loss':      v6f['metadata']['test_log_loss'],
        'v7_log_loss':       v7_test_logloss,
        'log_loss_delta':    round(v7_test_logloss - v6f['metadata']['test_log_loss'], 5),
        'v6f_n_features':    v6f['metadata']['n_features'],
    }
    v6f_year_map = {y['year']: y for y in v6f.get('yearly', [])}
    out['yearly_compare'] = []
    for yr in v7_yearly:
        ye = v6f_year_map.get(yr['year'], {})
        out['yearly_compare'].append({'year': yr['year'], 'n': yr['n'],
                                       'actual_cpr': yr['actual_cpr'],
                                       'v6f_pred_cpr': ye.get('pred_cpr'),
                                       'v7_pred_cpr':  yr['pred_cpr']})
    out['calibration_compare'] = []
    v6f_cal = v6f.get('calibration', [])
    for i, cv in enumerate(v7_cal):
        cv6 = v6f_cal[i] if i < len(v6f_cal) else {}
        out['calibration_compare'].append({'decile': cv['decile'],
                                            'v6f_pred_cpr':   cv6.get('pred_cpr'),
                                            'v6f_actual_cpr': cv6.get('actual_cpr'),
                                            'v7_pred_cpr':    cv['pred_cpr'],
                                            'v7_actual_cpr':  cv['actual_cpr']})
    return out


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--emit-dashboard',      action='store_true')
    parser.add_argument('--only-emit-dashboard', action='store_true')
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

    # Initial params: use the seed values
    init = copy.deepcopy(v7m.INITIAL_PARAMS)

    # Stage 1: empirical refinement on full train set (no downsampling)
    feats_train = features_dict(df_train)
    y_train = df_train['prepaid_voluntary'].astype(float).values
    params_s1 = stage1_refine(df_train, init, n_passes=3)

    # R5: build sample weights — up-weight 0-12m post-lockout rows so the
    # optimizer notices the ~9.5K-row post-lockout signal against 982K rows of
    # in-lockout/none.
    sample_weights = np.ones_like(y_train)
    msle_arr = feats_train['months_since_lockout_end']
    post_lockout_mask = (msle_arr > 0) & (msle_arr <= 12)
    sample_weights[post_lockout_mask] = 50.0
    print(f"\nSample weighting: {int(post_lockout_mask.sum()):,} post-lockout rows weighted 50×")

    # Stage 2: joint MLE on the FULL train set (no downsampling), with R5 weights.
    # Reasoning: Bernoulli MLE on rare events is well-behaved with proper
    # likelihood; downsampling biases multipliers up by ~(neg_ratio+1)x because
    # post-fit base-SMM correction can only adjust the constant, not the
    # multipliers that absorbed the inflated prevalence.
    params_s2, opt_result, schema = stage2_fit(feats_train, y_train, params_s1,
                                                max_iter=300, sample_weight=sample_weights)
    # Final calibration nudge on base_smm only (small correction; should be ~1.0)
    pred_full = v7m.predict_smm(feats_train, params_s2)
    correction = float(y_train.sum() / max(pred_full.sum(), 1e-9))
    params_s2['base_smm'] = float(np.clip(params_s2['base_smm'] * correction, 1e-5, 0.10))
    print(f"\nFinal base-SMM nudge: × {correction:.4f}  → base_smm = {params_s2['base_smm']:.5f}")

    # R3: re-anchor scale-equivariant multipliers (M_age, M_rate, M_program,
    # M_size) to have panel-mean = 1.0. Absorbs the panel mean of each into
    # base_smm. Predictions are unchanged; per-multiplier values become
    # interpretable as "factor relative to the average loan".
    params_s2 = reanchor_multipliers(params_s2, feats_train)

    # Final test-set diagnostics
    feats_test = features_dict(df_test)
    pred_test = v7m.predict_smm(feats_test, params_s2)
    y_test = df_test['prepaid_voluntary'].astype(float).values
    auc = roc_auc_score(y_test, pred_test) if y_test.sum() > 0 else float('nan')
    ll = log_loss(y_test, np.clip(pred_test, 1e-9, 1 - 1e-9))
    print(f"\nFinal V7: test AUC={auc:.4f}  test log_loss={ll:.5f}")

    # Tail-blowup check (Layer 2 verification, on full panel)
    pred_full_panel = v7m.predict_smm(features_dict(df), params_s2)
    cpr_full = smm_to_cpr(pred_full_panel)
    max_cpr = float(cpr_full.max())
    n_above_75 = int((cpr_full > 75).sum())
    n_above_90 = int((cpr_full > 90).sum())
    print(f"Tail-blowup check: max(pred_CPR over full panel) = {max_cpr:.2f}%  "
          f"(n>90% = {n_above_90}; n>75% = {n_above_75})")

    # SanCap benchmark grid (Layer 3, informational)
    grid = sancap_benchmark_grid(params_s2)
    print("\nSanCap benchmark grid:")
    for r in grid:
        flag = '⚠' if r['flag'] == 'REVIEW' else ' '
        print(f"  {flag} {r['scenario']:<35}  SanCap={r['sancap_cpr']:>4} CPR  V7={r['v7_pred_cpr']:>5.1f} CPR  Δ={r['divergence_pp']:>5.1f}pp")

    # Build all artifact arrays
    monthly, yearly = build_period_arrays(df_test, params_s2)
    scurve = build_scurve(df_test, params_s2)
    cal = build_calibration(pred_test, y_test)
    fha_cuts = build_cuts(df_test, 'fha_category', params_s2)
    lp_cuts  = build_cuts(df_test, 'loan_purpose',  params_s2)
    vintage_cuts = build_cuts(df_test, 'vintage_year', params_s2, ordered=True)
    age_cuts = build_bucket_cuts(df_test, 'loan_age_months',
                                 [-1, 12, 36, 60, 120, 180, 1e9],
                                 ['0-12m','12-36m','36-60m','60-120m','120-180m','180m+'], params_s2)
    mtm_cuts = build_bucket_cuts(df_test, 'months_to_maturity',
                                 [-1, 12, 24, 36, 60, 120, 1e9],
                                 ['0-12m','12-24m','24-36m','36-60m','60-120m','120m+'], params_s2)
    size_cuts = build_bucket_cuts(df_test, 'upb',
                                  [-1, 2e6, 5e6, 10e6, 25e6, 50e6, 1e10],
                                  ['<2M','2-5M','5-10M','10-25M','25-50M','50M+'], params_s2)
    post_lockout_cuts = build_bucket_cuts(df_test, 'months_since_lockout_end',
                                          [-1, 0, 6, 12, 18, 24, 1e9],
                                          ['in-lockout/none','0-6m','6-12m','12-18m','18-24m','>=24m'],
                                          params_s2)

    multiplier_curves = build_multiplier_curves(params_s2)
    attribution = build_attribution_loans(df_test, params_s2)
    sample_loans = build_sample_loans_table(df_test, params_s2, n=50)
    issuer_residuals = build_issuer_residuals(df, params_s2)
    comparison = build_comparison(V6F_JSON, auc, ll, yearly, cal)

    base_smm = float(df_train['prepaid_voluntary'].mean())
    artifact = {
        'metadata': {
            'training_pop_n':   int(is_train.sum()),
            'training_events':  int(y_train.sum()),
            'base_smm':         round(float(params_s2['base_smm']), 6),
            'base_cpr':         round(float(smm_to_cpr(params_s2['base_smm'])), 4),
            'panel_actual_smm': round(base_smm, 7),
            'panel_actual_cpr': round(float(smm_to_cpr(base_smm)), 4),
            'n_features':       9,                      # 9 multipliers
            'n_free_params':    len(v7m.pack_params(params_s2)[0]),
            'test_auc':         round(float(auc), 7),
            'test_log_loss':    round(float(ll), 7),
            'period_range':     [str(df['period'].min()), str(df['period'].max())],
            'last_period':      last_period,
            'model_version':    'v7',
            'description':      'V7 multiplicative voluntary prepayment model (9 bounded multipliers)',
            'max_cpr_full_panel': round(max_cpr, 2),
            'n_above_75_cpr':   n_above_75,
            'n_above_90_cpr':   n_above_90,
            'smm_cap':          float(params_s2['smm_cap']),
            'feature_list':     v7m.MULTIPLIER_NAMES,
            'feature_labels':   {n: n.replace('M_', '') for n in v7m.MULTIPLIER_NAMES},
        },
        'multipliers': params_s2,                   # parameters
        'multiplier_curves': multiplier_curves,     # rendered for dashboard
        'monthly': monthly, 'yearly': yearly, 'scurve': scurve,
        'calibration': cal,
        'fha_cuts': fha_cuts, 'lp_cuts': lp_cuts, 'vintage_cuts': vintage_cuts,
        'age_cuts': age_cuts, 'mtm_cuts': mtm_cuts, 'size_cuts': size_cuts,
        'post_lockout_cuts': post_lockout_cuts,
        'attribution_loans': attribution,
        'sample_loans':      sample_loans,
        'sancap_benchmarks': grid,
        'comparison_to_v6f': comparison,
    }

    OUT_JSON.write_text(json.dumps(artifact, indent=1, default=str))
    ISSUER_JSON.write_text(json.dumps(issuer_residuals, indent=1, default=str))
    print(f"\nWrote {OUT_JSON}  ({OUT_JSON.stat().st_size / 1024:.1f} KB)")
    print(f"Wrote {ISSUER_JSON}  ({ISSUER_JSON.stat().st_size / 1024:.1f} KB)")

    if args.emit_dashboard:
        emit_dashboard(artifact)


def emit_dashboard(v7_artifact: dict):
    if not DASHBOARD.exists():
        print(f"  Skipping --emit-dashboard: {DASHBOARD} not yet present")
        return
    src = DASHBOARD.read_text()
    v6f = json.load(open(V6F_JSON)) if V6F_JSON.exists() else {}
    issuer = json.load(open(ISSUER_JSON)) if ISSUER_JSON.exists() else {}
    v7_repl  = f'/* __MODEL_DATA_V7__ */ const MODEL_DATA_V7 = {json.dumps(v7_artifact)};'
    v6f_repl = f'/* __MODEL_DATA_V6F__ */ const MODEL_DATA_V6F = {json.dumps(v6f)};'
    iss_repl = f'/* __ISSUER_RESIDUALS__ */ const ISSUER_RESIDUALS = {json.dumps(issuer)};'
    new = re.sub(r'/\* __MODEL_DATA_V7__ \*/[^;]*?;',  lambda _: v7_repl,  src, count=1, flags=re.DOTALL)
    new = re.sub(r'/\* __MODEL_DATA_V6F__ \*/[^;]*?;', lambda _: v6f_repl, new, count=1, flags=re.DOTALL)
    new = re.sub(r'/\* __ISSUER_RESIDUALS__ \*/[^;]*?;', lambda _: iss_repl, new, count=1, flags=re.DOTALL)
    DASHBOARD.write_text(new)
    print(f"  Re-templated {DASHBOARD} ({len(new)/1024:.1f} KB)")


if __name__ == '__main__':
    main()
