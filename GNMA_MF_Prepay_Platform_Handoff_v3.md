# GNMA Multifamily Prepayment Analytics Platform — Handoff Document

**Last updated**: May 2026
**For**: Next AI session continuing this work
**User**: Nick (fixed income / MBS expert; deep GNMA multifamily expertise; works in production-grade quantitative modeling)
**Project context**: End-to-end voluntary and involuntary prepayment model for GNMA multifamily loans, built from loan-level GNMA `mfplmon3` disclosure data, with web-based exploratory dashboard and eventual Excel implementation as the goal.

---

## 1. Executive Summary

A substantially complete prepayment analytics platform for GNMA multifamily loans:

1. **`main.py`** — a 1,759-line data pipeline that parses GNMA disclosure files, applies all enrichments, and produces a 1.31M-row × 88-column parquet of loan-month observations. Nine pipeline fixes are baked in.
2. **A trained voluntary prepayment logistic model (V6E)** — 18 features (11 base + 7 issuer dummies), test AUC 0.7614, calibrated within ~1pp on most cohort cuts. Bloomberg-aligned dynamics (COVID CPR wave correctly captured at ~17–18% in 2020–2021). Designed for clean Excel implementation: no panel-dependent computations, no per-vintage lookups.
3. **A trained involuntary prepayment logistic model** (still V5-era, 10 features) — test AUC 0.7342, base CDR 0.186%. Below-1% CDR baseline matches Bloomberg's BAM model. Re-training with V6-clean features is on the pending list.
4. **A multi-tab React dashboard** (`voluntary_prepay_dashboard.jsx`, ~310KB) with 12 tabs: Overview, S-curve, Servicer S-curves, Time series, Calibration, Cohorts, What-if, Calibrate, **Attribution**, Loan Projector, Coefficients, Involuntary.
5. **A Loan Projector** that produces forward CPR/CDR vectors for 30-year horizons under flat or parallel-shock rate scenarios.
6. **A per-loan Attribution tab** with both order-dependent (waterfall) and order-independent (proportional) CPR decomposition methods, plus the Excel formula recipe.

**Current state**: V6E model is trained, dashboard updated, attribution tab live with both methods. The model is production-ready; remaining work is largely about packaging (Excel deliverable, involuntary V6 retrain, optional refinements).

---

## 2. Working Files

All files referenced in this document live in the working directory the user provides at session start. The user uploads the current parquet panel and any helper files (PLC rate history, BAM benchmark PDF) at the beginning of each session.

**Code files** (Claude generates / iterates on these):
- `main.py` (1,759 lines) — current production pipeline with Fixes 1–9 applied
- `train_v6e.py` — V6E voluntary training script
- `train_involuntary.py` — involuntary training script (still V5-era; pending V6 refresh)
- `voluntary_prepay_dashboard.jsx` (~310KB) — single-file React dashboard, 12 tabs

**Data artifacts** (training output):
- `model_data_v6e.json` (pretty) / `model_data_v6e_compact.json` (minified for embedding) — V6E coefficients, diagnostics, archetype anchors, per-issuer S-curves, attribution sample loans
- `model_data_inv.json` — involuntary model output

**Reference benchmarks** (user supplies):
- A current GNMA MF panel parquet (1.3M+ rows × 88 cols), e.g. `gnma_mf_raw_data_YYYYMMDD_HHMMSS.parquet`
- `GnmaPlcRatesHistorical.csv` — PLC rate lookup for the pipeline
- `BAM_gnpl_model_flipbook_202205_final.pdf` — Bloomberg's BAM (Project Loan) model documentation, the methodological benchmark we calibrate against

If the user has provided fresh data and wants to retrain, the standard workflow is: (1) confirm the parquet has Fixes 1–9 baked in (verifiable via spot checks below), (2) re-run `train_v6e.py` against it, (3) embed the resulting model JSON into the dashboard JSX.

---

## 3. Pipeline (`main.py`) — Current State

