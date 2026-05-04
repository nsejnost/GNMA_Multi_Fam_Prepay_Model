"""
V6F Voluntary Prepayment Model - training and diagnostics.

Differences from V6E (18 features) are documented in the plan file:
  - Drop:  refi_incentive_bps, in_prepay_penalty, cum_itm, loan_age_months
           (linear), iss_walker_dunlop, iss_berkadia, iss_merchants
  - Add:   gross_refi_incentive_bps, prepay_penalty_points (continuous),
           age_0_36, age_36_120, age_120plus (3-piece spline),
           months_to_maturity, pre_maturity_flag,
           months_since_lockout_end (capped 24),
           small_loan, large_loan,
           iss_greystone, iss_lument_combined
  - Optional interactions, gated by AUC lift > 0.005:
           age_0_36 x lp_NC, age_0_36 x is_hc_232,
           gross_refi_incentive_bps x prepay_penalty_points,
           iss_lument_combined x gross_refi_incentive_bps,
           iss_dwight x gross_refi_incentive_bps,
           iss_greystone x gross_refi_incentive_bps

Filter: prepay_eligible == 1 AND period != last_panel_period AND
        is_mature_loan != 1.

Estimator: sklearn LogisticRegression(C=1.0, L2), with 5:1 negative
downsampling on train split and post-fit prior correction.

Outputs (in this directory):
  - model_data_v6f.json   (canonical artifact, schema-compatible with V6E)
  - V6F_Excel_Calculator.xlsx is built separately by build_excel.py
  - v6f_dashboard.jsx is templated separately (--emit-dashboard flag below)

Usage:
  GNMA_PANEL_PARQUET=working/gnma_mf_panel.parquet python3 train_v6f.py
  python3 train_v6f.py --emit-dashboard   # rewrite v6f_dashboard.jsx in place
"""
from __future__ import annotations
import argparse, json, math, os, re, sys, warnings
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, log_loss

warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

HERE = Path(__file__).resolve().parent
PANEL_PATH = Path(os.environ.get('GNMA_PANEL_PARQUET', HERE / 'working' / 'gnma_mf_panel.parquet'))
OUT_JSON = HERE / 'model_data_v6f.json'
V6E_JSON = HERE / 'model_data_v6e.json'
DASHBOARD_TEMPLATE = HERE / 'v6f_dashboard.jsx'
SEED = 42
NEG_TO_POS_RATIO = 5
AUC_LIFT_THRESHOLD = 0.005

# --- V6F base feature list (canonical order; interactions appended only if they pass the gate) ---
BASE_FEATURES = [
    'gross_refi_incentive_bps', 'prepay_penalty_points',
    'age_0_36', 'age_36_120', 'age_120plus',
    'months_to_maturity', 'pre_maturity_flag',
    'months_since_lockout_end',
    'log_upb', 'small_loan', 'large_loan',
    'burn_ratio', 'is_post_covid',
    'is_223a7', 'is_538', 'is_hc_232', 'lp_NC',
    'iss_capital_funding', 'iss_pnc', 'iss_wells_fargo', 'iss_dwight',
    'iss_greystone', 'iss_lument_combined',
]

CANDIDATE_INTERACTIONS = [
    ('age_0_36__x__lp_NC', 'age_0_36', 'lp_NC'),
    ('age_0_36__x__is_hc_232', 'age_0_36', 'is_hc_232'),
    ('gross_refi__x__prepay_pen', 'gross_refi_incentive_bps', 'prepay_penalty_points'),
    ('iss_lument__x__gross_refi', 'iss_lument_combined', 'gross_refi_incentive_bps'),
    ('iss_dwight__x__gross_refi', 'iss_dwight', 'gross_refi_incentive_bps'),
    ('iss_greystone__x__gross_refi', 'iss_greystone', 'gross_refi_incentive_bps'),
]

FEATURE_LABELS = {
    'gross_refi_incentive_bps': 'Gross refi incentive (bp, penalty-neutral)',
    'prepay_penalty_points':   'Prepay penalty points (continuous 0-10)',
    'age_0_36':                'Age 0-36m (piecewise)',
    'age_36_120':              'Age 36-120m (piecewise)',
    'age_120plus':             'Age 120m+ (piecewise)',
    'months_to_maturity':      'Months to maturity',
    'pre_maturity_flag':       'Within 0-24m of maturity (1/0)',
    'months_since_lockout_end':'Months since lockout end (cap 24)',
    'log_upb':                 'Log UPB',
    'small_loan':              'UPB < $2M (1/0)',
    'large_loan':              'UPB > $50M (1/0)',
    'burn_ratio':              'Burnout ratio (cum_itm / age)',
    'is_post_covid':           'Post-COVID vintage (>=2021)',
    'is_223a7':                '223(a)(7) Streamlined refi',
    'is_538':                  '538 USDA Rural',
    'is_hc_232':               '232 Healthcare flag',
    'lp_NC':                   'Loan purpose: New Construction',
    'iss_capital_funding':     'Issuer: Capital Funding',
    'iss_pnc':                 'Issuer: PNC Bank',
    'iss_wells_fargo':         'Issuer: Wells Fargo',
    'iss_dwight':              'Issuer: Dwight Capital',
    'iss_greystone':           'Issuer: Greystone',
    'iss_lument_combined':     'Issuer: Lument (incl. Red Mortgage + Hunt)',
    # interactions get labels appended dynamically below
}

