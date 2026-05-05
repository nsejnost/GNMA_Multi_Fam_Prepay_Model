"""
V8 Cohort-Based S-Curve Voluntary Prepayment Model — core functions.

Methodology (alternative to V7's multiplicative architecture):
  1. Each loan is assigned to a cohort defined by (program × purpose × size).
  2. Each surviving cohort gets its OWN 4-parameter sigmoid fit on
     mean_actual_smm vs net_refi_incentive_bps.
  3. To predict for a loan: identify cohort → evaluate that cohort's sigmoid
     at the loan's current net_refi_bps → optionally apply structural
     multipliers (V8b hybrid) → cap → annualize.

Two flavors:
  V8a (pure cohort)  : pred_SMM = MIN(cohort_sigmoid(net_bp), smm_cap)
  V8b (hybrid)       : pred_SMM = MIN(cohort_sigmoid(net_bp)
                                       × M_age × M_maturity × M_lockout × M_burnout,
                                       smm_cap)
                       — the four structural multipliers come from V7
                         (re-used as-is, since they're cohort-invariant in V7
                         too and capture genuinely orthogonal signals)

This module is pure-function; train_v8.py orchestrates fitting and
build_excel_v8.py / v8_dashboard.jsx mirror these formulas in their respective
languages — keep all three in sync when changing any function here.
"""
from __future__ import annotations
import math
from typing import Mapping, Iterable
import numpy as np
import pandas as pd

# Reuse V7's structural multipliers + helpers (the V8b hybrid uses them as-is)
import v7_multipliers as v7m


# ---------------------------------------------------------------------------
# Cohort definition (program × purpose × size)
# ---------------------------------------------------------------------------

# Program codes match V7's PROGRAM_KEYS plus a catch-all "OTHER"
PROGRAM_KEYS = ['232', '538', '223a7', '223f', 'OTHER']

# Purpose collapses NC vs RP-or-other (binary)
PURPOSE_KEYS = ['NC', 'RP']

# Size buckets aligned to SanCap's $5M / $15M reference loans
SIZE_BUCKET_BREAKS = [0.0, 5_000_000.0, 25_000_000.0, np.inf]
SIZE_BUCKET_KEYS = ['small', 'medium', 'large']   # <5M, 5-25M, 25M+

# Age buckets — V8.1 added age as a 4th cohort axis. Boundaries at 36 and 120 months
# correspond to the SanCap "12m old prepays at 65% of 36m" inflection and the
# typical peak-prepay-age range (8-15 years).
AGE_BUCKET_BREAKS = [0.0, 36.0, 120.0, np.inf]
AGE_BUCKET_KEYS = ['young', 'seasoned', 'aged']   # 0-36m, 36-120m, 120m+

# Age-ramp knot positions (months). Knot heights are fit per cohort.
# The middle knot is anchored at y=1.0 to break the sigmoid×ramp scale ambiguity:
# all cohort sigmoid coefficients describe SMM at the anchor age (96m).
AGE_RAMP_KNOTS_X = np.array([0.0, 24.0, 96.0, 240.0])
AGE_RAMP_ANCHOR_IDX = 2          # knot at age=96m is held at y=1.0
AGE_RAMP_INITIAL_Y = np.array([0.30, 0.85, 1.00, 0.80])    # seed shape

# Free param count per cohort: 4 sigmoid + 3 age-ramp knots (anchor fixed) = 7


def encode_program(fha_category) -> np.ndarray:
    """Map fha_category strings to one of PROGRAM_KEYS (last is OTHER catch-all)."""
    s = pd.Series(np.asarray(fha_category, dtype=object)).astype(str)
    code = np.full(len(s), 'OTHER', dtype=object)
    # More-specific patterns first; OTHER absorbs everything else (220, 221d4, 241, ...)
    for key in ['232', '538', '223a7', '223f']:
        mask = s.str.contains(key, regex=False, na=False).values
        code = np.where((code == 'OTHER') & mask, key, code)
    return code


def encode_purpose(loan_purpose) -> np.ndarray:
    """Binary: NC (new construction or sub-rehab) vs RP (everything else)."""
    s = pd.Series(np.asarray(loan_purpose, dtype=object)).astype(str).str.upper()
    return np.where(s == 'NC', 'NC', 'RP')


def encode_size_bucket(upb_dollars) -> np.ndarray:
    """Map UPB (in dollars) to small / medium / large bucket per SIZE_BUCKET_BREAKS."""
    arr = np.asarray(upb_dollars, dtype=float)
    idx = np.digitize(arr, SIZE_BUCKET_BREAKS[1:-1], right=False)
    labels = np.array(SIZE_BUCKET_KEYS, dtype=object)
    return labels[np.clip(idx, 0, len(labels) - 1)]


def encode_age_bucket(age_months) -> np.ndarray:
    """V8.1: 4th cohort axis. young=0-36m, seasoned=36-120m, aged=120m+."""
    arr = np.asarray(age_months, dtype=float)
    idx = np.digitize(arr, AGE_BUCKET_BREAKS[1:-1], right=False)
    labels = np.array(AGE_BUCKET_KEYS, dtype=object)
    return labels[np.clip(idx, 0, len(labels) - 1)]