### Output schema (88 columns)
- Identifiers: `loan_id`, `pool_cusip`, `period`, `issuer_name`, `issuer_number`, `servicer_id`
- Loan terms: `original_upb`, `upb`, `loan_rate`, `original_term_months`, `loan_age_months`, `vintage_year`, `original_loan_date`, `loan_purpose`, `fha_category`, `num_units`
- Restrictions: `lockout_end`, `prepay_end`, `lockout_remaining_months`, `penalty_remaining_months`, `prepay_penalty_points`, `in_prepay_penalty`, `in_lockout`, `past_all_restrictions`
- Performance: `removal_reason`, `months_dq`, `is_seriously_dq`, `is_dq_30`, `is_dq_60`, `is_dq_90`
- Macro: `plc_rate_bps`, `gross_refi_incentive_bps`, `refi_incentive_bps`
- Targets: `prepaid_voluntary`, `prepaid_involuntary`, `exit_type`, `prepay_eligible`
- Flags: `is_construction_phase`, `is_hc_232`, `is_223a7`, `is_538`, `has_valid_data`, `has_anomaly`
- SATO: `sato_bps` (vintage-median-based)
- And ~30 raw passthroughs from the GNMA disclosure

### Known data quirks (documented, not fixed)
- 15 loans with `lockout_end`/`prepay_end` swapped (all pre-2018, no panel impact)
- 29,948 rows with `num_units=0` (mostly USDA 538, source limitation)
- 19 single-month UPB increases (GNMA reporting glitches, 0.001% of rows)
- 27 rate changes on construction-to-permanent pools (correct by design)

### The Nine Fixes (all applied in current main.py)
1. **Disappearance check** uses `bool(nl)` instead of `(nxt is not None)` — prevents false positive exits when next file fails to parse
2. **SATO methodology**: dedup to unique loans before vintage median; filter to `(has_valid_data==1) AND (is_construction_phase==0)`
3. **`removal_reason=6` → voluntary** (per GNMA L28 dictionary; surfaced by CITADEL CARE CENTER pool 3617BQ3M8, 232/223(f), rm=6 mdq=0 paying 10pt penalty)
4. **Loan age sanity bounds**: NaN if originating year <1965 or >current+1 (fixes 32 rows from 2 corrupt-vintage loans)
5. **Vintage_year matching guards** (same bounds inside the matching loop)
6. **Panel-discontinuity post-pass**: ~24 false-positive exits cleared where a loan_id reappears later in the panel
7. **`rm=1` or `rm=6` + `mdq>=3` override → involuntary** (90+ DPD = `is_seriously_dq`; surfaced by HARBORTOWN PROPERTIES 36179HH87_000000008211099, 207/223f, rm=6 mdq=6). Flips ~43 events.
8. **ORIX → Lument issuer name normalization**. Both share `issuer_number=3896`. ORIX rebranded Oct 2020; GNMA disclosures used "ORIX" through Nov 2022, "Lument" from Dec 2022. `ISSUER_NAME_NORMALIZATION` dict + `normalize_issuer_name()` helper near top of file (~line 52); applied at parse around line 814.
9. **No-next-period-evidence gate**. When `bool(nl)` is False (last panel period or next file empty), skip rm-based classification entirely. Eliminates ~75 spurious events in the last period (issuers pre-populate `removal_reason` for upcoming events). Inside rm classification block ~line 1391: `has_next_period_evidence = bool(nl); if not: vol=False, invol=False`.

### Quick verification of a fresh parquet
To confirm a new parquet has all nine fixes applied:
```python
import pandas as pd
df = pd.read_parquet(parquet_path)
# Fix 8: ORIX should be 0; Lument should be ~225K rows
assert (df['issuer_name'].str.contains('ORIX', case=False, na=False)).sum() == 0
# Fix 9: last period should have 0 prepays/buyouts
last_p = df['period'].astype(str).max()
last_df = df[df['period'].astype(str) == last_p]
assert last_df['prepaid_voluntary'].sum() == 0
assert last_df['prepaid_involuntary'].sum() == 0
# Fix 7: HARBORTOWN should be involuntary_buyout
spot = df[df['loan_id'] == '36179HH87_000000008211099']
assert spot.iloc[-1]['exit_type'] == 'involuntary_buyout'
# Fix 3: CITADEL exit should be voluntary_prepay
spot2 = df[df['pool_cusip'] == '3617BQ3M8'].sort_values('period')
exit_row = spot2[spot2['prepaid_voluntary'] == 1].iloc[0]
assert exit_row['removal_reason'] == 6
```

---

## 4. V6E Voluntary Model — Current Production

### Feature set (18 total, organized into 5 groups)