FEATURE_GROUPS = {
    'Rate & Penalty':          ['gross_refi_incentive_bps', 'prepay_penalty_points'],
    'Seasoning (piecewise)':   ['age_0_36', 'age_36_120', 'age_120plus'],
    'Maturity':                ['months_to_maturity', 'pre_maturity_flag'],
    'Post-lockout surge':      ['months_since_lockout_end'],
    'Size':                    ['log_upb', 'small_loan', 'large_loan'],
    'Burnout & Regime':        ['burn_ratio', 'is_post_covid'],
    'Program & Purpose':       ['is_223a7', 'is_538', 'is_hc_232', 'lp_NC'],
    'Issuer (Servicer)':       ['iss_capital_funding', 'iss_pnc', 'iss_wells_fargo',
                                'iss_dwight', 'iss_greystone', 'iss_lument_combined'],
    'Interactions':            [],  # populated post-gate
}

# Issuer name patterns for the dummies (must match build_excel.py for downstream consistency)
ISSUER_PATTERNS = {
    'iss_capital_funding': ['CAPITAL FUNDING'],
    'iss_pnc':             ['PNC BANK', 'PNC '],
    'iss_wells_fargo':     ['WELLS FARGO'],
    'iss_dwight':          ['DWIGHT'],
    'iss_greystone':       ['GREYSTONE'],
}
# Lument combined uses issuer_number, NOT name (rebrand-proof)
LUMENT_ISSUER_NUMBERS = {'3896', '3557'}


# -----------------------------------------------------------------------------
# 1. Load panel + derive V6F features
# -----------------------------------------------------------------------------
def load_and_engineer(panel_path: Path) -> tuple[pd.DataFrame, str]:
    print(f"Loading panel: {panel_path}")
    df = pd.read_parquet(panel_path)
    print(f"  Loaded {len(df):,} rows x {df.shape[1]} cols")

    # Periods are YYYYMM strings
    last_period = sorted(df['period'].astype(str).unique())[-1]
    print(f"  Last panel period (excluded from training): {last_period}")

    # Filter
    pre_filter = len(df)
    df = df[(df['prepay_eligible'] == 1)
            & (df['is_mature_loan'] != 1)
            & (df['period'].astype(str) != last_period)].copy()
    print(f"  Filtered to eligible, non-mature, non-last-period: {len(df):,} ({pre_filter - len(df):,} dropped)")

    # ----- Derived features -----

    # Piecewise age
    age = df['loan_age_months'].clip(lower=0).fillna(0)
    df['age_0_36']    = np.minimum(age, 36)
    df['age_36_120']  = np.minimum(np.maximum(age - 36, 0), 84)
    df['age_120plus'] = np.maximum(age - 120, 0)

    # Maturity
    period_dt = pd.to_datetime(df['period'].astype(str), format='%Y%m')
    mat_str = df['loan_maturity_date'].astype(str).str.strip()
    mat_dt = pd.to_datetime(mat_str, format='%Y%m%d', errors='coerce')
    mtm = ((mat_dt.dt.year - period_dt.dt.year) * 12 + (mat_dt.dt.month - period_dt.dt.month))
    mtm = mtm.fillna(360).clip(lower=0, upper=480).astype(float)
    df['months_to_maturity'] = mtm
    df['pre_maturity_flag']  = ((mtm > 0) & (mtm <= 24)).astype(int)

    # Months since lockout end (cap 24)
    lo_str = df['lockout_end_date'].astype(str).str.strip()
    lo_dt = pd.to_datetime(lo_str, format='%Y%m%d', errors='coerce')
    msle = ((period_dt.dt.year - lo_dt.dt.year) * 12 + (period_dt.dt.month - lo_dt.dt.month))
    # If no lockout date OR still in lockout OR lockout_term_yrs==0 -> 0
    msle = msle.where(msle.notna(), 0)
    msle = msle.clip(lower=0, upper=24)
    df['months_since_lockout_end'] = msle.astype(float)

    # Size
    upb = df['upb'].fillna(0).clip(lower=0)
    df['log_upb']    = np.log1p(upb)
    df['small_loan'] = (upb < 2_000_000).astype(int)
    df['large_loan'] = (upb > 50_000_000).astype(int)

    # Burnout (need cum_itm = cumulative count of months in-the-money for this loan
    # up to current period). Compute the same way V6E does.
    df = df.sort_values(['loan_id', 'period']).reset_index(drop=True)
    df['_itm'] = (df['refi_incentive_bps'].fillna(-9999) > 0).astype(int)
    df['cum_itm'] = df.groupby('loan_id')['_itm'].cumsum()
    df['burn_ratio'] = (df['cum_itm'] / np.maximum(df['loan_age_months'].fillna(1), 1)).clip(0, 5)
    df.drop(columns=['_itm'], inplace=True)

    # Post-COVID
    df['is_post_covid'] = (df['vintage_year'].fillna(0) >= 2021).astype(int)

    # Loan purpose
    df['lp_NC'] = (df['loan_purpose'].astype(str).str.upper() == 'NC').astype(int)

    # Issuer dummies
    iname = df['issuer_name'].astype(str).str.upper().fillna('')
    for col, patterns in ISSUER_PATTERNS.items():
        mask = pd.Series(False, index=df.index)
        for pat in patterns:
            mask = mask | iname.str.contains(re.escape(pat), regex=True, na=False)
        df[col] = mask.astype(int)
    df['iss_lument_combined'] = df['issuer_number'].astype(str).isin(LUMENT_ISSUER_NUMBERS).astype(int)

    # Gross refi already in panel; ensure no nulls
    df['gross_refi_incentive_bps'] = df['gross_refi_incentive_bps'].astype(float).fillna(0)
    df['prepay_penalty_points']    = df['prepay_penalty_points'].astype(float).fillna(0).clip(0, 10)

    # Existing pass-throughs from panel
    for col in ('is_223a7', 'is_538', 'is_hc_232'):
        df[col] = df[col].fillna(0).astype(int)

    # Drop any rows that still have NaN in any V6F feature (extremely rare)
    nans = df[BASE_FEATURES].isna().any(axis=1)
    if nans.any():
        print(f"  Dropping {nans.sum()} rows with NaN in V6F features")
        df = df[~nans].copy()

    print(f"  Final training-eligible rows: {len(df):,}")
    print(f"  Voluntary events in pool: {df['prepaid_voluntary'].sum():,}")
    return df, last_period


