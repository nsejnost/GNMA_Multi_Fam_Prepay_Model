"""
V9 Cohort-Based S-Curve Voluntary Prepayment Model — core functions.

Differences vs V8.1:
  R1. Richards 5-param S-curve replaces the symmetric 4-param logistic.
      S(x) = floor + asymp / (1 + exp(-(x-mid)/slope))^(1/asym_factor)
      asym_factor=1 → symmetric (V8.1 behavior); >1 slower-rising right side;
      <1 faster-rising right side. One extra free param per cohort.

  R2. Per-cohort min/max bounds informed by program class. Replaces V8.1's
      global (floor ∈ [0,0.05], asymp ∈ [0,0.20]). 538/rural cohorts get
      tight ceilings (~38 CPR); 223a7 streamlined refi gets generous ones
      (~99 CPR). Resolves V8.1's "asymp_pinned" boundary issue cleanly.

  R3. Wider bounds on V7 structural multipliers (M_lockout amplitude up to 8;
      M_maturity amplitude up to 16). Implemented in train_v9.py via a
      structural-multiplier refit step (V7's training is left frozen).

  R5. Age_ramp anchor at each cohort's MEDIAN AGE rather than the global 96m
      knot. The cohort's sigmoid params then describe the rate response at
      the cohort's typical age (Case B with cohort-specific a₀), removing
      the V8.1 hypothetical-projection issue for non-seasoned cohorts.
"""
from __future__ import annotations
import math
from typing import Mapping
import numpy as np
import pandas as pd

import v7_multipliers as v7m

# ---------------------------------------------------------------------------
# Cohort axes — same as V8.1 (program × purpose × size × age_bucket)
# ---------------------------------------------------------------------------
PROGRAM_KEYS = ['232', '538', '223a7', '223f', 'OTHER']
PURPOSE_KEYS = ['NC', 'RP']

SIZE_BUCKET_BREAKS = [0.0, 5_000_000.0, 25_000_000.0, np.inf]
SIZE_BUCKET_KEYS = ['small', 'medium', 'large']

AGE_BUCKET_BREAKS = [0.0, 36.0, 120.0, np.inf]
AGE_BUCKET_KEYS = ['young', 'seasoned', 'aged']

AGE_RAMP_KNOTS_X = np.array([0.0, 24.0, 96.0, 240.0])
AGE_RAMP_INITIAL_Y = np.array([0.30, 0.85, 1.00, 0.80])

# ---------------------------------------------------------------------------
# R2: Per-program cohort bounds for sigmoid parameters
#
# floor  = SMM at deep-OTM (housing turnover baseline; similar across programs)
# asymp  = SMM spread from floor to ceiling (deep-ITM); varies by program
# Bounds reflect empirical cohort behavior in the 2018-2026 panel:
#   538 (rural)            : ceiling ~ 18 CPR  → asymp_max 0.018
#   232 (healthcare)       : ceiling ~ 70 CPR  → asymp_max 0.10
#   223a7 (streamlined)    : ceiling ~ 99 CPR  → asymp_max 0.30
#   223f (acquisition/refi): ceiling ~ 92 CPR  → asymp_max 0.22
#   OTHER (220, 221d4, etc): mixed ; conservative 0.20
# Slope and mid have looser bounds (input is bp; can shift across cohorts).
# Asym_factor (R1) bounded so symmetric (=1) is in the interior; allows mild
# asymmetry without wild deformation.
# ---------------------------------------------------------------------------
PROGRAM_BOUNDS = {
    '232':   {'floor': (0.0, 0.005), 'asymp': (0.0, 0.12),
              'mid': (-200, 500), 'slope': (10, 300), 'asym_factor': (0.3, 4.0)},
    '538':   {'floor': (0.0, 0.003), 'asymp': (0.0, 0.018),
              'mid': (-200, 500), 'slope': (10, 300), 'asym_factor': (0.3, 4.0)},
    '223a7': {'floor': (0.0, 0.010), 'asymp': (0.0, 0.30),
              'mid': (-200, 500), 'slope': (10, 300), 'asym_factor': (0.3, 4.0)},
    '223f':  {'floor': (0.0, 0.005), 'asymp': (0.0, 0.22),
              'mid': (-200, 500), 'slope': (10, 300), 'asym_factor': (0.3, 4.0)},
    'OTHER': {'floor': (0.0, 0.005), 'asymp': (0.0, 0.20),
              'mid': (-200, 500), 'slope': (10, 300), 'asym_factor': (0.3, 4.0)},
}
DEFAULT_BOUNDS = PROGRAM_BOUNDS['OTHER']


