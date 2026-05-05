/**
 * V7 Voluntary Prepayment Model - Multiplicative Dashboard
 *
 * Single-file React + Recharts artifact. Drop into any React preview environment
 * (Claude artifact, CodeSandbox with React+Recharts, or `npx create-vite`).
 *
 * THREE inlined data blobs (substituted by `python3 train_v7.py --emit-dashboard`):
 *   - MODEL_DATA_V7         : the V7 multiplicative model + diagnostics
 *   - MODEL_DATA_V6F        : the V6F additive logit (for V6F vs V7 comparison)
 *   - ISSUER_RESIDUALS      : per-issuer residual-ratio overlay (optional)
 *
 * Tabs:
 *   Overview | Historical fits | S-curve | Calibration | Cohort cuts |
 *   Multipliers | Waterfall | What-if | Attribution | V6F vs V7 | Benchmarks
 */
import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Cell, ReferenceArea,
} from 'recharts';

/* __MODEL_DATA_V7__ */ const MODEL_DATA_V7 = {"metadata": {"training_pop_n": 982361, "training_events": 7686, "base_smm": 0.047634, "base_cpr": 44.327, "panel_actual_smm": 0.007824, "panel_actual_cpr": 8.9951, "n_features": 9, "n_free_params": 28, "test_auc": 0.7602656, "test_log_loss": 0.0427247, "period_range": ["201812", "202602"], "last_period": "202603", "model_version": "v7", "description": "V7 multiplicative voluntary prepayment model (9 bounded multipliers)", "max_cpr_full_panel": 71.76, "n_above_75_cpr": 0, "smm_cap": 0.1, "feature_list": ["M_age", "M_rate", "M_penalty", "M_size", "M_program", "M_purpose", "M_lockout", "M_maturity", "M_burnout"], "feature_labels": {"M_age": "age", "M_rate": "rate", "M_penalty": "penalty", "M_size": "size", "M_program": "program", "M_purpose": "purpose", "M_lockout": "lockout", "M_maturity": "maturity", "M_burnout": "burnout"}}, "multipliers": {"base_smm": 0.04763441074918602, "smm_cap": 0.1, "M_age": {"knots_x": [0.0, 12.0, 36.0, 96.0, 180.0, 360.0], "knots_y": [0.050157358040121836, 0.0500804750554331, 0.07283881538611073, 0.10912548335920541, 0.06453546932554528, 0.0500138193459888]}, "M_rate": {"floor": 0.8471141480930982, "asymptote": 8.976997065824875, "mid": 170.20829731133946, "slope": 48.56198352335905}, "M_penalty": {"floor": 0.2, "slope": -0.04963825552325859, "ppp_mean": 5.076951151358819}, "M_size": {"intercept": 0.766579241252599, "slope": 0.41579291791028733, "log_upb_anchor": 14.508658238524095, "low": 0.5, "high": 1.8}, "M_program": {"232": 0.6392284047288134, "538": 0.4364499414974989, "223a7": 0.682907047179478, "223f": 0.7270920574880474, "default": 0.7465982185729977}, "M_purpose": {"NC_bump": 3.0, "NC_decay": 0.3685548882521206}, "M_lockout": {"amplitude": 3.462359467185558e-11, "tau": 1.5177727503728905e-27}, "M_maturity": {"amplitude": 8.0, "cutoff": 15.000001084504625}, "M_burnout": {"floor": 0.9120043077149327, "slope": 3.870967612508596e-201}}, "multiplier_curves": {"M_age": [{"x": 0.0, "y": 0.0502}, {"x": 6.1017, "y": 0.0501}, {"x": 12.2034, "y": 0.0503}, {"x": 18.3051, "y": 0.0561}, {"x": 24.4068, "y": 0.0618}, {"x": 30.5085, "y": 0.0676}, {"x": 36.6102, "y": 0.0732}, {"x": 42.7119, "y": 0.0769}, {"x": 48.8136, "y": 0.0806}, {"x": 54.9153, "y": 0.0843}, {"x": 61.0169, "y": 0.088}, {"x": 67.1186, "y": 0.0917}, {"x": 73.2203, "y": 0.0953}, {"x": 79.322, "y": 0.099}, {"x": 85.4237, "y": 0.1027}, {"x": 91.5254, "y": 0.1064}, {"x": 97.6271, "y": 0.1083}, {"x": 103.7288, "y": 0.105}, {"x": 109.8305, "y": 0.1018}, {"x": 115.9322, "y": 0.0985}, {"x": 122.0339, "y": 0.0953}, {"x": 128.1356, "y": 0.0921}, {"x": 134.2373, "y": 0.0888}, {"x": 140.339, "y": 0.0856}, {"x": 146.4407, "y": 0.0823}, {"x": 152.5424, "y": 0.0791}, {"x": 158.6441, "y": 0.0759}, {"x": 164.7458, "y": 0.0726}, {"x": 170.8475, "y": 0.0694}, {"x": 176.9492, "y": 0.0662}, {"x": 183.0508, "y": 0.0643}, {"x": 189.1525, "y": 0.0638}, {"x": 195.2542, "y": 0.0633}, {"x": 201.3559, "y": 0.0628}, {"x": 207.4576, "y": 0.0623}, {"x": 213.5593, "y": 0.0618}, {"x": 219.661, "y": 0.0613}, {"x": 225.7627, "y": 0.0608}, {"x": 231.8644, "y": 0.0604}, {"x": 237.9661, "y": 0.0599}, {"x": 244.0678, "y": 0.0594}, {"x": 250.1695, "y": 0.0589}, {"x": 256.2712, "y": 0.0584}, {"x": 262.3729, "y": 0.0579}, {"x": 268.4746, "y": 0.0574}, {"x": 274.5763, "y": 0.0569}, {"x": 280.678, "y": 0.0564}, {"x": 286.7797, "y": 0.0559}, {"x": 292.8814, "y": 0.0554}, {"x": 298.9831, "y": 0.0549}, {"x": 305.0847, "y": 0.0544}, {"x": 311.1864, "y": 0.054}, {"x": 317.2881, "y": 0.0535}, {"x": 323.3898, "y": 0.053}, {"x": 329.4915, "y": 0.0525}, {"x": 335.5932, "y": 0.052}, {"x": 341.6949, "y": 0.0515}, {"x": 347.7966, "y": 0.051}, {"x": 353.8983, "y": 0.0505}, {"x": 360.0, "y": 0.05}], "M_rate": [{"x": -400.0, "y": 0.8472}, {"x": -379.5918, "y": 0.8472}, {"x": -359.1837, "y": 0.8473}, {"x": -338.7755, "y": 0.8474}, {"x": -318.3673, "y": 0.8475}, {"x": -297.9592, "y": 0.8477}, {"x": -277.551, "y": 0.848}, {"x": -257.1429, "y": 0.8485}, {"x": -236.7347, "y": 0.8492}, {"x": -216.3265, "y": 0.8502}, {"x": -195.9184, "y": 0.8519}, {"x": -175.5102, "y": 0.8544}, {"x": -155.102, "y": 0.8582}, {"x": -134.6939, "y": 0.8639}, {"x": -114.2857, "y": 0.8727}, {"x": -93.8776, "y": 0.886}, {"x": -73.4694, "y": 0.9061}, {"x": -53.0612, "y": 0.9367}, {"x": -32.6531, "y": 0.9827}, {"x": -12.2449, "y": 1.052}, {"x": 8.1633, "y": 1.1553}, {"x": 28.5714, "y": 1.308}, {"x": 48.9796, "y": 1.5304}, {"x": 69.3878, "y": 1.8475}, {"x": 89.7959, "y": 2.2863}, {"x": 110.2041, "y": 2.8687}, {"x": 130.6122, "y": 3.6008}, {"x": 151.0204, "y": 4.4602}, {"x": 171.4286, "y": 5.392}, {"x": 191.8367, "y": 6.319}, {"x": 212.2449, "y": 7.1654}, {"x": 232.6531, "y": 7.8801}, {"x": 253.0612, "y": 8.4446}, {"x": 273.4694, "y": 8.8675}, {"x": 293.8776, "y": 9.1719}, {"x": 314.2857, "y": 9.3847}, {"x": 334.6939, "y": 9.5306}, {"x": 355.102, "y": 9.6291}, {"x": 375.5102, "y": 9.695}, {"x": 395.9184, "y": 9.7389}, {"x": 416.3265, "y": 9.768}, {"x": 436.7347, "y": 9.7871}, {"x": 457.1429, "y": 9.7998}, {"x": 477.551, "y": 9.8081}, {"x": 497.9592, "y": 9.8136}, {"x": 518.3673, "y": 9.8172}, {"x": 538.7755, "y": 9.8196}, {"x": 559.1837, "y": 9.8211}, {"x": 579.5918, "y": 9.8222}, {"x": 600.0, "y": 9.8228}], "M_penalty": [{"x": 0.0, "y": 1.252}, {"x": 0.5, "y": 1.2272}, {"x": 1.0, "y": 1.2024}, {"x": 1.5, "y": 1.1776}, {"x": 2.0, "y": 1.1527}, {"x": 2.5, "y": 1.1279}, {"x": 3.0, "y": 1.1031}, {"x": 3.5, "y": 1.0783}, {"x": 4.0, "y": 1.0535}, {"x": 4.5, "y": 1.0286}, {"x": 5.0, "y": 1.0038}, {"x": 5.5, "y": 0.979}, {"x": 6.0, "y": 0.9542}, {"x": 6.5, "y": 0.9294}, {"x": 7.0, "y": 0.9045}, {"x": 7.5, "y": 0.8797}, {"x": 8.0, "y": 0.8549}, {"x": 8.5, "y": 0.8301}, {"x": 9.0, "y": 0.8053}, {"x": 9.5, "y": 0.7804}, {"x": 10.0, "y": 0.7556}], "M_size": [{"x": 13.1224, "y": 0.5}, {"x": 13.2582, "y": 0.5}, {"x": 13.3941, "y": 0.5}, {"x": 13.5299, "y": 0.5}, {"x": 13.6658, "y": 0.5}, {"x": 13.8016, "y": 0.5}, {"x": 13.9375, "y": 0.5291}, {"x": 14.0733, "y": 0.5856}, {"x": 14.2092, "y": 0.6421}, {"x": 14.3451, "y": 0.6986}, {"x": 14.4809, "y": 0.755}, {"x": 14.6168, "y": 0.8115}, {"x": 14.7526, "y": 0.868}, {"x": 14.8885, "y": 0.9245}, {"x": 15.0243, "y": 0.981}, {"x": 15.1602, "y": 1.0375}, {"x": 15.296, "y": 1.094}, {"x": 15.4319, "y": 1.1505}, {"x": 15.5677, "y": 1.2069}, {"x": 15.7036, "y": 1.2634}, {"x": 15.8395, "y": 1.3199}, {"x": 15.9753, "y": 1.3764}, {"x": 16.1112, "y": 1.4329}, {"x": 16.247, "y": 1.4894}, {"x": 16.3829, "y": 1.5459}, {"x": 16.5187, "y": 1.6023}, {"x": 16.6546, "y": 1.6588}, {"x": 16.7904, "y": 1.7153}, {"x": 16.9263, "y": 1.7718}, {"x": 17.0621, "y": 1.8}, {"x": 17.198, "y": 1.8}, {"x": 17.3338, "y": 1.8}, {"x": 17.4697, "y": 1.8}, {"x": 17.6056, "y": 1.8}, {"x": 17.7414, "y": 1.8}, {"x": 17.8773, "y": 1.8}, {"x": 18.0131, "y": 1.8}, {"x": 18.149, "y": 1.8}, {"x": 18.2848, "y": 1.8}, {"x": 18.4207, "y": 1.8}], "M_lockout": [{"x": 0.0, "y": 1.0}, {"x": 1.0, "y": 1.0}, {"x": 2.0, "y": 1.0}, {"x": 3.0, "y": 1.0}, {"x": 4.0, "y": 1.0}, {"x": 5.0, "y": 1.0}, {"x": 6.0, "y": 1.0}, {"x": 7.0, "y": 1.0}, {"x": 8.0, "y": 1.0}, {"x": 9.0, "y": 1.0}, {"x": 10.0, "y": 1.0}, {"x": 11.0, "y": 1.0}, {"x": 12.0, "y": 1.0}, {"x": 13.0, "y": 1.0}, {"x": 14.0, "y": 1.0}, {"x": 15.0, "y": 1.0}, {"x": 16.0, "y": 1.0}, {"x": 17.0, "y": 1.0}, {"x": 18.0, "y": 1.0}, {"x": 19.0, "y": 1.0}, {"x": 20.0, "y": 1.0}, {"x": 21.0, "y": 1.0}, {"x": 22.0, "y": 1.0}, {"x": 23.0, "y": 1.0}, {"x": 24.0, "y": 1.0}], "M_maturity": [{"x": 0.0, "y": 1.0}, {"x": 2.069, "y": 7.8966}, {"x": 4.1379, "y": 6.7931}, {"x": 6.2069, "y": 5.6897}, {"x": 8.2759, "y": 4.5862}, {"x": 10.3448, "y": 3.4828}, {"x": 12.4138, "y": 2.3793}, {"x": 14.4828, "y": 1.2759}, {"x": 16.5517, "y": 1.0}, {"x": 18.6207, "y": 1.0}, {"x": 20.6897, "y": 1.0}, {"x": 22.7586, "y": 1.0}, {"x": 24.8276, "y": 1.0}, {"x": 26.8966, "y": 1.0}, {"x": 28.9655, "y": 1.0}, {"x": 31.0345, "y": 1.0}, {"x": 33.1034, "y": 1.0}, {"x": 35.1724, "y": 1.0}, {"x": 37.2414, "y": 1.0}, {"x": 39.3103, "y": 1.0}, {"x": 41.3793, "y": 1.0}, {"x": 43.4483, "y": 1.0}, {"x": 45.5172, "y": 1.0}, {"x": 47.5862, "y": 1.0}, {"x": 49.6552, "y": 1.0}, {"x": 51.7241, "y": 1.0}, {"x": 53.7931, "y": 1.0}, {"x": 55.8621, "y": 1.0}, {"x": 57.931, "y": 1.0}, {"x": 60.0, "y": 1.0}], "M_burnout": [{"x": 0.0, "y": 1.0}, {"x": 0.05, "y": 1.0}, {"x": 0.1, "y": 1.0}, {"x": 0.15, "y": 1.0}, {"x": 0.2, "y": 1.0}, {"x": 0.25, "y": 1.0}, {"x": 0.3, "y": 1.0}, {"x": 0.35, "y": 1.0}, {"x": 0.4, "y": 1.0}, {"x": 0.45, "y": 1.0}, {"x": 0.5, "y": 1.0}, {"x": 0.55, "y": 1.0}, {"x": 0.6, "y": 1.0}, {"x": 0.65, "y": 1.0}, {"x": 0.7, "y": 1.0}, {"x": 0.75, "y": 1.0}, {"x": 0.8, "y": 1.0}, {"x": 0.85, "y": 1.0}, {"x": 0.9, "y": 1.0}, {"x": 0.95, "y": 1.0}, {"x": 1.0, "y": 1.0}], "M_program": [{"x": "232", "y": 0.6392}, {"x": "538", "y": 0.4364}, {"x": "223a7", "y": 0.6829}, {"x": "223f", "y": 0.7271}, {"x": "default", "y": 0.7466}], "M_purpose": [{"x": "NC@age=0", "y": 4.0}, {"x": "NC@age=30", "y": 1.0}, {"x": "NC@age=60", "y": 1.0}, {"x": "RP/OTHER", "y": 1.0}]}, "monthly": [{"period": "201812", "n": 2764, "actual_smm": 0.0036179, "pred_smm": 0.0053227, "actual_cpr": 4.2562, "pred_cpr": 6.2036}, {"period": "201901", "n": 2760, "actual_smm": 0.0028986, "pred_smm": 0.0053975, "actual_cpr": 3.4233, "pred_cpr": 6.2881}, {"period": "201902", "n": 2767, "actual_smm": 0.0046982, "pred_smm": 0.005304, "actual_cpr": 5.4944, "pred_cpr": 6.1824}, {"period": "201903", "n": 2765, "actual_smm": 0.00217, "pred_smm": 0.0062865, "actual_cpr": 2.5731, "pred_cpr": 7.2884}, {"period": "201904", "n": 2780, "actual_smm": 0.0035971, "pred_smm": 0.0066908, "actual_cpr": 4.2322, "pred_cpr": 7.74}, {"period": "201905", "n": 2785, "actual_smm": 0.0035907, "pred_smm": 0.0089766, "actual_cpr": 4.2247, "pred_cpr": 10.2557}, {"period": "201906", "n": 2792, "actual_smm": 0.0050143, "pred_smm": 0.0092211, "actual_cpr": 5.854, "pred_cpr": 10.521}, {"period": "201907", "n": 2794, "actual_smm": 0.0042949, "pred_smm": 0.0101537, "actual_cpr": 5.0339, "pred_cpr": 11.5265}, {"period": "201908", "n": 2797, "actual_smm": 0.0039328, "pred_smm": 0.0133066, "actual_cpr": 4.6186, "pred_cpr": 14.8496}, {"period": "201909", "n": 2805, "actual_smm": 0.0046346, "pred_smm": 0.0117495, "actual_cpr": 5.4219, "pred_cpr": 13.223}, {"period": "201910", "n": 2817, "actual_smm": 0.0049698, "pred_smm": 0.0120171, "actual_cpr": 5.8034, "pred_cpr": 13.5046}, {"period": "201911", "n": 2821, "actual_smm": 0.0049628, "pred_smm": 0.0102938, "actual_cpr": 5.7954, "pred_cpr": 11.6767}, {"period": "201912", "n": 2831, "actual_smm": 0.0084776, "pred_smm": 0.009125, "actual_cpr": 9.7119, "pred_cpr": 10.4168}, {"period": "202001", "n": 2823, "actual_smm": 0.0063762, "pred_smm": 0.0128918, "actual_cpr": 7.3887, "pred_cpr": 14.4191}, {"period": "202002", "n": 2824, "actual_smm": 0.0141643, "pred_smm": 0.0151949, "actual_cpr": 15.7336, "pred_cpr": 16.7847}, {"period": "202003", "n": 2812, "actual_smm": 0.0092461, "pred_smm": 0.0153319, "actual_cpr": 10.5481, "pred_cpr": 16.9235}, {"period": "202004", "n": 2822, "actual_smm": 0.0106308, "pred_smm": 0.0172234, "actual_cpr": 12.0368, "pred_cpr": 18.8184}, {"period": "202005", "n": 2845, "actual_smm": 0.0115993, "pred_smm": 0.0178071, "actual_cpr": 13.0646, "pred_cpr": 19.3951}, {"period": "202006", "n": 2864, "actual_smm": 0.0181564, "pred_smm": 0.0181915, "actual_cpr": 19.7384, "pred_cpr": 19.7729}, {"period": "202007", "n": 2864, "actual_smm": 0.0181564, "pred_smm": 0.020385, "actual_cpr": 19.7384, "pred_cpr": 21.8974}, {"period": "202008", "n": 2864, "actual_smm": 0.0160615, "pred_smm": 0.0207624, "actual_cpr": 17.6591, "pred_cpr": 22.2578}, {"period": "202009", "n": 2865, "actual_smm": 0.0184991, "pred_smm": 0.0206698, "actual_cpr": 20.074, "pred_cpr": 22.1695}, {"period": "202010", "n": 2857, "actual_smm": 0.0248512, "pred_smm": 0.0180349, "actual_cpr": 26.0649, "pred_cpr": 19.6191}, {"period": "202011", "n": 2834, "actual_smm": 0.0271701, "pred_smm": 0.0185599, "actual_cpr": 28.1473, "pred_cpr": 20.1334}, {"period": "202012", "n": 2819, "actual_smm": 0.0283789, "pred_smm": 0.0188975, "actual_cpr": 29.2114, "pred_cpr": 20.4624}, {"period": "202101", "n": 2809, "actual_smm": 0.0238519, "pred_smm": 0.0180338, "actual_cpr": 25.1506, "pred_cpr": 19.6181}, {"period": "202102", "n": 2795, "actual_smm": 0.0239714, "pred_smm": 0.0157841, "actual_cpr": 25.2604, "pred_cpr": 17.3801}, {"period": "202103", "n": 2787, "actual_smm": 0.0208109, "pred_smm": 0.0133613, "actual_cpr": 22.304, "pred_cpr": 14.9063}, {"period": "202104", "n": 2779, "actual_smm": 0.0241094, "pred_smm": 0.0141378, "actual_cpr": 25.3871, "pred_cpr": 15.7064}, {"period": "202105", "n": 2774, "actual_smm": 0.019106, "pred_smm": 0.0154419, "actual_cpr": 20.665, "pred_cpr": 17.0348}, {"period": "202106", "n": 2763, "actual_smm": 0.0213536, "pred_smm": 0.0163838, "actual_cpr": 22.8191, "pred_cpr": 17.9822}, {"period": "202107", "n": 2744, "actual_smm": 0.0127551, "pred_smm": 0.017541, "actual_cpr": 14.2767, "pred_cpr": 19.1327}, {"period": "202108", "n": 2742, "actual_smm": 0.0149526, "pred_smm": 0.016444, "actual_cpr": 16.5386, "pred_cpr": 18.0425}, {"period": "202109", "n": 2744, "actual_smm": 0.0204082, "pred_smm": 0.0155773, "actual_cpr": 21.9196, "pred_cpr": 17.1716}, {"period": "202110", "n": 2739, "actual_smm": 0.0200803, "pred_smm": 0.015087, "actual_cpr": 21.6055, "pred_cpr": 16.6751}, {"period": "202111", "n": 2740, "actual_smm": 0.0175182, "pred_smm": 0.0147634, "actual_cpr": 19.1102, "pred_cpr": 16.346}, {"period": "202112", "n": 2738, "actual_smm": 0.0262966, "pred_smm": 0.0137809, "actual_cpr": 27.3693, "pred_cpr": 15.3395}, {"period": "202201", "n": 2700, "actual_smm": 0.0111111, "pred_smm": 0.0115945, "actual_cpr": 12.548, "pred_cpr": 13.0595}, {"period": "202202", "n": 2717, "actual_smm": 0.0161943, "pred_smm": 0.009647, "actual_cpr": 17.7924, "pred_cpr": 10.9815}, {"period": "202203", "n": 2710, "actual_smm": 0.0099631, "pred_smm": 0.0066773, "actual_cpr": 11.3219, "pred_cpr": 7.725}, {"period": "202204", "n": 2718, "actual_smm": 0.0099338, "pred_smm": 0.0045046, "actual_cpr": 11.2903, "pred_cpr": 5.2736}, {"period": "202205", "n": 2732, "actual_smm": 0.0120791, "pred_smm": 0.004469, "actual_cpr": 13.5696, "pred_cpr": 5.2329}, {"period": "202206", "n": 2732, "actual_smm": 0.0087848, "pred_smm": 0.0038938, "actual_cpr": 10.047, "pred_cpr": 4.5738}, {"period": "202207", "n": 2735, "actual_smm": 0.0040219, "pred_smm": 0.0044153, "actual_cpr": 4.721, "pred_cpr": 5.1715}, {"period": "202208", "n": 2739, "actual_smm": 0.007667, "pred_smm": 0.0035472, "actual_cpr": 8.8222, "pred_cpr": 4.1746}, {"period": "202209", "n": 2731, "actual_smm": 0.0080557, "pred_smm": 0.0029538, "actual_cpr": 9.2498, "pred_cpr": 3.4876}, {"period": "202210", "n": 2727, "actual_smm": 0.0044004, "pred_smm": 0.0027522, "actual_cpr": 5.1546, "pred_cpr": 3.2532}, {"period": "202211", "n": 2747, "actual_smm": 0.0036403, "pred_smm": 0.0030096, "actual_cpr": 4.282, "pred_cpr": 3.5523}, {"period": "202212", "n": 2753, "actual_smm": 0.0047221, "pred_smm": 0.0029376, "actual_cpr": 5.5217, "pred_cpr": 3.4687}, {"period": "202301", "n": 2754, "actual_smm": 0.0036311, "pred_smm": 0.0032164, "actual_cpr": 4.2713, "pred_cpr": 3.7921}, {"period": "202302", "n": 2756, "actual_smm": 0.0010885, "pred_smm": 0.0030399, "actual_cpr": 1.2984, "pred_cpr": 3.5875}, {"period": "202303", "n": 2771, "actual_smm": 0.0043306, "pred_smm": 0.0030687, "actual_cpr": 5.0747, "pred_cpr": 3.6209}, {"period": "202304", "n": 2773, "actual_smm": 0.0007212, "pred_smm": 0.0030097, "actual_cpr": 0.8621, "pred_cpr": 3.5525}, {"period": "202305", "n": 2780, "actual_smm": 0.0028777, "pred_smm": 0.0028739, "actual_cpr": 3.3991, "pred_cpr": 3.3947}, {"period": "202306", "n": 2785, "actual_smm": 0.0043088, "pred_smm": 0.0028497, "actual_cpr": 5.0498, "pred_cpr": 3.3665}, {"period": "202307", "n": 2782, "actual_smm": 0.0025162, "pred_smm": 0.0028083, "actual_cpr": 2.978, "pred_cpr": 3.3183}, {"period": "202308", "n": 2788, "actual_smm": 0.0025108, "pred_smm": 0.0027627, "actual_cpr": 2.9717, "pred_cpr": 3.2653}, {"period": "202309", "n": 2796, "actual_smm": 0.0032189, "pred_smm": 0.0026586, "actual_cpr": 3.795, "pred_cpr": 3.1441}, {"period": "202310", "n": 2808, "actual_smm": 0.0024929, "pred_smm": 0.0026056, "actual_cpr": 2.9508, "pred_cpr": 3.0823}, {"period": "202311", "n": 2812, "actual_smm": 0.0042674, "pred_smm": 0.0027377, "actual_cpr": 5.0024, "pred_cpr": 3.2362}, {"period": "202312", "n": 2810, "actual_smm": 0.0014235, "pred_smm": 0.0029861, "actual_cpr": 1.6949, "pred_cpr": 3.525}, {"period": "202401", "n": 2811, "actual_smm": 0.0007115, "pred_smm": 0.0029969, "actual_cpr": 0.8505, "pred_cpr": 3.5376}, {"period": "202402", "n": 2815, "actual_smm": 0.0010657, "pred_smm": 0.0029124, "actual_cpr": 1.2714, "pred_cpr": 3.4394}, {"period": "202403", "n": 2822, "actual_smm": 0.0021262, "pred_smm": 0.0029458, "actual_cpr": 2.5218, "pred_cpr": 3.4782}, {"period": "202404", "n": 2824, "actual_smm": 0.0017705, "pred_smm": 0.0027926, "actual_cpr": 2.1041, "pred_cpr": 3.3001}, {"period": "202405", "n": 2824, "actual_smm": 0.0021246, "pred_smm": 0.0028771, "actual_cpr": 2.52, "pred_cpr": 3.3984}, {"period": "202406", "n": 2832, "actual_smm": 0.0014124, "pred_smm": 0.0029451, "actual_cpr": 1.6818, "pred_cpr": 3.4774}, {"period": "202407", "n": 2838, "actual_smm": 0.0031712, "pred_smm": 0.0031216, "actual_cpr": 3.7398, "pred_cpr": 3.6823}, {"period": "202408", "n": 2840, "actual_smm": 0.0021127, "pred_smm": 0.0032126, "actual_cpr": 2.506, "pred_cpr": 3.7877}, {"period": "202409", "n": 2851, "actual_smm": 0.0024553, "pred_smm": 0.0034009, "actual_cpr": 2.9069, "pred_cpr": 4.0057}, {"period": "202410", "n": 2856, "actual_smm": 0.0017507, "pred_smm": 0.003084, "actual_cpr": 2.0807, "pred_cpr": 3.6386}, {"period": "202411", "n": 2860, "actual_smm": 0.0020979, "pred_smm": 0.0032029, "actual_cpr": 2.4886, "pred_cpr": 3.7764}, {"period": "202412", "n": 2866, "actual_smm": 0.0027913, "pred_smm": 0.0030291, "actual_cpr": 3.2987, "pred_cpr": 3.575}, {"period": "202501", "n": 2872, "actual_smm": 0.0020891, "pred_smm": 0.0030516, "actual_cpr": 2.4784, "pred_cpr": 3.601}, {"period": "202502", "n": 2873, "actual_smm": 0.0020884, "pred_smm": 0.0032096, "actual_cpr": 2.4775, "pred_cpr": 3.7842}, {"period": "202503", "n": 2883, "actual_smm": 0.002428, "pred_smm": 0.003186, "actual_cpr": 2.875, "pred_cpr": 3.757}, {"period": "202504", "n": 2895, "actual_smm": 0.0027634, "pred_smm": 0.0031292, "actual_cpr": 3.2661, "pred_cpr": 3.6911}, {"period": "202505", "n": 2896, "actual_smm": 0.0027624, "pred_smm": 0.0030438, "actual_cpr": 3.265, "pred_cpr": 3.5921}, {"period": "202506", "n": 2904, "actual_smm": 0.0013774, "pred_smm": 0.0031417, "actual_cpr": 1.6404, "pred_cpr": 3.7056}, {"period": "202507", "n": 2920, "actual_smm": 0.0034247, "pred_smm": 0.0031096, "actual_cpr": 4.0331, "pred_cpr": 3.6684}, {"period": "202508", "n": 2922, "actual_smm": 0.0027379, "pred_smm": 0.00323, "actual_cpr": 3.2364, "pred_cpr": 3.8079}, {"period": "202509", "n": 2935, "actual_smm": 0.0013629, "pred_smm": 0.0033576, "actual_cpr": 1.6232, "pred_cpr": 3.9556}, {"period": "202510", "n": 2943, "actual_smm": 0.0037377, "pred_smm": 0.0034418, "actual_cpr": 4.3942, "pred_cpr": 4.0529}, {"period": "202511", "n": 2950, "actual_smm": 0.0010169, "pred_smm": 0.0035847, "actual_cpr": 1.2135, "pred_cpr": 4.2179}, {"period": "202512", "n": 2964, "actual_smm": 0.0047233, "pred_smm": 0.0035697, "actual_cpr": 5.5231, "pred_cpr": 4.2006}, {"period": "202601", "n": 2974, "actual_smm": 0.0020175, "pred_smm": 0.0037798, "actual_cpr": 2.3943, "pred_cpr": 4.4427}, {"period": "202602", "n": 2975, "actual_smm": 0.0040336, "pred_smm": 0.0040415, "actual_cpr": 4.7344, "pred_cpr": 4.7434}], "yearly": [{"year": 2018, "n": 2764, "actual_smm": 0.0036179, "pred_smm": 0.0053227, "actual_cpr": 4.2562, "pred_cpr": 6.2036}, {"year": 2019, "n": 33514, "actual_smm": 0.0044459, "pred_smm": 0.009058, "actual_cpr": 5.2065, "pred_cpr": 10.3441}, {"year": 2020, "n": 34093, "actual_smm": 0.0169536, "pred_smm": 0.0178408, "actual_cpr": 18.5506, "pred_cpr": 19.4282}, {"year": 2021, "n": 33154, "actual_smm": 0.02045, "pred_smm": 0.0155299, "actual_cpr": 21.9597, "pred_cpr": 17.1237}, {"year": 2022, "n": 32741, "actual_smm": 0.0083687, "pred_smm": 0.0050219, "actual_cpr": 9.5929, "pred_cpr": 5.8625}, {"year": 2023, "n": 33415, "actual_smm": 0.0027832, "pred_smm": 0.0028839, "actual_cpr": 3.2892, "pred_cpr": 3.4063}, {"year": 2024, "n": 34039, "actual_smm": 0.0019683, "pred_smm": 0.003044, "actual_cpr": 2.3366, "pred_cpr": 3.5923}, {"year": 2025, "n": 34957, "actual_smm": 0.002546, "pred_smm": 0.0032562, "actual_cpr": 3.0128, "pred_cpr": 3.8382}, {"year": 2026, "n": 5949, "actual_smm": 0.0030257, "pred_smm": 0.0039107, "actual_cpr": 3.571, "pred_cpr": 4.5932}], "scurve": [{"ri_bucket": 0, "n": 3308, "ri_mid": -327.32, "actual_smm": 0.0006046, "pred_smm": 0.0027809, "actual_cpr": 0.7231, "pred_cpr": 3.2865}, {"ri_bucket": 1, "n": 35878, "ri_mid": -240.58, "actual_smm": 0.0016723, "pred_smm": 0.0028643, "actual_cpr": 1.9884, "pred_cpr": 3.3836}, {"ri_bucket": 2, "n": 48464, "ri_mid": -150.84, "actual_smm": 0.0030125, "pred_smm": 0.002916, "actual_cpr": 3.5558, "pred_cpr": 3.4436}, {"ri_bucket": 3, "n": 17770, "ri_mid": -75.86, "actual_smm": 0.004108, "pred_smm": 0.0026573, "actual_cpr": 4.8198, "pred_cpr": 3.1425}, {"ri_bucket": 4, "n": 14322, "ri_mid": -25.0, "actual_smm": 0.0045385, "pred_smm": 0.0028764, "actual_cpr": 5.3123, "pred_cpr": 3.3976}, {"ri_bucket": 5, "n": 16257, "ri_mid": 27.05, "actual_smm": 0.0047364, "pred_smm": 0.0038114, "actual_cpr": 5.538, "pred_cpr": 4.479}, {"ri_bucket": 6, "n": 22744, "ri_mid": 76.3, "actual_smm": 0.0046606, "pred_smm": 0.0059855, "actual_cpr": 5.4515, "pred_cpr": 6.9508}, {"ri_bucket": 7, "n": 26097, "ri_mid": 125.84, "actual_smm": 0.00866, "pred_smm": 0.0105224, "actual_cpr": 9.911, "pred_cpr": 11.9211}, {"ri_bucket": 8, "n": 24544, "ri_mid": 174.8, "actual_smm": 0.0178455, "pred_smm": 0.0168172, "actual_cpr": 19.4329, "pred_cpr": 18.4149}, {"ri_bucket": 9, "n": 24451, "ri_mid": 238.42, "actual_smm": 0.0246207, "pred_smm": 0.0216483, "actual_cpr": 25.8549, "pred_cpr": 23.0976}, {"ri_bucket": 10, "n": 9306, "ri_mid": 379.57, "actual_smm": 0.0155813, "pred_smm": 0.0178684, "actual_cpr": 17.1757, "pred_cpr": 19.4555}, {"ri_bucket": 11, "n": 1485, "ri_mid": 562.35, "actual_smm": 0.0107744, "pred_smm": 0.0135557, "actual_cpr": 12.19, "pred_cpr": 15.1072}], "calibration": [{"decile": 0, "n": 24463, "pred_smm": 0.00123, "actual_smm": 0.00233, "pred_cpr": 1.4661, "actual_cpr": 2.7605}, {"decile": 1, "n": 24463, "pred_smm": 0.0020096, "actual_smm": 0.0021665, "pred_cpr": 2.385, "actual_cpr": 2.5691}, {"decile": 2, "n": 24462, "pred_smm": 0.0025924, "actual_smm": 0.0029842, "pred_cpr": 3.0669, "actual_cpr": 3.5229}, {"decile": 3, "n": 24463, "pred_smm": 0.0031428, "actual_smm": 0.0026162, "pred_cpr": 3.7068, "actual_cpr": 3.0947}, {"decile": 4, "n": 24462, "pred_smm": 0.0037495, "actual_smm": 0.0031477, "pred_cpr": 4.4078, "actual_cpr": 3.7126}, {"decile": 5, "n": 24463, "pred_smm": 0.0046859, "actual_smm": 0.0045783, "pred_cpr": 5.4804, "actual_cpr": 5.3578}, {"decile": 6, "n": 24462, "pred_smm": 0.0066416, "actual_smm": 0.005437, "pred_cpr": 7.6852, "actual_cpr": 6.3328}, {"decile": 7, "n": 24463, "pred_smm": 0.0105738, "actual_smm": 0.007726, "pred_cpr": 11.9761, "actual_cpr": 8.8872}, {"decile": 8, "n": 24462, "pred_smm": 0.0159468, "actual_smm": 0.0162293, "pred_cpr": 17.5439, "actual_cpr": 17.8274}, {"decile": 9, "n": 24463, "pred_smm": 0.0288506, "actual_smm": 0.0327433, "pred_cpr": 29.6227, "actual_cpr": 32.9342}], "fha_cuts": [{"key": "220", "n": 461, "actual_smm": 0.0086768, "pred_smm": 0.0101438, "actual_cpr": 9.9294, "pred_cpr": 11.5159}, {"key": "221d4", "n": 41688, "actual_smm": 0.0095951, "pred_smm": 0.009749, "actual_cpr": 10.9255, "pred_cpr": 11.0915}, {"key": "223a7", "n": 26866, "actual_smm": 0.0082632, "pred_smm": 0.0083059, "actual_cpr": 9.4774, "pred_cpr": 9.5242}, {"key": "223f", "n": 95548, "actual_smm": 0.0074727, "pred_smm": 0.0075979, "actual_cpr": 8.6077, "pred_cpr": 8.746}, {"key": "232", "n": 59528, "actual_smm": 0.0081642, "pred_smm": 0.0078616, "actual_cpr": 9.3689, "pred_cpr": 9.0365}, {"key": "241", "n": 1885, "actual_smm": 0.0111406, "pred_smm": 0.0115298, "actual_cpr": 12.5792, "pred_cpr": 12.9912}, {"key": "538", "n": 15620, "actual_smm": 0.0050576, "pred_smm": 0.0036451, "actual_cpr": 5.9031, "pred_cpr": 4.2875}, {"key": "OTHER", "n": 3030, "actual_smm": 0.009901, "pred_smm": 0.0118937, "actual_cpr": 11.2551, "pred_cpr": 13.3749}], "lp_cuts": [{"key": "538", "n": 15620, "actual_smm": 0.0050576, "pred_smm": 0.0036451, "actual_cpr": 5.9031, "pred_cpr": 4.2875}, {"key": "NC", "n": 28794, "actual_smm": 0.0105578, "pred_smm": 0.010624, "actual_cpr": 11.9589, "pred_cpr": 12.0296}, {"key": "OTHER", "n": 3030, "actual_smm": 0.009901, "pred_smm": 0.0118937, "actual_cpr": 11.2551, "pred_cpr": 13.3749}, {"key": "RP", "n": 197182, "actual_smm": 0.0078253, "pred_smm": 0.0078304, "actual_cpr": 8.9965, "pred_cpr": 9.0022}], "vintage_cuts": [{"key": "1989.0", "n": 35, "actual_smm": 0.0285714, "pred_smm": 0.0055901, "actual_cpr": 29.3796, "pred_cpr": 6.5056}, {"key": "1994.0", "n": 28, "actual_smm": 0.0357143, "pred_smm": 0.0039174, "actual_cpr": 35.3648, "pred_cpr": 4.6009}, {"key": "1995.0", "n": 149, "actual_smm": 0.0067114, "pred_smm": 0.0099394, "actual_cpr": 7.763, "pred_cpr": 11.2964}, {"key": "1996.0", "n": 46, "actual_smm": 0.0434783, "pred_smm": 0.0147652, "actual_cpr": 41.3405, "pred_cpr": 16.3479}, {"key": "1998.0", "n": 301, "actual_smm": 0.013289, "pred_smm": 0.0081711, "actual_cpr": 14.8314, "pred_cpr": 9.3765}, {"key": "1999.0", "n": 174, "actual_smm": 0.0172414, "pred_smm": 0.0140918, "actual_cpr": 18.8362, "pred_cpr": 15.6592}, {"key": "2000.0", "n": 389, "actual_smm": 0.0025707, "pred_smm": 0.0119537, "actual_cpr": 3.0416, "pred_cpr": 13.438}, {"key": "2001.0", "n": 703, "actual_smm": 0.0099573, "pred_smm": 0.0100641, "actual_cpr": 11.3157, "pred_cpr": 11.4304}, {"key": "2002.0", "n": 1398, "actual_smm": 0.0114449, "pred_smm": 0.0108852, "actual_cpr": 12.9015, "pred_cpr": 12.3079}, {"key": "2003.0", "n": 4664, "actual_smm": 0.0055746, "pred_smm": 0.0082958, "actual_cpr": 6.4882, "pred_cpr": 9.5131}, {"key": "2004.0", "n": 2592, "actual_smm": 0.0131173, "pred_smm": 0.0096221, "actual_cpr": 14.6533, "pred_cpr": 10.9546}, {"key": "2005.0", "n": 3204, "actual_smm": 0.0087391, "pred_smm": 0.0103687, "actual_cpr": 9.9972, "pred_cpr": 11.7568}, {"key": "2006.0", "n": 5838, "actual_smm": 0.0054813, "pred_smm": 0.0088284, "actual_cpr": 6.3829, "pred_cpr": 10.0945}, {"key": "2007.0", "n": 4470, "actual_smm": 0.0085011, "pred_smm": 0.0093997, "actual_cpr": 9.7376, "pred_cpr": 10.7144}, {"key": "2008.0", "n": 3372, "actual_smm": 0.0041518, "pred_smm": 0.0094395, "actual_cpr": 4.87, "pred_cpr": 10.7575}, {"key": "2009.0", "n": 4534, "actual_smm": 0.0068372, "pred_smm": 0.0122127, "actual_cpr": 7.9031, "pred_cpr": 13.7098}, {"key": "2010.0", "n": 6738, "actual_smm": 0.0121698, "pred_smm": 0.0132873, "actual_cpr": 13.6648, "pred_cpr": 14.8296}, {"key": "2011.0", "n": 11040, "actual_smm": 0.0121377, "pred_smm": 0.0134783, "actual_cpr": 13.6312, "pred_cpr": 15.0272}, {"key": "2012.0", "n": 22241, "actual_smm": 0.0085877, "pred_smm": 0.0080582, "actual_cpr": 9.8322, "pred_cpr": 9.2526}, {"key": "2013.0", "n": 22969, "actual_smm": 0.0114067, "pred_smm": 0.010042, "actual_cpr": 12.8611, "pred_cpr": 11.4067}, {"key": "2014.0", "n": 17409, "actual_smm": 0.0112011, "pred_smm": 0.0116483, "actual_cpr": 12.6434, "pred_cpr": 13.1163}, {"key": "2015.0", "n": 15351, "actual_smm": 0.0099668, "pred_smm": 0.0095491, "actual_cpr": 11.3258, "pred_cpr": 10.8759}, {"key": "2016.0", "n": 15206, "actual_smm": 0.011114, "pred_smm": 0.0085429, "actual_cpr": 12.5511, "pred_cpr": 9.7833}, {"key": "2017.0", "n": 18637, "actual_smm": 0.0081022, "pred_smm": 0.0075781, "actual_cpr": 9.3008, "pred_cpr": 8.7241}, {"key": "2018.0", "n": 14480, "actual_smm": 0.0123619, "pred_smm": 0.0077737, "actual_cpr": 13.8661, "pred_cpr": 8.9398}, {"key": "2019.0", "n": 12337, "actual_smm": 0.0077815, "pred_smm": 0.0059273, "actual_cpr": 8.9483, "pred_cpr": 6.8854}, {"key": "2020.0", "n": 21652, "actual_smm": 0.0025864, "pred_smm": 0.003454, "actual_cpr": 3.0599, "pred_cpr": 4.0669}, {"key": "2021.0", "n": 19144, "actual_smm": 0.0010969, "pred_smm": 0.0026791, "actual_cpr": 1.3084, "pred_cpr": 3.1679}, {"key": "2022.0", "n": 9747, "actual_smm": 0.0015389, "pred_smm": 0.0022873, "actual_cpr": 1.8312, "pred_cpr": 2.7105}, {"key": "2023.0", "n": 2892, "actual_smm": 0.0, "pred_smm": 0.0046912, "actual_cpr": 0.0, "pred_cpr": 5.4865}, {"key": "2024.0", "n": 1637, "actual_smm": 0.0030544, "pred_smm": 0.0045072, "actual_cpr": 3.6043, "pred_cpr": 5.2765}, {"key": "2025.0", "n": 1032, "actual_smm": 0.002907, "pred_smm": 0.005704, "actual_cpr": 3.4331, "pred_cpr": 6.6342}, {"key": "2026.0", "n": 11, "actual_smm": 0.0, "pred_smm": 0.005159, "actual_cpr": 0.0, "pred_cpr": 6.0181}], "age_cuts": [{"key": "0-12m", "n": 16499, "actual_smm": 0.0036972, "pred_smm": 0.0046669, "actual_cpr": 4.3475, "pred_cpr": 5.4588}, {"key": "12-36m", "n": 38460, "actual_smm": 0.0067343, "pred_smm": 0.0054051, "actual_cpr": 7.7884, "pred_cpr": 6.2967}, {"key": "36-60m", "n": 43414, "actual_smm": 0.0071175, "pred_smm": 0.007203, "actual_cpr": 8.2145, "pred_cpr": 8.3092}, {"key": "60-120m", "n": 86123, "actual_smm": 0.0105547, "pred_smm": 0.0105078, "actual_cpr": 11.9556, "pred_cpr": 11.9056}, {"key": "120-180m", "n": 39826, "actual_smm": 0.0069804, "pred_smm": 0.0074714, "actual_cpr": 8.0622, "pred_cpr": 8.6063}, {"key": "180m+", "n": 20304, "actual_smm": 0.0068952, "pred_smm": 0.0070323, "actual_cpr": 7.9675, "pred_cpr": 8.1199}], "mtm_cuts": [{"key": "0-12m", "n": 245, "actual_smm": 0.0571429, "pred_smm": 0.0209485, "actual_cpr": 50.6428, "pred_cpr": 22.4349}, {"key": "12-24m", "n": 201, "actual_smm": 0.0199005, "pred_smm": 0.0060262, "actual_cpr": 21.4327, "pred_cpr": 6.9965}, {"key": "24-36m", "n": 282, "actual_smm": 0.0070922, "pred_smm": 0.0068226, "actual_cpr": 8.1864, "pred_cpr": 7.8868}, {"key": "36-60m", "n": 662, "actual_smm": 0.0090634, "pred_smm": 0.0082904, "actual_cpr": 10.35, "pred_cpr": 9.5071}, {"key": "60-120m", "n": 5122, "actual_smm": 0.0062476, "pred_smm": 0.0059715, "actual_cpr": 7.2448, "pred_cpr": 6.935}, {"key": "120m+", "n": 238114, "actual_smm": 0.007971, "pred_smm": 0.0079733, "actual_cpr": 9.1568, "pred_cpr": 9.1593}], "size_cuts": [{"key": "<2M", "n": 58350, "actual_smm": 0.0059983, "pred_smm": 0.0060576, "actual_cpr": 6.9652, "pred_cpr": 7.0318}, {"key": "2-5M", "n": 61629, "actual_smm": 0.0077723, "pred_smm": 0.0078907, "actual_cpr": 8.9382, "pred_cpr": 9.0686}, {"key": "5-10M", "n": 53942, "actual_smm": 0.0086945, "pred_smm": 0.0089215, "actual_cpr": 9.9487, "pred_cpr": 10.1958}, {"key": "10-25M", "n": 52979, "actual_smm": 0.0090413, "pred_smm": 0.0091046, "actual_cpr": 10.326, "pred_cpr": 10.3947}, {"key": "25-50M", "n": 15387, "actual_smm": 0.0103334, "pred_smm": 0.0078403, "actual_cpr": 11.7191, "pred_cpr": 9.013}, {"key": "50M+", "n": 2339, "actual_smm": 0.0085507, "pred_smm": 0.0080807, "actual_cpr": 9.7917, "pred_cpr": 9.2773}], "post_lockout_cuts": [{"key": "in-lockout/none", "n": 178473, "actual_smm": 0.0070879, "pred_smm": 0.0067875, "actual_cpr": 8.1816, "pred_cpr": 7.8477}, {"key": "0-6m", "n": 815, "actual_smm": 0.0147239, "pred_smm": 0.0072541, "actual_cpr": 16.3058, "pred_cpr": 8.3659}, {"key": "6-12m", "n": 847, "actual_smm": 0.0035419, "pred_smm": 0.0057489, "actual_cpr": 4.1685, "pred_cpr": 6.6847}, {"key": "12-18m", "n": 898, "actual_smm": 0.0055679, "pred_smm": 0.0058987, "actual_cpr": 6.4807, "pred_cpr": 6.8532}, {"key": "18-24m", "n": 63593, "actual_smm": 0.0105515, "pred_smm": 0.0112503, "actual_cpr": 11.9522, "pred_cpr": 12.6955}], "attribution_loans": [{"label": "232_RP", "archetype_id": "232_RP", "loan_id": "3617X46E8_000000007322294", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer_key": "KEYBANK NATIONAL ASSOCIATION", "logit_z": -2.6148, "pred_smm": 0.0034861, "pred_cpr": 4.104, "actual_prepay": 0, "contributions": [{"feature": "M_age", "multiplier": 0.1038, "log_multiplier": -2.2651, "contribution_logit": -2.2651}, {"feature": "M_rate", "multiplier": 0.8575, "log_multiplier": -0.1537, "contribution_logit": -0.1537}, {"feature": "M_penalty", "multiplier": 0.9542, "log_multiplier": -0.0469, "contribution_logit": -0.0469}, {"feature": "M_size", "multiplier": 1.3478, "log_multiplier": 0.2984, "contribution_logit": 0.2984}, {"feature": "M_program", "multiplier": 0.6392, "log_multiplier": -0.4475, "contribution_logit": -0.4475}, {"feature": "M_purpose", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_lockout", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_maturity", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_burnout", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}]}, {"label": "232_NC", "archetype_id": "232_NC", "loan_id": "3617M15B3_000000011343080", "period": "202602", "fha_category": "232", "loan_purpose": "NC", "issuer_key": "BERKADIA COMMERCIAL MORTGAGE, ", "logit_z": -3.0657, "pred_smm": 0.0022206, "pred_cpr": 2.6324, "actual_prepay": 0, "contributions": [{"feature": "M_age", "multiplier": 0.0651, "log_multiplier": -2.7323, "contribution_logit": -2.7323}, {"feature": "M_rate", "multiplier": 0.8875, "log_multiplier": -0.1193, "contribution_logit": -0.1193}, {"feature": "M_penalty", "multiplier": 0.9542, "log_multiplier": -0.0469, "contribution_logit": -0.0469}, {"feature": "M_size", "multiplier": 1.3236, "log_multiplier": 0.2803, "contribution_logit": 0.2803}, {"feature": "M_program", "multiplier": 0.6392, "log_multiplier": -0.4475, "contribution_logit": -0.4475}, {"feature": "M_purpose", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_lockout", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_maturity", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_burnout", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}]}], "sancap_benchmarks": [{"scenario": "ATM, avg penalty (5pp)", "sancap_cpr": 20, "v7_pred_cpr": 4.66, "divergence_pp": 15.34, "flag": "REVIEW"}, {"scenario": "-50bp, avg penalty", "sancap_cpr": 6, "v7_pred_cpr": 3.97, "divergence_pp": 2.03, "flag": "ok"}, {"scenario": "+50bp, avg penalty", "sancap_cpr": 35, "v7_pred_cpr": 6.43, "divergence_pp": 28.57, "flag": "REVIEW"}, {"scenario": "+100bp, avg penalty", "sancap_cpr": 45, "v7_pred_cpr": 10.45, "divergence_pp": 34.55, "flag": "REVIEW"}, {"scenario": "+100bp, 7% penalty", "sancap_cpr": 30, "v7_pred_cpr": 9.46, "divergence_pp": 20.54, "flag": "REVIEW"}, {"scenario": "+100bp, 9% penalty", "sancap_cpr": 18, "v7_pred_cpr": 8.47, "divergence_pp": 9.53, "flag": "ok"}, {"scenario": "$5M @ +50bp", "sancap_cpr": 20, "v7_pred_cpr": 6.43, "divergence_pp": 13.57, "flag": "REVIEW"}, {"scenario": "$15M @ +50bp", "sancap_cpr": 40, "v7_pred_cpr": 8.88, "divergence_pp": 31.12, "flag": "REVIEW"}, {"scenario": "NC @ +100bp, age 30m", "sancap_cpr": 70, "v7_pred_cpr": 8.13, "divergence_pp": 61.87, "flag": "REVIEW"}, {"scenario": "Rural-538 @ +100bp", "sancap_cpr": 10, "v7_pred_cpr": 6.24, "divergence_pp": 3.76, "flag": "ok"}, {"scenario": "HC-232 @ +100bp", "sancap_cpr": 30, "v7_pred_cpr": 9.01, "divergence_pp": 20.99, "flag": "REVIEW"}, {"scenario": "msle=2 (post-lockout, ATM)", "sancap_cpr": 40, "v7_pred_cpr": 4.66, "divergence_pp": 35.34, "flag": "REVIEW"}], "comparison_to_v6f": {"available": true, "v6f_test_auc": 0.785432, "v7_test_auc": 0.760265620930003, "auc_delta": -0.0252, "v6f_log_loss": 0.0423356, "v7_log_loss": 0.04272469645918585, "log_loss_delta": 0.00039, "v6f_n_features": 24, "yearly_compare": [{"year": 2018, "n": 2764, "actual_cpr": 4.2562, "v6f_pred_cpr": 5.8105, "v7_pred_cpr": 6.2036}, {"year": 2019, "n": 33514, "actual_cpr": 5.2065, "v6f_pred_cpr": 9.5625, "v7_pred_cpr": 10.3441}, {"year": 2020, "n": 34093, "actual_cpr": 18.5506, "v6f_pred_cpr": 18.3447, "v7_pred_cpr": 19.4282}, {"year": 2021, "n": 33154, "actual_cpr": 21.9597, "v6f_pred_cpr": 17.2941, "v7_pred_cpr": 17.1237}, {"year": 2022, "n": 32741, "actual_cpr": 9.5929, "v6f_pred_cpr": 6.8873, "v7_pred_cpr": 5.8625}, {"year": 2023, "n": 33415, "actual_cpr": 3.2892, "v6f_pred_cpr": 3.386, "v7_pred_cpr": 3.4063}, {"year": 2024, "n": 34039, "actual_cpr": 2.3366, "v6f_pred_cpr": 3.5988, "v7_pred_cpr": 3.5923}, {"year": 2025, "n": 34957, "actual_cpr": 3.0128, "v6f_pred_cpr": 3.7817, "v7_pred_cpr": 3.8382}, {"year": 2026, "n": 5949, "actual_cpr": 3.571, "v6f_pred_cpr": 4.9653, "v7_pred_cpr": 4.5932}], "calibration_compare": [{"decile": 0, "v6f_pred_cpr": 0.409, "v6f_actual_cpr": 1.6551, "v7_pred_cpr": 1.4661, "v7_actual_cpr": 2.7605}, {"decile": 1, "v6f_pred_cpr": 1.0925, "v6f_actual_cpr": 1.3649, "v7_pred_cpr": 2.385, "v7_actual_cpr": 2.5691}, {"decile": 2, "v6f_pred_cpr": 2.1088, "v6f_actual_cpr": 2.041, "v7_pred_cpr": 3.0669, "v7_actual_cpr": 3.5229}, {"decile": 3, "v6f_pred_cpr": 3.4288, "v6f_actual_cpr": 3.9963, "v7_pred_cpr": 3.7068, "v7_actual_cpr": 3.0947}, {"decile": 4, "v6f_pred_cpr": 4.9578, "v6f_actual_cpr": 4.091, "v7_pred_cpr": 4.4078, "v7_actual_cpr": 3.7126}, {"decile": 5, "v6f_pred_cpr": 6.811, "v6f_actual_cpr": 5.2644, "v7_pred_cpr": 5.4804, "v7_actual_cpr": 5.3578}, {"decile": 6, "v6f_pred_cpr": 9.1381, "v6f_actual_cpr": 6.7017, "v7_pred_cpr": 7.6852, "v7_actual_cpr": 6.3328}, {"decile": 7, "v6f_pred_cpr": 12.3476, "v6f_actual_cpr": 8.3905, "v7_pred_cpr": 11.9761, "v7_actual_cpr": 8.8872}, {"decile": 8, "v6f_pred_cpr": 17.1008, "v6f_actual_cpr": 17.6634, "v7_pred_cpr": 17.5439, "v7_actual_cpr": 17.8274}, {"decile": 9, "v6f_pred_cpr": 28.7965, "v6f_actual_cpr": 34.9798, "v7_pred_cpr": 29.6227, "v7_actual_cpr": 32.9342}]}};
/* __MODEL_DATA_V6F__ */ const MODEL_DATA_V6F = {"metadata": {"training_pop_n": 982361, "training_events": 7686, "base_smm": 0.007824, "base_cpr": 8.9951, "n_features": 24, "test_auc": 0.785432, "test_log_loss": 0.0423356, "prior_correction": -3.233266, "period_range": ["201812", "202602"], "feature_list": ["gross_refi_incentive_bps", "prepay_penalty_points", "age_0_36", "age_36_120", "age_120plus", "months_to_maturity", "pre_maturity_flag", "months_since_lockout_end", "log_upb", "small_loan", "large_loan", "burn_ratio", "is_post_covid", "is_223a7", "is_538", "is_hc_232", "lp_NC", "iss_capital_funding", "iss_pnc", "iss_wells_fargo", "iss_dwight", "iss_greystone", "iss_lument_combined", "gross_refi__x__prepay_pen"], "feature_groups": {"Rate & Penalty": ["gross_refi_incentive_bps", "prepay_penalty_points"], "Seasoning (piecewise)": ["age_0_36", "age_36_120", "age_120plus"], "Maturity": ["months_to_maturity", "pre_maturity_flag"], "Post-lockout surge": ["months_since_lockout_end"], "Size": ["log_upb", "small_loan", "large_loan"], "Burnout & Regime": ["burn_ratio", "is_post_covid"], "Program & Purpose": ["is_223a7", "is_538", "is_hc_232", "lp_NC"], "Issuer (Servicer)": ["iss_capital_funding", "iss_pnc", "iss_wells_fargo", "iss_dwight", "iss_greystone", "iss_lument_combined"], "Interactions": ["gross_refi__x__prepay_pen"]}, "feature_labels": {"gross_refi_incentive_bps": "Gross refi incentive (bp, penalty-neutral)", "prepay_penalty_points": "Prepay penalty points (continuous 0-10)", "age_0_36": "Age 0-36m (piecewise)", "age_36_120": "Age 36-120m (piecewise)", "age_120plus": "Age 120m+ (piecewise)", "months_to_maturity": "Months to maturity", "pre_maturity_flag": "Within 0-24m of maturity (1/0)", "months_since_lockout_end": "Months since lockout end (cap 24)", "log_upb": "Log UPB", "small_loan": "UPB < $2M (1/0)", "large_loan": "UPB > $50M (1/0)", "burn_ratio": "Burnout ratio (cum_itm / age)", "is_post_covid": "Post-COVID vintage (>=2021)", "is_223a7": "223(a)(7) Streamlined refi", "is_538": "538 USDA Rural", "is_hc_232": "232 Healthcare flag", "lp_NC": "Loan purpose: New Construction", "iss_capital_funding": "Issuer: Capital Funding", "iss_pnc": "Issuer: PNC Bank", "iss_wells_fargo": "Issuer: Wells Fargo", "iss_dwight": "Issuer: Dwight Capital", "iss_greystone": "Issuer: Greystone", "iss_lument_combined": "Issuer: Lument (incl. Red Mortgage + Hunt)", "gross_refi__x__prepay_pen": "Interaction: gross_refi_incentive_bps x prepay_penalty_points"}, "intercept_scaled": -5.525031, "intercept_native": null, "last_period": "202603", "top_issuers": ["LUMENT REAL ESTATE CAPITAL,LLC", "BERKADIA COMMERCIAL MORTGAGE, LLC", "WALKER & DUNLOP, LLC", "MERCHANTS CAPITAL CORP.", "GREYSTONE FUNDING COMPANY LLC", "PNC BANK, NA", "WELLS FARGO MULTIFAMILY CAPITAL", "CAPITAL FUNDING,LLC.", "DWIGHT CAPITAL LLC", "KEYBANK NATIONAL ASSOCIATION", "BELLWETHER ENTERPRISE REAL ESTATE CAPITA", "GERSHMAN INVESTMENT CORP.", "MIDLAND STATES BANK", "PGIM REAL ESTATE AGENCY FINANCING, LLC.", "GRANDBRIDGE REAL ESTATE CAPITAL, LLC"], "issuer_name_map": {"LUMENT REAL ESTATE CAPITAL,LLC": "LUMENT REAL ESTATE CAPITAL,LLC", "BERKADIA COMMERCIAL MORTGAGE, LLC": "BERKADIA COMMERCIAL MORTGAGE, LLC", "WALKER & DUNLOP, LLC": "WALKER & DUNLOP, LLC", "MERCHANTS CAPITAL CORP.": "MERCHANTS CAPITAL CORP.", "GREYSTONE FUNDING COMPANY LLC": "GREYSTONE FUNDING COMPANY LLC", "PNC BANK, NA": "PNC BANK, NA", "WELLS FARGO MULTIFAMILY CAPITAL": "WELLS FARGO MULTIFAMILY CAPITAL", "CAPITAL FUNDING,LLC.": "CAPITAL FUNDING,LLC.", "DWIGHT CAPITAL LLC": "DWIGHT CAPITAL LLC", "KEYBANK NATIONAL ASSOCIATION": "KEYBANK NATIONAL ASSOCIATION", "BELLWETHER ENTERPRISE REAL ESTATE CAPITA": "BELLWETHER ENTERPRISE REAL ESTATE CAPITA", "GERSHMAN INVESTMENT CORP.": "GERSHMAN INVESTMENT CORP.", "MIDLAND STATES BANK": "MIDLAND STATES BANK", "PGIM REAL ESTATE AGENCY FINANCING, LLC.": "PGIM REAL ESTATE AGENCY FINANCING, LLC.", "GRANDBRIDGE REAL ESTATE CAPITAL, LLC": "GRANDBRIDGE REAL ESTATE CAPITAL, LLC"}, "model_version": "v6f", "description": "V6F voluntary prepayment model (logistic, base + selective interactions)"}, "coefficients": [{"feature": "gross_refi_incentive_bps", "label": "Gross refi incentive (bp, penalty-neutral)", "group": "Rate & Penalty", "beta_scaled": 0.570192, "beta_native": 0.00310379, "mean": 2.265188, "std": 183.708317, "importance": 0.570192}, {"feature": "prepay_penalty_points", "label": "Prepay penalty points (continuous 0-10)", "group": "Rate & Penalty", "beta_scaled": -0.363185, "beta_native": -0.10008426, "mean": 5.076951, "std": 3.628791, "importance": 0.363185}, {"feature": "age_0_36", "label": "Age 0-36m (piecewise)", "group": "Seasoning (piecewise)", "beta_scaled": 0.271688, "beta_native": 0.0319566, "mean": 32.292252, "std": 8.501787, "importance": 0.271688}, {"feature": "age_36_120", "label": "Age 36-120m (piecewise)", "group": "Seasoning (piecewise)", "beta_scaled": 0.193293, "beta_native": 0.00577619, "mean": 40.759952, "std": 33.463732, "importance": 0.193293}, {"feature": "age_120plus", "label": "Age 120m+ (piecewise)", "group": "Seasoning (piecewise)", "beta_scaled": -0.098758, "beta_native": -0.00340313, "mean": 11.313631, "std": 29.01982, "importance": 0.098758}, {"feature": "months_to_maturity", "label": "Months to maturity", "group": "Maturity", "beta_scaled": -0.032003, "beta_native": -0.00036144, "mean": 328.587083, "std": 88.544231, "importance": 0.032003}, {"feature": "pre_maturity_flag", "label": "Within 0-24m of maturity (1/0)", "group": "Maturity", "beta_scaled": 0.11705, "beta_native": 2.78846819, "mean": 0.001765, "std": 0.041976, "importance": 0.11705}, {"feature": "months_since_lockout_end", "label": "Months since lockout end (cap 24)", "group": "Post-lockout surge", "beta_scaled": -0.012941, "beta_native": -0.0012261, "mean": 6.432159, "std": 10.554518, "importance": 0.012941}, {"feature": "log_upb", "label": "Log UPB", "group": "Size", "beta_scaled": 0.41296, "beta_native": 0.33366269, "mean": 15.369157, "std": 1.237657, "importance": 0.41296}, {"feature": "small_loan", "label": "UPB < $2M (1/0)", "group": "Size", "beta_scaled": -0.101312, "beta_native": -0.23837744, "mean": 0.236621, "std": 0.425007, "importance": 0.101312}, {"feature": "large_loan", "label": "UPB > $50M (1/0)", "group": "Size", "beta_scaled": -0.04312, "beta_native": -0.38151918, "mean": 0.012941, "std": 0.113021, "importance": 0.04312}, {"feature": "burn_ratio", "label": "Burnout ratio (cum_itm / age)", "group": "Burnout & Regime", "beta_scaled": 0.178127, "beta_native": 0.72898702, "mean": 0.195122, "std": 0.244349, "importance": 0.178127}, {"feature": "is_post_covid", "label": "Post-COVID vintage (>=2021)", "group": "Burnout & Regime", "beta_scaled": -0.100645, "beta_native": -0.28383942, "mean": 0.147481, "std": 0.354585, "importance": 0.100645}, {"feature": "is_223a7", "label": "223(a)(7) Streamlined refi", "group": "Program & Purpose", "beta_scaled": 0.025813, "beta_native": 0.06000057, "mean": 0.24521, "std": 0.430212, "importance": 0.025813}, {"feature": "is_538", "label": "538 USDA Rural", "group": "Program & Purpose", "beta_scaled": -0.19302, "beta_native": -0.77022495, "mean": 0.067336, "std": 0.250603, "importance": 0.19302}, {"feature": "is_hc_232", "label": "232 Healthcare flag", "group": "Program & Purpose", "beta_scaled": -0.031843, "beta_native": -0.07295154, "mean": 0.256124, "std": 0.436491, "importance": 0.031843}, {"feature": "lp_NC", "label": "Loan purpose: New Construction", "group": "Program & Purpose", "beta_scaled": -0.041684, "beta_native": -0.1277122, "mean": 0.121227, "std": 0.326391, "importance": 0.041684}, {"feature": "iss_capital_funding", "label": "Issuer: Capital Funding", "group": "Issuer (Servicer)", "beta_scaled": -0.083746, "beta_native": -0.45965248, "mean": 0.034376, "std": 0.182194, "importance": 0.083746}, {"feature": "iss_pnc", "label": "Issuer: PNC Bank", "group": "Issuer (Servicer)", "beta_scaled": -0.062494, "beta_native": -0.33626121, "mean": 0.035824, "std": 0.185851, "importance": 0.062494}, {"feature": "iss_wells_fargo", "label": "Issuer: Wells Fargo", "group": "Issuer (Servicer)", "beta_scaled": -0.040287, "beta_native": -0.19753202, "mean": 0.043487, "std": 0.203951, "importance": 0.040287}, {"feature": "iss_dwight", "label": "Issuer: Dwight Capital", "group": "Issuer (Servicer)", "beta_scaled": 0.044013, "beta_native": 0.25323781, "mean": 0.031179, "std": 0.173801, "importance": 0.044013}, {"feature": "iss_greystone", "label": "Issuer: Greystone", "group": "Issuer (Servicer)", "beta_scaled": 0.049625, "beta_native": 0.20682827, "mean": 0.06133, "std": 0.239934, "importance": 0.049625}, {"feature": "iss_lument_combined", "label": "Issuer: Lument (incl. Red Mortgage + Hunt)", "group": "Issuer (Servicer)", "beta_scaled": -0.003365, "beta_native": -0.00897778, "mean": 0.169072, "std": 0.374816, "importance": 0.003365}, {"feature": "gross_refi__x__prepay_pen", "label": "Interaction: gross_refi_incentive_bps x prepay_penalty_points", "group": "Interactions", "beta_scaled": 0.637551, "beta_native": 0.00059719, "mean": -65.148699, "std": 1067.575916, "importance": 0.637551}], "feature_stats": {"gross_refi_incentive_bps": {"min": -422.0, "p5": -261.5, "p25": -158.0, "mean": 2.80468, "p75": 146.0, "p95": 286.0, "max": 802.0}, "prepay_penalty_points": {"min": 0.0, "p5": 0.0, "p25": 1.0, "mean": 5.068574, "p75": 8.0, "p95": 10.0, "max": 10.0}, "age_0_36": {"min": 0.0, "p5": 9.0, "p25": 36.0, "mean": 32.292074, "p75": 36.0, "p95": 36.0, "max": 36.0}, "age_36_120": {"min": 0.0, "p5": 0.0, "p25": 4.0, "mean": 40.880424, "p75": 81.0, "p95": 84.0, "max": 84.0}, "age_120plus": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 11.482542, "p75": 0.0, "p95": 80.0, "max": 463.0}, "months_to_maturity": {"min": 0.0, "p5": 149.0, "p25": 280.0, "mean": 328.554921, "p75": 394.0, "p95": 446.0, "max": 480.0}, "pre_maturity_flag": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.001698, "p75": 0.0, "p95": 0.0, "max": 1.0}, "months_since_lockout_end": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 6.411979, "p75": 24.0, "p95": 24.0, "max": 24.0}, "log_upb": {"min": 0.470004, "p5": 13.189947, "p25": 14.570834, "mean": 15.367128, "p75": 16.242029, "p95": 17.252028, "max": 20.247646}, "small_loan": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.236998, "p75": 0.0, "p95": 1.0, "max": 1.0}, "large_loan": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.012267, "p75": 0.0, "p95": 0.0, "max": 1.0}, "burn_ratio": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.194885, "p75": 0.286885, "p95": 0.59375, "max": 5.0}, "is_post_covid": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.146165, "p75": 0.0, "p95": 1.0, "max": 1.0}, "is_223a7": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.244588, "p75": 0.0, "p95": 1.0, "max": 1.0}, "is_538": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.066641, "p75": 0.0, "p95": 1.0, "max": 1.0}, "is_hc_232": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.253576, "p75": 1.0, "p95": 1.0, "max": 1.0}, "lp_NC": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.120525, "p75": 0.0, "p95": 1.0, "max": 1.0}, "iss_capital_funding": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.034156, "p75": 0.0, "p95": 0.0, "max": 1.0}, "iss_pnc": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.036657, "p75": 0.0, "p95": 0.0, "max": 1.0}, "iss_wells_fargo": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.043754, "p75": 0.0, "p95": 0.0, "max": 1.0}, "iss_dwight": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.031614, "p75": 0.0, "p95": 0.0, "max": 1.0}, "iss_greystone": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.060711, "p75": 0.0, "p95": 1.0, "max": 1.0}, "iss_lument_combined": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.169023, "p75": 0.0, "p95": 1.0, "max": 1.0}, "gross_refi__x__prepay_pen": {"min": -4160.0, "p5": -2016.0, "p25": -568.0, "mean": -62.230589, "p75": 549.0, "p95": 1620.0, "max": 6448.0}}, "monthly": [{"period": "201812", "n": 2764, "actual_smm": 0.0036179, "pred_smm": 0.004976, "actual_cpr": 4.2562, "pred_cpr": 5.8105}, {"period": "201901", "n": 2760, "actual_smm": 0.0028986, "pred_smm": 0.0050894, "actual_cpr": 3.4233, "pred_cpr": 5.9391}, {"period": "201902", "n": 2767, "actual_smm": 0.0046982, "pred_smm": 0.005047, "actual_cpr": 5.4944, "pred_cpr": 5.8911}, {"period": "201903", "n": 2765, "actual_smm": 0.00217, "pred_smm": 0.0059429, "actual_cpr": 2.5731, "pred_cpr": 6.9029}, {"period": "201904", "n": 2780, "actual_smm": 0.0035971, "pred_smm": 0.0063724, "actual_cpr": 4.2322, "pred_cpr": 7.3845}, {"period": "201905", "n": 2785, "actual_smm": 0.0035907, "pred_smm": 0.0081507, "actual_cpr": 4.2247, "pred_cpr": 9.3541}, {"period": "201906", "n": 2792, "actual_smm": 0.0050143, "pred_smm": 0.0083925, "actual_cpr": 5.854, "pred_cpr": 9.6189}, {"period": "201907", "n": 2794, "actual_smm": 0.0042949, "pred_smm": 0.0091831, "actual_cpr": 5.0339, "pred_cpr": 10.4798}, {"period": "201908", "n": 2797, "actual_smm": 0.0039328, "pred_smm": 0.0115085, "actual_cpr": 4.6186, "pred_cpr": 12.9687}, {"period": "201909", "n": 2805, "actual_smm": 0.0046346, "pred_smm": 0.0105981, "actual_cpr": 5.4219, "pred_cpr": 12.002}, {"period": "201910", "n": 2817, "actual_smm": 0.0049698, "pred_smm": 0.0108772, "actual_cpr": 5.8034, "pred_cpr": 12.2994}, {"period": "201911", "n": 2821, "actual_smm": 0.0049628, "pred_smm": 0.0097603, "actual_cpr": 5.7954, "pred_cpr": 11.1036}, {"period": "201912", "n": 2831, "actual_smm": 0.0084776, "pred_smm": 0.0090066, "actual_cpr": 9.7119, "pred_cpr": 10.2883}, {"period": "202001", "n": 2823, "actual_smm": 0.0063762, "pred_smm": 0.0117955, "actual_cpr": 7.3887, "pred_cpr": 13.2714}, {"period": "202002", "n": 2824, "actual_smm": 0.0141643, "pred_smm": 0.0136374, "actual_cpr": 15.7336, "pred_cpr": 15.1916}, {"period": "202003", "n": 2812, "actual_smm": 0.0092461, "pred_smm": 0.0139336, "actual_cpr": 10.5481, "pred_cpr": 15.4967}, {"period": "202004", "n": 2822, "actual_smm": 0.0106308, "pred_smm": 0.0156384, "actual_cpr": 12.0368, "pred_cpr": 17.2332}, {"period": "202005", "n": 2845, "actual_smm": 0.0115993, "pred_smm": 0.0163568, "actual_cpr": 13.0646, "pred_cpr": 17.9552}, {"period": "202006", "n": 2864, "actual_smm": 0.0181564, "pred_smm": 0.0169208, "actual_cpr": 19.7384, "pred_cpr": 18.518}, {"period": "202007", "n": 2864, "actual_smm": 0.0181564, "pred_smm": 0.0193161, "actual_cpr": 19.7384, "pred_cpr": 20.8687}, {"period": "202008", "n": 2864, "actual_smm": 0.0160615, "pred_smm": 0.019962, "actual_cpr": 17.6591, "pred_cpr": 21.4918}, {"period": "202009", "n": 2865, "actual_smm": 0.0184991, "pred_smm": 0.0200516, "actual_cpr": 20.074, "pred_cpr": 21.5778}, {"period": "202010", "n": 2857, "actual_smm": 0.0248512, "pred_smm": 0.0171421, "actual_cpr": 26.0649, "pred_cpr": 18.7378}, {"period": "202011", "n": 2834, "actual_smm": 0.0271701, "pred_smm": 0.0178049, "actual_cpr": 28.1473, "pred_cpr": 19.3929}, {"period": "202012", "n": 2819, "actual_smm": 0.0283789, "pred_smm": 0.0182534, "actual_cpr": 29.2114, "pred_cpr": 19.8336}, {"period": "202101", "n": 2809, "actual_smm": 0.0238519, "pred_smm": 0.0174847, "actual_cpr": 25.1506, "pred_cpr": 19.077}, {"period": "202102", "n": 2795, "actual_smm": 0.0239714, "pred_smm": 0.0154687, "actual_cpr": 25.2604, "pred_cpr": 17.0619}, {"period": "202103", "n": 2787, "actual_smm": 0.0208109, "pred_smm": 0.0135294, "actual_cpr": 22.304, "pred_cpr": 15.08}, {"period": "202104", "n": 2779, "actual_smm": 0.0241094, "pred_smm": 0.0142599, "actual_cpr": 25.3871, "pred_cpr": 15.8316}, {"period": "202105", "n": 2774, "actual_smm": 0.019106, "pred_smm": 0.0154483, "actual_cpr": 20.665, "pred_cpr": 17.0412}, {"period": "202106", "n": 2763, "actual_smm": 0.0213536, "pred_smm": 0.016519, "actual_cpr": 22.8191, "pred_cpr": 18.1174}, {"period": "202107", "n": 2744, "actual_smm": 0.0127551, "pred_smm": 0.0177446, "actual_cpr": 14.2767, "pred_cpr": 19.3335}, {"period": "202108", "n": 2742, "actual_smm": 0.0149526, "pred_smm": 0.0167299, "actual_cpr": 16.5386, "pred_cpr": 18.3278}, {"period": "202109", "n": 2744, "actual_smm": 0.0204082, "pred_smm": 0.0159342, "actual_cpr": 21.9196, "pred_cpr": 17.5312}, {"period": "202110", "n": 2739, "actual_smm": 0.0200803, "pred_smm": 0.0155045, "actual_cpr": 21.6055, "pred_cpr": 17.098}, {"period": "202111", "n": 2740, "actual_smm": 0.0175182, "pred_smm": 0.0152602, "actual_cpr": 19.1102, "pred_cpr": 16.8509}, {"period": "202112", "n": 2738, "actual_smm": 0.0262966, "pred_smm": 0.0145095, "actual_cpr": 27.3693, "pred_cpr": 16.087}, {"period": "202201", "n": 2700, "actual_smm": 0.0111111, "pred_smm": 0.0126436, "actual_cpr": 12.548, "pred_cpr": 14.1604}, {"period": "202202", "n": 2717, "actual_smm": 0.0161943, "pred_smm": 0.0109642, "actual_cpr": 17.7924, "pred_cpr": 12.3919}, {"period": "202203", "n": 2710, "actual_smm": 0.0099631, "pred_smm": 0.0083071, "actual_cpr": 11.3219, "pred_cpr": 9.5254}, {"period": "202204", "n": 2718, "actual_smm": 0.0099338, "pred_smm": 0.0059061, "actual_cpr": 11.2903, "pred_cpr": 6.8616}, {"period": "202205", "n": 2732, "actual_smm": 0.0120791, "pred_smm": 0.005852, "actual_cpr": 13.5696, "pred_cpr": 6.8007}, {"period": "202206", "n": 2732, "actual_smm": 0.0087848, "pred_smm": 0.0050249, "actual_cpr": 10.047, "pred_cpr": 5.866}, {"period": "202207", "n": 2735, "actual_smm": 0.0040219, "pred_smm": 0.0057851, "actual_cpr": 4.721, "pred_cpr": 6.7255}, {"period": "202208", "n": 2739, "actual_smm": 0.007667, "pred_smm": 0.0044748, "actual_cpr": 8.8222, "pred_cpr": 5.2396}, {"period": "202209", "n": 2731, "actual_smm": 0.0080557, "pred_smm": 0.0032207, "actual_cpr": 9.2498, "pred_cpr": 3.7971}, {"period": "202210", "n": 2727, "actual_smm": 0.0044004, "pred_smm": 0.0026502, "actual_cpr": 5.1546, "pred_cpr": 3.1343}, {"period": "202211", "n": 2747, "actual_smm": 0.0036403, "pred_smm": 0.0033353, "actual_cpr": 4.282, "pred_cpr": 3.9297}, {"period": "202212", "n": 2753, "actual_smm": 0.0047221, "pred_smm": 0.0031421, "actual_cpr": 5.5217, "pred_cpr": 3.706}, {"period": "202301", "n": 2754, "actual_smm": 0.0036311, "pred_smm": 0.0037687, "actual_cpr": 4.2713, "pred_cpr": 4.4299}, {"period": "202302", "n": 2756, "actual_smm": 0.0010885, "pred_smm": 0.0033712, "actual_cpr": 1.2984, "pred_cpr": 3.9713}, {"period": "202303", "n": 2771, "actual_smm": 0.0043306, "pred_smm": 0.0034107, "actual_cpr": 5.0747, "pred_cpr": 4.0169}, {"period": "202304", "n": 2773, "actual_smm": 0.0007212, "pred_smm": 0.0032829, "actual_cpr": 0.8621, "pred_cpr": 3.8691}, {"period": "202305", "n": 2780, "actual_smm": 0.0028777, "pred_smm": 0.0029532, "actual_cpr": 3.3991, "pred_cpr": 3.4868}, {"period": "202306", "n": 2785, "actual_smm": 0.0043088, "pred_smm": 0.0028901, "actual_cpr": 5.0498, "pred_cpr": 3.4135}, {"period": "202307", "n": 2782, "actual_smm": 0.0025162, "pred_smm": 0.0027465, "actual_cpr": 2.978, "pred_cpr": 3.2465}, {"period": "202308", "n": 2788, "actual_smm": 0.0025108, "pred_smm": 0.0026034, "actual_cpr": 2.9717, "pred_cpr": 3.0797}, {"period": "202309", "n": 2796, "actual_smm": 0.0032189, "pred_smm": 0.0021263, "actual_cpr": 3.795, "pred_cpr": 2.522}, {"period": "202310", "n": 2808, "actual_smm": 0.0024929, "pred_smm": 0.0017704, "actual_cpr": 2.9508, "pred_cpr": 2.1039}, {"period": "202311", "n": 2812, "actual_smm": 0.0042674, "pred_smm": 0.0024006, "actual_cpr": 5.0024, "pred_cpr": 2.843}, {"period": "202312", "n": 2810, "actual_smm": 0.0014235, "pred_smm": 0.003107, "actual_cpr": 1.6949, "pred_cpr": 3.6654}, {"period": "202401", "n": 2811, "actual_smm": 0.0007115, "pred_smm": 0.0031194, "actual_cpr": 0.8505, "pred_cpr": 3.6797}, {"period": "202402", "n": 2815, "actual_smm": 0.0010657, "pred_smm": 0.0028984, "actual_cpr": 1.2714, "pred_cpr": 3.4232}, {"period": "202403", "n": 2822, "actual_smm": 0.0021262, "pred_smm": 0.00296, "actual_cpr": 2.5218, "pred_cpr": 3.4948}, {"period": "202404", "n": 2824, "actual_smm": 0.0017705, "pred_smm": 0.0024271, "actual_cpr": 2.1041, "pred_cpr": 2.8739}, {"period": "202405", "n": 2824, "actual_smm": 0.0021246, "pred_smm": 0.002678, "actual_cpr": 2.52, "pred_cpr": 3.1667}, {"period": "202406", "n": 2832, "actual_smm": 0.0014124, "pred_smm": 0.0028292, "actual_cpr": 1.6818, "pred_cpr": 3.3428}, {"period": "202407", "n": 2838, "actual_smm": 0.0031712, "pred_smm": 0.003264, "actual_cpr": 3.7398, "pred_cpr": 3.8472}, {"period": "202408", "n": 2840, "actual_smm": 0.0021127, "pred_smm": 0.003431, "actual_cpr": 2.506, "pred_cpr": 4.0404}, {"period": "202409", "n": 2851, "actual_smm": 0.0024553, "pred_smm": 0.0037611, "actual_cpr": 2.9069, "pred_cpr": 4.4211}, {"period": "202410", "n": 2856, "actual_smm": 0.0017507, "pred_smm": 0.0030449, "actual_cpr": 2.0807, "pred_cpr": 3.5934}, {"period": "202411", "n": 2860, "actual_smm": 0.0020979, "pred_smm": 0.0033113, "actual_cpr": 2.4886, "pred_cpr": 3.9019}, {"period": "202412", "n": 2866, "actual_smm": 0.0027913, "pred_smm": 0.0028616, "actual_cpr": 3.2987, "pred_cpr": 3.3803}, {"period": "202501", "n": 2872, "actual_smm": 0.0020891, "pred_smm": 0.0028721, "actual_cpr": 2.4784, "pred_cpr": 3.3926}, {"period": "202502", "n": 2873, "actual_smm": 0.0020884, "pred_smm": 0.0032225, "actual_cpr": 2.4775, "pred_cpr": 3.7992}, {"period": "202503", "n": 2883, "actual_smm": 0.002428, "pred_smm": 0.0031518, "actual_cpr": 2.875, "pred_cpr": 3.7173}, {"period": "202504", "n": 2895, "actual_smm": 0.0027634, "pred_smm": 0.0029909, "actual_cpr": 3.2661, "pred_cpr": 3.5307}, {"period": "202505", "n": 2896, "actual_smm": 0.0027624, "pred_smm": 0.0027417, "actual_cpr": 3.265, "pred_cpr": 3.2409}, {"period": "202506", "n": 2904, "actual_smm": 0.0013774, "pred_smm": 0.003013, "actual_cpr": 1.6404, "pred_cpr": 3.5563}, {"period": "202507", "n": 2920, "actual_smm": 0.0034247, "pred_smm": 0.0029016, "actual_cpr": 4.0331, "pred_cpr": 3.4269}, {"period": "202508", "n": 2922, "actual_smm": 0.0027379, "pred_smm": 0.0031674, "actual_cpr": 3.2364, "pred_cpr": 3.7354}, {"period": "202509", "n": 2935, "actual_smm": 0.0013629, "pred_smm": 0.0033959, "actual_cpr": 1.6232, "pred_cpr": 3.9998}, {"period": "202510", "n": 2943, "actual_smm": 0.0037377, "pred_smm": 0.0035449, "actual_cpr": 4.3942, "pred_cpr": 4.1719}, {"period": "202511", "n": 2950, "actual_smm": 0.0010169, "pred_smm": 0.0037448, "actual_cpr": 1.2135, "pred_cpr": 4.4023}, {"period": "202512", "n": 2964, "actual_smm": 0.0047233, "pred_smm": 0.0037131, "actual_cpr": 5.5231, "pred_cpr": 4.3659}, {"period": "202601", "n": 2974, "actual_smm": 0.0020175, "pred_smm": 0.0040312, "actual_cpr": 2.3943, "pred_cpr": 4.7316}, {"period": "202602", "n": 2975, "actual_smm": 0.0040336, "pred_smm": 0.0044389, "actual_cpr": 4.7344, "pred_cpr": 5.1985}], "yearly": [{"year": 2018, "n": 2764, "actual_smm": 0.0036179, "pred_smm": 0.004976, "actual_cpr": 4.2562, "pred_cpr": 5.8105}, {"year": 2019, "n": 33514, "actual_smm": 0.0044459, "pred_smm": 0.0083409, "actual_cpr": 5.2065, "pred_cpr": 9.5625}, {"year": 2020, "n": 34093, "actual_smm": 0.0169536, "pred_smm": 0.0167469, "actual_cpr": 18.5506, "pred_cpr": 18.3447}, {"year": 2021, "n": 33154, "actual_smm": 0.02045, "pred_smm": 0.0156987, "actual_cpr": 21.9597, "pred_cpr": 17.2941}, {"year": 2022, "n": 32741, "actual_smm": 0.0083687, "pred_smm": 0.005929, "actual_cpr": 9.5929, "pred_cpr": 6.8873}, {"year": 2023, "n": 33415, "actual_smm": 0.0027832, "pred_smm": 0.0028664, "actual_cpr": 3.2892, "pred_cpr": 3.386}, {"year": 2024, "n": 34039, "actual_smm": 0.0019683, "pred_smm": 0.0030497, "actual_cpr": 2.3366, "pred_cpr": 3.5988}, {"year": 2025, "n": 34957, "actual_smm": 0.002546, "pred_smm": 0.0032074, "actual_cpr": 3.0128, "pred_cpr": 3.7817}, {"year": 2026, "n": 5949, "actual_smm": 0.0030257, "pred_smm": 0.004235, "actual_cpr": 3.571, "pred_cpr": 4.9653}], "scurve": [{"ri_bucket": 0, "n": 3308, "ri_mid": -327.32, "actual_smm": 0.0006046, "pred_smm": 0.0009508, "actual_cpr": 0.7231, "pred_cpr": 1.135}, {"ri_bucket": 1, "n": 35878, "ri_mid": -240.58, "actual_smm": 0.0016723, "pred_smm": 0.0016973, "actual_cpr": 1.9884, "pred_cpr": 2.0178}, {"ri_bucket": 2, "n": 48464, "ri_mid": -150.84, "actual_smm": 0.0030125, "pred_smm": 0.0032053, "actual_cpr": 3.5558, "pred_cpr": 3.7793}, {"ri_bucket": 3, "n": 17770, "ri_mid": -75.86, "actual_smm": 0.004108, "pred_smm": 0.0039608, "actual_cpr": 4.8198, "pred_cpr": 4.6508}, {"ri_bucket": 4, "n": 14322, "ri_mid": -25.0, "actual_smm": 0.0045385, "pred_smm": 0.0042424, "actual_cpr": 5.3123, "pred_cpr": 4.9738}, {"ri_bucket": 5, "n": 16257, "ri_mid": 27.05, "actual_smm": 0.0047364, "pred_smm": 0.0052348, "actual_cpr": 5.538, "pred_cpr": 6.104}, {"ri_bucket": 6, "n": 22744, "ri_mid": 76.3, "actual_smm": 0.0046606, "pred_smm": 0.0070524, "actual_cpr": 5.4515, "pred_cpr": 8.1422}, {"ri_bucket": 7, "n": 26097, "ri_mid": 125.84, "actual_smm": 0.00866, "pred_smm": 0.0102502, "actual_cpr": 9.911, "pred_cpr": 11.6299}, {"ri_bucket": 8, "n": 24544, "ri_mid": 174.8, "actual_smm": 0.0178455, "pred_smm": 0.014837, "actual_cpr": 19.4329, "pred_cpr": 16.421}, {"ri_bucket": 9, "n": 24451, "ri_mid": 238.42, "actual_smm": 0.0246207, "pred_smm": 0.0199763, "actual_cpr": 25.8549, "pred_cpr": 21.5055}, {"ri_bucket": 10, "n": 9306, "ri_mid": 379.57, "actual_smm": 0.0155813, "pred_smm": 0.0175624, "actual_cpr": 17.1757, "pred_cpr": 19.1537}, {"ri_bucket": 11, "n": 1485, "ri_mid": 562.35, "actual_smm": 0.0107744, "pred_smm": 0.0243664, "actual_cpr": 12.19, "pred_cpr": 25.6226}], "calibration": [{"decile": 0, "n": 24463, "pred_smm": 0.0003415, "actual_smm": 0.0013899, "pred_cpr": 0.409, "actual_cpr": 1.6551}, {"decile": 1, "n": 24463, "pred_smm": 0.000915, "actual_smm": 0.0011446, "pred_cpr": 1.0925, "actual_cpr": 1.3649}, {"decile": 2, "n": 24462, "pred_smm": 0.0017745, "actual_smm": 0.0017169, "pred_cpr": 2.1088, "actual_cpr": 2.041}, {"decile": 3, "n": 24463, "pred_smm": 0.0029033, "actual_smm": 0.0033929, "pred_cpr": 3.4288, "actual_cpr": 3.9963}, {"decile": 4, "n": 24462, "pred_smm": 0.0042285, "actual_smm": 0.0034748, "pred_cpr": 4.9578, "actual_cpr": 4.091}, {"decile": 5, "n": 24463, "pred_smm": 0.0058612, "actual_smm": 0.0044966, "pred_cpr": 6.811, "actual_cpr": 5.2644}, {"decile": 6, "n": 24462, "pred_smm": 0.0079539, "actual_smm": 0.005764, "pred_cpr": 9.1381, "actual_cpr": 6.7017}, {"decile": 7, "n": 24463, "pred_smm": 0.0109225, "actual_smm": 0.0072763, "pred_cpr": 12.3476, "actual_cpr": 8.3905}, {"decile": 8, "n": 24462, "pred_smm": 0.0155072, "actual_smm": 0.0160657, "pred_cpr": 17.1008, "actual_cpr": 17.6634}, {"decile": 9, "n": 24463, "pred_smm": 0.0279055, "actual_smm": 0.0352369, "pred_cpr": 28.7965, "actual_cpr": 34.9798}], "fha_cuts": [{"key": "220", "n": 461, "actual_smm": 0.0086768, "pred_smm": 0.0137058, "actual_cpr": 9.9294, "pred_cpr": 15.2621}, {"key": "221d4", "n": 41688, "actual_smm": 0.0095951, "pred_smm": 0.0086753, "actual_cpr": 10.9255, "pred_cpr": 9.9277}, {"key": "223a7", "n": 26866, "actual_smm": 0.0082632, "pred_smm": 0.0086447, "actual_cpr": 9.4774, "pred_cpr": 9.8944}, {"key": "223f", "n": 95548, "actual_smm": 0.0074727, "pred_smm": 0.0074395, "actual_cpr": 8.6077, "pred_cpr": 8.571}, {"key": "232", "n": 59528, "actual_smm": 0.0081642, "pred_smm": 0.0079326, "actual_cpr": 9.3689, "pred_cpr": 9.1146}, {"key": "241", "n": 1885, "actual_smm": 0.0111406, "pred_smm": 0.0108519, "actual_cpr": 12.5792, "pred_cpr": 12.2725}, {"key": "538", "n": 15620, "actual_smm": 0.0050576, "pred_smm": 0.0043701, "actual_cpr": 5.9031, "pred_cpr": 5.1198}, {"key": "OTHER", "n": 3030, "actual_smm": 0.009901, "pred_smm": 0.0144432, "actual_cpr": 11.2551, "pred_cpr": 16.0192}], "lp_cuts": [{"key": "538", "n": 15620, "actual_smm": 0.0050576, "pred_smm": 0.0043701, "actual_cpr": 5.9031, "pred_cpr": 5.1198}, {"key": "NC", "n": 28794, "actual_smm": 0.0105578, "pred_smm": 0.0091419, "actual_cpr": 11.9589, "pred_cpr": 10.4351}, {"key": "OTHER", "n": 3030, "actual_smm": 0.009901, "pred_smm": 0.0144432, "actual_cpr": 11.2551, "pred_cpr": 16.0192}, {"key": "RP", "n": 197182, "actual_smm": 0.0078253, "pred_smm": 0.0078125, "actual_cpr": 8.9965, "pred_cpr": 8.9825}], "vintage_cuts": [{"key": "1989.0", "n": 35, "actual_smm": 0.0285714, "pred_smm": 0.005044, "actual_cpr": 29.3796, "pred_cpr": 5.8876}, {"key": "1994.0", "n": 28, "actual_smm": 0.0357143, "pred_smm": 0.0042806, "actual_cpr": 35.3648, "pred_cpr": 5.0175}, {"key": "1995.0", "n": 149, "actual_smm": 0.0067114, "pred_smm": 0.0069354, "actual_cpr": 7.763, "pred_cpr": 8.0123}, {"key": "1996.0", "n": 46, "actual_smm": 0.0434783, "pred_smm": 0.0115714, "actual_cpr": 41.3405, "pred_cpr": 13.0351}, {"key": "1998.0", "n": 301, "actual_smm": 0.013289, "pred_smm": 0.0088974, "actual_cpr": 14.8314, "pred_cpr": 10.1696}, {"key": "1999.0", "n": 174, "actual_smm": 0.0172414, "pred_smm": 0.03519, "actual_cpr": 18.8362, "pred_cpr": 34.9419}, {"key": "2000.0", "n": 389, "actual_smm": 0.0025707, "pred_smm": 0.0221204, "actual_cpr": 3.0416, "pred_cpr": 23.5417}, {"key": "2001.0", "n": 703, "actual_smm": 0.0099573, "pred_smm": 0.0100176, "actual_cpr": 11.3157, "pred_cpr": 11.3804}, {"key": "2002.0", "n": 1398, "actual_smm": 0.0114449, "pred_smm": 0.0101643, "actual_cpr": 12.9015, "pred_cpr": 11.5379}, {"key": "2003.0", "n": 4664, "actual_smm": 0.0055746, "pred_smm": 0.007628, "actual_cpr": 6.4882, "pred_cpr": 8.7792}, {"key": "2004.0", "n": 2592, "actual_smm": 0.0131173, "pred_smm": 0.0110707, "actual_cpr": 14.6533, "pred_cpr": 12.505}, {"key": "2005.0", "n": 3204, "actual_smm": 0.0087391, "pred_smm": 0.0105023, "actual_cpr": 9.9972, "pred_cpr": 11.8997}, {"key": "2006.0", "n": 5838, "actual_smm": 0.0054813, "pred_smm": 0.011263, "actual_cpr": 6.3829, "pred_cpr": 12.709}, {"key": "2007.0", "n": 4470, "actual_smm": 0.0085011, "pred_smm": 0.009703, "actual_cpr": 9.7376, "pred_cpr": 11.0419}, {"key": "2008.0", "n": 3372, "actual_smm": 0.0041518, "pred_smm": 0.0098551, "actual_cpr": 4.87, "pred_cpr": 11.2057}, {"key": "2009.0", "n": 4534, "actual_smm": 0.0068372, "pred_smm": 0.0119591, "actual_cpr": 7.9031, "pred_cpr": 13.4436}, {"key": "2010.0", "n": 6738, "actual_smm": 0.0121698, "pred_smm": 0.0129574, "actual_cpr": 13.6648, "pred_cpr": 14.4873}, {"key": "2011.0", "n": 11040, "actual_smm": 0.0121377, "pred_smm": 0.0123732, "actual_cpr": 13.6312, "pred_cpr": 13.8779}, {"key": "2012.0", "n": 22241, "actual_smm": 0.0085877, "pred_smm": 0.0088017, "actual_cpr": 9.8322, "pred_cpr": 10.0654}, {"key": "2013.0", "n": 22969, "actual_smm": 0.0114067, "pred_smm": 0.0098354, "actual_cpr": 12.8611, "pred_cpr": 11.1845}, {"key": "2014.0", "n": 17409, "actual_smm": 0.0112011, "pred_smm": 0.0104602, "actual_cpr": 12.6434, "pred_cpr": 11.8547}, {"key": "2015.0", "n": 15351, "actual_smm": 0.0099668, "pred_smm": 0.0088564, "actual_cpr": 11.3258, "pred_cpr": 10.125}, {"key": "2016.0", "n": 15206, "actual_smm": 0.011114, "pred_smm": 0.0087357, "actual_cpr": 12.5511, "pred_cpr": 9.9935}, {"key": "2017.0", "n": 18637, "actual_smm": 0.0081022, "pred_smm": 0.0077718, "actual_cpr": 9.3008, "pred_cpr": 8.9377}, {"key": "2018.0", "n": 14480, "actual_smm": 0.0123619, "pred_smm": 0.0092763, "actual_cpr": 13.8661, "pred_cpr": 10.5808}, {"key": "2019.0", "n": 12337, "actual_smm": 0.0077815, "pred_smm": 0.0067209, "actual_cpr": 8.9483, "pred_cpr": 7.7735}, {"key": "2020.0", "n": 21652, "actual_smm": 0.0025864, "pred_smm": 0.0026052, "actual_cpr": 3.0599, "pred_cpr": 3.0819}, {"key": "2021.0", "n": 19144, "actual_smm": 0.0010969, "pred_smm": 0.0010823, "actual_cpr": 1.3084, "pred_cpr": 1.2911}, {"key": "2022.0", "n": 9747, "actual_smm": 0.0015389, "pred_smm": 0.0009379, "actual_cpr": 1.8312, "pred_cpr": 1.1197}, {"key": "2023.0", "n": 2892, "actual_smm": 0.0, "pred_smm": 0.004002, "actual_cpr": 0.0, "pred_cpr": 4.698}, {"key": "2024.0", "n": 1637, "actual_smm": 0.0030544, "pred_smm": 0.0033148, "actual_cpr": 3.6043, "pred_cpr": 3.906}, {"key": "2025.0", "n": 1032, "actual_smm": 0.002907, "pred_smm": 0.0038491, "actual_cpr": 3.4331, "pred_cpr": 4.5224}, {"key": "2026.0", "n": 11, "actual_smm": 0.0, "pred_smm": 0.0029967, "actual_cpr": 0.0, "pred_cpr": 3.5374}], "age_cuts": [{"key": "0-12m", "n": 16293, "actual_smm": 0.0034371, "pred_smm": 0.0038838, "actual_cpr": 4.0474, "pred_cpr": 4.5623}, {"key": "12-36m", "n": 38460, "actual_smm": 0.0067343, "pred_smm": 0.0055554, "actual_cpr": 7.7884, "pred_cpr": 6.4665}, {"key": "36-60m", "n": 43414, "actual_smm": 0.0071175, "pred_smm": 0.0066683, "actual_cpr": 8.2145, "pred_cpr": 7.7149}, {"key": "60-120m", "n": 86123, "actual_smm": 0.0105547, "pred_smm": 0.0094298, "actual_cpr": 11.9556, "pred_cpr": 10.7469}, {"key": "120-180m", "n": 39826, "actual_smm": 0.0069804, "pred_smm": 0.0089714, "actual_cpr": 8.0622, "pred_cpr": 10.25}, {"key": "180m+", "n": 20304, "actual_smm": 0.0068952, "pred_smm": 0.008126, "actual_cpr": 7.9675, "pred_cpr": 9.3269}], "mtm_cuts": [{"key": "0-12m", "n": 245, "actual_smm": 0.0571429, "pred_smm": 0.0403903, "actual_cpr": 50.6428, "pred_cpr": 39.0273}, {"key": "12-24m", "n": 201, "actual_smm": 0.0199005, "pred_smm": 0.085536, "actual_cpr": 21.4327, "pred_cpr": 65.8021}, {"key": "24-36m", "n": 282, "actual_smm": 0.0070922, "pred_smm": 0.0073109, "actual_cpr": 8.1864, "pred_cpr": 8.4288}, {"key": "36-60m", "n": 662, "actual_smm": 0.0090634, "pred_smm": 0.0087474, "actual_cpr": 10.35, "pred_cpr": 10.0063}, {"key": "60-120m", "n": 5122, "actual_smm": 0.0062476, "pred_smm": 0.0058338, "actual_cpr": 7.2448, "pred_cpr": 6.7802}, {"key": "120m+", "n": 238114, "actual_smm": 0.007971, "pred_smm": 0.0077733, "actual_cpr": 9.1568, "pred_cpr": 8.9393}], "size_cuts": [{"key": "<2M", "n": 58350, "actual_smm": 0.0059983, "pred_smm": 0.0063221, "actual_cpr": 6.9652, "pred_cpr": 7.3282}, {"key": "2-5M", "n": 61629, "actual_smm": 0.0077723, "pred_smm": 0.0081721, "actual_cpr": 8.9382, "pred_cpr": 9.3775}, {"key": "5-10M", "n": 53942, "actual_smm": 0.0086945, "pred_smm": 0.0083509, "actual_cpr": 9.9487, "pred_cpr": 9.5734}, {"key": "10-25M", "n": 52979, "actual_smm": 0.0090413, "pred_smm": 0.0086935, "actual_cpr": 10.326, "pred_cpr": 9.9475}, {"key": "25-50M", "n": 15387, "actual_smm": 0.0103334, "pred_smm": 0.0075475, "actual_cpr": 11.7191, "pred_cpr": 8.6904}, {"key": "50M+", "n": 2339, "actual_smm": 0.0085507, "pred_smm": 0.0068567, "actual_cpr": 9.7917, "pred_cpr": 7.9247}], "post_lockout_cuts": [{"key": "in-lockout/none", "n": 178473, "actual_smm": 0.0070879, "pred_smm": 0.0067296, "actual_cpr": 8.1816, "pred_cpr": 7.7832}, {"key": "0-6m", "n": 815, "actual_smm": 0.0147239, "pred_smm": 0.009055, "actual_cpr": 16.3058, "pred_cpr": 10.3409}, {"key": "6-12m", "n": 847, "actual_smm": 0.0035419, "pred_smm": 0.0070198, "actual_cpr": 4.1685, "pred_cpr": 8.1061}, {"key": "12-18m", "n": 898, "actual_smm": 0.0055679, "pred_smm": 0.0058352, "actual_cpr": 6.4807, "pred_cpr": 6.7818}, {"key": "18-24m", "n": 63593, "actual_smm": 0.0105515, "pred_smm": 0.0109466, "actual_cpr": 11.9522, "pred_cpr": 12.3732}], "issuer_cuts": [{"key": "iss_capital_funding", "n": 8139, "actual_smm": 0.0066347, "pred_smm": 0.0058413, "actual_cpr": 7.6775, "pred_cpr": 6.7887}, {"key": "iss_pnc", "n": 9786, "actual_smm": 0.0056203, "pred_smm": 0.0079031, "actual_cpr": 6.5397, "pred_cpr": 9.0821}, {"key": "iss_wells_fargo", "n": 10966, "actual_smm": 0.0086631, "pred_smm": 0.008707, "actual_cpr": 9.9145, "pred_cpr": 9.9623}, {"key": "iss_dwight", "n": 8161, "actual_smm": 0.007352, "pred_smm": 0.0070492, "actual_cpr": 8.4743, "pred_cpr": 8.1387}, {"key": "iss_greystone", "n": 14243, "actual_smm": 0.0080741, "pred_smm": 0.0070277, "actual_cpr": 9.2701, "pred_cpr": 8.1148}, {"key": "iss_lument_combined", "n": 41299, "actual_smm": 0.007361, "pred_smm": 0.0080175, "actual_cpr": 8.4842, "pred_cpr": 9.2079}, {"key": "other", "n": 152032, "actual_smm": 0.0083732, "pred_smm": 0.0079367, "actual_cpr": 9.5978, "pred_cpr": 9.1192}], "issuer_scurves": {"iss_capital_funding": [{"ri_bucket": 0, "n": 71, "ri_mid": -328.21, "actual_cpr": 0.0, "pred_cpr": 0.9298}, {"ri_bucket": 1, "n": 1119, "ri_mid": -238.09, "actual_cpr": 3.1701, "pred_cpr": 1.5297}, {"ri_bucket": 2, "n": 1735, "ri_mid": -151.89, "actual_cpr": 2.7318, "pred_cpr": 3.1357}, {"ri_bucket": 3, "n": 557, "ri_mid": -76.47, "actual_cpr": 10.2558, "pred_cpr": 4.4796}, {"ri_bucket": 4, "n": 397, "ri_mid": -23.62, "actual_cpr": 14.1092, "pred_cpr": 4.8148}, {"ri_bucket": 5, "n": 495, "ri_mid": 27.32, "actual_cpr": 2.3975, "pred_cpr": 4.7654}, {"ri_bucket": 6, "n": 809, "ri_mid": 76.8, "actual_cpr": 5.7745, "pred_cpr": 5.2837}, {"ri_bucket": 7, "n": 1028, "ri_mid": 125.72, "actual_cpr": 4.5706, "pred_cpr": 7.7239}, {"ri_bucket": 8, "n": 947, "ri_mid": 174.15, "actual_cpr": 6.155, "pred_cpr": 11.0957}, {"ri_bucket": 9, "n": 818, "ri_mid": 237.5, "actual_cpr": 19.9158, "pred_cpr": 16.8288}, {"ri_bucket": 10, "n": 163, "ri_mid": 347.38, "actual_cpr": 45.3325, "pred_cpr": 22.7709}], "iss_pnc": [{"ri_bucket": 0, "n": 54, "ri_mid": -327.51, "actual_cpr": 0.0, "pred_cpr": 0.939}, {"ri_bucket": 1, "n": 810, "ri_mid": -237.71, "actual_cpr": 0.0, "pred_cpr": 1.9236}, {"ri_bucket": 2, "n": 1598, "ri_mid": -147.8, "actual_cpr": 1.4916, "pred_cpr": 4.8035}, {"ri_bucket": 3, "n": 557, "ri_mid": -76.08, "actual_cpr": 2.1333, "pred_cpr": 4.3742}, {"ri_bucket": 4, "n": 478, "ri_mid": -23.91, "actual_cpr": 4.907, "pred_cpr": 5.3487}, {"ri_bucket": 5, "n": 590, "ri_mid": 27.21, "actual_cpr": 5.9339, "pred_cpr": 6.0232}, {"ri_bucket": 6, "n": 872, "ri_mid": 75.73, "actual_cpr": 4.0512, "pred_cpr": 8.1932}, {"ri_bucket": 7, "n": 986, "ri_mid": 125.64, "actual_cpr": 10.4198, "pred_cpr": 8.8389}, {"ri_bucket": 8, "n": 1047, "ri_mid": 175.6, "actual_cpr": 7.7344, "pred_cpr": 10.1201}, {"ri_bucket": 9, "n": 1277, "ri_mid": 240.37, "actual_cpr": 14.0412, "pred_cpr": 12.4411}, {"ri_bucket": 10, "n": 1286, "ri_mid": 387.64, "actual_cpr": 6.3398, "pred_cpr": 15.0097}, {"ri_bucket": 11, "n": 231, "ri_mid": 586.58, "actual_cpr": 23.0945, "pred_cpr": 33.5587}], "iss_wells_fargo": [{"ri_bucket": 0, "n": 96, "ri_mid": -327.18, "actual_cpr": 11.8081, "pred_cpr": 1.3258}, {"ri_bucket": 1, "n": 1231, "ri_mid": -239.06, "actual_cpr": 0.9705, "pred_cpr": 2.6197}, {"ri_bucket": 2, "n": 2057, "ri_mid": -148.96, "actual_cpr": 1.7362, "pred_cpr": 4.1839}, {"ri_bucket": 3, "n": 751, "ri_mid": -77.97, "actual_cpr": 0.0, "pred_cpr": 5.3197}, {"ri_bucket": 4, "n": 516, "ri_mid": -23.25, "actual_cpr": 11.0278, "pred_cpr": 5.4514}, {"ri_bucket": 5, "n": 745, "ri_mid": 26.29, "actual_cpr": 10.7104, "pred_cpr": 6.4709}, {"ri_bucket": 6, "n": 1030, "ri_mid": 77.43, "actual_cpr": 7.8573, "pred_cpr": 8.9616}, {"ri_bucket": 7, "n": 1129, "ri_mid": 125.18, "actual_cpr": 8.1794, "pred_cpr": 11.2708}, {"ri_bucket": 8, "n": 1264, "ri_mid": 176.85, "actual_cpr": 25.0422, "pred_cpr": 16.2091}, {"ri_bucket": 9, "n": 1253, "ri_mid": 234.25, "actual_cpr": 20.7116, "pred_cpr": 19.9349}, {"ri_bucket": 10, "n": 741, "ri_mid": 383.74, "actual_cpr": 13.6396, "pred_cpr": 17.8309}, {"ri_bucket": 11, "n": 153, "ri_mid": 565.27, "actual_cpr": 0.0, "pred_cpr": 18.8372}], "iss_dwight": [{"ri_bucket": 0, "n": 217, "ri_mid": -327.99, "actual_cpr": 0.0, "pred_cpr": 0.9896}, {"ri_bucket": 1, "n": 2196, "ri_mid": -242.46, "actual_cpr": 0.5451, "pred_cpr": 1.939}, {"ri_bucket": 2, "n": 1750, "ri_mid": -157.15, "actual_cpr": 2.7086, "pred_cpr": 4.1399}, {"ri_bucket": 3, "n": 473, "ri_mid": -76.03, "actual_cpr": 4.9576, "pred_cpr": 4.6374}, {"ri_bucket": 4, "n": 426, "ri_mid": -23.94, "actual_cpr": 10.7035, "pred_cpr": 5.7651}, {"ri_bucket": 5, "n": 481, "ri_mid": 27.56, "actual_cpr": 0.0, "pred_cpr": 6.3058}, {"ri_bucket": 6, "n": 779, "ri_mid": 75.68, "actual_cpr": 3.0377, "pred_cpr": 7.6516}, {"ri_bucket": 7, "n": 751, "ri_mid": 125.43, "actual_cpr": 6.2075, "pred_cpr": 13.0208}, {"ri_bucket": 8, "n": 701, "ri_mid": 174.15, "actual_cpr": 36.4627, "pred_cpr": 21.6557}, {"ri_bucket": 9, "n": 371, "ri_mid": 232.72, "actual_cpr": 43.0423, "pred_cpr": 33.4413}], "iss_greystone": [{"ri_bucket": 0, "n": 394, "ri_mid": -327.01, "actual_cpr": 0.0, "pred_cpr": 0.9123}, {"ri_bucket": 1, "n": 3269, "ri_mid": -243.78, "actual_cpr": 1.4585, "pred_cpr": 1.5687}, {"ri_bucket": 2, "n": 2869, "ri_mid": -153.99, "actual_cpr": 2.8889, "pred_cpr": 3.2081}, {"ri_bucket": 3, "n": 958, "ri_mid": -75.48, "actual_cpr": 1.2454, "pred_cpr": 3.6175}, {"ri_bucket": 4, "n": 685, "ri_mid": -25.7, "actual_cpr": 6.7866, "pred_cpr": 4.4395}, {"ri_bucket": 5, "n": 936, "ri_mid": 29.74, "actual_cpr": 3.7791, "pred_cpr": 5.9774}, {"ri_bucket": 6, "n": 1542, "ri_mid": 76.2, "actual_cpr": 3.8224, "pred_cpr": 7.2561}, {"ri_bucket": 7, "n": 1605, "ri_mid": 125.03, "actual_cpr": 13.3162, "pred_cpr": 13.4774}, {"ri_bucket": 8, "n": 1075, "ri_mid": 172.57, "actual_cpr": 31.2123, "pred_cpr": 22.1738}, {"ri_bucket": 9, "n": 884, "ri_mid": 235.04, "actual_cpr": 41.8093, "pred_cpr": 29.9984}], "iss_lument_combined": [{"ri_bucket": 0, "n": 445, "ri_mid": -326.62, "actual_cpr": 0.0, "pred_cpr": 1.471}, {"ri_bucket": 1, "n": 5789, "ri_mid": -237.89, "actual_cpr": 1.0315, "pred_cpr": 2.3706}, {"ri_bucket": 2, "n": 8900, "ri_mid": -150.25, "actual_cpr": 3.5803, "pred_cpr": 3.7083}, {"ri_bucket": 3, "n": 3267, "ri_mid": -76.51, "actual_cpr": 5.3726, "pred_cpr": 5.025}, {"ri_bucket": 4, "n": 2332, "ri_mid": -25.89, "actual_cpr": 5.5158, "pred_cpr": 5.2314}, {"ri_bucket": 5, "n": 2451, "ri_mid": 27.08, "actual_cpr": 4.7876, "pred_cpr": 6.1412}, {"ri_bucket": 6, "n": 3454, "ri_mid": 76.81, "actual_cpr": 3.0824, "pred_cpr": 8.2575}, {"ri_bucket": 7, "n": 4451, "ri_mid": 126.05, "actual_cpr": 9.0385, "pred_cpr": 11.3816}, {"ri_bucket": 8, "n": 4254, "ri_mid": 175.35, "actual_cpr": 17.1085, "pred_cpr": 16.3424}, {"ri_bucket": 9, "n": 4480, "ri_mid": 236.95, "actual_cpr": 22.8901, "pred_cpr": 22.1722}, {"ri_bucket": 10, "n": 1344, "ri_mid": 379.3, "actual_cpr": 22.3253, "pred_cpr": 21.1001}, {"ri_bucket": 11, "n": 132, "ri_mid": 549.39, "actual_cpr": 16.7406, "pred_cpr": 21.9004}], "_other": [{"ri_bucket": 0, "n": 2031, "ri_mid": -327.43, "actual_cpr": 0.5892, "pred_cpr": 1.1233}, {"ri_bucket": 1, "n": 21464, "ri_mid": -240.95, "actual_cpr": 2.5416, "pred_cpr": 1.9931}, {"ri_bucket": 2, "n": 29555, "ri_mid": -150.57, "actual_cpr": 3.9464, "pred_cpr": 3.7883}, {"ri_bucket": 3, "n": 11207, "ri_mid": -75.52, "actual_cpr": 5.1224, "pred_cpr": 4.6073}, {"ri_bucket": 4, "n": 9488, "ri_mid": -24.98, "actual_cpr": 4.2164, "pred_cpr": 4.8748}, {"ri_bucket": 5, "n": 10559, "ri_mid": 26.82, "actual_cpr": 5.8598, "pred_cpr": 6.1382}, {"ri_bucket": 6, "n": 14258, "ri_mid": 76.15, "actual_cpr": 6.2122, "pred_cpr": 8.3336}, {"ri_bucket": 7, "n": 16147, "ri_mid": 125.95, "actual_cpr": 10.3939, "pred_cpr": 11.8842}, {"ri_bucket": 8, "n": 15256, "ri_mid": 174.65, "actual_cpr": 19.3521, "pred_cpr": 16.5333}, {"ri_bucket": 9, "n": 15368, "ri_mid": 239.41, "actual_cpr": 26.836, "pred_cpr": 21.5707}, {"ri_bucket": 10, "n": 5730, "ri_mid": 378.53, "actual_cpr": 17.8285, "pred_cpr": 19.6021}, {"ri_bucket": 11, "n": 969, "ri_mid": 557.88, "actual_cpr": 10.5934, "pred_cpr": 25.1548}]}, "attribution_loans": [{"label": "232_RP", "archetype_id": "232_RP", "loan_id": "3617X46E8_000000007322294", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer_key": "KEYBANK NATIONAL ASSOCIATION", "logit_z": -6.1524, "pred_smm": 0.0021239, "pred_cpr": 2.5192, "actual_prepay": 0, "contributions": [{"feature": "gross_refi_incentive_bps", "x_native": -158.0, "x_std": -0.87239, "contribution_logit": -0.4974}, {"feature": "prepay_penalty_points", "x_native": 6.0, "x_std": 0.25437, "contribution_logit": -0.0924}, {"feature": "age_0_36", "x_native": 36.0, "x_std": 0.43611, "contribution_logit": 0.1185}, {"feature": "age_36_120", "x_native": 70.0, "x_std": 0.87378, "contribution_logit": 0.1689}, {"feature": "age_120plus", "x_native": 0.0, "x_std": -0.38986, "contribution_logit": 0.0385}, {"feature": "months_to_maturity", "x_native": 315.0, "x_std": -0.15345, "contribution_logit": 0.0049}, {"feature": "pre_maturity_flag", "x_native": 0.0, "x_std": -0.04205, "contribution_logit": -0.0049}, {"feature": "months_since_lockout_end", "x_native": 0.0, "x_std": -0.60942, "contribution_logit": 0.0079}, {"feature": "log_upb", "x_native": 15.9064, "x_std": 0.43409, "contribution_logit": 0.1793}, {"feature": "small_loan", "x_native": 0.0, "x_std": -0.55674, "contribution_logit": 0.0564}, {"feature": "large_loan", "x_native": 0.0, "x_std": -0.1145, "contribution_logit": 0.0049}, {"feature": "burn_ratio", "x_native": 0.0, "x_std": -0.79854, "contribution_logit": -0.1422}, {"feature": "is_post_covid", "x_native": 0.0, "x_std": -0.41593, "contribution_logit": 0.0419}, {"feature": "is_223a7", "x_native": 0.0, "x_std": -0.56998, "contribution_logit": -0.0147}, {"feature": "is_538", "x_native": 0.0, "x_std": -0.2687, "contribution_logit": 0.0519}, {"feature": "is_hc_232", "x_native": 1.0, "x_std": 1.70422, "contribution_logit": -0.0543}, {"feature": "lp_NC", "x_native": 0.0, "x_std": -0.37142, "contribution_logit": 0.0155}, {"feature": "iss_capital_funding", "x_native": 0.0, "x_std": -0.18868, "contribution_logit": 0.0158}, {"feature": "iss_pnc", "x_native": 0.0, "x_std": -0.19276, "contribution_logit": 0.012}, {"feature": "iss_wells_fargo", "x_native": 0.0, "x_std": -0.21322, "contribution_logit": 0.0086}, {"feature": "iss_dwight", "x_native": 0.0, "x_std": -0.17939, "contribution_logit": -0.0079}, {"feature": "iss_greystone", "x_native": 0.0, "x_std": -0.25561, "contribution_logit": -0.0127}, {"feature": "iss_lument_combined", "x_native": 0.0, "x_std": -0.45108, "contribution_logit": 0.0015}, {"feature": "gross_refi__x__prepay_pen", "x_native": -948.0, "x_std": -0.82697, "contribution_logit": -0.5272}]}, {"label": "232_NC", "archetype_id": "232_NC", "loan_id": "3617M15B3_000000011343080", "period": "202602", "fha_category": "232", "loan_purpose": "NC", "issuer_key": "BERKADIA COMMERCIAL MORTGAGE, ", "logit_z": -5.8821, "pred_smm": 0.0027811, "pred_cpr": 3.2867, "actual_prepay": 0, "contributions": [{"feature": "gross_refi_incentive_bps", "x_native": -92.0, "x_std": -0.51312, "contribution_logit": -0.2926}, {"feature": "prepay_penalty_points", "x_native": 6.0, "x_std": 0.25437, "contribution_logit": -0.0924}, {"feature": "age_0_36", "x_native": 36.0, "x_std": 0.43611, "contribution_logit": 0.1185}, {"feature": "age_36_120", "x_native": 84.0, "x_std": 1.29215, "contribution_logit": 0.2498}, {"feature": "age_120plus", "x_native": 59.0, "x_std": 1.64323, "contribution_logit": -0.1623}, {"feature": "months_to_maturity", "x_native": 320.0, "x_std": -0.09698, "contribution_logit": 0.0031}, {"feature": "pre_maturity_flag", "x_native": 0.0, "x_std": -0.04205, "contribution_logit": -0.0049}, {"feature": "months_since_lockout_end", "x_native": 0.0, "x_std": -0.60942, "contribution_logit": 0.0079}, {"feature": "log_upb", "x_native": 15.8482, "x_std": 0.38706, "contribution_logit": 0.1598}, {"feature": "small_loan", "x_native": 0.0, "x_std": -0.55674, "contribution_logit": 0.0564}, {"feature": "large_loan", "x_native": 0.0, "x_std": -0.1145, "contribution_logit": 0.0049}, {"feature": "burn_ratio", "x_native": 0.1341, "x_std": -0.24982, "contribution_logit": -0.0445}, {"feature": "is_post_covid", "x_native": 0.0, "x_std": -0.41593, "contribution_logit": 0.0419}, {"feature": "is_223a7", "x_native": 0.0, "x_std": -0.56998, "contribution_logit": -0.0147}, {"feature": "is_538", "x_native": 0.0, "x_std": -0.2687, "contribution_logit": 0.0519}, {"feature": "is_hc_232", "x_native": 1.0, "x_std": 1.70422, "contribution_logit": -0.0543}, {"feature": "lp_NC", "x_native": 1.0, "x_std": 2.69239, "contribution_logit": -0.1122}, {"feature": "iss_capital_funding", "x_native": 0.0, "x_std": -0.18868, "contribution_logit": 0.0158}, {"feature": "iss_pnc", "x_native": 0.0, "x_std": -0.19276, "contribution_logit": 0.012}, {"feature": "iss_wells_fargo", "x_native": 0.0, "x_std": -0.21322, "contribution_logit": 0.0086}, {"feature": "iss_dwight", "x_native": 0.0, "x_std": -0.17939, "contribution_logit": -0.0079}, {"feature": "iss_greystone", "x_native": 0.0, "x_std": -0.25561, "contribution_logit": -0.0127}, {"feature": "iss_lument_combined", "x_native": 0.0, "x_std": -0.45108, "contribution_logit": 0.0015}, {"feature": "gross_refi__x__prepay_pen", "x_native": -552.0, "x_std": -0.45603, "contribution_logit": -0.2907}]}], "comparison_to_v6e": {"available": true, "v6e_test_auc": 0.7613901, "v6f_test_auc": 0.7854320202066933, "auc_delta": 0.024, "v6e_log_loss": 0.04325521, "v6f_log_loss": 0.042335574793472074, "log_loss_delta": -0.00092, "v6e_n_features": 18, "yearly_compare": [{"year": 2018, "n": 2764, "actual_cpr": 4.2562, "v6e_pred_cpr": 5.169, "v6f_pred_cpr": 5.8105}, {"year": 2019, "n": 33514, "actual_cpr": 5.2065, "v6e_pred_cpr": 8.445, "v6f_pred_cpr": 9.5625}, {"year": 2020, "n": 34093, "actual_cpr": 18.5506, "v6e_pred_cpr": 16.747, "v6f_pred_cpr": 18.3447}, {"year": 2021, "n": 33154, "actual_cpr": 21.9597, "v6e_pred_cpr": 17.898, "v6f_pred_cpr": 17.2941}, {"year": 2022, "n": 32741, "actual_cpr": 9.5929, "v6e_pred_cpr": 8.1432, "v6f_pred_cpr": 6.8873}, {"year": 2023, "n": 33415, "actual_cpr": 3.2892, "v6e_pred_cpr": 3.79, "v6f_pred_cpr": 3.386}, {"year": 2024, "n": 34039, "actual_cpr": 2.3366, "v6e_pred_cpr": 3.707, "v6f_pred_cpr": 3.5988}, {"year": 2025, "n": 34957, "actual_cpr": 3.0128, "v6e_pred_cpr": 3.7887, "v6f_pred_cpr": 3.7817}, {"year": 2026, "n": 5949, "actual_cpr": 3.571, "v6e_pred_cpr": 5.0293, "v6f_pred_cpr": 4.9653}], "calibration_compare": [{"decile": 0, "v6e_pred_cpr": 0.67375, "v6e_actual_cpr": 1.7863, "v6f_pred_cpr": 0.409, "v6f_actual_cpr": 1.6551}, {"decile": 1, "v6e_pred_cpr": 1.5441, "v6e_actual_cpr": 2.3241, "v6f_pred_cpr": 1.0925, "v6f_actual_cpr": 1.3649}, {"decile": 2, "v6e_pred_cpr": 2.5421, "v6e_actual_cpr": 3.0497, "v6f_pred_cpr": 2.1088, "v6f_actual_cpr": 2.041}, {"decile": 3, "v6e_pred_cpr": 3.6451, "v6e_actual_cpr": 3.6285, "v6f_pred_cpr": 3.4288, "v6f_actual_cpr": 3.9963}, {"decile": 4, "v6e_pred_cpr": 4.9395, "v6e_actual_cpr": 4.4298, "v6f_pred_cpr": 4.9578, "v6f_actual_cpr": 4.091}, {"decile": 5, "v6e_pred_cpr": 6.5711, "v6e_actual_cpr": 4.7579, "v6f_pred_cpr": 6.811, "v6f_actual_cpr": 5.2644}, {"decile": 6, "v6e_pred_cpr": 8.7804, "v6e_actual_cpr": 6.4016, "v6f_pred_cpr": 9.1381, "v6f_actual_cpr": 6.7017}, {"decile": 7, "v6e_pred_cpr": 11.957, "v6e_actual_cpr": 9.9231, "v6f_pred_cpr": 12.3476, "v6f_actual_cpr": 8.3905}, {"decile": 8, "v6e_pred_cpr": 16.73, "v6e_actual_cpr": 16.96, "v6f_pred_cpr": 17.1008, "v6f_actual_cpr": 17.6634}, {"decile": 9, "v6e_pred_cpr": 27.821, "v6e_actual_cpr": 32.382, "v6f_pred_cpr": 28.7965, "v6f_actual_cpr": 34.9798}]}, "accepted_interactions": [{"name": "gross_refi__x__prepay_pen", "left": "gross_refi_incentive_bps", "right": "prepay_penalty_points"}]};
/* __ISSUER_RESIDUALS__ */ const ISSUER_RESIDUALS = {"description": "Per-issuer empirical residual ratio (actual_smm / pred_smm). Apply as optional overlay multiplier in dashboard / Excel. Default 1.0 keeps the core model issuer-neutral.", "min_n": 1000, "issuers": [{"issuer_number": "3896", "issuer_name": "RED MORTGAGE CAPITAL, LLC.", "n": 205895, "actual_smm": 0.0078001, "pred_smm": 0.0076246, "residual_ratio": 1.023, "actual_cpr": 8.9688, "pred_cpr": 8.7754}, {"issuer_number": "4082", "issuer_name": "BERKADIA COMMERCIAL MORTGAGE, LLC", "n": 106649, "actual_smm": 0.0086171, "pred_smm": 0.0084128, "residual_ratio": 1.0243, "actual_cpr": 9.8642, "pred_cpr": 9.6411}, {"issuer_number": "4080", "issuer_name": "WALKER & DUNLOP, LLC", "n": 87217, "actual_smm": 0.0092528, "pred_smm": 0.0093228, "residual_ratio": 0.9925, "actual_cpr": 10.5554, "pred_cpr": 10.6311}, {"issuer_number": "4168", "issuer_name": "GREYSTONE FUNDING COMPANY LLC", "n": 59556, "actual_smm": 0.0081436, "pred_smm": 0.0062876, "residual_ratio": 1.2952, "actual_cpr": 9.3463, "pred_cpr": 7.2896}, {"issuer_number": "3487", "issuer_name": "MERCHANTS CAPITAL CORP.", "n": 59501, "actual_smm": 0.0068066, "pred_smm": 0.0074168, "residual_ratio": 0.9177, "actual_cpr": 7.869, "pred_cpr": 8.546}, {"issuer_number": "3998", "issuer_name": "WELLS FARGO MULTIFAMILY CAPITAL", "n": 53686, "actual_smm": 0.0092203, "pred_smm": 0.0106405, "residual_ratio": 0.8665, "actual_cpr": 10.5201, "pred_cpr": 12.0472}, {"issuer_number": "3976", "issuer_name": "PNC BANK, NA", "n": 44978, "actual_smm": 0.0068256, "pred_smm": 0.0096245, "residual_ratio": 0.7092, "actual_cpr": 7.8901, "pred_cpr": 10.9572}, {"issuer_number": "3866", "issuer_name": "CAPITAL FUNDING,LLC.", "n": 41909, "actual_smm": 0.006013, "pred_smm": 0.0087272, "residual_ratio": 0.689, "actual_cpr": 6.9817, "pred_cpr": 9.9843}, {"issuer_number": "3153", "issuer_name": "PRUDENTIAL HUNTOON PAIGE ASSOCIATES, LLC", "n": 38806, "actual_smm": 0.0081688, "pred_smm": 0.0083198, "residual_ratio": 0.9819, "actual_cpr": 9.374, "pred_cpr": 9.5393}, {"issuer_number": "4398", "issuer_name": "DWIGHT CAPITAL LLC", "n": 38790, "actual_smm": 0.0076051, "pred_smm": 0.0057271, "residual_ratio": 1.3279, "actual_cpr": 8.7539, "pred_cpr": 6.6601}, {"issuer_number": "4012", "issuer_name": "BONNEVILLE MORTGAGE COMPANY", "n": 35248, "actual_smm": 0.0044825, "pred_smm": 0.0041047, "residual_ratio": 1.092, "actual_cpr": 5.2484, "pred_cpr": 4.816}, {"issuer_number": "4271", "issuer_name": "KEYBANK NATIONAL ASSOCIATION", "n": 32397, "actual_smm": 0.0090749, "pred_smm": 0.0077994, "residual_ratio": 1.1635, "actual_cpr": 10.3625, "pred_cpr": 8.968}, {"issuer_number": "4067", "issuer_name": "BELLWETHER ENTERPRISE REAL ESTATE CAPITA", "n": 27200, "actual_smm": 0.0038603, "pred_smm": 0.0068925, "residual_ratio": 0.5601, "actual_cpr": 4.5353, "pred_cpr": 7.9646}, {"issuer_number": "3995", "issuer_name": "DOUGHERTY MORTGAGE, LLC", "n": 25918, "actual_smm": 0.0085269, "pred_smm": 0.0094572, "residual_ratio": 0.9016, "actual_cpr": 9.7658, "pred_cpr": 10.7765}, {"issuer_number": "2045", "issuer_name": "GERSHMAN INVESTMENT CORP.", "n": 24926, "actual_smm": 0.0121159, "pred_smm": 0.0066008, "residual_ratio": 1.8355, "actual_cpr": 13.6083, "pred_cpr": 7.6397}, {"issuer_number": "4065", "issuer_name": "JONES LANG LASALLE MULTIFAMILY LLC", "n": 24725, "actual_smm": 0.0082912, "pred_smm": 0.0071801, "residual_ratio": 1.1548, "actual_cpr": 9.508, "pred_cpr": 8.2839}, {"issuer_number": "4300", "issuer_name": "MIDLAND STATES BANK", "n": 23852, "actual_smm": 0.0081754, "pred_smm": 0.0059871, "residual_ratio": 1.3655, "actual_cpr": 9.3812, "pred_cpr": 6.9526}, {"issuer_number": "4016", "issuer_name": "GRANDBRIDGE REAL ESTATE CAPITAL, LLC", "n": 22330, "actual_smm": 0.0098074, "pred_smm": 0.008972, "residual_ratio": 1.0931, "actual_cpr": 11.1544, "pred_cpr": 10.2507}, {"issuer_number": "3044", "issuer_name": "CENTENNIAL MORTGAGE, INC", "n": 19380, "actual_smm": 0.005418, "pred_smm": 0.0071509, "residual_ratio": 0.7577, "actual_cpr": 6.3113, "pred_cpr": 8.2515}, {"issuer_number": "4223", "issuer_name": "NEWPOINT REAL ESTATE CAPITAL LLC", "n": 19271, "actual_smm": 0.00576, "pred_smm": 0.0048104, "residual_ratio": 1.1974, "actual_cpr": 6.6971, "pred_cpr": 5.6222}, {"issuer_number": "3201", "issuer_name": "LOVE FUNDING CORPORATION", "n": 17192, "actual_smm": 0.0108772, "pred_smm": 0.0133167, "residual_ratio": 0.8168, "actual_cpr": 12.2994, "pred_cpr": 14.86}, {"issuer_number": "4347", "issuer_name": "CHURCHILL MORTGAGE INVESTMENT LLC", "n": 16345, "actual_smm": 0.0041603, "pred_smm": 0.0031121, "residual_ratio": 1.3368, "actual_cpr": 4.8797, "pred_cpr": 3.6712}, {"issuer_number": "3733", "issuer_name": "CAMBRIDGE REALTY CAPITAL LTD OF ILLINOIS", "n": 15547, "actual_smm": 0.0091336, "pred_smm": 0.0070988, "residual_ratio": 1.2866, "actual_cpr": 10.4261, "pred_cpr": 8.1937}, {"issuer_number": "3500", "issuer_name": "GREYSTONE SERVICING CORPORATION, INC.", "n": 14935, "actual_smm": 0.0067626, "pred_smm": 0.0077619, "residual_ratio": 0.8713, "actual_cpr": 7.82, "pred_cpr": 8.9268}, {"issuer_number": "3640", "issuer_name": "M&T REALTY CAPITAL CORPORATION", "n": 12704, "actual_smm": 0.0089736, "pred_smm": 0.0082897, "residual_ratio": 1.0825, "actual_cpr": 10.2524, "pred_cpr": 9.5064}, {"issuer_number": "4265", "issuer_name": "MERCHANTS CAPITAL SERVICING LLC", "n": 12124, "actual_smm": 0.0031343, "pred_smm": 0.0053795, "residual_ratio": 0.5826, "actual_cpr": 3.697, "pred_cpr": 6.2678}, {"issuer_number": "4051", "issuer_name": "CBRE HMF, INC.", "n": 11087, "actual_smm": 0.0086588, "pred_smm": 0.0089197, "residual_ratio": 0.9707, "actual_cpr": 9.9097, "pred_cpr": 10.1938}, {"issuer_number": "4147", "issuer_name": "CAPITAL ONE MULTIFAMILY FINANCE LLC", "n": 10628, "actual_smm": 0.0111968, "pred_smm": 0.0079742, "residual_ratio": 1.4041, "actual_cpr": 12.6389, "pred_cpr": 9.1603}, {"issuer_number": "3991", "issuer_name": "HOUSING & HEALTHCARE FINANCE, LLC", "n": 10481, "actual_smm": 0.0169831, "pred_smm": 0.0134878, "residual_ratio": 1.2591, "actual_cpr": 18.5799, "pred_cpr": 15.037}, {"issuer_number": "2973", "issuer_name": "DAVIS-PENN MORTGAGE CO.", "n": 9340, "actual_smm": 0.0089936, "pred_smm": 0.0079813, "residual_ratio": 1.1268, "actual_cpr": 10.2741, "pred_cpr": 9.1681}, {"issuer_number": "4170", "issuer_name": "BERKELEY POINT CAPITAL DBA NEWMARK KNIGH", "n": 8951, "actual_smm": 0.0088258, "pred_smm": 0.0114646, "residual_ratio": 0.7698, "actual_cpr": 10.0917, "pred_cpr": 12.9224}, {"issuer_number": "3785", "issuer_name": "LANCASTER POLLARD MORTGAGE COMPANY, LLC", "n": 8683, "actual_smm": 0.0040309, "pred_smm": 0.0060979, "residual_ratio": 0.661, "actual_cpr": 4.7312, "pred_cpr": 7.077}, {"issuer_number": "4013", "issuer_name": "NORTHMARQ FINANCE, LLC", "n": 7885, "actual_smm": 0.0069753, "pred_smm": 0.0079017, "residual_ratio": 0.8828, "actual_cpr": 8.0566, "pred_cpr": 9.0806}, {"issuer_number": "4188", "issuer_name": "HIGHLAND COMMERCIAL MORTGAGE, LLC.", "n": 7547, "actual_smm": 0.0106002, "pred_smm": 0.0078172, "residual_ratio": 1.356, "actual_cpr": 12.0043, "pred_cpr": 8.9877}, {"issuer_number": "3758", "issuer_name": "ARBOR AGENCY LENDING, LLC", "n": 7391, "actual_smm": 0.0073062, "pred_smm": 0.0064351, "residual_ratio": 1.1354, "actual_cpr": 8.4236, "pred_cpr": 7.4546}, {"issuer_number": "4404", "issuer_name": "AGM FINANCIAL SERVICES, INC.", "n": 7000, "actual_smm": 0.0031429, "pred_smm": 0.0041316, "residual_ratio": 0.7607, "actual_cpr": 3.7069, "pred_cpr": 4.8468}, {"issuer_number": "3799", "issuer_name": "CENTURY HEALTH CAPITAL, INC", "n": 6356, "actual_smm": 0.0086532, "pred_smm": 0.0069337, "residual_ratio": 1.248, "actual_cpr": 9.9037, "pred_cpr": 8.0103}, {"issuer_number": "4281", "issuer_name": "MASSACHUSETTS HOUSING FINANCE AGENCY", "n": 5725, "actual_smm": 0.0033188, "pred_smm": 0.0068969, "residual_ratio": 0.4812, "actual_cpr": 3.9106, "pred_cpr": 7.9694}, {"issuer_number": "3455", "issuer_name": "ARMSTRONG MORTGAGE COMPANY", "n": 5122, "actual_smm": 0.007419, "pred_smm": 0.0077663, "residual_ratio": 0.9553, "actual_cpr": 8.5483, "pred_cpr": 8.9317}, {"issuer_number": "1535", "issuer_name": "ROSE COMMUNITY CAPITAL, LLC", "n": 5116, "actual_smm": 0.0066458, "pred_smm": 0.0074822, "residual_ratio": 0.8882, "actual_cpr": 7.6898, "pred_cpr": 8.6183}, {"issuer_number": "3854", "issuer_name": "X-CALIBER CAPITAL CORP.", "n": 4928, "actual_smm": 0.0048701, "pred_smm": 0.0062778, "residual_ratio": 0.7758, "actual_cpr": 5.6901, "pred_cpr": 7.2786}, {"issuer_number": "3752", "issuer_name": "FIRST HOUSING DEVELOPMENT CORPORATION OF", "n": 4540, "actual_smm": 0.011674, "pred_smm": 0.0104566, "residual_ratio": 1.1164, "actual_cpr": 13.1434, "pred_cpr": 11.8509}, {"issuer_number": "3969", "issuer_name": "FIRST AMERICAN CAPITAL GROUP CORPORATION", "n": 4387, "actual_smm": 0.0072943, "pred_smm": 0.0065563, "residual_ratio": 1.1126, "actual_cpr": 8.4104, "pred_cpr": 7.59}, {"issuer_number": "4380", "issuer_name": "SUNTRUST BANK", "n": 4222, "actual_smm": 0.0040265, "pred_smm": 0.0108962, "residual_ratio": 0.3695, "actual_cpr": 4.7263, "pred_cpr": 12.3196}, {"issuer_number": "3965", "issuer_name": "COLUMBIANATIONAL REAL ESTATE FINANCE, LL", "n": 3266, "actual_smm": 0.0094917, "pred_smm": 0.0114062, "residual_ratio": 0.8322, "actual_cpr": 10.8139, "pred_cpr": 12.8606}, {"issuer_number": "3912", "issuer_name": "ZIEGLER FINANCING CORPORATION", "n": 2981, "actual_smm": 0.0110701, "pred_smm": 0.0086016, "residual_ratio": 1.287, "actual_cpr": 12.5044, "pred_cpr": 9.8473}, {"issuer_number": "4411", "issuer_name": "REGIONS BANK", "n": 2228, "actual_smm": 0.0004488, "pred_smm": 0.0036727, "residual_ratio": 0.1222, "actual_cpr": 0.5373, "pred_cpr": 4.3193}, {"issuer_number": "4451", "issuer_name": "HARPER CAPITAL PARTNERS, LLC", "n": 1805, "actual_smm": 0.0, "pred_smm": 0.0033426, "residual_ratio": 0.0, "actual_cpr": 0.0, "pred_cpr": 3.9382}, {"issuer_number": "4084", "issuer_name": "NORTHPOINT CAPITAL, LLC", "n": 1598, "actual_smm": 0.005632, "pred_smm": 0.008256, "residual_ratio": 0.6822, "actual_cpr": 6.553, "pred_cpr": 9.4695}, {"issuer_number": "3557", "issuer_name": "HUNT MORTGAGE CAPITAL, LLC", "n": 1494, "actual_smm": 0.0040161, "pred_smm": 0.0102946, "residual_ratio": 0.3901, "actual_cpr": 4.7142, "pred_cpr": 11.6775}, {"issuer_number": "3958", "issuer_name": "MIDCAP FINANCIAL HOUSING CAPITAL, INC.", "n": 1292, "actual_smm": 0.0154799, "pred_smm": 0.0057989, "residual_ratio": 2.6695, "actual_cpr": 17.0731, "pred_cpr": 6.741}]};

// ---------- Theme (matches v6f_dashboard.jsx) ----------
const T = {
  bg: '#0F172A', panel: '#1E293B', panelLight: '#334155',
  text: '#F1F5F9', textDim: '#94A3B8', accent: '#22D3EE',
  blue: '#60A5FA', green: '#34D399', red: '#F87171',
  yellow: '#FBBF24', purple: '#A78BFA', orange: '#FB923C',
  border: '#334155', grid: '#475569',
};
const FONT_MONO = 'Consolas, "SF Mono", Menlo, monospace';
const FONT_SANS = 'Inter, "Segoe UI", system-ui, sans-serif';
const tooltipStyle = {
  contentStyle: { background: T.panel, border: `1px solid ${T.border}`,
                  borderRadius: 4, fontFamily: FONT_MONO, fontSize: 12 },
  itemStyle: { color: T.text }, labelStyle: { color: T.textDim },
};

const Panel = ({ title, subtitle, children, style }) => (
  <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8,
                padding: 16, marginBottom: 16, ...style }}>
    {title && <div style={{ color: T.text, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>}
    {subtitle && <div style={{ color: T.textDim, fontSize: 11, marginBottom: 12, fontFamily: FONT_MONO }}>{subtitle}</div>}
    {children}
  </div>
);
const Stat = ({ label, value, hint, color }) => (
  <div style={{ flex: 1, padding: '12px 14px', background: T.panelLight, borderRadius: 6 }}>
    <div style={{ color: T.textDim, fontSize: 11, fontFamily: FONT_MONO, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ color: color || T.text, fontSize: 22, fontWeight: 600, fontFamily: FONT_MONO, marginTop: 2 }}>{value}</div>
    {hint && <div style={{ color: T.textDim, fontSize: 10, marginTop: 2 }}>{hint}</div>}
  </div>
);

// ---------- Multiplier formulas re-implemented in JS (mirror v7_multipliers.py) ----------
function mAge(age, p) {
  // Piecewise linear interpolation through 6 knots
  const xs = p.knots_x, ys = p.knots_y;
  if (age <= xs[0]) return ys[0];
  if (age >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 1; i < xs.length; i++) {
    if (age <= xs[i]) {
      const t = (age - xs[i - 1]) / (xs[i] - xs[i - 1]);
      return ys[i - 1] + t * (ys[i] - ys[i - 1]);
    }
  }
  return ys[ys.length - 1];
}
function mRate(grf, p) {
  const z = -(grf - p.mid) / p.slope;
  return p.floor + p.asymptote / (1 + Math.exp(Math.max(-50, Math.min(50, z))));
}
function mPenalty(ppp, p) {
  return Math.max(p.floor, 1 + p.slope * (ppp - p.ppp_mean));
}
function mSize(logUpb, p) {
  return Math.max(p.low, Math.min(p.high, p.intercept + p.slope * (logUpb - p.log_upb_anchor)));
}
function mProgram(fhaCat, p) {
  for (const k of Object.keys(p)) {
    if (k === 'default') continue;
    if (String(fhaCat).includes(k.replace('(', '').replace(')', ''))) return p[k];
    if (String(fhaCat).includes(k)) return p[k];
  }
  return p['default'];
}
function mPurpose(purpose, age, p) {
  if (String(purpose).toUpperCase() === 'NC') {
    return 1 + p.NC_bump * Math.max(0, 1 - age / p.NC_decay);
  }
  return 1.0;
}
function mLockout(msle, p) {
  if (msle > 0 && msle <= 12) {
    return 1 + p.amplitude * Math.exp(-msle / p.tau);
  }
  return 1.0;
}
function mMaturity(mtm, p) {
  if (mtm > 0) {
    return 1 + p.amplitude * Math.max(0, (p.cutoff - mtm) / p.cutoff);
  }
  return 1.0;
}
function mBurnout(br, p) {
  return Math.max(p.floor, 1 - p.slope * Math.max(0, Math.min(1, br)));
}
const MULT_NAMES = ['M_age', 'M_rate', 'M_penalty', 'M_size',
                    'M_program', 'M_purpose', 'M_lockout', 'M_maturity', 'M_burnout'];

function computeAllMultipliers(features, params) {
  return {
    M_age:      mAge      (features.age,                         params.M_age),
    M_rate:     mRate     (features.grf,                         params.M_rate),
    M_penalty:  mPenalty  (features.ppp,                         params.M_penalty),
    M_size:     mSize     (features.logUpb,                      params.M_size),
    M_program:  mProgram  (features.fhaCategory,                 params.M_program),
    M_purpose:  mPurpose  (features.loanPurpose, features.age,   params.M_purpose),
    M_lockout:  mLockout  (features.msle,                        params.M_lockout),
    M_maturity: mMaturity (features.mtm,                         params.M_maturity),
    M_burnout:  mBurnout  (features.burnRatio,                   params.M_burnout),
  };
}
function composeSmm(mults, params) {
  let prod = 1.0;
  for (const n of MULT_NAMES) prod *= mults[n];
  return Math.min(params.base_smm * prod, params.smm_cap);
}
const annualizeCpr = (smm) => 1 - Math.pow(1 - smm, 12);

// ============================================================================
// Tab components
// ============================================================================

function TabOverview({ md, mdF }) {
  const m = md.metadata || {};
  const cmp = md.comparison_to_v6f || {};
  return (
    <div>
      <Panel title="V7 at a glance"
             subtitle={`9-multiplier multiplicative model  •  ${m.n_free_params || '?'} free parameters  •  ${(m.period_range || []).join(' → ')}`}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Stat label="Test AUC" value={(m.test_auc || 0).toFixed(4)}
                hint={cmp.available ? `vs V6F ${(cmp.v6f_test_auc || 0).toFixed(4)}  (Δ${(cmp.auc_delta >= 0 ? '+' : '')}${(cmp.auc_delta || 0).toFixed(4)})` : ''}
                color={T.accent} />
          <Stat label="Test log loss" value={(m.test_log_loss || 0).toFixed(5)}
                hint={cmp.available ? `vs V6F ${(cmp.v6f_log_loss || 0).toFixed(5)}` : ''} />
          <Stat label="Base CPR (anchor)" value={(m.base_cpr || 0).toFixed(2) + '%'}
                hint={`base SMM ${(m.base_smm || 0).toFixed(5)}`} />
          <Stat label="Panel actual CPR" value={(m.panel_actual_cpr || 0).toFixed(2) + '%'} />
          <Stat label="Max pred CPR (full panel)" value={(m.max_cpr_full_panel || 0).toFixed(2) + '%'}
                hint={`SMM cap = ${(m.smm_cap || 0.10).toFixed(3)}; n>75% = ${m.n_above_75_cpr || 0}`}
                color={(m.max_cpr_full_panel || 0) < 75 ? T.green : T.red} />
        </div>
      </Panel>

      <Panel title="V7 architectural change vs V6F"
             subtitle="multiplicative form structurally prevents the V6F penalty-rate interaction blowup">
        <div style={{ color: T.textDim, fontSize: 12, fontFamily: FONT_MONO, lineHeight: 1.6 }}>
          predicted_SMM = MIN(base_SMM × <span style={{color: T.text}}>M_age × M_rate × M_penalty × M_size × M_program × M_purpose × M_lockout × M_maturity × M_burnout</span>, smm_cap)
          <br />
          predicted_CPR = 1 − (1 − predicted_SMM)^12
        </div>
        <div style={{ marginTop: 12, color: T.textDim, fontSize: 11 }}>
          Each multiplier is bounded; no interaction can flip a factor's sign. The 168bp
          penalty sign-flip in V6F is structurally impossible here.
        </div>
      </Panel>
    </div>
  );
}

function TabMultipliers({ md }) {
  const curves = md.multiplier_curves || {};
  const params = md.multipliers || {};
  const numericKeys = ['M_age', 'M_rate', 'M_penalty', 'M_size',
                       'M_lockout', 'M_maturity', 'M_burnout'];
  const labels = {
    M_age: 'M_age (loan_age_months)',
    M_rate: 'M_rate (gross_refi_incentive_bps)',
    M_penalty: 'M_penalty (prepay_penalty_points)',
    M_size: 'M_size (log_upb)',
    M_lockout: 'M_lockout (months_since_lockout_end)',
    M_maturity: 'M_maturity (months_to_maturity)',
    M_burnout: 'M_burnout (burn_ratio)',
  };

  return (
    <div>
      <Panel title="Multiplier curves" subtitle="each fitted multiplier rendered over its input domain">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12 }}>
          {numericKeys.map(k => {
            const data = (curves[k] || []).map(p => ({ x: p.x, y: p.y }));
            return (
              <div key={k} style={{ background: T.panelLight, padding: 8, borderRadius: 6 }}>
                <div style={{ color: T.text, fontSize: 12, fontWeight: 600, marginBottom: 4, fontFamily: FONT_MONO }}>{labels[k]}</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                    <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="x" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 10 }} />
                    <YAxis stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 10 }}
                           domain={['dataMin', 'dataMax']} />
                    <Tooltip {...tooltipStyle} />
                    <ReferenceLine y={1} stroke={T.textDim} strokeDasharray="2 2" />
                    <Line type="monotone" dataKey="y" stroke={T.accent} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ color: T.textDim, fontSize: 10, fontFamily: FONT_MONO, marginTop: 4 }}>
                  params: {Object.entries(params[k] || {})
                    .filter(([key]) => key !== 'knots_x')
                    .map(([key, val]) => `${key}=${typeof val === 'number' ? val.toFixed(3) : JSON.stringify(val)}`).join('  ')}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Categorical multipliers" subtitle="program (FHA category) and purpose (NC vs RP)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ color: T.text, fontSize: 12, fontWeight: 600, marginBottom: 4, fontFamily: FONT_MONO }}>M_program</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={curves.M_program || []}>
                <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
                <XAxis dataKey="x" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
                <YAxis stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <ReferenceLine y={1} stroke={T.textDim} strokeDasharray="2 2" />
                <Bar dataKey="y" fill={T.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ color: T.text, fontSize: 12, fontWeight: 600, marginBottom: 4, fontFamily: FONT_MONO }}>M_purpose</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={curves.M_purpose || []}>
                <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
                <XAxis dataKey="x" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
                <YAxis stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <ReferenceLine y={1} stroke={T.textDim} strokeDasharray="2 2" />
                <Bar dataKey="y" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function TabWaterfall({ md }) {
  const loans = md.attribution_loans || [];
  const [pickIdx, setPickIdx] = useState(0);
  if (!loans.length) return <Panel title="Waterfall"><div style={{color: T.textDim}}>No attribution_loans.</div></Panel>;
  const loan = loans[pickIdx];
  const baseCpr = (md.metadata?.base_cpr || 0);

  // Build a step-by-step waterfall:
  // start at base_CPR; multiply each multiplier in turn; show cumulative CPR
  let cumSmm = md.metadata?.base_smm || 0;
  const rows = [{ name: 'base_SMM', mult: 1, cumCpr: baseCpr }];
  for (const c of loan.contributions || []) {
    cumSmm = cumSmm * c.multiplier;
    rows.push({
      name: c.feature, mult: c.multiplier,
      cumCpr: (1 - Math.pow(1 - Math.min(cumSmm, md.multipliers?.smm_cap || 0.10), 12)) * 100,
    });
  }

  return (
    <div>
      <Panel title="Per-loan multiplicative waterfall"
             subtitle="start at base_CPR; each multiplier applies in sequence">
        <select value={pickIdx} onChange={e => setPickIdx(parseInt(e.target.value))}
                style={{ background: T.panel, color: T.text, border: `1px solid ${T.border}`,
                         padding: 6, fontFamily: FONT_MONO, fontSize: 11, borderRadius: 4, width: '100%', marginBottom: 12 }}>
          {loans.map((l, i) => <option key={i} value={i}>
            {l.label} | {l.fha_category} | issuer={l.issuer_key} | actual={l.actual_prepay}
          </option>)}
        </select>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <Stat label="Pred CPR" value={(loan.pred_cpr).toFixed(2) + '%'} color={T.accent} />
          <Stat label="Pred SMM" value={(loan.pred_smm).toFixed(5)} />
          <Stat label="Σ log(M)" value={loan.logit_z.toFixed(3)} />
          <Stat label="Actual prepay (this month)" value={String(loan.actual_prepay)}
                color={loan.actual_prepay ? T.green : T.textDim} />
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={rows} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 10 }} />
            <YAxis stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }}
                   label={{ value: 'cumulative CPR %', angle: -90, position: 'insideLeft', fill: T.textDim, fontSize: 11 }} />
            <Tooltip {...tooltipStyle}
                     formatter={(v, n, p) =>
                       n === 'cumCpr'
                         ? [`${v.toFixed(2)}%`, `cum CPR (mult=${(p.payload.mult || 0).toFixed(3)})`]
                         : [v, n]} />
            <Bar dataKey="cumCpr" fill={T.accent} />
          </ComposedChart>
        </ResponsiveContainer>

        <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse',
                        fontFamily: FONT_MONO, fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.panelLight, color: T.text }}>
              {['multiplier', 'value', 'log(value)', 'cumulative CPR'].map(h =>
                <th key={h} style={{ padding: 6, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: 6, color: T.text }}>{r.name}</td>
                <td style={{ padding: 6 }}>{r.mult.toFixed(4)}</td>
                <td style={{ padding: 6 }}>{Math.log(Math.max(r.mult, 1e-9)).toFixed(4)}</td>
                <td style={{ padding: 6 }}>{r.cumCpr.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function TabWhatIf({ md }) {
  const params = md.multipliers || {};
  const [loanRate, setLoanRate] = useState(5.0);
  const [plcBps,   setPlcBps]   = useState(450);
  const [ppp,      setPpp]      = useState(5.0);
  const [age,      setAge]      = useState(60);
  const [mtm,      setMtm]      = useState(300);
  const [msle,     setMsle]     = useState(0);
  const [upbM,     setUpbM]     = useState(5);
  const [program,  setProgram]  = useState('223(f)');
  const [purpose,  setPurpose]  = useState('RP');
  const [burnRatio, setBurnRatio] = useState(0.2);

  const features = useMemo(() => ({
    age, grf: loanRate * 100 - plcBps, ppp,
    logUpb: Math.log1p(upbM * 1_000_000),
    fhaCategory: program, loanPurpose: purpose,
    msle, mtm, burnRatio,
  }), [loanRate, plcBps, ppp, age, mtm, msle, upbM, program, purpose, burnRatio]);

  const result = useMemo(() => {
    const mults = computeAllMultipliers(features, params);
    const smm = composeSmm(mults, params);
    const cpr = annualizeCpr(smm);
    return { mults, smm, cpr };
  }, [features, params]);

  const slider = (label, value, setVal, min, max, step, fmt = v => v) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    fontFamily: FONT_MONO, fontSize: 11, color: T.textDim }}>
        <span>{label}</span><span style={{ color: T.text }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => setVal(parseFloat(e.target.value))}
             style={{ width: '100%' }} />
    </div>
  );

  const multBars = MULT_NAMES.map(n => ({
    name: n, mult: result.mults[n],
    log: Math.log(Math.max(result.mults[n], 1e-9))
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <div>
        <Panel title="Scenario inputs" subtitle="drag sliders → multipliers + CPR update live">
          {slider('Loan rate %',    loanRate, setLoanRate, 1, 10, 0.05, v => v.toFixed(2))}
          {slider('PLC rate (bp)',  plcBps,   setPlcBps,   100, 750, 5, v => v.toFixed(0))}
          <div style={{ color: T.textDim, fontSize: 10, fontFamily: FONT_MONO, marginTop: -6, marginBottom: 8 }}>
            → gross_refi_bps = {(loanRate * 100 - plcBps).toFixed(1)}
          </div>
          {slider('Prepay penalty pts', ppp, setPpp, 0, 10, 0.5, v => v.toFixed(1))}
          {slider('Age (months)',   age, setAge, 0, 360, 1, v => v.toFixed(0))}
          {slider('Months to maturity', mtm, setMtm, 0, 480, 1, v => v.toFixed(0))}
          {slider('Months since lockout end', msle, setMsle, 0, 24, 1, v => v.toFixed(0))}
          {slider('UPB ($M)',       upbM, setUpbM, 0.5, 100, 0.5, v => '$' + v.toFixed(1) + 'M')}
          {slider('Burn ratio',     burnRatio, setBurnRatio, 0, 1, 0.01, v => v.toFixed(2))}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.textDim, marginBottom: 4 }}>FHA program</div>
            <select value={program} onChange={e => setProgram(e.target.value)}
                    style={{ width: '100%', background: T.panel, color: T.text, border: `1px solid ${T.border}`,
                             padding: 6, fontFamily: FONT_MONO, fontSize: 11, borderRadius: 4 }}>
              {['223(f)', '223(a)(7)', '232', '538', 'OTHER'].map(o =>
                <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.textDim, marginBottom: 4 }}>Loan purpose</div>
            <select value={purpose} onChange={e => setPurpose(e.target.value)}
                    style={{ width: '100%', background: T.panel, color: T.text, border: `1px solid ${T.border}`,
                             padding: 6, fontFamily: FONT_MONO, fontSize: 11, borderRadius: 4 }}>
              {['RP', 'NC', 'OTHER'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </Panel>
      </div>

      <div>
        <Panel title="Result">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Stat label="Pred CPR" value={(result.cpr * 100).toFixed(2) + '%'} color={T.accent}
                  hint={`SMM ${(result.smm * 100).toFixed(4)}%`} />
            <Stat label="Δ vs base" value={
              ((result.cpr * 100) - (md.metadata?.base_cpr || 0)).toFixed(2) + ' pp'
            } color={result.cpr * 100 > (md.metadata?.base_cpr || 0) ? T.green : T.red} />
            <Stat label="Total log-mult" value={multBars.reduce((s, m) => s + m.log, 0).toFixed(3)} />
            <Stat label="Capped?" value={(params.base_smm * Math.exp(multBars.reduce((s, m) => s + m.log, 0))) > params.smm_cap ? 'YES' : 'no'}
                  color={(params.base_smm * Math.exp(multBars.reduce((s, m) => s + m.log, 0))) > params.smm_cap ? T.yellow : T.textDim} />
          </div>
        </Panel>

        <Panel title="Per-multiplier values for this scenario">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={multBars} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 100 }}>
              <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
              <XAxis type="number" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 10 }} />
              <YAxis type="category" dataKey="name" stroke={T.textDim}
                     tick={{ fontFamily: FONT_MONO, fontSize: 11 }} width={90} />
              <Tooltip {...tooltipStyle}
                       formatter={(v, n, p) => [v.toFixed(4), `M (log=${(p.payload.log || 0).toFixed(3)})`]} />
              <ReferenceLine x={1} stroke={T.textDim} strokeDasharray="2 2" />
              <Bar dataKey="mult">
                {multBars.map((m, i) =>
                  <Cell key={i} fill={m.mult >= 1 ? T.green : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function TabHistorical({ md, mdF }) {
  const yearly = md.yearly || [];
  const yearlyF = (mdF && mdF.yearly) || [];
  const merged = yearly.map(y => {
    const f = yearlyF.find(x => x.year === y.year) || {};
    return { year: String(y.year), actual: y.actual_cpr, v7_pred: y.pred_cpr, v6f_pred: f.pred_cpr };
  });
  return (
    <div>
      <Panel title="Yearly fit (test set)" subtitle="V7 vs V6F predicted CPR vs actual">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={merged} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <YAxis stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }}
                   label={{ value: 'CPR %', angle: -90, position: 'insideLeft', fill: T.textDim, fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ color: T.text, fontSize: 12 }} />
            <Bar dataKey="actual" fill={T.accent} name="Actual" />
            <Line type="monotone" dataKey="v7_pred"  stroke={T.green}  strokeWidth={2} dot={{ r: 4 }} name="V7" />
            <Line type="monotone" dataKey="v6f_pred" stroke={T.yellow} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="V6F" />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function TabSCurve({ md, mdF }) {
  const sc = md.scurve || [];
  const scF = (mdF && mdF.scurve) || [];
  const merged = sc.map(s => {
    const f = scF.find(x => Math.abs((x.ri_mid || 0) - (s.ri_mid || 0)) < 25) || {};
    return { ri_mid: s.ri_mid, actual: s.actual_cpr, v7_pred: s.pred_cpr, v6f_pred: f.pred_cpr };
  });
  return (
    <Panel title="S-curve: CPR vs gross refi incentive (bp)" subtitle="V7 sigmoid vs actual + V6F overlay">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={merged} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
          <XAxis dataKey="ri_mid" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }}
                 label={{ value: 'gross_refi_bps', position: 'insideBottom', fill: T.textDim, fontSize: 11, offset: -8 }} />
          <YAxis stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }}
                 label={{ value: 'CPR %', angle: -90, position: 'insideLeft', fill: T.textDim, fontSize: 11 }} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ color: T.text, fontSize: 12 }} />
          <ReferenceLine x={0} stroke={T.textDim} strokeDasharray="2 2" />
          <Line type="monotone" dataKey="actual"   stroke={T.accent} strokeWidth={2} name="Actual" />
          <Line type="monotone" dataKey="v7_pred"  stroke={T.green}  strokeWidth={2} name="V7" />
          <Line type="monotone" dataKey="v6f_pred" stroke={T.yellow} strokeWidth={2} strokeDasharray="4 4" name="V6F" />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function TabCalibration({ md }) {
  const cal = md.calibration || [];
  return (
    <div>
      <Panel title="Decile calibration (test set)" subtitle="diagonal = perfect">
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 12, right: 16, bottom: 12, left: 12 }}>
            <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
            <XAxis type="number" dataKey="pred_cpr" name="Pred CPR %" stroke={T.textDim}
                   tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <YAxis type="number" dataKey="actual_cpr" name="Actual CPR %" stroke={T.textDim}
                   tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="V7" data={cal.map(c => ({ pred_cpr: c.pred_cpr, actual_cpr: c.actual_cpr }))} fill={T.green} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 50, y: 50 }]} stroke={T.textDim} strokeDasharray="4 4" />
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Decile residuals">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={cal.map(c => ({ decile: c.decile, gap: c.actual_cpr - c.pred_cpr }))}>
            <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
            <XAxis dataKey="decile" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <YAxis stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine y={0} stroke={T.textDim} />
            <Bar dataKey="gap" fill={T.accent} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function TabCohorts({ md }) {
  const sources = {
    'FHA category':         md.fha_cuts || [],
    'Loan purpose':         md.lp_cuts || [],
    'Vintage year':         md.vintage_cuts || [],
    'Age bucket':           md.age_cuts || [],
    'Maturity bucket':      md.mtm_cuts || [],
    'Size bucket':          md.size_cuts || [],
    'Post-lockout':         md.post_lockout_cuts || [],
  };
  const [axis, setAxis] = useState('FHA category');
  const data = sources[axis] || [];
  return (
    <Panel title="Cohort cuts: actual vs V7 predicted CPR">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {Object.keys(sources).map(k => (
          <button key={k} onClick={() => setAxis(k)} style={{
            background: axis === k ? T.accent : T.panelLight,
            color: axis === k ? T.bg : T.text,
            border: 'none', borderRadius: 4, padding: '6px 12px',
            fontFamily: FONT_MONO, fontSize: 11, cursor: 'pointer',
            fontWeight: axis === k ? 600 : 400,
          }}>{k}</button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(260, 28 * data.length + 80)}>
        <BarChart data={data} layout="vertical" margin={{ top: 12, right: 16, bottom: 12, left: 100 }}>
          <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
          <XAxis type="number" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
          <YAxis type="category" dataKey="key" stroke={T.textDim}
                 tick={{ fontFamily: FONT_MONO, fontSize: 11 }} width={90} />
          <Tooltip {...tooltipStyle} formatter={(v, n, p) => [`${(v || 0).toFixed(2)}%`, n + ` (n=${p.payload.n})`]} />
          <Legend wrapperStyle={{ color: T.text, fontSize: 12 }} />
          <Bar dataKey="actual_cpr" fill={T.accent} name="Actual" />
          <Bar dataKey="pred_cpr"   fill={T.green}  name="V7 predicted" />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function TabAttribution({ md }) {
  const loans = md.attribution_loans || [];
  const [pickIdx, setPickIdx] = useState(0);
  if (!loans.length) return <Panel title="Attribution"><div style={{color: T.textDim}}>No attribution_loans.</div></Panel>;
  const loan = loans[pickIdx];

  const sorted = [...(loan.contributions || [])]
    .sort((a, b) => Math.abs(b.log_multiplier || 0) - Math.abs(a.log_multiplier || 0));

  return (
    <Panel title="Per-loan log-multiplier attribution"
           subtitle="each multiplier's log(M) — sums to log(pred_SMM/base_SMM)">
      <select value={pickIdx} onChange={e => setPickIdx(parseInt(e.target.value))}
              style={{ background: T.panel, color: T.text, border: `1px solid ${T.border}`,
                       padding: 6, fontFamily: FONT_MONO, fontSize: 11, borderRadius: 4, width: '100%', marginBottom: 12 }}>
        {loans.map((l, i) => <option key={i} value={i}>
          {l.label} | issuer={l.issuer_key} | period={l.period} | actual_prepay={l.actual_prepay}
        </option>)}
      </select>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <Stat label="Pred CPR" value={(loan.pred_cpr).toFixed(2) + '%'} color={T.accent} />
        <Stat label="Pred SMM" value={loan.pred_smm.toFixed(5)} />
        <Stat label="Σ log(M)" value={loan.logit_z.toFixed(3)} />
      </div>
      <ResponsiveContainer width="100%" height={Math.max(360, 32 * sorted.length)}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 130 }}>
          <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
          <XAxis type="number" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
          <YAxis type="category" dataKey="feature" stroke={T.textDim}
                 tick={{ fontFamily: FONT_MONO, fontSize: 11 }} width={120} />
          <Tooltip {...tooltipStyle}
                   formatter={(v, n, p) => [v.toFixed(4), `log(M); M=${(p.payload.multiplier || 0).toFixed(3)}`]} />
          <ReferenceLine x={0} stroke={T.textDim} />
          <Bar dataKey="log_multiplier">
            {sorted.map((c, i) =>
              <Cell key={i} fill={(c.log_multiplier || 0) >= 0 ? T.green : T.red} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function TabHeadToHead({ md }) {
  const cmp = md.comparison_to_v6f || {};
  if (!cmp.available) return <Panel title="V6F vs V7"><div style={{color: T.textDim}}>V6F artifact not loaded.</div></Panel>;
  const yc = cmp.yearly_compare || [];
  const cc = cmp.calibration_compare || [];
  return (
    <div>
      <Panel title="V6F vs V7: did the multiplicative redesign help?">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Stat label="V6F test AUC" value={cmp.v6f_test_auc.toFixed(4)} />
          <Stat label="V7 test AUC"  value={cmp.v7_test_auc.toFixed(4)} color={T.accent} />
          <Stat label="ΔAUC"         value={(cmp.auc_delta >= 0 ? '+' : '') + cmp.auc_delta.toFixed(4)}
                color={cmp.auc_delta >= 0 ? T.green : T.red} />
          <Stat label="ΔLog-loss"    value={(cmp.log_loss_delta >= 0 ? '+' : '') + cmp.log_loss_delta.toFixed(5)}
                color={cmp.log_loss_delta < 0 ? T.green : T.red} />
        </div>
      </Panel>
      <Panel title="Per-year |actual − pred| gap">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yc.map(y => ({
            year: String(y.year),
            v6f_gap: y.v6f_pred_cpr ? Math.abs(y.actual_cpr - y.v6f_pred_cpr) : null,
            v7_gap:  Math.abs(y.actual_cpr - y.v7_pred_cpr),
          }))}>
            <CartesianGrid stroke={T.grid} strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <YAxis stroke={T.textDim} tick={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ color: T.text, fontSize: 12 }} />
            <Bar dataKey="v6f_gap" fill={T.yellow} name="V6F |gap|" />
            <Bar dataKey="v7_gap"  fill={T.green}  name="V7 |gap|" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function TabBenchmarks({ md }) {
  const bench = md.sancap_benchmarks || [];
  return (
    <Panel title="SanCap benchmark grid (informational)" subtitle="V7's prediction vs SanCap 2014-2018 reference numbers; flag = REVIEW if Δ > 10pp">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_MONO, fontSize: 11 }}>
        <thead>
          <tr style={{ background: T.panelLight, color: T.text }}>
            {['Scenario', 'SanCap CPR', 'V7 pred CPR', 'Δ (pp)', 'Flag'].map(h =>
              <th key={h} style={{ padding: 6, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {bench.map((b, i) => (
            <tr key={i} style={{ color: T.textDim, borderBottom: `1px solid ${T.border}`,
                                 background: b.flag === 'REVIEW' ? '#3F1212' : 'transparent' }}>
              <td style={{ padding: 6, color: T.text }}>{b.scenario}</td>
              <td style={{ padding: 6 }}>{b.sancap_cpr}</td>
              <td style={{ padding: 6 }}>{b.v7_pred_cpr.toFixed(2)}</td>
              <td style={{ padding: 6, color: b.divergence_pp > 10 ? T.red : T.textDim }}>
                {b.divergence_pp.toFixed(2)}
              </td>
              <td style={{ padding: 6, color: b.flag === 'REVIEW' ? T.red : T.green }}>{b.flag}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

// ============================================================================
// Top-level shell
// ============================================================================
const TABS = [
  { key: 'overview',     label: 'Overview',        render: TabOverview },
  { key: 'historical',   label: 'Historical fits', render: TabHistorical },
  { key: 'scurve',       label: 'S-curve',         render: TabSCurve },
  { key: 'calibration',  label: 'Calibration',     render: TabCalibration },
  { key: 'cohorts',      label: 'Cohort cuts',     render: TabCohorts },
  { key: 'multipliers',  label: 'Multipliers',     render: TabMultipliers },
  { key: 'waterfall',    label: 'Waterfall',       render: TabWaterfall },
  { key: 'whatif',       label: 'What-if',         render: TabWhatIf },
  { key: 'attribution',  label: 'Attribution',     render: TabAttribution },
  { key: 'h2h',          label: 'V6F vs V7',       render: TabHeadToHead },
  { key: 'bench',        label: 'Benchmarks',      render: TabBenchmarks },
];

export default function V7Dashboard() {
  const [tab, setTab] = useState('overview');
  const md = MODEL_DATA_V7;
  const mdF = MODEL_DATA_V6F;
  const Tab = TABS.find(t => t.key === tab)?.render || TabOverview;

  if (md._placeholder) {
    return (
      <div style={{ background: T.bg, color: T.text, padding: 24, fontFamily: FONT_SANS, minHeight: '100vh' }}>
        <h1>V7 dashboard - data not yet emitted</h1>
        <pre style={{ background: T.panel, padding: 12, borderRadius: 6, fontFamily: FONT_MONO, fontSize: 12 }}>
{`Run: GNMA_PANEL_PARQUET=working/gnma_mf_panel.parquet python3 train_v7.py --emit-dashboard`}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: FONT_SANS,
                  minHeight: '100vh', padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>V7 Voluntary Prepayment Model</h1>
          <span style={{ color: T.textDim, fontFamily: FONT_MONO, fontSize: 11 }}>
            multiplicative · {md.metadata?.n_features} multipliers · test AUC {md.metadata?.test_auc?.toFixed(4)}
            <span style={{ color: (md.metadata?.max_cpr_full_panel || 0) < 75 ? T.green : T.red, marginLeft: 8 }}>
              (max pred CPR over panel: {(md.metadata?.max_cpr_full_panel || 0).toFixed(1)}%)
            </span>
          </span>
        </div>
      </header>

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ background: tab === t.key ? T.accent : T.panel,
                           color: tab === t.key ? T.bg : T.text,
                           border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 12px',
                           fontFamily: FONT_MONO, fontSize: 11, cursor: 'pointer',
                           fontWeight: tab === t.key ? 600 : 400 }}>{t.label}</button>
        ))}
      </nav>

      <main><Tab md={md} mdF={mdF} /></main>

      <footer style={{ marginTop: 24, color: T.textDim, fontFamily: FONT_MONO, fontSize: 10 }}>
        Built from model_data_v7.json + model_data_v6f.json + issuer_residuals.json. Refresh: python3 train_v7.py --emit-dashboard
      </footer>
    </div>
  );
}