# -----------------------------------------------------------------------------
# 2. Train/test split, downsample, fit, prior-correct
# -----------------------------------------------------------------------------
def train_split(df: pd.DataFrame, seed: int = SEED) -> tuple[np.ndarray, np.ndarray]:
    """80/20 split by loan_id (deterministic)."""
    loans = df['loan_id'].unique()
    rng = np.random.default_rng(seed)
    shuf = rng.permutation(loans)
    cut = int(0.8 * len(shuf))
    train_loans = set(shuf[:cut])
    is_train = df['loan_id'].isin(train_loans).values
    return is_train, ~is_train


def downsample_train(X: np.ndarray, y: np.ndarray, ratio: int = NEG_TO_POS_RATIO,
                     seed: int = SEED) -> tuple[np.ndarray, np.ndarray, float]:
    """Keep all positives, sample <ratio>x as many negatives."""
    pos_idx = np.where(y == 1)[0]
    neg_idx = np.where(y == 0)[0]
    n_keep_neg = min(len(neg_idx), ratio * len(pos_idx))
    rng = np.random.default_rng(seed)
    keep_neg = rng.choice(neg_idx, size=n_keep_neg, replace=False)
    keep = np.concatenate([pos_idx, keep_neg])
    rng.shuffle(keep)
    p_train_pop = y.mean()
    p_train_ds  = len(pos_idx) / (len(pos_idx) + n_keep_neg)
    return X[keep], y[keep], p_train_ds / p_train_pop


def fit_logreg(X_train_z: np.ndarray, y_train: np.ndarray,
               C: float = 1.0) -> LogisticRegression:
    clf = LogisticRegression(C=C, solver='lbfgs', max_iter=1000, n_jobs=-1)
    clf.fit(X_train_z, y_train)
    return clf


def prior_correct(intercept: float, p_train_ds: float, p_pop: float) -> tuple[float, float]:
    """Adjust the intercept so predictions are calibrated to the population base rate."""
    correction = math.log((p_pop / (1 - p_pop)) / (p_train_ds / (1 - p_train_ds)))
    return intercept + correction, correction


# -----------------------------------------------------------------------------
# 3. Diagnostics builders
# -----------------------------------------------------------------------------
def build_period_arrays(df: pd.DataFrame, p: np.ndarray) -> tuple[list, list]:
    work = df.assign(_pred=p, _act=df['prepaid_voluntary'].astype(float).values).copy()
    monthly = []
    for per, g in work.groupby('period'):
        a, pr = g['_act'].mean(), g['_pred'].mean()
        monthly.append({
            'period': str(per),
            'n': int(len(g)),
            'actual_smm': round(a, 7),
            'pred_smm':   round(pr, 7),
            'actual_cpr': round((1 - (1 - a) ** 12) * 100, 4),
            'pred_cpr':   round((1 - (1 - pr) ** 12) * 100, 4),
        })
    yearly = []
    work['_year'] = work['period'].astype(str).str[:4].astype(int)
    for yr, g in work.groupby('_year'):
        a, pr = g['_act'].mean(), g['_pred'].mean()
        yearly.append({
            'year': int(yr),
            'n': int(len(g)),
            'actual_smm': round(a, 7),
            'pred_smm':   round(pr, 7),
            'actual_cpr': round((1 - (1 - a) ** 12) * 100, 4),
            'pred_cpr':   round((1 - (1 - pr) ** 12) * 100, 4),
        })
    return monthly, yearly