def get_bounds_for(cohort_id: str):
    """Look up sigmoid bounds for a cohort, falling back to OTHER if program
    is unknown. Returns ((lower_5,), (upper_5,)) tuples in (floor, asymp,
    mid, slope, asym_factor) order — matches scipy.optimize.curve_fit format.
    """
    program, *_ = cohort_axes(cohort_id)
    b = PROGRAM_BOUNDS.get(program, DEFAULT_BOUNDS)
    lower = (b['floor'][0], b['asymp'][0], b['mid'][0], b['slope'][0], b['asym_factor'][0])
    upper = (b['floor'][1], b['asymp'][1], b['mid'][1], b['slope'][1], b['asym_factor'][1])
    return (list(lower), list(upper))


# Initial sigmoid seed (5-param, asym_factor=1 → symmetric initial)
INITIAL_SIGMOID_SEED = {
    'floor':       0.005,
    'asymp':       0.020,
    'mid':         100.0,
    'slope':       60.0,
    'asym_factor': 1.0,
}


# ---------------------------------------------------------------------------
# Encoders + cohort assignment (unchanged from V8.1)
# ---------------------------------------------------------------------------
def encode_program(fha_category) -> np.ndarray:
    s = pd.Series(np.asarray(fha_category, dtype=object)).astype(str)
    code = np.full(len(s), 'OTHER', dtype=object)
    for key in ['232', '538', '223a7', '223f']:
        mask = s.str.contains(key, regex=False, na=False).values
        code = np.where((code == 'OTHER') & mask, key, code)
    return code


def encode_purpose(loan_purpose) -> np.ndarray:
    s = pd.Series(np.asarray(loan_purpose, dtype=object)).astype(str).str.upper()
    return np.where(s == 'NC', 'NC', 'RP')


def encode_size_bucket(upb_dollars) -> np.ndarray:
    arr = np.asarray(upb_dollars, dtype=float)
    idx = np.digitize(arr, SIZE_BUCKET_BREAKS[1:-1], right=False)
    labels = np.array(SIZE_BUCKET_KEYS, dtype=object)
    return labels[np.clip(idx, 0, len(labels) - 1)]


def encode_age_bucket(age_months) -> np.ndarray:
    arr = np.asarray(age_months, dtype=float)
    idx = np.digitize(arr, AGE_BUCKET_BREAKS[1:-1], right=False)
    labels = np.array(AGE_BUCKET_KEYS, dtype=object)
    return labels[np.clip(idx, 0, len(labels) - 1)]


def cohort_id(program, purpose, size, age_bucket) -> str:
    return f"{program}|{purpose}|{size}|{age_bucket}"


def assign_cohort(features: dict) -> np.ndarray:
    prog = encode_program(features['fha_category'])
    purp = encode_purpose(features['loan_purpose'])
    size = encode_size_bucket(features['upb'])
    age  = encode_age_bucket(features['loan_age_months'])
    return np.array([cohort_id(p, q, s, a) for p, q, s, a in zip(prog, purp, size, age)],
                    dtype=object)


def cohort_axes(cohort: str) -> tuple[str, str, str, str]:
    parts = cohort.split('|')
    while len(parts) < 4:
        parts.append('ALL')
    return (parts[0], parts[1], parts[2], parts[3])


def fallback_id(cohort: str, level: int) -> str:
    p, q, s, a = cohort_axes(cohort)
    if level <= 0: return cohort
    if level == 1: return f"{p}|{q}|ALL|{a}"
    if level == 2: return f"{p}|ALL|ALL|{a}"
    if level == 3: return f"{p}|ALL|ALL|ALL"
    return "GLOBAL"


# ---------------------------------------------------------------------------
# R1: Richards 5-parameter S-curve evaluator (asymmetric)
# ---------------------------------------------------------------------------
def cohort_sigmoid(net_refi_bps: np.ndarray, p: Mapping) -> np.ndarray:
    """5-parameter Richards function on net refi incentive (bp).

    S(x) = floor + asymp / (1 + exp(-(x-mid)/slope))^(1/asym_factor)

    asym_factor=1 reduces to V8.1's symmetric 4PL. asym_factor>1 makes the
    upper-asymptote approach slower (curve flatter on the ITM side near
    saturation). asym_factor<1 makes it faster (steeper rise on ITM side).

    Backwards-compatible: if `asym_factor` is missing from p, defaults to 1.0
    (pure 4PL form). Lets V9 read V8 fitted params during transition.
    """
    x = np.asarray(net_refi_bps, dtype=float)
    z = -(x - p['mid']) / p['slope']
    z = np.clip(z, -50, 50)
    base = 1.0 + np.exp(z)
    # Handle both scalar p (single cohort) and vector p (per-row lookup result)
    asym = np.asarray(p.get('asym_factor', 1.0), dtype=float)
    asym_safe = np.maximum(asym, 1e-3)
    ratio = base ** (-1.0 / asym_safe)
    return p['floor'] + p['asymp'] * ratio


