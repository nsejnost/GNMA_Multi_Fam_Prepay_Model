"""
V7 Multiplicative Voluntary Prepayment Model - core multiplier functions.

This module is the single source of truth for V7's nine multipliers and the
final SMM/CPR composition. Imported by train_v7.py, validate_v7.py, and any
ad-hoc scoring script. Mirroring the same closed-form formulas, the Excel
calculator and v7_dashboard.jsx implement these multipliers in their own
languages — keep all three in sync when changing any function here.

Architecture (per plan):
    pred_SMM = base_SMM × M_age × M_rate × M_penalty × M_size
                       × M_program × M_purpose × M_lockout × M_maturity × M_burnout
    pred_SMM = MIN(pred_SMM, smm_cap)
    pred_CPR = 1 - (1 - pred_SMM)^12

Every parameter is fit by MLE on the panel; values shown in INITIAL_PARAMS are
seed values only.
"""
from __future__ import annotations
import math
from typing import Mapping
import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Initial seed parameters (priors from PDFs; replaced by fitted values after
# train_v7.py runs)
# ---------------------------------------------------------------------------
LOG_UPB_ANCHOR = math.log1p(2_000_000)   # = ln(1 + $2M); matches small_loan threshold

INITIAL_PARAMS: dict = {
    'base_smm':  0.0186,                  # CPR ≈ 20% baseline; calibrated post-fit
    'smm_cap':   0.10,                    # CPR ≈ 72%; structural blowup guard
    'M_age': {
        'knots_x': [0.0, 12.0, 36.0, 96.0, 180.0, 360.0],
        'knots_y': [0.30, 0.65, 1.00, 1.40, 1.20, 0.70],
    },
    'M_rate':     {'floor': 0.30, 'asymptote': 4.0, 'mid': 50.0, 'slope': 40.0},
    'M_penalty':  {'floor': 0.20, 'slope': -0.10, 'ppp_mean': 5.0},
    'M_size':     {'intercept': 0.6, 'slope': 0.25,
                   'log_upb_anchor': LOG_UPB_ANCHOR, 'low': 0.5, 'high': 1.8},
    'M_program':  {'232': 0.50, '538': 0.30, '223a7': 1.20,
                   '223f': 1.0, 'default': 1.0},
    'M_purpose':  {'NC_bump': 0.6, 'NC_decay': 60.0},
    'M_lockout':  {'amplitude': 1.0, 'tau': 4.0},
    'M_maturity': {'amplitude': 3.0, 'cutoff': 24.0},
    'M_burnout':  {'floor': 0.50, 'slope': 0.50},
}


# ---------------------------------------------------------------------------
# Individual multipliers
# ---------------------------------------------------------------------------
def m_age(age_months: np.ndarray, p: Mapping) -> np.ndarray:
    """Piecewise-linear seasoning multiplier interpolated through 6 knots."""
    return np.interp(np.asarray(age_months, dtype=float),
                     p['knots_x'], p['knots_y'],
                     left=p['knots_y'][0], right=p['knots_y'][-1])


def m_rate(grf_bps: np.ndarray, p: Mapping) -> np.ndarray:
    """4-parameter sigmoid S-curve on penalty-NEUTRAL gross refi incentive (bp)."""
    x = np.asarray(grf_bps, dtype=float)
    z = -(x - p['mid']) / p['slope']
    z = np.clip(z, -50, 50)        # numerical safety on exp
    return p['floor'] + p['asymptote'] / (1.0 + np.exp(z))


def m_penalty(ppp: np.ndarray, p: Mapping) -> np.ndarray:
    """Bounded linear penalty multiplier centered at panel-mean ppp.

    M = max(floor, 1 + slope · (ppp − ppp_mean)). Slope must be ≤ 0 (deterrent).
    """
    x = np.asarray(ppp, dtype=float)
    raw = 1.0 + p['slope'] * (x - p['ppp_mean'])
    return np.maximum(p['floor'], raw)


def m_size(log_upb: np.ndarray, p: Mapping) -> np.ndarray:
    """Smooth-log size multiplier clipped to [low, high]."""
    x = np.asarray(log_upb, dtype=float)
    raw = p['intercept'] + p['slope'] * (x - p['log_upb_anchor'])
    return np.clip(raw, p['low'], p['high'])


# Categorical encoding: fha_code uses an integer index aligned to PROGRAM_KEYS.
# Encode once at feature-derivation time (encode_fha_code below), then m_program
# is a pure numpy gather — critical for MLE evaluation speed on 1M-row training.
# Substring keys match the panel's fha_category notation (e.g., "223a7" not "223(a)(7)").
PROGRAM_KEYS = ['232', '538', '223a7', '223f']      # default = code 0
PROGRAM_CODE_DEFAULT = 0


def encode_fha_code(fha_category) -> np.ndarray:
    """Map fha_category strings to integer codes 0..4 (0=default, 1=232, 2=538, 3=223(a)(7), 4=223(f))."""
    s = pd.Series(np.asarray(fha_category, dtype=object)).astype(str)
    code = np.full(len(s), PROGRAM_CODE_DEFAULT, dtype=np.int8)
    # Order matters: more-specific patterns first
    for i, key in enumerate(PROGRAM_KEYS, start=1):
        # Substring match per the SanCap convention; treat e.g. "232/223(f)" as matching 232 first
        mask = s.str.contains(key, regex=False, na=False).values
        # Only assign code if not already assigned to an earlier (more-specific) pattern
        code = np.where((code == PROGRAM_CODE_DEFAULT) & mask, np.int8(i), code)
    return code


def encode_is_nc(loan_purpose) -> np.ndarray:
    """Map loan_purpose strings to a 0/1 NC flag."""
    s = pd.Series(np.asarray(loan_purpose, dtype=object)).astype(str).str.upper()
    return (s == 'NC').values.astype(np.int8)


def m_program(fha_code: np.ndarray, p: Mapping) -> np.ndarray:
    """Vectorized lookup via integer index. fha_code must be encode_fha_code()'d."""
    code = np.asarray(fha_code, dtype=np.int64)
    # Build a lookup vector: [default, 232, 538, 223(a)(7), 223(f)]
    lookup = np.array([p['default']] + [p[k] for k in PROGRAM_KEYS], dtype=float)
    return lookup[code]


def m_purpose(is_nc: np.ndarray, age_months: np.ndarray, p: Mapping) -> np.ndarray:
    """Vectorized NC bump on integer is_nc flag."""
    nc = np.asarray(is_nc, dtype=np.int64)
    age = np.asarray(age_months, dtype=float)
    decay = np.maximum(0.0, 1.0 - age / p['NC_decay'])
    bump = 1.0 + p['NC_bump'] * decay
    return np.where(nc == 1, bump, 1.0)


def m_lockout(msle: np.ndarray, p: Mapping) -> np.ndarray:
    """Spike-and-decay multiplier: 1 + amplitude·exp(−msle/tau) for msle ∈ (0, 12].

    msle = 0 means "still in lockout OR no lockout schedule"; multiplier = 1.0
    msle ∈ (0, 12] means "recently exited lockout"; multiplier > 1.0
    msle > 12 means "lockout-end pent-up demand has dissipated"; multiplier = 1.0
    """
    x = np.asarray(msle, dtype=float)
    surge = 1.0 + p['amplitude'] * np.exp(-x / p['tau'])
    in_window = (x > 0.0) & (x <= 12.0)
    return np.where(in_window, surge, 1.0)


def m_maturity(mtm: np.ndarray, p: Mapping) -> np.ndarray:
    """Continuous near-maturity ramp. mtm < cutoff → multiplier > 1; mtm ≥ cutoff → 1."""
    x = np.asarray(mtm, dtype=float)
    ramp = 1.0 + p['amplitude'] * np.maximum(0.0, (p['cutoff'] - x) / p['cutoff'])
    return np.where(x > 0.0, ramp, 1.0)        # mtm = 0 (already matured) → 1.0


def m_burnout(burn_ratio: np.ndarray, p: Mapping) -> np.ndarray:
    """Bounded linear burnout dampener. M = max(floor, 1 − slope · burn_ratio)."""
    x = np.clip(np.asarray(burn_ratio, dtype=float), 0.0, 1.0)
    raw = 1.0 - p['slope'] * x
    return np.maximum(p['floor'], raw)


# ---------------------------------------------------------------------------
# Composition (apply all multipliers, cap, annualize)
# ---------------------------------------------------------------------------
MULTIPLIER_NAMES = ['M_age', 'M_rate', 'M_penalty', 'M_size',
                    'M_program', 'M_purpose', 'M_lockout', 'M_maturity', 'M_burnout']


def compute_multipliers(features: dict, params: Mapping) -> dict[str, np.ndarray]:
    """Return a dict of arrays keyed by multiplier name.

    `features` is a dict of arrays with these keys:
       loan_age_months, gross_refi_incentive_bps, prepay_penalty_points,
       log_upb, fha_code (or fha_category), is_nc (or loan_purpose),
       months_since_lockout_end, months_to_maturity, burn_ratio

    fha_code and is_nc are pre-encoded integer arrays (see encode_fha_code,
    encode_is_nc) — fast path for repeated MLE evaluation. If absent, we fall
    back to encoding from the string columns (slow but convenient).
    """
    fha_code = features.get('fha_code')
    if fha_code is None:
        fha_code = encode_fha_code(features['fha_category'])
    is_nc = features.get('is_nc')
    if is_nc is None:
        is_nc = encode_is_nc(features['loan_purpose'])
    return {
        'M_age':     m_age     (features['loan_age_months'],          params['M_age']),
        'M_rate':    m_rate    (features['gross_refi_incentive_bps'], params['M_rate']),
        'M_penalty': m_penalty (features['prepay_penalty_points'],    params['M_penalty']),
        'M_size':    m_size    (features['log_upb'],                  params['M_size']),
        'M_program': m_program (fha_code,                              params['M_program']),
        'M_purpose': m_purpose (is_nc, features['loan_age_months'],   params['M_purpose']),
        'M_lockout': m_lockout (features['months_since_lockout_end'], params['M_lockout']),
        'M_maturity':m_maturity(features['months_to_maturity'],       params['M_maturity']),
        'M_burnout': m_burnout (features['burn_ratio'],               params['M_burnout']),
    }


def compose_smm(multipliers: dict[str, np.ndarray], params: Mapping) -> np.ndarray:
    """base_SMM × Π M_factor, capped at smm_cap."""
    product = np.ones_like(multipliers['M_age'])
    for name in MULTIPLIER_NAMES:
        product = product * multipliers[name]
    smm = params['base_smm'] * product
    return np.minimum(smm, params['smm_cap'])


def predict_smm(features: dict, params: Mapping) -> np.ndarray:
    """Convenience: features → predicted SMM (capped)."""
    return compose_smm(compute_multipliers(features, params), params)


def predict_cpr(features: dict, params: Mapping) -> np.ndarray:
    """SMM → annualized CPR (range [0, 1] not percent)."""
    return 1.0 - (1.0 - predict_smm(features, params)) ** 12


# ---------------------------------------------------------------------------
# Parameter packing/unpacking for scipy.optimize
# ---------------------------------------------------------------------------
# We pack all free parameters into a flat vector for joint MLE in Stage 2.
# Constraints (positivity, monotonicity) are enforced via reparameterization:
#   - positives  → exp(x)
#   - bounds [a,b] → a + (b-a) * sigmoid(x)
#   - free       → x

def pack_params(params: Mapping) -> tuple[np.ndarray, list]:
    """Flatten params dict into a vector + a schema for unpacking.

    Returns (theta, schema). theta is the optimization vector (unconstrained reals).
    schema is a list of (path_tuple, transform) entries used by unpack_params.
    """
    theta = []
    schema = []
    def push(value, path, transform):
        # Inverse-transform the seed value into unconstrained space
        if transform == 'free':
            theta.append(float(value))
        elif transform == 'log':
            theta.append(math.log(max(float(value), 1e-9)))
        elif transform == 'neglog':
            theta.append(math.log(max(-float(value), 1e-9)))
        elif transform.startswith('bounded:'):
            lo, hi = [float(x) for x in transform.split(':')[1].split(',')]
            v = float(value)
            v = min(max(v, lo + 1e-6), hi - 1e-6)
            # logit-transform into unconstrained
            t = (v - lo) / (hi - lo)
            theta.append(math.log(t / (1 - t)))
        else:
            raise ValueError(transform)
        schema.append((path, transform))

    # base_smm: bounded (0.0001, 0.05)
    push(params['base_smm'], ('base_smm',), 'bounded:0.0001,0.05')

    # M_age knots_y: each in (0.05, 5.0)
    for i, y in enumerate(params['M_age']['knots_y']):
        push(y, ('M_age', 'knots_y', i), 'bounded:0.05,5.0')

    # M_rate
    push(params['M_rate']['floor'],     ('M_rate', 'floor'),     'bounded:0.01,1.0')
    push(params['M_rate']['asymptote'], ('M_rate', 'asymptote'), 'bounded:0.5,15.0')
    push(params['M_rate']['mid'],       ('M_rate', 'mid'),       'free')
    push(params['M_rate']['slope'],     ('M_rate', 'slope'),     'log')   # > 0

    # M_penalty: floor bounded, slope must be < 0 → fit -slope > 0 via log
    push(params['M_penalty']['floor'], ('M_penalty', 'floor'), 'bounded:0.05,0.95')
    push(params['M_penalty']['slope'], ('M_penalty', 'slope'), 'neglog')

    # M_size: smooth log (intercept free, slope free, low/high frozen at seed)
    push(params['M_size']['intercept'], ('M_size', 'intercept'), 'free')
    push(params['M_size']['slope'],     ('M_size', 'slope'),     'free')

    # M_program: categorical multipliers (each bounded 0.05, 5.0)
    for k in ['232', '538', '223a7', '223f', 'default']:
        push(params['M_program'][k], ('M_program', k), 'bounded:0.05,5.0')

    # M_purpose
    push(params['M_purpose']['NC_bump'],  ('M_purpose', 'NC_bump'),  'bounded:0.0,3.0')
    push(params['M_purpose']['NC_decay'], ('M_purpose', 'NC_decay'), 'log')   # > 0

    # M_lockout
    push(params['M_lockout']['amplitude'], ('M_lockout', 'amplitude'), 'bounded:0.0,4.0')
    push(params['M_lockout']['tau'],       ('M_lockout', 'tau'),       'log')

    # M_maturity
    push(params['M_maturity']['amplitude'], ('M_maturity', 'amplitude'), 'bounded:0.0,8.0')
    push(params['M_maturity']['cutoff'],    ('M_maturity', 'cutoff'),    'log')

    # M_burnout: floor bounded, slope > 0 via log
    push(params['M_burnout']['floor'], ('M_burnout', 'floor'), 'bounded:0.05,0.95')
    push(params['M_burnout']['slope'], ('M_burnout', 'slope'), 'log')

    return np.array(theta), schema


def unpack_params(theta: np.ndarray, schema: list, template: Mapping) -> dict:
    """Inverse of pack_params: rebuild a params dict from theta using the schema.

    `template` provides the fixed structure (smm_cap, log_upb_anchor, low, high, ppp_mean,
    knots_x) that aren't in theta.
    """
    import copy
    out = copy.deepcopy(dict(template))
    for val, (path, transform) in zip(theta, schema):
        if transform == 'free':
            v = float(val)
        elif transform == 'log':
            v = math.exp(float(val))
        elif transform == 'neglog':
            v = -math.exp(float(val))
        elif transform.startswith('bounded:'):
            lo, hi = [float(x) for x in transform.split(':')[1].split(',')]
            v = lo + (hi - lo) / (1.0 + math.exp(-float(val)))
        else:
            raise ValueError(transform)
        # Walk path and assign
        node = out
        for key in path[:-1]:
            node = node[key]
        last = path[-1]
        if isinstance(last, int):
            # mutate list element
            node[last] = v
        else:
            node[last] = v
    return out