def build_scurve(df: pd.DataFrame, p: np.ndarray) -> list:
    edges = [-1e9, -300, -200, -100, -50, 0, 50, 100, 150, 200, 300, 500, 1e9]
    work = df.assign(_pred=p, _act=df['prepaid_voluntary'].astype(float).values,
                     _ri=df['gross_refi_incentive_bps']).copy()
    work['_buck'] = pd.cut(work['_ri'], edges, labels=False)
    out = []
    for b, g in work.groupby('_buck'):
        if len(g) == 0:
            continue
        a, pr = g['_act'].mean(), g['_pred'].mean()
        out.append({
            'ri_bucket': int(b),
            'n': int(len(g)),
            'ri_mid': round(g['_ri'].mean(), 2),
            'actual_smm': round(a, 7),
            'pred_smm':   round(pr, 7),
            'actual_cpr': round((1 - (1 - a) ** 12) * 100, 4),
            'pred_cpr':   round((1 - (1 - pr) ** 12) * 100, 4),
        })
    return out


def build_calibration(p: np.ndarray, y: np.ndarray, n_deciles: int = 10) -> list:
    df = pd.DataFrame({'p': p, 'y': y})
    df['_dec'] = pd.qcut(df['p'].rank(method='first'), n_deciles, labels=False)
    out = []
    for dec, g in df.groupby('_dec'):
        a, pr = g['y'].mean(), g['p'].mean()
        out.append({
            'decile': int(dec),
            'n': int(len(g)),
            'pred_smm':   round(pr, 7),
            'actual_smm': round(a, 7),
            'pred_cpr':   round((1 - (1 - pr) ** 12) * 100, 4),
            'actual_cpr': round((1 - (1 - a) ** 12) * 100, 4),
        })
    return out


def build_cuts(df: pd.DataFrame, p: np.ndarray, key: str, ordered: bool = False) -> list:
    work = df.assign(_pred=p, _act=df['prepaid_voluntary'].astype(float).values).copy()
    out = []
    grouped = work.groupby(key)
    keys = sorted(grouped.groups.keys()) if ordered else list(grouped.groups.keys())
    for k in keys:
        g = grouped.get_group(k)
        if len(g) == 0:
            continue
        a, pr = g['_act'].mean(), g['_pred'].mean()
        out.append({
            'key': str(k),
            'n': int(len(g)),
            'actual_smm': round(a, 7),
            'pred_smm':   round(pr, 7),
            'actual_cpr': round((1 - (1 - a) ** 12) * 100, 4),
            'pred_cpr':   round((1 - (1 - pr) ** 12) * 100, 4),
        })
    return out


def build_bucket_cuts(df: pd.DataFrame, p: np.ndarray, col: str, edges: list, labels: list) -> list:
    work = df.assign(_pred=p, _act=df['prepaid_voluntary'].astype(float).values).copy()
    work['_b'] = pd.cut(work[col], edges, labels=labels, include_lowest=True)
    out = []
    for lab in labels:
        g = work[work['_b'] == lab]
        if len(g) == 0:
            continue
        a, pr = g['_act'].mean(), g['_pred'].mean()
        out.append({
            'key': str(lab),
            'n': int(len(g)),
            'actual_smm': round(a, 7),
            'pred_smm':   round(pr, 7),
            'actual_cpr': round((1 - (1 - a) ** 12) * 100, 4),
            'pred_cpr':   round((1 - (1 - pr) ** 12) * 100, 4),
        })
    return out


def build_issuer_scurves(df: pd.DataFrame, p: np.ndarray) -> dict:
    """Per-issuer S-curves over the same RI buckets."""
    edges = [-1e9, -300, -200, -100, -50, 0, 50, 100, 150, 200, 300, 500, 1e9]
    work = df.assign(_pred=p, _act=df['prepaid_voluntary'].astype(float).values,
                     _ri=df['gross_refi_incentive_bps']).copy()
    work['_buck'] = pd.cut(work['_ri'], edges, labels=False)
    issuer_cols = [c for c in BASE_FEATURES if c.startswith('iss_')]
    out = {}
    # Each iss_* dummy gets its own S-curve; "other" = none of the dummies set
    for ic in issuer_cols:
        sub = work[work[ic] == 1]
        if len(sub) < 1000:
            continue
        rows = []
        for b, g in sub.groupby('_buck'):
            if len(g) < 50:
                continue
            a, pr = g['_act'].mean(), g['_pred'].mean()
            rows.append({
                'ri_bucket': int(b),
                'n': int(len(g)),
                'ri_mid': round(g['_ri'].mean(), 2),
                'actual_cpr': round((1 - (1 - a) ** 12) * 100, 4),
                'pred_cpr':   round((1 - (1 - pr) ** 12) * 100, 4),
            })
        out[ic] = rows
    # "Other" issuers (none of the iss_ dummies set)
    other_mask = (work[issuer_cols].sum(axis=1) == 0)
    sub = work[other_mask]
    if len(sub) > 1000:
        rows = []
        for b, g in sub.groupby('_buck'):
            if len(g) < 50:
                continue
            a, pr = g['_act'].mean(), g['_pred'].mean()
            rows.append({
                'ri_bucket': int(b),
                'n': int(len(g)),
                'ri_mid': round(g['_ri'].mean(), 2),
                'actual_cpr': round((1 - (1 - a) ** 12) * 100, 4),
                'pred_cpr':   round((1 - (1 - pr) ** 12) * 100, 4),
            })
        out['_other'] = rows
    return out


