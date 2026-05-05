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
    # np.digitize returns indices into bin edges; we want labels
    idx = np.digitize(arr, SIZE_BUCKET_BREAKS[1:-1], right=False)
    labels = np.array(SIZE_BUCKET_KEYS, dtype=object)
    return labels[np.clip(idx, 0, len(labels) - 1)]


def cohort_id(program, purpose, size) -> str:
    """Composite cohort identifier, e.g., '232|RP|medium'."""
    return f"{program}|{purpose}|{size}"


def assign_cohort(features: dict) -> np.ndarray:
    """Top-level cohort assignment for each row in `features`.
    Returns the most-specific cohort id (program × purpose × size). Fallback
    to coarser cohorts is applied AT FIT TIME, not here — see train_v8.py.
    """
    prog = encode_program(features['fha_category'])
    purp = encode_purpose(features['loan_purpose'])
    size = encode_size_bucket(features['upb'])
    return np.array([cohort_id(p, q, s) for p, q, s in zip(prog, purp, size)],
                    dtype=object)


def cohort_axes(cohort: str) -> tuple[str, str, str]:
    """Inverse of cohort_id: split 'program|purpose|size' back into a tuple."""
    parts = cohort.split('|')
    if len(parts) != 3:
        return (parts[0] if len(parts) > 0 else 'OTHER',
                parts[1] if len(parts) > 1 else 'RP',
                parts[2] if len(parts) > 2 else 'medium')
    return (parts[0], parts[1], parts[2])


# Fallback hierarchy (most-specific → most-general). Used by the cohort fitter
# at training time when a primary cohort has too few events.
def fallback_id(cohort: str, level: int) -> str:
    """Coarser cohort id: level 0 = primary, 1 = drop size, 2 = drop purpose,
    3 = global. Returns 'GLOBAL' for level >= 3.
    """
    p, q, s = cohort_axes(cohort)
    if level <= 0: return cohort
    if level == 1: return f"{p}|{q}|ALL"
    if level == 2: return f"{p}|ALL|ALL"
    return "GLOBAL"


# ---------------------------------------------------------------------------
# Sigmoid evaluator (same form as V7's M_rate; mirror with v7_multipliers.m_rate)
# ---------------------------------------------------------------------------
def cohort_sigmoid(net_refi_bps: np.ndarray, p: Mapping) -> np.ndarray:
    """4-param sigmoid on net (penalty-adjusted) refi incentive.

    p must contain: floor, asymp, mid, slope. Returns predicted SMM (not CPR).
    """
    x = np.asarray(net_refi_bps, dtype=float)
    z = -(x - p['mid']) / p['slope']
    z = np.clip(z, -50, 50)
    return p['floor'] + p['asymp'] / (1.0 + np.exp(z))


# ---------------------------------------------------------------------------
# Composition
# ---------------------------------------------------------------------------
SMM_CAP_DEFAULT = 0.20      # CPR ~92% — slightly above V7's 0.15 to allow fast cohorts


def _lookup_sigmoid_params(cohort_assignments: np.ndarray,
                            cohort_table: dict) -> dict[str, np.ndarray]:
    """For each row, look up which cohort's sigmoid params apply.
    `cohort_table` maps {cohort_id_or_fallback: {floor, asymp, mid, slope}}.
    Returns parallel arrays of floor/asymp/mid/slope (one per row).
    """
    n = len(cohort_assignments)
    floors = np.empty(n, dtype=float)
    asymps = np.empty(n, dtype=float)
    mids   = np.empty(n, dtype=float)
    slopes = np.empty(n, dtype=float)
    for i, c in enumerate(cohort_assignments):
        # Walk fallback hierarchy until we find a fit
        params = None
        for lvl in range(4):
            fb = fallback_id(c, lvl)
            if fb in cohort_table:
                params = cohort_table[fb]
                break
        if params is None:
            params = cohort_table.get('GLOBAL', {'floor': 0.005, 'asymp': 0.02,
                                                  'mid': 100.0, 'slope': 60.0})
        floors[i] = params['floor']; asymps[i] = params['asymp']
        mids[i]   = params['mid'];   slopes[i] = params['slope']
    return {'floor': floors, 'asymp': asymps, 'mid': mids, 'slope': slopes}


def predict_smm_v8a(features: dict, cohort_table: dict,
                     smm_cap: float = SMM_CAP_DEFAULT) -> np.ndarray:
    """Pure cohort: pred_SMM = MIN(cohort_sigmoid(net_refi_bps), smm_cap)."""
    cohorts = assign_cohort(features)
    p_per_row = _lookup_sigmoid_params(cohorts, cohort_table)
    smm = cohort_sigmoid(features['net_refi_incentive_bps'], p_per_row)
    return np.minimum(smm, smm_cap)


def predict_smm_v8b(features: dict, cohort_table: dict, v7_params: dict,
                     smm_cap: float = SMM_CAP_DEFAULT) -> np.ndarray:
    """Hybrid: cohort_sigmoid × V7's structural multipliers (age, maturity,
    lockout, burnout). M_program / M_purpose / M_size are NOT applied — those
    are now baked into the cohort definition.
    """
    base = predict_smm_v8a(features, cohort_table, smm_cap=1.0)   # uncapped here
    m_age      = v7m.m_age     (features['loan_age_months'],          v7_params['M_age'])
    m_maturity = v7m.m_maturity(features['months_to_maturity'],       v7_params['M_maturity'])
    m_lockout  = v7m.m_lockout (features['months_since_lockout_end'], v7_params['M_lockout'])
    m_burnout  = v7m.m_burnout (features['burn_ratio'],               v7_params['M_burnout'])
    smm = base * m_age * m_maturity * m_lockout * m_burnout
    return np.minimum(smm, smm_cap)


def predict_cpr_v8(features: dict, cohort_table: dict, v7_params: dict | None = None,
                    flavor: str = 'v8b', smm_cap: float = SMM_CAP_DEFAULT) -> np.ndarray:
    """Convenience: predict annualized CPR for V8a or V8b."""
    if flavor == 'v8a':
        smm = predict_smm_v8a(features, cohort_table, smm_cap)
    else:
        if v7_params is None:
            raise ValueError("V8b requires v7_params (M_age, M_maturity, M_lockout, M_burnout)")
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