def cohort_id(program, purpose, size, age_bucket) -> str:
    """Composite cohort identifier: 'program|purpose|size|age_bucket'."""
    return f"{program}|{purpose}|{size}|{age_bucket}"


def assign_cohort(features: dict) -> np.ndarray:
    """4-axis cohort assignment: program × purpose × size × age_bucket."""
    prog = encode_program(features['fha_category'])
    purp = encode_purpose(features['loan_purpose'])
    size = encode_size_bucket(features['upb'])
    age  = encode_age_bucket(features['loan_age_months'])
    return np.array([cohort_id(p, q, s, a) for p, q, s, a in zip(prog, purp, size, age)],
                    dtype=object)


def cohort_axes(cohort: str) -> tuple[str, str, str, str]:
    """Inverse of cohort_id: split 'program|purpose|size|age' back into a tuple."""
    parts = cohort.split('|')
    while len(parts) < 4:
        parts.append('ALL')
    return (parts[0], parts[1], parts[2], parts[3])


# Fallback hierarchy: drop in order size → purpose → age_bucket → program.
# Each step generalizes the cohort while preserving the most-discriminative axes.
#   level 0: program × purpose × size × age_bucket
#   level 1: drop size                  → program × purpose × age
#   level 2: drop purpose              → program × age
#   level 3: drop age                   → program
#   level 4: GLOBAL
def fallback_id(cohort: str, level: int) -> str:
    p, q, s, a = cohort_axes(cohort)
    if level <= 0: return cohort
    if level == 1: return f"{p}|{q}|ALL|{a}"
    if level == 2: return f"{p}|ALL|ALL|{a}"
    if level == 3: return f"{p}|ALL|ALL|ALL"
    return "GLOBAL"


# ---------------------------------------------------------------------------
# Sigmoid evaluator (same form as V7's M_rate; mirror with v7_multipliers.m_rate)
# ---------------------------------------------------------------------------
def cohort_sigmoid(net_refi_bps: np.ndarray, p: Mapping) -> np.ndarray:
    """4-param sigmoid on net (penalty-adjusted) refi incentive.

    p must contain: floor, asymp, mid, slope. Returns predicted SMM (not CPR)
    AT THE AGE-ANCHOR (96m). The aging ramp scales this for other ages.
    """
    x = np.asarray(net_refi_bps, dtype=float)
    z = -(x - p['mid']) / p['slope']
    z = np.clip(z, -50, 50)
    return p['floor'] + p['asymp'] / (1.0 + np.exp(z))


def cohort_age_ramp(age_months: np.ndarray, p: Mapping) -> np.ndarray:
    """Per-cohort piecewise-linear aging ramp on loan_age_months.

    p contains 'knots_y': list of 4 knot heights at AGE_RAMP_KNOTS_X.
    Returns a multiplier ≥ 0 with anchor knot held at y=1.0 (age=96m), so the
    cohort's sigmoid params describe SMM at age=96m.
    """
    x = np.asarray(age_months, dtype=float)
    knots_y = np.asarray(p['knots_y'], dtype=float)
    return np.interp(x, AGE_RAMP_KNOTS_X, knots_y,
                      left=knots_y[0], right=knots_y[-1])


def default_age_ramp() -> dict:
    """Identity ramp (all knots at 1.0) — used as a no-op fallback."""
    return {'knots_y': [1.0, 1.0, 1.0, 1.0]}


# ---------------------------------------------------------------------------
# Composition
# ---------------------------------------------------------------------------
SMM_CAP_DEFAULT = 0.20      # CPR ~92% — slightly above V7's 0.15 to allow fast cohorts


def _lookup_cohort_params(cohort_assignments: np.ndarray, cohort_table: dict
                           ) -> tuple[dict, list]:
    """For each row, look up the cohort's params (sigmoid + age_ramp) via
    the fallback hierarchy. Returns:
        sigmoid_per_row : {floor[N], asymp[N], mid[N], slope[N]}
        age_knots_per_row : list of (knots_y arrays), N entries
    """
    n = len(cohort_assignments)
    floors = np.empty(n, dtype=float)
    asymps = np.empty(n, dtype=float)
    mids   = np.empty(n, dtype=float)
    slopes = np.empty(n, dtype=float)
    age_knots = np.empty((n, len(AGE_RAMP_KNOTS_X)), dtype=float)
    default_p = {'floor': 0.005, 'asymp': 0.02, 'mid': 100.0, 'slope': 60.0,
                 'age_knots_y': [1.0, 1.0, 1.0, 1.0]}
    for i, c in enumerate(cohort_assignments):
        params = None
        for lvl in range(5):                           # 5 fallback levels (was 4)
            fb = fallback_id(c, lvl)
            if fb in cohort_table:
                params = cohort_table[fb]
                break
        if params is None:
            params = cohort_table.get('GLOBAL', default_p)
        floors[i] = params['floor']; asymps[i] = params['asymp']
        mids[i]   = params['mid'];   slopes[i] = params['slope']
        age_knots[i] = params.get('age_knots_y', [1.0, 1.0, 1.0, 1.0])
    return ({'floor': floors, 'asymp': asymps, 'mid': mids, 'slope': slopes},
            age_knots)


