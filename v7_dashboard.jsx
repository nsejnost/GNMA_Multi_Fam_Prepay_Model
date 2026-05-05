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

/* __MODEL_DATA_V7__ */ const MODEL_DATA_V7 = {"metadata": {"training_pop_n": 982361, "training_events": 7686, "base_smm": 0.004713, "base_cpr": 5.5117, "panel_actual_smm": 0.007824, "panel_actual_cpr": 8.9951, "n_features": 9, "n_free_params": 27, "test_auc": 0.7787803, "test_log_loss": 0.0423181, "period_range": ["201812", "202602"], "last_period": "202603", "model_version": "v7", "description": "V7 multiplicative voluntary prepayment model (9 bounded multipliers)", "max_cpr_full_panel": 85.78, "n_above_75_cpr": 68, "n_above_90_cpr": 0, "smm_cap": 0.15, "feature_list": ["M_age", "M_rate", "M_size", "M_program", "M_purpose", "M_lockout", "M_maturity", "M_burnout"], "feature_labels": {"M_age": "age", "M_rate": "rate", "M_size": "size", "M_program": "program", "M_purpose": "purpose", "M_lockout": "lockout", "M_maturity": "maturity", "M_burnout": "burnout"}}, "multipliers": {"base_smm": 0.00471333574041012, "smm_cap": 0.15, "M_age": {"knots_x": [0.0, 12.0, 36.0, 96.0, 180.0, 360.0], "knots_y": [0.32039611850784266, 0.31570379404818133, 0.7825344231343733, 1.3960385091791854, 0.9314874869456753, 2.422391376027979]}, "M_rate": {"floor": 0.16157010212067735, "asymptote": 3.8774187078018194, "mid": 126.93259923091153, "slope": 95.70656713156407}, "M_size": {"intercept": 0.6420933591874611, "slope": 0.44603609084711526, "log_upb_anchor": 14.508658238524095, "low": 0.393845367653235, "high": 1.417843323551646}, "M_program": {"232": 0.9065731121941579, "538": 0.7081220957082347, "223a7": 1.0737734612331467, "223f": 1.1183598777140373, "default": 0.9523905688635125}, "M_purpose": {"NC_bump": 1.0454056754670118, "peak_age": 39.478258691880484, "width": 14.478228457586106}, "M_lockout": {"amplitude": 4.0, "tau": 1.7552981727098462}, "M_maturity": {"amplitude": 8.0, "cutoff": 12.309808321379624}, "M_burnout": {"floor": 0.5000000000000001, "slope": -4.028703723895018}}, "multiplier_curves": {"M_age": [{"x": 0.0, "y": 0.3204}, {"x": 6.1017, "y": 0.318}, {"x": 12.2034, "y": 0.3197}, {"x": 18.3051, "y": 0.4383}, {"x": 24.4068, "y": 0.557}, {"x": 30.5085, "y": 0.6757}, {"x": 36.6102, "y": 0.7888}, {"x": 42.7119, "y": 0.8512}, {"x": 48.8136, "y": 0.9136}, {"x": 54.9153, "y": 0.9759}, {"x": 61.0169, "y": 1.0383}, {"x": 67.1186, "y": 1.1007}, {"x": 73.2203, "y": 1.1631}, {"x": 79.322, "y": 1.2255}, {"x": 85.4237, "y": 1.2879}, {"x": 91.5254, "y": 1.3503}, {"x": 97.6271, "y": 1.387}, {"x": 103.7288, "y": 1.3533}, {"x": 109.8305, "y": 1.3196}, {"x": 115.9322, "y": 1.2858}, {"x": 122.0339, "y": 1.2521}, {"x": 128.1356, "y": 1.2183}, {"x": 134.2373, "y": 1.1846}, {"x": 140.339, "y": 1.1508}, {"x": 146.4407, "y": 1.1171}, {"x": 152.5424, "y": 1.0833}, {"x": 158.6441, "y": 1.0496}, {"x": 164.7458, "y": 1.0158}, {"x": 170.8475, "y": 0.9821}, {"x": 176.9492, "y": 0.9484}, {"x": 183.0508, "y": 0.9568}, {"x": 189.1525, "y": 1.0073}, {"x": 195.2542, "y": 1.0578}, {"x": 201.3559, "y": 1.1084}, {"x": 207.4576, "y": 1.1589}, {"x": 213.5593, "y": 1.2095}, {"x": 219.661, "y": 1.26}, {"x": 225.7627, "y": 1.3105}, {"x": 231.8644, "y": 1.3611}, {"x": 237.9661, "y": 1.4116}, {"x": 244.0678, "y": 1.4621}, {"x": 250.1695, "y": 1.5127}, {"x": 256.2712, "y": 1.5632}, {"x": 262.3729, "y": 1.6138}, {"x": 268.4746, "y": 1.6643}, {"x": 274.5763, "y": 1.7148}, {"x": 280.678, "y": 1.7654}, {"x": 286.7797, "y": 1.8159}, {"x": 292.8814, "y": 1.8665}, {"x": 298.9831, "y": 1.917}, {"x": 305.0847, "y": 1.9675}, {"x": 311.1864, "y": 2.0181}, {"x": 317.2881, "y": 2.0686}, {"x": 323.3898, "y": 2.1192}, {"x": 329.4915, "y": 2.1697}, {"x": 335.5932, "y": 2.2202}, {"x": 341.6949, "y": 2.2708}, {"x": 347.7966, "y": 2.3213}, {"x": 353.8983, "y": 2.3719}, {"x": 360.0, "y": 2.4224}], "M_rate": [{"x": -500.0, "y": 0.1671}, {"x": -479.5918, "y": 0.1684}, {"x": -459.1837, "y": 0.17}, {"x": -438.7755, "y": 0.172}, {"x": -418.3673, "y": 0.1745}, {"x": -397.9592, "y": 0.1776}, {"x": -377.551, "y": 0.1814}, {"x": -357.1429, "y": 0.1861}, {"x": -336.7347, "y": 0.1918}, {"x": -316.3265, "y": 0.199}, {"x": -295.9184, "y": 0.2078}, {"x": -275.5102, "y": 0.2186}, {"x": -255.102, "y": 0.2319}, {"x": -234.6939, "y": 0.2482}, {"x": -214.2857, "y": 0.2682}, {"x": -193.8776, "y": 0.2927}, {"x": -173.4694, "y": 0.3226}, {"x": -153.0612, "y": 0.359}, {"x": -132.6531, "y": 0.4029}, {"x": -112.2449, "y": 0.456}, {"x": -91.8367, "y": 0.5195}, {"x": -71.4286, "y": 0.595}, {"x": -51.0204, "y": 0.6842}, {"x": -30.6122, "y": 0.7883}, {"x": -10.2041, "y": 0.9086}, {"x": 10.2041, "y": 1.0456}, {"x": 30.6122, "y": 1.1995}, {"x": 51.0204, "y": 1.3693}, {"x": 71.4286, "y": 1.5534}, {"x": 91.8367, "y": 1.7487}, {"x": 112.2449, "y": 1.9518}, {"x": 132.6531, "y": 2.1582}, {"x": 153.0612, "y": 2.3633}, {"x": 173.4694, "y": 2.5626}, {"x": 193.8776, "y": 2.752}, {"x": 214.2857, "y": 2.9283}, {"x": 234.6939, "y": 3.0894}, {"x": 255.102, "y": 3.2339}, {"x": 275.5102, "y": 3.3615}, {"x": 295.9184, "y": 3.4726}, {"x": 316.3265, "y": 3.5681}, {"x": 336.7347, "y": 3.6495}, {"x": 357.1429, "y": 3.7181}, {"x": 377.551, "y": 3.7755}, {"x": 397.9592, "y": 3.8233}, {"x": 418.3673, "y": 3.8628}, {"x": 438.7755, "y": 3.8954}, {"x": 459.1837, "y": 3.9222}, {"x": 479.5918, "y": 3.944}, {"x": 500.0, "y": 3.9619}], "M_size": [{"x": 13.1224, "y": 0.3938}, {"x": 13.2582, "y": 0.3938}, {"x": 13.3941, "y": 0.3938}, {"x": 13.5299, "y": 0.3938}, {"x": 13.6658, "y": 0.3938}, {"x": 13.8016, "y": 0.3938}, {"x": 13.9375, "y": 0.3938}, {"x": 14.0733, "y": 0.4479}, {"x": 14.2092, "y": 0.5085}, {"x": 14.3451, "y": 0.5691}, {"x": 14.4809, "y": 0.6297}, {"x": 14.6168, "y": 0.6903}, {"x": 14.7526, "y": 0.7509}, {"x": 14.8885, "y": 0.8115}, {"x": 15.0243, "y": 0.8721}, {"x": 15.1602, "y": 0.9327}, {"x": 15.296, "y": 0.9933}, {"x": 15.4319, "y": 1.0539}, {"x": 15.5677, "y": 1.1145}, {"x": 15.7036, "y": 1.1751}, {"x": 15.8395, "y": 1.2357}, {"x": 15.9753, "y": 1.2963}, {"x": 16.1112, "y": 1.3569}, {"x": 16.247, "y": 1.4175}, {"x": 16.3829, "y": 1.4178}, {"x": 16.5187, "y": 1.4178}, {"x": 16.6546, "y": 1.4178}, {"x": 16.7904, "y": 1.4178}, {"x": 16.9263, "y": 1.4178}, {"x": 17.0621, "y": 1.4178}, {"x": 17.198, "y": 1.4178}, {"x": 17.3338, "y": 1.4178}, {"x": 17.4697, "y": 1.4178}, {"x": 17.6056, "y": 1.4178}, {"x": 17.7414, "y": 1.4178}, {"x": 17.8773, "y": 1.4178}, {"x": 18.0131, "y": 1.4178}, {"x": 18.149, "y": 1.4178}, {"x": 18.2848, "y": 1.4178}, {"x": 18.4207, "y": 1.4178}], "M_lockout": [{"x": 0.0, "y": 1.0}, {"x": 1.0, "y": 3.2628}, {"x": 2.0, "y": 2.28}, {"x": 3.0, "y": 1.7241}, {"x": 4.0, "y": 1.4096}, {"x": 5.0, "y": 1.2317}, {"x": 6.0, "y": 1.1311}, {"x": 7.0, "y": 1.0742}, {"x": 8.0, "y": 1.0419}, {"x": 9.0, "y": 1.0237}, {"x": 10.0, "y": 1.0134}, {"x": 11.0, "y": 1.0076}, {"x": 12.0, "y": 1.0043}, {"x": 13.0, "y": 1.0}, {"x": 14.0, "y": 1.0}, {"x": 15.0, "y": 1.0}, {"x": 16.0, "y": 1.0}, {"x": 17.0, "y": 1.0}, {"x": 18.0, "y": 1.0}, {"x": 19.0, "y": 1.0}, {"x": 20.0, "y": 1.0}, {"x": 21.0, "y": 1.0}, {"x": 22.0, "y": 1.0}, {"x": 23.0, "y": 1.0}, {"x": 24.0, "y": 1.0}], "M_maturity": [{"x": 0.0, "y": 1.0}, {"x": 2.069, "y": 7.6554}, {"x": 4.1379, "y": 6.3108}, {"x": 6.2069, "y": 4.9662}, {"x": 8.2759, "y": 3.6216}, {"x": 10.3448, "y": 2.277}, {"x": 12.4138, "y": 1.0}, {"x": 14.4828, "y": 1.0}, {"x": 16.5517, "y": 1.0}, {"x": 18.6207, "y": 1.0}, {"x": 20.6897, "y": 1.0}, {"x": 22.7586, "y": 1.0}, {"x": 24.8276, "y": 1.0}, {"x": 26.8966, "y": 1.0}, {"x": 28.9655, "y": 1.0}, {"x": 31.0345, "y": 1.0}, {"x": 33.1034, "y": 1.0}, {"x": 35.1724, "y": 1.0}, {"x": 37.2414, "y": 1.0}, {"x": 39.3103, "y": 1.0}, {"x": 41.3793, "y": 1.0}, {"x": 43.4483, "y": 1.0}, {"x": 45.5172, "y": 1.0}, {"x": 47.5862, "y": 1.0}, {"x": 49.6552, "y": 1.0}, {"x": 51.7241, "y": 1.0}, {"x": 53.7931, "y": 1.0}, {"x": 55.8621, "y": 1.0}, {"x": 57.931, "y": 1.0}, {"x": 60.0, "y": 1.0}], "M_burnout": [{"x": 0.0, "y": 1.0}, {"x": 0.05, "y": 1.2014}, {"x": 0.1, "y": 1.4029}, {"x": 0.15, "y": 1.6043}, {"x": 0.2, "y": 1.8057}, {"x": 0.25, "y": 2.0072}, {"x": 0.3, "y": 2.2086}, {"x": 0.35, "y": 2.41}, {"x": 0.4, "y": 2.6115}, {"x": 0.45, "y": 2.8129}, {"x": 0.5, "y": 3.0144}, {"x": 0.55, "y": 3.2158}, {"x": 0.6, "y": 3.4172}, {"x": 0.65, "y": 3.6187}, {"x": 0.7, "y": 3.8201}, {"x": 0.75, "y": 4.0215}, {"x": 0.8, "y": 4.223}, {"x": 0.85, "y": 4.4244}, {"x": 0.9, "y": 4.6258}, {"x": 0.95, "y": 4.8273}, {"x": 1.0, "y": 5.0287}], "M_program": [{"x": "232", "y": 0.9066}, {"x": "538", "y": 0.7081}, {"x": "223a7", "y": 1.0738}, {"x": "223f", "y": 1.1184}, {"x": "default", "y": 0.9524}], "M_purpose": [{"x": "NC@age=0m", "y": 1.0}, {"x": "NC@age=25m", "y": 1.0}, {"x": "NC@age=32m", "y": 1.5227}, {"x": "NC@age=39m", "y": 2.0454}, {"x": "NC@age=47m", "y": 1.5227}, {"x": "NC@age=54m", "y": 1.0}, {"x": "NC@age=90m", "y": 1.0}, {"x": "NC@age=120m", "y": 1.0}, {"x": "RP/OTHER", "y": 1.0}]}, "monthly": [{"period": "201812", "n": 2764, "actual_smm": 0.0036179, "pred_smm": 0.0036503, "actual_cpr": 4.2562, "pred_cpr": 4.2935}, {"period": "201901", "n": 2760, "actual_smm": 0.0028986, "pred_smm": 0.0037897, "actual_cpr": 3.4233, "pred_cpr": 4.4541}, {"period": "201902", "n": 2767, "actual_smm": 0.0046982, "pred_smm": 0.0038054, "actual_cpr": 5.4944, "pred_cpr": 4.4722}, {"period": "201903", "n": 2765, "actual_smm": 0.00217, "pred_smm": 0.0045449, "actual_cpr": 2.5731, "pred_cpr": 5.3196}, {"period": "201904", "n": 2780, "actual_smm": 0.0035971, "pred_smm": 0.0048975, "actual_cpr": 4.2322, "pred_cpr": 5.7213}, {"period": "201905", "n": 2785, "actual_smm": 0.0035907, "pred_smm": 0.006358, "actual_cpr": 4.2247, "pred_cpr": 7.3683}, {"period": "201906", "n": 2792, "actual_smm": 0.0050143, "pred_smm": 0.0067151, "actual_cpr": 5.854, "pred_cpr": 7.767}, {"period": "201907", "n": 2794, "actual_smm": 0.0042949, "pred_smm": 0.0074669, "actual_cpr": 5.0339, "pred_cpr": 8.6013}, {"period": "201908", "n": 2797, "actual_smm": 0.0039328, "pred_smm": 0.0093727, "actual_cpr": 4.6186, "pred_cpr": 10.6851}, {"period": "201909", "n": 2805, "actual_smm": 0.0046346, "pred_smm": 0.008918, "actual_cpr": 5.4219, "pred_cpr": 10.192}, {"period": "201910", "n": 2817, "actual_smm": 0.0049698, "pred_smm": 0.0093527, "actual_cpr": 5.8034, "pred_cpr": 10.6636}, {"period": "201911", "n": 2821, "actual_smm": 0.0049628, "pred_smm": 0.0086876, "actual_cpr": 5.7954, "pred_cpr": 9.9412}, {"period": "201912", "n": 2831, "actual_smm": 0.0084776, "pred_smm": 0.0081687, "actual_cpr": 9.7119, "pred_cpr": 9.3738}, {"period": "202001", "n": 2823, "actual_smm": 0.0063762, "pred_smm": 0.0106183, "actual_cpr": 7.3887, "pred_cpr": 12.0236}, {"period": "202002", "n": 2824, "actual_smm": 0.0141643, "pred_smm": 0.0122829, "actual_cpr": 15.7336, "pred_cpr": 13.7834}, {"period": "202003", "n": 2812, "actual_smm": 0.0092461, "pred_smm": 0.012747, "actual_cpr": 10.5481, "pred_cpr": 14.2683}, {"period": "202004", "n": 2822, "actual_smm": 0.0106308, "pred_smm": 0.0143123, "actual_cpr": 12.0368, "pred_cpr": 15.8853}, {"period": "202005", "n": 2845, "actual_smm": 0.0115993, "pred_smm": 0.0151082, "actual_cpr": 13.0646, "pred_cpr": 16.6966}, {"period": "202006", "n": 2864, "actual_smm": 0.0181564, "pred_smm": 0.0157946, "actual_cpr": 19.7384, "pred_cpr": 17.3907}, {"period": "202007", "n": 2864, "actual_smm": 0.0181564, "pred_smm": 0.0177193, "actual_cpr": 19.7384, "pred_cpr": 19.3085}, {"period": "202008", "n": 2864, "actual_smm": 0.0160615, "pred_smm": 0.0184539, "actual_cpr": 17.6591, "pred_cpr": 20.0298}, {"period": "202009", "n": 2865, "actual_smm": 0.0184991, "pred_smm": 0.0188525, "actual_cpr": 20.074, "pred_cpr": 20.4186}, {"period": "202010", "n": 2857, "actual_smm": 0.0248512, "pred_smm": 0.0173323, "actual_cpr": 26.0649, "pred_cpr": 18.9262}, {"period": "202011", "n": 2834, "actual_smm": 0.0271701, "pred_smm": 0.0181166, "actual_cpr": 28.1473, "pred_cpr": 19.6994}, {"period": "202012", "n": 2819, "actual_smm": 0.0283789, "pred_smm": 0.0187127, "actual_cpr": 29.2114, "pred_cpr": 20.2824}, {"period": "202101", "n": 2809, "actual_smm": 0.0238519, "pred_smm": 0.0183031, "actual_cpr": 25.1506, "pred_cpr": 19.8822}, {"period": "202102", "n": 2795, "actual_smm": 0.0239714, "pred_smm": 0.0168252, "actual_cpr": 25.2604, "pred_cpr": 18.4228}, {"period": "202103", "n": 2787, "actual_smm": 0.0208109, "pred_smm": 0.0151391, "actual_cpr": 22.304, "pred_cpr": 16.728}, {"period": "202104", "n": 2779, "actual_smm": 0.0241094, "pred_smm": 0.0159549, "actual_cpr": 25.3871, "pred_cpr": 17.552}, {"period": "202105", "n": 2774, "actual_smm": 0.019106, "pred_smm": 0.0171292, "actual_cpr": 20.665, "pred_cpr": 18.7249}, {"period": "202106", "n": 2763, "actual_smm": 0.0213536, "pred_smm": 0.0181061, "actual_cpr": 22.8191, "pred_cpr": 19.6891}, {"period": "202107", "n": 2744, "actual_smm": 0.0127551, "pred_smm": 0.0193969, "actual_cpr": 14.2767, "pred_cpr": 20.9469}, {"period": "202108", "n": 2742, "actual_smm": 0.0149526, "pred_smm": 0.0187039, "actual_cpr": 16.5386, "pred_cpr": 20.2739}, {"period": "202109", "n": 2744, "actual_smm": 0.0204082, "pred_smm": 0.0181955, "actual_cpr": 21.9196, "pred_cpr": 19.7767}, {"period": "202110", "n": 2739, "actual_smm": 0.0200803, "pred_smm": 0.017954, "actual_cpr": 21.6055, "pred_cpr": 19.5396}, {"period": "202111", "n": 2740, "actual_smm": 0.0175182, "pred_smm": 0.0178209, "actual_cpr": 19.1102, "pred_cpr": 19.4087}, {"period": "202112", "n": 2738, "actual_smm": 0.0262966, "pred_smm": 0.0171891, "actual_cpr": 27.3693, "pred_cpr": 18.7844}, {"period": "202201", "n": 2700, "actual_smm": 0.0111111, "pred_smm": 0.0153185, "actual_cpr": 12.548, "pred_cpr": 16.9099}, {"period": "202202", "n": 2717, "actual_smm": 0.0161943, "pred_smm": 0.0135286, "actual_cpr": 17.7924, "pred_cpr": 15.0792}, {"period": "202203", "n": 2710, "actual_smm": 0.0099631, "pred_smm": 0.0103583, "actual_cpr": 11.3219, "pred_cpr": 11.7457}, {"period": "202204", "n": 2718, "actual_smm": 0.0099338, "pred_smm": 0.0071973, "actual_cpr": 11.2903, "pred_cpr": 8.303}, {"period": "202205", "n": 2732, "actual_smm": 0.0120791, "pred_smm": 0.0071385, "actual_cpr": 13.5696, "pred_cpr": 8.2377}, {"period": "202206", "n": 2732, "actual_smm": 0.0087848, "pred_smm": 0.006022, "actual_cpr": 10.047, "pred_cpr": 6.9918}, {"period": "202207", "n": 2735, "actual_smm": 0.0040219, "pred_smm": 0.0070336, "actual_cpr": 4.721, "pred_cpr": 8.1214}, {"period": "202208", "n": 2739, "actual_smm": 0.007667, "pred_smm": 0.0052698, "actual_cpr": 8.8222, "pred_cpr": 6.1437}, {"period": "202209", "n": 2731, "actual_smm": 0.0080557, "pred_smm": 0.0036545, "actual_cpr": 9.2498, "pred_cpr": 4.2983}, {"period": "202210", "n": 2727, "actual_smm": 0.0044004, "pred_smm": 0.0029904, "actual_cpr": 5.1546, "pred_cpr": 3.5301}, {"period": "202211", "n": 2747, "actual_smm": 0.0036403, "pred_smm": 0.0037768, "actual_cpr": 4.282, "pred_cpr": 4.4392}, {"period": "202212", "n": 2753, "actual_smm": 0.0047221, "pred_smm": 0.0035346, "actual_cpr": 5.5217, "pred_cpr": 4.16}, {"period": "202301", "n": 2754, "actual_smm": 0.0036311, "pred_smm": 0.0042865, "actual_cpr": 4.2713, "pred_cpr": 5.0243}, {"period": "202302", "n": 2756, "actual_smm": 0.0010885, "pred_smm": 0.0037731, "actual_cpr": 1.2984, "pred_cpr": 4.435}, {"period": "202303", "n": 2771, "actual_smm": 0.0043306, "pred_smm": 0.0038213, "actual_cpr": 5.0747, "pred_cpr": 4.4904}, {"period": "202304", "n": 2773, "actual_smm": 0.0007212, "pred_smm": 0.0036299, "actual_cpr": 0.8621, "pred_cpr": 4.2699}, {"period": "202305", "n": 2780, "actual_smm": 0.0028777, "pred_smm": 0.0031946, "actual_cpr": 3.3991, "pred_cpr": 3.7669}, {"period": "202306", "n": 2785, "actual_smm": 0.0043088, "pred_smm": 0.003086, "actual_cpr": 5.0498, "pred_cpr": 3.641}, {"period": "202307", "n": 2782, "actual_smm": 0.0025162, "pred_smm": 0.0029146, "actual_cpr": 2.978, "pred_cpr": 3.442}, {"period": "202308", "n": 2788, "actual_smm": 0.0025108, "pred_smm": 0.0027096, "actual_cpr": 2.9717, "pred_cpr": 3.2035}, {"period": "202309", "n": 2796, "actual_smm": 0.0032189, "pred_smm": 0.0022515, "actual_cpr": 3.795, "pred_cpr": 2.6686}, {"period": "202310", "n": 2808, "actual_smm": 0.0024929, "pred_smm": 0.0019554, "actual_cpr": 2.9508, "pred_cpr": 2.3214}, {"period": "202311", "n": 2812, "actual_smm": 0.0042674, "pred_smm": 0.0024496, "actual_cpr": 5.0024, "pred_cpr": 2.9002}, {"period": "202312", "n": 2810, "actual_smm": 0.0014235, "pred_smm": 0.0031761, "actual_cpr": 1.6949, "pred_cpr": 3.7455}, {"period": "202401", "n": 2811, "actual_smm": 0.0007115, "pred_smm": 0.0031718, "actual_cpr": 0.8505, "pred_cpr": 3.7405}, {"period": "202402", "n": 2815, "actual_smm": 0.0010657, "pred_smm": 0.0028944, "actual_cpr": 1.2714, "pred_cpr": 3.4186}, {"period": "202403", "n": 2822, "actual_smm": 0.0021262, "pred_smm": 0.0029549, "actual_cpr": 2.5218, "pred_cpr": 3.4888}, {"period": "202404", "n": 2824, "actual_smm": 0.0017705, "pred_smm": 0.0024281, "actual_cpr": 2.1041, "pred_cpr": 2.8751}, {"period": "202405", "n": 2824, "actual_smm": 0.0021246, "pred_smm": 0.002654, "actual_cpr": 2.52, "pred_cpr": 3.1388}, {"period": "202406", "n": 2832, "actual_smm": 0.0014124, "pred_smm": 0.0028056, "actual_cpr": 1.6818, "pred_cpr": 3.3152}, {"period": "202407", "n": 2838, "actual_smm": 0.0031712, "pred_smm": 0.0032509, "actual_cpr": 3.7398, "pred_cpr": 3.8321}, {"period": "202408", "n": 2840, "actual_smm": 0.0021127, "pred_smm": 0.0034454, "actual_cpr": 2.506, "pred_cpr": 4.057}, {"period": "202409", "n": 2851, "actual_smm": 0.0024553, "pred_smm": 0.003842, "actual_cpr": 2.9069, "pred_cpr": 4.5143}, {"period": "202410", "n": 2856, "actual_smm": 0.0017507, "pred_smm": 0.0030702, "actual_cpr": 2.0807, "pred_cpr": 3.6227}, {"period": "202411", "n": 2860, "actual_smm": 0.0020979, "pred_smm": 0.0033362, "actual_cpr": 2.4886, "pred_cpr": 3.9308}, {"period": "202412", "n": 2866, "actual_smm": 0.0027913, "pred_smm": 0.0028615, "actual_cpr": 3.2987, "pred_cpr": 3.3803}, {"period": "202501", "n": 2872, "actual_smm": 0.0020891, "pred_smm": 0.0028873, "actual_cpr": 2.4784, "pred_cpr": 3.4102}, {"period": "202502", "n": 2873, "actual_smm": 0.0020884, "pred_smm": 0.0032643, "actual_cpr": 2.4775, "pred_cpr": 3.8476}, {"period": "202503", "n": 2883, "actual_smm": 0.002428, "pred_smm": 0.0031759, "actual_cpr": 2.875, "pred_cpr": 3.7452}, {"period": "202504", "n": 2895, "actual_smm": 0.0027634, "pred_smm": 0.0029953, "actual_cpr": 3.2661, "pred_cpr": 3.5358}, {"period": "202505", "n": 2896, "actual_smm": 0.0027624, "pred_smm": 0.0027443, "actual_cpr": 3.265, "pred_cpr": 3.2439}, {"period": "202506", "n": 2904, "actual_smm": 0.0013774, "pred_smm": 0.0029653, "actual_cpr": 1.6404, "pred_cpr": 3.5009}, {"period": "202507", "n": 2920, "actual_smm": 0.0034247, "pred_smm": 0.0028392, "actual_cpr": 4.0331, "pred_cpr": 3.3543}, {"period": "202508", "n": 2922, "actual_smm": 0.0027379, "pred_smm": 0.0030667, "actual_cpr": 3.2364, "pred_cpr": 3.6186}, {"period": "202509", "n": 2935, "actual_smm": 0.0013629, "pred_smm": 0.003301, "actual_cpr": 1.6232, "pred_cpr": 3.8901}, {"period": "202510", "n": 2943, "actual_smm": 0.0037377, "pred_smm": 0.0034485, "actual_cpr": 4.3942, "pred_cpr": 4.0606}, {"period": "202511", "n": 2950, "actual_smm": 0.0010169, "pred_smm": 0.0036736, "actual_cpr": 1.2135, "pred_cpr": 4.3203}, {"period": "202512", "n": 2964, "actual_smm": 0.0047233, "pred_smm": 0.0036462, "actual_cpr": 5.5231, "pred_cpr": 4.2888}, {"period": "202601", "n": 2974, "actual_smm": 0.0020175, "pred_smm": 0.0039985, "actual_cpr": 2.3943, "pred_cpr": 4.6941}, {"period": "202602", "n": 2975, "actual_smm": 0.0040336, "pred_smm": 0.0044383, "actual_cpr": 4.7344, "pred_cpr": 5.1979}], "yearly": [{"year": 2018, "n": 2764, "actual_smm": 0.0036179, "pred_smm": 0.0036503, "actual_cpr": 4.2562, "pred_cpr": 4.2935}, {"year": 2019, "n": 33514, "actual_smm": 0.0044459, "pred_smm": 0.0068538, "actual_cpr": 5.2065, "pred_cpr": 7.9215}, {"year": 2020, "n": 34093, "actual_smm": 0.0169536, "pred_smm": 0.015849, "actual_cpr": 18.5506, "pred_cpr": 17.4455}, {"year": 2021, "n": 33154, "actual_smm": 0.02045, "pred_smm": 0.0175552, "actual_cpr": 21.9597, "pred_cpr": 19.1466}, {"year": 2022, "n": 32741, "actual_smm": 0.0083687, "pred_smm": 0.0071353, "actual_cpr": 9.5929, "pred_cpr": 8.2342}, {"year": 2023, "n": 33415, "actual_smm": 0.0027832, "pred_smm": 0.0031003, "actual_cpr": 3.2892, "pred_cpr": 3.6575}, {"year": 2024, "n": 34039, "actual_smm": 0.0019683, "pred_smm": 0.0030605, "actual_cpr": 2.3366, "pred_cpr": 3.6114}, {"year": 2025, "n": 34957, "actual_smm": 0.002546, "pred_smm": 0.0031693, "actual_cpr": 3.0128, "pred_cpr": 3.7376}, {"year": 2026, "n": 5949, "actual_smm": 0.0030257, "pred_smm": 0.0042185, "actual_cpr": 3.571, "pred_cpr": 4.9463}], "scurve": [{"ri_bucket": 0, "n": 3308, "ri_mid": -327.32, "actual_smm": 0.0006046, "pred_smm": 0.0011423, "actual_cpr": 0.7231, "pred_cpr": 1.3621}, {"ri_bucket": 1, "n": 35878, "ri_mid": -240.58, "actual_smm": 0.0016723, "pred_smm": 0.0014704, "actual_cpr": 1.9884, "pred_cpr": 1.7503}, {"ri_bucket": 2, "n": 48464, "ri_mid": -150.84, "actual_smm": 0.0030125, "pred_smm": 0.0026564, "actual_cpr": 3.5558, "pred_cpr": 3.1415}, {"ri_bucket": 3, "n": 17770, "ri_mid": -75.86, "actual_smm": 0.004108, "pred_smm": 0.0035542, "actual_cpr": 4.8198, "pred_cpr": 4.1827}, {"ri_bucket": 4, "n": 14322, "ri_mid": -25.0, "actual_smm": 0.0045385, "pred_smm": 0.0041084, "actual_cpr": 5.3123, "pred_cpr": 4.8202}, {"ri_bucket": 5, "n": 16257, "ri_mid": 27.05, "actual_smm": 0.0047364, "pred_smm": 0.0049802, "actual_cpr": 5.538, "pred_cpr": 5.8152}, {"ri_bucket": 6, "n": 22744, "ri_mid": 76.3, "actual_smm": 0.0046606, "pred_smm": 0.006892, "actual_cpr": 5.4515, "pred_cpr": 7.964}, {"ri_bucket": 7, "n": 26097, "ri_mid": 125.84, "actual_smm": 0.00866, "pred_smm": 0.010741, "actual_cpr": 9.911, "pred_cpr": 12.1544}, {"ri_bucket": 8, "n": 24544, "ri_mid": 174.8, "actual_smm": 0.0178455, "pred_smm": 0.0165209, "actual_cpr": 19.4329, "pred_cpr": 18.1193}, {"ri_bucket": 9, "n": 24451, "ri_mid": 238.42, "actual_smm": 0.0246207, "pred_smm": 0.0216308, "actual_cpr": 25.8549, "pred_cpr": 23.081}, {"ri_bucket": 10, "n": 9306, "ri_mid": 379.57, "actual_smm": 0.0155813, "pred_smm": 0.0170074, "actual_cpr": 17.1757, "pred_cpr": 18.604}, {"ri_bucket": 11, "n": 1485, "ri_mid": 562.35, "actual_smm": 0.0107744, "pred_smm": 0.0144596, "actual_cpr": 12.19, "pred_cpr": 16.036}], "calibration": [{"decile": 0, "n": 24463, "pred_smm": 0.0006381, "actual_smm": 0.0015534, "pred_cpr": 0.7631, "actual_cpr": 1.8482}, {"decile": 1, "n": 24463, "pred_smm": 0.0011563, "actual_smm": 0.0012263, "pred_cpr": 1.3788, "actual_cpr": 1.4617}, {"decile": 2, "n": 24462, "pred_smm": 0.0016798, "actual_smm": 0.0021257, "pred_cpr": 1.9973, "actual_cpr": 2.5213}, {"decile": 3, "n": 24463, "pred_smm": 0.0024225, "actual_smm": 0.0028615, "pred_cpr": 2.8686, "actual_cpr": 3.3802}, {"decile": 4, "n": 24462, "pred_smm": 0.0034691, "actual_smm": 0.0035565, "pred_cpr": 4.0844, "actual_cpr": 4.1853}, {"decile": 5, "n": 24463, "pred_smm": 0.0049381, "actual_smm": 0.0041287, "pred_cpr": 5.7674, "actual_cpr": 4.8435}, {"decile": 6, "n": 24462, "pred_smm": 0.0073812, "actual_smm": 0.0064999, "pred_cpr": 8.5066, "actual_cpr": 7.527}, {"decile": 7, "n": 24463, "pred_smm": 0.0111099, "actual_smm": 0.0084618, "pred_cpr": 12.5467, "actual_cpr": 9.6946}, {"decile": 8, "n": 24462, "pred_smm": 0.01641, "actual_smm": 0.0161066, "pred_cpr": 18.0084, "actual_cpr": 17.7044}, {"decile": 9, "n": 24463, "pred_smm": 0.030076, "actual_smm": 0.0334383, "pred_cpr": 30.681, "actual_cpr": 33.5102}], "fha_cuts": [{"key": "220", "n": 461, "actual_smm": 0.0086768, "pred_smm": 0.010019, "actual_cpr": 9.9294, "pred_cpr": 11.3819}, {"key": "221d4", "n": 41688, "actual_smm": 0.0095951, "pred_smm": 0.0086335, "actual_cpr": 10.9255, "pred_cpr": 9.8822}, {"key": "223a7", "n": 26866, "actual_smm": 0.0082632, "pred_smm": 0.0092962, "actual_cpr": 9.4774, "pred_cpr": 10.6024}, {"key": "223f", "n": 95548, "actual_smm": 0.0074727, "pred_smm": 0.007768, "actual_cpr": 8.6077, "pred_cpr": 8.9335}, {"key": "232", "n": 59528, "actual_smm": 0.0081642, "pred_smm": 0.0076891, "actual_cpr": 9.3689, "pred_cpr": 8.8465}, {"key": "241", "n": 1885, "actual_smm": 0.0111406, "pred_smm": 0.0123044, "actual_cpr": 12.5792, "pred_cpr": 13.806}, {"key": "538", "n": 15620, "actual_smm": 0.0050576, "pred_smm": 0.0045134, "actual_cpr": 5.9031, "pred_cpr": 5.2836}, {"key": "OTHER", "n": 3030, "actual_smm": 0.009901, "pred_smm": 0.0104006, "actual_cpr": 11.2551, "pred_cpr": 11.7909}], "lp_cuts": [{"key": "538", "n": 15620, "actual_smm": 0.0050576, "pred_smm": 0.0045134, "actual_cpr": 5.9031, "pred_cpr": 5.2836}, {"key": "NC", "n": 28794, "actual_smm": 0.0105578, "pred_smm": 0.0098491, "actual_cpr": 11.9589, "pred_cpr": 11.1993}, {"key": "OTHER", "n": 3030, "actual_smm": 0.009901, "pred_smm": 0.0104006, "actual_cpr": 11.2551, "pred_cpr": 11.7909}, {"key": "RP", "n": 197182, "actual_smm": 0.0078253, "pred_smm": 0.0078801, "actual_cpr": 8.9965, "pred_cpr": 9.0569}], "vintage_cuts": [{"key": "1989.0", "n": 35, "actual_smm": 0.0285714, "pred_smm": 0.0124947, "actual_cpr": 29.3796, "pred_cpr": 14.005}, {"key": "1994.0", "n": 28, "actual_smm": 0.0357143, "pred_smm": 0.0075788, "actual_cpr": 35.3648, "pred_cpr": 8.7249}, {"key": "1995.0", "n": 149, "actual_smm": 0.0067114, "pred_smm": 0.018298, "actual_cpr": 7.763, "pred_cpr": 19.8772}, {"key": "1996.0", "n": 46, "actual_smm": 0.0434783, "pred_smm": 0.0275359, "actual_cpr": 41.3405, "pred_cpr": 28.4709}, {"key": "1998.0", "n": 301, "actual_smm": 0.013289, "pred_smm": 0.0122861, "actual_cpr": 14.8314, "pred_cpr": 13.7867}, {"key": "1999.0", "n": 174, "actual_smm": 0.0172414, "pred_smm": 0.0180795, "actual_cpr": 18.8362, "pred_cpr": 19.6629}, {"key": "2000.0", "n": 389, "actual_smm": 0.0025707, "pred_smm": 0.0177381, "actual_cpr": 3.0416, "pred_cpr": 19.3271}, {"key": "2001.0", "n": 703, "actual_smm": 0.0099573, "pred_smm": 0.0134141, "actual_cpr": 11.3157, "pred_cpr": 14.9609}, {"key": "2002.0", "n": 1398, "actual_smm": 0.0114449, "pred_smm": 0.0146859, "actual_cpr": 12.9015, "pred_cpr": 16.2671}, {"key": "2003.0", "n": 4664, "actual_smm": 0.0055746, "pred_smm": 0.0103252, "actual_cpr": 6.4882, "pred_cpr": 11.7103}, {"key": "2004.0", "n": 2592, "actual_smm": 0.0131173, "pred_smm": 0.0106602, "actual_cpr": 14.6533, "pred_cpr": 12.0683}, {"key": "2005.0", "n": 3204, "actual_smm": 0.0087391, "pred_smm": 0.011262, "actual_cpr": 9.9972, "pred_cpr": 12.7079}, {"key": "2006.0", "n": 5838, "actual_smm": 0.0054813, "pred_smm": 0.0089521, "actual_cpr": 6.3829, "pred_cpr": 10.229}, {"key": "2007.0", "n": 4470, "actual_smm": 0.0085011, "pred_smm": 0.0088171, "actual_cpr": 9.7376, "pred_cpr": 10.0822}, {"key": "2008.0", "n": 3372, "actual_smm": 0.0041518, "pred_smm": 0.0088365, "actual_cpr": 4.87, "pred_cpr": 10.1033}, {"key": "2009.0", "n": 4534, "actual_smm": 0.0068372, "pred_smm": 0.0113508, "actual_cpr": 7.9031, "pred_cpr": 12.802}, {"key": "2010.0", "n": 6738, "actual_smm": 0.0121698, "pred_smm": 0.0122334, "actual_cpr": 13.6648, "pred_cpr": 13.7315}, {"key": "2011.0", "n": 11040, "actual_smm": 0.0121377, "pred_smm": 0.0125848, "actual_cpr": 13.6312, "pred_cpr": 14.0991}, {"key": "2012.0", "n": 22241, "actual_smm": 0.0085877, "pred_smm": 0.007931, "actual_cpr": 9.8322, "pred_cpr": 9.1128}, {"key": "2013.0", "n": 22969, "actual_smm": 0.0114067, "pred_smm": 0.010031, "actual_cpr": 12.8611, "pred_cpr": 11.3948}, {"key": "2014.0", "n": 17409, "actual_smm": 0.0112011, "pred_smm": 0.0118445, "actual_cpr": 12.6434, "pred_cpr": 13.323}, {"key": "2015.0", "n": 15351, "actual_smm": 0.0099668, "pred_smm": 0.0097186, "actual_cpr": 11.3258, "pred_cpr": 11.0587}, {"key": "2016.0", "n": 15206, "actual_smm": 0.011114, "pred_smm": 0.0086186, "actual_cpr": 12.5511, "pred_cpr": 9.8659}, {"key": "2017.0", "n": 18637, "actual_smm": 0.0081022, "pred_smm": 0.0079957, "actual_cpr": 9.3008, "pred_cpr": 9.184}, {"key": "2018.0", "n": 14480, "actual_smm": 0.0123619, "pred_smm": 0.009222, "actual_cpr": 13.8661, "pred_cpr": 10.522}, {"key": "2019.0", "n": 12337, "actual_smm": 0.0077815, "pred_smm": 0.0069426, "actual_cpr": 8.9483, "pred_cpr": 8.0203}, {"key": "2020.0", "n": 21652, "actual_smm": 0.0025864, "pred_smm": 0.0027694, "actual_cpr": 3.0599, "pred_cpr": 3.2732}, {"key": "2021.0", "n": 19144, "actual_smm": 0.0010969, "pred_smm": 0.0014558, "actual_cpr": 1.3084, "pred_cpr": 1.7331}, {"key": "2022.0", "n": 9747, "actual_smm": 0.0015389, "pred_smm": 0.0011022, "actual_cpr": 1.8312, "pred_cpr": 1.3147}, {"key": "2023.0", "n": 2892, "actual_smm": 0.0, "pred_smm": 0.0042786, "actual_cpr": 0.0, "pred_cpr": 5.0153}, {"key": "2024.0", "n": 1637, "actual_smm": 0.0030544, "pred_smm": 0.0034854, "actual_cpr": 3.6043, "pred_cpr": 4.1032}, {"key": "2025.0", "n": 1032, "actual_smm": 0.002907, "pred_smm": 0.0048064, "actual_cpr": 3.4331, "pred_cpr": 5.6176}, {"key": "2026.0", "n": 11, "actual_smm": 0.0, "pred_smm": 0.003617, "actual_cpr": 0.0, "pred_cpr": 4.2551}], "age_cuts": [{"key": "0-12m", "n": 16499, "actual_smm": 0.0036972, "pred_smm": 0.0041726, "actual_cpr": 4.3475, "pred_cpr": 4.8938}, {"key": "12-36m", "n": 38460, "actual_smm": 0.0067343, "pred_smm": 0.0049782, "actual_cpr": 7.7884, "pred_cpr": 5.813}, {"key": "36-60m", "n": 43414, "actual_smm": 0.0071175, "pred_smm": 0.0070194, "actual_cpr": 8.2145, "pred_cpr": 8.1056}, {"key": "60-120m", "n": 86123, "actual_smm": 0.0105547, "pred_smm": 0.0104888, "actual_cpr": 11.9556, "pred_cpr": 11.8853}, {"key": "120-180m", "n": 39826, "actual_smm": 0.0069804, "pred_smm": 0.0068816, "actual_cpr": 8.0622, "pred_cpr": 7.9524}, {"key": "180m+", "n": 20304, "actual_smm": 0.0068952, "pred_smm": 0.0097018, "actual_cpr": 7.9675, "pred_cpr": 11.0406}], "mtm_cuts": [{"key": "0-12m", "n": 245, "actual_smm": 0.0571429, "pred_smm": 0.0274673, "actual_cpr": 50.6428, "pred_cpr": 28.4103}, {"key": "12-24m", "n": 201, "actual_smm": 0.0199005, "pred_smm": 0.0080078, "actual_cpr": 21.4327, "pred_cpr": 9.1972}, {"key": "24-36m", "n": 282, "actual_smm": 0.0070922, "pred_smm": 0.0084509, "actual_cpr": 8.1864, "pred_cpr": 9.6827}, {"key": "36-60m", "n": 662, "actual_smm": 0.0090634, "pred_smm": 0.0101027, "actual_cpr": 10.35, "pred_cpr": 11.4718}, {"key": "60-120m", "n": 5122, "actual_smm": 0.0062476, "pred_smm": 0.0096054, "actual_cpr": 7.2448, "pred_cpr": 10.9366}, {"key": "120m+", "n": 238114, "actual_smm": 0.007971, "pred_smm": 0.0078652, "actual_cpr": 9.1568, "pred_cpr": 9.0405}], "size_cuts": [{"key": "<2M", "n": 58350, "actual_smm": 0.0059983, "pred_smm": 0.0064937, "actual_cpr": 6.9652, "pred_cpr": 7.52}, {"key": "2-5M", "n": 61629, "actual_smm": 0.0077723, "pred_smm": 0.0081854, "actual_cpr": 8.9382, "pred_cpr": 9.3921}, {"key": "5-10M", "n": 53942, "actual_smm": 0.0086945, "pred_smm": 0.0092544, "actual_cpr": 9.9487, "pred_cpr": 10.5571}, {"key": "10-25M", "n": 52979, "actual_smm": 0.0090413, "pred_smm": 0.0085088, "actual_cpr": 10.326, "pred_cpr": 9.746}, {"key": "25-50M", "n": 15387, "actual_smm": 0.0103334, "pred_smm": 0.0059657, "actual_cpr": 11.7191, "pred_cpr": 6.9285}, {"key": "50M+", "n": 2339, "actual_smm": 0.0085507, "pred_smm": 0.0061052, "actual_cpr": 9.7917, "pred_cpr": 7.0852}], "post_lockout_cuts": [{"key": "in-lockout/none", "n": 178473, "actual_smm": 0.0070879, "pred_smm": 0.0066621, "actual_cpr": 8.1816, "pred_cpr": 7.708}, {"key": "0-6m", "n": 815, "actual_smm": 0.0147239, "pred_smm": 0.009254, "actual_cpr": 16.3058, "pred_cpr": 10.5566}, {"key": "6-12m", "n": 847, "actual_smm": 0.0035419, "pred_smm": 0.0044042, "actual_cpr": 4.1685, "pred_cpr": 5.1589}, {"key": "12-18m", "n": 898, "actual_smm": 0.0055679, "pred_smm": 0.0044882, "actual_cpr": 6.4807, "pred_cpr": 5.2548}, {"key": "18-24m", "n": 63593, "actual_smm": 0.0105515, "pred_smm": 0.0115598, "actual_cpr": 11.9522, "pred_cpr": 13.0229}], "attribution_loans": [{"label": "232_RP", "archetype_id": "232_RP", "loan_id": "3617X46E8_000000007322294", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer_key": "KEYBANK NATIONAL ASSOCIATION", "logit_z": -1.0001, "pred_smm": 0.0017339, "pred_cpr": 2.0609, "actual_prepay": 0, "contributions": [{"feature": "M_age", "multiplier": 1.3407, "log_multiplier": 0.2932, "contribution_logit": 0.2932}, {"feature": "M_rate", "multiplier": 0.2392, "log_multiplier": -1.4307, "contribution_logit": -1.4307}, {"feature": "M_size", "multiplier": 1.2655, "log_multiplier": 0.2355, "contribution_logit": 0.2355}, {"feature": "M_program", "multiplier": 0.9066, "log_multiplier": -0.0981, "contribution_logit": -0.0981}, {"feature": "M_purpose", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_lockout", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_maturity", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_burnout", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}]}, {"label": "232_NC", "archetype_id": "232_NC", "loan_id": "3617M15B3_000000011343080", "period": "202602", "fha_category": "232", "loan_purpose": "NC", "issuer_key": "BERKADIA COMMERCIAL MORTGAGE, ", "logit_z": -0.6775, "pred_smm": 0.0023939, "pred_cpr": 2.8351, "actual_prepay": 0, "contributions": [{"feature": "M_age", "multiplier": 0.937, "log_multiplier": -0.0651, "contribution_logit": -0.0651}, {"feature": "M_rate", "multiplier": 0.3132, "log_multiplier": -1.161, "contribution_logit": -1.161}, {"feature": "M_size", "multiplier": 1.2396, "log_multiplier": 0.2148, "contribution_logit": 0.2148}, {"feature": "M_program", "multiplier": 0.9066, "log_multiplier": -0.0981, "contribution_logit": -0.0981}, {"feature": "M_purpose", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_lockout", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_maturity", "multiplier": 1.0, "log_multiplier": 0.0, "contribution_logit": 0.0}, {"feature": "M_burnout", "multiplier": 1.5402, "log_multiplier": 0.4319, "contribution_logit": 0.4319}]}], "sancap_benchmarks": [{"scenario": "ATM, avg penalty (5pp)", "sancap_cpr": 20, "v7_pred_cpr": 9.78, "divergence_pp": 10.22, "flag": "REVIEW"}, {"scenario": "-50bp, avg penalty", "sancap_cpr": 6, "v7_pred_cpr": 7.0, "divergence_pp": 1.0, "flag": "ok"}, {"scenario": "+50bp, avg penalty", "sancap_cpr": 35, "v7_pred_cpr": 13.39, "divergence_pp": 21.61, "flag": "REVIEW"}, {"scenario": "+100bp, avg penalty", "sancap_cpr": 45, "v7_pred_cpr": 17.61, "divergence_pp": 27.39, "flag": "REVIEW"}, {"scenario": "+100bp, 7% penalty", "sancap_cpr": 30, "v7_pred_cpr": 17.61, "divergence_pp": 12.39, "flag": "REVIEW"}, {"scenario": "+100bp, 9% penalty", "sancap_cpr": 18, "v7_pred_cpr": 17.61, "divergence_pp": 0.39, "flag": "ok"}, {"scenario": "$5M @ +50bp", "sancap_cpr": 20, "v7_pred_cpr": 13.39, "divergence_pp": 6.61, "flag": "ok"}, {"scenario": "$15M @ +50bp", "sancap_cpr": 40, "v7_pred_cpr": 17.67, "divergence_pp": 22.33, "flag": "REVIEW"}, {"scenario": "NC @ +100bp, age 30m", "sancap_cpr": 70, "v7_pred_cpr": 15.69, "divergence_pp": 54.31, "flag": "REVIEW"}, {"scenario": "Rural-538 @ +100bp", "sancap_cpr": 10, "v7_pred_cpr": 13.39, "divergence_pp": 3.39, "flag": "ok"}, {"scenario": "HC-232 @ +100bp", "sancap_cpr": 30, "v7_pred_cpr": 16.84, "divergence_pp": 13.16, "flag": "REVIEW"}, {"scenario": "msle=2 (post-lockout, ATM)", "sancap_cpr": 40, "v7_pred_cpr": 21.01, "divergence_pp": 18.99, "flag": "REVIEW"}], "comparison_to_v6f": {"available": true, "v6f_test_auc": 0.785432, "v7_test_auc": 0.7787802647657962, "auc_delta": -0.0067, "v6f_log_loss": 0.0423356, "v7_log_loss": 0.042318107742002314, "log_loss_delta": -2e-05, "v6f_n_features": 24, "yearly_compare": [{"year": 2018, "n": 2764, "actual_cpr": 4.2562, "v6f_pred_cpr": 5.8105, "v7_pred_cpr": 4.2935}, {"year": 2019, "n": 33514, "actual_cpr": 5.2065, "v6f_pred_cpr": 9.5625, "v7_pred_cpr": 7.9215}, {"year": 2020, "n": 34093, "actual_cpr": 18.5506, "v6f_pred_cpr": 18.3447, "v7_pred_cpr": 17.4455}, {"year": 2021, "n": 33154, "actual_cpr": 21.9597, "v6f_pred_cpr": 17.2941, "v7_pred_cpr": 19.1466}, {"year": 2022, "n": 32741, "actual_cpr": 9.5929, "v6f_pred_cpr": 6.8873, "v7_pred_cpr": 8.2342}, {"year": 2023, "n": 33415, "actual_cpr": 3.2892, "v6f_pred_cpr": 3.386, "v7_pred_cpr": 3.6575}, {"year": 2024, "n": 34039, "actual_cpr": 2.3366, "v6f_pred_cpr": 3.5988, "v7_pred_cpr": 3.6114}, {"year": 2025, "n": 34957, "actual_cpr": 3.0128, "v6f_pred_cpr": 3.7817, "v7_pred_cpr": 3.7376}, {"year": 2026, "n": 5949, "actual_cpr": 3.571, "v6f_pred_cpr": 4.9653, "v7_pred_cpr": 4.9463}], "calibration_compare": [{"decile": 0, "v6f_pred_cpr": 0.409, "v6f_actual_cpr": 1.6551, "v7_pred_cpr": 0.7631, "v7_actual_cpr": 1.8482}, {"decile": 1, "v6f_pred_cpr": 1.0925, "v6f_actual_cpr": 1.3649, "v7_pred_cpr": 1.3788, "v7_actual_cpr": 1.4617}, {"decile": 2, "v6f_pred_cpr": 2.1088, "v6f_actual_cpr": 2.041, "v7_pred_cpr": 1.9973, "v7_actual_cpr": 2.5213}, {"decile": 3, "v6f_pred_cpr": 3.4288, "v6f_actual_cpr": 3.9963, "v7_pred_cpr": 2.8686, "v7_actual_cpr": 3.3802}, {"decile": 4, "v6f_pred_cpr": 4.9578, "v6f_actual_cpr": 4.091, "v7_pred_cpr": 4.0844, "v7_actual_cpr": 4.1853}, {"decile": 5, "v6f_pred_cpr": 6.811, "v6f_actual_cpr": 5.2644, "v7_pred_cpr": 5.7674, "v7_actual_cpr": 4.8435}, {"decile": 6, "v6f_pred_cpr": 9.1381, "v6f_actual_cpr": 6.7017, "v7_pred_cpr": 8.5066, "v7_actual_cpr": 7.527}, {"decile": 7, "v6f_pred_cpr": 12.3476, "v6f_actual_cpr": 8.3905, "v7_pred_cpr": 12.5467, "v7_actual_cpr": 9.6946}, {"decile": 8, "v6f_pred_cpr": 17.1008, "v6f_actual_cpr": 17.6634, "v7_pred_cpr": 18.0084, "v7_actual_cpr": 17.7044}, {"decile": 9, "v6f_pred_cpr": 28.7965, "v6f_actual_cpr": 34.9798, "v7_pred_cpr": 30.681, "v7_actual_cpr": 33.5102}]}, "sample_loans": [{"loan_id": "000005211308", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "LUMENT REAL ESTATE", "upb_M": 2.4, "age": 50, "mtm": 371, "grf_bps": -205.0, "ppp": 10.0, "net_refi_bps": -342.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.000678, "pred_cpr": 0.81, "actual_prepay": 0, "multipliers": {"M_age": 0.9257, "M_rate": 0.1901, "M_size": 0.7314, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.1873, "M_rate": -4.0261, "M_size": -0.7585, "M_program": 0.2713, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000004722092", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "MIDLAND STATES BAN", "upb_M": 2.6, "age": 150, "mtm": 174, "grf_bps": -214.0, "ppp": 6.0, "net_refi_bps": -302.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.000725, "pred_cpr": 0.87, "actual_prepay": 0, "multipliers": {"M_age": 1.0974, "M_rate": 0.2052, "M_size": 0.7539, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.2307, "M_rate": -3.9308, "M_size": -0.7012, "M_program": -0.2434, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000002343317", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "LUMENT REAL ESTATE", "upb_M": 5.8, "age": 171, "mtm": 310, "grf_bps": -178.0, "ppp": 6.0, "net_refi_bps": -266.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001055, "pred_cpr": 1.26, "actual_prepay": 0, "multipliers": {"M_age": 0.9813, "M_rate": 0.2248, "M_size": 1.119, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.0537, "M_rate": -4.2406, "M_size": 0.3194, "M_program": -0.2786, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000006422108", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "NEWPOINT REAL ESTA", "upb_M": 10.1, "age": 48, "mtm": 373, "grf_bps": -178.0, "ppp": 8.0, "net_refi_bps": -290.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001111, "pred_cpr": 1.32, "actual_prepay": 0, "multipliers": {"M_age": 0.9052, "M_rate": 0.2104, "M_size": 1.3647, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.2884, "M_rate": -4.5151, "M_size": 0.9007, "M_program": -0.2841, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000004722076", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "MIDLAND STATES BAN", "upb_M": 3.2, "age": 170, "mtm": 174, "grf_bps": -236.0, "ppp": 6.0, "net_refi_bps": -324.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.00071, "pred_cpr": 0.85, "actual_prepay": 0, "multipliers": {"M_age": 0.9868, "M_rate": 0.1963, "M_size": 0.8583, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.0328, "M_rate": -4.0116, "M_size": -0.3764, "M_program": -0.2417, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000011522410", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "CAPITAL FUNDING,LL", "upb_M": 19.3, "age": 3, "mtm": 418, "grf_bps": 99.0, "ppp": 10.0, "net_refi_bps": -38.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001443, "pred_cpr": 1.72, "actual_prepay": 0, "multipliers": {"M_age": 0.3192, "M_rate": 0.7462, "M_size": 1.4178, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -3.6599, "M_rate": -0.9384, "M_size": 1.119, "M_program": -0.3144, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000010311095", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "NORTHMARQ FINANCE,", "upb_M": 3.5, "age": 79, "mtm": 354, "grf_bps": -184.0, "ppp": 5.0, "net_refi_bps": -259.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001309, "pred_cpr": 1.56, "actual_prepay": 0, "multipliers": {"M_age": 1.2222, "M_rate": 0.2291, "M_size": 0.8871, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.6191, "M_rate": -4.5461, "M_size": -0.3698, "M_program": 0.3451, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000007111501", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "MERCHANTS CAPITAL ", "upb_M": 9.2, "age": 56, "mtm": 365, "grf_bps": -207.0, "ppp": 6.0, "net_refi_bps": -294.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001435, "pred_cpr": 1.71, "actual_prepay": 0, "multipliers": {"M_age": 0.987, "M_rate": 0.2084, "M_size": 1.3231, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.0417, "M_rate": -5.0147, "M_size": 0.8954, "M_program": 0.3577, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000005411220", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "WELLS FARGO BANK, ", "upb_M": 24.7, "age": 48, "mtm": 373, "grf_bps": -224.0, "ppp": 7.0, "net_refi_bps": -324.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001327, "pred_cpr": 1.58, "actual_prepay": 0, "multipliers": {"M_age": 0.9052, "M_rate": 0.1961, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.3088, "M_rate": -5.0519, "M_size": 1.0827, "M_program": 0.3469, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000006611280", "period": "202602", "fha_category": "223a7", "loan_purpose": "RP", "issuer": "PNC BANK, NA", "upb_M": 3.4, "age": 43, "mtm": 258, "grf_bps": -52.0, "ppp": 7.0, "net_refi_bps": -152.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.00137, "pred_cpr": 1.63, "actual_prepay": 0, "multipliers": {"M_age": 0.8541, "M_rate": 0.361, "M_size": 0.8778, "M_program": 1.0738, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.4952, "M_rate": -3.199, "M_size": -0.4094, "M_program": 0.2235, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000002311583", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "LUMENT REAL ESTATE", "upb_M": 14.8, "age": 60, "mtm": 361, "grf_bps": -217.0, "ppp": 6.0, "net_refi_bps": -304.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001566, "pred_cpr": 1.86, "actual_prepay": 0, "multipliers": {"M_age": 1.0279, "M_rate": 0.2038, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.0912, "M_rate": -5.2663, "M_size": 1.1561, "M_program": 0.3704, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000007511366", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "LUMENT REAL ESTATE", "upb_M": 27.2, "age": 45, "mtm": 376, "grf_bps": -142.0, "ppp": 7.0, "net_refi_bps": -242.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001582, "pred_cpr": 1.88, "actual_prepay": 0, "multipliers": {"M_age": 0.8746, "M_rate": 0.242, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.4456, "M_rate": -4.7171, "M_size": 1.1607, "M_program": 0.3719, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000012211447", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "WALKER & DUNLOP, L", "upb_M": 23.8, "age": 62, "mtm": 359, "grf_bps": -229.0, "ppp": 5.0, "net_refi_bps": -304.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001599, "pred_cpr": 1.9, "actual_prepay": 0, "multipliers": {"M_age": 1.0484, "M_rate": 0.2041, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.1578, "M_rate": -5.3068, "M_size": 1.1658, "M_program": 0.3735, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000008711130", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "WALKER & DUNLOP, L", "upb_M": 26.3, "age": 65, "mtm": 356, "grf_bps": -218.0, "ppp": 5.0, "net_refi_bps": -293.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001687, "pred_cpr": 2.01, "actual_prepay": 0, "multipliers": {"M_age": 1.0791, "M_rate": 0.2092, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.2596, "M_rate": -5.3387, "M_size": 1.1913, "M_program": 0.3817, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000002311582", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "MASSACHUSETTS HOUS", "upb_M": 11.7, "age": 59, "mtm": 362, "grf_bps": -210.0, "ppp": 6.0, "net_refi_bps": -298.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001575, "pred_cpr": 1.87, "actual_prepay": 0, "multipliers": {"M_age": 1.0177, "M_rate": 0.207, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.0583, "M_rate": -5.2266, "M_size": 1.1586, "M_program": 0.3712, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000006411209", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "HARPER CAPITAL PAR", "upb_M": 10.8, "age": 58, "mtm": 363, "grf_bps": -206.0, "ppp": 1.0, "net_refi_bps": -231.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.00186, "pred_cpr": 2.21, "actual_prepay": 0, "multipliers": {"M_age": 1.0075, "M_rate": 0.2515, "M_size": 1.3926, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.0265, "M_rate": -4.902, "M_size": 1.1762, "M_program": 0.3973, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000011535839", "period": "202602", "fha_category": "221d4", "loan_purpose": "NC", "issuer": "MERCHANTS CAPITAL ", "upb_M": 32.4, "age": 91, "mtm": 431, "grf_bps": -188.0, "ppp": 6.0, "net_refi_bps": -276.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001871, "pred_cpr": 2.22, "actual_prepay": 0, "multipliers": {"M_age": 1.3449, "M_rate": 0.2186, "M_size": 1.4178, "M_program": 0.9524, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 1.055, "M_rate": -5.4138, "M_size": 1.243, "M_program": -0.1737, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000008335736", "period": "202602", "fha_category": "221d4", "loan_purpose": "RP", "issuer": "WALKER & DUNLOP, L", "upb_M": 7.7, "age": 151, "mtm": 330, "grf_bps": -105.0, "ppp": 6.0, "net_refi_bps": -192.0, "msle": 24, "burn_ratio": 0.0, "pred_smm": 0.001795, "pred_cpr": 2.13, "actual_prepay": 0, "multipliers": {"M_age": 1.0919, "M_rate": 0.2946, "M_size": 1.2434, "M_program": 0.9524, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.3076, "M_rate": -4.278, "M_size": 0.7626, "M_program": -0.1707, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000012911089", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "WELLS FARGO BANK, ", "upb_M": 8.5, "age": 140, "mtm": 221, "grf_bps": -204.0, "ppp": 5.0, "net_refi_bps": -279.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001694, "pred_cpr": 2.01, "actual_prepay": 1, "multipliers": {"M_age": 1.1527, "M_rate": 0.2166, "M_size": 1.287, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.4857, "M_rate": -5.2286, "M_size": 0.8623, "M_program": 0.3823, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000008511254", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "BERKADIA COMMERCIA", "upb_M": 3.8, "age": 35, "mtm": 388, "grf_bps": 25.0, "ppp": 9.0, "net_refi_bps": -100.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.001835, "pred_cpr": 2.18, "actual_prepay": 0, "multipliers": {"M_age": 0.7631, "M_rate": 0.4927, "M_size": 0.9258, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.9549, "M_rate": -2.4998, "M_size": -0.2724, "M_program": 0.3951, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000010511139", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "DWIGHT CAPITAL LLC", "upb_M": 20.5, "age": 39, "mtm": 382, "grf_bps": -22.0, "ppp": 8.0, "net_refi_bps": -134.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.002423, "pred_cpr": 2.87, "actual_prepay": 0, "multipliers": {"M_age": 0.8132, "M_rate": 0.3986, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -0.8211, "M_rate": -3.6525, "M_size": 1.3865, "M_program": 0.4442, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000004335501", "period": "202602", "fha_category": "223a7", "loan_purpose": "RP", "issuer": "LUMENT REAL ESTATE", "upb_M": 1.0, "age": 228, "mtm": 133, "grf_bps": -57.0, "ppp": 0.0, "net_refi_bps": -70.0, "msle": 0, "burn_ratio": 0.154, "pred_smm": 0.002585, "pred_cpr": 3.06, "actual_prepay": 0, "multipliers": {"M_age": 1.3291, "M_rate": 0.6028, "M_size": 0.3938, "M_program": 1.0738, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.6184}, "attribution": {"M_age": 1.1618, "M_rate": -2.067, "M_size": -3.8057, "M_program": 0.2907, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 1.9664}}, {"loan_id": "000003311079", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "PNC BANK, NA", "upb_M": 0.9, "age": 130, "mtm": 197, "grf_bps": -99.0, "ppp": 0.0, "net_refi_bps": -112.0, "msle": 0, "burn_ratio": 0.231, "pred_smm": 0.002217, "pred_cpr": 2.63, "actual_prepay": 0, "multipliers": {"M_age": 1.208, "M_rate": 0.4581, "M_size": 0.3938, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.9297}, "attribution": {"M_age": 0.7224, "M_rate": -2.9846, "M_size": -3.5622, "M_program": 0.4276, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 2.513}}, {"loan_id": "000003435331", "period": "202602", "fha_category": "221d4", "loan_purpose": "NC", "issuer": "WALKER & DUNLOP, L", "upb_M": 13.5, "age": 74, "mtm": 427, "grf_bps": -98.0, "ppp": 6.0, "net_refi_bps": -186.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.002268, "pred_cpr": 2.69, "actual_prepay": 0, "multipliers": {"M_age": 1.1711, "M_rate": 0.3043, "M_size": 1.4178, "M_program": 0.9524, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": 0.6097, "M_rate": -4.5928, "M_size": 1.3478, "M_program": -0.1883, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000003111141", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "BERKADIA COMMERCIA", "upb_M": 23.9, "age": 58, "mtm": 368, "grf_bps": -189.0, "ppp": 7.0, "net_refi_bps": -289.0, "msle": 0, "burn_ratio": 0.103, "pred_smm": 0.002253, "pred_cpr": 2.67, "actual_prepay": 0, "multipliers": {"M_age": 1.0075, "M_rate": 0.2112, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.4168}, "attribution": {"M_age": 0.0287, "M_rate": -5.9857, "M_size": 1.3439, "M_program": 0.4306, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 1.341}}, {"loan_id": "000011822019", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "NEWPOINT REAL ESTA", "upb_M": 4.1, "age": 114, "mtm": 247, "grf_bps": -148.0, "ppp": 1.0, "net_refi_bps": -173.0, "msle": 0, "burn_ratio": 0.193, "pred_smm": 0.003076, "pred_cpr": 3.63, "actual_prepay": 0, "multipliers": {"M_age": 1.2965, "M_rate": 0.3234, "M_size": 0.966, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.7775}, "attribution": {"M_age": 1.1453, "M_rate": -4.9792, "M_size": -0.1526, "M_program": -0.4326, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 2.5369}}, {"loan_id": "000009311036", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "PGIM REAL ESTATE A", "upb_M": 15.6, "age": 33, "mtm": 388, "grf_bps": 42.0, "ppp": 9.0, "net_refi_bps": -83.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.00298, "pred_cpr": 3.52, "actual_prepay": 0, "multipliers": {"M_age": 0.7242, "M_rate": 0.5506, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -1.4034, "M_rate": -2.5949, "M_size": 1.5183, "M_program": 0.4865, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000005336381", "period": "202602", "fha_category": "221d4", "loan_purpose": "RP", "issuer": "BERKADIA COMMERCIA", "upb_M": 21.9, "age": 60, "mtm": 423, "grf_bps": -142.0, "ppp": 7.0, "net_refi_bps": -242.0, "msle": 0, "burn_ratio": 0.183, "pred_smm": 0.002752, "pred_cpr": 3.25, "actual_prepay": 0, "multipliers": {"M_age": 1.0279, "M_rate": 0.242, "M_size": 1.4178, "M_program": 0.9524, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.7386}, "attribution": {"M_age": 0.1157, "M_rate": -5.9569, "M_size": 1.4658, "M_program": -0.2048, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 2.322}}, {"loan_id": "000004411212", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "GRANDBRIDGE REAL E", "upb_M": 1.5, "age": 174, "mtm": 247, "grf_bps": -52.0, "ppp": 0.0, "net_refi_bps": -64.0, "msle": 24, "burn_ratio": 0.236, "pred_smm": 0.003246, "pred_cpr": 3.83, "actual_prepay": 0, "multipliers": {"M_age": 0.9647, "M_rate": 0.6237, "M_size": 0.5251, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.9493}, "attribution": {"M_age": -0.1625, "M_rate": -2.1333, "M_size": -2.9107, "M_program": 0.5055, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 3.016}}, {"loan_id": "000012222176", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "CAPITAL FUNDING,LL", "upb_M": 2.9, "age": 152, "mtm": 136, "grf_bps": -117.0, "ppp": 0.0, "net_refi_bps": -130.0, "msle": 24, "burn_ratio": 0.204, "pred_smm": 0.002827, "pred_cpr": 3.34, "actual_prepay": 0, "multipliers": {"M_age": 1.0863, "M_rate": 0.4105, "M_size": 0.8144, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.8216}, "attribution": {"M_age": 0.3518, "M_rate": -3.7822, "M_size": -0.8723, "M_program": -0.4167, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 2.5476}}, {"loan_id": "000007423008", "period": "202602", "fha_category": "OTHER", "loan_purpose": "OTHER", "issuer": "WELLS FARGO BANK, ", "upb_M": 4.0, "age": 162, "mtm": 333, "grf_bps": -88.0, "ppp": 0.0, "net_refi_bps": -100.0, "msle": 24, "burn_ratio": 0.216, "pred_smm": 0.004043, "pred_cpr": 4.74, "actual_prepay": 0, "multipliers": {"M_age": 1.031, "M_rate": 0.4911, "M_size": 0.9509, "M_program": 0.9524, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.8704}, "attribution": {"M_age": 0.1527, "M_rate": -3.5526, "M_size": -0.2517, "M_program": -0.2437, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 3.1284}}, {"loan_id": "000003111147", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "PGIM REAL ESTATE A", "upb_M": 10.4, "age": 39, "mtm": 382, "grf_bps": 18.0, "ppp": 8.0, "net_refi_bps": -94.0, "msle": 0, "burn_ratio": 0.077, "pred_smm": 0.003944, "pred_cpr": 4.63, "actual_prepay": 0, "multipliers": {"M_age": 0.8132, "M_rate": 0.5105, "M_size": 1.3757, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.3099}, "attribution": {"M_age": -1.0212, "M_rate": -3.3206, "M_size": 1.5753, "M_program": 0.5525, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 1.3333}}, {"loan_id": "000008235409", "period": "202602", "fha_category": "221d4", "loan_purpose": "NC", "issuer": "GRANDBRIDGE REAL E", "upb_M": 0.4, "age": 136, "mtm": 291, "grf_bps": -7.0, "ppp": 0.0, "net_refi_bps": -20.0, "msle": 0, "burn_ratio": 0.331, "pred_smm": 0.004127, "pred_cpr": 4.84, "actual_prepay": 0, "multipliers": {"M_age": 1.1748, "M_rate": 0.8517, "M_size": 0.3938, "M_program": 0.9524, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 2.333}, "attribution": {"M_age": 0.8128, "M_rate": -0.8097, "M_size": -4.7006, "M_program": -0.2461, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 4.2736}}, {"loan_id": "000006711389", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "WALKER & DUNLOP, L", "upb_M": 39.5, "age": 32, "mtm": 389, "grf_bps": 78.0, "ppp": 8.0, "net_refi_bps": -34.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.004041, "pred_cpr": 4.74, "actual_prepay": 0, "multipliers": {"M_age": 0.7047, "M_rate": 0.7672, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -1.7481, "M_rate": -1.3235, "M_size": 1.7441, "M_program": 0.5588, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000002411035", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "WELLS FARGO BANK, ", "upb_M": 2.3, "age": 221, "mtm": 200, "grf_bps": -57.0, "ppp": 0.0, "net_refi_bps": -70.0, "msle": 0, "burn_ratio": 0.131, "pred_smm": 0.004358, "pred_cpr": 5.11, "actual_prepay": 0, "multipliers": {"M_age": 1.2711, "M_rate": 0.6028, "M_size": 0.7057, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.5287}, "attribution": {"M_age": 1.2412, "M_rate": -2.6188, "M_size": -1.8033, "M_program": 0.5788, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 2.196}}, {"loan_id": "000008711111", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "MIDLAND STATES BAN", "upb_M": 3.7, "age": 110, "mtm": 311, "grf_bps": -116.0, "ppp": 1.0, "net_refi_bps": -141.0, "msle": 0, "burn_ratio": 0.227, "pred_smm": 0.004686, "pred_cpr": 5.48, "actual_prepay": 0, "multipliers": {"M_age": 1.3186, "M_rate": 0.3839, "M_size": 0.9167, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.9156}, "attribution": {"M_age": 1.4811, "M_rate": -5.1261, "M_size": -0.4658, "M_program": 0.599, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 3.4809}}, {"loan_id": "000010122137", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "BERKADIA COMMERCIA", "upb_M": 6.1, "age": 92, "mtm": 332, "grf_bps": -59.0, "ppp": 6.0, "net_refi_bps": -146.0, "msle": 0, "burn_ratio": 0.239, "pred_smm": 0.004834, "pred_cpr": 5.65, "actual_prepay": 0, "multipliers": {"M_age": 1.3551, "M_rate": 0.3722, "M_size": 1.1425, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.9634}, "attribution": {"M_age": 1.6516, "M_rate": -5.3711, "M_size": 0.7238, "M_program": -0.533, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 3.6665}}, {"loan_id": "000003422152", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "KEYBANK NATIONAL A", "upb_M": 7.3, "age": 78, "mtm": 343, "grf_bps": -94.0, "ppp": 4.0, "net_refi_bps": -156.0, "msle": 0, "burn_ratio": 0.321, "pred_smm": 0.005094, "pred_cpr": 5.94, "actual_prepay": 0, "multipliers": {"M_age": 1.212, "M_rate": 0.3523, "M_size": 1.2184, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 2.2913}, "attribution": {"M_age": 1.0712, "M_rate": -5.8124, "M_size": 1.1006, "M_program": -0.5465, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 4.6195}}, {"loan_id": "000005336372", "period": "202602", "fha_category": "221d4", "loan_purpose": "NC", "issuer": "HIGHLAND COMMERCIA", "upb_M": 59.7, "age": 40, "mtm": 466, "grf_bps": 23.0, "ppp": 9.0, "net_refi_bps": -102.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.005118, "pred_cpr": 5.97, "actual_prepay": 0, "multipliers": {"M_age": 0.8234, "M_rate": 0.4864, "M_size": 1.4178, "M_program": 0.9524, "M_purpose": 2.0077, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -1.0849, "M_rate": -4.0246, "M_size": 1.9498, "M_program": -0.2724, "M_purpose": 3.8925, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000004235685", "period": "202602", "fha_category": "221d4", "loan_purpose": "NC", "issuer": "LUMENT REAL ESTATE", "upb_M": 1.5, "age": 136, "mtm": 329, "grf_bps": -2.0, "ppp": 0.0, "net_refi_bps": -14.0, "msle": 0, "burn_ratio": 0.301, "pred_smm": 0.005218, "pred_cpr": 6.08, "actual_prepay": 0, "multipliers": {"M_age": 1.1748, "M_rate": 0.8819, "M_size": 0.5066, "M_program": 0.9524, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 2.2145}, "attribution": {"M_age": 0.9081, "M_rate": -0.7086, "M_size": -3.8328, "M_program": -0.2749, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 4.481}}, {"loan_id": "000007311772", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "MERCHANTS CAPITAL ", "upb_M": 8.6, "age": 140, "mtm": 281, "grf_bps": -74.0, "ppp": 0.0, "net_refi_bps": -86.0, "msle": 0, "burn_ratio": 0.25, "pred_smm": 0.008477, "pred_cpr": 9.71, "actual_prepay": 0, "multipliers": {"M_age": 1.1527, "M_rate": 0.538, "M_size": 1.2919, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 2.0072}, "attribution": {"M_age": 1.0167, "M_rate": -4.4352, "M_size": 1.8324, "M_program": 0.8003, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 4.9849}}, {"loan_id": "000012522028", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "BERKADIA COMMERCIA", "upb_M": 13.5, "age": 92, "mtm": 332, "grf_bps": -59.0, "ppp": 6.0, "net_refi_bps": -146.0, "msle": 0, "burn_ratio": 0.239, "pred_smm": 0.006, "pred_cpr": 6.97, "actual_prepay": 0, "multipliers": {"M_age": 1.3551, "M_rate": 0.3722, "M_size": 1.4178, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.9634}, "attribution": {"M_age": 1.8325, "M_rate": -5.9595, "M_size": 2.1052, "M_program": -0.5914, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 4.0681}}, {"loan_id": "000012145003", "period": "202602", "fha_category": "223a7", "loan_purpose": "RP", "issuer": "LUMENT REAL ESTATE", "upb_M": 0.8, "age": 143, "mtm": 218, "grf_bps": 48.0, "ppp": 0.0, "net_refi_bps": 36.0, "msle": 0, "burn_ratio": 0.392, "pred_smm": 0.007231, "pred_cpr": 8.34, "actual_prepay": 0, "multipliers": {"M_age": 1.1361, "M_rate": 1.2388, "M_size": 0.3938, "M_program": 1.0738, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 2.5777}, "attribution": {"M_age": 0.8434, "M_rate": 1.4151, "M_size": -6.1585, "M_program": 0.4704, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 6.2582}}, {"loan_id": "000004411580", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "LUMENT REAL ESTATE", "upb_M": 10.8, "age": 20, "mtm": 401, "grf_bps": 150.0, "ppp": 9.0, "net_refi_bps": 25.0, "msle": 0, "burn_ratio": 0.15, "pred_smm": 0.006414, "pred_cpr": 7.43, "actual_prepay": 0, "multipliers": {"M_age": 0.4713, "M_rate": 1.1555, "M_size": 1.3927, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.6043}, "attribution": {"M_age": -4.6863, "M_rate": 0.9006, "M_size": 2.0635, "M_program": 0.6969, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 2.9448}}, {"loan_id": "000000011273", "period": "202602", "fha_category": "223f", "loan_purpose": "RP", "issuer": "WALKER & DUNLOP, L", "upb_M": 16.2, "age": 99, "mtm": 322, "grf_bps": -117.0, "ppp": 0.0, "net_refi_bps": -130.0, "msle": 0, "burn_ratio": 0.192, "pred_smm": 0.007504, "pred_cpr": 8.64, "actual_prepay": 0, "multipliers": {"M_age": 1.3794, "M_rate": 0.4105, "M_size": 1.4178, "M_program": 1.1184, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.7732}, "attribution": {"M_age": 2.1656, "M_rate": -5.994, "M_size": 2.3505, "M_program": 0.7531, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 3.856}}, {"loan_id": "000012641015", "period": "202602", "fha_category": "241", "loan_purpose": "NC", "issuer": "PNC BANK, NA", "upb_M": 0.2, "age": 367, "mtm": 114, "grf_bps": 428.0, "ppp": 0.0, "net_refi_bps": 416.0, "msle": 24, "burn_ratio": 0.237, "pred_smm": 0.0323, "pred_cpr": 32.56, "actual_prepay": 0, "multipliers": {"M_age": 2.4224, "M_rate": 3.8577, "M_size": 0.3938, "M_program": 0.9524, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.955}, "attribution": {"M_age": 12.4359, "M_rate": 18.9764, "M_size": -13.0971, "M_program": -0.6856, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 9.4231}}, {"loan_id": "000004535181", "period": "202602", "fha_category": "223a7", "loan_purpose": "RP", "issuer": "MIDLAND STATES BAN", "upb_M": 0.2, "age": 271, "mtm": 78, "grf_bps": 78.0, "ppp": 0.0, "net_refi_bps": 66.0, "msle": 24, "burn_ratio": 0.273, "pred_smm": 0.010572, "pred_cpr": 11.97, "actual_prepay": 0, "multipliers": {"M_age": 1.6852, "M_rate": 1.4986, "M_size": 0.3938, "M_program": 1.0738, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 2.1001}, "attribution": {"M_age": 4.1751, "M_rate": 3.2361, "M_size": -7.4542, "M_program": 0.5694, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 5.9357}}, {"loan_id": "000006435411", "period": "202602", "fha_category": "223a7", "loan_purpose": "RP", "issuer": "MIDLAND STATES BAN", "upb_M": 0.3, "age": 248, "mtm": 113, "grf_bps": 138.0, "ppp": 0.0, "net_refi_bps": 126.0, "msle": 24, "burn_ratio": 0.347, "pred_smm": 0.014896, "pred_cpr": 16.48, "actual_prepay": 0, "multipliers": {"M_age": 1.4947, "M_rate": 2.0858, "M_size": 0.3938, "M_program": 1.0738, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 2.3971}, "attribution": {"M_age": 3.8316, "M_rate": 7.0079, "M_size": -8.8827, "M_program": 0.6785, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 8.334}}, {"loan_id": "000000035603", "period": "202602", "fha_category": "221d4", "loan_purpose": "NC", "issuer": "CAPITAL ONE, N.A.", "upb_M": 34.9, "age": 38, "mtm": 470, "grf_bps": 136.0, "ppp": 10.0, "net_refi_bps": -2.0, "msle": 0, "burn_ratio": 0.0, "pred_smm": 0.009561, "pred_cpr": 10.89, "actual_prepay": 0, "multipliers": {"M_age": 0.803, "M_rate": 0.9649, "M_size": 1.4178, "M_program": 0.9524, "M_purpose": 1.9387, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 1.0}, "attribution": {"M_age": -1.668, "M_rate": -0.2713, "M_size": 2.6542, "M_program": -0.3708, "M_purpose": 5.0326, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 0.0}}, {"loan_id": "000007122571", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer": "WALKER & DUNLOP, L", "upb_M": 7.1, "age": 7, "mtm": 414, "grf_bps": 227.0, "ppp": 10.0, "net_refi_bps": 90.0, "msle": 0, "burn_ratio": 1.0, "pred_smm": 0.014206, "pred_cpr": 15.78, "actual_prepay": 0, "multipliers": {"M_age": 0.3177, "M_rate": 1.7259, "M_size": 1.2058, "M_program": 0.9066, "M_purpose": 1.0, "M_lockout": 1.0, "M_maturity": 1.0, "M_burnout": 5.0287}, "attribution": {"M_age": -10.6693, "M_rate": 5.0775, "M_size": 1.7415, "M_program": -0.9125, "M_purpose": 0.0, "M_lockout": 0.0, "M_maturity": 0.0, "M_burnout": 15.027}}]};
/* __MODEL_DATA_V6F__ */ const MODEL_DATA_V6F = {"metadata": {"training_pop_n": 982361, "training_events": 7686, "base_smm": 0.007824, "base_cpr": 8.9951, "n_features": 24, "test_auc": 0.785432, "test_log_loss": 0.0423356, "prior_correction": -3.233266, "period_range": ["201812", "202602"], "feature_list": ["gross_refi_incentive_bps", "prepay_penalty_points", "age_0_36", "age_36_120", "age_120plus", "months_to_maturity", "pre_maturity_flag", "months_since_lockout_end", "log_upb", "small_loan", "large_loan", "burn_ratio", "is_post_covid", "is_223a7", "is_538", "is_hc_232", "lp_NC", "iss_capital_funding", "iss_pnc", "iss_wells_fargo", "iss_dwight", "iss_greystone", "iss_lument_combined", "gross_refi__x__prepay_pen"], "feature_groups": {"Rate & Penalty": ["gross_refi_incentive_bps", "prepay_penalty_points"], "Seasoning (piecewise)": ["age_0_36", "age_36_120", "age_120plus"], "Maturity": ["months_to_maturity", "pre_maturity_flag"], "Post-lockout surge": ["months_since_lockout_end"], "Size": ["log_upb", "small_loan", "large_loan"], "Burnout & Regime": ["burn_ratio", "is_post_covid"], "Program & Purpose": ["is_223a7", "is_538", "is_hc_232", "lp_NC"], "Issuer (Servicer)": ["iss_capital_funding", "iss_pnc", "iss_wells_fargo", "iss_dwight", "iss_greystone", "iss_lument_combined"], "Interactions": ["gross_refi__x__prepay_pen"]}, "feature_labels": {"gross_refi_incentive_bps": "Gross refi incentive (bp, penalty-neutral)", "prepay_penalty_points": "Prepay penalty points (continuous 0-10)", "age_0_36": "Age 0-36m (piecewise)", "age_36_120": "Age 36-120m (piecewise)", "age_120plus": "Age 120m+ (piecewise)", "months_to_maturity": "Months to maturity", "pre_maturity_flag": "Within 0-24m of maturity (1/0)", "months_since_lockout_end": "Months since lockout end (cap 24)", "log_upb": "Log UPB", "small_loan": "UPB < $2M (1/0)", "large_loan": "UPB > $50M (1/0)", "burn_ratio": "Burnout ratio (cum_itm / age)", "is_post_covid": "Post-COVID vintage (>=2021)", "is_223a7": "223(a)(7) Streamlined refi", "is_538": "538 USDA Rural", "is_hc_232": "232 Healthcare flag", "lp_NC": "Loan purpose: New Construction", "iss_capital_funding": "Issuer: Capital Funding", "iss_pnc": "Issuer: PNC Bank", "iss_wells_fargo": "Issuer: Wells Fargo", "iss_dwight": "Issuer: Dwight Capital", "iss_greystone": "Issuer: Greystone", "iss_lument_combined": "Issuer: Lument (incl. Red Mortgage + Hunt)", "gross_refi__x__prepay_pen": "Interaction: gross_refi_incentive_bps x prepay_penalty_points"}, "intercept_scaled": -5.525031, "intercept_native": null, "last_period": "202603", "top_issuers": ["LUMENT REAL ESTATE CAPITAL,LLC", "BERKADIA COMMERCIAL MORTGAGE, LLC", "WALKER & DUNLOP, LLC", "MERCHANTS CAPITAL CORP.", "GREYSTONE FUNDING COMPANY LLC", "PNC BANK, NA", "WELLS FARGO MULTIFAMILY CAPITAL", "CAPITAL FUNDING,LLC.", "DWIGHT CAPITAL LLC", "KEYBANK NATIONAL ASSOCIATION", "BELLWETHER ENTERPRISE REAL ESTATE CAPITA", "GERSHMAN INVESTMENT CORP.", "MIDLAND STATES BANK", "PGIM REAL ESTATE AGENCY FINANCING, LLC.", "GRANDBRIDGE REAL ESTATE CAPITAL, LLC"], "issuer_name_map": {"LUMENT REAL ESTATE CAPITAL,LLC": "LUMENT REAL ESTATE CAPITAL,LLC", "BERKADIA COMMERCIAL MORTGAGE, LLC": "BERKADIA COMMERCIAL MORTGAGE, LLC", "WALKER & DUNLOP, LLC": "WALKER & DUNLOP, LLC", "MERCHANTS CAPITAL CORP.": "MERCHANTS CAPITAL CORP.", "GREYSTONE FUNDING COMPANY LLC": "GREYSTONE FUNDING COMPANY LLC", "PNC BANK, NA": "PNC BANK, NA", "WELLS FARGO MULTIFAMILY CAPITAL": "WELLS FARGO MULTIFAMILY CAPITAL", "CAPITAL FUNDING,LLC.": "CAPITAL FUNDING,LLC.", "DWIGHT CAPITAL LLC": "DWIGHT CAPITAL LLC", "KEYBANK NATIONAL ASSOCIATION": "KEYBANK NATIONAL ASSOCIATION", "BELLWETHER ENTERPRISE REAL ESTATE CAPITA": "BELLWETHER ENTERPRISE REAL ESTATE CAPITA", "GERSHMAN INVESTMENT CORP.": "GERSHMAN INVESTMENT CORP.", "MIDLAND STATES BANK": "MIDLAND STATES BANK", "PGIM REAL ESTATE AGENCY FINANCING, LLC.": "PGIM REAL ESTATE AGENCY FINANCING, LLC.", "GRANDBRIDGE REAL ESTATE CAPITAL, LLC": "GRANDBRIDGE REAL ESTATE CAPITAL, LLC"}, "model_version": "v6f", "description": "V6F voluntary prepayment model (logistic, base + selective interactions)"}, "coefficients": [{"feature": "gross_refi_incentive_bps", "label": "Gross refi incentive (bp, penalty-neutral)", "group": "Rate & Penalty", "beta_scaled": 0.570192, "beta_native": 0.00310379, "mean": 2.265188, "std": 183.708317, "importance": 0.570192}, {"feature": "prepay_penalty_points", "label": "Prepay penalty points (continuous 0-10)", "group": "Rate & Penalty", "beta_scaled": -0.363185, "beta_native": -0.10008426, "mean": 5.076951, "std": 3.628791, "importance": 0.363185}, {"feature": "age_0_36", "label": "Age 0-36m (piecewise)", "group": "Seasoning (piecewise)", "beta_scaled": 0.271688, "beta_native": 0.0319566, "mean": 32.292252, "std": 8.501787, "importance": 0.271688}, {"feature": "age_36_120", "label": "Age 36-120m (piecewise)", "group": "Seasoning (piecewise)", "beta_scaled": 0.193293, "beta_native": 0.00577619, "mean": 40.759952, "std": 33.463732, "importance": 0.193293}, {"feature": "age_120plus", "label": "Age 120m+ (piecewise)", "group": "Seasoning (piecewise)", "beta_scaled": -0.098758, "beta_native": -0.00340313, "mean": 11.313631, "std": 29.01982, "importance": 0.098758}, {"feature": "months_to_maturity", "label": "Months to maturity", "group": "Maturity", "beta_scaled": -0.032003, "beta_native": -0.00036144, "mean": 328.587083, "std": 88.544231, "importance": 0.032003}, {"feature": "pre_maturity_flag", "label": "Within 0-24m of maturity (1/0)", "group": "Maturity", "beta_scaled": 0.11705, "beta_native": 2.78846819, "mean": 0.001765, "std": 0.041976, "importance": 0.11705}, {"feature": "months_since_lockout_end", "label": "Months since lockout end (cap 24)", "group": "Post-lockout surge", "beta_scaled": -0.012941, "beta_native": -0.0012261, "mean": 6.432159, "std": 10.554518, "importance": 0.012941}, {"feature": "log_upb", "label": "Log UPB", "group": "Size", "beta_scaled": 0.41296, "beta_native": 0.33366269, "mean": 15.369157, "std": 1.237657, "importance": 0.41296}, {"feature": "small_loan", "label": "UPB < $2M (1/0)", "group": "Size", "beta_scaled": -0.101312, "beta_native": -0.23837744, "mean": 0.236621, "std": 0.425007, "importance": 0.101312}, {"feature": "large_loan", "label": "UPB > $50M (1/0)", "group": "Size", "beta_scaled": -0.04312, "beta_native": -0.38151918, "mean": 0.012941, "std": 0.113021, "importance": 0.04312}, {"feature": "burn_ratio", "label": "Burnout ratio (cum_itm / age)", "group": "Burnout & Regime", "beta_scaled": 0.178127, "beta_native": 0.72898702, "mean": 0.195122, "std": 0.244349, "importance": 0.178127}, {"feature": "is_post_covid", "label": "Post-COVID vintage (>=2021)", "group": "Burnout & Regime", "beta_scaled": -0.100645, "beta_native": -0.28383942, "mean": 0.147481, "std": 0.354585, "importance": 0.100645}, {"feature": "is_223a7", "label": "223(a)(7) Streamlined refi", "group": "Program & Purpose", "beta_scaled": 0.025813, "beta_native": 0.06000057, "mean": 0.24521, "std": 0.430212, "importance": 0.025813}, {"feature": "is_538", "label": "538 USDA Rural", "group": "Program & Purpose", "beta_scaled": -0.19302, "beta_native": -0.77022495, "mean": 0.067336, "std": 0.250603, "importance": 0.19302}, {"feature": "is_hc_232", "label": "232 Healthcare flag", "group": "Program & Purpose", "beta_scaled": -0.031843, "beta_native": -0.07295154, "mean": 0.256124, "std": 0.436491, "importance": 0.031843}, {"feature": "lp_NC", "label": "Loan purpose: New Construction", "group": "Program & Purpose", "beta_scaled": -0.041684, "beta_native": -0.1277122, "mean": 0.121227, "std": 0.326391, "importance": 0.041684}, {"feature": "iss_capital_funding", "label": "Issuer: Capital Funding", "group": "Issuer (Servicer)", "beta_scaled": -0.083746, "beta_native": -0.45965248, "mean": 0.034376, "std": 0.182194, "importance": 0.083746}, {"feature": "iss_pnc", "label": "Issuer: PNC Bank", "group": "Issuer (Servicer)", "beta_scaled": -0.062494, "beta_native": -0.33626121, "mean": 0.035824, "std": 0.185851, "importance": 0.062494}, {"feature": "iss_wells_fargo", "label": "Issuer: Wells Fargo", "group": "Issuer (Servicer)", "beta_scaled": -0.040287, "beta_native": -0.19753202, "mean": 0.043487, "std": 0.203951, "importance": 0.040287}, {"feature": "iss_dwight", "label": "Issuer: Dwight Capital", "group": "Issuer (Servicer)", "beta_scaled": 0.044013, "beta_native": 0.25323781, "mean": 0.031179, "std": 0.173801, "importance": 0.044013}, {"feature": "iss_greystone", "label": "Issuer: Greystone", "group": "Issuer (Servicer)", "beta_scaled": 0.049625, "beta_native": 0.20682827, "mean": 0.06133, "std": 0.239934, "importance": 0.049625}, {"feature": "iss_lument_combined", "label": "Issuer: Lument (incl. Red Mortgage + Hunt)", "group": "Issuer (Servicer)", "beta_scaled": -0.003365, "beta_native": -0.00897778, "mean": 0.169072, "std": 0.374816, "importance": 0.003365}, {"feature": "gross_refi__x__prepay_pen", "label": "Interaction: gross_refi_incentive_bps x prepay_penalty_points", "group": "Interactions", "beta_scaled": 0.637551, "beta_native": 0.00059719, "mean": -65.148699, "std": 1067.575916, "importance": 0.637551}], "feature_stats": {"gross_refi_incentive_bps": {"min": -422.0, "p5": -261.5, "p25": -158.0, "mean": 2.80468, "p75": 146.0, "p95": 286.0, "max": 802.0}, "prepay_penalty_points": {"min": 0.0, "p5": 0.0, "p25": 1.0, "mean": 5.068574, "p75": 8.0, "p95": 10.0, "max": 10.0}, "age_0_36": {"min": 0.0, "p5": 9.0, "p25": 36.0, "mean": 32.292074, "p75": 36.0, "p95": 36.0, "max": 36.0}, "age_36_120": {"min": 0.0, "p5": 0.0, "p25": 4.0, "mean": 40.880424, "p75": 81.0, "p95": 84.0, "max": 84.0}, "age_120plus": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 11.482542, "p75": 0.0, "p95": 80.0, "max": 463.0}, "months_to_maturity": {"min": 0.0, "p5": 149.0, "p25": 280.0, "mean": 328.554921, "p75": 394.0, "p95": 446.0, "max": 480.0}, "pre_maturity_flag": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.001698, "p75": 0.0, "p95": 0.0, "max": 1.0}, "months_since_lockout_end": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 6.411979, "p75": 24.0, "p95": 24.0, "max": 24.0}, "log_upb": {"min": 0.470004, "p5": 13.189947, "p25": 14.570834, "mean": 15.367128, "p75": 16.242029, "p95": 17.252028, "max": 20.247646}, "small_loan": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.236998, "p75": 0.0, "p95": 1.0, "max": 1.0}, "large_loan": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.012267, "p75": 0.0, "p95": 0.0, "max": 1.0}, "burn_ratio": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.194885, "p75": 0.286885, "p95": 0.59375, "max": 5.0}, "is_post_covid": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.146165, "p75": 0.0, "p95": 1.0, "max": 1.0}, "is_223a7": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.244588, "p75": 0.0, "p95": 1.0, "max": 1.0}, "is_538": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.066641, "p75": 0.0, "p95": 1.0, "max": 1.0}, "is_hc_232": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.253576, "p75": 1.0, "p95": 1.0, "max": 1.0}, "lp_NC": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.120525, "p75": 0.0, "p95": 1.0, "max": 1.0}, "iss_capital_funding": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.034156, "p75": 0.0, "p95": 0.0, "max": 1.0}, "iss_pnc": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.036657, "p75": 0.0, "p95": 0.0, "max": 1.0}, "iss_wells_fargo": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.043754, "p75": 0.0, "p95": 0.0, "max": 1.0}, "iss_dwight": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.031614, "p75": 0.0, "p95": 0.0, "max": 1.0}, "iss_greystone": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.060711, "p75": 0.0, "p95": 1.0, "max": 1.0}, "iss_lument_combined": {"min": 0.0, "p5": 0.0, "p25": 0.0, "mean": 0.169023, "p75": 0.0, "p95": 1.0, "max": 1.0}, "gross_refi__x__prepay_pen": {"min": -4160.0, "p5": -2016.0, "p25": -568.0, "mean": -62.230589, "p75": 549.0, "p95": 1620.0, "max": 6448.0}}, "monthly": [{"period": "201812", "n": 2764, "actual_smm": 0.0036179, "pred_smm": 0.004976, "actual_cpr": 4.2562, "pred_cpr": 5.8105}, {"period": "201901", "n": 2760, "actual_smm": 0.0028986, "pred_smm": 0.0050894, "actual_cpr": 3.4233, "pred_cpr": 5.9391}, {"period": "201902", "n": 2767, "actual_smm": 0.0046982, "pred_smm": 0.005047, "actual_cpr": 5.4944, "pred_cpr": 5.8911}, {"period": "201903", "n": 2765, "actual_smm": 0.00217, "pred_smm": 0.0059429, "actual_cpr": 2.5731, "pred_cpr": 6.9029}, {"period": "201904", "n": 2780, "actual_smm": 0.0035971, "pred_smm": 0.0063724, "actual_cpr": 4.2322, "pred_cpr": 7.3845}, {"period": "201905", "n": 2785, "actual_smm": 0.0035907, "pred_smm": 0.0081507, "actual_cpr": 4.2247, "pred_cpr": 9.3541}, {"period": "201906", "n": 2792, "actual_smm": 0.0050143, "pred_smm": 0.0083925, "actual_cpr": 5.854, "pred_cpr": 9.6189}, {"period": "201907", "n": 2794, "actual_smm": 0.0042949, "pred_smm": 0.0091831, "actual_cpr": 5.0339, "pred_cpr": 10.4798}, {"period": "201908", "n": 2797, "actual_smm": 0.0039328, "pred_smm": 0.0115085, "actual_cpr": 4.6186, "pred_cpr": 12.9687}, {"period": "201909", "n": 2805, "actual_smm": 0.0046346, "pred_smm": 0.0105981, "actual_cpr": 5.4219, "pred_cpr": 12.002}, {"period": "201910", "n": 2817, "actual_smm": 0.0049698, "pred_smm": 0.0108772, "actual_cpr": 5.8034, "pred_cpr": 12.2994}, {"period": "201911", "n": 2821, "actual_smm": 0.0049628, "pred_smm": 0.0097603, "actual_cpr": 5.7954, "pred_cpr": 11.1036}, {"period": "201912", "n": 2831, "actual_smm": 0.0084776, "pred_smm": 0.0090066, "actual_cpr": 9.7119, "pred_cpr": 10.2883}, {"period": "202001", "n": 2823, "actual_smm": 0.0063762, "pred_smm": 0.0117955, "actual_cpr": 7.3887, "pred_cpr": 13.2714}, {"period": "202002", "n": 2824, "actual_smm": 0.0141643, "pred_smm": 0.0136374, "actual_cpr": 15.7336, "pred_cpr": 15.1916}, {"period": "202003", "n": 2812, "actual_smm": 0.0092461, "pred_smm": 0.0139336, "actual_cpr": 10.5481, "pred_cpr": 15.4967}, {"period": "202004", "n": 2822, "actual_smm": 0.0106308, "pred_smm": 0.0156384, "actual_cpr": 12.0368, "pred_cpr": 17.2332}, {"period": "202005", "n": 2845, "actual_smm": 0.0115993, "pred_smm": 0.0163568, "actual_cpr": 13.0646, "pred_cpr": 17.9552}, {"period": "202006", "n": 2864, "actual_smm": 0.0181564, "pred_smm": 0.0169208, "actual_cpr": 19.7384, "pred_cpr": 18.518}, {"period": "202007", "n": 2864, "actual_smm": 0.0181564, "pred_smm": 0.0193161, "actual_cpr": 19.7384, "pred_cpr": 20.8687}, {"period": "202008", "n": 2864, "actual_smm": 0.0160615, "pred_smm": 0.019962, "actual_cpr": 17.6591, "pred_cpr": 21.4918}, {"period": "202009", "n": 2865, "actual_smm": 0.0184991, "pred_smm": 0.0200516, "actual_cpr": 20.074, "pred_cpr": 21.5778}, {"period": "202010", "n": 2857, "actual_smm": 0.0248512, "pred_smm": 0.0171421, "actual_cpr": 26.0649, "pred_cpr": 18.7378}, {"period": "202011", "n": 2834, "actual_smm": 0.0271701, "pred_smm": 0.0178049, "actual_cpr": 28.1473, "pred_cpr": 19.3929}, {"period": "202012", "n": 2819, "actual_smm": 0.0283789, "pred_smm": 0.0182534, "actual_cpr": 29.2114, "pred_cpr": 19.8336}, {"period": "202101", "n": 2809, "actual_smm": 0.0238519, "pred_smm": 0.0174847, "actual_cpr": 25.1506, "pred_cpr": 19.077}, {"period": "202102", "n": 2795, "actual_smm": 0.0239714, "pred_smm": 0.0154687, "actual_cpr": 25.2604, "pred_cpr": 17.0619}, {"period": "202103", "n": 2787, "actual_smm": 0.0208109, "pred_smm": 0.0135294, "actual_cpr": 22.304, "pred_cpr": 15.08}, {"period": "202104", "n": 2779, "actual_smm": 0.0241094, "pred_smm": 0.0142599, "actual_cpr": 25.3871, "pred_cpr": 15.8316}, {"period": "202105", "n": 2774, "actual_smm": 0.019106, "pred_smm": 0.0154483, "actual_cpr": 20.665, "pred_cpr": 17.0412}, {"period": "202106", "n": 2763, "actual_smm": 0.0213536, "pred_smm": 0.016519, "actual_cpr": 22.8191, "pred_cpr": 18.1174}, {"period": "202107", "n": 2744, "actual_smm": 0.0127551, "pred_smm": 0.0177446, "actual_cpr": 14.2767, "pred_cpr": 19.3335}, {"period": "202108", "n": 2742, "actual_smm": 0.0149526, "pred_smm": 0.0167299, "actual_cpr": 16.5386, "pred_cpr": 18.3278}, {"period": "202109", "n": 2744, "actual_smm": 0.0204082, "pred_smm": 0.0159342, "actual_cpr": 21.9196, "pred_cpr": 17.5312}, {"period": "202110", "n": 2739, "actual_smm": 0.0200803, "pred_smm": 0.0155045, "actual_cpr": 21.6055, "pred_cpr": 17.098}, {"period": "202111", "n": 2740, "actual_smm": 0.0175182, "pred_smm": 0.0152602, "actual_cpr": 19.1102, "pred_cpr": 16.8509}, {"period": "202112", "n": 2738, "actual_smm": 0.0262966, "pred_smm": 0.0145095, "actual_cpr": 27.3693, "pred_cpr": 16.087}, {"period": "202201", "n": 2700, "actual_smm": 0.0111111, "pred_smm": 0.0126436, "actual_cpr": 12.548, "pred_cpr": 14.1604}, {"period": "202202", "n": 2717, "actual_smm": 0.0161943, "pred_smm": 0.0109642, "actual_cpr": 17.7924, "pred_cpr": 12.3919}, {"period": "202203", "n": 2710, "actual_smm": 0.0099631, "pred_smm": 0.0083071, "actual_cpr": 11.3219, "pred_cpr": 9.5254}, {"period": "202204", "n": 2718, "actual_smm": 0.0099338, "pred_smm": 0.0059061, "actual_cpr": 11.2903, "pred_cpr": 6.8616}, {"period": "202205", "n": 2732, "actual_smm": 0.0120791, "pred_smm": 0.005852, "actual_cpr": 13.5696, "pred_cpr": 6.8007}, {"period": "202206", "n": 2732, "actual_smm": 0.0087848, "pred_smm": 0.0050249, "actual_cpr": 10.047, "pred_cpr": 5.866}, {"period": "202207", "n": 2735, "actual_smm": 0.0040219, "pred_smm": 0.0057851, "actual_cpr": 4.721, "pred_cpr": 6.7255}, {"period": "202208", "n": 2739, "actual_smm": 0.007667, "pred_smm": 0.0044748, "actual_cpr": 8.8222, "pred_cpr": 5.2396}, {"period": "202209", "n": 2731, "actual_smm": 0.0080557, "pred_smm": 0.0032207, "actual_cpr": 9.2498, "pred_cpr": 3.7971}, {"period": "202210", "n": 2727, "actual_smm": 0.0044004, "pred_smm": 0.0026502, "actual_cpr": 5.1546, "pred_cpr": 3.1343}, {"period": "202211", "n": 2747, "actual_smm": 0.0036403, "pred_smm": 0.0033353, "actual_cpr": 4.282, "pred_cpr": 3.9297}, {"period": "202212", "n": 2753, "actual_smm": 0.0047221, "pred_smm": 0.0031421, "actual_cpr": 5.5217, "pred_cpr": 3.706}, {"period": "202301", "n": 2754, "actual_smm": 0.0036311, "pred_smm": 0.0037687, "actual_cpr": 4.2713, "pred_cpr": 4.4299}, {"period": "202302", "n": 2756, "actual_smm": 0.0010885, "pred_smm": 0.0033712, "actual_cpr": 1.2984, "pred_cpr": 3.9713}, {"period": "202303", "n": 2771, "actual_smm": 0.0043306, "pred_smm": 0.0034107, "actual_cpr": 5.0747, "pred_cpr": 4.0169}, {"period": "202304", "n": 2773, "actual_smm": 0.0007212, "pred_smm": 0.0032829, "actual_cpr": 0.8621, "pred_cpr": 3.8691}, {"period": "202305", "n": 2780, "actual_smm": 0.0028777, "pred_smm": 0.0029532, "actual_cpr": 3.3991, "pred_cpr": 3.4868}, {"period": "202306", "n": 2785, "actual_smm": 0.0043088, "pred_smm": 0.0028901, "actual_cpr": 5.0498, "pred_cpr": 3.4135}, {"period": "202307", "n": 2782, "actual_smm": 0.0025162, "pred_smm": 0.0027465, "actual_cpr": 2.978, "pred_cpr": 3.2465}, {"period": "202308", "n": 2788, "actual_smm": 0.0025108, "pred_smm": 0.0026034, "actual_cpr": 2.9717, "pred_cpr": 3.0797}, {"period": "202309", "n": 2796, "actual_smm": 0.0032189, "pred_smm": 0.0021263, "actual_cpr": 3.795, "pred_cpr": 2.522}, {"period": "202310", "n": 2808, "actual_smm": 0.0024929, "pred_smm": 0.0017704, "actual_cpr": 2.9508, "pred_cpr": 2.1039}, {"period": "202311", "n": 2812, "actual_smm": 0.0042674, "pred_smm": 0.0024006, "actual_cpr": 5.0024, "pred_cpr": 2.843}, {"period": "202312", "n": 2810, "actual_smm": 0.0014235, "pred_smm": 0.003107, "actual_cpr": 1.6949, "pred_cpr": 3.6654}, {"period": "202401", "n": 2811, "actual_smm": 0.0007115, "pred_smm": 0.0031194, "actual_cpr": 0.8505, "pred_cpr": 3.6797}, {"period": "202402", "n": 2815, "actual_smm": 0.0010657, "pred_smm": 0.0028984, "actual_cpr": 1.2714, "pred_cpr": 3.4232}, {"period": "202403", "n": 2822, "actual_smm": 0.0021262, "pred_smm": 0.00296, "actual_cpr": 2.5218, "pred_cpr": 3.4948}, {"period": "202404", "n": 2824, "actual_smm": 0.0017705, "pred_smm": 0.0024271, "actual_cpr": 2.1041, "pred_cpr": 2.8739}, {"period": "202405", "n": 2824, "actual_smm": 0.0021246, "pred_smm": 0.002678, "actual_cpr": 2.52, "pred_cpr": 3.1667}, {"period": "202406", "n": 2832, "actual_smm": 0.0014124, "pred_smm": 0.0028292, "actual_cpr": 1.6818, "pred_cpr": 3.3428}, {"period": "202407", "n": 2838, "actual_smm": 0.0031712, "pred_smm": 0.003264, "actual_cpr": 3.7398, "pred_cpr": 3.8472}, {"period": "202408", "n": 2840, "actual_smm": 0.0021127, "pred_smm": 0.003431, "actual_cpr": 2.506, "pred_cpr": 4.0404}, {"period": "202409", "n": 2851, "actual_smm": 0.0024553, "pred_smm": 0.0037611, "actual_cpr": 2.9069, "pred_cpr": 4.4211}, {"period": "202410", "n": 2856, "actual_smm": 0.0017507, "pred_smm": 0.0030449, "actual_cpr": 2.0807, "pred_cpr": 3.5934}, {"period": "202411", "n": 2860, "actual_smm": 0.0020979, "pred_smm": 0.0033113, "actual_cpr": 2.4886, "pred_cpr": 3.9019}, {"period": "202412", "n": 2866, "actual_smm": 0.0027913, "pred_smm": 0.0028616, "actual_cpr": 3.2987, "pred_cpr": 3.3803}, {"period": "202501", "n": 2872, "actual_smm": 0.0020891, "pred_smm": 0.0028721, "actual_cpr": 2.4784, "pred_cpr": 3.3926}, {"period": "202502", "n": 2873, "actual_smm": 0.0020884, "pred_smm": 0.0032225, "actual_cpr": 2.4775, "pred_cpr": 3.7992}, {"period": "202503", "n": 2883, "actual_smm": 0.002428, "pred_smm": 0.0031518, "actual_cpr": 2.875, "pred_cpr": 3.7173}, {"period": "202504", "n": 2895, "actual_smm": 0.0027634, "pred_smm": 0.0029909, "actual_cpr": 3.2661, "pred_cpr": 3.5307}, {"period": "202505", "n": 2896, "actual_smm": 0.0027624, "pred_smm": 0.0027417, "actual_cpr": 3.265, "pred_cpr": 3.2409}, {"period": "202506", "n": 2904, "actual_smm": 0.0013774, "pred_smm": 0.003013, "actual_cpr": 1.6404, "pred_cpr": 3.5563}, {"period": "202507", "n": 2920, "actual_smm": 0.0034247, "pred_smm": 0.0029016, "actual_cpr": 4.0331, "pred_cpr": 3.4269}, {"period": "202508", "n": 2922, "actual_smm": 0.0027379, "pred_smm": 0.0031674, "actual_cpr": 3.2364, "pred_cpr": 3.7354}, {"period": "202509", "n": 2935, "actual_smm": 0.0013629, "pred_smm": 0.0033959, "actual_cpr": 1.6232, "pred_cpr": 3.9998}, {"period": "202510", "n": 2943, "actual_smm": 0.0037377, "pred_smm": 0.0035449, "actual_cpr": 4.3942, "pred_cpr": 4.1719}, {"period": "202511", "n": 2950, "actual_smm": 0.0010169, "pred_smm": 0.0037448, "actual_cpr": 1.2135, "pred_cpr": 4.4023}, {"period": "202512", "n": 2964, "actual_smm": 0.0047233, "pred_smm": 0.0037131, "actual_cpr": 5.5231, "pred_cpr": 4.3659}, {"period": "202601", "n": 2974, "actual_smm": 0.0020175, "pred_smm": 0.0040312, "actual_cpr": 2.3943, "pred_cpr": 4.7316}, {"period": "202602", "n": 2975, "actual_smm": 0.0040336, "pred_smm": 0.0044389, "actual_cpr": 4.7344, "pred_cpr": 5.1985}], "yearly": [{"year": 2018, "n": 2764, "actual_smm": 0.0036179, "pred_smm": 0.004976, "actual_cpr": 4.2562, "pred_cpr": 5.8105}, {"year": 2019, "n": 33514, "actual_smm": 0.0044459, "pred_smm": 0.0083409, "actual_cpr": 5.2065, "pred_cpr": 9.5625}, {"year": 2020, "n": 34093, "actual_smm": 0.0169536, "pred_smm": 0.0167469, "actual_cpr": 18.5506, "pred_cpr": 18.3447}, {"year": 2021, "n": 33154, "actual_smm": 0.02045, "pred_smm": 0.0156987, "actual_cpr": 21.9597, "pred_cpr": 17.2941}, {"year": 2022, "n": 32741, "actual_smm": 0.0083687, "pred_smm": 0.005929, "actual_cpr": 9.5929, "pred_cpr": 6.8873}, {"year": 2023, "n": 33415, "actual_smm": 0.0027832, "pred_smm": 0.0028664, "actual_cpr": 3.2892, "pred_cpr": 3.386}, {"year": 2024, "n": 34039, "actual_smm": 0.0019683, "pred_smm": 0.0030497, "actual_cpr": 2.3366, "pred_cpr": 3.5988}, {"year": 2025, "n": 34957, "actual_smm": 0.002546, "pred_smm": 0.0032074, "actual_cpr": 3.0128, "pred_cpr": 3.7817}, {"year": 2026, "n": 5949, "actual_smm": 0.0030257, "pred_smm": 0.004235, "actual_cpr": 3.571, "pred_cpr": 4.9653}], "scurve": [{"ri_bucket": 0, "n": 3308, "ri_mid": -327.32, "actual_smm": 0.0006046, "pred_smm": 0.0009508, "actual_cpr": 0.7231, "pred_cpr": 1.135}, {"ri_bucket": 1, "n": 35878, "ri_mid": -240.58, "actual_smm": 0.0016723, "pred_smm": 0.0016973, "actual_cpr": 1.9884, "pred_cpr": 2.0178}, {"ri_bucket": 2, "n": 48464, "ri_mid": -150.84, "actual_smm": 0.0030125, "pred_smm": 0.0032053, "actual_cpr": 3.5558, "pred_cpr": 3.7793}, {"ri_bucket": 3, "n": 17770, "ri_mid": -75.86, "actual_smm": 0.004108, "pred_smm": 0.0039608, "actual_cpr": 4.8198, "pred_cpr": 4.6508}, {"ri_bucket": 4, "n": 14322, "ri_mid": -25.0, "actual_smm": 0.0045385, "pred_smm": 0.0042424, "actual_cpr": 5.3123, "pred_cpr": 4.9738}, {"ri_bucket": 5, "n": 16257, "ri_mid": 27.05, "actual_smm": 0.0047364, "pred_smm": 0.0052348, "actual_cpr": 5.538, "pred_cpr": 6.104}, {"ri_bucket": 6, "n": 22744, "ri_mid": 76.3, "actual_smm": 0.0046606, "pred_smm": 0.0070524, "actual_cpr": 5.4515, "pred_cpr": 8.1422}, {"ri_bucket": 7, "n": 26097, "ri_mid": 125.84, "actual_smm": 0.00866, "pred_smm": 0.0102502, "actual_cpr": 9.911, "pred_cpr": 11.6299}, {"ri_bucket": 8, "n": 24544, "ri_mid": 174.8, "actual_smm": 0.0178455, "pred_smm": 0.014837, "actual_cpr": 19.4329, "pred_cpr": 16.421}, {"ri_bucket": 9, "n": 24451, "ri_mid": 238.42, "actual_smm": 0.0246207, "pred_smm": 0.0199763, "actual_cpr": 25.8549, "pred_cpr": 21.5055}, {"ri_bucket": 10, "n": 9306, "ri_mid": 379.57, "actual_smm": 0.0155813, "pred_smm": 0.0175624, "actual_cpr": 17.1757, "pred_cpr": 19.1537}, {"ri_bucket": 11, "n": 1485, "ri_mid": 562.35, "actual_smm": 0.0107744, "pred_smm": 0.0243664, "actual_cpr": 12.19, "pred_cpr": 25.6226}], "calibration": [{"decile": 0, "n": 24463, "pred_smm": 0.0003415, "actual_smm": 0.0013899, "pred_cpr": 0.409, "actual_cpr": 1.6551}, {"decile": 1, "n": 24463, "pred_smm": 0.000915, "actual_smm": 0.0011446, "pred_cpr": 1.0925, "actual_cpr": 1.3649}, {"decile": 2, "n": 24462, "pred_smm": 0.0017745, "actual_smm": 0.0017169, "pred_cpr": 2.1088, "actual_cpr": 2.041}, {"decile": 3, "n": 24463, "pred_smm": 0.0029033, "actual_smm": 0.0033929, "pred_cpr": 3.4288, "actual_cpr": 3.9963}, {"decile": 4, "n": 24462, "pred_smm": 0.0042285, "actual_smm": 0.0034748, "pred_cpr": 4.9578, "actual_cpr": 4.091}, {"decile": 5, "n": 24463, "pred_smm": 0.0058612, "actual_smm": 0.0044966, "pred_cpr": 6.811, "actual_cpr": 5.2644}, {"decile": 6, "n": 24462, "pred_smm": 0.0079539, "actual_smm": 0.005764, "pred_cpr": 9.1381, "actual_cpr": 6.7017}, {"decile": 7, "n": 24463, "pred_smm": 0.0109225, "actual_smm": 0.0072763, "pred_cpr": 12.3476, "actual_cpr": 8.3905}, {"decile": 8, "n": 24462, "pred_smm": 0.0155072, "actual_smm": 0.0160657, "pred_cpr": 17.1008, "actual_cpr": 17.6634}, {"decile": 9, "n": 24463, "pred_smm": 0.0279055, "actual_smm": 0.0352369, "pred_cpr": 28.7965, "actual_cpr": 34.9798}], "fha_cuts": [{"key": "220", "n": 461, "actual_smm": 0.0086768, "pred_smm": 0.0137058, "actual_cpr": 9.9294, "pred_cpr": 15.2621}, {"key": "221d4", "n": 41688, "actual_smm": 0.0095951, "pred_smm": 0.0086753, "actual_cpr": 10.9255, "pred_cpr": 9.9277}, {"key": "223a7", "n": 26866, "actual_smm": 0.0082632, "pred_smm": 0.0086447, "actual_cpr": 9.4774, "pred_cpr": 9.8944}, {"key": "223f", "n": 95548, "actual_smm": 0.0074727, "pred_smm": 0.0074395, "actual_cpr": 8.6077, "pred_cpr": 8.571}, {"key": "232", "n": 59528, "actual_smm": 0.0081642, "pred_smm": 0.0079326, "actual_cpr": 9.3689, "pred_cpr": 9.1146}, {"key": "241", "n": 1885, "actual_smm": 0.0111406, "pred_smm": 0.0108519, "actual_cpr": 12.5792, "pred_cpr": 12.2725}, {"key": "538", "n": 15620, "actual_smm": 0.0050576, "pred_smm": 0.0043701, "actual_cpr": 5.9031, "pred_cpr": 5.1198}, {"key": "OTHER", "n": 3030, "actual_smm": 0.009901, "pred_smm": 0.0144432, "actual_cpr": 11.2551, "pred_cpr": 16.0192}], "lp_cuts": [{"key": "538", "n": 15620, "actual_smm": 0.0050576, "pred_smm": 0.0043701, "actual_cpr": 5.9031, "pred_cpr": 5.1198}, {"key": "NC", "n": 28794, "actual_smm": 0.0105578, "pred_smm": 0.0091419, "actual_cpr": 11.9589, "pred_cpr": 10.4351}, {"key": "OTHER", "n": 3030, "actual_smm": 0.009901, "pred_smm": 0.0144432, "actual_cpr": 11.2551, "pred_cpr": 16.0192}, {"key": "RP", "n": 197182, "actual_smm": 0.0078253, "pred_smm": 0.0078125, "actual_cpr": 8.9965, "pred_cpr": 8.9825}], "vintage_cuts": [{"key": "1989.0", "n": 35, "actual_smm": 0.0285714, "pred_smm": 0.005044, "actual_cpr": 29.3796, "pred_cpr": 5.8876}, {"key": "1994.0", "n": 28, "actual_smm": 0.0357143, "pred_smm": 0.0042806, "actual_cpr": 35.3648, "pred_cpr": 5.0175}, {"key": "1995.0", "n": 149, "actual_smm": 0.0067114, "pred_smm": 0.0069354, "actual_cpr": 7.763, "pred_cpr": 8.0123}, {"key": "1996.0", "n": 46, "actual_smm": 0.0434783, "pred_smm": 0.0115714, "actual_cpr": 41.3405, "pred_cpr": 13.0351}, {"key": "1998.0", "n": 301, "actual_smm": 0.013289, "pred_smm": 0.0088974, "actual_cpr": 14.8314, "pred_cpr": 10.1696}, {"key": "1999.0", "n": 174, "actual_smm": 0.0172414, "pred_smm": 0.03519, "actual_cpr": 18.8362, "pred_cpr": 34.9419}, {"key": "2000.0", "n": 389, "actual_smm": 0.0025707, "pred_smm": 0.0221204, "actual_cpr": 3.0416, "pred_cpr": 23.5417}, {"key": "2001.0", "n": 703, "actual_smm": 0.0099573, "pred_smm": 0.0100176, "actual_cpr": 11.3157, "pred_cpr": 11.3804}, {"key": "2002.0", "n": 1398, "actual_smm": 0.0114449, "pred_smm": 0.0101643, "actual_cpr": 12.9015, "pred_cpr": 11.5379}, {"key": "2003.0", "n": 4664, "actual_smm": 0.0055746, "pred_smm": 0.007628, "actual_cpr": 6.4882, "pred_cpr": 8.7792}, {"key": "2004.0", "n": 2592, "actual_smm": 0.0131173, "pred_smm": 0.0110707, "actual_cpr": 14.6533, "pred_cpr": 12.505}, {"key": "2005.0", "n": 3204, "actual_smm": 0.0087391, "pred_smm": 0.0105023, "actual_cpr": 9.9972, "pred_cpr": 11.8997}, {"key": "2006.0", "n": 5838, "actual_smm": 0.0054813, "pred_smm": 0.011263, "actual_cpr": 6.3829, "pred_cpr": 12.709}, {"key": "2007.0", "n": 4470, "actual_smm": 0.0085011, "pred_smm": 0.009703, "actual_cpr": 9.7376, "pred_cpr": 11.0419}, {"key": "2008.0", "n": 3372, "actual_smm": 0.0041518, "pred_smm": 0.0098551, "actual_cpr": 4.87, "pred_cpr": 11.2057}, {"key": "2009.0", "n": 4534, "actual_smm": 0.0068372, "pred_smm": 0.0119591, "actual_cpr": 7.9031, "pred_cpr": 13.4436}, {"key": "2010.0", "n": 6738, "actual_smm": 0.0121698, "pred_smm": 0.0129574, "actual_cpr": 13.6648, "pred_cpr": 14.4873}, {"key": "2011.0", "n": 11040, "actual_smm": 0.0121377, "pred_smm": 0.0123732, "actual_cpr": 13.6312, "pred_cpr": 13.8779}, {"key": "2012.0", "n": 22241, "actual_smm": 0.0085877, "pred_smm": 0.0088017, "actual_cpr": 9.8322, "pred_cpr": 10.0654}, {"key": "2013.0", "n": 22969, "actual_smm": 0.0114067, "pred_smm": 0.0098354, "actual_cpr": 12.8611, "pred_cpr": 11.1845}, {"key": "2014.0", "n": 17409, "actual_smm": 0.0112011, "pred_smm": 0.0104602, "actual_cpr": 12.6434, "pred_cpr": 11.8547}, {"key": "2015.0", "n": 15351, "actual_smm": 0.0099668, "pred_smm": 0.0088564, "actual_cpr": 11.3258, "pred_cpr": 10.125}, {"key": "2016.0", "n": 15206, "actual_smm": 0.011114, "pred_smm": 0.0087357, "actual_cpr": 12.5511, "pred_cpr": 9.9935}, {"key": "2017.0", "n": 18637, "actual_smm": 0.0081022, "pred_smm": 0.0077718, "actual_cpr": 9.3008, "pred_cpr": 8.9377}, {"key": "2018.0", "n": 14480, "actual_smm": 0.0123619, "pred_smm": 0.0092763, "actual_cpr": 13.8661, "pred_cpr": 10.5808}, {"key": "2019.0", "n": 12337, "actual_smm": 0.0077815, "pred_smm": 0.0067209, "actual_cpr": 8.9483, "pred_cpr": 7.7735}, {"key": "2020.0", "n": 21652, "actual_smm": 0.0025864, "pred_smm": 0.0026052, "actual_cpr": 3.0599, "pred_cpr": 3.0819}, {"key": "2021.0", "n": 19144, "actual_smm": 0.0010969, "pred_smm": 0.0010823, "actual_cpr": 1.3084, "pred_cpr": 1.2911}, {"key": "2022.0", "n": 9747, "actual_smm": 0.0015389, "pred_smm": 0.0009379, "actual_cpr": 1.8312, "pred_cpr": 1.1197}, {"key": "2023.0", "n": 2892, "actual_smm": 0.0, "pred_smm": 0.004002, "actual_cpr": 0.0, "pred_cpr": 4.698}, {"key": "2024.0", "n": 1637, "actual_smm": 0.0030544, "pred_smm": 0.0033148, "actual_cpr": 3.6043, "pred_cpr": 3.906}, {"key": "2025.0", "n": 1032, "actual_smm": 0.002907, "pred_smm": 0.0038491, "actual_cpr": 3.4331, "pred_cpr": 4.5224}, {"key": "2026.0", "n": 11, "actual_smm": 0.0, "pred_smm": 0.0029967, "actual_cpr": 0.0, "pred_cpr": 3.5374}], "age_cuts": [{"key": "0-12m", "n": 16293, "actual_smm": 0.0034371, "pred_smm": 0.0038838, "actual_cpr": 4.0474, "pred_cpr": 4.5623}, {"key": "12-36m", "n": 38460, "actual_smm": 0.0067343, "pred_smm": 0.0055554, "actual_cpr": 7.7884, "pred_cpr": 6.4665}, {"key": "36-60m", "n": 43414, "actual_smm": 0.0071175, "pred_smm": 0.0066683, "actual_cpr": 8.2145, "pred_cpr": 7.7149}, {"key": "60-120m", "n": 86123, "actual_smm": 0.0105547, "pred_smm": 0.0094298, "actual_cpr": 11.9556, "pred_cpr": 10.7469}, {"key": "120-180m", "n": 39826, "actual_smm": 0.0069804, "pred_smm": 0.0089714, "actual_cpr": 8.0622, "pred_cpr": 10.25}, {"key": "180m+", "n": 20304, "actual_smm": 0.0068952, "pred_smm": 0.008126, "actual_cpr": 7.9675, "pred_cpr": 9.3269}], "mtm_cuts": [{"key": "0-12m", "n": 245, "actual_smm": 0.0571429, "pred_smm": 0.0403903, "actual_cpr": 50.6428, "pred_cpr": 39.0273}, {"key": "12-24m", "n": 201, "actual_smm": 0.0199005, "pred_smm": 0.085536, "actual_cpr": 21.4327, "pred_cpr": 65.8021}, {"key": "24-36m", "n": 282, "actual_smm": 0.0070922, "pred_smm": 0.0073109, "actual_cpr": 8.1864, "pred_cpr": 8.4288}, {"key": "36-60m", "n": 662, "actual_smm": 0.0090634, "pred_smm": 0.0087474, "actual_cpr": 10.35, "pred_cpr": 10.0063}, {"key": "60-120m", "n": 5122, "actual_smm": 0.0062476, "pred_smm": 0.0058338, "actual_cpr": 7.2448, "pred_cpr": 6.7802}, {"key": "120m+", "n": 238114, "actual_smm": 0.007971, "pred_smm": 0.0077733, "actual_cpr": 9.1568, "pred_cpr": 8.9393}], "size_cuts": [{"key": "<2M", "n": 58350, "actual_smm": 0.0059983, "pred_smm": 0.0063221, "actual_cpr": 6.9652, "pred_cpr": 7.3282}, {"key": "2-5M", "n": 61629, "actual_smm": 0.0077723, "pred_smm": 0.0081721, "actual_cpr": 8.9382, "pred_cpr": 9.3775}, {"key": "5-10M", "n": 53942, "actual_smm": 0.0086945, "pred_smm": 0.0083509, "actual_cpr": 9.9487, "pred_cpr": 9.5734}, {"key": "10-25M", "n": 52979, "actual_smm": 0.0090413, "pred_smm": 0.0086935, "actual_cpr": 10.326, "pred_cpr": 9.9475}, {"key": "25-50M", "n": 15387, "actual_smm": 0.0103334, "pred_smm": 0.0075475, "actual_cpr": 11.7191, "pred_cpr": 8.6904}, {"key": "50M+", "n": 2339, "actual_smm": 0.0085507, "pred_smm": 0.0068567, "actual_cpr": 9.7917, "pred_cpr": 7.9247}], "post_lockout_cuts": [{"key": "in-lockout/none", "n": 178473, "actual_smm": 0.0070879, "pred_smm": 0.0067296, "actual_cpr": 8.1816, "pred_cpr": 7.7832}, {"key": "0-6m", "n": 815, "actual_smm": 0.0147239, "pred_smm": 0.009055, "actual_cpr": 16.3058, "pred_cpr": 10.3409}, {"key": "6-12m", "n": 847, "actual_smm": 0.0035419, "pred_smm": 0.0070198, "actual_cpr": 4.1685, "pred_cpr": 8.1061}, {"key": "12-18m", "n": 898, "actual_smm": 0.0055679, "pred_smm": 0.0058352, "actual_cpr": 6.4807, "pred_cpr": 6.7818}, {"key": "18-24m", "n": 63593, "actual_smm": 0.0105515, "pred_smm": 0.0109466, "actual_cpr": 11.9522, "pred_cpr": 12.3732}], "issuer_cuts": [{"key": "iss_capital_funding", "n": 8139, "actual_smm": 0.0066347, "pred_smm": 0.0058413, "actual_cpr": 7.6775, "pred_cpr": 6.7887}, {"key": "iss_pnc", "n": 9786, "actual_smm": 0.0056203, "pred_smm": 0.0079031, "actual_cpr": 6.5397, "pred_cpr": 9.0821}, {"key": "iss_wells_fargo", "n": 10966, "actual_smm": 0.0086631, "pred_smm": 0.008707, "actual_cpr": 9.9145, "pred_cpr": 9.9623}, {"key": "iss_dwight", "n": 8161, "actual_smm": 0.007352, "pred_smm": 0.0070492, "actual_cpr": 8.4743, "pred_cpr": 8.1387}, {"key": "iss_greystone", "n": 14243, "actual_smm": 0.0080741, "pred_smm": 0.0070277, "actual_cpr": 9.2701, "pred_cpr": 8.1148}, {"key": "iss_lument_combined", "n": 41299, "actual_smm": 0.007361, "pred_smm": 0.0080175, "actual_cpr": 8.4842, "pred_cpr": 9.2079}, {"key": "other", "n": 152032, "actual_smm": 0.0083732, "pred_smm": 0.0079367, "actual_cpr": 9.5978, "pred_cpr": 9.1192}], "issuer_scurves": {"iss_capital_funding": [{"ri_bucket": 0, "n": 71, "ri_mid": -328.21, "actual_cpr": 0.0, "pred_cpr": 0.9298}, {"ri_bucket": 1, "n": 1119, "ri_mid": -238.09, "actual_cpr": 3.1701, "pred_cpr": 1.5297}, {"ri_bucket": 2, "n": 1735, "ri_mid": -151.89, "actual_cpr": 2.7318, "pred_cpr": 3.1357}, {"ri_bucket": 3, "n": 557, "ri_mid": -76.47, "actual_cpr": 10.2558, "pred_cpr": 4.4796}, {"ri_bucket": 4, "n": 397, "ri_mid": -23.62, "actual_cpr": 14.1092, "pred_cpr": 4.8148}, {"ri_bucket": 5, "n": 495, "ri_mid": 27.32, "actual_cpr": 2.3975, "pred_cpr": 4.7654}, {"ri_bucket": 6, "n": 809, "ri_mid": 76.8, "actual_cpr": 5.7745, "pred_cpr": 5.2837}, {"ri_bucket": 7, "n": 1028, "ri_mid": 125.72, "actual_cpr": 4.5706, "pred_cpr": 7.7239}, {"ri_bucket": 8, "n": 947, "ri_mid": 174.15, "actual_cpr": 6.155, "pred_cpr": 11.0957}, {"ri_bucket": 9, "n": 818, "ri_mid": 237.5, "actual_cpr": 19.9158, "pred_cpr": 16.8288}, {"ri_bucket": 10, "n": 163, "ri_mid": 347.38, "actual_cpr": 45.3325, "pred_cpr": 22.7709}], "iss_pnc": [{"ri_bucket": 0, "n": 54, "ri_mid": -327.51, "actual_cpr": 0.0, "pred_cpr": 0.939}, {"ri_bucket": 1, "n": 810, "ri_mid": -237.71, "actual_cpr": 0.0, "pred_cpr": 1.9236}, {"ri_bucket": 2, "n": 1598, "ri_mid": -147.8, "actual_cpr": 1.4916, "pred_cpr": 4.8035}, {"ri_bucket": 3, "n": 557, "ri_mid": -76.08, "actual_cpr": 2.1333, "pred_cpr": 4.3742}, {"ri_bucket": 4, "n": 478, "ri_mid": -23.91, "actual_cpr": 4.907, "pred_cpr": 5.3487}, {"ri_bucket": 5, "n": 590, "ri_mid": 27.21, "actual_cpr": 5.9339, "pred_cpr": 6.0232}, {"ri_bucket": 6, "n": 872, "ri_mid": 75.73, "actual_cpr": 4.0512, "pred_cpr": 8.1932}, {"ri_bucket": 7, "n": 986, "ri_mid": 125.64, "actual_cpr": 10.4198, "pred_cpr": 8.8389}, {"ri_bucket": 8, "n": 1047, "ri_mid": 175.6, "actual_cpr": 7.7344, "pred_cpr": 10.1201}, {"ri_bucket": 9, "n": 1277, "ri_mid": 240.37, "actual_cpr": 14.0412, "pred_cpr": 12.4411}, {"ri_bucket": 10, "n": 1286, "ri_mid": 387.64, "actual_cpr": 6.3398, "pred_cpr": 15.0097}, {"ri_bucket": 11, "n": 231, "ri_mid": 586.58, "actual_cpr": 23.0945, "pred_cpr": 33.5587}], "iss_wells_fargo": [{"ri_bucket": 0, "n": 96, "ri_mid": -327.18, "actual_cpr": 11.8081, "pred_cpr": 1.3258}, {"ri_bucket": 1, "n": 1231, "ri_mid": -239.06, "actual_cpr": 0.9705, "pred_cpr": 2.6197}, {"ri_bucket": 2, "n": 2057, "ri_mid": -148.96, "actual_cpr": 1.7362, "pred_cpr": 4.1839}, {"ri_bucket": 3, "n": 751, "ri_mid": -77.97, "actual_cpr": 0.0, "pred_cpr": 5.3197}, {"ri_bucket": 4, "n": 516, "ri_mid": -23.25, "actual_cpr": 11.0278, "pred_cpr": 5.4514}, {"ri_bucket": 5, "n": 745, "ri_mid": 26.29, "actual_cpr": 10.7104, "pred_cpr": 6.4709}, {"ri_bucket": 6, "n": 1030, "ri_mid": 77.43, "actual_cpr": 7.8573, "pred_cpr": 8.9616}, {"ri_bucket": 7, "n": 1129, "ri_mid": 125.18, "actual_cpr": 8.1794, "pred_cpr": 11.2708}, {"ri_bucket": 8, "n": 1264, "ri_mid": 176.85, "actual_cpr": 25.0422, "pred_cpr": 16.2091}, {"ri_bucket": 9, "n": 1253, "ri_mid": 234.25, "actual_cpr": 20.7116, "pred_cpr": 19.9349}, {"ri_bucket": 10, "n": 741, "ri_mid": 383.74, "actual_cpr": 13.6396, "pred_cpr": 17.8309}, {"ri_bucket": 11, "n": 153, "ri_mid": 565.27, "actual_cpr": 0.0, "pred_cpr": 18.8372}], "iss_dwight": [{"ri_bucket": 0, "n": 217, "ri_mid": -327.99, "actual_cpr": 0.0, "pred_cpr": 0.9896}, {"ri_bucket": 1, "n": 2196, "ri_mid": -242.46, "actual_cpr": 0.5451, "pred_cpr": 1.939}, {"ri_bucket": 2, "n": 1750, "ri_mid": -157.15, "actual_cpr": 2.7086, "pred_cpr": 4.1399}, {"ri_bucket": 3, "n": 473, "ri_mid": -76.03, "actual_cpr": 4.9576, "pred_cpr": 4.6374}, {"ri_bucket": 4, "n": 426, "ri_mid": -23.94, "actual_cpr": 10.7035, "pred_cpr": 5.7651}, {"ri_bucket": 5, "n": 481, "ri_mid": 27.56, "actual_cpr": 0.0, "pred_cpr": 6.3058}, {"ri_bucket": 6, "n": 779, "ri_mid": 75.68, "actual_cpr": 3.0377, "pred_cpr": 7.6516}, {"ri_bucket": 7, "n": 751, "ri_mid": 125.43, "actual_cpr": 6.2075, "pred_cpr": 13.0208}, {"ri_bucket": 8, "n": 701, "ri_mid": 174.15, "actual_cpr": 36.4627, "pred_cpr": 21.6557}, {"ri_bucket": 9, "n": 371, "ri_mid": 232.72, "actual_cpr": 43.0423, "pred_cpr": 33.4413}], "iss_greystone": [{"ri_bucket": 0, "n": 394, "ri_mid": -327.01, "actual_cpr": 0.0, "pred_cpr": 0.9123}, {"ri_bucket": 1, "n": 3269, "ri_mid": -243.78, "actual_cpr": 1.4585, "pred_cpr": 1.5687}, {"ri_bucket": 2, "n": 2869, "ri_mid": -153.99, "actual_cpr": 2.8889, "pred_cpr": 3.2081}, {"ri_bucket": 3, "n": 958, "ri_mid": -75.48, "actual_cpr": 1.2454, "pred_cpr": 3.6175}, {"ri_bucket": 4, "n": 685, "ri_mid": -25.7, "actual_cpr": 6.7866, "pred_cpr": 4.4395}, {"ri_bucket": 5, "n": 936, "ri_mid": 29.74, "actual_cpr": 3.7791, "pred_cpr": 5.9774}, {"ri_bucket": 6, "n": 1542, "ri_mid": 76.2, "actual_cpr": 3.8224, "pred_cpr": 7.2561}, {"ri_bucket": 7, "n": 1605, "ri_mid": 125.03, "actual_cpr": 13.3162, "pred_cpr": 13.4774}, {"ri_bucket": 8, "n": 1075, "ri_mid": 172.57, "actual_cpr": 31.2123, "pred_cpr": 22.1738}, {"ri_bucket": 9, "n": 884, "ri_mid": 235.04, "actual_cpr": 41.8093, "pred_cpr": 29.9984}], "iss_lument_combined": [{"ri_bucket": 0, "n": 445, "ri_mid": -326.62, "actual_cpr": 0.0, "pred_cpr": 1.471}, {"ri_bucket": 1, "n": 5789, "ri_mid": -237.89, "actual_cpr": 1.0315, "pred_cpr": 2.3706}, {"ri_bucket": 2, "n": 8900, "ri_mid": -150.25, "actual_cpr": 3.5803, "pred_cpr": 3.7083}, {"ri_bucket": 3, "n": 3267, "ri_mid": -76.51, "actual_cpr": 5.3726, "pred_cpr": 5.025}, {"ri_bucket": 4, "n": 2332, "ri_mid": -25.89, "actual_cpr": 5.5158, "pred_cpr": 5.2314}, {"ri_bucket": 5, "n": 2451, "ri_mid": 27.08, "actual_cpr": 4.7876, "pred_cpr": 6.1412}, {"ri_bucket": 6, "n": 3454, "ri_mid": 76.81, "actual_cpr": 3.0824, "pred_cpr": 8.2575}, {"ri_bucket": 7, "n": 4451, "ri_mid": 126.05, "actual_cpr": 9.0385, "pred_cpr": 11.3816}, {"ri_bucket": 8, "n": 4254, "ri_mid": 175.35, "actual_cpr": 17.1085, "pred_cpr": 16.3424}, {"ri_bucket": 9, "n": 4480, "ri_mid": 236.95, "actual_cpr": 22.8901, "pred_cpr": 22.1722}, {"ri_bucket": 10, "n": 1344, "ri_mid": 379.3, "actual_cpr": 22.3253, "pred_cpr": 21.1001}, {"ri_bucket": 11, "n": 132, "ri_mid": 549.39, "actual_cpr": 16.7406, "pred_cpr": 21.9004}], "_other": [{"ri_bucket": 0, "n": 2031, "ri_mid": -327.43, "actual_cpr": 0.5892, "pred_cpr": 1.1233}, {"ri_bucket": 1, "n": 21464, "ri_mid": -240.95, "actual_cpr": 2.5416, "pred_cpr": 1.9931}, {"ri_bucket": 2, "n": 29555, "ri_mid": -150.57, "actual_cpr": 3.9464, "pred_cpr": 3.7883}, {"ri_bucket": 3, "n": 11207, "ri_mid": -75.52, "actual_cpr": 5.1224, "pred_cpr": 4.6073}, {"ri_bucket": 4, "n": 9488, "ri_mid": -24.98, "actual_cpr": 4.2164, "pred_cpr": 4.8748}, {"ri_bucket": 5, "n": 10559, "ri_mid": 26.82, "actual_cpr": 5.8598, "pred_cpr": 6.1382}, {"ri_bucket": 6, "n": 14258, "ri_mid": 76.15, "actual_cpr": 6.2122, "pred_cpr": 8.3336}, {"ri_bucket": 7, "n": 16147, "ri_mid": 125.95, "actual_cpr": 10.3939, "pred_cpr": 11.8842}, {"ri_bucket": 8, "n": 15256, "ri_mid": 174.65, "actual_cpr": 19.3521, "pred_cpr": 16.5333}, {"ri_bucket": 9, "n": 15368, "ri_mid": 239.41, "actual_cpr": 26.836, "pred_cpr": 21.5707}, {"ri_bucket": 10, "n": 5730, "ri_mid": 378.53, "actual_cpr": 17.8285, "pred_cpr": 19.6021}, {"ri_bucket": 11, "n": 969, "ri_mid": 557.88, "actual_cpr": 10.5934, "pred_cpr": 25.1548}]}, "attribution_loans": [{"label": "232_RP", "archetype_id": "232_RP", "loan_id": "3617X46E8_000000007322294", "period": "202602", "fha_category": "232", "loan_purpose": "RP", "issuer_key": "KEYBANK NATIONAL ASSOCIATION", "logit_z": -6.1524, "pred_smm": 0.0021239, "pred_cpr": 2.5192, "actual_prepay": 0, "contributions": [{"feature": "gross_refi_incentive_bps", "x_native": -158.0, "x_std": -0.87239, "contribution_logit": -0.4974}, {"feature": "prepay_penalty_points", "x_native": 6.0, "x_std": 0.25437, "contribution_logit": -0.0924}, {"feature": "age_0_36", "x_native": 36.0, "x_std": 0.43611, "contribution_logit": 0.1185}, {"feature": "age_36_120", "x_native": 70.0, "x_std": 0.87378, "contribution_logit": 0.1689}, {"feature": "age_120plus", "x_native": 0.0, "x_std": -0.38986, "contribution_logit": 0.0385}, {"feature": "months_to_maturity", "x_native": 315.0, "x_std": -0.15345, "contribution_logit": 0.0049}, {"feature": "pre_maturity_flag", "x_native": 0.0, "x_std": -0.04205, "contribution_logit": -0.0049}, {"feature": "months_since_lockout_end", "x_native": 0.0, "x_std": -0.60942, "contribution_logit": 0.0079}, {"feature": "log_upb", "x_native": 15.9064, "x_std": 0.43409, "contribution_logit": 0.1793}, {"feature": "small_loan", "x_native": 0.0, "x_std": -0.55674, "contribution_logit": 0.0564}, {"feature": "large_loan", "x_native": 0.0, "x_std": -0.1145, "contribution_logit": 0.0049}, {"feature": "burn_ratio", "x_native": 0.0, "x_std": -0.79854, "contribution_logit": -0.1422}, {"feature": "is_post_covid", "x_native": 0.0, "x_std": -0.41593, "contribution_logit": 0.0419}, {"feature": "is_223a7", "x_native": 0.0, "x_std": -0.56998, "contribution_logit": -0.0147}, {"feature": "is_538", "x_native": 0.0, "x_std": -0.2687, "contribution_logit": 0.0519}, {"feature": "is_hc_232", "x_native": 1.0, "x_std": 1.70422, "contribution_logit": -0.0543}, {"feature": "lp_NC", "x_native": 0.0, "x_std": -0.37142, "contribution_logit": 0.0155}, {"feature": "iss_capital_funding", "x_native": 0.0, "x_std": -0.18868, "contribution_logit": 0.0158}, {"feature": "iss_pnc", "x_native": 0.0, "x_std": -0.19276, "contribution_logit": 0.012}, {"feature": "iss_wells_fargo", "x_native": 0.0, "x_std": -0.21322, "contribution_logit": 0.0086}, {"feature": "iss_dwight", "x_native": 0.0, "x_std": -0.17939, "contribution_logit": -0.0079}, {"feature": "iss_greystone", "x_native": 0.0, "x_std": -0.25561, "contribution_logit": -0.0127}, {"feature": "iss_lument_combined", "x_native": 0.0, "x_std": -0.45108, "contribution_logit": 0.0015}, {"feature": "gross_refi__x__prepay_pen", "x_native": -948.0, "x_std": -0.82697, "contribution_logit": -0.5272}]}, {"label": "232_NC", "archetype_id": "232_NC", "loan_id": "3617M15B3_000000011343080", "period": "202602", "fha_category": "232", "loan_purpose": "NC", "issuer_key": "BERKADIA COMMERCIAL MORTGAGE, ", "logit_z": -5.8821, "pred_smm": 0.0027811, "pred_cpr": 3.2867, "actual_prepay": 0, "contributions": [{"feature": "gross_refi_incentive_bps", "x_native": -92.0, "x_std": -0.51312, "contribution_logit": -0.2926}, {"feature": "prepay_penalty_points", "x_native": 6.0, "x_std": 0.25437, "contribution_logit": -0.0924}, {"feature": "age_0_36", "x_native": 36.0, "x_std": 0.43611, "contribution_logit": 0.1185}, {"feature": "age_36_120", "x_native": 84.0, "x_std": 1.29215, "contribution_logit": 0.2498}, {"feature": "age_120plus", "x_native": 59.0, "x_std": 1.64323, "contribution_logit": -0.1623}, {"feature": "months_to_maturity", "x_native": 320.0, "x_std": -0.09698, "contribution_logit": 0.0031}, {"feature": "pre_maturity_flag", "x_native": 0.0, "x_std": -0.04205, "contribution_logit": -0.0049}, {"feature": "months_since_lockout_end", "x_native": 0.0, "x_std": -0.60942, "contribution_logit": 0.0079}, {"feature": "log_upb", "x_native": 15.8482, "x_std": 0.38706, "contribution_logit": 0.1598}, {"feature": "small_loan", "x_native": 0.0, "x_std": -0.55674, "contribution_logit": 0.0564}, {"feature": "large_loan", "x_native": 0.0, "x_std": -0.1145, "contribution_logit": 0.0049}, {"feature": "burn_ratio", "x_native": 0.1341, "x_std": -0.24982, "contribution_logit": -0.0445}, {"feature": "is_post_covid", "x_native": 0.0, "x_std": -0.41593, "contribution_logit": 0.0419}, {"feature": "is_223a7", "x_native": 0.0, "x_std": -0.56998, "contribution_logit": -0.0147}, {"feature": "is_538", "x_native": 0.0, "x_std": -0.2687, "contribution_logit": 0.0519}, {"feature": "is_hc_232", "x_native": 1.0, "x_std": 1.70422, "contribution_logit": -0.0543}, {"feature": "lp_NC", "x_native": 1.0, "x_std": 2.69239, "contribution_logit": -0.1122}, {"feature": "iss_capital_funding", "x_native": 0.0, "x_std": -0.18868, "contribution_logit": 0.0158}, {"feature": "iss_pnc", "x_native": 0.0, "x_std": -0.19276, "contribution_logit": 0.012}, {"feature": "iss_wells_fargo", "x_native": 0.0, "x_std": -0.21322, "contribution_logit": 0.0086}, {"feature": "iss_dwight", "x_native": 0.0, "x_std": -0.17939, "contribution_logit": -0.0079}, {"feature": "iss_greystone", "x_native": 0.0, "x_std": -0.25561, "contribution_logit": -0.0127}, {"feature": "iss_lument_combined", "x_native": 0.0, "x_std": -0.45108, "contribution_logit": 0.0015}, {"feature": "gross_refi__x__prepay_pen", "x_native": -552.0, "x_std": -0.45603, "contribution_logit": -0.2907}]}], "comparison_to_v6e": {"available": true, "v6e_test_auc": 0.7613901, "v6f_test_auc": 0.7854320202066933, "auc_delta": 0.024, "v6e_log_loss": 0.04325521, "v6f_log_loss": 0.042335574793472074, "log_loss_delta": -0.00092, "v6e_n_features": 18, "yearly_compare": [{"year": 2018, "n": 2764, "actual_cpr": 4.2562, "v6e_pred_cpr": 5.169, "v6f_pred_cpr": 5.8105}, {"year": 2019, "n": 33514, "actual_cpr": 5.2065, "v6e_pred_cpr": 8.445, "v6f_pred_cpr": 9.5625}, {"year": 2020, "n": 34093, "actual_cpr": 18.5506, "v6e_pred_cpr": 16.747, "v6f_pred_cpr": 18.3447}, {"year": 2021, "n": 33154, "actual_cpr": 21.9597, "v6e_pred_cpr": 17.898, "v6f_pred_cpr": 17.2941}, {"year": 2022, "n": 32741, "actual_cpr": 9.5929, "v6e_pred_cpr": 8.1432, "v6f_pred_cpr": 6.8873}, {"year": 2023, "n": 33415, "actual_cpr": 3.2892, "v6e_pred_cpr": 3.79, "v6f_pred_cpr": 3.386}, {"year": 2024, "n": 34039, "actual_cpr": 2.3366, "v6e_pred_cpr": 3.707, "v6f_pred_cpr": 3.5988}, {"year": 2025, "n": 34957, "actual_cpr": 3.0128, "v6e_pred_cpr": 3.7887, "v6f_pred_cpr": 3.7817}, {"year": 2026, "n": 5949, "actual_cpr": 3.571, "v6e_pred_cpr": 5.0293, "v6f_pred_cpr": 4.9653}], "calibration_compare": [{"decile": 0, "v6e_pred_cpr": 0.67375, "v6e_actual_cpr": 1.7863, "v6f_pred_cpr": 0.409, "v6f_actual_cpr": 1.6551}, {"decile": 1, "v6e_pred_cpr": 1.5441, "v6e_actual_cpr": 2.3241, "v6f_pred_cpr": 1.0925, "v6f_actual_cpr": 1.3649}, {"decile": 2, "v6e_pred_cpr": 2.5421, "v6e_actual_cpr": 3.0497, "v6f_pred_cpr": 2.1088, "v6f_actual_cpr": 2.041}, {"decile": 3, "v6e_pred_cpr": 3.6451, "v6e_actual_cpr": 3.6285, "v6f_pred_cpr": 3.4288, "v6f_actual_cpr": 3.9963}, {"decile": 4, "v6e_pred_cpr": 4.9395, "v6e_actual_cpr": 4.4298, "v6f_pred_cpr": 4.9578, "v6f_actual_cpr": 4.091}, {"decile": 5, "v6e_pred_cpr": 6.5711, "v6e_actual_cpr": 4.7579, "v6f_pred_cpr": 6.811, "v6f_actual_cpr": 5.2644}, {"decile": 6, "v6e_pred_cpr": 8.7804, "v6e_actual_cpr": 6.4016, "v6f_pred_cpr": 9.1381, "v6f_actual_cpr": 6.7017}, {"decile": 7, "v6e_pred_cpr": 11.957, "v6e_actual_cpr": 9.9231, "v6f_pred_cpr": 12.3476, "v6f_actual_cpr": 8.3905}, {"decile": 8, "v6e_pred_cpr": 16.73, "v6e_actual_cpr": 16.96, "v6f_pred_cpr": 17.1008, "v6f_actual_cpr": 17.6634}, {"decile": 9, "v6e_pred_cpr": 27.821, "v6e_actual_cpr": 32.382, "v6f_pred_cpr": 28.7965, "v6f_actual_cpr": 34.9798}]}, "accepted_interactions": [{"name": "gross_refi__x__prepay_pen", "left": "gross_refi_incentive_bps", "right": "prepay_penalty_points"}]};
/* __ISSUER_RESIDUALS__ */ const ISSUER_RESIDUALS = {"description": "Per-issuer empirical residual ratio (actual_smm / pred_smm). Apply as optional overlay multiplier in dashboard / Excel. Default 1.0 keeps the core model issuer-neutral.", "min_n": 1000, "issuers": [{"issuer_number": "3896", "issuer_name": "RED MORTGAGE CAPITAL, LLC.", "n": 205895, "actual_smm": 0.0078001, "pred_smm": 0.0074695, "residual_ratio": 1.0443, "actual_cpr": 8.9688, "pred_cpr": 8.6041}, {"issuer_number": "4082", "issuer_name": "BERKADIA COMMERCIAL MORTGAGE, LLC", "n": 106649, "actual_smm": 0.0086171, "pred_smm": 0.0086154, "residual_ratio": 1.0002, "actual_cpr": 9.8642, "pred_cpr": 9.8624}, {"issuer_number": "4080", "issuer_name": "WALKER & DUNLOP, LLC", "n": 87217, "actual_smm": 0.0092528, "pred_smm": 0.0089741, "residual_ratio": 1.0311, "actual_cpr": 10.5554, "pred_cpr": 10.253}, {"issuer_number": "4168", "issuer_name": "GREYSTONE FUNDING COMPANY LLC", "n": 59556, "actual_smm": 0.0081436, "pred_smm": 0.0052213, "residual_ratio": 1.5597, "actual_cpr": 9.3463, "pred_cpr": 6.0887}, {"issuer_number": "3487", "issuer_name": "MERCHANTS CAPITAL CORP.", "n": 59501, "actual_smm": 0.0068066, "pred_smm": 0.0076186, "residual_ratio": 0.8934, "actual_cpr": 7.869, "pred_cpr": 8.7688}, {"issuer_number": "3998", "issuer_name": "WELLS FARGO MULTIFAMILY CAPITAL", "n": 53686, "actual_smm": 0.0092203, "pred_smm": 0.0104443, "residual_ratio": 0.8828, "actual_cpr": 10.5201, "pred_cpr": 11.8377}, {"issuer_number": "3976", "issuer_name": "PNC BANK, NA", "n": 44978, "actual_smm": 0.0068256, "pred_smm": 0.0103934, "residual_ratio": 0.6567, "actual_cpr": 7.8901, "pred_cpr": 11.7832}, {"issuer_number": "3866", "issuer_name": "CAPITAL FUNDING,LLC.", "n": 41909, "actual_smm": 0.006013, "pred_smm": 0.009344, "residual_ratio": 0.6435, "actual_cpr": 6.9817, "pred_cpr": 10.6542}, {"issuer_number": "3153", "issuer_name": "PRUDENTIAL HUNTOON PAIGE ASSOCIATES, LLC", "n": 38806, "actual_smm": 0.0081688, "pred_smm": 0.0086034, "residual_ratio": 0.9495, "actual_cpr": 9.374, "pred_cpr": 9.8493}, {"issuer_number": "4398", "issuer_name": "DWIGHT CAPITAL LLC", "n": 38790, "actual_smm": 0.0076051, "pred_smm": 0.0051086, "residual_ratio": 1.4887, "actual_cpr": 8.7539, "pred_cpr": 5.961}, {"issuer_number": "4012", "issuer_name": "BONNEVILLE MORTGAGE COMPANY", "n": 35248, "actual_smm": 0.0044825, "pred_smm": 0.0048662, "residual_ratio": 0.9212, "actual_cpr": 5.2484, "pred_cpr": 5.6856}, {"issuer_number": "4271", "issuer_name": "KEYBANK NATIONAL ASSOCIATION", "n": 32397, "actual_smm": 0.0090749, "pred_smm": 0.0079009, "residual_ratio": 1.1486, "actual_cpr": 10.3625, "pred_cpr": 9.0797}, {"issuer_number": "4067", "issuer_name": "BELLWETHER ENTERPRISE REAL ESTATE CAPITA", "n": 27200, "actual_smm": 0.0038603, "pred_smm": 0.0081735, "residual_ratio": 0.4723, "actual_cpr": 4.5353, "pred_cpr": 9.3791}, {"issuer_number": "3995", "issuer_name": "DOUGHERTY MORTGAGE, LLC", "n": 25918, "actual_smm": 0.0085269, "pred_smm": 0.0103028, "residual_ratio": 0.8276, "actual_cpr": 9.7658, "pred_cpr": 11.6863}, {"issuer_number": "2045", "issuer_name": "GERSHMAN INVESTMENT CORP.", "n": 24926, "actual_smm": 0.0121159, "pred_smm": 0.0067361, "residual_ratio": 1.7986, "actual_cpr": 13.6083, "pred_cpr": 7.7905}, {"issuer_number": "4065", "issuer_name": "JONES LANG LASALLE MULTIFAMILY LLC", "n": 24725, "actual_smm": 0.0082912, "pred_smm": 0.006197, "residual_ratio": 1.3379, "actual_cpr": 9.508, "pred_cpr": 7.1881}, {"issuer_number": "4300", "issuer_name": "MIDLAND STATES BANK", "n": 23852, "actual_smm": 0.0081754, "pred_smm": 0.008023, "residual_ratio": 1.019, "actual_cpr": 9.3812, "pred_cpr": 9.2139}, {"issuer_number": "4016", "issuer_name": "GRANDBRIDGE REAL ESTATE CAPITAL, LLC", "n": 22330, "actual_smm": 0.0098074, "pred_smm": 0.0102497, "residual_ratio": 0.9569, "actual_cpr": 11.1544, "pred_cpr": 11.6294}, {"issuer_number": "3044", "issuer_name": "CENTENNIAL MORTGAGE, INC", "n": 19380, "actual_smm": 0.005418, "pred_smm": 0.0073676, "residual_ratio": 0.7354, "actual_cpr": 6.3113, "pred_cpr": 8.4915}, {"issuer_number": "4223", "issuer_name": "NEWPOINT REAL ESTATE CAPITAL LLC", "n": 19271, "actual_smm": 0.00576, "pred_smm": 0.0045516, "residual_ratio": 1.2655, "actual_cpr": 6.6971, "pred_cpr": 5.3273}, {"issuer_number": "3201", "issuer_name": "LOVE FUNDING CORPORATION", "n": 17192, "actual_smm": 0.0108772, "pred_smm": 0.0113867, "residual_ratio": 0.9553, "actual_cpr": 12.2994, "pred_cpr": 12.8399}, {"issuer_number": "4347", "issuer_name": "CHURCHILL MORTGAGE INVESTMENT LLC", "n": 16345, "actual_smm": 0.0041603, "pred_smm": 0.0037596, "residual_ratio": 1.1066, "actual_cpr": 4.8797, "pred_cpr": 4.4194}, {"issuer_number": "3733", "issuer_name": "CAMBRIDGE REALTY CAPITAL LTD OF ILLINOIS", "n": 15547, "actual_smm": 0.0091336, "pred_smm": 0.0063406, "residual_ratio": 1.4405, "actual_cpr": 10.4261, "pred_cpr": 7.3489}, {"issuer_number": "3500", "issuer_name": "GREYSTONE SERVICING CORPORATION, INC.", "n": 14935, "actual_smm": 0.0067626, "pred_smm": 0.0077378, "residual_ratio": 0.874, "actual_cpr": 7.82, "pred_cpr": 8.9003}, {"issuer_number": "3640", "issuer_name": "M&T REALTY CAPITAL CORPORATION", "n": 12704, "actual_smm": 0.0089736, "pred_smm": 0.0083588, "residual_ratio": 1.0735, "actual_cpr": 10.2524, "pred_cpr": 9.5821}, {"issuer_number": "4265", "issuer_name": "MERCHANTS CAPITAL SERVICING LLC", "n": 12124, "actual_smm": 0.0031343, "pred_smm": 0.0049345, "residual_ratio": 0.6352, "actual_cpr": 3.697, "pred_cpr": 5.7633}, {"issuer_number": "4051", "issuer_name": "CBRE HMF, INC.", "n": 11087, "actual_smm": 0.0086588, "pred_smm": 0.0090623, "residual_ratio": 0.9555, "actual_cpr": 9.9097, "pred_cpr": 10.3488}, {"issuer_number": "4147", "issuer_name": "CAPITAL ONE MULTIFAMILY FINANCE LLC", "n": 10628, "actual_smm": 0.0111968, "pred_smm": 0.0080097, "residual_ratio": 1.3979, "actual_cpr": 12.6389, "pred_cpr": 9.1993}, {"issuer_number": "3991", "issuer_name": "HOUSING & HEALTHCARE FINANCE, LLC", "n": 10481, "actual_smm": 0.0169831, "pred_smm": 0.0124013, "residual_ratio": 1.3695, "actual_cpr": 18.5799, "pred_cpr": 13.9073}, {"issuer_number": "2973", "issuer_name": "DAVIS-PENN MORTGAGE CO.", "n": 9340, "actual_smm": 0.0089936, "pred_smm": 0.0081389, "residual_ratio": 1.105, "actual_cpr": 10.2741, "pred_cpr": 9.3412}, {"issuer_number": "4170", "issuer_name": "BERKELEY POINT CAPITAL DBA NEWMARK KNIGH", "n": 8951, "actual_smm": 0.0088258, "pred_smm": 0.0110455, "residual_ratio": 0.799, "actual_cpr": 10.0917, "pred_cpr": 12.4783}, {"issuer_number": "3785", "issuer_name": "LANCASTER POLLARD MORTGAGE COMPANY, LLC", "n": 8683, "actual_smm": 0.0040309, "pred_smm": 0.004577, "residual_ratio": 0.8807, "actual_cpr": 4.7312, "pred_cpr": 5.3562}, {"issuer_number": "4013", "issuer_name": "NORTHMARQ FINANCE, LLC", "n": 7885, "actual_smm": 0.0069753, "pred_smm": 0.0072181, "residual_ratio": 0.9664, "actual_cpr": 8.0566, "pred_cpr": 8.326}, {"issuer_number": "4188", "issuer_name": "HIGHLAND COMMERCIAL MORTGAGE, LLC.", "n": 7547, "actual_smm": 0.0106002, "pred_smm": 0.0068233, "residual_ratio": 1.5535, "actual_cpr": 12.0043, "pred_cpr": 7.8876}, {"issuer_number": "3758", "issuer_name": "ARBOR AGENCY LENDING, LLC", "n": 7391, "actual_smm": 0.0073062, "pred_smm": 0.0062285, "residual_ratio": 1.173, "actual_cpr": 8.4236, "pred_cpr": 7.2234}, {"issuer_number": "4404", "issuer_name": "AGM FINANCIAL SERVICES, INC.", "n": 7000, "actual_smm": 0.0031429, "pred_smm": 0.0039108, "residual_ratio": 0.8036, "actual_cpr": 3.7069, "pred_cpr": 4.5934}, {"issuer_number": "3799", "issuer_name": "CENTURY HEALTH CAPITAL, INC", "n": 6356, "actual_smm": 0.0086532, "pred_smm": 0.0065611, "residual_ratio": 1.3189, "actual_cpr": 9.9037, "pred_cpr": 7.5953}, {"issuer_number": "4281", "issuer_name": "MASSACHUSETTS HOUSING FINANCE AGENCY", "n": 5725, "actual_smm": 0.0033188, "pred_smm": 0.0074138, "residual_ratio": 0.4476, "actual_cpr": 3.9106, "pred_cpr": 8.5426}, {"issuer_number": "3455", "issuer_name": "ARMSTRONG MORTGAGE COMPANY", "n": 5122, "actual_smm": 0.007419, "pred_smm": 0.006575, "residual_ratio": 1.1284, "actual_cpr": 8.5483, "pred_cpr": 7.6108}, {"issuer_number": "1535", "issuer_name": "ROSE COMMUNITY CAPITAL, LLC", "n": 5116, "actual_smm": 0.0066458, "pred_smm": 0.0071692, "residual_ratio": 0.927, "actual_cpr": 7.6898, "pred_cpr": 8.2718}, {"issuer_number": "3854", "issuer_name": "X-CALIBER CAPITAL CORP.", "n": 4928, "actual_smm": 0.0048701, "pred_smm": 0.0063497, "residual_ratio": 0.767, "actual_cpr": 5.6901, "pred_cpr": 7.3591}, {"issuer_number": "3752", "issuer_name": "FIRST HOUSING DEVELOPMENT CORPORATION OF", "n": 4540, "actual_smm": 0.011674, "pred_smm": 0.0104985, "residual_ratio": 1.112, "actual_cpr": 13.1434, "pred_cpr": 11.8956}, {"issuer_number": "3969", "issuer_name": "FIRST AMERICAN CAPITAL GROUP CORPORATION", "n": 4387, "actual_smm": 0.0072943, "pred_smm": 0.0053982, "residual_ratio": 1.3512, "actual_cpr": 8.4104, "pred_cpr": 6.2889}, {"issuer_number": "4380", "issuer_name": "SUNTRUST BANK", "n": 4222, "actual_smm": 0.0040265, "pred_smm": 0.0105963, "residual_ratio": 0.38, "actual_cpr": 4.7263, "pred_cpr": 12.0}, {"issuer_number": "3965", "issuer_name": "COLUMBIANATIONAL REAL ESTATE FINANCE, LL", "n": 3266, "actual_smm": 0.0094917, "pred_smm": 0.011959, "residual_ratio": 0.7937, "actual_cpr": 10.8139, "pred_cpr": 13.4435}, {"issuer_number": "3912", "issuer_name": "ZIEGLER FINANCING CORPORATION", "n": 2981, "actual_smm": 0.0110701, "pred_smm": 0.0096135, "residual_ratio": 1.1515, "actual_cpr": 12.5044, "pred_cpr": 10.9454}, {"issuer_number": "4411", "issuer_name": "REGIONS BANK", "n": 2228, "actual_smm": 0.0004488, "pred_smm": 0.0040074, "residual_ratio": 0.112, "actual_cpr": 0.5373, "pred_cpr": 4.7043}, {"issuer_number": "4451", "issuer_name": "HARPER CAPITAL PARTNERS, LLC", "n": 1805, "actual_smm": 0.0, "pred_smm": 0.0022109, "residual_ratio": 0.0, "actual_cpr": 0.0, "pred_cpr": 2.621}, {"issuer_number": "4084", "issuer_name": "NORTHPOINT CAPITAL, LLC", "n": 1598, "actual_smm": 0.005632, "pred_smm": 0.0082908, "residual_ratio": 0.6793, "actual_cpr": 6.553, "pred_cpr": 9.5076}, {"issuer_number": "3557", "issuer_name": "HUNT MORTGAGE CAPITAL, LLC", "n": 1494, "actual_smm": 0.0040161, "pred_smm": 0.008081, "residual_ratio": 0.497, "actual_cpr": 4.7142, "pred_cpr": 9.2776}, {"issuer_number": "3958", "issuer_name": "MIDCAP FINANCIAL HOUSING CAPITAL, INC.", "n": 1292, "actual_smm": 0.0154799, "pred_smm": 0.0071312, "residual_ratio": 2.1707, "actual_cpr": 17.0731, "pred_cpr": 8.2296}]};

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
function mRate(netRefiBps, p) {
  // Input is NET (penalty-adjusted) refi incentive. M_penalty is no longer a
  // separate multiplier; penalty enters as a bp-space deductible inside this input.
  const z = -(netRefiBps - p.mid) / p.slope;
  return p.floor + p.asymptote / (1 + Math.exp(Math.max(-50, Math.min(50, z))));
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
    return 1 + p.NC_bump * Math.max(0, 1 - Math.abs(age - p.peak_age) / p.width);
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
const MULT_NAMES = ['M_age', 'M_rate', 'M_size',
                    'M_program', 'M_purpose', 'M_lockout', 'M_maturity', 'M_burnout'];

function computeAllMultipliers(features, params) {
  // features.grf = gross refi bps, features.ppp = penalty points;
  // we derive net_refi_bps inline so the what-if sliders stay separate inputs.
  const netRefiBps = features.grf - 12.5 * (features.ppp + 1);
  return {
    M_age:      mAge      (features.age,                         params.M_age),
    M_rate:     mRate     (netRefiBps,                            params.M_rate),
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
          predicted_SMM = MIN(base_SMM × <span style={{color: T.text}}>M_age × M_rate × M_size × M_program × M_purpose × M_lockout × M_maturity × M_burnout</span>, smm_cap)
          <br />
          M_rate input = net_refi_bps = gross_refi_bps − 12.5 × (ppp + 1)
          <br />
          predicted_CPR = 1 − (1 − predicted_SMM)^12
        </div>
        <div style={{ marginTop: 12, color: T.textDim, fontSize: 11 }}>
          Each multiplier is bounded; no interaction can flip a factor's sign. Penalty
          enters as a bp-space deductible inside M_rate's input — the standard SanCap
          /Yield Book "borrower compares net savings to penalty" formulation.
        </div>
      </Panel>
    </div>
  );
}

function TabMultipliers({ md }) {
  const curves = md.multiplier_curves || {};
  const params = md.multipliers || {};
  const numericKeys = ['M_age', 'M_rate', 'M_size',
                       'M_lockout', 'M_maturity', 'M_burnout'];
  const labels = {
    M_age: 'M_age (loan_age_months)',
    M_rate: 'M_rate (net_refi_incentive_bps = gross − 12.5×(ppp+1))',
    M_size: 'M_size (log_upb)',
    M_lockout: 'M_lockout (months_since_lockout_end)',
    M_maturity: 'M_maturity (months_to_maturity)',
    M_burnout: 'M_burnout (burn_ratio; running-ITM amplifier in V7.1+)',
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
  const [program,  setProgram]  = useState('223f');
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
              {['223f', '223a7', '232', '538', 'OTHER'].map(o =>
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
    <Panel title="SanCap benchmark grid (informational)" subtitle="SanCap = 2014-2018 IRR-program era. V7 trains on 2018-2026 (incl. 2022-2024 hiking cycle). Persistent +50/+100bp gaps reflect that regime shift, not a model defect — V7 is ground truth on this panel; SanCap is a shape-direction sanity check.">
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

function TabSampleLoans({ md }) {
  const sample = md.sample_loans || [];
  const baseCpr = md.metadata?.base_cpr || 0;
  const [sortKey, setSortKey] = useState('pred_cpr');
  const [sortDesc, setSortDesc] = useState(true);

  // Multiplier names from the first row (so the table adapts to V7.1 9-col vs V7.2 8-col)
  const multNames = sample.length ? Object.keys(sample[0].multipliers) : [];

  // Sortable cells: anything in the row dict, or a multiplier key, or 'attr_<name>'
  const getValue = (row, key) => {
    if (key.startsWith('attr_')) return row.attribution[key.slice(5)];
    if (multNames.includes(key)) return row.multipliers[key];
    return row[key];
  };

  const sorted = useMemo(() => {
    const list = [...sample];
    list.sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      if (typeof av === 'string') return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
      return sortDesc ? (bv - av) : (av - bv);
    });
    return list;
  }, [sample, sortKey, sortDesc, multNames.length]);

  const flipSort = (key) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else { setSortKey(key); setSortDesc(true); }
  };

  // Color a CPR-pp attribution: green positive, red negative, gray near zero
  const attrColor = (val) => {
    if (val == null) return T.textDim;
    if (val > 0.5) return T.green;
    if (val < -0.5) return T.red;
    return T.textDim;
  };

  if (!sample.length) {
    return (
      <Panel title="Sample Loans">
        <div style={{ color: T.textDim, fontSize: 12 }}>
          No sample_loans in this artifact. Re-run <span style={{ fontFamily: FONT_MONO }}>python3 train_v7.py --emit-dashboard</span> to populate.
        </div>
      </Panel>
    );
  }

  // Aggregate stats for the panel header
  const meanCpr = sample.reduce((s, r) => s + r.pred_cpr, 0) / sample.length;
  const meanGap = meanCpr - baseCpr;
  const nActual = sample.filter(r => r.actual_prepay).length;

  // Header arrow indicator
  const arrow = (k) => sortKey === k ? (sortDesc ? ' ▼' : ' ▲') : '';

  // Column groups for header rendering
  const idCols = [
    ['loan_id',      'Loan ID'],
    ['period',       'Period'],
    ['fha_category', 'FHA'],
    ['loan_purpose', 'Purp'],
    ['issuer',       'Issuer'],
  ];
  const numCols = [
    ['upb_M',        'UPB ($M)'],
    ['age',          'Age'],
    ['mtm',          'MTM'],
    ['grf_bps',      'Gross bp'],
    ['ppp',          'PPP'],
    ['net_refi_bps', 'Net bp'],
    ['msle',         'MSLE'],
    ['burn_ratio',   'Burn'],
  ];
  const summaryCols = [
    ['pred_cpr',      'Pred CPR%'],
    ['actual_prepay', 'Actual'],
  ];

  const cellTd = { padding: '4px 6px', borderBottom: `1px solid ${T.border}` };
  const headTd = { ...cellTd, background: T.panelLight, color: T.text, cursor: 'pointer',
                   textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600,
                   borderBottom: `2px solid ${T.border}`, position: 'sticky', top: 0 };

  return (
    <Panel
      title={`Sample loans: ${sample.length} stratified test-set rows`}
      subtitle="Per-multiplier attribution shows how much each factor pulls each loan's CPR up (green) or down (red), in CPR percentage points. Rows sum to (pred_CPR − base_CPR). Click a column header to sort."
    >
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <Stat label="Sample size" value={sample.length} />
        <Stat label="Mean pred CPR" value={meanCpr.toFixed(2) + '%'} color={T.accent}
              hint={`base_CPR ${baseCpr.toFixed(2)}%`} />
        <Stat label="Mean − base" value={(meanGap >= 0 ? '+' : '') + meanGap.toFixed(2) + ' pp'}
              color={meanGap >= 0 ? T.green : T.red} />
        <Stat label="n actually prepaid" value={`${nActual} / ${sample.length}`}
              hint={`${(nActual/sample.length*100).toFixed(1)}% — single month`} />
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 620, overflowY: 'auto',
                    border: `1px solid ${T.border}`, borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse',
                        fontFamily: FONT_MONO, fontSize: 10.5 }}>
          <thead>
            <tr>
              {idCols.map(([k, lab]) => (
                <th key={k} style={headTd} onClick={() => flipSort(k)}>{lab}{arrow(k)}</th>
              ))}
              {numCols.map(([k, lab]) => (
                <th key={k} style={{ ...headTd, textAlign: 'right' }}
                    onClick={() => flipSort(k)}>{lab}{arrow(k)}</th>
              ))}
              {summaryCols.map(([k, lab]) => (
                <th key={k} style={{ ...headTd, textAlign: 'right' }}
                    onClick={() => flipSort(k)}>{lab}{arrow(k)}</th>
              ))}
              {multNames.map(name => (
                <th key={'attr_' + name} style={{ ...headTd, textAlign: 'right',
                    background: '#3F0F4F', borderLeft: `1px solid ${T.border}` }}
                    onClick={() => flipSort('attr_' + name)}
                    title={`Attribution for ${name} in CPR pp`}>
                  {name.replace('M_', '')}{arrow('attr_' + name)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} style={{
                background: i % 2 ? T.panel : 'transparent',
                color: T.textDim,
              }}>
                <td style={{ ...cellTd, color: T.text, whiteSpace: 'nowrap' }}>{row.loan_id}</td>
                <td style={cellTd}>{row.period}</td>
                <td style={cellTd}>{row.fha_category}</td>
                <td style={cellTd}>{row.loan_purpose}</td>
                <td style={cellTd}>{row.issuer}</td>
                <td style={{ ...cellTd, textAlign: 'right' }}>{row.upb_M.toFixed(1)}</td>
                <td style={{ ...cellTd, textAlign: 'right' }}>{row.age}</td>
                <td style={{ ...cellTd, textAlign: 'right' }}>{row.mtm}</td>
                <td style={{ ...cellTd, textAlign: 'right' }}>{row.grf_bps.toFixed(0)}</td>
                <td style={{ ...cellTd, textAlign: 'right' }}>{row.ppp.toFixed(1)}</td>
                <td style={{ ...cellTd, textAlign: 'right' }}>{row.net_refi_bps.toFixed(0)}</td>
                <td style={{ ...cellTd, textAlign: 'right' }}>{row.msle}</td>
                <td style={{ ...cellTd, textAlign: 'right' }}>{row.burn_ratio.toFixed(2)}</td>
                <td style={{ ...cellTd, textAlign: 'right', color: T.accent, fontWeight: 600 }}>
                  {row.pred_cpr.toFixed(2)}
                </td>
                <td style={{ ...cellTd, textAlign: 'center',
                             color: row.actual_prepay ? T.green : T.textDim }}>
                  {row.actual_prepay ? '✓' : '·'}
                </td>
                {multNames.map(name => {
                  const v = row.attribution[name];
                  return (
                    <td key={name} style={{ ...cellTd, textAlign: 'right',
                                            color: attrColor(v),
                                            borderLeft: `1px solid ${T.border}` }}
                        title={`M_${name.replace('M_','')}=${row.multipliers[name].toFixed(3)}`}>
                      {(v >= 0 ? '+' : '') + v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 8, color: T.textDim, fontSize: 10, fontFamily: FONT_MONO }}>
        Hover a colored attribution cell to see the underlying multiplier value. Stratified
        sample: 5 loans per pred_CPR decile from the latest test period.
      </div>
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
  { key: 'samples',      label: 'Sample Loans',    render: TabSampleLoans },
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