# -----------------------------------------------------------------------------
# 4. Sample loan attribution
# -----------------------------------------------------------------------------
def build_attribution_loans(df: pd.DataFrame, features: list, means: np.ndarray, stds: np.ndarray,
                            beta_scaled: np.ndarray, intercept_scaled: float, n: int = 8) -> list:
    """Pick representative loans and compute per-feature contribution_logit."""
    # Use the latest period in the training set; pick one per (fha_category x loan_purpose) cell
    latest = sorted(df['period'].astype(str).unique())[-1]
    cands = df[df['period'].astype(str) == latest].copy()
    if len(cands) == 0:
        cands = df.copy()
    archetypes = []
    seen = set()
    for fha, lp in (('232', 'RP'), ('223(F)', 'RP'), ('221(D)(4)', 'NC'),
                    ('223(A)(7)', 'RP'), ('538', 'RP'), ('OTHER', 'RP'),
                    ('232', 'NC'), ('223(F)', 'NC')):
        sub = cands[(cands['fha_category'].astype(str).str.contains(fha, regex=False, na=False))
                    & (cands['loan_purpose'].astype(str) == lp)]
        if len(sub) == 0:
            continue
        # Median UPB pick for representativeness
        sub2 = sub.iloc[(sub['upb'].rank() - len(sub) / 2).abs().argsort()[:1]]
        if len(sub2) == 0:
            continue
        loan = sub2.iloc[0]
        key = f"{fha}_{lp}"
        if key in seen:
            continue
        seen.add(key)
        archetypes.append((key, loan))
        if len(archetypes) >= n:
            break

    out = []
    for key, loan in archetypes:
        x_native = np.array([float(loan[f]) for f in features])
        x_std = (x_native - means) / np.where(stds > 0, stds, 1)
        contribs = x_std * beta_scaled
        logit_z = intercept_scaled + contribs.sum()
        smm = 1 / (1 + math.exp(-logit_z))
        cpr = 1 - (1 - smm) ** 12
        # Issuer key for display
        iname = str(loan.get('issuer_name', '') or '').strip()
        out.append({
            'label': key,
            'archetype_id': key,
            'loan_id': str(loan['loan_id']),
            'period': str(loan['period']),
            'fha_category': str(loan.get('fha_category', '')),
            'loan_purpose': str(loan.get('loan_purpose', '')),
            'issuer_key': iname[:30],
            'logit_z': round(logit_z, 4),
            'pred_smm': round(smm, 7),
            'pred_cpr': round(cpr * 100, 4),
            'actual_prepay': int(loan['prepaid_voluntary']),
            'contributions': [
                {
                    'feature': f,
                    'x_native': round(float(loan[f]), 4),
                    'x_std':    round(float((loan[f] - means[i]) / (stds[i] if stds[i] > 0 else 1)), 5),
                    'contribution_logit': round(float(contribs[i]), 4),
                }
                for i, f in enumerate(features)
            ],
        })
    return out


# -----------------------------------------------------------------------------
# 5. Comparison-to-V6E block (pulled from existing JSON for the dashboard)
# -----------------------------------------------------------------------------
def build_comparison(v6e_path: Path, v6f_test_auc: float, v6f_test_logloss: float,
                     v6f_yearly: list, v6f_cal: list) -> dict:
    if not v6e_path.exists():
        return {'available': False}
    v6e = json.load(open(v6e_path))
    out = {
        'available': True,
        'v6e_test_auc': v6e['metadata']['test_auc'],
        'v6f_test_auc': v6f_test_auc,
        'auc_delta':    round(v6f_test_auc - v6e['metadata']['test_auc'], 4),
        'v6e_log_loss': v6e['metadata']['test_log_loss'],
        'v6f_log_loss': v6f_test_logloss,
        'log_loss_delta': round(v6f_test_logloss - v6e['metadata']['test_log_loss'], 5),
        'v6e_n_features': v6e['metadata']['n_features'],
    }
    # Per-year side-by-side
    v6e_year_map = {y['year']: y for y in v6e.get('yearly', [])}
    out['yearly_compare'] = []
    for yf in v6f_yearly:
        ye = v6e_year_map.get(yf['year'], {})
        out['yearly_compare'].append({
            'year': yf['year'],
            'n': yf['n'],
            'actual_cpr': yf['actual_cpr'],
            'v6e_pred_cpr': ye.get('pred_cpr'),
            'v6f_pred_cpr': yf['pred_cpr'],
        })
    # Per-decile side-by-side (note: deciles are ordinal; not directly aligned, but indicative)
    out['calibration_compare'] = []
    v6e_cal = v6e.get('calibration', [])
    for i, vf in enumerate(v6f_cal):
        ve = v6e_cal[i] if i < len(v6e_cal) else {}
        out['calibration_compare'].append({
            'decile': vf['decile'],
            'v6e_pred_cpr':   ve.get('pred_cpr'),
            'v6e_actual_cpr': ve.get('actual_cpr'),
            'v6f_pred_cpr':   vf['pred_cpr'],
            'v6f_actual_cpr': vf['actual_cpr'],
        })
    return out