| Group | Feature | Native units |
|---|---|---|
| **Rate & Restrictions** | `refi_incentive_bps` | basis points |
| | `in_prepay_penalty` | 1/0 |
| **Loan Structure & Seasoning** | `loan_age_months` | months |
| | `log_upb` | log(1 + UPB) |
| | `is_post_covid` | 1 if vintage_year ≥ 2021 |
| **Burnout** | `cum_itm` | count of months ITM to date |
| | `burn_ratio` | cum_itm / loan_age_months |
| **FHA Program & Purpose** | `is_hc_232` | 1/0 |
| | `is_223a7` | 1/0 |
| | `is_538` | 1/0 |
| | `lp_NC` | 1/0 (New Construction) |
| **Issuer (Servicer)** | `iss_capital_funding` | 1/0 |
| | `iss_merchants` | 1/0 |
| | `iss_wells_fargo` | 1/0 |
| | `iss_walker_dunlop` | 1/0 |
| | `iss_pnc` | 1/0 |
| | `iss_berkadia` | 1/0 |
| | `iss_dwight` | 1/0 |

Reference issuer category is "other" (Lument+ORIX merged, Greystone, ~70 small).

### Why this feature set (V6 design rationale)

V5 had 28 features. V6E drops 10 features that are either (a) mathematically collinear with retained features, (b) not implementable in Excel without panel-dependent computation, or (c) statistically near-zero in importance after panel cleanup.

Specifically dropped:
- **`prepay_penalty_points`** — collinear with `in_prepay_penalty` (ρ ≈ 0.97) and `past_all_restrictions` (ρ = −1.000)
- **`loan_rate`** and **`plc_rate_bps`** — both subsumed into `refi_incentive_bps` (ρ ≈ 0.82 between them and gross refi)
- **`sato_bps`** — only 0.0007 AUC contribution; would require a 32-row vintage median lookup table that refreshes every panel update (Excel maintenance burden too high vs. value)
- **`past_all_restrictions`** — perfect inverse of `in_prepay_penalty`
- **`vintage_year`** (continuous) — replaced by `is_post_covid` binary, which beat the continuous version on AUC and yearly RMSE (the regime shift at 2020–2021 is genuinely binary, not linear)
- **`gross_refi_incentive_bps`** — kept only the net version which captures the relevant dynamic
- **`lp_RP`** — perfectly collinear with `lp_NC` for the binary class structure
- **8 issuer dummies dropped** — kept only the 7 with `|Δ from panel mean| > 0.4%` after the ORIX+Lument merge

### Performance
- Test AUC: **0.7614** (V5 was 0.7636; lost only 0.0022 with 10 fewer features)
- Per-issuer fit: every named issuer within ~1pp of actual CPR
- COVID years correctly captured (2020 pred 16.75%, 2021 pred 17.90%; actuals were 18.4% and 21.3%)
- Vintage cohorts post-2021 slightly under-predict (expected from binary `is_post_covid`)

### Top features by |β_scaled|
1. `refi_incentive_bps`: **+1.034** (top driver)
2. `log_upb`: +0.486
3. `cum_itm`: +0.447
4. `is_post_covid`: −0.306
5. `loan_age_months`: −0.203
6. `is_538`: −0.149
7. `in_prepay_penalty`: +0.119
8. `burn_ratio`: −0.082

### Training methodology
- Filter: `prepay_eligible == 1` AND `period != last_period_in_panel` (last period excluded because of the no-next-period-evidence gate)
- Split: 80/20 by `loan_id` (not by row, to prevent leakage)
- Class balancing: 5:1 negative downsampling on training set
- Estimator: scikit-learn `LogisticRegression(C=1.0, solver='lbfgs')`, L2 regularization
- Standardization: features z-scored before fit; coefficients reported in BOTH scaled and native units in JSON
- Prior correction: post-fit intercept adjustment for downsampling (preserves calibration)

---

## 5. Attribution Tab — Two Methods

The Attribution tab implements per-loan CPR decomposition. Each loan's prediction is broken down into per-feature contributions that add up to the total prediction. Both methods use the same logit-space contributions but report CPR allocations differently.

### Method A: Waterfall (cumulative, order-dependent)
Sort features by `|contribution_logit|` descending. Walk through them, accumulating logit and recomputing SMM/CPR at each step. The Δ CPR at step k is `cpr_k − cpr_(k−1)`. Order-dependent because sigmoid is nonlinear.

**Use when**: explaining "how does the prediction evolve as features are layered in?"

### Method B: Absolute / Proportional (recommended)
```
baseline_smm = sigmoid(intercept_scaled)
baseline_cpr = 1 − (1 − baseline_smm)^12
total_logit_dev = logit_z − intercept_scaled = Σ contrib_logit[j]
total_cpr_dev = pred_cpr − baseline_cpr
For each feature j:
    cpr_attr[j] = (contrib_logit[j] / total_logit_dev) × total_cpr_dev
```