def cohort_age_ramp(age_months: np.ndarray, p: Mapping) -> np.ndarray:
    """Per-cohort piecewise-linear aging ramp (unchanged from V8.1)."""
    x = np.asarray(age_months, dtype=float)
    knots_y = np.asarray(p['knots_y'], dtype=float)
    return np.interp(x, AGE_RAMP_KNOTS_X, knots_y,
                      left=knots_y[0], right=knots_y[-1])


# ---------------------------------------------------------------------------
# Cohort lookup + composition
# ---------------------------------------------------------------------------
SMM_CAP_DEFAULT = 0.30      # CPR ~98% — raised from V8.1's 0.20 because per-cohort
                             # asymp_max bounds (R2) now constrain individual cohorts;
                             # the global cap is now just a numerical safety backstop.


def _lookup_cohort_params(cohort_assignments: np.ndarray, cohort_table: dict
                           ) -> tuple[dict, np.ndarray]:
    """For each row, look up sigmoid + age_ramp params via fallback hierarchy."""
    n = len(cohort_assignments)
    floors = np.empty(n, dtype=float)
    asymps = np.empty(n, dtype=float)
    mids   = np.empty(n, dtype=float)
    slopes = np.empty(n, dtype=float)
    asym_fs = np.empty(n, dtype=float)
    age_knots = np.empty((n, len(AGE_RAMP_KNOTS_X)), dtype=float)
    default_p = {'floor': 0.005, 'asymp': 0.02, 'mid': 100.0, 'slope': 60.0,
                 'asym_factor': 1.0,
                 'age_knots_y': [1.0, 1.0, 1.0, 1.0]}
    for i, c in enumerate(cohort_assignments):
        params = None
        for lvl in range(5):
            fb = fallback_id(c, lvl)
            if fb in cohort_table:
                params = cohort_table[fb]
                break
        if params is None:
            params = cohort_table.get('GLOBAL', default_p)
        floors[i]  = params['floor']
        asymps[i]  = params['asymp']
        mids[i]    = params['mid']
        slopes[i]  = params['slope']
        asym_fs[i] = params.get('asym_factor', 1.0)
        age_knots[i] = params.get('age_knots_y', [1.0, 1.0, 1.0, 1.0])
    return ({'floor': floors, 'asymp': asymps, 'mid': mids, 'slope': slopes,
             'asym_factor': asym_fs}, age_knots)


def _vectorized_age_ramp(age_months: np.ndarray, age_knots: np.ndarray) -> np.ndarray:
    """Vectorized piecewise-linear ramp, each row using its own knot heights."""
    age = np.asarray(age_months, dtype=float)
    knots_x = AGE_RAMP_KNOTS_X
    age_clamped = np.clip(age, knots_x[0], knots_x[-1])
    seg = np.clip(np.searchsorted(knots_x, age_clamped, side='right') - 1,
                   0, len(knots_x) - 2)
    x0 = knots_x[seg];      x1 = knots_x[seg + 1]
    y0 = age_knots[np.arange(len(age)), seg]
    y1 = age_knots[np.arange(len(age)), seg + 1]
    t = (age_clamped - x0) / np.maximum(x1 - x0, 1e-9)
    return y0 + t * (y1 - y0)


def predict_smm_v9a(features: dict, cohort_table: dict,
                     smm_cap: float = SMM_CAP_DEFAULT) -> np.ndarray:
    """Pure cohort: sigmoid × age_ramp, capped."""
    cohorts = assign_cohort(features)
    sig_per_row, age_knots_per_row = _lookup_cohort_params(cohorts, cohort_table)
    sig = cohort_sigmoid(features['net_refi_incentive_bps'], sig_per_row)
    ramp = _vectorized_age_ramp(features['loan_age_months'], age_knots_per_row)
    return np.minimum(sig * ramp, smm_cap)


def predict_smm_v9b(features: dict, cohort_table: dict, structural: dict,
                     smm_cap: float = SMM_CAP_DEFAULT) -> np.ndarray:
    """Hybrid V9b: V9a × refit M_maturity, M_lockout, M_burnout (R3 widened bounds).

    `structural` carries the V9-refit versions of these multipliers (NOT V7's).
    """
    base = predict_smm_v9a(features, cohort_table, smm_cap=1.0)
    m_maturity = v7m.m_maturity(features['months_to_maturity'],       structural['M_maturity'])
    m_lockout  = v7m.m_lockout (features['months_since_lockout_end'], structural['M_lockout'])
    m_burnout  = v7m.m_burnout (features['burn_ratio'],               structural['M_burnout'])
    smm = base * m_maturity * m_lockout * m_burnout
    return np.minimum(smm, smm_cap)


# ---------------------------------------------------------------------------
# Backwards-compatibility shim: if you load a V8.1 cohort_table that lacks
# asym_factor, predict_smm_v9a/b still work via the default in cohort_sigmoid.
# This makes the JSX dashboard's JS mirror also tolerant of mixed V8/V9 data.
# ---------------------------------------------------------------------------