# -----------------------------------------------------------------------------
# 6. Main: orchestrate
# -----------------------------------------------------------------------------
def evaluate_features(df: pd.DataFrame, features: list, is_train: np.ndarray,
                      is_test: np.ndarray, label: str = '') -> dict:
    """Standardize, fit, prior-correct, return artifacts and metrics. y is df['prepaid_voluntary']."""
    y_full = df['prepaid_voluntary'].astype(int).values
    X_full = df[features].astype(float).values
    means = X_full[is_train].mean(axis=0)
    stds  = X_full[is_train].std(axis=0)
    stds_safe = np.where(stds > 0, stds, 1.0)
    X_z = (X_full - means) / stds_safe

    X_tr_ds, y_tr_ds, ds_factor = downsample_train(X_z[is_train], y_full[is_train])
    p_pop = y_full[is_train].mean()
    p_ds  = y_tr_ds.mean()
    clf = fit_logreg(X_tr_ds, y_tr_ds)
    intercept_scaled_raw = float(clf.intercept_[0])
    intercept_scaled, prior_corr = prior_correct(intercept_scaled_raw, p_ds, p_pop)
    beta_scaled = clf.coef_[0]

    # Prediction on FULL set with prior-corrected intercept
    logit_full = intercept_scaled + X_z @ beta_scaled
    p_full = 1.0 / (1.0 + np.exp(-logit_full))

    # Test metrics
    y_te = y_full[is_test]; p_te = p_full[is_test]
    auc = roc_auc_score(y_te, p_te) if y_te.sum() > 0 else float('nan')
    ll  = log_loss(y_te, np.clip(p_te, 1e-9, 1 - 1e-9))

    if label:
        print(f"  [{label}] features={len(features):2d}  test_AUC={auc:.4f}  test_logloss={ll:.5f}")
    return {
        'features': features, 'means': means, 'stds': stds_safe,
        'beta_scaled': beta_scaled, 'intercept_scaled': intercept_scaled,
        'intercept_raw': intercept_scaled_raw, 'prior_correction': prior_corr,
        'p_full': p_full, 'p_pop': p_pop, 'p_ds': p_ds,
        'test_auc': auc, 'test_log_loss': ll,
        'training_pop_n': int(is_train.sum()), 'training_events': int(y_full[is_train].sum()),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--no-interactions', action='store_true',
                        help='Skip the optional-interaction gate (faster smoke runs).')
    parser.add_argument('--emit-dashboard', action='store_true',
                        help='Re-template v6f_dashboard.jsx in place after training.')
    parser.add_argument('--only-emit-dashboard', action='store_true',
                        help='Skip training; only re-template v6f_dashboard.jsx from existing JSON.')
    args = parser.parse_args()

    if args.only_emit_dashboard:
        if not OUT_JSON.exists():
            sys.exit(f"ERROR: {OUT_JSON} not found - train first.")
        artifact = json.load(open(OUT_JSON))
        emit_dashboard(artifact)
        return

    if not PANEL_PATH.exists():
        sys.exit(f"ERROR: panel parquet not found at {PANEL_PATH}")

    df, last_period = load_and_engineer(PANEL_PATH)
    is_train, is_test = train_split(df)
    print(f"  Train rows: {is_train.sum():,}  Test rows: {is_test.sum():,}")
    print(f"  Train events: {df.loc[is_train, 'prepaid_voluntary'].sum():,}")
    print(f"  Test  events: {df.loc[is_test, 'prepaid_voluntary'].sum():,}")

    # 6a. Base fit
    base = evaluate_features(df, BASE_FEATURES, is_train, is_test, label='base')

    # 6b. Optional interactions: greedy AUC-lift gate (each tested independently against base)
    accepted_inter = []
    base_auc = base['test_auc']
    if not args.no_interactions:
        print()
        print("Testing candidate interactions (gate: AUC lift > 0.005)")
        df_aug = df.copy()
        for name, a, b in CANDIDATE_INTERACTIONS:
            df_aug[name] = df_aug[a] * df_aug[b]
            trial_features = BASE_FEATURES + [n for n, _, _ in accepted_inter] + [name]
            trial = evaluate_features(df_aug, trial_features, is_train, is_test, label=name)
            lift = trial['test_auc'] - base_auc
            if lift > AUC_LIFT_THRESHOLD:
                accepted_inter.append((name, a, b))
                base_auc = trial['test_auc']
                print(f"    -> ACCEPT (lift={lift:+.4f})")
            else:
                print(f"    -> reject (lift={lift:+.4f})")

    # 6c. Final fit with accepted interactions
    final_features = BASE_FEATURES + [n for n, _, _ in accepted_inter]
    if accepted_inter:
        df_final = df.copy()
        for name, a, b in accepted_inter:
            df_final[name] = df_final[a] * df_final[b]
            FEATURE_LABELS[name] = f"Interaction: {a} x {b}"
            FEATURE_GROUPS['Interactions'].append(name)
    else:
        df_final = df

    final = evaluate_features(df_final, final_features, is_train, is_test, label='final')

    # ---- Build diagnostic blocks ----
    p_full = final['p_full']
    means, stds = final['means'], final['stds']
    beta_scaled = final['beta_scaled']
    intercept_scaled = final['intercept_scaled']

    print()
    print(f"Final V6F: AUC={final['test_auc']:.4f}  log_loss={final['test_log_loss']:.5f}")
    print(f"  features ({len(final_features)}): {final_features}")
    print(f"  intercept_scaled={intercept_scaled:.4f}  prior_correction={final['prior_correction']:.4f}")

    # Coefficient table
    coef_records = []
    abs_betas = np.abs(beta_scaled)
    for i, f in enumerate(final_features):
        std_i = stds[i] if stds[i] > 0 else 1.0
        coef_records.append({
            'feature': f,
            'label': FEATURE_LABELS.get(f, f),
            'group': next((g for g, items in FEATURE_GROUPS.items() if f in items), ''),
            'beta_scaled': round(float(beta_scaled[i]), 6),
            'beta_native': round(float(beta_scaled[i] / std_i), 8),
            'mean': round(float(means[i]), 6),
            'std':  round(float(std_i), 6),
            'importance': round(float(abs_betas[i]), 6),
        })

    feature_stats = {}
    for f in final_features:
        col = df_final[f].astype(float)
        feature_stats[f] = {
            'min': round(float(col.min()), 6),
            'p5':  round(float(col.quantile(0.05)), 6),
            'p25': round(float(col.quantile(0.25)), 6),
            'mean': round(float(col.mean()), 6),
            'p75': round(float(col.quantile(0.75)), 6),
            'p95': round(float(col.quantile(0.95)), 6),
            'max': round(float(col.max()), 6),
        }

    # Subset on test for fits
    df_test_view = df_final.loc[is_test].copy()
    p_test = p_full[is_test]
    monthly, yearly = build_period_arrays(df_test_view, p_test)
    scurve = build_scurve(df_test_view, p_test)
    calibration = build_calibration(p_test, df_test_view['prepaid_voluntary'].values)

    # Cohort cuts (used by dashboard "Cohort cuts" tab)
    fha_cuts = build_cuts(df_test_view, p_test, 'fha_category')
    lp_cuts  = build_cuts(df_test_view, p_test, 'loan_purpose')
    vintage_cuts = build_cuts(df_test_view, p_test, 'vintage_year', ordered=True)
    age_cuts = build_bucket_cuts(df_test_view, p_test, 'loan_age_months',
                                 [-1, 12, 36, 60, 120, 180, 1e9],
                                 ['0-12m', '12-36m', '36-60m', '60-120m', '120-180m', '180m+'])
    mtm_cuts = build_bucket_cuts(df_test_view, p_test, 'months_to_maturity',
                                 [-1, 12, 24, 36, 60, 120, 1e9],
                                 ['0-12m', '12-24m', '24-36m', '36-60m', '60-120m', '120m+'])
    size_cuts = build_bucket_cuts(df_test_view, p_test, 'upb',
                                  [-1, 2e6, 5e6, 10e6, 25e6, 50e6, 1e10],
                                  ['<2M', '2-5M', '5-10M', '10-25M', '25-50M', '50M+'])
    post_lockout_cuts = build_bucket_cuts(df_test_view, p_test, 'months_since_lockout_end',
                                           [-1, 0, 6, 12, 18, 24, 1e9],
                                           ['in-lockout/none', '0-6m', '6-12m', '12-18m', '18-24m', '>=24m'])
    issuer_cuts = []
    for ic in [c for c in BASE_FEATURES if c.startswith('iss_')] + ['_other']:
        if ic == '_other':
            mask = (df_test_view[[c for c in BASE_FEATURES if c.startswith('iss_')]].sum(axis=1) == 0)
            label_key = 'other'
        else:
            mask = (df_test_view[ic] == 1)
            label_key = ic
        sub = df_test_view[mask]
        sub_p = p_test[mask.values]
        if len(sub) < 100:
            continue
        a = sub['prepaid_voluntary'].mean(); pr = sub_p.mean()
        issuer_cuts.append({
            'key': label_key,
            'n': int(len(sub)),
            'actual_smm': round(float(a), 7),
            'pred_smm':   round(float(pr), 7),
            'actual_cpr': round(float((1 - (1 - a) ** 12) * 100), 4),
            'pred_cpr':   round(float((1 - (1 - pr) ** 12) * 100), 4),
        })

    issuer_scurves = build_issuer_scurves(df_test_view, p_test)

    # Attribution sample loans
    attribution_loans = build_attribution_loans(
        df_final.loc[is_test], final_features,
        means, stds, beta_scaled, intercept_scaled,
    )

    # Top issuers + name map (used for issuer dropdowns in dashboard)
    iss_counts = (df_final.loc[is_train, 'issuer_name'].astype(str).value_counts()
                  .head(15).to_dict())
    top_issuers = list(iss_counts.keys())
    issuer_name_map = {k: k for k in top_issuers}

    # Comparison to V6E
    comparison = build_comparison(V6E_JSON, final['test_auc'], final['test_log_loss'],
                                  yearly, calibration)

    # Final JSON
    base_smm = float(df.loc[is_train, 'prepaid_voluntary'].mean())
    artifact = {
        'metadata': {
            'training_pop_n': int(final['training_pop_n']),
            'training_events': int(final['training_events']),
            'base_smm': round(base_smm, 7),
            'base_cpr': round((1 - (1 - base_smm) ** 12) * 100, 4),
            'n_features': len(final_features),
            'test_auc':      round(float(final['test_auc']), 7),
            'test_log_loss': round(float(final['test_log_loss']), 7),
            'prior_correction': round(float(final['prior_correction']), 6),
            'period_range': [
                str(min(df['period'].astype(str))), str(max(df['period'].astype(str)))
            ],
            'feature_list': final_features,
            'feature_groups': {g: [f for f in items if f in final_features]
                               for g, items in FEATURE_GROUPS.items()
                               if any(f in final_features for f in items)},
            'feature_labels': {f: FEATURE_LABELS.get(f, f) for f in final_features},
            'intercept_scaled': round(float(intercept_scaled), 6),
            'intercept_native': None,  # native intercept depends on feature centering; coef table has beta_native
            'last_period': last_period,
            'top_issuers': top_issuers,
            'issuer_name_map': issuer_name_map,
            'model_version': 'v6f',
            'description': 'V6F voluntary prepayment model (logistic, base + selective interactions)',
        },
        'coefficients': coef_records,
        'feature_stats': feature_stats,
        'monthly': monthly,
        'yearly':  yearly,
        'scurve':  scurve,
        'calibration': calibration,
        'fha_cuts': fha_cuts,
        'lp_cuts':  lp_cuts,
        'vintage_cuts': vintage_cuts,
        'age_cuts': age_cuts,
        'mtm_cuts': mtm_cuts,
        'size_cuts': size_cuts,
        'post_lockout_cuts': post_lockout_cuts,
        'issuer_cuts': issuer_cuts,
        'issuer_scurves': issuer_scurves,
        'attribution_loans': attribution_loans,
        'comparison_to_v6e': comparison,
        'accepted_interactions': [
            {'name': n, 'left': a, 'right': b} for n, a, b in accepted_inter
        ],
    }

    OUT_JSON.write_text(json.dumps(artifact, indent=1, default=str))
    print(f"\nWrote {OUT_JSON}  ({OUT_JSON.stat().st_size/1024:.1f} KB)")

    # Optionally emit the dashboard
    if args.emit_dashboard:
        emit_dashboard(artifact)