Properties:
- **Order-independent**
- `Σ cpr_attr[j] = total_cpr_dev` exactly
- `baseline_cpr + Σ cpr_attr[j] = pred_cpr` exactly

**Use when**: producing institutional-grade attribution reports or Excel deliverables where additivity matters.

### Math sanity check (built into the dashboard)
Both methods produce the same logit-space numbers; they differ only in how the CPR-space decomposition is reported. The Attribution tab displays a "sanity" line on every loan: `baseline + total_cpr_dev = pred`.

### Sample loans embedded in the dashboard
The training script picks 8 representative loans (median-pred per archetype, plus a few extreme cases) and stores their full feature vectors + per-feature contributions in `model_data_v6e.json` under `attribution_loans[]`. The dashboard renders these as a clickable table; selecting a row shows the full decomposition for that loan.

---

## 6. Dashboard Architecture

Single-file React/JSX, ~310KB, 12 tabs. Bloomberg-themed (black background, amber accent, IBM Plex Mono). Designed for direct in-chat artifact rendering.

### Tabs
| Tab | Purpose |
|---|---|
| Overview | Headline stats, top features, methodology summary |
| S-curve | Panel-wide actual vs predicted CPR by refi-incentive bucket |
| Servicer S-curves | Per-issuer S-curves with multi-select (Top-5 preset, Hi/Lo presets) |
| Time series | Yearly + monthly CPR with COVID band shaded |
| Calibration | Decile scatter (predicted vs actual) on 45° line |
| Cohorts | FHA, loan_purpose, age, penalty, issuer, vintage cuts |
| What-if | 18 sliders organized by feature group, real-time CPR + logit attribution |
| Calibrate | Coefficient toggles per feature group, per-toggle reset, RESET ALL, live S-curve / yearly / monthly fit charts (orange=actual, dashed-blue=base, purple=current) |
| **Attribution** | 8 sample loans, per-feature CPR decomposition (both methods), Excel formula recipe |
| Loan Projector | 6 archetypes × 5 rate scenarios (-200/-100/Flat/+100/+200bp), forward CPR/CDR vector, balance amortization, 30-year annual table |
| Coefficients | Sortable full table |
| Involuntary | Sub-nav: Overview / Fit / Cohorts / What-if / Coefficients |

### Theme constants
```js
const T = {
  bg: '#000000', bgAccent: '#1a0f00', panel: '#0a0a0a',
  border: '#1a1a1a', borderAccent: '#2a2a2a',
  text: '#d4d4d4', textDim: '#888', textBright: '#fff',
  accent: '#ff8c00', accentDim: '#cc6f00',
  green: '#00d96b', red: '#ff4d6d', blue: '#4d9fff', purple: '#b366ff',
  grid: '#1a1a1a',
};
```

### Required JSON shape
The dashboard expects `MODEL_DATA` with keys: `metadata` (intercept, AUC, feature_list, feature_groups, feature_labels, intercept_scaled, last_period, top_issuers, issuer_name_map), `coefficients[]`, `feature_stats{}`, `monthly[]`, `yearly[]`, `scurve[]`, `calibration[]`, `fha_cuts[]`, `lp_cuts[]`, `vintage_cuts[]`, `age_cuts[]`, `issuer_cuts[]`, `scurve_calib[]`, `yearly_calib[]`, `monthly_calib[]`, `archetype_anchors{}`, `issuer_scurves{}`, `attribution_loans[]`. Plus `MODEL_DATA_INV` for involuntary.