def _vectorized_age_ramp(age_months: np.ndarray, age_knots: np.ndarray) -> np.ndarray:
    """Vectorized piecewise-linear ramp: each row uses its own knot heights.

    Implementation: for each interpolation segment between AGE_RAMP_KNOTS_X[k]
    and [k+1], compute t = (age - x_k) / (x_{k+1} - x_k) clipped to [0,1], then
    linear-interp y_k + t × (y_{k+1} - y_k). Sum the segment contributions; the
    clipping ensures only the correct segment contributes for each row.
    """
    age = np.asarray(age_months, dtype=float)
    knots_x = AGE_RAMP_KNOTS_X
    # Default extrapolation: clamp to first/last knot
    age_clamped = np.clip(age, knots_x[0], knots_x[-1])
    # Find segment index for each age
    seg = np.clip(np.searchsorted(knots_x, age_clamped, side='right') - 1,
                   0, len(knots_x) - 2)
    x0 = knots_x[seg];      x1 = knots_x[seg + 1]
    y0 = age_knots[np.arange(len(age)), seg]
    y1 = age_knots[np.arange(len(age)), seg + 1]
    t = (age_clamped - x0) / np.maximum(x1 - x0, 1e-9)
    return y0 + t * (y1 - y0)


def predict_smm_v8a(features: dict, cohort_table: dict,
                     smm_cap: float = SMM_CAP_DEFAULT) -> np.ndarray:
    """Pure cohort: pred_SMM = MIN(cohort_sigmoid(net_refi) × age_ramp(age), smm_cap).

    V8.1 incorporates the per-cohort aging ramp natively — the model no longer
    needs V7's M_age multiplier overlaid on top.
    """
    cohorts = assign_cohort(features)
    sig_per_row, age_knots_per_row = _lookup_cohort_params(cohorts, cohort_table)
    sig = cohort_sigmoid(features['net_refi_incentive_bps'], sig_per_row)
    ramp = _vectorized_age_ramp(features['loan_age_months'], age_knots_per_row)
    return np.minimum(sig * ramp, smm_cap)


def predict_smm_v8b(features: dict, cohort_table: dict, v7_params: dict,
                     smm_cap: float = SMM_CAP_DEFAULT) -> np.ndarray:
    """Hybrid: V8a × V7's M_maturity, M_lockout, M_burnout.

    V7's M_age is NO LONGER applied — replaced by the native per-cohort age_ramp
    inside V8a. M_maturity / M_lockout / M_burnout still help because they capture
    end-of-life and post-lockout dynamics that the cohort age_ramp doesn't model.
    """
    base = predict_smm_v8a(features, cohort_table, smm_cap=1.0)
    m_maturity = v7m.m_maturity(features['months_to_maturity'],       v7_params['M_maturity'])
    m_lockout  = v7m.m_lockout (features['months_since_lockout_end'], v7_params['M_lockout'])
    m_burnout  = v7m.m_burnout (features['burn_ratio'],               v7_params['M_burnout'])
    smm = base * m_maturity * m_lockout * m_burnout
    return np.minimum(smm, smm_cap)


def predict_cpr_v8(features: dict, cohort_table: dict, v7_params: dict | None = None,
                    flavor: str = 'v8b', smm_cap: float = SMM_CAP_DEFAULT) -> np.ndarray:
    """Convenience: predict annualized CPR for V8a or V8b."""
    if flavor == 'v8a':
        smm = predict_smm_v8a(features, cohort_table, smm_cap)
    else:
        if v7_params is None:
            raise ValueError("V8b requires v7_params (M_maturity, M_lockout, M_burnout)")
        smm = predict_smm_v8b(features, cohort_table, v7_params, smm_cap)
    return 1.0 - (1.0 - smm) ** 12


# ---------------------------------------------------------------------------
# Initial seed sigmoid (used when bootstrapping cohort fits and as the GLOBAL
# fallback when an unusual loan-month doesn't match any cohort)
# ---------------------------------------------------------------------------
INITIAL_SIGMOID_SEED = {
    'floor': 0.005,    # SMM at deep-OTM
    'asymp': 0.020,    # SMM at deep-ITM (CPR ~22%)
    'mid':   100.0,    # bp where the sigmoid is at its inflection
    'slope': 60.0,     # bp width per natural-log unit
}

# Per-parameter bounds for scipy.optimize.curve_fit
SIGMOID_BOUNDS = (
    [0.0,    0.0,    -200.0, 10.0],     # lower: floor, asymp, mid, slope
    [0.05,   0.20,    500.0, 300.0],    # upper
)
