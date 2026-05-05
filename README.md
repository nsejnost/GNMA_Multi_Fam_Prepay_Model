# GNMA Multi-Family Prepayment Model

Loan-level voluntary prepayment model for GNMA multifamily project loans.
Three model versions co-exist in this repo:

| Version | Architecture | Status | Use case |
|---|---|---|---|
| V6E | Additive logit, 18 features | Production baseline | Existing reports |
| V6F | Additive logit, 24 features | Frozen comparison | V7 vs V6F head-to-head |
| **V7** | **Multiplicative, 9 bounded multipliers** | **Current** | **All new analysis** |

## V7 highlights (current = V7.2)

- Architecture from BAM, SanCap (Amherst Pierpont), and Yield Book PDFs (in repo).
- **8 multipliers**: M_age, M_rate, M_size, M_program, M_purpose, M_lockout,
  M_maturity, M_burnout. Each is structurally bounded so no factor can flip
  sign or override another.
- M_rate's input is **net_refi_bps = gross_refi_bps − 12.5 × (ppp + 1)** —
  penalty enters as a bp-space deductible (the SanCap / Yield Book "borrower
  compares net savings to penalty" formulation). M_penalty is no longer a
  separate multiplier (R8 collapse).
- M_purpose is a **triangular hump** centered at age peak_age (≈ 30m, the
  CLC→PLC conversion window per SanCap), not a monotone-decay from age 0.
- M_burnout's slope is **unconstrained** (R2): in the 2018-2026 panel, fitted
  slope < 0 means burn_ratio acts as a running-ITM amplifier, not a burnout
  dampener.
- ~27 free parameters fit by maximum likelihood on the 1.23M-row panel via
  joint Poisson/Bernoulli MLE in `train_v7.py`. Post-fit re-anchor (R3)
  normalizes each scale-equivariant multiplier (M_age, M_rate, M_program,
  M_size) to panel mean = 1.0.
- Hard SMM cap of 0.15 (CPR ≈ 84%) prevents V6F-style runaway predictions.
- 0-12m post-lockout rows are **sample-weighted 50×** in MLE (R5) so the small
  post-lockout-surge signal isn't drowned out by 982K background rows.
- Issuer effects are emitted SEPARATELY as `issuer_residuals.json` (overlay-only),
  not baked into the core model, to keep V7 portfolio-level and policy-stable.

## Files

```
v7_multipliers.py              # pure-function multiplier library (single source of truth)
train_v7.py                    # two-stage MLE pipeline + diagnostic builders
build_excel_v7.py              # V7 Excel calculator builder
build_excel.py                 # dispatch: V6E / V6F / V7 via MODEL_VERSION env var
validate_v7.py                 # 3-layer verification harness
v7_dashboard.jsx               # 11-tab React/Recharts dashboard
model_data_v7.json             # V7 model artifact (~50 KB)
issuer_residuals.json          # per-issuer residual overlay
V7_Excel_Calculator.xlsx       # Excel workbook output

train_v6f.py / build_excel.py (v6f branch) / validate_v6f.py / v6f_dashboard.jsx
model_data_v6f.json / V6F_Excel_Calculator.xlsx                 # V6F artifacts (frozen)

train_v6e.py / model_data_v6e.json / V6E_Excel_Calculator.xlsx  # V6E artifacts

SanCap Portfolio Strategy.pdf
an-introduction-to-ginnie-mae-project-loans.pdf
BAM_gnpl_model_flipbook_202205_final.pdf
```

## Common operations

```bash
# Train V7 + emit dashboard
GNMA_PANEL_PARQUET=working/gnma_mf_panel.parquet python3 train_v7.py --emit-dashboard

# Build the V7 Excel calculator
MODEL_VERSION=v7 python3 build_excel.py

# Run the 3-layer validation
python3 validate_v7.py

# Re-emit dashboard only (no retraining)
python3 train_v7.py --only-emit-dashboard

# Build V6E or V6F Excel calculators (unchanged from before)
MODEL_VERSION=v6e python3 build_excel.py
MODEL_VERSION=v6f python3 build_excel.py
```

## SanCap benchmark divergences — expected, not a bug

The `Benchmarks` tab in V7's Excel and dashboard compares V7 against 12 SanCap
reference scenarios from the Amherst Pierpont 2014-2018 IRR-program study.
Persistent +50/+100bp scenario divergences (V7 predicts ~10-15 CPR vs SanCap's
35-45 CPR) reflect a real regime shift:

- SanCap data: 2014-2018, when rates were generally falling and most loans
  were in the money relative to refinancing alternatives.
- V7 panel: 2018-2026, including the 2022-2024 hiking cycle. Most loans
  in the panel are out-of-the-money for most of their lives, so empirical
  prepay speeds are systematically slower than SanCap's averages.

V7 is ground truth on this panel. SanCap is a shape-direction sanity check
(does penalty dampen? does NC bump up? does rural slow down?), not a numeric
target. The `REVIEW` flag triggers when divergence exceeds 10pp, but this
flag is informational only — Layer 3 of `validate_v7.py` does not fail on it.

## V7 verification gates

`validate_v7.py` enforces three layers; the first two are hard pass/fail:

1. **Layer 1 — Excel↔Python parity.** 30 sample loans, max |Excel − Python|
   pred_CPR < 1e-6.
2. **Layer 2 — Tail-blowup detector.** Score the full 1.23M-row panel; assert
   max(pred_CPR) < 90% AND no loan-month predicts CPR > 90%. (V6F predicted
   99.99% on 291 loans; V7 stays below the structural cap.)
3. **Layer 3 — SanCap benchmark grid.** Informational only (see above).