The Loan Projector reads `plc_now_bps` from `MODEL_DATA_INV.metadata` (since V6E doesn't include plc_rate as a feature, but the projector still needs the current PLC for refi incentive paths under shock scenarios).

---

## 7. Excel Implementation Path

The end-state goal is a production Excel workbook that reproduces V6E exactly. The math is fully specified:

```
For each feature j (j = 1..18):
  x_std[j] = (x_native[j] − mean[j]) / std[j]
  contrib[j] = beta_scaled[j] × x_std[j]

logit_z = intercept_scaled + Σ contrib[j]
SMM = 1 / (1 + EXP(−logit_z))
CPR = 1 − (1 − SMM)^12
```

All `mean[j]`, `std[j]`, `beta_scaled[j]`, and `intercept_scaled` are stored in `model_data_v6e.json` under `coefficients[]` and `metadata`. Two implementation forms are supported:

1. **Additive (standardized)**: above formulas. Preferred for clean regression interpretation.
2. **Native units (multiplicative-equivalent)**: each row stores `beta_native = beta_scaled / std[j]` and the implementation skips standardization. Stored in `coefficients[].beta_native`.

For attribution columns in Excel, add a per-feature column for `(beta_scaled × ((x − mean) / std))` and a final column for `(contrib_logit / total_logit_dev) × (pred_cpr − baseline_cpr)` — this gives the absolute attribution method.

---

## 8. Pending Work

### Immediate priorities
1. **Re-train involuntary model** with V6-clean features (currently still V5-era 10 features including `vintage_year`, `loan_rate`, `sato_bps`, `plc_rate_bps`)
2. **Generate Excel deliverable** — workbook with coefficients, formula docs, archetype examples, attribution worksheet
3. **Update archetype anchor data** with V6E predictions (currently the anchors carry V5 prediction baselines)

### Lower priority
- PPA data integration for cashout decomposition (refi vs cashout split)
- Property type multipliers in additive S-curve calibrator
- MaxCPR S-curve asymptote calibration for multiplicative form
- Decide production form: additive only / multiplicative only / both

### Recently resolved
- ✅ V6E training and validation (AUC 0.7614, all cohort fits acceptable)
- ✅ Dashboard updated for V6E (18 sliders, 5 groups, new Attribution tab)
- ✅ Both attribution methods implemented (waterfall + absolute proportional)
- ✅ Dashboard size reduced 26% via JSON slim pass (still launches in-chat)
- ✅ All 9 main.py fixes verified in latest parquet

---

## 9. User Style and Preferences

Nick is a fixed-income / MBS expert with deep GNMA multifamily expertise. He runs a production-quality quantitative modeling shop and works on a Dell XPS 16 / Windows.

**Communication preferences**:
- Bloomberg-aligned outputs (he checks against the BAM flipbook)
- Patient with iteration; values options with tradeoffs over single recommendations
- Appreciates honest assessments ("AUC barely moves" vs hand-waving)
- Uses concrete loan IDs as anchors (CITADEL CARE CENTER, HARBORTOWN PROPERTIES are recurring touchstones)
- Likes empirical testing of hypotheses before committing to design changes
- Bloomberg theme is the consistent visual language: black background, amber accent, IBM Plex Mono

**Technical preferences**:
- Single-file React/JSX artifacts that launch directly in chat
- Excel implementation is the end-state goal — features must be loan-level static or use small fixed lookups, no panel-dependent computation
- Calibration against BAM benchmark whenever possible
- Attribution must be additive and order-independent for institutional reports

**Validation discipline**:
- After every JSX edit, run a Babel parse pass to catch syntax errors before they reach the user
- Spot-check known anchor loans (CITADEL, HARBORTOWN) after pipeline changes
- Verify mathematical identities (e.g., baseline + Σ attribution = pred CPR)

---

## 10. How to Continue This Work

If picking up where we left off:

1. **Verify current state of working files**: confirm `main.py` has all 9 fixes (look for `ISSUER_NAME_NORMALIZATION` dict near the top, `has_next_period_evidence` block ~line 1391). Confirm `voluntary_prepay_dashboard.jsx` has 12 tabs including Attribution.

2. **If user provides fresh data**: run the fresh-parquet verification script in §3 to confirm Fixes 1–9 are baked in before retraining. If any fix is missing, the parquet was generated from an older `main.py` and needs regeneration.

3. **For V6E retraining on fresh data**: re-run `train_v6e.py` against the new parquet. Output is `model_data_v6e.json` (pretty) and `model_data_v6e_compact.json` (minified for embedding). Then surgical-edit the dashboard's `MODEL_DATA = {...}` block to use the new data.

4. **For involuntary V6 retrain**: pattern after `train_v6e.py` but with the involuntary target and a feature set free of the dropped V6 features. Currently `train_involuntary.py` is V5-era and uses `vintage_year`, `loan_rate`, `sato_bps`, `plc_rate_bps`.

5. **For dashboard edits**: ALWAYS run a Babel parse check after every edit. Past iterations have hit syntax errors from imperfect string replacements; Babel catches them in seconds and pinpoints the line.

6. **For Excel deliverable**: see §7 for the math spec. Coefficient values are in `model_data_v6e.json` under `coefficients[]` (both `beta_scaled` and `beta_native` are provided).

---

*End of handoff.*