def emit_dashboard(v6f_artifact: dict):
    """Replace the placeholder MODEL_DATA_V6F / V6E blocks in v6f_dashboard.jsx.

    Uses lambda replacements so JSON's \\u escapes are not interpreted as regex backrefs.
    """
    if not DASHBOARD_TEMPLATE.exists():
        print(f"  Skipping --emit-dashboard: {DASHBOARD_TEMPLATE} not present yet")
        return
    src = DASHBOARD_TEMPLATE.read_text()
    v6e = json.load(open(V6E_JSON)) if V6E_JSON.exists() else {}
    v6f_repl = f'/* __MODEL_DATA_V6F__ */ const MODEL_DATA_V6F = {json.dumps(v6f_artifact)};'
    v6e_repl = f'/* __MODEL_DATA_V6E__ */ const MODEL_DATA_V6E = {json.dumps(v6e)};'
    new = re.sub(r'/\* __MODEL_DATA_V6F__ \*/[^;]*?;',
                 lambda _m: v6f_repl, src, count=1, flags=re.DOTALL)
    new = re.sub(r'/\* __MODEL_DATA_V6E__ \*/[^;]*?;',
                 lambda _m: v6e_repl, new, count=1, flags=re.DOTALL)
    DASHBOARD_TEMPLATE.write_text(new)
    print(f"  Re-templated {DASHBOARD_TEMPLATE} ({len(new)/1024:.1f} KB) with fresh MODEL_DATA")


if __name__ == '__main__':
    main()
