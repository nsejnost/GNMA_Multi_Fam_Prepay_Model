import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Cell, ReferenceArea } from 'recharts';

const MODEL_DATA = {"metadata":{"training_pop_n":1225921,"training_events":9630,"base_smm":0.007855319,"base_cpr":9.0296,"n_features":18,"test_auc":0.7613901,"test_log_loss":0.04325521,"prior_correction":-3.235294,"period_range":["201812","202602"],"feature_list":["refi_incentive_bps","in_prepay_penalty","loan_age_months","log_upb","is_post_covid","cum_itm","burn_ratio","is_hc_232","is_223a7","is_538","lp_NC","iss_capital_funding","iss_merchants","iss_wells_fargo","iss_walker_dunlop","iss_pnc","iss_berkadia","iss_dwight"],"feature_groups":{"Rate & Restrictions":["refi_incentive_bps","in_prepay_penalty"],"Loan Structure & Seasoning":["loan_age_months","log_upb","is_post_covid"],"Burnout":["cum_itm","burn_ratio"],"FHA Program & Purpose":["is_hc_232","is_223a7","is_538","lp_NC"],"Issuer (Servicer)":["iss_capital_funding","iss_merchants","iss_wells_fargo","iss_walker_dunlop","iss_pnc","iss_berkadia","iss_dwight"]},"feature_labels":{"refi_incentive_bps":"Net refi incentive (bp)","in_prepay_penalty":"In prepay penalty (1/0)","loan_age_months":"Loan age (months)","log_upb":"Log UPB","is_post_covid":"Post-COVID vintage (1 if \u22652021)","cum_itm":"Cumulative ITM months","burn_ratio":"Burnout ratio","is_hc_232":"232 Healthcare flag","is_223a7":"223(a)(7) Streamlined refi","is_538":"538 USDA Rural","lp_NC":"Loan purpose: New Construction","iss_capital_funding":"Issuer: Capital Funding","iss_merchants":"Issuer: Merchants Capital","iss_wells_fargo":"Issuer: Wells Fargo","iss_walker_dunlop":"Issuer: Walker & Dunlop","iss_pnc":"Issuer: PNC Bank","iss_berkadia":"Issuer: Berkadia","iss_dwight":"Issuer: Dwight Capital"},"intercept_scaled":-5.232982,"intercept_native":-11.2688,"last_period":"202602","top_issuers":["capital_funding","merchants","wells_fargo","walker_dunlop","pnc","berkadia","dwight"],"issuer_name_map":{"capital_funding":"Capital Funding","merchants":"Merchants Capital","wells_fargo":"Wells Fargo","walker_dunlop":"Walker & Dunlop","pnc":"PNC Bank","berkadia":"Berkadia","dwight":"Dwight Capital","other":"Other (Lument+ORIX, Greystone, ~70 small)"},"model_version":"V6E","description":"V6E: 11 base + 7 issuer dummies. ORIX merged with Lument at parse time. is_post_covid replaces vintage_year. SATO removed for clean Excel implementation."},"coefficients":[{"feature":"refi_incentive_bps","label":"Net refi incentive (bp)","group":"Rate & Restrictions","beta_scaled":1.033619,"beta_native":0.005292193,"mean":-49.12976,"std":195.3102,"importance":1.033619},{"feature":"log_upb","label":"Log UPB","group":"Loan Structure & Seasoning","beta_scaled":0.4862314,"beta_native":0.3897878,"mean":15.38251,"std":1.247426,"importance":0.4862314},{"feature":"cum_itm","label":"Cumulative ITM months","group":"Burnout","beta_scaled":0.4469761,"beta_native":0.02798139,"mean":21.76565,"std":15.97405,"importance":0.4469761},{"feature":"is_post_covid","label":"Post-COVID vintage (1 if \u22652021)","group":"Loan Structure & Seasoning","beta_scaled":-0.3060681,"beta_native":-0.9345385,"mean":0.1221918,"std":0.3275072,"importance":0.3060681},{"feature":"loan_age_months","label":"Loan age (months)","group":"Loan Structure & Seasoning","beta_scaled":-0.20296,"beta_native":-0.003495273,"mean":86.34898,"std":58.06699,"importance":0.20296},{"feature":"is_538","label":"538 USDA Rural","group":"FHA Program & Purpose","beta_scaled":-0.1488324,"beta_native":-0.6168215,"mean":0.06207361,"std":0.2412892,"importance":0.1488324},{"feature":"in_prepay_penalty","label":"In prepay penalty (1/0)","group":"Rate & Restrictions","beta_scaled":0.1189782,"beta_native":0.3195021,"mean":0.8336592,"std":0.3723862,"importance":0.1189782},{"feature":"burn_ratio","label":"Burnout ratio","group":"Burnout","beta_scaled":-0.08225116,"beta_native":-0.3124404,"mean":0.3259793,"std":0.2632539,"importance":0.08225116},{"feature":"iss_capital_funding","label":"Issuer: Capital Funding","group":"Issuer (Servicer)","beta_scaled":-0.0784391,"beta_native":-0.4520848,"mean":0.0310694,"std":0.1735053,"importance":0.0784391},{"feature":"iss_pnc","label":"Issuer: PNC Bank","group":"Issuer (Servicer)","beta_scaled":-0.06229057,"beta_native":-0.34275,"mean":0.03419806,"std":0.1817376,"importance":0.06229057},{"feature":"is_223a7","label":"223(a)(7) Streamlined refi","group":"FHA Program & Purpose","beta_scaled":0.03760228,"beta_native":0.08666994,"mean":0.2514666,"std":0.4338561,"importance":0.03760228},{"feature":"iss_wells_fargo","label":"Issuer: Wells Fargo","group":"Issuer (Servicer)","beta_scaled":-0.03406477,"beta_native":-0.1645564,"mean":0.04486595,"std":0.2070096,"importance":0.03406477},{"feature":"iss_dwight","label":"Issuer: Dwight Capital","group":"Issuer (Servicer)","beta_scaled":0.02842385,"beta_native":0.1639878,"mean":0.03100422,"std":0.173329,"importance":0.02842385},{"feature":"iss_merchants","label":"Issuer: Merchants Capital","group":"Issuer (Servicer)","beta_scaled":-0.02007434,"beta_native":-0.08630051,"mean":0.05740234,"std":0.2326098,"importance":0.02007434},{"feature":"is_hc_232","label":"232 Healthcare flag","group":"FHA Program & Purpose","beta_scaled":-0.0122922,"beta_native":-0.02829519,"mean":0.252466,"std":0.4344271,"importance":0.0122922},{"feature":"lp_NC","label":"Loan purpose: New Construction","group":"FHA Program & Purpose","beta_scaled":-0.009650729,"beta_native":-0.0292121,"mean":0.1246904,"std":0.3303675,"importance":0.009650729},{"feature":"iss_berkadia","label":"Issuer: Berkadia","group":"Issuer (Servicer)","beta_scaled":0.00741489,"beta_native":0.02622439,"mean":0.08762439,"std":0.2827479,"importance":0.00741489},{"feature":"iss_walker_dunlop","label":"Issuer: Walker & Dunlop","group":"Issuer (Servicer)","beta_scaled":0.001318345,"beta_native":0.004992635,"mean":0.0754139,"std":0.264058,"importance":0.001318345}],"feature_stats":{"refi_incentive_bps":{"min":-553.5,"p5":-364.0,"p25":-228.0,"mean":-73.252,"p75":66.5,"p95":238.5,"max":789.5},"in_prepay_penalty":{"min":0,"p5":0,"p25":1.0,"mean":0.83637,"p75":1.0,"p95":1.0,"max":1.0},"loan_age_months":{"min":0,"p5":10.0,"p25":40.0,"mean":84.729,"p75":118.0,"p95":200.0,"max":583.0},"log_upb":{"min":0.69315,"p5":13.193,"p25":14.572,"mean":15.368,"p75":16.242,"p95":17.252,"max":20.248},"is_post_covid":{"min":0,"p5":0,"p25":0,"mean":0.14629,"p75":0,"p95":1.0,"max":1.0},"cum_itm":{"min":0,"p5":0,"p25":7.0,"mean":21.221,"p75":35.0,"p95":46.0,"max":87.0},"burn_ratio":{"min":0,"p5":0,"p25":0.12903,"mean":0.32589,"p75":0.43548,"p95":1.0,"max":1.0},"is_hc_232":{"min":0,"p5":0,"p25":0,"mean":0.25373,"p75":1.0,"p95":1.0,"max":1.0},"is_223a7":{"min":0,"p5":0,"p25":0,"mean":0.24461,"p75":0,"p95":1.0,"max":1.0},"is_538":{"min":0,"p5":0,"p25":0,"mean":0.066251,"p75":0,"p95":1.0,"max":1.0},"lp_NC":{"min":0,"p5":0,"p25":0,"mean":0.1205,"p75":0,"p95":1.0,"max":1.0},"iss_capital_funding":{"min":0,"p5":0,"p25":0,"mean":0.034186,"p75":0,"p95":0,"max":1.0},"iss_merchants":{"min":0,"p5":0,"p25":0,"mean":0.058425,"p75":0,"p95":1.0,"max":1.0},"iss_wells_fargo":{"min":0,"p5":0,"p25":0,"mean":0.043792,"p75":0,"p95":0,"max":1.0},"iss_walker_dunlop":{"min":0,"p5":0,"p25":0,"mean":0.071118,"p75":0,"p95":1.0,"max":1.0},"iss_pnc":{"min":0,"p5":0,"p25":0,"mean":0.036542,"p75":0,"p95":0,"max":1.0},"iss_berkadia":{"min":0,"p5":0,"p25":0,"mean":0.086995,"p75":0,"p95":1.0,"max":1.0},"iss_dwight":{"min":0,"p5":0,"p25":0,"mean":0.031642,"p75":0,"p95":0,"max":1.0}},"monthly":[{"period":"201812","n":13649,"actual_smm":0.0050553,"pred_smm":0.0044131,"actual_cpr":5.9005,"pred_cpr":5.169},{"period":"201901","n":13641,"actual_smm":0.0016128,"pred_smm":0.004526,"actual_cpr":1.9183,"pred_cpr":5.298},{"period":"201902","n":13689,"actual_smm":0.0040178,"pred_smm":0.0045198,"actual_cpr":4.7163,"pred_cpr":5.291},{"period":"201903","n":13686,"actual_smm":0.0030688,"pred_smm":0.0052964,"actual_cpr":3.6211,"pred_cpr":6.1738},{"period":"201904","n":13735,"actual_smm":0.0039316,"pred_smm":0.0056548,"actual_cpr":4.6172,"pred_cpr":6.5787},{"period":"201905","n":13756,"actual_smm":0.0039983,"pred_smm":0.0071145,"actual_cpr":4.6938,"pred_cpr":8.2111},{"period":"201906","n":13784,"actual_smm":0.0048607,"pred_smm":0.0073764,"actual_cpr":5.6794,"pred_cpr":8.5012},{"period":"201907","n":13822,"actual_smm":0.004992,"pred_smm":0.0079901,"actual_cpr":5.8287,"pred_cpr":9.1778},{"period":"201908","n":13847,"actual_smm":0.0040442,"pred_smm":0.0098145,"actual_cpr":4.7465,"pred_cpr":11.162},{"period":"201909","n":13882,"actual_smm":0.0047544,"pred_smm":0.0091506,"actual_cpr":5.5584,"pred_cpr":10.445},{"period":"201910","n":13910,"actual_smm":0.0067577,"pred_smm":0.0094752,"actual_cpr":7.8146,"pred_cpr":10.796},{"period":"201911","n":13922,"actual_smm":0.0060336,"pred_smm":0.0086865,"actual_cpr":7.0048,"pred_cpr":9.9399},{"period":"201912","n":13983,"actual_smm":0.0095115,"pred_smm":0.0081618,"actual_cpr":10.835,"pred_cpr":9.3662},{"period":"202001","n":13971,"actual_smm":0.0073724,"pred_smm":0.01051,"actual_cpr":8.4968,"pred_cpr":11.908},{"period":"202002","n":13966,"actual_smm":0.011313,"pred_smm":0.01207,"actual_cpr":12.762,"pred_cpr":13.561},{"period":"202003","n":13955,"actual_smm":0.010677,"pred_smm":0.012397,"actual_cpr":12.086,"pred_cpr":13.903},{"period":"202004","n":13971,"actual_smm":0.01317,"pred_smm":0.013877,"actual_cpr":14.708,"pred_cpr":15.438},{"period":"202005","n":13974,"actual_smm":0.015529,"pred_smm":0.014591,"actual_cpr":17.123,"pred_cpr":16.17},{"period":"202006","n":13990,"actual_smm":0.017941,"pred_smm":0.015114,"actual_cpr":19.527,"pred_cpr":16.702},{"period":"202007","n":14008,"actual_smm":0.017276,"pred_smm":0.017136,"actual_cpr":18.87,"pred_cpr":18.731},{"period":"202008","n":14016,"actual_smm":0.016981,"pred_smm":0.017822,"actual_cpr":18.577,"pred_cpr":19.409},{"period":"202009","n":14005,"actual_smm":0.017351,"pred_smm":0.018113,"actual_cpr":18.945,"pred_cpr":19.696},{"period":"202010","n":13977,"actual_smm":0.021893,"pred_smm":0.016043,"actual_cpr":23.328,"pred_cpr":17.64},{"period":"202011","n":13908,"actual_smm":0.023296,"pred_smm":0.016799,"actual_cpr":24.637,"pred_cpr":18.396},{"period":"202012","n":13879,"actual_smm":0.029037,"pred_smm":0.017416,"actual_cpr":29.784,"pred_cpr":19.009},{"period":"202101","n":13771,"actual_smm":0.020405,"pred_smm":0.017026,"actual_cpr":21.917,"pred_cpr":18.622},{"period":"202102","n":13769,"actual_smm":0.02295,"pred_smm":0.015417,"actual_cpr":24.317,"pred_cpr":17.009},{"period":"202103","n":13763,"actual_smm":0.018964,"pred_smm":0.013758,"actual_cpr":20.527,"pred_cpr":15.316},{"period":"202104","n":13766,"actual_smm":0.022955,"pred_smm":0.014589,"actual_cpr":24.321,"pred_cpr":16.168},{"period":"202105","n":13758,"actual_smm":0.018026,"pred_smm":0.01582,"actual_cpr":19.61,"pred_cpr":17.416},{"period":"202106","n":13714,"actual_smm":0.019907,"pred_smm":0.016931,"actual_cpr":21.439,"pred_cpr":18.528},{"period":"202107","n":13714,"actual_smm":0.015969,"pred_smm":0.018288,"actual_cpr":17.566,"pred_cpr":19.868},{"period":"202108","n":13691,"actual_smm":0.017018,"pred_smm":0.017493,"actual_cpr":18.615,"pred_cpr":19.086},{"period":"202109","n":13722,"actual_smm":0.019166,"pred_smm":0.01696,"actual_cpr":20.723,"pred_cpr":18.557},{"period":"202110","n":13697,"actual_smm":0.018398,"pred_smm":0.016747,"actual_cpr":19.975,"pred_cpr":18.345},{"period":"202111","n":13720,"actual_smm":0.019898,"pred_smm":0.016674,"actual_cpr":21.43,"pred_cpr":18.272},{"period":"202112","n":13716,"actual_smm":0.023549,"pred_smm":0.015906,"actual_cpr":24.872,"pred_cpr":17.503},{"period":"202201","n":13590,"actual_smm":0.010007,"pred_smm":0.014205,"actual_cpr":11.369,"pred_cpr":15.775},{"period":"202202","n":13660,"actual_smm":0.012079,"pred_smm":0.012643,"actual_cpr":13.57,"pred_cpr":14.16},{"period":"202203","n":13695,"actual_smm":0.011537,"pred_smm":0.0099168,"actual_cpr":12.999,"pred_cpr":11.272},{"period":"202204","n":13720,"actual_smm":0.0081633,"pred_smm":0.0071458,"actual_cpr":9.3679,"pred_cpr":8.2458},{"period":"202205","n":13779,"actual_smm":0.011031,"pred_smm":0.0072145,"actual_cpr":12.463,"pred_cpr":8.322},{"period":"202206","n":13766,"actual_smm":0.008136,"pred_smm":0.0062106,"actual_cpr":9.3379,"pred_cpr":7.2033},{"period":"202207","n":13769,"actual_smm":0.005447,"pred_smm":0.0072324,"actual_cpr":6.3441,"pred_cpr":8.3418},{"period":"202208","n":13793,"actual_smm":0.0085551,"pred_smm":0.0055548,"actual_cpr":9.7965,"pred_cpr":6.4659},{"period":"202209","n":13789,"actual_smm":0.0078323,"pred_smm":0.0038558,"actual_cpr":9.0043,"pred_cpr":4.5301},{"period":"202210","n":13782,"actual_smm":0.0055144,"pred_smm":0.0030711,"actual_cpr":6.4203,"pred_cpr":3.6237},{"period":"202211","n":13830,"actual_smm":0.0037599,"pred_smm":0.0040309,"actual_cpr":4.4198,"pred_cpr":4.7312},{"period":"202212","n":13879,"actual_smm":0.0043231,"pred_smm":0.0037625,"actual_cpr":5.0661,"pred_cpr":4.4227},{"period":"202301","n":13905,"actual_smm":0.0022294,"pred_smm":0.0045776,"actual_cpr":2.6427,"pred_cpr":5.3569},{"period":"202302","n":13952,"actual_smm":0.0020786,"pred_smm":0.0040223,"actual_cpr":2.4659,"pred_cpr":4.7215},{"period":"202303","n":13994,"actual_smm":0.0042876,"pred_smm":0.0040661,"actual_cpr":5.0255,"pred_cpr":4.7717},{"period":"202304","n":14014,"actual_smm":0.0015699,"pred_smm":0.0038792,"actual_cpr":1.8676,"pred_cpr":4.557},{"period":"202305","n":14061,"actual_smm":0.0022758,"pred_smm":0.003371,"actual_cpr":2.697,"pred_cpr":3.971},{"period":"202306","n":14096,"actual_smm":0.0034052,"pred_smm":0.0032491,"actual_cpr":4.0106,"pred_cpr":3.83},{"period":"202307","n":14113,"actual_smm":0.0017006,"pred_smm":0.0030334,"actual_cpr":2.0217,"pred_cpr":3.58},{"period":"202308","n":14145,"actual_smm":0.0029692,"pred_smm":0.0027788,"actual_cpr":3.5055,"pred_cpr":3.2841},{"period":"202309","n":14177,"actual_smm":0.0026099,"pred_smm":0.0021559,"actual_cpr":3.0873,"pred_cpr":2.5566},{"period":"202310","n":14237,"actual_smm":0.0020369,"pred_smm":0.0017064,"actual_cpr":2.4171,"pred_cpr":2.0285},{"period":"202311","n":14270,"actual_smm":0.0043448,"pred_smm":0.0024535,"actual_cpr":5.0909,"pred_cpr":2.9049},{"period":"202312","n":14267,"actual_smm":0.0022429,"pred_smm":0.0033494,"actual_cpr":2.6586,"pred_cpr":3.9461},{"period":"202401","n":14279,"actual_smm":0.002031,"pred_smm":0.0033388,"actual_cpr":2.4101,"pred_cpr":3.9339},{"period":"202402","n":14303,"actual_smm":0.0013284,"pred_smm":0.0029953,"actual_cpr":1.5825,"pred_cpr":3.5357},{"period":"202403","n":14339,"actual_smm":0.0031383,"pred_smm":0.0030798,"actual_cpr":3.7016,"pred_cpr":3.6338},{"period":"202404","n":14333,"actual_smm":0.0012558,"pred_smm":0.002395,"actual_cpr":1.4966,"pred_cpr":2.8365},{"period":"202405","n":14356,"actual_smm":0.0015325,"pred_smm":0.0026868,"actual_cpr":1.8235,"pred_cpr":3.1769},{"period":"202406","n":14394,"actual_smm":0.0023621,"pred_smm":0.0028602,"actual_cpr":2.798,"pred_cpr":3.3788},{"period":"202407","n":14401,"actual_smm":0.001736,"pred_smm":0.0033742,"actual_cpr":2.0634,"pred_cpr":3.9748},{"period":"202408","n":14438,"actual_smm":0.0021471,"pred_smm":0.0035877,"actual_cpr":2.5463,"pred_cpr":4.2213},{"period":"202409","n":14479,"actual_smm":0.0020029,"pred_smm":0.0039973,"actual_cpr":2.3772,"pred_cpr":4.6927},{"period":"202410","n":14510,"actual_smm":0.00255,"pred_smm":0.0031208,"actual_cpr":3.0174,"pred_cpr":3.6814},{"period":"202411","n":14542,"actual_smm":0.0022005,"pred_smm":0.0034102,"actual_cpr":2.6089,"pred_cpr":4.0163},{"period":"202412","n":14576,"actual_smm":0.0030187,"pred_smm":0.0028592,"actual_cpr":3.5629,"pred_cpr":3.3776},{"period":"202501","n":14581,"actual_smm":0.0017146,"pred_smm":0.0028614,"actual_cpr":2.0382,"pred_cpr":3.3801},{"period":"202502","n":14606,"actual_smm":0.0027386,"pred_smm":0.0032758,"actual_cpr":3.2373,"pred_cpr":3.8609},{"period":"202503","n":14631,"actual_smm":0.0021188,"pred_smm":0.0032055,"actual_cpr":2.5131,"pred_cpr":3.7795},{"period":"202504","n":14661,"actual_smm":0.002933,"pred_smm":0.0030206,"actual_cpr":3.4633,"pred_cpr":3.5652},{"period":"202505","n":14681,"actual_smm":0.001771,"pred_smm":0.0026997,"actual_cpr":2.1046,"pred_cpr":3.192},{"period":"202506","n":14726,"actual_smm":0.0024447,"pred_smm":0.0030111,"actual_cpr":2.8945,"pred_cpr":3.5541},{"period":"202507","n":14751,"actual_smm":0.0036608,"pred_smm":0.0028516,"actual_cpr":4.3055,"pred_cpr":3.3688},{"period":"202508","n":14773,"actual_smm":0.0023015,"pred_smm":0.0031576,"actual_cpr":2.7271,"pred_cpr":3.724},{"period":"202509","n":14827,"actual_smm":0.0014163,"pred_smm":0.0034054,"actual_cpr":1.6864,"pred_cpr":4.0108},{"period":"202510","n":14885,"actual_smm":0.0041653,"pred_smm":0.0035552,"actual_cpr":4.8854,"pred_cpr":4.1838},{"period":"202511","n":14916,"actual_smm":0.0016761,"pred_smm":0.0037701,"actual_cpr":1.9928,"pred_cpr":4.4314},{"period":"202512","n":14990,"actual_smm":0.0050033,"pred_smm":0.0037215,"actual_cpr":5.8415,"pred_cpr":4.3755},{"period":"202601","n":14969,"actual_smm":0.002405,"pred_smm":0.0040715,"actual_cpr":2.8481,"pred_cpr":4.7779},{"period":"202602","n":14964,"actual_smm":0.0028736,"pred_smm":0.0045103,"actual_cpr":3.3943,"pred_cpr":5.2801}],"yearly":[{"year":2018,"n":13649,"actual_smm":0.0050553,"pred_smm":0.0044131,"actual_cpr":5.9005,"pred_cpr":5.169},{"year":2019,"n":165657,"actual_smm":0.0048111,"pred_smm":0.0073256,"actual_cpr":5.623,"pred_cpr":8.445},{"year":2020,"n":167620,"actual_smm":0.016812,"pred_smm":0.015157,"actual_cpr":18.409,"pred_cpr":16.747},{"year":2021,"n":164801,"actual_smm":0.019769,"pred_smm":0.016299,"actual_cpr":21.306,"pred_cpr":17.898},{"year":2022,"n":165052,"actual_smm":0.0080217,"pred_smm":0.0070533,"actual_cpr":9.2125,"pred_cpr":8.1432},{"year":2023,"n":169231,"actual_smm":0.0026473,"pred_smm":0.0032146,"actual_cpr":3.1309,"pred_cpr":3.79},{"year":2024,"n":172950,"actual_smm":0.0021104,"pred_smm":0.0031429,"actual_cpr":2.5033,"pred_cpr":3.707},{"year":2025,"n":177028,"actual_smm":0.0026662,"pred_smm":0.0032135,"actual_cpr":3.153,"pred_cpr":3.7887},{"year":2026,"n":29933,"actual_smm":0.0026392,"pred_smm":0.0042909,"actual_cpr":3.1215,"pred_cpr":5.0293}],"scurve":[{"ri_bucket":0,"n":366729,"ri_mid":-297.02,"actual_smm":0.0019197,"pred_smm":0.001901,"actual_cpr":2.2794,"pred_cpr":2.2575},{"ri_bucket":1,"n":104637,"ri_mid":-175.0,"actual_smm":0.0036316,"pred_smm":0.0038156,"actual_cpr":4.2719,"pred_cpr":4.4838},{"ri_bucket":2,"n":98044,"ri_mid":-125.01,"actual_smm":0.0036922,"pred_smm":0.0044735,"actual_cpr":4.3418,"pred_cpr":5.238},{"ri_bucket":3,"n":98776,"ri_mid":-74.599,"actual_smm":0.0043229,"pred_smm":0.0052109,"actual_cpr":5.0659,"pred_cpr":6.0769},{"ri_bucket":4,"n":49290,"ri_mid":-37.378,"actual_smm":0.0042605,"pred_smm":0.0062326,"actual_cpr":4.9945,"pred_cpr":7.228},{"ri_bucket":5,"n":50448,"ri_mid":-12.338,"actual_smm":0.0046979,"pred_smm":0.0073282,"actual_cpr":5.4941,"pred_cpr":8.4479},{"ri_bucket":6,"n":53867,"ri_mid":12.883,"actual_smm":0.0074257,"pred_smm":0.0087759,"actual_cpr":8.5558,"pred_cpr":10.037},{"ri_bucket":7,"n":58006,"ri_mid":37.74,"actual_smm":0.010309,"pred_smm":0.010469,"actual_cpr":11.693,"pred_cpr":11.865},{"ri_bucket":8,"n":116308,"ri_mid":74.75,"actual_smm":0.01527,"pred_smm":0.013016,"actual_cpr":16.861,"pred_cpr":14.548},{"ri_bucket":9,"n":90492,"ri_mid":123.46,"actual_smm":0.021715,"pred_smm":0.01582,"actual_cpr":23.16,"pred_cpr":17.416},{"ri_bucket":10,"n":54675,"ri_mid":172.74,"actual_smm":0.022734,"pred_smm":0.018124,"actual_cpr":24.116,"pred_cpr":19.707},{"ri_bucket":11,"n":84649,"ri_mid":322.91,"actual_smm":0.015688,"pred_smm":0.020162,"actual_cpr":17.284,"pred_cpr":21.683}],"calibration":[{"decile":0,"n":122593,"pred_smm":0.00056323,"actual_smm":0.0015009,"pred_cpr":0.67375,"actual_cpr":1.7863},{"decile":1,"n":122592,"pred_smm":0.001296,"actual_smm":0.0019577,"pred_cpr":1.5441,"actual_cpr":2.3241},{"decile":2,"n":122592,"pred_smm":0.0021435,"actual_smm":0.0025777,"pred_cpr":2.5421,"actual_cpr":3.0497},{"decile":3,"n":122592,"pred_smm":0.0030895,"actual_smm":0.0030752,"pred_cpr":3.6451,"actual_cpr":3.6285},{"decile":4,"n":122592,"pred_smm":0.0042125,"actual_smm":0.0037686,"pred_cpr":4.9395,"actual_cpr":4.4298},{"decile":5,"n":122592,"pred_smm":0.0056481,"actual_smm":0.0040541,"pred_cpr":6.5711,"actual_cpr":4.7579},{"decile":6,"n":122592,"pred_smm":0.0076291,"actual_smm":0.0054979,"pred_cpr":8.7804,"actual_cpr":6.4016},{"decile":7,"n":122592,"pred_smm":0.010556,"actual_smm":0.008671,"pred_cpr":11.957,"actual_cpr":9.9231},{"decile":8,"n":122592,"pred_smm":0.015141,"actual_smm":0.015368,"pred_cpr":16.73,"actual_cpr":16.96},{"decile":9,"n":122592,"pred_smm":0.026803,"actual_smm":0.032082,"pred_cpr":27.821,"actual_cpr":32.382}],"fha_cuts":[{"fha_category":"220","n":2459,"actual_smm":0.0093534,"pred_smm":0.012515,"actual_cpr":10.664,"pred_cpr":14.026},{"fha_category":"221d4","n":207833,"actual_smm":0.0097001,"pred_smm":0.0087734,"actual_cpr":11.039,"pred_cpr":10.035},{"fha_category":"223a7","n":135978,"actual_smm":0.0082881,"pred_smm":0.009006,"actual_cpr":9.5046,"pred_cpr":10.288},{"fha_category":"223f","n":464170,"actual_smm":0.0074132,"pred_smm":0.0072898,"actual_cpr":8.542,"pred_cpr":8.4054},{"fha_category":"232","n":311047,"actual_smm":0.007777,"pred_smm":0.007609,"actual_cpr":8.9433,"pred_cpr":8.7582},{"fha_category":"241","n":7482,"actual_smm":0.011762,"pred_smm":0.0095609,"actual_cpr":13.236,"pred_cpr":10.889},{"fha_category":"538","n":81218,"actual_smm":0.0039893,"pred_smm":0.0042276,"actual_cpr":4.6835,"pred_cpr":4.9568},{"fha_category":"OTHER","n":15734,"actual_smm":0.012203,"pred_smm":0.013061,"actual_cpr":13.7,"pred_cpr":14.595}],"lp_cuts":[{"loan_purpose":"538","n":81218,"actual_smm":0.0039893,"pred_smm":0.0042276,"actual_cpr":4.6835,"pred_cpr":4.9568},{"loan_purpose":"NC","n":147729,"actual_smm":0.0098356,"pred_smm":0.0091211,"actual_cpr":11.185,"pred_cpr":10.413},{"loan_purpose":"OTHER","n":15734,"actual_smm":0.012203,"pred_smm":0.013061,"actual_cpr":13.7,"pred_cpr":14.595},{"loan_purpose":"RP","n":981240,"actual_smm":0.0078075,"pred_smm":0.0076977,"actual_cpr":8.9769,"pred_cpr":8.8561}],"vintage_cuts":[{"vintage_year":1999,"n":1463,"actual_smm":0.0088859,"pred_smm":0.014968,"actual_cpr":10.157,"pred_cpr":16.555},{"vintage_year":2001,"n":3604,"actual_smm":0.009434,"pred_smm":0.018478,"actual_cpr":10.751,"pred_cpr":20.053},{"vintage_year":2002,"n":7572,"actual_smm":0.010697,"pred_smm":0.014988,"actual_cpr":12.108,"pred_cpr":16.575},{"vintage_year":2003,"n":17526,"actual_smm":0.0073605,"pred_smm":0.0096973,"actual_cpr":8.4837,"pred_cpr":11.036},{"vintage_year":2004,"n":15036,"actual_smm":0.010375,"pred_smm":0.010261,"actual_cpr":11.764,"pred_cpr":11.642},{"vintage_year":2005,"n":15033,"actual_smm":0.0087807,"pred_smm":0.010381,"actual_cpr":10.043,"pred_cpr":11.77},{"vintage_year":2006,"n":23783,"actual_smm":0.0067275,"pred_smm":0.010164,"actual_cpr":7.7809,"pred_cpr":11.538},{"vintage_year":2007,"n":21359,"actual_smm":0.0078187,"pred_smm":0.010814,"actual_cpr":8.9893,"pred_cpr":12.232},{"vintage_year":2008,"n":16387,"actual_smm":0.0057363,"pred_smm":0.012674,"actual_cpr":6.6704,"pred_cpr":14.192},{"vintage_year":2009,"n":20520,"actual_smm":0.0080897,"pred_smm":0.012279,"actual_cpr":9.2871,"pred_cpr":13.779},{"vintage_year":2010,"n":34637,"actual_smm":0.012126,"pred_smm":0.010119,"actual_cpr":13.619,"pred_cpr":11.489},{"vintage_year":2011,"n":59180,"actual_smm":0.011778,"pred_smm":0.010203,"actual_cpr":13.253,"pred_cpr":11.58},{"vintage_year":2012,"n":110232,"actual_smm":0.0095617,"pred_smm":0.0068603,"actual_cpr":10.889,"pred_cpr":7.9288},{"vintage_year":2013,"n":115805,"actual_smm":0.010794,"pred_smm":0.0085976,"actual_cpr":12.211,"pred_cpr":9.843},{"vintage_year":2014,"n":82901,"actual_smm":0.010893,"pred_smm":0.010171,"actual_cpr":12.316,"pred_cpr":11.545},{"vintage_year":2015,"n":79816,"actual_smm":0.010198,"pred_smm":0.0093718,"actual_cpr":11.575,"pred_cpr":10.684},{"vintage_year":2016,"n":77895,"actual_smm":0.0094358,"pred_smm":0.0089781,"actual_cpr":10.753,"pred_cpr":10.257},{"vintage_year":2017,"n":96823,"actual_smm":0.0075912,"pred_smm":0.0090102,"actual_cpr":8.7385,"pred_cpr":10.292},{"vintage_year":2018,"n":76942,"actual_smm":0.011216,"pred_smm":0.0097494,"actual_cpr":12.659,"pred_cpr":11.092},{"vintage_year":2019,"n":62544,"actual_smm":0.007163,"pred_smm":0.0074538,"actual_cpr":8.2649,"pred_cpr":8.5869},{"vintage_year":2020,"n":103858,"actual_smm":0.002696,"pred_smm":0.0043285,"actual_cpr":3.1876,"pred_cpr":5.0723},{"vintage_year":2021,"n":104851,"actual_smm":0.0012303,"pred_smm":0.0010238,"actual_cpr":1.4664,"pred_cpr":1.2216},{"vintage_year":2022,"n":46952,"actual_smm":0.0011288,"pred_smm":0.0011953,"actual_cpr":1.3462,"pred_cpr":1.425},{"vintage_year":2023,"n":14672,"actual_smm":0.0016358,"pred_smm":0.0031944,"actual_cpr":1.9454,"pred_cpr":3.7666},{"vintage_year":2024,"n":8165,"actual_smm":0.0030618,"pred_smm":0.0032732,"actual_cpr":3.613,"pred_cpr":3.8579},{"vintage_year":2025,"n":4664,"actual_smm":0.0034305,"pred_smm":0.0036473,"actual_cpr":4.0398,"pred_cpr":4.2901}],"age_cuts":[{"age_bucket":"0-12","n":81463,"actual_smm":0.0037195,"pred_smm":0.0051495,"actual_cpr":4.3732,"pred_cpr":6.0074},{"age_bucket":"13-24","n":88497,"actual_smm":0.0055595,"pred_smm":0.0057442,"actual_cpr":6.4712,"pred_cpr":6.6794},{"age_bucket":"25-36","n":105669,"actual_smm":0.0065771,"pred_smm":0.0062063,"actual_cpr":7.6132,"pred_cpr":7.1985},{"age_bucket":"37-48","n":113613,"actual_smm":0.0064693,"pred_smm":0.0066492,"actual_cpr":7.4928,"pred_cpr":7.6935},{"age_bucket":"49-60","n":108008,"actual_smm":0.0071476,"pred_smm":0.0074081,"actual_cpr":8.2479,"pred_cpr":8.5362},{"age_bucket":"61-72","n":95571,"actual_smm":0.0095322,"pred_smm":0.0085322,"actual_cpr":10.858,"pred_cpr":9.7715},{"age_bucket":"73-96","n":190797,"actual_smm":0.0098639,"pred_smm":0.008964,"actual_cpr":11.215,"pred_cpr":10.242},{"age_bucket":"97-120","n":151497,"actual_smm":0.011406,"pred_smm":0.0095089,"actual_cpr":12.861,"pred_cpr":10.832},{"age_bucket":"120+","n":290806,"actual_smm":0.0072626,"pred_smm":0.0080608,"actual_cpr":8.3753,"pred_cpr":9.2554}],"issuer_cuts":[{"issuer_key":"berkadia","n":106649,"actual_smm":0.0086171,"pred_smm":0.0089644,"events":919,"actual_cpr":9.8642,"pred_cpr":10.242,"issuer_label":"Berkadia"},{"issuer_key":"capital_funding","n":41909,"actual_smm":0.006013,"pred_smm":0.0058001,"events":252,"actual_cpr":6.9817,"pred_cpr":6.7423,"issuer_label":"Capital Funding"},{"issuer_key":"dwight","n":38790,"actual_smm":0.0076051,"pred_smm":0.0067173,"events":295,"actual_cpr":8.7539,"pred_cpr":7.7695,"issuer_label":"Dwight Capital"},{"issuer_key":"merchants","n":71625,"actual_smm":0.006185,"pred_smm":0.0063737,"events":443,"actual_cpr":7.1746,"pred_cpr":7.3859,"issuer_label":"Merchants Capital"},{"issuer_key":"other","n":781279,"actual_smm":0.0078256,"pred_smm":0.0075793,"events":6114,"actual_cpr":8.9969,"pred_cpr":8.7254,"issuer_label":"Other (Lument+ORIX, Greystone, ~70 small)"},{"issuer_key":"pnc","n":44798,"actual_smm":0.006853,"pred_smm":0.0075113,"events":307,"actual_cpr":7.9206,"pred_cpr":8.6504,"issuer_label":"PNC Bank"},{"issuer_key":"walker_dunlop","n":87185,"actual_smm":0.0092332,"pred_smm":0.0089142,"events":805,"actual_cpr":10.534,"pred_cpr":10.188,"issuer_label":"Walker & Dunlop"},{"issuer_key":"wells_fargo","n":53686,"actual_smm":0.0092203,"pred_smm":0.0092801,"events":495,"actual_cpr":10.52,"pred_cpr":10.585,"issuer_label":"Wells Fargo"}],"scurve_calib":[{"ri_bucket":0,"ri_mid":-297.02,"mean_x_std":[-1.2692,0.18069,-0.24549,0.35271,0.5976,-0.3094,-0.24126,0.032452,-0.053691,-0.12177,0.025456,-0.0061018,0.019883,-0.056426,-0.054233,-0.081149,-0.052359,0.11141],"mean_pred":"0.0019010488","mean_actual":"0.0019196736","n":366729},{"ri_bucket":1,"ri_mid":-175.0,"mean_x_std":[-0.64446,-0.11566,0.13948,-0.026485,-0.014527,0.48382,0.053428,0.030259,-0.13199,0.051375,0.018965,0.038391,0.05133,-0.016135,-0.031126,-0.011646,-0.051231,-0.02978],"mean_pred":"0.0038155841","mean_actual":"0.0036316025","n":104637},{"ri_bucket":2,"ri_mid":-125.01,"mean_x_std":[-0.38851,-0.15588,0.078985,-0.090735,-0.0081416,0.39368,0.14337,0.0040165,-0.10448,0.15632,-0.031285,0.042021,0.059978,-0.005753,-0.0028928,-0.017338,-0.045168,-0.036874],"mean_pred":"0.0044734594","mean_actual":"0.0036922197","n":98044},{"ri_bucket":3,"ri_mid":-74.599,"mean_x_std":[-0.1304,0.039259,-0.22451,0.02907,0.12112,-0.066485,0.35405,0.042867,-0.069523,0.097244,-0.088704,0.040554,0.018498,-0.029418,0.012838,-0.040668,-0.065926,0.010083],"mean_pred":"0.005210853","mean_actual":"0.0043229125","n":98776},{"ri_bucket":4,"ri_mid":-37.378,"mean_x_std":[0.060168,0.17734,-0.32874,0.073055,0.059117,-0.28576,0.3091,0.086443,-0.061429,0.058971,-0.08346,0.043916,-0.001077,-0.031995,0.0052935,-0.036014,-0.068379,0.033219],"mean_pred":"0.0062326076","mean_actual":"0.004260499","n":49290},{"ri_bucket":5,"ri_mid":-12.338,"mean_x_std":[0.18837,0.21152,-0.32385,0.083939,-0.067134,-0.33359,0.24234,0.098769,-0.051209,0.010802,-0.071008,0.029086,-0.016771,-0.027234,0.0061237,-0.028055,-0.035506,0.03098],"mean_pred":"0.007328185","mean_actual":"0.004697907","n":50448},{"ri_bucket":6,"ri_mid":12.883,"mean_x_std":[0.31751,0.22265,-0.29411,0.084513,-0.1735,-0.28144,0.25237,0.087788,-0.064249,-0.027602,-0.064608,0.043375,-0.0016852,0.0027072,-0.019844,-0.021261,-0.0065011,0.01166],"mean_pred":"0.00877593","mean_actual":"0.0074256966","n":53867},{"ri_bucket":7,"ri_mid":37.74,"mean_x_std":[0.44478,0.23461,-0.22535,0.0695,-0.22874,-0.19241,0.19826,0.058826,-0.027947,-0.058493,-0.039338,0.0003739,0.010398,0.018445,-0.013278,0.00050464,0.028613,-0.0031291],"mean_pred":"0.010469369","mean_actual":"0.010309278","n":58006},{"ri_bucket":8,"ri_mid":74.75,"mean_x_std":[0.63428,0.20949,-0.097735,-0.027592,-0.28984,-0.011973,0.14855,0.026969,-0.0073113,-0.059372,-0.0040547,-0.0078128,-0.010662,0.028944,0.013013,0.035118,0.04156,-0.026089],"mean_pred":"0.013015923","mean_actual":"0.015269801","n":116308},{"ri_bucket":9,"ri_mid":123.46,"mean_x_std":[0.88367,0.13737,0.090105,-0.23585,-0.33973,0.18838,0.12012,-0.0032658,0.017188,0.060819,0.0084742,0.052262,-0.039882,0.014368,0.032121,0.084481,0.035557,-0.087443],"mean_pred":"0.015819514","mean_actual":"0.021714626","n":90492},{"ri_bucket":10,"ri_mid":172.74,"mean_x_std":[1.136,-0.051042,0.33327,-0.45954,-0.35978,0.29144,-0.059764,-0.1073,0.11864,0.26198,0.010987,0.027645,-0.022528,0.051249,0.045487,0.11978,0.031705,-0.15587],"mean_pred":"0.018124051","mean_actual":"0.022734338","n":54675},{"ri_bucket":11,"ri_mid":322.91,"mean_x_std":[1.9049,-1.3322,1.2062,-1.2017,-0.37112,0.17282,-0.51992,-0.36027,0.41022,0.28458,-0.029184,0.0093961,-0.10052,0.16253,-0.040532,0.45522,0.31724,-0.17463],"mean_pred":"0.020161603","mean_actual":"0.015688313","n":84649}],"yearly_calib":[{"year":2018,"mean_x_std":[0.01923,0.1799,-0.26506,-0.08639,-0.3731,-1.3233,-1.1391,-0.0082481,0.094521,-0.083273,-0.049875,0.015597,-0.012121,0.063926,0.032095,0.055324,0.050013,-0.087994],"mean_pred":"0.0044130683","mean_actual":"0.0050553153","n":13649},{"year":2019,"mean_x_std":[0.38125,0.1818,-0.20415,-0.07682,-0.37306,-0.99767,-0.69154,-0.0055755,0.064444,-0.070274,-0.037426,0.016468,-0.012573,0.057787,0.024337,0.045818,0.039619,-0.080847],"mean_pred":"0.0073256106","mean_actual":"0.004811146","n":165657},{"year":2020,"mean_x_std":[0.90648,0.17037,-0.12645,-0.059614,-0.37306,-0.36886,0.0053806,0.010797,0.023683,-0.035512,-0.023062,0.024223,-0.011979,0.041088,0.0053689,0.026533,0.021476,-0.053971],"mean_pred":"0.0151574565","mean_actual":"0.016811837","n":167620},{"year":2021,"mean_x_std":[0.80647,0.1417,-0.12019,-0.045757,-0.17983,0.081795,0.53106,0.019472,0.034638,-0.0025438,-0.042787,0.030143,-0.0042835,0.006957,-0.0075031,0.0097057,0.005781,-0.013428],"mean_pred":"0.016299214","mean_actual":"0.019769298","n":164801},{"year":2022,"mean_x_std":[-0.23931,0.084426,-0.10684,-0.015299,0.13057,0.33075,0.48612,0.011499,0.0049401,0.020837,-0.040306,0.024618,0.024176,-0.01958,-0.023043,0.0051694,-0.0097183,0.032721],"mean_pred":"0.0070532556","mean_actual":"0.008021714","n":165052},{"year":2023,"mean_x_std":[-0.91019,-0.067109,-0.019909,0.012751,0.28643,0.27934,0.066817,-0.0069992,-0.041228,0.047251,-0.011052,0.013489,0.01774,-0.031499,-0.034606,0.0058897,-0.022185,0.048088],"mean_pred":"0.0032145826","mean_actual":"0.002647269","n":169231},{"year":2024,"mean_x_std":[-0.8642,-0.16212,0.10559,0.029045,0.39724,0.23949,-0.11146,-0.0093603,-0.073384,0.073534,0.016493,0.0097809,0.013047,-0.039837,-0.03547,0.0029874,-0.024137,0.03573],"mean_pred":"0.003142908","mean_actual":"0.0021104366","n":172950},{"year":2025,"mean_x_std":[-0.801,-0.23511,0.21901,0.057069,0.52209,0.22453,-0.15287,0.0012886,-0.10466,0.078251,0.037578,0.0094019,0.0054107,-0.044682,-0.039691,-0.003844,-0.024228,0.049716],"mean_pred":"0.0032134505","mean_actual":"0.002666245","n":177028},{"year":2026,"mean_x_std":[-0.49722,-0.28089,0.27402,0.075099,0.60554,0.22784,-0.13179,0.0080678,-0.12144,0.079327,0.042535,0.011746,0.0045637,-0.049057,-0.042177,-0.0094935,-0.02338,0.061667],"mean_pred":"0.0042908723","mean_actual":"0.0026392275","n":29933}],"monthly_calib":[{"period":"201812","mean_x_std":[0.01923,0.1799,-0.26506,-0.08639,-0.3731,-1.3233,-1.1391,-0.0082481,0.094521,-0.083273,-0.049875,0.015597,-0.012121,0.063926,0.032095,0.055324,0.050013,-0.087994],"mean_pred":"0.0044130683","mean_actual":"0.0050553153","n":13649},{"period":"201901","mean_x_std":[0.031686,0.18191,-0.25484,-0.085074,-0.3731,-1.2837,-1.0723,-0.0094309,0.090692,-0.081652,-0.04702,0.015289,-0.011354,0.064091,0.032281,0.053046,0.048927,-0.087518],"mean_pred":"0.0045259786","mean_actual":"0.001612785","n":13641},{"period":"201902","mean_x_std":[0.018488,0.18304,-0.24486,-0.08349,-0.3731,-1.2454,-1.011,-0.0080725,0.087163,-0.081359,-0.045967,0.015028,-0.011865,0.061695,0.03089,0.052603,0.047411,-0.086574],"mean_pred":"0.0045198128","mean_actual":"0.0040178243","n":13689},{"period":"201903","mean_x_std":[0.15875,0.18455,-0.23333,-0.08359,-0.3731,-1.1975,-0.94166,-0.0087878,0.082256,-0.078595,-0.044125,0.014228,-0.011499,0.060344,0.029299,0.051449,0.046972,-0.085711],"mean_pred":"0.005296422","mean_actual":"0.0030688294","n":13686},{"period":"201904","mean_x_std":[0.20682,0.18372,-0.22374,-0.081316,-0.3731,-1.1469,-0.86775,-0.0091538,0.076875,-0.078026,-0.041127,0.015217,-0.010774,0.059707,0.027348,0.048591,0.045699,-0.085203],"mean_pred":"0.005654792","mean_actual":"0.0039315615","n":13735},{"period":"201905","mean_x_std":[0.41339,0.18549,-0.2152,-0.079487,-0.3731,-1.0902,-0.79127,-0.0088556,0.072019,-0.076492,-0.04054,0.016178,-0.010509,0.058934,0.026045,0.04703,0.044642,-0.084088],"mean_pred":"0.007114498","mean_actual":"0.0039982554","n":13756},{"period":"201906","mean_x_std":[0.42947,0.18661,-0.20776,-0.075435,-0.3731,-1.0337,-0.72239,-0.0091832,0.067351,-0.073552,-0.035515,0.015363,-0.011925,0.057323,0.025137,0.046951,0.042639,-0.083025],"mean_pred":"0.0073763896","mean_actual":"0.004860708","n":13784},{"period":"201907","mean_x_std":[0.49316,0.18363,-0.19878,-0.075386,-0.3731,-0.97643,-0.6535,-0.0090903,0.061736,-0.065961,-0.034703,0.016496,-0.011948,0.057268,0.023186,0.045907,0.038343,-0.081201],"mean_pred":"0.007990128","mean_actual":"0.0049920417","n":13822},{"period":"201908","mean_x_std":[0.67726,0.18391,-0.19192,-0.074802,-0.3731,-0.91696,-0.58099,-0.0043048,0.056251,-0.064511,-0.034229,0.017392,-0.012993,0.056076,0.022903,0.044292,0.034649,-0.079711],"mean_pred":"0.009814539","mean_actual":"0.0040441975","n":13847},{"period":"201909","mean_x_std":[0.59083,0.18071,-0.18317,-0.072692,-0.3731,-0.85871,-0.51285,-0.0021112,0.051991,-0.063504,-0.033568,0.016066,-0.014202,0.056084,0.022125,0.043706,0.032762,-0.077468],"mean_pred":"0.009150637","mean_actual":"0.004754358","n":13882},{"period":"201910","mean_x_std":[0.60781,0.17699,-0.17404,-0.071689,-0.3731,-0.80075,-0.44702,0.00036391,0.04724,-0.06151,-0.032301,0.017331,-0.01467,0.055882,0.019872,0.042448,0.032072,-0.075598],"mean_pred":"0.009475166","mean_actual":"0.0067577283","n":13910},{"period":"201911","mean_x_std":[0.50506,0.17607,-0.16583,-0.071054,-0.3731,-0.74549,-0.38938,-0.00013732,0.043554,-0.06019,-0.031729,0.016334,-0.014561,0.053912,0.018248,0.037506,0.031777,-0.072786],"mean_pred":"0.008686501","mean_actual":"0.0060336157","n":13922},{"period":"201912","mean_x_std":[0.42688,0.17475,-0.15895,-0.068301,-0.3731,-0.69362,-0.32946,0.0016082,0.037703,-0.058679,-0.028691,0.022488,-0.014345,0.052386,0.015298,0.036915,0.030034,-0.071599],"mean_pred":"0.008161757","mean_actual":"0.00951155","n":13983},{"period":"202001","mean_x_std":[0.65569,0.17317,-0.15374,-0.065102,-0.3731,-0.63819,-0.26966,0.0040859,0.032129,-0.057619,-0.027092,0.023899,-0.014453,0.049505,0.013388,0.032776,0.028807,-0.069855],"mean_pred":"0.010509892","mean_actual":"0.007372414","n":13971},{"period":"202002","mean_x_std":[0.77297,0.17442,-0.14473,-0.064119,-0.3731,-0.58111,-0.21735,0.004625,0.029212,-0.056954,-0.025233,0.023972,-0.013446,0.047179,0.013223,0.033644,0.027155,-0.068576],"mean_pred":"0.012070413","mean_actual":"0.011313189","n":13966},{"period":"202003","mean_x_std":[0.78197,0.17267,-0.13725,-0.063924,-0.3731,-0.52747,-0.1634,0.0057466,0.026554,-0.056499,-0.02604,0.024545,-0.012338,0.046349,0.0099311,0.03027,0.027168,-0.065182],"mean_pred":"0.012396973","mean_actual":"0.0106771765","n":13955},{"period":"202004","mean_x_std":[0.87533,0.17087,-0.13176,-0.061716,-0.3731,-0.47548,-0.11359,0.0055687,0.027015,-0.038633,-0.022975,0.021424,-0.012299,0.047431,0.0087794,0.029232,0.025263,-0.058705],"mean_pred":"0.013876871","mean_actual":"0.013170138","n":13971},{"period":"202005","mean_x_std":[0.90614,0.17227,-0.12752,-0.060022,-0.3731,-0.42556,-0.062107,0.0079136,0.024575,-0.037494,-0.023268,0.020968,-0.011734,0.045645,0.0079031,0.026823,0.024685,-0.056254],"mean_pred":"0.014591152","mean_actual":"0.015528839","n":13974},{"period":"202006","mean_x_std":[0.92603,0.17143,-0.12221,-0.061775,-0.3731,-0.37998,-0.012095,0.010695,0.019271,-0.033301,-0.022159,0.024447,-0.012003,0.044309,0.0067553,0.026183,0.020257,-0.053507],"mean_pred":"0.015113626","mean_actual":"0.017941387","n":13990},{"period":"202007","mean_x_std":[1.0313,0.17159,-0.12318,-0.057618,-0.3731,-0.33733,0.038183,0.012235,0.020476,-0.03211,-0.018942,0.024597,-0.011997,0.040525,0.0044871,0.026301,0.018066,-0.046667],"mean_pred":"0.017135654","mean_actual":"0.017275842","n":14008},{"period":"202008","mean_x_std":[1.0536,0.1706,-0.12115,-0.056978,-0.3731,-0.29577,0.081237,0.014524,0.017174,-0.028985,-0.018715,0.024481,-0.011211,0.037277,0.0010792,0.026178,0.017374,-0.046742],"mean_pred":"0.017821595","mean_actual":"0.016980594","n":14016},{"period":"202009","mean_x_std":[1.0511,0.17153,-0.11837,-0.055162,-0.3731,-0.253,0.12837,0.014992,0.019453,-0.02703,-0.019945,0.023406,-0.012868,0.035407,0.0021156,0.024775,0.017378,-0.045815],"mean_pred":"0.018112691","mean_actual":"0.017350946","n":14005},{"period":"202010","mean_x_std":[0.91554,0.16983,-0.1145,-0.057034,-0.3731,-0.20973,0.1745,0.016681,0.020323,-0.022418,-0.022694,0.023399,-0.012092,0.034875,-0.00028836,0.023233,0.01854,-0.047199],"mean_pred":"0.016042648","mean_actual":"0.02189311","n":13977},{"period":"202011","mean_x_std":[0.94505,0.16324,-0.10944,-0.057857,-0.3731,-0.16799,0.21489,0.017164,0.022802,-0.018869,-0.023111,0.02689,-0.0093819,0.034039,-0.00023436,0.020721,0.017627,-0.046131],"mean_pred":"0.01679881","mean_actual":"0.023295945","n":13908},{"period":"202012","mean_x_std":[0.96221,0.16207,-0.11351,-0.054038,-0.3731,-0.1332,0.26717,0.015429,0.025224,-0.01628,-0.026514,0.028566,-0.0098151,0.030386,-0.0026396,0.018383,0.015253,-0.042944],"mean_pred":"0.017415944","mean_actual":"0.029036675","n":13879},{"period":"202101","mean_x_std":[0.92546,0.15847,-0.11522,-0.056471,-0.36401,-0.10011,0.31477,0.017099,0.028963,-0.014089,-0.028158,0.028939,-0.0088934,0.023906,-0.0023454,0.010813,0.013437,-0.040202],"mean_pred":"0.017025659","mean_actual":"0.0204052","n":13771},{"period":"202102","mean_x_std":[0.81308,0.15239,-0.11291,-0.054732,-0.33429,-0.065609,0.35183,0.020195,0.031562,-0.011345,-0.031185,0.031899,-0.0094833,0.021485,0.0004461,0.0096426,0.010145,-0.034735],"mean_pred":"0.015416597","mean_actual":"0.022950105","n":13769},{"period":"202103","mean_x_std":[0.68789,0.14894,-0.11338,-0.05394,-0.29811,-0.034554,0.3912,0.022798,0.034173,-0.012141,-0.034113,0.032828,-0.0056314,0.016675,-0.0010801,0.010129,0.010542,-0.03048],"mean_pred":"0.013758","mean_actual":"0.018963888","n":13763},{"period":"202104","mean_x_std":[0.73153,0.1453,-0.11635,-0.049765,-0.26308,-0.00038692,0.4354,0.021998,0.033537,-0.01099,-0.036827,0.031526,-0.004747,0.013817,-0.0027927,0.010085,0.0094442,-0.02716],"mean_pred":"0.0145891495","mean_actual":"0.022955107","n":13766},{"period":"202105","mean_x_std":[0.80149,0.14259,-0.12124,-0.048107,-0.22041,0.02701,0.47944,0.020341,0.038417,-0.0060274,-0.042569,0.032486,-0.0049189,0.010791,-0.0089593,0.010601,0.0091158,-0.020362],"mean_pred":"0.015819946","mean_actual":"0.018025875","n":13758},{"period":"202106","mean_x_std":[0.85552,0.14004,-0.12135,-0.0493,-0.19031,0.06555,0.52509,0.020928,0.041073,-0.0049191,-0.044585,0.032745,-0.0038294,0.0076459,-0.0091762,0.012041,0.0075604,-0.015225],"mean_pred":"0.01693144","mean_actual":"0.019906664","n":13714},{"period":"202107","mean_x_std":[0.91919,0.1422,-0.12364,-0.045609,-0.15446,0.098616,0.56899,0.017739,0.039392,0.0023337,-0.046351,0.031484,-0.0063373,0.004828,-0.0091762,0.013244,0.0049815,-0.0093358],"mean_pred":"0.018288124","mean_actual":"0.015969083","n":13714},{"period":"202108","mean_x_std":[0.86005,0.13953,-0.12223,-0.043751,-0.12778,0.13701,0.60391,0.019081,0.03757,0.0039805,-0.047342,0.028891,-0.0037353,0.003436,-0.010371,0.012779,0.0021522,-0.0069439],"mean_pred":"0.017493306","mean_actual":"0.017018478","n":13691},{"period":"202109","mean_x_std":[0.81379,0.13866,-0.12334,-0.039924,-0.096288,0.16919,0.63392,0.018396,0.035504,0.0052024,-0.049412,0.028841,-0.0024046,-0.00093383,-0.0096132,0.010721,0.0024782,0.00023612],"mean_pred":"0.01696025","mean_actual":"0.019166302","n":13722},{"period":"202110","mean_x_std":[0.78901,0.13418,-0.12271,-0.039816,-0.064573,0.20107,0.66552,0.019826,0.034944,0.0053789,-0.052349,0.0288,-0.0013308,-0.0037141,-0.011874,0.0086737,0.0014991,0.0014054],"mean_pred":"0.016747361","mean_actual":"0.01839819","n":13697},{"period":"202111","mean_x_std":[0.76949,0.13137,-0.1242,-0.035418,-0.036603,0.22972,0.68953,0.017477,0.031898,0.0052408,-0.050246,0.025931,-0.00048889,-0.0061837,-0.013713,0.0051353,-0.0021163,0.0082523],"mean_pred":"0.016674325","mean_actual":"0.019897958","n":13720},{"period":"202112","mean_x_std":[0.71139,0.12599,-0.12579,-0.032122,-0.0062287,0.25635,0.71555,0.017819,0.028547,0.006828,-0.050372,0.027251,0.00052321,-0.0085876,-0.011425,0.0027846,3.6322e-05,0.013775],"mean_pred":"0.015906101","mean_actual":"0.02354914","n":13716},{"period":"202201","mean_x_std":[0.59034,0.12223,-0.12292,-0.033047,0.01672,0.2895,0.74153,0.019138,0.024688,0.011716,-0.051126,0.030012,0.017684,-0.01199,-0.012506,0.0017209,-0.001254,0.018109],"mean_pred":"0.014204539","mean_actual":"0.010007358","n":13590},{"period":"202202","mean_x_std":[0.46069,0.12055,-0.1211,-0.029853,0.040429,0.32151,0.75511,0.022465,0.023448,0.011248,-0.048588,0.029363,0.019476,-0.013392,-0.013351,0.0011506,-0.0028356,0.019633],"mean_pred":"0.012642791","mean_actual":"0.012079063","n":13660},{"period":"202203","mean_x_std":[0.20811,0.11531,-0.1184,-0.025169,0.064565,0.33952,0.69941,0.022099,0.023085,0.010562,-0.045892,0.031776,0.020365,-0.015323,-0.016535,0.0014703,-0.0033622,0.024602],"mean_pred":"0.009916769","mean_actual":"0.011537057","n":13695},{"period":"202204","mean_x_std":[-0.12078,0.11552,-0.11803,-0.021523,0.087803,0.33988,0.6131,0.018819,0.017283,0.014605,-0.044731,0.030132,0.020505,-0.019211,-0.016749,0.0023279,-0.0064985,0.029278],"mean_pred":"0.0071457536","mean_actual":"0.008163265","n":13720},{"period":"202205","mean_x_std":[-0.11717,0.10466,-0.11622,-0.019158,0.10887,0.34423,0.54629,0.017252,0.012552,0.017952,-0.042641,0.028399,0.022169,-0.018304,-0.019,0.0023109,-0.0080544,0.032155],"mean_pred":"0.00721451","mean_actual":"0.011031279","n":13779},{"period":"202206","mean_x_std":[-0.26525,0.095948,-0.11245,-0.017392,0.1284,0.34264,0.48635,0.011798,0.0095955,0.02032,-0.041665,0.024827,0.024609,-0.019169,-0.02425,0.0064879,-0.010082,0.034869],"mean_pred":"0.006210554","mean_actual":"0.008135987","n":13766},{"period":"202207","mean_x_std":[-0.12103,0.084714,-0.10731,-0.015913,0.14537,0.35315,0.46195,0.0098296,0.0049473,0.023269,-0.041078,0.021853,0.026111,-0.020616,-0.025407,0.0088433,-0.011174,0.036079],"mean_pred":"0.0072323936","mean_actual":"0.005447019","n":13769},{"period":"202208","mean_x_std":[-0.38025,0.075414,-0.10149,-0.011523,0.16107,0.35218,0.41508,0.0072993,-0.00074881,0.025785,-0.038591,0.022339,0.026571,-0.020957,-0.02586,0.0088994,-0.010412,0.035705],"mean_pred":"0.005554833","mean_actual":"0.008555064","n":13793},{"period":"202209","mean_x_std":[-0.73318,0.064206,-0.098588,-0.0049745,0.17739,0.33942,0.35446,0.0044651,-0.0065985,0.025266,-0.034761,0.020307,0.02665,-0.022652,-0.027707,0.0077594,-0.013403,0.037859],"mean_pred":"0.0038558445","mean_actual":"0.00783233","n":13789},{"period":"202210","mean_x_std":[-0.94753,0.049398,-0.093227,-0.0052213,0.19517,0.32604,0.29489,0.0059317,-0.012328,0.027214,-0.035026,0.01999,0.032092,-0.023254,-0.02895,0.0066612,-0.016588,0.03797],"mean_pred":"0.0030710844","mean_actual":"0.005514439","n":13782},{"period":"202211","mean_x_std":[-0.67825,0.040291,-0.089628,-0.0018114,0.21197,0.31426,0.25478,0.00039887,-0.015797,0.031022,-0.031838,0.018883,0.032678,-0.023926,-0.033127,0.0071786,-0.016072,0.040137],"mean_pred":"0.004030864","mean_actual":"0.0037599423","n":13830},{"period":"202212","mean_x_std":[-0.74082,0.026054,-0.083418,0.0013494,0.22508,0.30648,0.22104,-0.00099088,-0.020112,0.030601,-0.028041,0.017769,0.02116,-0.025999,-0.032654,0.0072818,-0.0166,0.045599],"mean_pred":"0.0037624643","mean_actual":"0.004323078","n":13879},{"period":"202301","mean_x_std":[-0.54787,0.011584,-0.074855,0.0039793,0.23604,0.30288,0.20136,-0.00058578,-0.023148,0.031553,-0.025647,0.019473,0.02035,-0.027745,-0.033127,0.0065206,-0.018929,0.048499],"mean_pred":"0.004577635","mean_actual":"0.002229414","n":13905},{"period":"202302","mean_x_std":[-0.67216,-0.005235,-0.064736,0.0064759,0.24559,0.29948,0.17467,-0.0015516,-0.025518,0.03266,-0.022493,0.018804,0.019758,-0.027689,-0.033163,0.0066535,-0.019148,0.049387],"mean_pred":"0.004022336","mean_actual":"0.002078555","n":13952},{"period":"202303","mean_x_std":[-0.66017,-0.021149,-0.054956,0.009242,0.25486,0.29714,0.1524,-0.0024687,-0.029487,0.034455,-0.020098,0.01821,0.019265,-0.027911,-0.03338,0.0056756,-0.020021,0.050351],"mean_pred":"0.004066131","mean_actual":"0.0042875516","n":13994},{"period":"202304","mean_x_std":[-0.70255,-0.03217,-0.047285,0.0098879,0.26442,0.29158,0.12864,-0.0060869,-0.033726,0.041727,-0.01888,0.015461,0.018579,-0.028525,-0.03401,0.0050063,-0.020435,0.051259],"mean_pred":"0.0038791597","mean_actual":"0.0015698588","n":14014},{"period":"202305","mean_x_std":[-0.83716,-0.045847,-0.03625,0.010748,0.27271,0.28902,0.10406,-0.0073542,-0.037026,0.042497,-0.015988,0.012761,0.017692,-0.029154,-0.035389,0.0051433,-0.020648,0.053362],"mean_pred":"0.0033709712","mean_actual":"0.0022757982","n":14061},{"period":"202306","mean_x_std":[-0.86892,-0.063103,-0.024603,0.011597,0.27977,0.2859,0.082313,-0.006656,-0.040172,0.044104,-0.013021,0.013103,0.01673,-0.030991,-0.035742,0.0062247,-0.020111,0.054013],"mean_pred":"0.0032491148","mean_actual":"0.0034052213","n":14096},{"period":"202307","mean_x_std":[-0.93288,-0.08323,-0.015115,0.013799,0.28829,0.28105,0.057554,-0.0078374,-0.043925,0.047852,-0.0093845,0.010829,0.016108,-0.032584,-0.034433,0.0063804,-0.022215,0.055367],"mean_pred":"0.0030334177","mean_actual":"0.0017005597","n":14113},{"period":"202308","mean_x_std":[-1.0152,-0.098168,-0.0039069,0.015718,0.29607,0.27802,0.035662,-0.0073443,-0.045462,0.048627,-0.0076492,0.011215,0.015817,-0.033342,-0.034198,0.0055513,-0.022616,0.057693],"mean_pred":"0.0027788142","mean_actual":"0.002969247","n":14145},{"period":"202309","mean_x_std":[-1.2566,-0.10792,0.006954,0.014688,0.30663,0.27014,0.0038971,-0.0099384,-0.048619,0.05466,-0.004,0.011598,0.017347,-0.033415,-0.0353,0.0066665,-0.024511,0.057159],"mean_pred":"0.0021558802","mean_actual":"0.002609861","n":14177},{"period":"202310","mean_x_std":[-1.4762,-0.11407,0.013954,0.017545,0.32092,0.25741,-0.031833,-0.010405,-0.053124,0.05975,-0.0013215,0.010795,0.01714,-0.035206,-0.036886,0.0070049,-0.024969,0.033876],"mean_pred":"0.0017063874","mean_actual":"0.002036946","n":14237},{"period":"202311","mean_x_std":[-1.1195,-0.11918,0.024568,0.018287,0.32916,0.25254,-0.045937,-0.011564,-0.055795,0.062793,0.0016269,0.0099519,0.017132,-0.035626,-0.035073,0.0053967,-0.025876,0.033384],"mean_pred":"0.0024535367","mean_actual":"0.004344779","n":14270},{"period":"202312","mean_x_std":[-0.81318,-0.12287,0.033912,0.020587,0.33979,0.2489,-0.052665,-0.011767,-0.057785,0.065184,0.003404,0.0099916,0.017188,-0.035588,-0.03449,0.0046661,-0.02656,0.033025],"mean_pred":"0.003349405","mean_actual":"0.0022429381","n":14267},{"period":"202401","mean_x_std":[-0.81415,-0.12653,0.044838,0.020744,0.3486,0.24752,-0.062343,-0.011278,-0.060322,0.068106,0.0041439,0.010236,0.017869,-0.037431,-0.034701,0.0037333,-0.026798,0.032846],"mean_pred":"0.003338846","mean_actual":"0.0020309545","n":14279},{"period":"202402","mean_x_std":[-0.91666,-0.13514,0.056356,0.022668,0.35721,0.24541,-0.073316,-0.011913,-0.062483,0.069298,0.0071013,0.0099187,0.017425,-0.03807,-0.034062,0.003796,-0.026531,0.033701],"mean_pred":"0.0029952682","mean_actual":"0.0013283927","n":14303},{"period":"202403","mean_x_std":[-0.88636,-0.13743,0.067535,0.023074,0.36602,0.24419,-0.082343,-0.010613,-0.066031,0.070502,0.0090913,0.0086403,0.017361,-0.038182,-0.034694,0.0040816,-0.026749,0.033168],"mean_pred":"0.003079772","mean_actual":"0.0031382942","n":14339},{"period":"202404","mean_x_std":[-1.1278,-0.14479,0.080308,0.022905,0.37294,0.24203,-0.09949,-0.01198,-0.067103,0.072374,0.011787,0.010327,0.015072,-0.038444,-0.034853,0.0045459,-0.026877,0.033256],"mean_pred":"0.0023950215","mean_actual":"0.0012558432","n":14333},{"period":"202405","mean_x_std":[-1.013,-0.15376,0.092272,0.024029,0.3794,0.24109,-0.11047,-0.011769,-0.069208,0.073578,0.013483,0.009221,0.015851,-0.039066,-0.034991,0.0050038,-0.026592,0.03372],"mean_pred":"0.002686818","mean_actual":"0.0015324603","n":14356},{"period":"202406","mean_x_std":[-0.94843,-0.16057,0.10277,0.026238,0.38908,0.2387,-0.11784,-0.010394,-0.072157,0.075296,0.015185,0.0087239,0.015456,-0.039535,-0.035126,0.0041115,-0.024637,0.03356],"mean_pred":"0.0028602406","mean_actual":"0.0023620953","n":14394},{"period":"202407","mean_x_std":[-0.78545,-0.16829,0.1137,0.028667,0.39761,0.23858,-0.12504,-0.0098721,-0.073844,0.076573,0.017937,0.0098332,0.012045,-0.039621,-0.035248,0.0032539,-0.024039,0.034659],"mean_pred":"0.0033742108","mean_actual":"0.0017359905","n":14401},{"period":"202408","mean_x_std":[-0.72286,-0.1723,0.12399,0.030597,0.40833,0.23794,-0.12757,-0.009104,-0.076577,0.076004,0.019859,0.010547,0.010191,-0.04041,-0.036414,0.0031444,-0.022567,0.037308],"mean_pred":"0.0035876906","mean_actual":"0.0021471118","n":14438},{"period":"202409","mean_x_std":[-0.61314,-0.17759,0.13232,0.033008,0.42109,0.23771,-0.12557,-0.0072263,-0.079275,0.075633,0.020615,0.01001,0.009463,-0.040909,-0.036335,0.0037428,-0.022159,0.03829],"mean_pred":"0.0039973357","mean_actual":"0.0020029007","n":14479},{"period":"202410","mean_x_std":[-0.85206,-0.18329,0.14074,0.036698,0.43118,0.2354,-0.13076,-0.0067074,-0.08225,0.074351,0.023728,0.010003,0.008323,-0.041285,-0.036607,0.0014367,-0.02058,0.039019],"mean_pred":"0.003120839","mean_actual":"0.0025499656","n":14510},{"period":"202411","mean_x_std":[-0.76283,-0.19021,0.14969,0.038473,0.44137,0.2341,-0.1354,-0.0063886,-0.084295,0.075331,0.025135,0.0099833,0.010127,-0.042335,-0.036634,0.00064105,-0.02146,0.039333],"mean_pred":"0.0034101682","mean_actual":"0.0022005227","n":14542},{"period":"202412","mean_x_std":[-0.93136,-0.19426,0.15985,0.040929,0.45183,0.23175,-0.14559,-0.0052025,-0.086558,0.075124,0.029388,0.0099378,0.0077579,-0.042742,-0.035916,-0.0013094,-0.02092,0.039615],"mean_pred":"0.0028592013","mean_actual":"0.0030186607","n":14576},{"period":"202501","mean_x_std":[-0.92628,-0.20011,0.17018,0.042886,0.46014,0.22959,-0.15262,-0.0047685,-0.089888,0.077568,0.030701,0.0098729,0.0082603,-0.04247,-0.03704,0.00013604,-0.022959,0.040332],"mean_pred":"0.0028613717","mean_actual":"0.0017145601","n":14581},{"period":"202502","mean_x_std":[-0.79279,-0.20397,0.18052,0.045613,0.46895,0.23047,-0.15284,-0.0024455,-0.091673,0.077562,0.031246,0.010733,0.0057634,-0.04343,-0.037984,-0.00018627,-0.023692,0.039956],"mean_pred":"0.003275821","mean_actual":"0.0027386006","n":14606},{"period":"202503","mean_x_std":[-0.81145,-0.20745,0.18999,0.048736,0.48024,0.22978,-0.15297,-0.0018611,-0.094555,0.07869,0.032616,0.0088333,0.0044504,-0.043396,-0.038925,-0.00050748,-0.023698,0.042343],"mean_pred":"0.0032055255","mean_actual":"0.002118789","n":14631},{"period":"202504","mean_x_std":[-0.86618,-0.21197,0.20014,0.049695,0.49037,0.22972,-0.15333,-0.0013198,-0.096962,0.078568,0.033222,0.0096282,0.0051092,-0.043751,-0.039946,-0.0016421,-0.023078,0.043071],"mean_pred":"0.003020619","mean_actual":"0.0029329513","n":14661},{"period":"202505","mean_x_std":[-0.97194,-0.21839,0.20868,0.052185,0.50167,0.22682,-0.15794,-0.001953,-0.099504,0.078393,0.035962,0.0093711,0.0059374,-0.043328,-0.040281,-0.002271,-0.024432,0.046305],"mean_pred":"0.0026997426","mean_actual":"0.0017709965","n":14681},{"period":"202506","mean_x_std":[-0.86204,-0.22748,0.21732,0.053939,0.5131,0.22539,-0.15878,-0.00075303,-0.10222,0.079056,0.037165,0.0087953,0.006041,-0.043858,-0.040516,-0.0035864,-0.024344,0.049927],"mean_pred":"0.0030110832","mean_actual":"0.0024446556","n":14726},{"period":"202507","mean_x_std":[-0.91137,-0.2429,0.22699,0.056392,0.52381,0.225,-0.16098,0.00029198,-0.10553,0.079047,0.03872,0.0084769,0.005904,-0.043824,-0.040931,-0.0038992,-0.023629,0.052277],"mean_pred":"0.0028516187","mean_actual":"0.0036607687","n":14751},{"period":"202508","mean_x_std":[-0.80748,-0.24842,0.23451,0.059285,0.53673,0.22181,-0.16127,0.0012959,-0.10951,0.079388,0.040763,0.009368,0.0058187,-0.045062,-0.041039,-0.0038012,-0.024773,0.053495],"mean_pred":"0.0031575921","mean_actual":"0.002301496","n":14773},{"period":"202509","mean_x_std":[-0.72936,-0.25549,0.23975,0.063875,0.55113,0.21889,-0.15605,0.0047637,-0.11263,0.078442,0.042507,0.0098479,0.0048989,-0.045362,-0.039887,-0.0059571,-0.025812,0.054594],"mean_pred":"0.0034053978","mean_actual":"0.0014163351","n":14827},{"period":"202510","mean_x_std":[-0.6847,-0.26556,0.24737,0.06641,0.56291,0.22014,-0.14991,0.0061921,-0.11553,0.077969,0.042294,0.009499,0.004207,-0.046354,-0.040335,-0.0070368,-0.026206,0.055235],"mean_pred":"0.0035551656","mean_actual":"0.004165267","n":14885},{"period":"202511","mean_x_std":[-0.62382,-0.26678,0.25194,0.070607,0.57898,0.21876,-0.14275,0.0066691,-0.11711,0.077272,0.043045,0.0091071,0.0039736,-0.047032,-0.039576,-0.008151,-0.024424,0.057456],"mean_pred":"0.0037700825","mean_actual":"0.0016760526","n":14916},{"period":"202512","mean_x_std":[-0.63348,-0.27078,0.25796,0.074237,0.59343,0.21867,-0.13553,0.0089883,-0.11986,0.077003,0.042383,0.0093317,0.0047433,-0.048192,-0.03978,-0.0086726,-0.02371,0.060908],"mean_pred":"0.0037214558","mean_actual":"0.0050033354","n":14990},{"period":"202601","mean_x_std":[-0.54583,-0.27825,0.26827,0.074371,0.60192,0.22414,-0.13319,0.0087398,-0.12075,0.079133,0.042163,0.011521,0.0042346,-0.048278,-0.041459,-0.009156,-0.023545,0.061244],"mean_pred":"0.0040715323","mean_actual":"0.0024049703","n":14969},{"period":"202602","mean_x_std":[-0.44859,-0.28351,0.27976,0.075828,0.60919,0.23155,-0.1304,0.0073986,-0.12214,0.079523,0.04291,0.01197,0.004893,-0.049836,-0.042896,-0.0098316,-0.023213,0.062096],"mean_pred":"0.0045102844","mean_actual":"0.0028735632","n":14964}],"archetype_anchors":{"NC_221d4":{"id":"NC_221d4","name":"221(d)(4) New Construction","typical":{"mean_log_upb":16.063,"mean_upb":9461543.0,"is_hc_232":0,"is_223a7":0,"is_538":0,"lp_NC":1,"overall_actual_cpr":11.04,"overall_pred_cpr":10.046,"n_total":122763,"top_issuer":"other","mean_loan_rate":3.63},"age_curve":[{"age_bucket":"0-12","n":1477,"actual_smm":0.0047393,"pred_smm":0.0056136,"mean_age":6.436,"actual_cpr":5.5413,"pred_cpr":6.5321},{"age_bucket":"13-24","n":3039,"actual_smm":0.0085554,"pred_smm":0.0065339,"mean_age":19.876,"actual_cpr":9.797,"pred_cpr":7.5649},{"age_bucket":"25-36","n":10697,"actual_smm":0.015425,"pred_smm":0.0081357,"mean_age":31.286,"actual_cpr":17.018,"pred_cpr":9.3376},{"age_bucket":"37-48","n":15846,"actual_smm":0.010791,"pred_smm":0.0078071,"mean_age":42.606,"actual_cpr":12.208,"pred_cpr":8.9765},{"age_bucket":"49-60","n":15744,"actual_smm":0.0099721,"pred_smm":0.0085575,"mean_age":54.386,"actual_cpr":11.331,"pred_cpr":9.7993},{"age_bucket":"61-72","n":13312,"actual_smm":0.011193,"pred_smm":0.0093797,"mean_age":66.344,"actual_cpr":12.635,"pred_cpr":10.693},{"age_bucket":"73-96","n":22284,"actual_smm":0.007898,"pred_smm":0.0089562,"mean_age":83.914,"actual_cpr":9.0766,"pred_cpr":10.234},{"age_bucket":"97-120","n":15100,"actual_smm":0.0092053,"pred_smm":0.0094394,"mean_age":107.52,"actual_cpr":10.504,"pred_cpr":10.757},{"age_bucket":"120+","n":25264,"actual_smm":0.007956,"pred_smm":0.0094114,"mean_age":172.32,"actual_cpr":9.1403,"pred_cpr":10.727}]},"RP_223f":{"id":"RP_223f","name":"223(f) Acquisition/Refi","typical":{"mean_log_upb":15.439,"mean_upb":5068676.0,"is_hc_232":0,"is_223a7":0,"is_538":0,"lp_NC":0,"overall_actual_cpr":8.542,"overall_pred_cpr":8.4054,"n_total":464170,"top_issuer":"other","mean_loan_rate":3.39},"age_curve":[{"age_bucket":"0-12","n":41052,"actual_smm":0.0021193,"pred_smm":0.0049124,"mean_age":6.4551,"actual_cpr":2.5137,"pred_cpr":5.7382},{"age_bucket":"13-24","n":44293,"actual_smm":0.004696,"pred_smm":0.005707,"mean_age":18.59,"actual_cpr":5.4919,"pred_cpr":6.6374},{"age_bucket":"25-36","n":46848,"actual_smm":0.0054645,"pred_smm":0.006135,"mean_age":30.512,"actual_cpr":6.3638,"pred_cpr":7.1186},{"age_bucket":"37-48","n":46232,"actual_smm":0.0067053,"pred_smm":0.0065561,"mean_age":42.417,"actual_cpr":7.7562,"pred_cpr":7.5897},{"age_bucket":"49-60","n":41589,"actual_smm":0.0073818,"pred_smm":0.0072817,"mean_age":54.355,"actual_cpr":8.5072,"pred_cpr":8.3965},{"age_bucket":"61-72","n":35984,"actual_smm":0.010171,"pred_smm":0.0087362,"mean_age":66.413,"actual_cpr":11.545,"pred_cpr":9.9942},{"age_bucket":"73-96","n":65257,"actual_smm":0.011033,"pred_smm":0.0090475,"mean_age":84.187,"actual_cpr":12.465,"pred_cpr":10.333},{"age_bucket":"97-120","n":48575,"actual_smm":0.01124,"pred_smm":0.0083521,"mean_age":107.64,"actual_cpr":12.685,"pred_cpr":9.5747},{"age_bucket":"120+","n":94340,"actual_smm":0.0067946,"pred_smm":0.0076893,"mean_age":163.09,"actual_cpr":7.8556,"pred_cpr":8.8468}]},"RP_223a7":{"id":"RP_223a7","name":"223(a)(7) Streamlined Refi","typical":{"mean_log_upb":14.858,"mean_upb":2837516.0,"is_hc_232":0,"is_223a7":1,"is_538":0,"lp_NC":0,"overall_actual_cpr":9.5046,"overall_pred_cpr":10.288,"n_total":135978,"top_issuer":"other","mean_loan_rate":3.6},"age_curve":[{"age_bucket":"0-12","n":5466,"actual_smm":0.0032931,"pred_smm":0.005747,"mean_age":6.4468,"actual_cpr":3.8809,"pred_cpr":6.6826},{"age_bucket":"13-24","n":6044,"actual_smm":0.0043018,"pred_smm":0.0041464,"mean_age":18.66,"actual_cpr":5.0417,"pred_cpr":4.8638},{"age_bucket":"25-36","n":7108,"actual_smm":0.0011255,"pred_smm":0.0037052,"mean_age":30.601,"actual_cpr":1.3423,"pred_cpr":4.3568},{"age_bucket":"37-48","n":7741,"actual_smm":0.0054257,"pred_smm":0.0051983,"mean_age":42.586,"actual_cpr":6.32,"pred_cpr":6.0627},{"age_bucket":"49-60","n":7221,"actual_smm":0.0076167,"pred_smm":0.0066049,"mean_age":54.215,"actual_cpr":8.7667,"pred_cpr":7.6441},{"age_bucket":"61-72","n":5513,"actual_smm":0.011428,"pred_smm":0.0086027,"mean_age":66.791,"actual_cpr":12.883,"pred_cpr":9.8485},{"age_bucket":"73-96","n":18088,"actual_smm":0.010559,"pred_smm":0.0095135,"mean_age":85.036,"actual_cpr":11.961,"pred_cpr":10.837},{"age_bucket":"97-120","n":16995,"actual_smm":0.014534,"pred_smm":0.011287,"mean_age":107.8,"actual_cpr":16.112,"pred_cpr":12.735},{"age_bucket":"120+","n":61802,"actual_smm":0.0077182,"pred_smm":0.010397,"mean_age":189.21,"actual_cpr":8.8786,"pred_cpr":11.787}]},"NC_232":{"id":"NC_232","name":"232 Healthcare New Construction","typical":{"mean_log_upb":15.946,"mean_upb":8418553.0,"is_hc_232":1,"is_223a7":0,"is_538":0,"lp_NC":1,"overall_actual_cpr":11.415,"overall_pred_cpr":12.536,"n_total":15025,"top_issuer":"other","mean_loan_rate":3.85},"age_curve":[{"age_bucket":"0-12","n":554,"actual_smm":0,"pred_smm":0.0036778,"mean_age":6.2942,"actual_cpr":0,"pred_cpr":4.3252},{"age_bucket":"13-24","n":594,"actual_smm":0.0084175,"pred_smm":0.0060778,"mean_age":18.705,"actual_cpr":9.6462,"pred_cpr":7.0545},{"age_bucket":"25-36","n":896,"actual_smm":0.0078125,"pred_smm":0.0088825,"mean_age":30.907,"actual_cpr":8.9825,"pred_cpr":10.153},{"age_bucket":"37-48","n":1206,"actual_smm":0.0049751,"pred_smm":0.010877,"mean_age":42.782,"actual_cpr":5.8095,"pred_cpr":12.299},{"age_bucket":"49-60","n":1156,"actual_smm":0.011246,"pred_smm":0.014803,"mean_age":54.567,"actual_cpr":12.691,"pred_cpr":16.387},{"age_bucket":"61-72","n":1176,"actual_smm":0.015306,"pred_smm":0.013613,"mean_age":66.493,"actual_cpr":16.897,"pred_cpr":15.167},{"age_bucket":"73-96","n":2144,"actual_smm":0.012127,"pred_smm":0.012637,"mean_age":84.403,"actual_cpr":13.62,"pred_cpr":14.153},{"age_bucket":"97-120","n":1948,"actual_smm":0.01232,"pred_smm":0.013612,"mean_age":108.16,"actual_cpr":13.823,"pred_cpr":15.165},{"age_bucket":"120+","n":5351,"actual_smm":0.0097178,"pred_smm":0.0099648,"mean_age":196.71,"actual_cpr":11.058,"pred_cpr":11.324}]},"RP_232":{"id":"RP_232","name":"232/223(f) Healthcare Refi","typical":{"mean_log_upb":15.729,"mean_upb":6774866.0,"is_hc_232":1,"is_223a7":0,"is_538":0,"lp_NC":0,"overall_actual_cpr":8.8162,"overall_pred_cpr":8.5625,"n_total":296022,"top_issuer":"other","mean_loan_rate":3.38},"age_curve":[{"age_bucket":"0-12","n":25437,"actual_smm":0.0028698,"pred_smm":0.0051917,"mean_age":6.3857,"actual_cpr":3.39,"pred_cpr":6.0552},{"age_bucket":"13-24","n":24504,"actual_smm":0.0066928,"pred_smm":0.0064247,"mean_age":18.489,"actual_cpr":7.7422,"pred_cpr":7.443},{"age_bucket":"25-36","n":24994,"actual_smm":0.0064816,"pred_smm":0.0069207,"mean_age":30.522,"actual_cpr":7.5065,"pred_cpr":7.9959},{"age_bucket":"37-48","n":25309,"actual_smm":0.0051365,"pred_smm":0.007011,"mean_age":42.519,"actual_cpr":5.9926,"pred_cpr":8.0962},{"age_bucket":"49-60","n":25225,"actual_smm":0.0059861,"pred_smm":0.0076175,"mean_age":54.481,"actual_cpr":6.9515,"pred_cpr":8.7676},{"age_bucket":"61-72","n":24892,"actual_smm":0.008798,"pred_smm":0.0084017,"mean_age":66.559,"actual_cpr":10.061,"pred_cpr":9.629},{"age_bucket":"73-96","n":51930,"actual_smm":0.010264,"pred_smm":0.0091461,"mean_age":84.469,"actual_cpr":11.645,"pred_cpr":10.44},{"age_bucket":"97-120","n":42906,"actual_smm":0.010511,"pred_smm":0.009763,"mean_age":107.82,"actual_cpr":11.909,"pred_cpr":11.107},{"age_bucket":"120+","n":50825,"actual_smm":0.007575,"pred_smm":0.0052128,"mean_age":146.18,"actual_cpr":8.7207,"pred_cpr":6.0791}]},"538":{"id":"538","name":"538 USDA Rural","typical":{"mean_log_upb":13.9,"mean_upb":1088102.0,"is_hc_232":0,"is_223a7":0,"is_538":1,"lp_NC":0,"overall_actual_cpr":4.6835,"overall_pred_cpr":4.9569,"n_total":81218,"top_issuer":"other","mean_loan_rate":4.45},"age_curve":[{"age_bucket":"0-12","n":3151,"actual_smm":0.027293,"pred_smm":0.0022523,"mean_age":6.5129,"actual_cpr":28.256,"pred_cpr":2.6695},{"age_bucket":"13-24","n":4951,"actual_smm":0.0066653,"pred_smm":0.002937,"mean_age":19.065,"actual_cpr":7.7116,"pred_cpr":3.468},{"age_bucket":"25-36","n":7934,"actual_smm":0.0074363,"pred_smm":0.0031752,"mean_age":30.706,"actual_cpr":8.5675,"pred_cpr":3.7444},{"age_bucket":"37-48","n":8764,"actual_smm":0.0010269,"pred_smm":0.0032788,"mean_age":42.548,"actual_cpr":1.2254,"pred_cpr":3.8644},{"age_bucket":"49-60","n":8621,"actual_smm":0.00116,"pred_smm":0.0032565,"mean_age":54.384,"actual_cpr":1.3831,"pred_cpr":3.8385},{"age_bucket":"61-72","n":7209,"actual_smm":0.00083229,"pred_smm":0.0037193,"mean_age":66.305,"actual_cpr":0.99419,"pred_cpr":4.3729},{"age_bucket":"73-96","n":12479,"actual_smm":0.0014424,"pred_smm":0.0040655,"mean_age":84.046,"actual_cpr":1.7172,"pred_cpr":4.771},{"age_bucket":"97-120","n":8933,"actual_smm":0.0026867,"pred_smm":0.0051356,"mean_age":107.82,"actual_cpr":3.1768,"pred_cpr":5.9916},{"age_bucket":"120+","n":19176,"actual_smm":0.0041197,"pred_smm":0.0060647,"mean_age":163.51,"actual_cpr":4.8332,"pred_cpr":7.0397}]}},"issuer_scurves":{"capital_funding":{"key":"capital_funding","label":"Capital Funding","n_total":41909,"events_total":252,"overall_actual_cpr":6.9817,"overall_pred_cpr":6.7423,"scurve":[{"ri_bucket":0,"n":11005,"events":29,"ri_mid":-294.07,"actual_smm":0.0026352,"pred_smm":0.0012729,"actual_cpr":3.1168,"pred_cpr":1.5168},{"ri_bucket":1,"n":3948,"events":9,"ri_mid":-174.57,"actual_smm":0.0022796,"pred_smm":0.0029715,"actual_cpr":2.7015,"pred_cpr":3.5081},{"ri_bucket":2,"n":3761,"events":5,"ri_mid":-125.14,"actual_smm":0.0013294,"pred_smm":0.0034767,"actual_cpr":1.5837,"pred_cpr":4.0932},{"ri_bucket":3,"n":3764,"events":22,"ri_mid":-74.38,"actual_smm":0.0058448,"pred_smm":0.0037875,"actual_cpr":6.7927,"pred_cpr":4.4515},{"ri_bucket":4,"n":1907,"events":3,"ri_mid":-37.143,"actual_smm":0.0015732,"pred_smm":0.00436,"actual_cpr":1.8715,"pred_cpr":5.1083},{"ri_bucket":5,"n":1822,"events":3,"ri_mid":-12.162,"actual_smm":0.0016465,"pred_smm":0.004753,"actual_cpr":1.9581,"pred_cpr":5.5568},{"ri_bucket":6,"n":2079,"events":7,"ri_mid":12.854,"actual_smm":0.003367,"pred_smm":0.0055647,"actual_cpr":3.9664,"pred_cpr":6.4771},{"ri_bucket":7,"n":1806,"events":10,"ri_mid":37.438,"actual_smm":0.0055371,"pred_smm":0.0066072,"actual_cpr":6.4459,"pred_cpr":7.6467},{"ri_bucket":8,"n":3456,"events":15,"ri_mid":75.998,"actual_smm":0.0043403,"pred_smm":0.0088725,"actual_cpr":5.0858,"pred_cpr":10.142},{"ri_bucket":9,"n":3632,"events":35,"ri_mid":123.24,"actual_smm":0.0096366,"pred_smm":0.0116,"actual_cpr":10.97,"pred_cpr":13.065},{"ri_bucket":10,"n":1961,"events":27,"ri_mid":175.07,"actual_smm":0.013768,"pred_smm":0.013111,"actual_cpr":15.327,"pred_cpr":14.647},{"ri_bucket":11,"n":2768,"events":87,"ri_mid":250.59,"actual_smm":0.031431,"pred_smm":0.018434,"actual_cpr":31.834,"pred_cpr":20.01}]},"merchants":{"key":"merchants","label":"Merchants Capital","n_total":71625,"events_total":443,"overall_actual_cpr":7.1746,"overall_pred_cpr":7.3859,"scurve":[{"ri_bucket":0,"n":22746,"events":62,"ri_mid":-294.63,"actual_smm":0.0027258,"pred_smm":0.0016745,"actual_cpr":3.2223,"pred_cpr":1.991},{"ri_bucket":1,"n":7256,"events":41,"ri_mid":-174.71,"actual_smm":0.0056505,"pred_smm":0.0032535,"actual_cpr":6.5738,"pred_cpr":3.835},{"ri_bucket":2,"n":6996,"events":33,"ri_mid":-125.0,"actual_smm":0.004717,"pred_smm":0.0037888,"actual_cpr":5.5158,"pred_cpr":4.453},{"ri_bucket":3,"n":6095,"events":20,"ri_mid":-75.241,"actual_smm":0.0032814,"pred_smm":0.0043802,"actual_cpr":3.8674,"pred_cpr":5.1315},{"ri_bucket":4,"n":2817,"events":11,"ri_mid":-36.983,"actual_smm":0.0039049,"pred_smm":0.0054172,"actual_cpr":4.5865,"pred_cpr":6.3104},{"ri_bucket":5,"n":2699,"events":10,"ri_mid":-12.182,"actual_smm":0.0037051,"pred_smm":0.0065191,"actual_cpr":4.3566,"pred_cpr":7.5484},{"ri_bucket":6,"n":3071,"events":23,"ri_mid":12.797,"actual_smm":0.0074894,"pred_smm":0.007965,"actual_cpr":8.6262,"pred_cpr":9.1502},{"ri_bucket":7,"n":3470,"events":33,"ri_mid":37.537,"actual_smm":0.0095101,"pred_smm":0.0094811,"actual_cpr":10.834,"pred_cpr":10.802},{"ri_bucket":8,"n":6388,"events":65,"ri_mid":73.505,"actual_smm":0.010175,"pred_smm":0.011829,"actual_cpr":11.55,"pred_cpr":13.307},{"ri_bucket":9,"n":4355,"events":65,"ri_mid":123.02,"actual_smm":0.014925,"pred_smm":0.014058,"actual_cpr":16.511,"pred_cpr":15.625},{"ri_bucket":10,"n":2852,"events":36,"ri_mid":172.15,"actual_smm":0.012623,"pred_smm":0.017151,"actual_cpr":14.139,"pred_cpr":18.747},{"ri_bucket":11,"n":2880,"events":44,"ri_mid":310.38,"actual_smm":0.015278,"pred_smm":0.022812,"actual_cpr":16.869,"pred_cpr":24.188}]},"wells_fargo":{"key":"wells_fargo","label":"Wells Fargo","n_total":53686,"events_total":495,"overall_actual_cpr":10.52,"overall_pred_cpr":10.585,"scurve":[{"ri_bucket":0,"n":12171,"events":17,"ri_mid":-287.28,"actual_smm":0.0013968,"pred_smm":0.0018952,"actual_cpr":1.6633,"pred_cpr":2.2507},{"ri_bucket":1,"n":4345,"events":11,"ri_mid":-174.28,"actual_smm":0.0025316,"pred_smm":0.0037963,"actual_cpr":2.996,"pred_cpr":4.4617},{"ri_bucket":2,"n":4282,"events":11,"ri_mid":-125.46,"actual_smm":0.0025689,"pred_smm":0.0046513,"actual_cpr":3.0395,"pred_cpr":5.441},{"ri_bucket":3,"n":3830,"events":15,"ri_mid":-74.865,"actual_smm":0.0039164,"pred_smm":0.0052986,"actual_cpr":4.5998,"pred_cpr":6.1762},{"ri_bucket":4,"n":1885,"events":8,"ri_mid":-37.071,"actual_smm":0.004244,"pred_smm":0.0063033,"actual_cpr":4.9756,"pred_cpr":7.3072},{"ri_bucket":5,"n":1979,"events":10,"ri_mid":-12.204,"actual_smm":0.0050531,"pred_smm":0.0072973,"actual_cpr":5.898,"pred_cpr":8.4137},{"ri_bucket":6,"n":2447,"events":21,"ri_mid":13.302,"actual_smm":0.0085819,"pred_smm":0.0088316,"actual_cpr":9.8259,"pred_cpr":10.098},{"ri_bucket":7,"n":2824,"events":33,"ri_mid":37.974,"actual_smm":0.011686,"pred_smm":0.010575,"actual_cpr":13.156,"pred_cpr":11.977},{"ri_bucket":8,"n":5915,"events":89,"ri_mid":73.937,"actual_smm":0.015046,"pred_smm":0.012566,"actual_cpr":16.634,"pred_cpr":14.079},{"ri_bucket":9,"n":4329,"events":96,"ri_mid":123.85,"actual_smm":0.022176,"pred_smm":0.015746,"actual_cpr":23.594,"pred_cpr":17.342},{"ri_bucket":10,"n":3033,"events":80,"ri_mid":173.63,"actual_smm":0.026377,"pred_smm":0.018564,"actual_cpr":27.441,"pred_cpr":20.137},{"ri_bucket":11,"n":6646,"events":104,"ri_mid":344.62,"actual_smm":0.015649,"pred_smm":0.021343,"actual_cpr":17.243,"pred_cpr":22.809}]},"walker_dunlop":{"key":"walker_dunlop","label":"Walker & Dunlop","n_total":87185,"events_total":805,"overall_actual_cpr":10.534,"overall_pred_cpr":10.188,"scurve":[{"ri_bucket":0,"n":22407,"events":47,"ri_mid":-294.23,"actual_smm":0.0020976,"pred_smm":0.0019596,"actual_cpr":2.4882,"pred_cpr":2.3263},{"ri_bucket":1,"n":7031,"events":38,"ri_mid":-174.43,"actual_smm":0.0054046,"pred_smm":0.0041087,"actual_cpr":6.2962,"pred_cpr":4.8206},{"ri_bucket":2,"n":7319,"events":38,"ri_mid":-124.43,"actual_smm":0.005192,"pred_smm":0.0048564,"actual_cpr":6.0555,"pred_cpr":5.6746},{"ri_bucket":3,"n":7784,"events":51,"ri_mid":-74.463,"actual_smm":0.0065519,"pred_smm":0.0057764,"actual_cpr":7.5851,"pred_cpr":6.7156},{"ri_bucket":4,"n":3786,"events":17,"ri_mid":-37.686,"actual_smm":0.0044902,"pred_smm":0.0066511,"actual_cpr":5.2572,"pred_cpr":7.6957},{"ri_bucket":5,"n":3886,"events":13,"ri_mid":-12.44,"actual_smm":0.0033453,"pred_smm":0.0076563,"actual_cpr":3.9414,"pred_cpr":8.8104},{"ri_bucket":6,"n":3780,"events":24,"ri_mid":12.794,"actual_smm":0.0063492,"pred_smm":0.0091879,"actual_cpr":7.3585,"pred_cpr":10.485},{"ri_bucket":7,"n":4171,"events":52,"ri_mid":38.04,"actual_smm":0.012467,"pred_smm":0.010852,"actual_cpr":13.976,"pred_cpr":12.272},{"ri_bucket":8,"n":9171,"events":144,"ri_mid":75.494,"actual_smm":0.015702,"pred_smm":0.013649,"actual_cpr":17.297,"pred_cpr":15.204},{"ri_bucket":9,"n":7592,"events":166,"ri_mid":123.19,"actual_smm":0.021865,"pred_smm":0.01732,"actual_cpr":23.302,"pred_cpr":18.914},{"ri_bucket":10,"n":4780,"events":121,"ri_mid":172.73,"actual_smm":0.025314,"pred_smm":0.020781,"actual_cpr":26.485,"pred_cpr":22.276},{"ri_bucket":11,"n":5478,"events":94,"ri_mid":287.61,"actual_smm":0.01716,"pred_smm":0.024269,"actual_cpr":18.755,"pred_cpr":25.533}]},"pnc":{"key":"pnc","label":"PNC Bank","n_total":44798,"events_total":307,"overall_actual_cpr":7.9206,"overall_pred_cpr":8.6504,"scurve":[{"ri_bucket":0,"n":7133,"events":9,"ri_mid":-282.9,"actual_smm":0.0012617,"pred_smm":0.0016013,"actual_cpr":1.5036,"pred_cpr":1.9047},{"ri_bucket":1,"n":3357,"events":10,"ri_mid":-174.24,"actual_smm":0.0029789,"pred_smm":0.0029868,"actual_cpr":3.5166,"pred_cpr":3.5258},{"ri_bucket":2,"n":3044,"events":14,"ri_mid":-125.73,"actual_smm":0.0045992,"pred_smm":0.0035733,"actual_cpr":5.3816,"pred_cpr":4.2047},{"ri_bucket":3,"n":2648,"events":10,"ri_mid":-74.845,"actual_smm":0.0037764,"pred_smm":0.004075,"actual_cpr":4.4388,"pred_cpr":4.7819},{"ri_bucket":4,"n":1363,"events":8,"ri_mid":-37.329,"actual_smm":0.0058694,"pred_smm":0.004624,"actual_cpr":6.8203,"pred_cpr":5.4098},{"ri_bucket":5,"n":1468,"events":12,"ri_mid":-12.38,"actual_smm":0.0081744,"pred_smm":0.0053599,"actual_cpr":9.38,"pred_cpr":6.2456},{"ri_bucket":6,"n":1634,"events":13,"ri_mid":13.077,"actual_smm":0.0079559,"pred_smm":0.0062348,"actual_cpr":9.1402,"pred_cpr":7.2305},{"ri_bucket":7,"n":1989,"events":16,"ri_mid":38.061,"actual_smm":0.0080442,"pred_smm":0.007273,"actual_cpr":9.2373,"pred_cpr":8.3868},{"ri_bucket":8,"n":4720,"events":52,"ri_mid":75.936,"actual_smm":0.011017,"pred_smm":0.0084735,"actual_cpr":12.448,"pred_cpr":9.7075},{"ri_bucket":9,"n":4484,"events":35,"ri_mid":124.06,"actual_smm":0.0078055,"pred_smm":0.0094968,"actual_cpr":8.9748,"pred_cpr":10.819},{"ri_bucket":10,"n":3060,"events":28,"ri_mid":173.93,"actual_smm":0.0091503,"pred_smm":0.011011,"actual_cpr":10.444,"pred_cpr":12.441},{"ri_bucket":11,"n":9898,"events":100,"ri_mid":344.8,"actual_smm":0.010103,"pred_smm":0.013971,"actual_cpr":11.472,"pred_cpr":15.535}]},"berkadia":{"key":"berkadia","label":"Berkadia","n_total":106649,"events_total":919,"overall_actual_cpr":9.8642,"overall_pred_cpr":10.242,"scurve":[{"ri_bucket":0,"n":26703,"events":62,"ri_mid":-302.59,"actual_smm":0.0023218,"pred_smm":0.0021529,"actual_cpr":2.7509,"pred_cpr":2.5531},{"ri_bucket":1,"n":7653,"events":39,"ri_mid":-175.1,"actual_smm":0.005096,"pred_smm":0.0039554,"actual_cpr":5.9467,"pred_cpr":4.6446},{"ri_bucket":2,"n":7339,"events":20,"ri_mid":-124.9,"actual_smm":0.0027252,"pred_smm":0.0046157,"actual_cpr":3.2216,"pred_cpr":5.4004},{"ri_bucket":3,"n":6814,"events":52,"ri_mid":-74.265,"actual_smm":0.0076313,"pred_smm":0.0055892,"actual_cpr":8.7829,"pred_cpr":6.5047},{"ri_bucket":4,"n":3366,"events":23,"ri_mid":-37.182,"actual_smm":0.006833,"pred_smm":0.0066636,"actual_cpr":7.8984,"pred_cpr":7.7097},{"ri_bucket":5,"n":3914,"events":31,"ri_mid":-12.044,"actual_smm":0.0079203,"pred_smm":0.0077442,"actual_cpr":9.1011,"pred_cpr":8.9073},{"ri_bucket":6,"n":4621,"events":35,"ri_mid":13.252,"actual_smm":0.0075741,"pred_smm":0.00916,"actual_cpr":8.7197,"pred_cpr":10.455},{"ri_bucket":7,"n":5552,"events":67,"ri_mid":37.924,"actual_smm":0.012068,"pred_smm":0.010781,"actual_cpr":13.558,"pred_cpr":12.197},{"ri_bucket":8,"n":11558,"events":172,"ri_mid":74.777,"actual_smm":0.014881,"pred_smm":0.012736,"actual_cpr":16.466,"pred_cpr":14.257},{"ri_bucket":9,"n":8839,"events":151,"ri_mid":122.77,"actual_smm":0.017083,"pred_smm":0.014387,"actual_cpr":18.679,"pred_cpr":15.961},{"ri_bucket":10,"n":5281,"events":90,"ri_mid":172.4,"actual_smm":0.017042,"pred_smm":0.016646,"actual_cpr":18.639,"pred_cpr":18.244},{"ri_bucket":11,"n":15009,"events":177,"ri_mid":361.18,"actual_smm":0.011793,"pred_smm":0.018597,"actual_cpr":13.269,"pred_cpr":20.169}]},"dwight":{"key":"dwight","label":"Dwight Capital","n_total":38790,"events_total":295,"overall_actual_cpr":8.7539,"overall_pred_cpr":7.7695,"scurve":[{"ri_bucket":0,"n":18451,"events":14,"ri_mid":-306.1,"actual_smm":0.00075877,"pred_smm":0.0021564,"actual_cpr":0.90673,"pred_cpr":2.5572},{"ri_bucket":1,"n":2704,"events":8,"ri_mid":-176.42,"actual_smm":0.0029586,"pred_smm":0.0048646,"actual_cpr":3.4931,"pred_cpr":5.6839},{"ri_bucket":2,"n":2413,"events":8,"ri_mid":-123.91,"actual_smm":0.0033154,"pred_smm":0.0052353,"actual_cpr":3.9067,"pred_cpr":6.1045},{"ri_bucket":3,"n":3235,"events":12,"ri_mid":-74.296,"actual_smm":0.0037094,"pred_smm":0.0063183,"actual_cpr":4.3616,"pred_cpr":7.324},{"ri_bucket":4,"n":1812,"events":4,"ri_mid":-37.36,"actual_smm":0.0022075,"pred_smm":0.008076,"actual_cpr":2.6171,"pred_cpr":9.2721},{"ri_bucket":5,"n":1835,"events":3,"ri_mid":-12.519,"actual_smm":0.0016349,"pred_smm":0.0098565,"actual_cpr":1.9443,"pred_cpr":11.207},{"ri_bucket":6,"n":1779,"events":20,"ri_mid":12.53,"actual_smm":0.011242,"pred_smm":0.012094,"actual_cpr":12.687,"pred_cpr":13.585},{"ri_bucket":7,"n":1767,"events":30,"ri_mid":37.3,"actual_smm":0.016978,"pred_smm":0.013949,"actual_cpr":18.575,"pred_cpr":15.512},{"ri_bucket":8,"n":3080,"events":89,"ri_mid":74.882,"actual_smm":0.028896,"pred_smm":0.017685,"actual_cpr":29.662,"pred_cpr":19.275},{"ri_bucket":9,"n":1434,"events":93,"ri_mid":118.23,"actual_smm":0.064854,"pred_smm":0.022715,"actual_cpr":55.274,"pred_cpr":24.097},{"ri_bucket":10,"n":218,"events":11,"ri_mid":168.68,"actual_smm":0.050459,"pred_smm":0.02943,"actual_cpr":46.276,"pred_cpr":30.125}]},"other":{"key":"other","label":"Other (Lument+ORIX, Greystone, ~70 small)","n_total":781279,"events_total":6114,"overall_actual_cpr":8.9969,"overall_pred_cpr":8.7254,"scurve":[{"ri_bucket":0,"n":246113,"events":464,"ri_mid":-297.24,"actual_smm":0.0018853,"pred_smm":0.0019073,"actual_cpr":2.2391,"pred_cpr":2.2649},{"ri_bucket":1,"n":68343,"events":224,"ri_mid":-175.13,"actual_smm":0.0032776,"pred_smm":0.0038786,"actual_cpr":3.863,"pred_cpr":4.5564},{"ri_bucket":2,"n":62890,"events":233,"ri_mid":-125.06,"actual_smm":0.0037049,"pred_smm":0.0045503,"actual_cpr":4.3564,"pred_cpr":5.3257},{"ri_bucket":3,"n":64606,"events":245,"ri_mid":-74.591,"actual_smm":0.0037922,"pred_smm":0.00525,"actual_cpr":4.4569,"pred_cpr":6.1212},{"ri_bucket":4,"n":32354,"events":136,"ri_mid":-37.432,"actual_smm":0.0042035,"pred_smm":0.0062806,"actual_cpr":4.9292,"pred_cpr":7.2818},{"ri_bucket":5,"n":32845,"events":155,"ri_mid":-12.38,"actual_smm":0.0047191,"pred_smm":0.0073977,"actual_cpr":5.5183,"pred_cpr":8.5248},{"ri_bucket":6,"n":34456,"events":257,"ri_mid":12.832,"actual_smm":0.0074588,"pred_smm":0.0088905,"actual_cpr":8.5923,"pred_cpr":10.162},{"ri_bucket":7,"n":36427,"events":357,"ri_mid":37.697,"actual_smm":0.0098004,"pred_smm":0.010661,"actual_cpr":11.147,"pred_cpr":12.069},{"ri_bucket":8,"n":72020,"events":1150,"ri_mid":74.686,"actual_smm":0.015968,"pred_smm":0.013419,"actual_cpr":17.565,"pred_cpr":14.966},{"ri_bucket":9,"n":55827,"events":1324,"ri_mid":123.71,"actual_smm":0.023716,"pred_smm":0.016591,"actual_cpr":25.026,"pred_cpr":18.189},{"ri_bucket":10,"n":33490,"events":850,"ri_mid":172.55,"actual_smm":0.025381,"pred_smm":0.018891,"actual_cpr":26.545,"pred_cpr":20.456},{"ri_bucket":11,"n":41908,"events":719,"ri_mid":310.96,"actual_smm":0.017157,"pred_smm":0.021369,"actual_cpr":18.752,"pred_cpr":22.834}]}},"attribution_loans":[{"label":"Locked-in 223(f) Refi (post-COVID)","archetype_id":"RP_223f","loan_id":"3617VLA23_000000002411082","period":"202602","fha_category":"223f","loan_purpose":"RP","issuer_key":"walker_dunlop","logit_z":-6.88291,"pred_smm":0.00102411,"pred_cpr":1.22203,"actual_prepay":0,"contributions":[{"feature":"refi_incentive_bps","x_native":-275.5,"x_std":-1.15903,"contribution_logit":-1.198},{"feature":"is_post_covid","x_native":1.0,"x_std":2.68027,"contribution_logit":-0.820346},{"feature":"log_upb","x_native":16.6503,"x_std":1.01631,"contribution_logit":0.49416},{"feature":"cum_itm","x_native":7.0,"x_std":-0.924353,"contribution_logit":-0.413164},{"feature":"loan_age_months","x_native":55.0,"x_std":-0.539876,"contribution_logit":0.109573},{"feature":"burn_ratio","x_native":0.127273,"x_std":-0.754809,"contribution_logit":0.062084},{"feature":"in_prepay_penalty","x_native":1.0,"x_std":0.446689,"contribution_logit":0.0531462},{"feature":"is_538","x_native":0,"x_std":-0.257258,"contribution_logit":0.0382883},{"feature":"is_223a7","x_native":0,"x_std":-0.579608,"contribution_logit":-0.0217946},{"feature":"iss_capital_funding","x_native":0,"x_std":-0.179069,"contribution_logit":0.014046},{"feature":"iss_pnc","x_native":0,"x_std":-0.188173,"contribution_logit":0.0117214},{"feature":"iss_wells_fargo","x_native":0,"x_std":-0.216734,"contribution_logit":0.00738298},{"feature":"is_hc_232","x_native":0,"x_std":-0.581147,"contribution_logit":0.00714357},{"feature":"iss_dwight","x_native":0,"x_std":-0.178875,"contribution_logit":-0.00508431},{"feature":"iss_merchants","x_native":0,"x_std":-0.246775,"contribution_logit":0.00495385},{"feature":"iss_walker_dunlop","x_native":1.0,"x_std":3.50145,"contribution_logit":0.00461612},{"feature":"lp_NC","x_native":0,"x_std":-0.377429,"contribution_logit":0.00364247},{"feature":"iss_berkadia","x_native":0,"x_std":-0.309903,"contribution_logit":-0.0022979}]},{"label":"Mature 221(d)(4) NC, past restrictions","archetype_id":"NC_221d4","loan_id":"36198VXR3_000000004335580","period":"202602","fha_category":"221d4","loan_purpose":"NC","issuer_key":"other","logit_z":-5.22061,"pred_smm":0.00537497,"pred_cpr":6.26267,"actual_prepay":0,"contributions":[{"feature":"cum_itm","x_native":45.0,"x_std":1.45451,"contribution_logit":0.650129},{"feature":"log_upb","x_native":14.5049,"x_std":-0.703505,"contribution_logit":-0.342066},{"feature":"in_prepay_penalty","x_native":0,"x_std":-2.2387,"contribution_logit":-0.266356},{"feature":"loan_age_months","x_native":138.0,"x_std":0.889507,"contribution_logit":-0.180534},{"feature":"is_post_covid","x_native":0,"x_std":-0.373097,"contribution_logit":0.114193},{"feature":"is_538","x_native":0,"x_std":-0.257258,"contribution_logit":0.0382883},{"feature":"lp_NC","x_native":1.0,"x_std":2.6495,"contribution_logit":-0.0255696},{"feature":"is_223a7","x_native":0,"x_std":-0.579608,"contribution_logit":-0.0217946},{"feature":"iss_capital_funding","x_native":0,"x_std":-0.179069,"contribution_logit":0.014046},{"feature":"iss_pnc","x_native":0,"x_std":-0.188173,"contribution_logit":0.0117214},{"feature":"refi_incentive_bps","x_native":-47.5,"x_std":0.00834447,"contribution_logit":0.008625},{"feature":"iss_wells_fargo","x_native":0,"x_std":-0.216734,"contribution_logit":0.00738298},{"feature":"is_hc_232","x_native":0,"x_std":-0.581147,"contribution_logit":0.00714357},{"feature":"iss_dwight","x_native":0,"x_std":-0.178875,"contribution_logit":-0.00508431},{"feature":"iss_merchants","x_native":0,"x_std":-0.246775,"contribution_logit":0.00495385},{"feature":"iss_berkadia","x_native":0,"x_std":-0.309903,"contribution_logit":-0.0022979},{"feature":"iss_walker_dunlop","x_native":0,"x_std":-0.285596,"contribution_logit":-0.000376514},{"feature":"burn_ratio","x_native":0.326087,"x_std":0.000409076,"contribution_logit":-3.3647e-05}]},{"label":"232 Healthcare NC, mid-life","archetype_id":"NC_232","loan_id":"3617M4U29_000000011443074","period":"202602","fha_category":"232","loan_purpose":"NC","issuer_key":"other","logit_z":-5.33562,"pred_smm":0.00479381,"pred_cpr":5.6033,"actual_prepay":0,"contributions":[{"feature":"log_upb","x_native":17.137,"x_std":1.4065,"contribution_logit":0.683883},{"feature":"cum_itm","x_native":1.0,"x_std":-1.29996,"contribution_logit":-0.581052},{"feature":"refi_incentive_bps","x_native":-147.5,"x_std":-0.503662,"contribution_logit":-0.520594},{"feature":"is_post_covid","x_native":0,"x_std":-0.373097,"contribution_logit":0.114193},{"feature":"burn_ratio","x_native":0.0138889,"x_std":-1.18551,"contribution_logit":0.0975096},{"feature":"in_prepay_penalty","x_native":1.0,"x_std":0.446689,"contribution_logit":0.0531462},{"feature":"loan_age_months","x_native":72.0,"x_std":-0.247111,"contribution_logit":0.0501536},{"feature":"is_538","x_native":0,"x_std":-0.257258,"contribution_logit":0.0382883},{"feature":"lp_NC","x_native":1.0,"x_std":2.6495,"contribution_logit":-0.0255696},{"feature":"is_223a7","x_native":0,"x_std":-0.579608,"contribution_logit":-0.0217946},{"feature":"is_hc_232","x_native":1.0,"x_std":1.72074,"contribution_logit":-0.0211516},{"feature":"iss_capital_funding","x_native":0,"x_std":-0.179069,"contribution_logit":0.014046},{"feature":"iss_pnc","x_native":0,"x_std":-0.188173,"contribution_logit":0.0117214},{"feature":"iss_wells_fargo","x_native":0,"x_std":-0.216734,"contribution_logit":0.00738298},{"feature":"iss_dwight","x_native":0,"x_std":-0.178875,"contribution_logit":-0.00508431},{"feature":"iss_merchants","x_native":0,"x_std":-0.246775,"contribution_logit":0.00495385},{"feature":"iss_berkadia","x_native":0,"x_std":-0.309903,"contribution_logit":-0.0022979},{"feature":"iss_walker_dunlop","x_native":0,"x_std":-0.285596,"contribution_logit":-0.000376514}]},{"label":"223(a)(7) Streamlined Refi","archetype_id":"RP_223a7","loan_id":"36178YNX9_000000012211258","period":"202602","fha_category":"223a7","loan_purpose":"RP","issuer_key":"other","logit_z":-5.70588,"pred_smm":0.00331533,"pred_cpr":3.90665,"actual_prepay":0,"contributions":[{"feature":"refi_incentive_bps","x_native":-174.5,"x_std":-0.641903,"contribution_logit":-0.663484},{"feature":"cum_itm","x_native":35.0,"x_std":0.82849,"contribution_logit":0.370315},{"feature":"in_prepay_penalty","x_native":0,"x_std":-2.2387,"contribution_logit":-0.266356},{"feature":"loan_age_months","x_native":156.0,"x_std":1.19949,"contribution_logit":-0.243449},{"feature":"is_post_covid","x_native":0,"x_std":-0.373097,"contribution_logit":0.114193},{"feature":"is_223a7","x_native":1.0,"x_std":1.7253,"contribution_logit":0.0648753},{"feature":"log_upb","x_native":15.4847,"x_std":0.0819372,"contribution_logit":0.0398404},{"feature":"is_538","x_native":0,"x_std":-0.257258,"contribution_logit":0.0382883},{"feature":"burn_ratio","x_native":0.224359,"x_std":-0.386016,"contribution_logit":0.0317503},{"feature":"iss_capital_funding","x_native":0,"x_std":-0.179069,"contribution_logit":0.014046},{"feature":"iss_pnc","x_native":0,"x_std":-0.188173,"contribution_logit":0.0117214},{"feature":"iss_wells_fargo","x_native":0,"x_std":-0.216734,"contribution_logit":0.00738298},{"feature":"is_hc_232","x_native":0,"x_std":-0.581147,"contribution_logit":0.00714357},{"feature":"iss_dwight","x_native":0,"x_std":-0.178875,"contribution_logit":-0.00508431},{"feature":"iss_merchants","x_native":0,"x_std":-0.246775,"contribution_logit":0.00495385},{"feature":"lp_NC","x_native":0,"x_std":-0.377429,"contribution_logit":0.00364247},{"feature":"iss_berkadia","x_native":0,"x_std":-0.309903,"contribution_logit":-0.0022979},{"feature":"iss_walker_dunlop","x_native":0,"x_std":-0.285596,"contribution_logit":-0.000376514}]},{"label":"538 USDA Rural","archetype_id":"538","loan_id":"3617A0VD5_002015220477778","period":"202602","fha_category":"538","loan_purpose":"538","issuer_key":"other","logit_z":-6.12745,"pred_smm":0.00217739,"pred_cpr":2.5818,"actual_prepay":0,"contributions":[{"feature":"log_upb","x_native":13.4003,"x_std":-1.58907,"contribution_logit":-0.772656},{"feature":"cum_itm","x_native":45.0,"x_std":1.45451,"contribution_logit":0.650129},{"feature":"is_538","x_native":1.0,"x_std":3.88715,"contribution_logit":-0.578533},{"feature":"in_prepay_penalty","x_native":0,"x_std":-2.2387,"contribution_logit":-0.266356},{"feature":"loan_age_months","x_native":122.0,"x_std":0.613964,"contribution_logit":-0.12461},{"feature":"is_post_covid","x_native":0,"x_std":-0.373097,"contribution_logit":0.114193},{"feature":"refi_incentive_bps","x_native":-34.5,"x_std":0.0749052,"contribution_logit":0.0774235},{"feature":"is_223a7","x_native":0,"x_std":-0.579608,"contribution_logit":-0.0217946},{"feature":"iss_capital_funding","x_native":0,"x_std":-0.179069,"contribution_logit":0.014046},{"feature":"burn_ratio","x_native":0.368852,"x_std":0.162859,"contribution_logit":-0.0133953},{"feature":"iss_pnc","x_native":0,"x_std":-0.188173,"contribution_logit":0.0117214},{"feature":"iss_wells_fargo","x_native":0,"x_std":-0.216734,"contribution_logit":0.00738298},{"feature":"is_hc_232","x_native":0,"x_std":-0.581147,"contribution_logit":0.00714357},{"feature":"iss_dwight","x_native":0,"x_std":-0.178875,"contribution_logit":-0.00508431},{"feature":"iss_merchants","x_native":0,"x_std":-0.246775,"contribution_logit":0.00495385},{"feature":"lp_NC","x_native":0,"x_std":-0.377429,"contribution_logit":0.00364247},{"feature":"iss_berkadia","x_native":0,"x_std":-0.309903,"contribution_logit":-0.0022979},{"feature":"iss_walker_dunlop","x_native":0,"x_std":-0.285596,"contribution_logit":-0.000376514}]},{"label":"Wells Fargo, in penalty","archetype_id":"RP_223f","loan_id":"3617XKQJ9_000000012735525","period":"202602","fha_category":"221d4","loan_purpose":"NC","issuer_key":"wells_fargo","logit_z":-5.90529,"pred_smm":0.0027176,"pred_cpr":3.21281,"actual_prepay":0,"contributions":[{"feature":"refi_incentive_bps","x_native":-231.0,"x_std":-0.931187,"contribution_logit":-0.962492},{"feature":"log_upb","x_native":17.2551,"x_std":1.50118,"contribution_logit":0.729919},{"feature":"cum_itm","x_native":2.0,"x_std":-1.23736,"contribution_logit":-0.55307},{"feature":"iss_wells_fargo","x_native":1.0,"x_std":4.61396,"contribution_logit":-0.157173},{"feature":"is_post_covid","x_native":0,"x_std":-0.373097,"contribution_logit":0.114193},{"feature":"burn_ratio","x_native":0.0222222,"x_std":-1.15386,"contribution_logit":0.094906},{"feature":"in_prepay_penalty","x_native":1.0,"x_std":0.446689,"contribution_logit":0.0531462},{"feature":"is_538","x_native":0,"x_std":-0.257258,"contribution_logit":0.0382883},{"feature":"lp_NC","x_native":1.0,"x_std":2.6495,"contribution_logit":-0.0255696},{"feature":"is_223a7","x_native":0,"x_std":-0.579608,"contribution_logit":-0.0217946},{"feature":"iss_capital_funding","x_native":0,"x_std":-0.179069,"contribution_logit":0.014046},{"feature":"loan_age_months","x_native":90.0,"x_std":0.0628761,"contribution_logit":-0.0127613},{"feature":"iss_pnc","x_native":0,"x_std":-0.188173,"contribution_logit":0.0117214},{"feature":"is_hc_232","x_native":0,"x_std":-0.581147,"contribution_logit":0.00714357},{"feature":"iss_dwight","x_native":0,"x_std":-0.178875,"contribution_logit":-0.00508431},{"feature":"iss_merchants","x_native":0,"x_std":-0.246775,"contribution_logit":0.00495385},{"feature":"iss_berkadia","x_native":0,"x_std":-0.309903,"contribution_logit":-0.0022979},{"feature":"iss_walker_dunlop","x_native":0,"x_std":-0.285596,"contribution_logit":-0.000376514}]},{"label":"Capital Funding, healthcare-heavy","archetype_id":"NC_232","loan_id":"3620C2SM7_000000006122068","period":"202602","fha_category":"232","loan_purpose":"RP","issuer_key":"capital_funding","logit_z":-5.94903,"pred_smm":0.00260157,"pred_cpr":3.0776,"actual_prepay":0,"contributions":[{"feature":"cum_itm","x_native":45.0,"x_std":1.45451,"contribution_logit":0.650129},{"feature":"log_upb","x_native":14.0764,"x_std":-1.04704,"contribution_logit":-0.509104},{"feature":"iss_capital_funding","x_native":1.0,"x_std":5.58444,"contribution_logit":-0.438039},{"feature":"loan_age_months","x_native":181.0,"x_std":1.63003,"contribution_logit":-0.330831},{"feature":"in_prepay_penalty","x_native":0,"x_std":-2.2387,"contribution_logit":-0.266356},{"feature":"is_post_covid","x_native":0,"x_std":-0.373097,"contribution_logit":0.114193},{"feature":"is_538","x_native":0,"x_std":-0.257258,"contribution_logit":0.0382883},{"feature":"refi_incentive_bps","x_native":-44.5,"x_std":0.0237046,"contribution_logit":0.0245016},{"feature":"burn_ratio","x_native":0.248619,"x_std":-0.293863,"contribution_logit":0.0241705},{"feature":"is_223a7","x_native":0,"x_std":-0.579608,"contribution_logit":-0.0217946},{"feature":"is_hc_232","x_native":1.0,"x_std":1.72074,"contribution_logit":-0.0211516},{"feature":"iss_pnc","x_native":0,"x_std":-0.188173,"contribution_logit":0.0117214},{"feature":"iss_wells_fargo","x_native":0,"x_std":-0.216734,"contribution_logit":0.00738298},{"feature":"iss_dwight","x_native":0,"x_std":-0.178875,"contribution_logit":-0.00508431},{"feature":"iss_merchants","x_native":0,"x_std":-0.246775,"contribution_logit":0.00495385},{"feature":"lp_NC","x_native":0,"x_std":-0.377429,"contribution_logit":0.00364247},{"feature":"iss_berkadia","x_native":0,"x_std":-0.309903,"contribution_logit":-0.0022979},{"feature":"iss_walker_dunlop","x_native":0,"x_std":-0.285596,"contribution_logit":-0.000376514}]},{"label":"Deep-ITM pre-COVID, past restrictions","archetype_id":"RP_223f","loan_id":"36294WXW3_004052200198923","period":"202602","fha_category":"538","loan_purpose":"538","issuer_key":"merchants","logit_z":-3.77954,"pred_smm":0.0223235,"pred_cpr":23.7321,"actual_prepay":0,"contributions":[{"feature":"cum_itm","x_native":87.0,"x_std":4.08377,"contribution_logit":1.82535},{"feature":"refi_incentive_bps","x_native":253.5,"x_std":1.54948,"contribution_logit":1.60158},{"feature":"log_upb","x_native":13.6051,"x_std":-1.42488,"contribution_logit":-0.692822},{"feature":"is_538","x_native":1.0,"x_std":3.88715,"contribution_logit":-0.578533},{"feature":"loan_age_months","x_native":218.0,"x_std":2.26723,"contribution_logit":-0.460156},{"feature":"in_prepay_penalty","x_native":0,"x_std":-2.2387,"contribution_logit":-0.266356},{"feature":"is_post_covid","x_native":0,"x_std":-0.373097,"contribution_logit":0.114193},{"feature":"iss_merchants","x_native":1.0,"x_std":4.05227,"contribution_logit":-0.0813467},{"feature":"burn_ratio","x_native":0.399083,"x_std":0.277691,"contribution_logit":-0.0228404},{"feature":"is_223a7","x_native":0,"x_std":-0.579608,"contribution_logit":-0.0217946},{"feature":"iss_capital_funding","x_native":0,"x_std":-0.179069,"contribution_logit":0.014046},{"feature":"iss_pnc","x_native":0,"x_std":-0.188173,"contribution_logit":0.0117214},{"feature":"iss_wells_fargo","x_native":0,"x_std":-0.216734,"contribution_logit":0.00738298},{"feature":"is_hc_232","x_native":0,"x_std":-0.581147,"contribution_logit":0.00714357},{"feature":"iss_dwight","x_native":0,"x_std":-0.178875,"contribution_logit":-0.00508431},{"feature":"lp_NC","x_native":0,"x_std":-0.377429,"contribution_logit":0.00364247},{"feature":"iss_berkadia","x_native":0,"x_std":-0.309903,"contribution_logit":-0.0022979},{"feature":"iss_walker_dunlop","x_native":0,"x_std":-0.285596,"contribution_logit":-0.000376514}]}]};

const MODEL_DATA_INV = {"metadata":{"training_pop_n":1245651,"training_events":193,"base_smm":0.000154939063991439,"base_cdr":0.18576851824044782,"n_features":10,"test_auc":0.7341853079007103,"test_log_loss":0.0013323803925910991,"prior_correction":-5.752904108898427,"period_range":["201812","202602"],"feature_list":["loan_age_months","vintage_year","loan_rate","sato_bps","log_upb","plc_rate_bps","is_hc_232","is_223a7","is_538","lp_NC"],"intercept_scaled":-9.699952559343949,"intercept_native":-143.34674917512928,"plc_now_bps":447.0,"last_period":"202602","reclassified_from_voluntary":43},"coefficients":[{"feature":"is_hc_232","beta_scaled":1.1471322121048237,"beta_native":2.592003403811629,"mean":0.26732971669680533,"std":0.4425658586782436,"importance":1.1471322121048237},{"feature":"log_upb","beta_scaled":-0.6958283656871753,"beta_native":-0.5461791019320771,"mean":15.339431369786093,"std":1.2739930239471313,"importance":0.6958283656871753},{"feature":"loan_age_months","beta_scaled":0.6879528681238991,"beta_native":0.0115633720238736,"mean":85.81434599156118,"std":59.494139486609946,"importance":0.6879528681238991},{"feature":"lp_NC","beta_scaled":0.4724146944567878,"beta_native":1.407982842410028,"mean":0.12929475587703435,"std":0.3355258886877918,"importance":0.4724146944567878},{"feature":"vintage_year","beta_scaled":0.3589354869255905,"beta_native":0.06954403007871421,"mean":2014.9547920433997,"std":5.161269580139737,"importance":0.3589354869255905},{"feature":"is_538","beta_scaled":-0.2686292855877887,"beta_native":-1.0291599898824517,"mean":0.07353827606992164,"std":0.261018003253771,"importance":0.2686292855877887},{"feature":"is_223a7","beta_scaled":0.20906515730928749,"beta_native":0.49128632074045997,"mean":0.23749246534056662,"std":0.42554646543829544,"importance":0.20906515730928749},{"feature":"sato_bps","beta_scaled":0.1265125849460275,"beta_native":0.0017743474503698737,"mean":0.8610458098095968,"std":71.30090835346547,"importance":0.1265125849460275},{"feature":"plc_rate_bps","beta_scaled":0.03757419835692982,"beta_native":0.00025909746995594917,"mean":360.72757668061166,"std":145.01954945109287,"importance":0.03757419835692982},{"feature":"loan_rate","beta_scaled":-0.0308844864627565,"beta_native":-0.02865451373599119,"mean":3.715166369535033,"std":1.0778227384108205,"importance":0.0308844864627565}],"feature_stats":{"loan_age_months":{"min":0.0,"p5":9.0,"p25":40.0,"mean":84.99846649169922,"p75":118.0,"p95":201.0,"max":583.0},"vintage_year":{"min":1976.0,"p5":2005.0,"p25":2012.0,"mean":2014.97705078125,"p75":2019.0,"p95":2022.0,"max":2026.0},"loan_rate":{"min":1.6399999856948853,"p5":2.359999895095825,"p25":2.9700000286102295,"mean":3.691654920578003,"p75":4.099999904632568,"p95":6.0,"max":9.5},"sato_bps":{"min":-556.0,"p5":-103.0,"p25":-38.0,"mean":0.5724436640739441,"p75":37.0,"p95":123.0,"max":592.0},"log_upb":{"min":0.6931471824645996,"p5":13.182626247406006,"p25":14.55937385559082,"mean":15.368895530700684,"p75":16.249369621276855,"p95":17.26935386657715,"max":20.335111618041992},"plc_rate_bps":{"min":148.0,"p5":160.0,"p25":207.0,"mean":363.61187744140625,"p75":495.0,"p95":537.0,"max":616.0},"is_hc_232":{"min":0.0,"p5":0.0,"p25":0.0,"mean":0.25078452953515873,"p75":1.0,"p95":1.0,"max":1.0},"is_223a7":{"min":0.0,"p5":0.0,"p25":0.0,"mean":0.24235279384032926,"p75":0.0,"p95":1.0,"max":1.0},"is_538":{"min":0.0,"p5":0.0,"p25":0.0,"mean":0.07147587887779161,"p75":0.0,"p95":1.0,"max":1.0},"lp_NC":{"min":0.0,"p5":0.0,"p25":0.0,"mean":0.1216448266809885,"p75":0.0,"p95":1.0,"max":1.0}},"monthly":[{"period":"201812","n":13898,"actual_smm":0.0001439055979277594,"pred_smm":0.00011249685485381633,"actual_cdr":0.17255010483526734,"pred_cdr":0.13488531112670898},{"period":"201901","n":13889,"actual_smm":0.00014399884800921593,"pred_smm":0.0001136560458689928,"actual_cdr":0.17266182786952466,"pred_cdr":0.13631582260131836},{"period":"201902","n":13936,"actual_smm":0.0,"pred_smm":0.0001150205425801687,"actual_cdr":0.0,"pred_cdr":0.1379549503326416},{"period":"201903","n":13932,"actual_smm":0.0,"pred_smm":0.00011557076504686847,"actual_cdr":0.0,"pred_cdr":0.13859868049621582},{"period":"201904","n":13979,"actual_smm":0.0002861435009657343,"pred_smm":0.00011686317884596065,"actual_cdr":0.342832320782005,"pred_cdr":0.14017224311828613},{"period":"201905","n":13996,"actual_smm":7.144898542440698e-05,"pred_smm":0.00011531681229826063,"actual_cdr":0.08570509781278268,"pred_cdr":0.13831257820129395},{"period":"201906","n":14023,"actual_smm":7.131141695785496e-05,"pred_smm":0.0001154538185801357,"actual_cdr":0.0855401452261706,"pred_cdr":0.13845562934875488},{"period":"201907","n":14051,"actual_smm":0.0,"pred_smm":0.00011578715202631429,"actual_cdr":0.0,"pred_cdr":0.1388847827911377},{"period":"201908","n":14074,"actual_smm":0.0,"pred_smm":0.00011612727394094691,"actual_cdr":0.0,"pred_cdr":0.13924241065979004},{"period":"201909","n":14112,"actual_smm":7.086167800453515e-05,"pred_smm":0.00011738992907339707,"actual_cdr":0.08500088034137931,"pred_cdr":0.14074444770812988},{"period":"201910","n":14137,"actual_smm":7.073636556553724e-05,"pred_smm":0.0001193414645968005,"actual_cdr":0.08485062248353437,"pred_cdr":0.1430988311767578},{"period":"201911","n":14150,"actual_smm":7.06713780918728e-05,"pred_smm":0.00012078700819984078,"actual_cdr":0.08477269814597399,"pred_cdr":0.14481544494628906},{"period":"201912","n":14209,"actual_smm":0.00014075585896262933,"pred_smm":0.00012213902664370835,"actual_cdr":0.16877633148875137,"pred_cdr":0.14646053314208984},{"period":"202001","n":14195,"actual_smm":0.0,"pred_smm":0.0001218870238517411,"actual_cdr":0.0,"pred_cdr":0.14617443084716797},{"period":"202002","n":14190,"actual_smm":0.00014094432699083862,"pred_smm":0.00012254582543391734,"actual_cdr":0.16900214296547977,"pred_cdr":0.14695525169372559},{"period":"202003","n":14178,"actual_smm":0.0,"pred_smm":0.00012372761557344347,"actual_cdr":0.0,"pred_cdr":0.14838576316833496},{"period":"202004","n":14193,"actual_smm":0.00014091453533431975,"pred_smm":0.00012464837345760316,"actual_cdr":0.1689664483590203,"pred_cdr":0.149458646774292},{"period":"202005","n":14193,"actual_smm":0.00014091453533431975,"pred_smm":0.00012573300045914948,"actual_cdr":0.1689664483590203,"pred_cdr":0.15074610710144043},{"period":"202006","n":14212,"actual_smm":0.00014072614691809738,"pred_smm":0.00012687961861956865,"actual_cdr":0.16874073219488306,"pred_cdr":0.15217065811157227},{"period":"202007","n":14240,"actual_smm":0.0002808988764044944,"pred_smm":0.00012756862270180136,"actual_cdr":0.3365583714075804,"pred_cdr":0.15295743942260742},{"period":"202008","n":14271,"actual_smm":0.00021021652301870928,"pred_smm":0.000129257925436832,"actual_cdr":0.251968371387401,"pred_cdr":0.15503168106079102},{"period":"202009","n":14281,"actual_smm":0.00042013864575309853,"pred_smm":0.00012800177501048893,"actual_cdr":0.5030029961341831,"pred_cdr":0.15352964401245117},{"period":"202010","n":14280,"actual_smm":7.002801120448179e-05,"pred_smm":0.00013012831914238632,"actual_cdr":0.08400125511172085,"pred_cdr":0.15602707862854004},{"period":"202011","n":14230,"actual_smm":7.02740688685875e-05,"pred_smm":0.00013003328058402985,"actual_cdr":0.08429629654073123,"pred_cdr":0.15595555305480957},{"period":"202012","n":14225,"actual_smm":7.0298769771529e-05,"pred_smm":0.00013044556544627994,"actual_cdr":0.08432591471521089,"pred_cdr":0.15645623207092285},{"period":"202101","n":14149,"actual_smm":0.0,"pred_smm":0.00013116400805301964,"actual_cdr":0.0,"pred_cdr":0.15731453895568848},{"period":"202102","n":14169,"actual_smm":0.0,"pred_smm":0.00013340487203095108,"actual_cdr":0.0,"pred_cdr":0.15995502471923828},{"period":"202103","n":14202,"actual_smm":0.0001408252358822701,"pred_smm":0.00013573330943472683,"actual_cdr":0.168859454950554,"pred_cdr":0.16274452209472656},{"period":"202104","n":14223,"actual_smm":0.0002109259649862898,"pred_smm":0.00013456749729812145,"actual_cdr":0.2528177319007563,"pred_cdr":0.16138553619384766},{"period":"202105","n":14245,"actual_smm":0.0,"pred_smm":0.00013295824464876205,"actual_cdr":0.0,"pred_cdr":0.15946030616760254},{"period":"202106","n":14213,"actual_smm":0.00014071624569056497,"pred_smm":0.000134170419187285,"actual_cdr":0.16872886910066498,"pred_cdr":0.16088485717773438},{"period":"202107","n":14223,"actual_smm":0.0004218519299725796,"pred_smm":0.0001333529653493315,"actual_cdr":0.50504943625721,"pred_cdr":0.1598834991455078},{"period":"202108","n":14208,"actual_smm":7.038288288288288e-05,"pred_smm":0.000135524504003115,"actual_cdr":0.08442677237737728,"pred_cdr":0.16252994537353516},{"period":"202109","n":14230,"actual_smm":0.000140548137737175,"pred_smm":0.00013517632032744586,"actual_cdr":0.1685274514036772,"pred_cdr":0.16210079193115234},{"period":"202110","n":14200,"actual_smm":0.00021126760563380283,"pred_smm":0.0001363456976832822,"actual_cdr":0.25322674970797987,"pred_cdr":0.16353130340576172},{"period":"202111","n":14202,"actual_smm":0.00021123785382340515,"pred_smm":0.00013697610120289028,"actual_cdr":0.25319113041184504,"pred_cdr":0.16424059867858887},{"period":"202112","n":14191,"actual_smm":0.00021140159255866395,"pred_smm":0.00013640393444802612,"actual_cdr":0.25338716064025046,"pred_cdr":0.16353130340576172},{"period":"202201","n":14047,"actual_smm":0.00014237915569160676,"pred_smm":0.00013843720080330968,"actual_cdr":0.17072125626961254,"pred_cdr":0.16602873802185059},{"period":"202202","n":14087,"actual_smm":0.00021296230567189608,"pred_smm":0.0001430134871043265,"actual_cdr":0.2552556497627978,"pred_cdr":0.17145872116088867},{"period":"202203","n":14106,"actual_smm":0.0002126754572522331,"pred_smm":0.00014603222371079028,"actual_cdr":0.2549122366194867,"pred_cdr":0.17510056495666504},{"period":"202204","n":14096,"actual_smm":0.0,"pred_smm":0.0001488721463829279,"actual_cdr":0.0,"pred_cdr":0.17852783203125},{"period":"202205","n":14146,"actual_smm":0.00021207408454686837,"pred_smm":0.00014978813123889267,"actual_cdr":0.25419227344032347,"pred_cdr":0.1795947551727295},{"period":"202206","n":14093,"actual_smm":7.095721280068119e-05,"pred_smm":0.00015076916315592825,"actual_cdr":0.08511543270748323,"pred_cdr":0.180739164352417},{"period":"202207","n":14085,"actual_smm":0.0003549875754348598,"pred_smm":0.00015127690858207643,"actual_cdr":0.42515436710859333,"pred_cdr":0.1813828945159912},{"period":"202208","n":14094,"actual_smm":0.00014190435646374344,"pred_smm":0.00015416259702760726,"actual_cdr":0.17015238741546757,"pred_cdr":0.18481016159057617},{"period":"202209","n":14069,"actual_smm":0.00028431302864453766,"pred_smm":0.0001579363306518644,"actual_cdr":0.34064263592850086,"pred_cdr":0.1893758773803711},{"period":"202210","n":14045,"actual_smm":0.00028479886080455676,"pred_smm":0.0001614057255210355,"actual_cdr":0.3412238122618483,"pred_cdr":0.19351840019226074},{"period":"202211","n":14077,"actual_smm":0.00028415145272430207,"pred_smm":0.0001597796072019264,"actual_cdr":0.34044935017459865,"pred_cdr":0.19159317016601562},{"period":"202212","n":14111,"actual_smm":7.086669973779322e-05,"pred_smm":0.0001616936206119135,"actual_cdr":0.08500690172558167,"pred_cdr":0.19387602806091309},{"period":"202301","n":14115,"actual_smm":0.00021253985122210415,"pred_smm":0.00016192263865377754,"actual_cdr":0.2547498895465794,"pred_cdr":0.19416213035583496},{"period":"202302","n":14149,"actual_smm":0.00014135274577708673,"pred_smm":0.00016484869411215186,"actual_cdr":0.1694914850959517,"pred_cdr":0.1976609230041504},{"period":"202303","n":14184,"actual_smm":0.0005640157924421884,"pred_smm":0.00016622329712845385,"actual_cdr":0.6747233420193788,"pred_cdr":0.19930601119995117},{"period":"202304","n":14189,"actual_smm":7.047713017125943e-05,"pred_smm":0.00016758857236709446,"actual_cdr":0.08453978153487585,"pred_cdr":0.20094513893127441},{"period":"202305","n":14226,"actual_smm":0.00014058765640376775,"pred_smm":0.0001709041534923017,"actual_cdr":0.16857480052832052,"pred_cdr":0.20487308502197266},{"period":"202306","n":14253,"actual_smm":0.0,"pred_smm":0.00017412165470886976,"actual_cdr":0.0,"pred_cdr":0.20872950553894043},{"period":"202307","n":14265,"actual_smm":7.010164738871364e-05,"pred_smm":0.00017548266623634845,"actual_cdr":0.08408955045383637,"pred_cdr":0.21036863327026367},{"period":"202308","n":14293,"actual_smm":6.996431819771916e-05,"pred_smm":0.000178932401468046,"actual_cdr":0.08392488233213147,"pred_cdr":0.21451115608215332},{"period":"202309","n":14303,"actual_smm":0.0002097462070894218,"pred_smm":0.00018426294263917953,"actual_cdr":0.25140529450462523,"pred_cdr":0.22086501121520996},{"period":"202310","n":14354,"actual_smm":0.0,"pred_smm":0.00019000387692358345,"actual_cdr":0.0,"pred_cdr":0.2277851104736328},{"period":"202311","n":14380,"actual_smm":0.0,"pred_smm":0.000181219817022793,"actual_cdr":0.0,"pred_cdr":0.2172231674194336},{"period":"202312","n":14375,"actual_smm":0.00034782608695652176,"pred_smm":0.00017947997548617423,"actual_cdr":0.4165937416938603,"pred_cdr":0.21514892578125},{"period":"202401","n":14383,"actual_smm":6.952652436904678e-05,"pred_smm":0.00018214974261354655,"actual_cdr":0.0833999326475654,"pred_cdr":0.21836161613464355},{"period":"202402","n":14401,"actual_smm":0.00013887924449690992,"pred_smm":0.0001823124330257997,"actual_cdr":0.1665278551736593,"pred_cdr":0.21857619285583496},{"period":"202403","n":14436,"actual_smm":6.927126627874758e-05,"pred_smm":0.00018452151562087238,"actual_cdr":0.0830938566911521,"pred_cdr":0.22121667861938477},{"period":"202404","n":14427,"actual_smm":0.0002079434393844874,"pred_smm":0.00018850760534405708,"actual_cdr":0.24924693785515206,"pred_cdr":0.22600293159484863},{"period":"202405","n":14447,"actual_smm":0.0002768740915068872,"pred_smm":0.00018921069568023086,"actual_cdr":0.3317434253338969,"pred_cdr":0.22678375244140625},{"period":"202406","n":14481,"actual_smm":0.00027622401767833714,"pred_smm":0.00019049995171371847,"actual_cdr":0.3309657065214133,"pred_cdr":0.22835731506347656},{"period":"202407","n":14488,"actual_smm":0.0002070679182771949,"pred_smm":0.0001910054706968367,"actual_cdr":0.24819870815778744,"pred_cdr":0.22900104522705078},{"period":"202408","n":14523,"actual_smm":0.00027542518763340907,"pred_smm":0.00019174336921423674,"actual_cdr":0.33001001490788884,"pred_cdr":0.22985339164733887},{"period":"202409","n":14561,"actual_smm":6.86766018817389e-05,"pred_smm":0.0001920286740642041,"actual_cdr":0.08238080064373321,"pred_cdr":0.2302110195159912},{"period":"202410","n":14593,"actual_smm":0.00013705201123826493,"pred_smm":0.00019576576596591622,"actual_cdr":0.16433850062769206,"pred_cdr":0.23463964462280273},{"period":"202411","n":14622,"actual_smm":6.83900971139379e-05,"pred_smm":0.00019618957594502717,"actual_cdr":0.08203725401730866,"pred_cdr":0.23521184921264648},{"period":"202412","n":14656,"actual_smm":0.0002046943231441048,"pred_smm":0.00020024219702463597,"actual_cdr":0.24535683791706564,"pred_cdr":0.24006366729736328},{"period":"202501","n":14658,"actual_smm":0.0001364442625187611,"pred_smm":0.00020145956659689546,"actual_cdr":0.16361029844682573,"pred_cdr":0.24148821830749512},{"period":"202502","n":14681,"actual_smm":0.00020434575301409987,"pred_smm":0.0002027111768256873,"actual_cdr":0.24493949382179414,"pred_cdr":0.24299025535583496},{"period":"202503","n":14705,"actual_smm":0.0001360081604896294,"pred_smm":0.00020470556046348065,"actual_cdr":0.16308775967047717,"pred_cdr":0.2453446388244629},{"period":"202504","n":14735,"actual_smm":0.0005429250084832033,"pred_smm":0.00020764750661328435,"actual_cdr":0.6495680607617071,"pred_cdr":0.24890899658203125},{"period":"202505","n":14753,"actual_smm":0.00020334847149732258,"pred_smm":0.00024497805861756206,"actual_cdr":0.24374543673523208,"pred_cdr":0.293576717376709},{"period":"202506","n":14798,"actual_smm":0.00027030679821597514,"pred_smm":0.00022171209275256842,"actual_cdr":0.32388635804871946,"pred_cdr":0.26575326919555664},{"period":"202507","n":14826,"actual_smm":0.00013489815189531904,"pred_smm":0.0002133776870323345,"actual_cdr":0.1617577326886277,"pred_cdr":0.25576353073120117},{"period":"202508","n":14846,"actual_smm":0.0001347164219318335,"pred_smm":0.0002130973298335448,"actual_cdr":0.16153997989516444,"pred_cdr":0.25540590286254883},{"period":"202509","n":14899,"actual_smm":0.0,"pred_smm":0.00021482522424776107,"actual_cdr":0.0,"pred_cdr":0.2574741840362549},{"period":"202510","n":14957,"actual_smm":6.685832720465334e-05,"pred_smm":0.00021682711667381227,"actual_cdr":0.08020049698245213,"pred_cdr":0.2599000930786133},{"period":"202511","n":14985,"actual_smm":0.0,"pred_smm":0.00021732390450779349,"actual_cdr":0.0,"pred_cdr":0.26047229766845703},{"period":"202512","n":15054,"actual_smm":0.0001328550551348479,"pred_smm":0.00021991504763718694,"actual_cdr":0.15930962466189635,"pred_cdr":0.2636134624481201},{"period":"202601","n":15035,"actual_smm":0.0005986032590621882,"pred_smm":0.0002209486992796883,"actual_cdr":0.7159636727279928,"pred_cdr":0.26482343673706055},{"period":"202602","n":15030,"actual_smm":0.0002661343978709248,"pred_smm":0.00022074890148360282,"actual_cdr":0.31889423027193775,"pred_cdr":0.26460886001586914}],"yearly":[{"year":2018,"n":13898,"actual_smm":0.0001439055979277594,"pred_smm":0.00011249685485381633,"actual_cdr":0.17255010483526734,"pred_cdr":0.13488531112670898},{"year":2019,"n":168488,"actual_smm":7.715683016001139e-05,"pred_smm":0.0001169690876849927,"actual_cdr":0.09254891533091447,"pred_cdr":0.1402437686920166},{"year":2020,"n":170688,"actual_smm":0.00014060742407199101,"pred_smm":0.0001267435436602682,"actual_cdr":0.16859848506933783,"pred_cdr":0.15195608139038086},{"year":2021,"n":170455,"actual_smm":0.0001466662755565985,"pred_smm":0.00013464884250424802,"actual_cdr":0.17585762747750477,"pred_cdr":0.16145706176757812},{"year":2022,"n":169056,"actual_smm":0.0001892863903085368,"pred_smm":0.00015193020226433873,"actual_cdr":0.22690734388302047,"pred_cdr":0.18216967582702637},{"year":2023,"n":171086,"actual_smm":0.00015197035409092503,"pred_smm":0.00017462667892687023,"actual_cdr":0.1822120751731049,"pred_cdr":0.2093672752380371},{"year":2024,"n":174018,"actual_smm":0.00016664942707076278,"pred_smm":0.00019037800666410476,"actual_cdr":0.19979611885884152,"pred_cdr":0.22821426391601562},{"year":2025,"n":177897,"actual_smm":0.00016301567761120198,"pred_smm":0.0002149113133782521,"actual_cdr":0.1954435192688897,"pred_cdr":0.2576172351837158},{"year":2026,"n":30065,"actual_smm":0.00043239647430567106,"pred_smm":0.0002208488149335608,"actual_cdr":0.5176435657075706,"pred_cdr":0.2646803855895996}],"calibration":[{"decile":0,"n":124566,"pred_smm":7.319293217733502e-06,"actual_smm":1.6055745548544546e-05,"events":2,"pred_cdr":0.008797645568847656,"actual_cdr":0.019265193355322285},{"decile":1,"n":124565,"pred_smm":1.3079018572170753e-05,"actual_smm":2.4083811664592782e-05,"events":3,"pred_cdr":0.015664100646972656,"actual_cdr":0.02889674610697668},{"decile":2,"n":124565,"pred_smm":1.934849569806829e-05,"actual_smm":5.6195560550716494e-05,"events":7,"pred_cdr":0.023245811462402344,"actual_cdr":0.06741383415374003},{"decile":3,"n":124565,"pred_smm":2.7279616915620863e-05,"actual_smm":5.6195560550716494e-05,"events":7,"pred_cdr":0.03275275230407715,"actual_cdr":0.06741383415374003},{"decile":4,"n":124565,"pred_smm":3.844136153929867e-05,"actual_smm":6.422349777224742e-05,"events":8,"pred_cdr":0.046122074127197266,"actual_cdr":0.07704098041305674},{"decile":5,"n":124565,"pred_smm":5.800282451673411e-05,"actual_smm":6.422349777224742e-05,"events":8,"pred_cdr":0.06957054138183594,"actual_cdr":0.07704098041305674},{"decile":6,"n":124565,"pred_smm":9.846728789852932e-05,"actual_smm":6.422349777224742e-05,"events":8,"pred_cdr":0.11809468269348145,"actual_cdr":0.07704098041305674},{"decile":7,"n":124565,"pred_smm":0.0001718970452202484,"actual_smm":0.00011239112110143299,"events":14,"pred_cdr":0.20608305931091309,"actual_cdr":0.13478600690406406},{"decile":8,"n":124565,"pred_smm":0.00029795849695801735,"actual_smm":0.00024083811664592783,"events":30,"pred_cdr":0.35697221755981445,"actual_cdr":0.2886232273442757},{"decile":9,"n":124565,"pred_smm":0.0008691259426996112,"actual_smm":0.0008509613454822783,"events":106,"pred_cdr":1.0380148887634277,"actual_cdr":1.0163878529052761}],"fha_cuts":[{"fha_category":"220","n":2514,"actual_smm":0.002386634844868735,"pred_smm":0.0004499867500271648,"events":6,"actual_cdr":2.8266655184636447,"pred_cdr":0.5386829376220703},{"fha_category":"221d4","n":210422,"actual_smm":7.128532187699005e-05,"pred_smm":0.000102105965197552,"events":15,"actual_cdr":0.08550885567945032,"pred_cdr":0.12245774269104004},{"fha_category":"223a7","n":137075,"actual_smm":0.000116724420937443,"pred_smm":0.00015479372814297676,"events":16,"actual_cdr":0.13997941780593548,"pred_cdr":0.18559694290161133},{"fha_category":"223f","n":467250,"actual_smm":2.568218298555377e-05,"pred_smm":2.9922064641141333e-05,"events":12,"actual_cdr":0.03081426676351251,"pred_cdr":0.03589987754821777},{"fha_category":"232","n":312390,"actual_smm":0.00042895099074874356,"pred_smm":0.00043370568891987205,"events":134,"actual_cdr":0.5135285305211901,"pred_cdr":0.5191802978515625},{"fha_category":"241","n":9003,"actual_smm":0.00022214817283127845,"pred_smm":0.00022417028958443552,"events":2,"actual_cdr":0.2662523397118033,"pred_cdr":0.2686798572540283},{"fha_category":"538","n":89034,"actual_smm":3.3694992924051485e-05,"pred_smm":2.867691364372149e-05,"events":3,"actual_cdr":0.040426499023604734,"pred_cdr":0.03439784049987793},{"fha_category":"OTHER","n":17963,"actual_smm":0.00027834994154651225,"pred_smm":8.60511718201451e-05,"events":5,"actual_cdr":0.33350904466122877,"pred_cdr":0.10323524475097656}],"lp_cuts":[{"loan_purpose":"538","n":89034,"actual_smm":3.3694992924051485e-05,"pred_smm":2.867691364372149e-05,"events":3,"actual_cdr":0.040426499023604734,"pred_cdr":0.03439784049987793},{"loan_purpose":"NC","n":151527,"actual_smm":0.0002573798728939397,"pred_smm":0.00029982096748426557,"events":39,"actual_cdr":0.3084190093218919,"pred_cdr":0.35918354988098145},{"loan_purpose":"OTHER","n":17963,"actual_smm":0.00027834994154651225,"pred_smm":8.60511718201451e-05,"events":5,"actual_cdr":0.33350904466122877,"pred_cdr":0.10323524475097656},{"loan_purpose":"RP","n":987127,"actual_smm":0.00014790396777719585,"pred_smm":0.00015184326912276447,"events":146,"actual_cdr":0.1773404536373202,"pred_cdr":0.1820981502532959}],"vintage_cuts":[{"vintage_year":1999,"n":1548,"actual_smm":0.0012919896640826874,"pred_smm":0.0008145553292706609,"events":2,"actual_cdr":1.539417939152865,"pred_cdr":0.9730994701385498},{"vintage_year":2001,"n":3659,"actual_smm":0.0005465974309920743,"pred_smm":0.0006476080743595958,"events":2,"actual_cdr":0.6539486317525878,"pred_cdr":0.7743656635284424},{"vintage_year":2002,"n":7616,"actual_smm":0.0006565126050420169,"pred_smm":0.0005433156038634479,"events":5,"actual_cdr":0.7849766839604033,"pred_cdr":0.6500124931335449},{"vintage_year":2003,"n":18100,"actual_smm":0.0,"pred_smm":0.00043803753214888275,"events":0,"actual_cdr":0.0,"pred_cdr":0.5243778228759766},{"vintage_year":2004,"n":15705,"actual_smm":0.00025469595670168737,"pred_smm":0.00037136554601602256,"events":4,"actual_cdr":0.30520736912038604,"pred_cdr":0.4446983337402344},{"vintage_year":2005,"n":16622,"actual_smm":0.00030080616051016726,"pred_smm":0.00023463428078684956,"events":5,"actual_cdr":0.36037079432370556,"pred_cdr":0.2812325954437256},{"vintage_year":2006,"n":25601,"actual_smm":0.0002734268192648725,"pred_smm":0.00016140735533554107,"events":7,"actual_cdr":0.3276192018770163,"pred_cdr":0.19351840019226074},{"vintage_year":2007,"n":22925,"actual_smm":4.362050163576881e-05,"pred_smm":0.00015044276369735599,"events":1,"actual_cdr":0.05233204565082694,"pred_cdr":0.18038153648376465},{"vintage_year":2008,"n":16970,"actual_smm":0.00011785503830288745,"pred_smm":0.00017662259051576257,"events":2,"actual_cdr":0.14133440922118323,"pred_cdr":0.21172761917114258},{"vintage_year":2009,"n":20964,"actual_smm":0.00038160656363289447,"pred_smm":0.0002333307493245229,"events":8,"actual_cdr":0.456967982312273,"pred_cdr":0.2796649932861328},{"vintage_year":2010,"n":35287,"actual_smm":0.0002267123869980446,"pred_smm":0.00022998305212240666,"events":8,"actual_cdr":0.27171589048344824,"pred_cdr":0.27559995651245117},{"vintage_year":2011,"n":59500,"actual_smm":0.00028571428571428574,"pred_smm":0.00023015185433905572,"events":17,"actual_cdr":0.342318880136816,"pred_cdr":0.27580857276916504},{"vintage_year":2012,"n":110476,"actual_smm":0.00017198305514319853,"pred_smm":0.00022160116350278258,"events":19,"actual_cdr":0.20618456211104474,"pred_cdr":0.2656102180480957},{"vintage_year":2013,"n":116561,"actual_smm":0.00019732157411140948,"pred_smm":0.00021198124159127474,"events":23,"actual_cdr":0.23652908157812957,"pred_cdr":0.2540469169616699},{"vintage_year":2014,"n":83302,"actual_smm":0.00013204965066865141,"pred_smm":0.0001534311886643991,"events":11,"actual_cdr":0.1583445465160871,"pred_cdr":0.18395185470581055},{"vintage_year":2015,"n":80351,"actual_smm":0.00019912633321302785,"pred_smm":0.0001379196037305519,"events":16,"actual_cdr":0.2386900749240306,"pred_cdr":0.16538500785827637},{"vintage_year":2016,"n":79397,"actual_smm":0.00020151894907868056,"pred_smm":0.000109545246232301,"events":16,"actual_cdr":0.24155489360028204,"pred_cdr":0.13138651847839355},{"vintage_year":2017,"n":98038,"actual_smm":0.00012240151777882045,"pred_smm":9.28464942262508e-05,"events":12,"actual_cdr":0.1467829795996578,"pred_cdr":0.11138319969177246},{"vintage_year":2018,"n":78932,"actual_smm":5.067653169817058e-05,"pred_smm":8.117299876175821e-05,"events":4,"actual_cdr":0.060794891368964876,"pred_cdr":0.09737610816955566},{"vintage_year":2019,"n":63750,"actual_smm":4.705882352941177e-05,"pred_smm":8.211452222894877e-05,"events":3,"actual_cdr":0.05645597461078067,"pred_cdr":0.09852051734924316},{"vintage_year":2020,"n":105498,"actual_smm":0.00013270393751540314,"pred_smm":8.081404666882008e-05,"events":14,"actual_cdr":0.1591285482050675,"pred_cdr":0.09694695472717285},{"vintage_year":2021,"n":106211,"actual_smm":2.8245661937087494e-05,"pred_smm":7.838361489120871e-05,"events":3,"actual_cdr":0.033889529225228365,"pred_cdr":0.09401440620422363},{"vintage_year":2022,"n":47160,"actual_smm":8.481764206955047e-05,"pred_smm":0.00013332927483133972,"events":4,"actual_cdr":0.10173370329102926,"pred_cdr":0.1598834991455078},{"vintage_year":2023,"n":14692,"actual_smm":0.0001361285053090117,"pred_smm":7.21559117664583e-05,"events":2,"actual_cdr":0.1632319574491059,"pred_cdr":0.08658170700073242},{"vintage_year":2024,"n":8237,"actual_smm":0.0,"pred_smm":9.197670442517847e-05,"events":0,"actual_cdr":0.0,"pred_cdr":0.11031031608581543},{"vintage_year":2025,"n":4707,"actual_smm":0.0,"pred_smm":9.662122465670109e-05,"events":0,"actual_cdr":0.0,"pred_cdr":0.11588335037231445}],"age_cuts":[{"age_bucket":"0-12","n":83458,"actual_smm":4.792829926430061e-05,"pred_smm":6.834969826741144e-05,"events":4,"actual_cdr":0.05749880053463885,"pred_cdr":0.08201003074645996},{"age_bucket":"13-24","n":89646,"actual_smm":1.1154987394864244e-05,"pred_smm":7.338884461205453e-05,"events":1,"actual_cdr":0.013385163641710385,"pred_cdr":0.0880122184753418},{"age_bucket":"25-36","n":107448,"actual_smm":6.51477924205197e-05,"pred_smm":7.796308636898175e-05,"events":7,"actual_cdr":0.07814934503671545,"pred_cdr":0.09351372718811035},{"age_bucket":"37-48","n":115685,"actual_smm":1.728832605782945e-05,"pred_smm":8.665433415444568e-05,"events":2,"actual_cdr":0.020744018734064618,"pred_cdr":0.10395050048828125},{"age_bucket":"49-60","n":109224,"actual_smm":0.0001831099392075002,"pred_smm":8.989355410449207e-05,"events":20,"actual_cdr":0.2195107690142417,"pred_cdr":0.10780692100524902},{"age_bucket":"61-72","n":96363,"actual_smm":0.00014528397829042267,"pred_smm":0.00010664543515304103,"events":14,"actual_cdr":0.1742015323243029,"pred_cdr":0.12788772583007812},{"age_bucket":"73-96","n":192167,"actual_smm":0.00015091040605306842,"pred_smm":0.00013363600010052323,"events":29,"actual_cdr":0.18094225477388592,"pred_cdr":0.16024112701416016},{"age_bucket":"97-120","n":152835,"actual_smm":0.00021591912847188145,"pred_smm":0.00018520363664720207,"events":33,"actual_cdr":0.2587954764567857,"pred_cdr":0.22200345993041992},{"age_bucket":"120+","n":298825,"actual_smm":0.0002777545386095541,"pred_smm":0.0003167484828736633,"events":83,"actual_cdr":0.3327967434024748,"pred_cdr":0.3794252872467041}],"yearly_calib":[{"year":2018,"mean_x_std":[-0.23551154153812598,-0.48322357955056483,0.2179303072496942,0.1391836954957548,-0.05323580924273052,-0.04638786057908512,-0.04997945322477829,0.1192380318042614,-0.08960096200330084,-0.05789418206109917],"mean_pred":"0.000112496855","mean_actual":"0.00014390559","n":13898},{"year":2019,"mean_x_std":[-0.17604167748593372,-0.4347708785269574,0.21222584286418023,0.14696972345582474,-0.0443440203618915,-0.5198217357282121,-0.04670269399517696,0.08983932182855753,-0.07943823973647234,-0.04648580488206133],"mean_pred":"0.00011696909","mean_actual":"7.715683e-05","n":168488},{"year":2020,"mean_x_std":[-0.10344912811839987,-0.31125679488123065,0.1429317833378738,0.1104172147701508,-0.025949870060569213,-1.2547547119049083,-0.030565716686613516,0.04963274077167661,-0.0481737370700214,-0.03411531609276685],"mean_pred":"0.00012674354","mean_actual":"0.00014060743","n":170688},{"year":2021,"mean_x_std":[-0.11051067249237335,-0.1112976158365661,-0.0543705719388915,-0.012797703177479027,-0.0021991229442658985,-1.266059785298906,-0.02559355619713139,0.05957582412267213,-0.01622785841435022,-0.04825870213695055],"mean_pred":"0.00013464884","mean_actual":"0.00014666628","n":170455},{"year":2022,"mean_x_std":[-0.09222269428288556,0.06466528513249678,-0.1791290739551539,-0.09517937276978486,0.021589639126837038,0.03381393868747634,-0.03310908401145552,0.029783090767976847,0.0022630455952892922,-0.04476909792696281],"mean_pred":"0.0001519302","mean_actual":"0.0001892864","n":169056},{"year":2023,"mean_x_std":[-0.003619019523624084,0.17356378939630507,-0.15456097372081876,-0.07471032620518701,0.04472346561314558,0.977186498013974,-0.045998069938259306,-0.013623746571362958,0.0167405874189598,-0.022792057664210177],"mean_pred":"0.00017462668","mean_actual":"0.00015197035","n":171086},{"year":2024,"mean_x_std":[0.11622098937131772,0.25222585658568725,-0.10865499153194641,-0.056210146832758504,0.06287889757127765,0.9896322237498419,-0.04574367607064176,-0.04419620417769282,0.0313930144293173,0.003464652969178756],"mean_pred":"0.000190378","mean_actual":"0.00016664942","n":174018},{"year":2025,"mean_x_std":[0.22476752974069966,0.3417531842073644,-0.03499952938665,-0.04728220742341864,0.09160609489137324,1.0006764579714666,-0.03450307864993041,-0.07545570336609808,0.033866936575746784,0.024158933303048954],"mean_pred":"0.00021491131","mean_actual":"0.00016301568","n":177897},{"year":2026,"mean_x_std":[0.27759145549226677,0.4029419006215699,0.02616880141854108,-0.044508837622650926,0.10924212545994096,0.6570718521328788,-0.027891702174585274,-0.0924869650912606,0.03454201687359679,0.0288151408439267],"mean_pred":"0.00022084881","mean_actual":"0.00043239648","n":30065}],"monthly_calib":[{"period":"201812","mean_x_std":[-0.23551154153812598,-0.48322357955056483,0.2179303072496942,0.1391836954957548,-0.05323580924273052,-0.04638786057908512,-0.04997945322477829,0.1192380318042614,-0.08960096200330084,-0.05789418206109917],"mean_pred":"0.000112496855","mean_actual":"0.00014390559","n":13898},{"period":"201901","mean_x_std":[-0.22535069133509433,-0.4770009652422781,0.21859387234277125,0.1416271648342438,-0.052041319021010335,-0.060180725585445315,-0.05108460645986707,0.11544715650087299,-0.08809723662835697,-0.0553210457128843],"mean_pred":"0.000113656046","mean_actual":"0.00014399884","n":13889},{"period":"201902","mean_x_std":[-0.21549195947658045,-0.4701077344086359,0.21957464032003443,0.14493155233074412,-0.05065778257105025,-0.03949118262727827,-0.04970677109728177,0.11199522839621753,-0.0879255572909192,-0.05450940925957278],"mean_pred":"0.00011502054","mean_actual":"0.0","n":13936},{"period":"201903","mean_x_std":[-0.2043044522614305,-0.4644330638323643,0.2194861719535063,0.14729530319139392,-0.05068974545588618,-0.2256505299737116,-0.05035854255266652,0.10712755517031385,-0.0856699827173952,-0.052488495144664714],"mean_pred":"0.00011557075","mean_actual":"0.0","n":13932},{"period":"201904","mean_x_std":[-0.19489792026208957,-0.4570767283738107,0.22034724449956183,0.1502650355276218,-0.04873376261378675,-0.28778260862275556,-0.050603794398349757,0.10186517394674602,-0.08523292576979308,-0.04976915970356204],"mean_pred":"0.00011686317","mean_actual":"0.0002861435","n":13979},{"period":"201905","mean_x_std":[-0.1866128359497803,-0.4487596344491283,0.2188817515104762,0.1521770066280098,-0.047006450608376944,-0.563502204591937,-0.05014594100686134,0.097202149484116,-0.08437668156303586,-0.049964313883207705],"mean_pred":"0.00011531681","mean_actual":"7.144899e-05","n":13996},{"period":"201906","mean_x_std":[-0.17926556831299473,-0.4396176496314091,0.21552375032312987,0.15289965174400985,-0.043123346570979375,-0.5843520048536334,-0.05040679542091564,0.09258920473284961,-0.08175141884649326,-0.044657817319091846],"mean_pred":"0.000115453826","mean_actual":"7.131142e-05","n":14023},{"period":"201907","mean_x_std":[-0.17101412238230376,-0.43140823009149704,0.21442387104204105,0.153713789658821,-0.0432674838812629,-0.6669923786285229,-0.049893237578810326,0.08745953678855709,-0.07587871751058366,-0.04427082174978649],"mean_pred":"0.00011578715","mean_actual":"0.0","n":14051},{"period":"201908","mean_x_std":[-0.16412283260578017,-0.42187382040908766,0.21063618390960281,0.1520165349503073,-0.04273529508091161,-0.9151127522381697,-0.04518834111770818,0.08188380113595993,-0.07485407246129831,-0.04377418074635631],"mean_pred":"0.00011612728","mean_actual":"0.0","n":14074},{"period":"201909","mean_x_std":[-0.15573654693811118,-0.41397361149863593,0.20729289844192886,0.14790110685387436,-0.040530751892228246,-0.7979226317805768,-0.0430105429928319,0.07749633616060357,-0.07432522416925755,-0.042794277338213935],"mean_pred":"0.00011738993","mean_actual":"7.086168e-05","n":14112},{"period":"201910","mean_x_std":[-0.1467972141753466,-0.4066753507529002,0.2050377313576519,0.14495698068455118,-0.03937940185356909,-0.8186388665381623,-0.0404863586231498,0.07288223679993103,-0.07279498204235782,-0.04171287297544785],"mean_pred":"0.00011934146","mean_actual":"7.0736365e-05","n":14137},{"period":"201911","mean_x_std":[-0.13878415380686837,-0.3985173158679329,0.2002914331658569,0.14054498571389135,-0.03857187223939929,-0.6807419114399293,-0.0410041296861197,0.0691475480689598,-0.07190392591928003,-0.040765061664918285],"mean_pred":"0.000120787015","mean_actual":"7.0671376e-05","n":14150},{"period":"201912","mean_x_std":[-0.13244509490573755,-0.3889590911790063,0.1962053684339591,0.13541208477021607,-0.035799728673837884,-0.577264244932789,-0.03920748265843831,0.06340133062396633,-0.0708878086457087,-0.03862978140367681],"mean_pred":"0.00012213903","mean_actual":"0.00014075586","n":14209},{"period":"202001","mean_x_std":[-0.12721516124460638,-0.37813332434395913,0.1912094927791476,0.13293395974594927,-0.03267890416891401,-0.8876913223185982,-0.03674019722503522,0.057889504481386495,-0.06987015743329518,-0.03702766227654984],"mean_pred":"0.000121887024","mean_actual":"0.0","n":14195},{"period":"202002","mean_x_std":[-0.11828965986169838,-0.370312930127951,0.18757965109397023,0.13275185410954568,-0.03178329844135395,-1.0461926106082629,-0.03621402603375231,0.05497127261440715,-0.069255537983395,-0.035220234221014196],"mean_pred":"0.00012254583","mean_actual":"0.00014094432","n":14190},{"period":"202003","mean_x_std":[-0.11128919130320744,-0.3603418161610418,0.18320594558360664,0.13320990438807043,-0.031148322093703714,-1.0598361843613344,-0.035263055066057446,0.05233005260543404,-0.0688054680336613,-0.03640094444435261],"mean_pred":"0.00012372762","mean_actual":"0.0","n":14178},{"period":"202004","mean_x_std":[-0.10606562420185127,-0.3488812706968224,0.17907959964859438,0.13450848005508878,-0.028943453363894173,-1.1875148620798985,-0.035386326263799714,0.05267830677149387,-0.05283444891820572,-0.03319971695650475],"mean_pred":"0.00012464837","mean_actual":"0.00014091453","n":14193},{"period":"202005","mean_x_std":[-0.10174228988321708,-0.3365419600551328,0.17140565758098184,0.1326808140594175,-0.02734777299645402,-1.2324225630592545,-0.0329982360052876,0.05036056197102005,-0.051754716233354474,-0.0336186697860521],"mean_pred":"0.00012573299","mean_actual":"0.00014091453","n":14193},{"period":"202006","mean_x_std":[-0.0968320005348693,-0.3248471733284372,0.16145216053115324,0.1259452718900621,-0.028727438293508566,-1.2668665234484942,-0.030422984798827574,0.0452484036377709,-0.04801869627257115,-0.03262019029913102],"mean_pred":"0.00012687962","mean_actual":"0.00014072614","n":14212},{"period":"202007","mean_x_std":[-0.09918122023678898,-0.30638101984945576,0.14773607575491574,0.12070651107959533,-0.025405170140641458,-1.4186022812061096,-0.0288532792852166,0.046207702293824614,-0.043904645255442416,-0.03038232996222678],"mean_pred":"0.00012756862","mean_actual":"0.00028089888","n":14240},{"period":"202008","mean_x_std":[-0.09875324904964614,-0.29078973803955577,0.13230524657193785,0.10793003512367738,-0.02407381213978523,-1.4601717698917385,-0.02709408580241946,0.04242551102049173,-0.039857590794103864,-0.030945031646756316],"mean_pred":"0.00012925793","mean_actual":"0.00021021652","n":14271},{"period":"202009","mean_x_std":[-0.09775001873665184,-0.2759145268304751,0.11715549297772171,0.09768085254022499,-0.02165573159650497,-1.4668193042766613,-0.02654068957990512,0.045307514956498145,-0.03841747745780766,-0.03244273531178985],"mean_pred":"0.00012800178","mean_actual":"0.00042013865","n":14281},{"period":"202010","mean_x_std":[-0.09557404504770659,-0.26232677641369045,0.10000806108576243,0.08366180334438462,-0.021723839682357318,-1.2947156206232493,-0.025716348856437105,0.04682005126269258,-0.03464449927920387,-0.0340914835782946],"mean_pred":"0.00013012832","mean_actual":"7.0028014e-05","n":14280},{"period":"202011","mean_x_std":[-0.09178283219595484,-0.2506164765240689,0.08399725972307624,0.07102134420431087,-0.0214527315098219,-1.3426341246486297,-0.02495434587469255,0.049771313322151706,-0.03189174413513484,-0.034950952268534785],"mean_pred":"0.0001300333","mean_actual":"7.0274065e-05","n":14230},{"period":"202012","mean_x_std":[-0.09709556753899384,-0.23050863631370827,0.06032344985720563,0.05241681197825132,-0.016555290557378626,-1.3841176955184533,-0.02697410436003405,0.05163832518673111,-0.02911082611352153,-0.038598963196122583],"mean_pred":"0.00013044557","mean_actual":"7.029877e-05","n":14225},{"period":"202101","mean_x_std":[-0.10023692977142819,-0.21200668719962543,0.03966200681143544,0.03492394197331746,-0.01708794246756893,-1.3496126879549792,-0.02547016395883212,0.05474953594473329,-0.026941713423044474,-0.03968493435793828],"mean_pred":"0.00013116401","mean_actual":"0.0","n":14149},{"period":"202102","mean_x_std":[-0.09993073463911091,-0.19534096498076786,0.021119932354661804,0.02253309286627607,-0.013681336763053364,-1.2118227402251394,-0.023096275612279667,0.05803098078882596,-0.025138177063345816,-0.04185563485315654],"mean_pred":"0.00013340487","mean_actual":"0.0","n":14169},{"period":"202103","mean_x_std":[-0.10243574711088227,-0.17599869365340268,-0.0002921781578864401,0.00797278389865589,-0.01208523276355498,-1.0598357350637235,-0.021262689570846094,0.060074198499496106,-0.023846113653254165,-0.043703638723309214],"mean_pred":"0.00013573331","mean_actual":"0.00014082524","n":14202},{"period":"202104","mean_x_std":[-0.10617114994199536,-0.15556413014461612,-0.02026060788698323,-0.002702291526598643,-0.007454562688405224,-1.1358409217244956,-0.022279168771120062,0.05916875841781358,-0.023418588242030955,-0.04462382545838634],"mean_pred":"0.00013456748","mean_actual":"0.00021092597","n":14223},{"period":"202105","mean_x_std":[-0.11207636588495963,-0.13308397683397682,-0.03920479825020841,-0.011096417422711368,-0.0043083209663409856,-1.246136253948754,-0.02429023975654835,0.06365303958077395,-0.01924549878041089,-0.048502588456201735],"mean_pred":"0.00013295823","mean_actual":"0.0","n":14245},{"period":"202106","mean_x_std":[-0.11249224617757511,-0.11647015977340287,-0.05124003357264256,-0.015056970025034849,-0.004345758790110314,-1.3289323319760078,-0.023937189108480132,0.06587970207320103,-0.018385021102627217,-0.049212269013733025],"mean_pred":"0.00013417043","mean_actual":"0.00014071625","n":14213},{"period":"202107","mean_x_std":[-0.11597473577952525,-0.0971039168100304,-0.06273636478986501,-0.015342574544339495,-9.372070403421914e-05,-1.4256325307160937,-0.02800003992625281,0.06362423041546922,-0.011566641662121322,-0.05028632581799726],"mean_pred":"0.00013335297","mean_actual":"0.00042185193","n":14223},{"period":"202108","mean_x_std":[-0.11469398532901798,-0.08218711990493911,-0.07547952462961008,-0.018497671092952694,0.001356260465072082,-1.3566044987858952,-0.027388055045325477,0.06163466084110844,-0.00939385311023609,-0.050352328532450905],"mean_pred":"0.0001355245","mean_actual":"7.0382885e-05","n":14208},{"period":"202109","mean_x_std":[-0.11495212064355674,-0.06607445980240909,-0.0914343184513352,-0.026082724211338282,0.005217817980725415,-1.30842918240513,-0.02764395675605565,0.05985163610247936,-0.01008405866374956,-0.0521273861614986],"mean_pred":"0.00013517632","mean_actual":"0.00014054813","n":14230},{"period":"202110","mean_x_std":[-0.11480178188270246,-0.05041819397832306,-0.10813002895301496,-0.034401066739794234,0.006099294743067782,-1.2877655974911972,-0.02674262033381932,0.059833343935684416,-0.010589270793216329,-0.05373324112153389],"mean_pred":"0.0001363457","mean_actual":"0.0002112676","n":14200},{"period":"202111","mean_x_std":[-0.11559623672062033,-0.03418974398962294,-0.12325752837408463,-0.042783848115582314,0.008454585374199056,-1.2737985365727538,-0.028576419649283966,0.055944354915900926,-0.009008716486017731,-0.05272526721554127],"mean_pred":"0.0001369761","mean_actual":"0.00021123786","n":14202},{"period":"202112","mean_x_std":[-0.11665992502950814,-0.017713240173954883,-0.140636079315235,-0.052800885299221334,0.011462694595097135,-1.2118213678563878,-0.02860402210798217,0.05244271288663369,-0.007177590937436689,-0.05247186060377176],"mean_pred":"0.00013640393","mean_actual":"0.0002114016","n":14191},{"period":"202201","mean_x_std":[-0.11253333361605236,-0.0058320146561890995,-0.15369320615055707,-0.062287565328951466,0.010096154247236954,-1.0598386638383641,-0.027208212152311215,0.04866442460050411,-0.003544758619969872,-0.05245431370605156],"mean_pred":"0.00013843722","mean_actual":"0.00014237915","n":14047},{"period":"202202","mean_x_std":[-0.10939968789098549,0.007963592557459615,-0.1639270415542699,-0.0776253236722022,0.011383781289583814,-0.8945322898550082,-0.02435384622956893,0.04810908692550091,-0.00406271947439766,-0.05022653501316595],"mean_pred":"0.00014301349","mean_actual":"0.0002129623","n":14087},{"period":"202203","mean_x_std":[-0.10664420247534294,0.022043582684230116,-0.17373258719693746,-0.09204662327865802,0.013906460762970434,-0.5635020046323373,-0.024974297821378093,0.046959283553707196,-0.0028071331163171368,-0.04750831871189565],"mean_pred":"0.00014603222","mean_actual":"0.00021267546","n":14106},{"period":"202204","mean_x_std":[-0.10476843046952593,0.036525003214564415,-0.1826820157037014,-0.10280161412701298,0.01692085612510309,-0.12914837286231468,-0.02712801826121994,0.0413870925123927,-0.00206563055988879,-0.04684552594292042],"mean_pred":"0.00014887215","mean_actual":"0.0","n":14096},{"period":"202205","mean_x_std":[-0.10230247252701735,0.0505318756944874,-0.1859307415192457,-0.10799087487739467,0.018786533506186597,-0.13601680687120035,-0.028527588684522126,0.03677695215161309,0.0015499832841508311,-0.04593483164272365],"mean_pred":"0.00014978815","mean_actual":"0.00021207408","n":14146},{"period":"202206","mean_x_std":[-0.09732197500532179,0.06203254164301426,-0.18687954881468194,-0.10961304707040952,0.018770382875141916,0.06393625991183566,-0.03294139668659483,0.03417582868184781,0.003159086876643657,-0.04697929852766555],"mean_pred":"0.00015076913","mean_actual":"7.095721e-05","n":14093},{"period":"202207","mean_x_std":[-0.09156765841320554,0.0725888838275426,-0.18734890494653,-0.10902222243022275,0.02033794323180134,-0.12914837128649717,-0.034860596743127664,0.02967800997570554,0.0041369339655509514,-0.04615738082956159],"mean_pred":"0.00015127692","mean_actual":"0.00035498757","n":14085},{"period":"202208","mean_x_std":[-0.08557840853155597,0.08292824247297166,-0.18715416009804703,-0.10752698677185327,0.02442863272727424,0.2225767752456719,-0.03666830137298008,0.024135392017020762,0.004498017431405042,-0.04383535048158791],"mean_pred":"0.0001541626","mean_actual":"0.00014190435","n":14094},{"period":"202209","mean_x_std":[-0.08183190637716345,0.09533053680187824,-0.18750883272287475,-0.10378277582250871,0.029667085824774328,0.6982660653520151,-0.038551238920399016,0.018658370044373932,0.003645097381550583,-0.040682623538730985],"mean_pred":"0.00015793633","mean_actual":"0.00028431302","n":14069},{"period":"202210","mean_x_std":[-0.07628128198424707,0.10594900042274831,-0.18531599740788537,-0.09893439439914116,0.029198921070526657,0.9880504767043432,-0.037261704322323334,0.013453190315656706,0.005496629203668732,-0.04157883456356799],"mean_pred":"0.00016140573","mean_actual":"0.00028479885","n":14045},{"period":"202211","mean_x_std":[-0.07257723078314804,0.11823916735022111,-0.18050355092193826,-0.08996590702864157,0.03164770407221776,0.6293572433091212,-0.04192581062942877,0.00981667804440255,0.008926047988851495,-0.039396066646002786],"mean_pred":"0.0001597796","mean_actual":"0.00028415147","n":14077},{"period":"202212","mean_x_std":[-0.06581137457590709,0.12760059680280456,-0.17524959403900325,-0.08046027921479697,0.03394289566179532,0.7190471695397208,-0.04312074747897252,0.005616823944833596,0.008225672453352548,-0.0360052208653433],"mean_pred":"0.00016169362","mean_actual":"7.08667e-05","n":14111},{"period":"202301","mean_x_std":[-0.05722320697174991,0.13544797339930925,-0.17130091062809955,-0.07530954748107067,0.03573243225292242,0.4638708543659228,-0.04199552870455508,0.0031255945684721485,0.008414592465905065,-0.034837442385234015],"mean_pred":"0.00016192265","mean_actual":"0.00021253985","n":14115},{"period":"202302","mean_x_std":[-0.04712557241650249,0.14208407196124725,-0.16797963788849918,-0.07544588060275903,0.0373995993464092,0.6362800595448441,-0.042390311511635095,0.0006147929658080269,0.009071536127843068,-0.032519828035550216],"mean_pred":"0.0001648487","mean_actual":"0.00014135275","n":14149},{"period":"202303","mean_x_std":[-0.0374813262715692,0.14915890594155387,-0.1651980878267326,-0.07688295350394811,0.04022796424310623,0.6225016551440002,-0.04297974872105013,-0.0030836636779406484,0.010244675026865107,-0.03044859299334307],"mean_pred":"0.00016622331","mean_actual":"0.0005640158","n":14184},{"period":"202304","mean_x_std":[-0.029870020023351054,0.1581767132825164,-0.16238505482900487,-0.07785689955962806,0.04194662083496679,0.6845687295175841,-0.04572783243043687,-0.006757550834727275,0.013921920622585607,-0.029733507147096782],"mean_pred":"0.00016758857","mean_actual":"7.047713e-05","n":14189},{"period":"202305","mean_x_std":[-0.018406031756197937,0.1633993937431903,-0.15878685895323702,-0.0785449867457692,0.04205683087826646,0.8707909510974624,-0.04686278953643417,-0.009678425943735832,0.014768790581986218,-0.0275159964795423],"mean_pred":"0.00017090415","mean_actual":"0.00014058765","n":14226},{"period":"202306","mean_x_std":[-0.007994178938445798,0.1696046960234249,-0.1555366941663597,-0.07849965556867414,0.043190130374142724,0.9189499030905774,-0.045856342812149196,-0.01253113144114671,0.01528229871013997,-0.025476026257355906],"mean_pred":"0.00017412167","mean_actual":"0.0","n":14253},{"period":"202307","mean_x_std":[0.00130208707716521,0.17679068976187345,-0.15463254482671748,-0.07742860448431475,0.0452041171368406,1.0087358701366982,-0.04680217284300517,-0.016121209616248248,0.018255277219839862,-0.02201840587553124],"mean_pred":"0.00017548267","mean_actual":"7.010165e-05","n":14265},{"period":"202308","mean_x_std":[0.01217396217772686,0.18245944324254004,-0.15116158190963233,-0.07639836654497613,0.04673496887681033,1.1259458506239943,-0.046150046316344485,-0.017840075641317947,0.0187395950282153,-0.020436497170988693],"mean_pred":"0.0001789324","mean_actual":"6.996432e-05","n":14293},{"period":"202309","mean_x_std":[0.02287207027836162,0.18819758365814865,-0.14839535616981578,-0.07505163259292194,0.04781508990820326,1.4569921956932113,-0.04780966617307121,-0.020189798554198637,0.019065397665699504,-0.016523978764015852],"mean_pred":"0.00018426294","mean_actual":"0.00020974621","n":14303},{"period":"202310","mean_x_std":[0.029017022813082372,0.19839934643653337,-0.14353599511133655,-0.07135433278343581,0.050651780971332036,1.7602406395865264,-0.04789722193345496,-0.024392782686745638,0.022534048721719557,-0.013889771443282361],"mean_pred":"0.00019000389","mean_actual":"0.0","n":14354},{"period":"202311","mean_x_std":[0.039142321081254344,0.20473960483853443,-0.14103258581254347,-0.06919212288252999,0.051383469200930114,1.2844551351703755,-0.04874564689455842,-0.02699172612854768,0.02438173466498066,-0.011245477116655076],"mean_pred":"0.00018121985","mean_actual":"0.0","n":14380},{"period":"202312","mean_x_std":[0.04781476732336957,0.21238303328804348,-0.13604802989130435,-0.06476005434782608,0.05395835597826087,0.8776769701086956,-0.04886738705842391,-0.028932039741847826,0.025820796535326086,-0.009456538722826088],"mean_pred":"0.00017947998","mean_actual":"0.00034782608","n":14375},{"period":"202401","mean_x_std":[0.05852633252608331,0.21823759834200968,-0.13233649113210907,-0.06244750713461639,0.054134330439201225,0.8845297508343183,-0.04823360192479837,-0.03135019899251721,0.028047086499143954,-0.008629420747977757],"mean_pred":"0.00018214974","mean_actual":"6.9526526e-05","n":14383},{"period":"202402","mean_x_std":[0.06935259809296013,0.22417798812799458,-0.12855016002306696,-0.06097824915723084,0.05616215955597702,1.0292979599940977,-0.04861454221657784,-0.03331385585270229,0.02872404261816128,-0.005788659662035189],"mean_pred":"0.00018231245","mean_actual":"0.00013887924","n":14401},{"period":"202403","mean_x_std":[0.08010870176988086,0.230091580131702,-0.12380030994832797,-0.05995738853143833,0.056551685158847675,0.994766095828138,-0.047295475243927534,-0.036865010952546545,0.02956328652313985,-0.0038183740249595737],"mean_pred":"0.00018452152","mean_actual":"6.9271264e-05","n":14436},{"period":"202404","mean_x_std":[0.09205685506667187,0.23488280979240314,-0.12064025290850056,-0.05821723750254514,0.05657909909181786,1.326004410133777,-0.048519289732359465,-0.037842824915685434,0.031085684830444868,-0.0013070934451922826],"mean_pred":"0.00018850762","mean_actual":"0.00020794343","n":14427},{"period":"202405","mean_x_std":[0.10350329714051792,0.24008165825409256,-0.11829912818459282,-0.057544204712970254,0.057708928236344485,1.1776893559216446,-0.04819356131868857,-0.039863984081632435,0.0317133931690511,0.0004308940118808288],"mean_pred":"0.0001892107","mean_actual":"0.00027687408","n":14447},{"period":"202406","mean_x_std":[0.1133552626609868,0.24680337799854118,-0.11274927767689127,-0.05543796983709257,0.06015717473677793,1.09842921867447,-0.04684607774033647,-0.04286572235278123,0.032564835343915084,0.002200712313697151],"mean_pred":"0.00019049995","mean_actual":"0.00027622402","n":14481},{"period":"202407","mean_x_std":[0.12404711347861161,0.2526792950685481,-0.10960250003505057,-0.05399400867986653,0.06250510170998197,0.8845314603033545,-0.04633552471226187,-0.0445743899922026,0.033735179427182196,0.0048935504199259195],"mean_pred":"0.00019100547","mean_actual":"0.00020706792","n":14488},{"period":"202408","mean_x_std":[0.13384979086244664,0.2594020449244302,-0.1029958322440052,-0.05273648053007514,0.06427271763565766,0.8086100226795427,-0.045501463129066826,-0.04742997317966544,0.0332387151825176,0.006826139535571002],"mean_pred":"0.00019174337","mean_actual":"0.00027542518","n":14523},{"period":"202409","mean_x_std":[0.141638952349169,0.26794218141031695,-0.09480947407136357,-0.052526387676466675,0.06686176483173159,0.6708203044519607,-0.04354536686450536,-0.05005377850749648,0.03267983897080601,0.00764487652765199],"mean_pred":"0.00019202869","mean_actual":"6.86766e-05","n":14561},{"period":"202410","mean_x_std":[0.1496012709967964,0.2762992470437453,-0.09154852678456708,-0.053386145815041884,0.07089950487284143,0.9983911111063524,-0.042753499112821614,-0.053106165386443846,0.031464682786662215,0.010659231885043342],"mean_pred":"0.00019576578","mean_actual":"0.000137052","n":14593},{"period":"202411","mean_x_std":[0.15835813810097799,0.28384815581828754,-0.08741061701492187,-0.0538266045892961,0.07282213772750393,0.8845336062525646,-0.04232945453287427,-0.055065970563673315,0.03215420273843566,0.01191645682127103],"mean_pred":"0.00019618958","mean_actual":"6.8390094e-05","n":14622},{"period":"202412","mean_x_std":[0.16784366457743416,0.2906921919776883,-0.08240875510669692,-0.053669900352777876,0.07540608701747578,1.1190913171226802,-0.04116580579999232,-0.057355251895288194,0.03168741376118889,0.01607712283405154],"mean_pred":"0.0002002422","mean_actual":"0.00020469433","n":14656},{"period":"202501","mean_x_std":[0.1773811222700488,0.29754006584501635,-0.07979380227254315,-0.05348243250139642,0.07817549203879708,1.1190913238504572,-0.040625800310890386,-0.06062975422977214,0.033212879049223334,0.017445361667903194],"mean_pred":"0.00020145957","mean_actual":"0.00013644426","n":14658},{"period":"202502","mean_x_std":[0.18771656858247907,0.30397664684583814,-0.0749304180094595,-0.05304169601254385,0.0804062123503593,0.9465085745393707,-0.03827655959312845,-0.062369494272199184,0.03350236605707951,0.018032192721060596],"mean_pred":"0.00020271118","mean_actual":"0.00020434575","n":14681},{"period":"202503","mean_x_std":[0.19688406499702482,0.3115584356936416,-0.06675128022329778,-0.05110152580834538,0.083565118887602,0.9811845195086705,-0.037662588856893914,-0.06525593757305126,0.0342905593866882,0.019400307695219526],"mean_pred":"0.00020470556","mean_actual":"0.00013600817","n":14705},{"period":"202504","mean_x_std":[0.2065573007242535,0.3186078400704106,-0.05893265148482567,-0.050669895530677383,0.08466798531875636,1.0636806895783848,-0.03712843321200585,-0.0676945536509586,0.033907141813311205,0.020194072742805182],"mean_pred":"0.00020764752","mean_actual":"0.00054292503","n":14735},{"period":"202505","mean_x_std":[0.21487848538750592,0.32687773646673557,-0.05103112469444774,-0.04885397382100251,0.08689003401850472,1.2155708597933472,-0.03766216556557088,-0.07020648177224548,0.03378143289861199,0.02292060218551947],"mean_pred":"0.00024497803","mean_actual":"0.00020334848","n":14753},{"period":"202506","mean_x_std":[0.22334442365522367,0.33496466609719217,-0.041990673788529276,-0.04721826604128303,0.08858033298946648,1.0773961087435802,-0.03648726433285959,-0.07295833566508143,0.034375640955756265,0.02410605521214332],"mean_pred":"0.0002217121","mean_actual":"0.0002703068","n":14798},{"period":"202507","mean_x_std":[0.23247246180696074,0.3423593568203662,-0.03308180188032742,-0.045382429838470004,0.09078803706326723,1.1534051507908405,-0.035424531334311345,-0.076410359190042,0.03481227782643245,0.02554370896079417],"mean_pred":"0.00021337769","mean_actual":"0.00013489815","n":14826},{"period":"202508","mean_x_std":[0.23954158527549507,0.3516587683024889,-0.023623232537646924,-0.04393852898876381,0.09350079435327698,1.0224598850279536,-0.03436306225358998,-0.08038303766323841,0.03516003232141654,0.026997449695782955],"mean_pred":"0.00021309733","mean_actual":"0.00013471642","n":14846},{"period":"202509","mean_x_std":[0.24473317276432144,0.3627408600724042,-0.013931077777543271,-0.04243099827903719,0.09822919146471659,0.9257991439232499,-0.03108125514204498,-0.08350187814094066,0.03428987768946322,0.028530568146483196],"mean_pred":"0.00021482521","mean_actual":"0.0","n":14899},{"period":"202510","mean_x_std":[0.25213486343142005,0.3716148401459183,-0.00393599428387419,-0.042611443168332555,0.10051480259034232,0.876206387999766,-0.029677184785186283,-0.08644205511528882,0.033832835443375175,0.028320341064959134],"mean_pred":"0.00021682712","mean_actual":"6.685833e-05","n":14957},{"period":"202511","mean_x_std":[0.256848323746924,0.38293557636412456,0.007361019059424007,-0.04372854204149217,0.10460942713546881,0.8053207687668137,-0.02939081252476435,-0.08810713789961837,0.03324320515991252,0.029337611944626918],"mean_pred":"0.00021732389","mean_actual":"0.0","n":14985},{"period":"202512","mean_x_std":[0.2621284566965175,0.3936146603996446,0.01785007890863724,-0.04525438969838789,0.10843769234142504,0.8293419081930051,-0.026921204999891018,-0.09073040180350737,0.03205396607369719,0.028623793535978808],"mean_pred":"0.00021991505","mean_actual":"0.00013285506","n":15054},{"period":"202601","mean_x_std":[0.27199568195044893,0.40014494175049886,0.023924338084183778,-0.04461158826020535,0.10857557950719156,0.7190289065098104,-0.02724367832479423,-0.09170298600141337,0.03423423957380695,0.028353767153984452],"mean_pred":"0.0002209487","mean_actual":"0.0005986033","n":15035},{"period":"202602","mean_x_std":[0.2831885058008982,0.405689467419328,0.02841664083941492,-0.044405378695733536,0.10990852767122006,0.5948173314828676,-0.028554877549588322,-0.09326772886518629,0.034849165601089485,0.029284383706545243],"mean_pred":"0.00022074889","mean_actual":"0.0002661344","n":15030}],"archetype_anchors":{"NC_221d4":{"id":"NC_221d4","name":"221(d)(4) New Construction","typical":{"mean_loan_rate":3.619999885559082,"mean_log_upb":16.07274055480957,"mean_upb":9556581.0,"mean_sato_bps":11.0,"is_hc_232":0,"is_223a7":0,"is_538":0,"lp_NC":1,"lp_RP":0,"overall_actual_cdr":0.08650622429057231,"overall_pred_cdr":0.14088749885559082,"n_total":124797,"events_total":9},"age_curve":[{"age_bucket":"0-12","n":1646,"actual_smm":0.0,"pred_smm":5.4687439842382446e-05,"events":0,"mean_age":6.4319562911987305,"actual_cdr":0.0,"pred_cdr":0.0656425952911377},{"age_bucket":"13-24","n":3098,"actual_smm":0.0,"pred_smm":5.617255010292865e-05,"events":0,"mean_age":19.87734031677246,"actual_cdr":0.0,"pred_cdr":0.06735920906066895},{"age_bucket":"25-36","n":10966,"actual_smm":9.119095385737735e-05,"pred_smm":4.9762405978981405e-05,"events":1,"mean_age":31.298376083374023,"actual_cdr":0.10937427709410974,"pred_cdr":0.05970597267150879},{"age_bucket":"37-48","n":16457,"actual_smm":0.0,"pred_smm":5.0731418014038354e-05,"events":0,"mean_age":42.603633880615234,"actual_cdr":0.0,"pred_cdr":0.06085038185119629},{"age_bucket":"49-60","n":16138,"actual_smm":0.00012393109431156277,"pred_smm":5.763755689258687e-05,"events":2,"mean_age":54.37266159057617,"actual_cdr":0.14861598619149152,"pred_cdr":0.06914138793945312},{"age_bucket":"61-72","n":13483,"actual_smm":7.416747014759327e-05,"pred_smm":6.65681654936634e-05,"events":1,"mean_age":66.32789611816406,"actual_cdr":0.08896466778119949,"pred_cdr":0.0798642635345459},{"age_bucket":"73-96","n":22373,"actual_smm":4.469673266884191e-05,"pred_smm":8.176451956387609e-05,"events":1,"mean_age":83.91999053955078,"actual_cdr":0.053622895700666806,"pred_cdr":0.09809136390686035},{"age_bucket":"97-120","n":15289,"actual_smm":0.0,"pred_smm":0.00011309259571135044,"events":0,"mean_age":107.53620147705078,"actual_cdr":0.0,"pred_cdr":0.13560056686401367},{"age_bucket":"120+","n":25347,"actual_smm":0.00015780960271432516,"pred_smm":0.00030091466032899916,"events":4,"mean_age":172.20346069335938,"actual_cdr":0.18920724414129841,"pred_cdr":0.3605365753173828}]},"RP_223f":{"id":"RP_223f","name":"223(f) Acquisition/Refi","typical":{"mean_loan_rate":3.390000104904175,"mean_log_upb":15.44357681274414,"mean_upb":5094014.5,"mean_sato_bps":-17.0,"is_hc_232":0,"is_223a7":0,"is_538":0,"lp_NC":0,"lp_RP":1,"overall_actual_cdr":0.03081426676351251,"overall_pred_cdr":0.03589987754821777,"n_total":467250,"events_total":12},"age_curve":[{"age_bucket":"0-12","n":41353,"actual_smm":4.8364084830604794e-05,"pred_smm":1.0552076673775446e-05,"events":2,"mean_age":6.450051784515381,"actual_cdr":0.058021466326174664,"pred_cdr":0.012660026550292969},{"age_bucket":"13-24","n":44655,"actual_smm":0.0,"pred_smm":1.2209192391310353e-05,"events":0,"mean_age":18.59988784790039,"actual_cdr":0.0,"pred_cdr":0.014662742614746094},{"age_bucket":"25-36","n":47544,"actual_smm":0.0,"pred_smm":1.4108226423559245e-05,"events":0,"mean_age":30.517120361328125,"actual_cdr":0.0,"pred_cdr":0.016951560974121094},{"age_bucket":"37-48","n":46896,"actual_smm":0.0,"pred_smm":1.6220190445892513e-05,"events":0,"mean_age":42.412784576416016,"actual_cdr":0.0,"pred_cdr":0.0194549560546875},{"age_bucket":"49-60","n":41934,"actual_smm":0.0,"pred_smm":1.879711817309726e-05,"events":0,"mean_age":54.34992980957031,"actual_cdr":0.0,"pred_cdr":0.022530555725097656},{"age_bucket":"61-72","n":36161,"actual_smm":5.530820497220763e-05,"pred_smm":2.1790652681374922e-05,"events":2,"mean_age":66.40972137451172,"actual_cdr":0.06634966030460987,"pred_cdr":0.026178359985351562},{"age_bucket":"73-96","n":65520,"actual_smm":1.5262515262515263e-05,"pred_smm":2.671222682693042e-05,"events":1,"mean_age":84.18597412109375,"actual_cdr":0.018313480960374662,"pred_cdr":0.03203749656677246},{"age_bucket":"97-120","n":48720,"actual_smm":6.157635467980295e-05,"pred_smm":3.6525474570225924e-05,"events":3,"mean_age":107.63733673095703,"actual_cdr":0.0738666058783699,"pred_cdr":0.043839216232299805},{"age_bucket":"120+","n":94467,"actual_smm":4.234282871267215e-05,"pred_smm":6.840678543085232e-05,"events":4,"mean_age":163.0745086669922,"actual_cdr":0.05079956288522869,"pred_cdr":0.08208155632019043}]},"RP_223a7":{"id":"RP_223a7","name":"223(a)(7) Streamlined Refi","typical":{"mean_loan_rate":3.5999999046325684,"mean_log_upb":14.874658584594727,"mean_upb":2883913.0,"mean_sato_bps":5.0,"is_hc_232":0,"is_223a7":1,"is_538":0,"lp_NC":0,"lp_RP":1,"overall_actual_cdr":0.13997941780593548,"overall_pred_cdr":0.1855909824371338,"n_total":137075,"events_total":16},"age_curve":[{"age_bucket":"0-12","n":5844,"actual_smm":0.0,"pred_smm":1.7094260329031385e-05,"events":0,"mean_age":6.450718879699707,"actual_cdr":0.0,"pred_cdr":0.02052783966064453},{"age_bucket":"13-24","n":6154,"actual_smm":0.0,"pred_smm":2.0558145479299128e-05,"events":0,"mean_age":18.6285343170166,"actual_cdr":0.0,"pred_cdr":0.02467632293701172},{"age_bucket":"25-36","n":7155,"actual_smm":0.0,"pred_smm":2.409623994026333e-05,"events":0,"mean_age":30.597763061523438,"actual_cdr":0.0,"pred_cdr":0.028890371322631836},{"age_bucket":"37-48","n":7799,"actual_smm":0.0,"pred_smm":2.7986139684799127e-05,"events":0,"mean_age":42.587127685546875,"actual_cdr":0.0,"pred_cdr":0.03361105918884277},{"age_bucket":"49-60","n":7283,"actual_smm":0.0001373060551970342,"pred_smm":3.1766296160640195e-05,"events":1,"mean_age":54.216392517089844,"actual_cdr":0.16464289368013363,"pred_cdr":0.038117170333862305},{"age_bucket":"61-72","n":5578,"actual_smm":0.0,"pred_smm":3.7161393265705556e-05,"events":0,"mean_age":66.79239654541016,"actual_cdr":0.0,"pred_cdr":0.04455447196960449},{"age_bucket":"73-96","n":18250,"actual_smm":0.00010958904109589041,"pred_smm":4.323594112065621e-05,"events":2,"mean_age":85.03211212158203,"actual_cdr":0.13142761386067958,"pred_cdr":0.051844120025634766},{"age_bucket":"97-120","n":17126,"actual_smm":0.00023356300362022657,"pred_smm":5.989468263578601e-05,"events":4,"mean_age":107.80229187011719,"actual_cdr":0.2799158434386162,"pred_cdr":0.07185935974121094},{"age_bucket":"120+","n":61886,"actual_smm":0.0001454286914649517,"pred_smm":0.0002964775776490569,"events":9,"mean_age":189.21119689941406,"actual_cdr":0.1743749106737913,"pred_cdr":0.3551900386810303}]},"NC_232":{"id":"NC_232","name":"232 Healthcare New Construction","typical":{"mean_loan_rate":3.8499999046325684,"mean_log_upb":15.942809104919434,"mean_upb":8392164.0,"mean_sato_bps":8.0,"is_hc_232":1,"is_223a7":0,"is_538":0,"lp_NC":1,"lp_RP":0,"overall_actual_cdr":1.7216216784121663,"overall_pred_cdr":2.1573245525360107,"n_total":15213,"events_total":22},"age_curve":[{"age_bucket":"0-12","n":566,"actual_smm":0.0,"pred_smm":0.001635476015508175,"events":0,"mean_age":6.298586368560791,"actual_cdr":0.0,"pred_cdr":1.945030689239502},{"age_bucket":"13-24","n":595,"actual_smm":0.0,"pred_smm":0.0018419490661472082,"events":0,"mean_age":18.695798873901367,"actual_cdr":0.0,"pred_cdr":2.188098430633545},{"age_bucket":"25-36","n":919,"actual_smm":0.0,"pred_smm":0.001578112947754562,"events":0,"mean_age":30.951034545898438,"actual_cdr":0.0,"pred_cdr":1.877361536026001},{"age_bucket":"37-48","n":1239,"actual_smm":0.0,"pred_smm":0.001511577982455492,"events":0,"mean_age":42.75867462158203,"actual_cdr":0.0,"pred_cdr":1.7988860607147217},{"age_bucket":"49-60","n":1180,"actual_smm":0.001694915254237288,"pred_smm":0.0009163919021375477,"events":2,"mean_age":54.56525421142578,"actual_cdr":2.0150449477734367,"pred_cdr":1.0941803455352783},{"age_bucket":"61-72","n":1189,"actual_smm":0.0008410428931875525,"pred_smm":0.0010485188104212284,"events":1,"mean_age":66.4886474609375,"actual_cdr":1.0045960044285374,"pred_cdr":1.250976324081421},{"age_bucket":"73-96","n":2168,"actual_smm":0.0009225092250922509,"pred_smm":0.0012291489401832223,"events":2,"mean_age":84.4045181274414,"actual_cdr":1.1014115524191848,"pred_cdr":1.4650702476501465},{"age_bucket":"97-120","n":1972,"actual_smm":0.0010141987829614604,"pred_smm":0.0014527468010783195,"events":2,"mean_age":108.16429901123047,"actual_cdr":1.2102726832245003,"pred_cdr":1.729428768157959},{"age_bucket":"120+","n":5385,"actual_smm":0.002785515320334262,"pred_smm":0.0026780127082020044,"events":15,"mean_age":196.88449096679688,"actual_cdr":3.291880874357078,"pred_cdr":3.166729211807251}]},"RP_232":{"id":"RP_232","name":"232/223(f) Healthcare Refi","typical":{"mean_loan_rate":3.380000114440918,"mean_log_upb":15.729039192199707,"mean_upb":6776960.0,"mean_sato_bps":-9.0,"is_hc_232":1,"is_223a7":0,"is_538":0,"lp_NC":0,"lp_RP":1,"overall_actual_cdr":0.4513194498850015,"overall_pred_cdr":0.4346489906311035,"n_total":297177,"events_total":112},"age_curve":[{"age_bucket":"0-12","n":25611,"actual_smm":7.809144508219124e-05,"pred_smm":0.0001573049376020208,"events":2,"mean_age":6.385966777801514,"actual_cdr":0.09366949596665286,"pred_cdr":0.18859505653381348},{"age_bucket":"13-24","n":24611,"actual_smm":4.063223761732559e-05,"pred_smm":0.00018080293375533074,"events":1,"mean_age":18.49059295654297,"actual_cdr":0.04874779015681119,"pred_cdr":0.2167224884033203},{"age_bucket":"25-36","n":25260,"actual_smm":0.0001979414093428345,"pred_smm":0.0002062631247099489,"events":5,"mean_age":30.526762008666992,"actual_cdr":0.23727126846636581,"pred_cdr":0.247269868850708},{"age_bucket":"37-48","n":25496,"actual_smm":7.844367743959836e-05,"pred_smm":0.00023175250680651516,"events":2,"mean_age":42.511844635009766,"actual_cdr":0.09409181103544606,"pred_cdr":0.2777397632598877},{"age_bucket":"49-60","n":25297,"actual_smm":0.0005534253073486975,"pred_smm":0.0002491016057319939,"events":14,"mean_age":54.47827911376953,"actual_cdr":0.6620926480747635,"pred_cdr":0.2984941005706787},{"age_bucket":"61-72","n":24964,"actual_smm":0.0002804037814452812,"pred_smm":0.00026630269712768495,"events":7,"mean_age":66.55880737304688,"actual_cdr":0.3359660890124516,"pred_cdr":0.31911134719848633},{"age_bucket":"73-96","n":52118,"actual_smm":0.0003261828926666411,"pred_smm":0.0003338610113132745,"events":17,"mean_age":84.47331237792969,"actual_cdr":0.3907180252904374,"pred_cdr":0.39988160133361816},{"age_bucket":"97-120","n":42972,"actual_smm":0.0005119612771106768,"pred_smm":0.0004531384038273245,"events":22,"mean_age":107.81422424316406,"actual_cdr":0.6126265925500585,"pred_cdr":0.5423843860626221},{"age_bucket":"120+","n":50848,"actual_smm":0.0008259911894273128,"pred_smm":0.0007560263620689511,"events":42,"mean_age":146.16787719726562,"actual_cdr":0.9866988766875195,"pred_cdr":0.9034693241119385}]},"538":{"id":"538","name":"538 USDA Rural","typical":{"mean_loan_rate":4.5,"mean_log_upb":13.888448715209961,"mean_upb":1075664.0,"mean_sato_bps":88.0,"is_hc_232":0,"is_223a7":0,"is_538":1,"lp_NC":0,"lp_RP":0,"overall_actual_cdr":0.040426499023604734,"overall_pred_cdr":0.03439784049987793,"n_total":89034,"events_total":3},"age_curve":[{"age_bucket":"0-12","n":3824,"actual_smm":0.0,"pred_smm":1.1626422747212928e-05,"events":0,"mean_age":6.465742588043213,"actual_cdr":0.0,"pred_cdr":0.013947486877441406},{"age_bucket":"13-24","n":5225,"actual_smm":0.0,"pred_smm":1.3372860848903656e-05,"events":0,"mean_age":19.035024642944336,"actual_cdr":0.0,"pred_cdr":0.016021728515625},{"age_bucket":"25-36","n":8235,"actual_smm":0.0,"pred_smm":1.5556952348561026e-05,"events":0,"mean_age":30.713054656982422,"actual_cdr":0.0,"pred_cdr":0.018668174743652344},{"age_bucket":"37-48","n":9089,"actual_smm":0.0,"pred_smm":1.8036054825643077e-05,"events":0,"mean_age":42.52470016479492,"actual_cdr":0.0,"pred_cdr":0.02167224884033203},{"age_bucket":"49-60","n":8798,"actual_smm":0.0,"pred_smm":2.0423844034667127e-05,"events":0,"mean_age":54.379859924316406,"actual_cdr":0.0,"pred_cdr":0.02453327178955078},{"age_bucket":"61-72","n":7342,"actual_smm":0.00013620266957232362,"pred_smm":2.1729212676291354e-05,"events":1,"mean_age":66.30781555175781,"actual_cdr":0.16332082135410708,"pred_cdr":0.026106834411621094},{"age_bucket":"73-96","n":12763,"actual_smm":7.835148476063621e-05,"pred_smm":2.5322338842670433e-05,"events":1,"mean_age":84.05821228027344,"actual_cdr":0.0939812751887481,"pred_cdr":0.03039240837097168},{"age_bucket":"97-120","n":9155,"actual_smm":0.0,"pred_smm":3.0763636459596455e-05,"events":0,"mean_age":107.78219604492188,"actual_cdr":0.0,"pred_cdr":0.036901235580444336},{"age_bucket":"120+","n":24603,"actual_smm":4.0645449741901396e-05,"pred_smm":4.888799958280288e-05,"events":1,"mean_age":167.557373046875,"actual_cdr":0.04876363762037483,"pred_cdr":0.05863308906555176}]}}};

// Bloomberg-inspired theme
const T = {
  bg: '#000000', bgAccent: '#1a0f00', panel: '#0a0a0a', border: '#1a1a1a', borderAccent: '#2a2a2a',
  text: '#d4d4d4', textDim: '#888', textBright: '#fff',
  accent: '#ff8c00', accentDim: '#cc6f00',
  green: '#00d96b', red: '#ff4d6d', blue: '#4d9fff', purple: '#b366ff',
  grid: '#1a1a1a',
};
const FONT_MONO = '"IBM Plex Mono", "JetBrains Mono", "Roboto Mono", "Menlo", monospace';
const FONT_SANS = '"IBM Plex Sans", "Inter", system-ui, sans-serif';

const pct = (v, d = 2) => v == null || isNaN(v) ? '—' : v.toFixed(d) + '%';
const num = (v, d = 0) => v == null || isNaN(v) ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const logit = (p) => {
  const eps = 1e-12;
  const q = Math.max(eps, Math.min(1 - eps, p));
  return Math.log(q / (1 - q));
};
const smm2cpr = (smm) => (1 - Math.pow(1 - smm, 12)) * 100;

const FEATURE_LABEL = MODEL_DATA.metadata.feature_labels || {};
const FEATURE_GROUPS_DEF = MODEL_DATA.metadata.feature_groups || {};
const GROUP_ORDER = ['Rate & Restrictions', 'Loan Structure & Seasoning', 'Burnout', 'FHA Program & Purpose', 'Issuer (Servicer)'];

export default function App() {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'scurve', label: 'S-curve' },
    { id: 'servicer_scurves', label: 'Servicer S-curves' },
    { id: 'timeseries', label: 'Time series' },
    { id: 'calibration', label: 'Calibration' },
    { id: 'cohorts', label: 'Cohorts' },
    { id: 'whatif', label: 'What-if' },
    { id: 'calibrate', label: 'Calibrate' },
    { id: 'attribution', label: 'Attribution' },
    { id: 'projector', label: 'Loan Projector' },
    { id: 'coeffs', label: 'Coefficients' },
    { id: 'involuntary', label: 'Involuntary' },
  ];
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: FONT_SANS }}>
      <div style={{ background: T.panel, borderBottom: `1px solid ${T.borderAccent}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.accent, letterSpacing: '0.15em', fontWeight: 600 }}>
          GNPL · VOLUNTARY PREPAY · LOGISTIC V4
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim }}>
          n={MODEL_DATA.metadata.training_pop_n.toLocaleString()} · {MODEL_DATA.metadata.training_events.toLocaleString()} events · AUC {MODEL_DATA.metadata.test_auc.toFixed(4)}
        </div>
      </div>
      <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}`, padding: '0 24px', display: 'flex' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'transparent', border: 'none',
            borderBottom: tab === t.id ? `2px solid ${T.accent}` : '2px solid transparent',
            color: tab === t.id ? T.accent : T.textDim,
            padding: '14px 18px', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding: '24px' }}>
        {tab === 'overview' && <Overview />}
        {tab === 'scurve' && <SCurve />}
        {tab === 'servicer_scurves' && <ServicerSCurves />}
        {tab === 'timeseries' && <TimeSeries />}
        {tab === 'calibration' && <Calibration />}
        {tab === 'cohorts' && <Cohorts />}
        {tab === 'whatif' && <WhatIf />}
        {tab === 'calibrate' && <Calibrate />}
      {tab === 'attribution' && <Attribution />}
        {tab === 'projector' && <LoanProjector />}
        {tab === 'coeffs' && <Coefficients />}
        {tab === 'involuntary' && <Involuntary />}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, style = {} }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, ...style }}>
      {(title || subtitle) && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          {title && <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 11, color: T.textDim }}>{subtitle}</div>}
        </div>
      )}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: T.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: T.textBright, fontWeight: 500, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: { background: T.bg, border: `1px solid ${T.borderAccent}`, fontFamily: FONT_MONO, fontSize: 11 },
  labelStyle: { color: T.accent, fontWeight: 500 },
  itemStyle: { color: T.text },
};

function Overview() {
  const m = MODEL_DATA.metadata;
  const topFeatures = MODEL_DATA.coefficients.slice(0, 8);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      <Panel title="Training pop"><Stat label="Observations" value={m.training_pop_n.toLocaleString()} sub={`${m.period_range[0]} → ${m.period_range[1]}`} /></Panel>
      <Panel title="Events"><Stat label="Voluntary prepays" value={m.training_events.toLocaleString()} sub={`${(m.base_smm * 100).toFixed(3)}% per month`} /></Panel>
      <Panel title="Base CPR"><Stat label="Annualized" value={pct(m.base_cpr, 2)} sub="Sample mean" /></Panel>
      <Panel title="Model fit"><Stat label="Test AUC" value={m.test_auc.toFixed(4)} sub={`logloss ${m.test_log_loss.toFixed(4)}`} /></Panel>
      <Panel title="Top features by |β-scaled|" style={{ gridColumn: 'span 2' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11 }}>
          {topFeatures.map((f, i) => {
            const w = (Math.abs(f.beta_scaled) / Math.abs(topFeatures[0].beta_scaled)) * 100;
            const positive = f.beta_scaled > 0;
            return (
              <div key={f.feature} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 80px', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: i < topFeatures.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ color: T.textDim }}>{i + 1}</div>
                <div>
                  <div style={{ color: T.text, fontSize: 12 }}>{FEATURE_LABEL[f.feature] || f.feature}</div>
                  <div style={{ background: T.border, height: 3, marginTop: 4, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: 3, width: w + '%', background: positive ? T.green : T.red }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"' }}>{positive ? '+' : ''}{f.beta_scaled.toFixed(3)}</div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Yearly fit" subtitle="actual vs predicted CPR" style={{ gridColumn: 'span 2' }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={MODEL_DATA.yearly} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis dataKey="year" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(2) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Bar dataKey="actual_cpr" fill={T.accent} name="Actual" />
            <Bar dataKey="pred_cpr" fill={T.blue} name="Predicted" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Methodology" subtitle="how the model was fit" style={{ gridColumn: 'span 4' }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text, lineHeight: 1.6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ color: T.accent, marginBottom: 8 }}>POPULATION</div>
            Filtered to <span style={{ color: T.textBright }}>prepay_eligible == 1</span> (voluntary-eligible: not in lockout, not construction, valid data) and excluded <span style={{ color: T.textBright }}>period 202603</span> (no future to validate disappearance). Training pop: <span style={{ color: T.textBright }}>{m.training_pop_n.toLocaleString()}</span> observations across <span style={{ color: T.textBright }}>{m.period_range[0]}–{m.period_range[1]}</span>.
          </div>
          <div>
            <div style={{ color: T.accent, marginBottom: 8 }}>FIT</div>
            Logistic regression with L2 (C=1.0). Train/test 80/20 by <span style={{ color: T.textBright }}>loan_id</span>. Train negatives downsampled 5:1; intercept prior-corrected by <span style={{ color: T.textBright }}>{m.prior_correction.toFixed(4)}</span> to recover the true base rate. 18 features.
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SCurve() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Panel title="S-curve" subtitle="actual & predicted CPR by net refi incentive" style={{ gridColumn: 'span 2' }}>
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={MODEL_DATA.scurve} margin={{ top: 16, right: 32, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} />
            <XAxis type="number" dataKey="ri_mid" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} label={{ value: 'Net refi incentive (bp)', position: 'insideBottom', offset: -4, style: { fill: T.textDim, fontSize: 10, fontFamily: FONT_MONO } }} domain={['dataMin - 20', 'dataMax + 20']} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" label={{ value: 'CPR (%)', angle: -90, position: 'insideLeft', style: { fill: T.textDim, fontSize: 10, fontFamily: FONT_MONO } }} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v, name) => [v.toFixed(2) + '%', name]} labelFormatter={(label) => `RI ≈ ${Math.round(label)} bp`} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <ReferenceLine x={0} stroke={T.textDim} strokeDasharray="2 4" />
            <Line type="monotone" dataKey="actual_cpr" stroke={T.accent} strokeWidth={2} dot={{ fill: T.accent, r: 4 }} name="Actual" />
            <Line type="monotone" dataKey="pred_cpr" stroke={T.blue} strokeWidth={2} dot={{ fill: T.blue, r: 4 }} name="Predicted" />
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Bucket detail" style={{ gridColumn: 'span 2' }}>
        <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>RI bucket</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>n</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Mean RI</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Actual CPR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Pred CPR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Δ (bp CPR)</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_DATA.scurve.map((s, i) => {
              const delta = (s.actual_cpr - s.pred_cpr) * 100;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px' }}>{s.ri_mid > 0 ? '+' : ''}{Math.round(s.ri_mid)} bp</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{s.n.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Math.round(s.ri_mid)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent }}>{pct(s.actual_cpr)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{pct(s.pred_cpr)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(delta) < 100 ? T.text : delta > 0 ? T.green : T.red }}>{delta > 0 ? '+' : ''}{Math.round(delta)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function TimeSeries() {
  const monthly = MODEL_DATA.monthly.map(m => ({ ...m, period_label: m.period.slice(0, 4) + '-' + m.period.slice(4) }));
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Panel title="Monthly CPR" subtitle="actual & predicted, voluntary prepays only">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthly} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis dataKey="period_label" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 9 }} interval={11} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(2) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <ReferenceArea x1="2020-03" x2="2021-12" fill={T.accent} fillOpacity={0.04} />
            <Line type="monotone" dataKey="actual_cpr" stroke={T.accent} strokeWidth={1.5} dot={false} name="Actual" />
            <Line type="monotone" dataKey="pred_cpr" stroke={T.blue} strokeWidth={1.5} dot={false} name="Predicted" />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Yearly summary">
        <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>Year</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>n</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Actual CPR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Pred CPR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_DATA.yearly.map((y, i) => {
              const delta = y.actual_cpr - y.pred_cpr;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px', color: T.textBright }}>{y.year}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{y.n.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent }}>{pct(y.actual_cpr)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{pct(y.pred_cpr)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(delta) < 1 ? T.text : delta > 0 ? T.green : T.red }}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function Calibration() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Panel title="Calibration" subtitle="predicted vs actual by decile of predicted CPR" style={{ gridColumn: 'span 2' }}>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 16, right: 32, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} />
            <XAxis type="number" dataKey="pred_cpr" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} label={{ value: 'Predicted CPR (%)', position: 'insideBottom', offset: -4, style: { fill: T.textDim, fontSize: 10, fontFamily: FONT_MONO } }} domain={[0, 35]} />
            <YAxis type="number" dataKey="actual_cpr" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} label={{ value: 'Actual CPR (%)', angle: -90, position: 'insideLeft', style: { fill: T.textDim, fontSize: 10, fontFamily: FONT_MONO } }} domain={[0, 35]} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(2) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 35, y: 35 }]} stroke={T.textDim} strokeDasharray="3 3" />
            <Scatter name="Decile" data={MODEL_DATA.calibration} fill={T.accent} />
          </ScatterChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Decile detail" style={{ gridColumn: 'span 2' }}>
        <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>Decile</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>n</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Mean predicted CPR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Mean actual CPR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Δ</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Ratio</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_DATA.calibration.map((c, i) => {
              const delta = c.actual_cpr - c.pred_cpr;
              const ratio = c.actual_cpr / Math.max(c.pred_cpr, 0.001);
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px', color: T.textBright }}>{c.decile + 1}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{c.n.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{pct(c.pred_cpr)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent }}>{pct(c.actual_cpr)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(delta) < 1 ? T.text : delta > 0 ? T.green : T.red }}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{ratio.toFixed(2)}×</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function CohortBars({ data, dataKey, title }) {
  const sorted = [...data].sort((a, b) => b.actual_cpr - a.actual_cpr);
  const max = Math.max(...sorted.flatMap(d => [d.actual_cpr, d.pred_cpr]));
  return (
    <Panel title={title}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11 }}>
        {sorted.map((d, i) => {
          const aw = (d.actual_cpr / max) * 100;
          const pw = (d.pred_cpr / max) * 100;
          return (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ color: T.text, fontSize: 12 }}>{d[dataKey]}</div>
                <div style={{ color: T.textDim, fontSize: 10 }}>n={d.n.toLocaleString()}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 50px', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                <div style={{ color: T.textDim, fontSize: 9 }}>actual</div>
                <div style={{ background: T.border, height: 8, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: 8, width: aw + '%', background: T.accent }} />
                </div>
                <div style={{ textAlign: 'right', color: T.accent }}>{pct(d.actual_cpr)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 50px', gap: 8, alignItems: 'center' }}>
                <div style={{ color: T.textDim, fontSize: 9 }}>predicted</div>
                <div style={{ background: T.border, height: 8, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: 8, width: pw + '%', background: T.blue }} />
                </div>
                <div style={{ textAlign: 'right', color: T.blue }}>{pct(d.pred_cpr)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Cohorts() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <CohortBars data={MODEL_DATA.fha_cuts} dataKey="fha_category" title="By FHA category" />
      <CohortBars data={MODEL_DATA.lp_cuts} dataKey="loan_purpose" title="By loan purpose" />
      <CohortBars data={MODEL_DATA.age_cuts} dataKey="age_bucket" title="By loan age" />
      <CohortBars data={MODEL_DATA.penalty_cuts} dataKey="pen_bucket" title="By penalty points" />
      <CohortBars data={MODEL_DATA.issuer_cuts || []} dataKey="issuer_label" title="By issuer (top 10 + other)" />
      <Panel title="Vintage year fit" style={{ gridColumn: 'span 1' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={MODEL_DATA.vintage_cuts} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis dataKey="vintage_year" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(2) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Bar dataKey="actual_cpr" fill={T.accent} name="Actual" />
            <Bar dataKey="pred_cpr" fill={T.blue} name="Predicted" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

const PRESETS = {
  '2020 NC peak': { refi_incentive_bps: 150, in_prepay_penalty: 1, loan_age_months: 24, log_upb: 16.0, is_post_covid: 0, cum_itm: 12, burn_ratio: 0.5, is_hc_232: 0, is_223a7: 0, is_538: 0, lp_NC: 1 },
  '2024 RP, deep OTM': { refi_incentive_bps: -200, in_prepay_penalty: 1, loan_age_months: 36, log_upb: 16.5, is_post_covid: 1, cum_itm: 0, burn_ratio: 0, is_hc_232: 0, is_223a7: 0, is_538: 0, lp_NC: 0 },
  'HC 232 mid-life': { refi_incentive_bps: 50, in_prepay_penalty: 1, loan_age_months: 60, log_upb: 16.0, is_post_covid: 0, cum_itm: 6, burn_ratio: 0.1, is_hc_232: 1, is_223a7: 0, is_538: 0, lp_NC: 0 },
  'Sample mean': null,
};

function WhatIf() {
  const D = MODEL_DATA;
  const features = D.metadata.feature_list;
  const stats = D.feature_stats;
  const initial = useMemo(() => {
    const init = {};
    D.coefficients.forEach(c => { init[c.feature] = c.mean; });
    return init;
  }, []);
  const [vals, setVals] = useState(initial);
  const coefByFeature = useMemo(() => {
    const m = {};
    D.coefficients.forEach(c => { m[c.feature] = c; });
    return m;
  }, []);
  const intercept = D.metadata.intercept_scaled;

  const predicted = useMemo(() => {
    let z = intercept;
    features.forEach(f => {
      const c = coefByFeature[f];
      if (!c) return;
      const xs = (vals[f] - c.mean) / c.std;
      z += c.beta_scaled * xs;
    });
    const smm = sigmoid(z);
    const cpr = smm2cpr(smm);
    return { z, smm, cpr };
  }, [vals, features, coefByFeature, intercept]);

  const contributions = useMemo(() => {
    const items = features.map(f => {
      const c = coefByFeature[f];
      if (!c) return null;
      const xs = (vals[f] - c.mean) / c.std;
      return { feature: f, label: FEATURE_LABEL[f] || f, group: c.group,
               contribution: c.beta_scaled * xs, xs, beta: c.beta_scaled };
    }).filter(x => x);
    items.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    return items;
  }, [vals, features, coefByFeature]);

  const presets = [
    { name: 'Reset (means)', apply: () => setVals(initial) },
    { name: 'Deep ITM, past pen.', apply: () => setVals({ ...initial,
        refi_incentive_bps: 200, in_prepay_penalty: 0, loan_age_months: 96,
        cum_itm: 24, burn_ratio: 0.25, is_post_covid: 0 }) },
    { name: 'Locked-in post-COVID', apply: () => setVals({ ...initial,
        refi_incentive_bps: -200, in_prepay_penalty: 0, loan_age_months: 36,
        cum_itm: 0, burn_ratio: 0, is_post_covid: 1 }) },
    { name: '232 NC, in penalty', apply: () => setVals({ ...initial,
        refi_incentive_bps: 50, in_prepay_penalty: 1, is_hc_232: 1, lp_NC: 1,
        loan_age_months: 36 }) },
    { name: '538 USDA Rural', apply: () => setVals({ ...initial,
        is_538: 1, refi_incentive_bps: 0 }) },
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Panel title="Presets">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {presets.map((p, i) => (
            <button key={i} onClick={p.apply} style={{
              background: T.bg, border: `1px solid ${T.borderAccent}`, color: T.text,
              fontFamily: FONT_MONO, fontSize: 10, padding: '6px 12px', cursor: 'pointer',
            }}>{p.name}</button>
          ))}
        </div>
      </Panel>

      {GROUP_ORDER.map(grp => {
        const groupFeats = (FEATURE_GROUPS_DEF[grp] || []).filter(f => features.includes(f));
        if (groupFeats.length === 0) return null;
        return (
          <Panel key={grp} title={grp}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {groupFeats.map(f => {
                const fs = stats[f];
                const isBinary = ['in_prepay_penalty','is_hc_232','is_223a7','is_538','lp_NC','is_post_covid'].includes(f) || f.startsWith('iss_');
                const min = isBinary ? 0 : fs.p5;
                const max = isBinary ? 1 : fs.p95;
                const step = isBinary ? 1 : (max - min) / 100;
                const v = vals[f] !== undefined ? vals[f] : fs.mean;
                return (
                  <div key={f}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                                  fontFamily: FONT_MONO, fontSize: 10, marginBottom: 4 }}>
                      <span style={{ color: T.text }}>{FEATURE_LABEL[f] || f}</span>
                      <span style={{ color: T.accent, fontFeatureSettings: '"tnum"' }}>
                        {isBinary ? (v >= 0.5 ? '1' : '0') : (typeof v === 'number' ? v.toFixed(1) : '—')}
                      </span>
                    </div>
                    <input type="range" min={min} max={max} step={step}
                           value={v} onChange={(e) => setVals({ ...vals, [f]: parseFloat(e.target.value) })}
                           style={{ width: '100%', accentColor: T.accent }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  fontFamily: FONT_MONO, fontSize: 8, color: T.textDim }}>
                      <span>{isBinary ? 0 : fs.p5.toFixed(0)}</span>
                      <span>μ={fs.mean.toFixed(1)}</span>
                      <span>{isBinary ? 1 : fs.p95.toFixed(0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        );
      })}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Panel title="Prediction">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Stat label="logit z" value={predicted.z.toFixed(3)} sub="standardized scale" />
            <Stat label="SMM" value={(predicted.smm * 100).toFixed(4) + '%'} sub="monthly" />
            <Stat label="CPR" value={pct(predicted.cpr, 2)} sub="annualized" />
          </div>
        </Panel>
        <Panel title="Logit attribution (sorted by |β·xs|)">
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, maxHeight: 280, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px',
                          color: T.textDim, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
              <span>Feature</span><span style={{ textAlign: 'right' }}>x (std)</span><span style={{ textAlign: 'right' }}>β·xs</span>
            </div>
            {contributions.map(c => {
              const positive = c.contribution > 0;
              const w = (Math.abs(c.contribution) / Math.max(...contributions.map(c => Math.abs(c.contribution)))) * 100;
              return (
                <div key={c.feature} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px',
                                                padding: '4px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
                  <div>
                    <div style={{ color: T.text, fontSize: 10 }}>{c.label}</div>
                    <div style={{ background: T.border, height: 2, marginTop: 2, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: 2,
                                    width: w + '%', background: positive ? T.green : T.red }} />
                    </div>
                  </div>
                  <span style={{ textAlign: 'right', color: T.textDim }}>{c.xs.toFixed(2)}</span>
                  <span style={{ textAlign: 'right', color: positive ? T.green : T.red, fontWeight: 500 }}>
                    {positive ? '+' : ''}{c.contribution.toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Coefficients() {
  const [sortBy, setSortBy] = useState('importance');
  const sorted = useMemo(() => {
    const sorted = [...MODEL_DATA.coefficients];
    if (sortBy === 'importance') sorted.sort((a, b) => b.importance - a.importance);
    else if (sortBy === 'beta') sorted.sort((a, b) => b.beta_scaled - a.beta_scaled);
    else if (sortBy === 'feature') sorted.sort((a, b) => a.feature.localeCompare(b.feature));
    return sorted;
  }, [sortBy]);
  const sortHeaders = [{ id: 'importance', label: '|β-scaled|' }, { id: 'beta', label: 'β-scaled (signed)' }, { id: 'feature', label: 'Name' }];
  return (
    <Panel title="Logistic coefficients" subtitle="L2-regularized, prior-corrected">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, alignSelf: 'center', marginRight: 8 }}>SORT BY:</div>
        {sortHeaders.map(h => (
          <button key={h.id} onClick={() => setSortBy(h.id)} style={{ background: sortBy === h.id ? T.accent : T.bg, border: `1px solid ${sortBy === h.id ? T.accent : T.borderAccent}`, color: sortBy === h.id ? T.bg : T.text, fontFamily: FONT_MONO, fontSize: 10, padding: '4px 10px', cursor: 'pointer' }}>{h.label}</button>
        ))}
      </div>
      <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
            <th style={{ textAlign: 'left', padding: '8px', fontWeight: 400 }}>Feature</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>β-scaled</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>β-native</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>μ</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>σ</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>Importance</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const positive = c.beta_scaled > 0;
            return (
              <tr key={c.feature} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px' }}><div style={{ color: T.text }}>{c.feature}</div><div style={{ color: T.textDim, fontSize: 9 }}>{FEATURE_LABEL[c.feature] || ''}</div></td>
                <td style={{ padding: '8px', textAlign: 'right', color: positive ? T.green : T.red, fontWeight: 500 }}>{positive ? '+' : ''}{c.beta_scaled.toFixed(4)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: T.textDim, fontSize: 10 }}>{c.beta_native.toExponential(2)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: T.textDim }}>{c.mean.toFixed(2)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: T.textDim }}>{c.std.toFixed(2)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: T.text }}>{c.importance.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginTop: 16, lineHeight: 1.6 }}>
        <div style={{ color: T.accent, marginBottom: 6 }}>READING THE COEFFICIENTS</div>
        β-scaled is on the standardized feature scale. β-native is on the raw feature scale. To predict SMM:<br /><br />
        <span style={{ color: T.text, background: T.border, padding: '4px 8px' }}>z = intercept_scaled + Σ β_scaled · (x - μ) / σ;  SMM = sigmoid(z);  CPR = 1 - (1 - SMM)^12</span><br /><br />
        intercept_scaled = {MODEL_DATA.metadata.intercept_scaled.toFixed(4)} · intercept_native = {MODEL_DATA.metadata.intercept_native.toFixed(4)}
      </div>
    </Panel>
  );
}

// ════════════════════════════════════════════════════════════════════
// 7. Calibrate tab — toggle coefficients, see live impact on S-curve and yearly fit
// ════════════════════════════════════════════════════════════════════
function Calibrate() {
  // ── State: current coefficient values (map feature → beta_scaled) ───
  // Key by feature name, including special key '_intercept' for the intercept.
  const baseCoefs = useMemo(() => {
    const m = { _intercept: MODEL_DATA.metadata.intercept_scaled };
    MODEL_DATA.coefficients.forEach(c => { m[c.feature] = c.beta_scaled; });
    return m;
  }, []);

  const [coefs, setCoefs] = useState(() => ({ ...baseCoefs }));

  function resetOne(key) { setCoefs(prev => ({ ...prev, [key]: baseCoefs[key] })); }
  function resetAll() { setCoefs({ ...baseCoefs }); }

  // ── Recompute predictions per bucket given current coefficients ────
  // Math: each bucket has stored (mean_x_std, mean_pred). 
  // Original z̄_b ≈ logit(mean_pred_b)  (exact when within-bucket variance is zero)
  // Δz̄_b = (β'_intercept - β_intercept) + Σ_j (β'_j - β_j) × x̄_b,j
  // new mean_pred_b ≈ sigmoid(logit(mean_pred_b) + Δz̄_b)
  // 
  // This is exact in the zero-variance limit and a good approximation
  // for modest coefficient changes. For extreme moves (~1+ unit), there
  // is some bias relative to a true row-by-row recomputation.
  const featureList = MODEL_DATA.metadata.feature_list;

  function recomputeBucket(bucket) {
    const baseLogit = logit(bucket.mean_pred);
    let dz = coefs._intercept - baseCoefs._intercept;
    for (let j = 0; j < featureList.length; j++) {
      const f = featureList[j];
      dz += (coefs[f] - baseCoefs[f]) * bucket.mean_x_std[j];
    }
    const newSmm = sigmoid(baseLogit + dz);
    return {
      ...bucket,
      orig_pred_smm: bucket.mean_pred,
      new_pred_smm: newSmm,
      orig_pred_cpr: smm2cpr(bucket.mean_pred),
      new_pred_cpr: smm2cpr(newSmm),
      actual_cpr: smm2cpr(bucket.mean_actual),
      delta_cpr: smm2cpr(newSmm) - smm2cpr(bucket.mean_pred),
    };
  }

  const scurveData = useMemo(() =>
    MODEL_DATA.scurve_calib.map(recomputeBucket),
    [coefs]);
  const yearlyData = useMemo(() =>
    MODEL_DATA.yearly_calib.map(recomputeBucket),
    [coefs]);
  const monthlyData = useMemo(() =>
    MODEL_DATA.monthly_calib.map(b => ({
      ...recomputeBucket(b),
      period_label: b.period.slice(0, 4) + '-' + b.period.slice(4),
    })),
    [coefs]);

  // ── Aggregate metrics ──────────────────────────────────────────────
  // Weighted mean across all buckets (weighted by n)
  const totalN = MODEL_DATA.scurve_calib.reduce((s, b) => s + b.n, 0);
  const aggMetrics = useMemo(() => {
    let origPredSum = 0, newPredSum = 0, actualSum = 0;
    for (const b of scurveData) {
      origPredSum += b.orig_pred_smm * b.n;
      newPredSum += b.new_pred_smm * b.n;
      actualSum += b.mean_actual * b.n;
    }
    const origPredCpr = smm2cpr(origPredSum / totalN);
    const newPredCpr = smm2cpr(newPredSum / totalN);
    const actualCpr = smm2cpr(actualSum / totalN);

    // Yearly RMSE (CPR scale)
    let origSqErr = 0, newSqErr = 0, weightSum = 0;
    for (const y of yearlyData) {
      const w = y.n;
      origSqErr += w * Math.pow(y.orig_pred_cpr - y.actual_cpr, 2);
      newSqErr += w * Math.pow(y.new_pred_cpr - y.actual_cpr, 2);
      weightSum += w;
    }
    const origYearlyRmse = Math.sqrt(origSqErr / weightSum);
    const newYearlyRmse = Math.sqrt(newSqErr / weightSum);

    // S-curve RMSE (CPR scale, equally weighted across buckets)
    let scOrigErr = 0, scNewErr = 0, scN = 0;
    for (const s of scurveData) {
      scOrigErr += Math.pow(s.orig_pred_cpr - s.actual_cpr, 2);
      scNewErr += Math.pow(s.new_pred_cpr - s.actual_cpr, 2);
      scN += 1;
    }
    return {
      origPredCpr, newPredCpr, actualCpr,
      origYearlyRmse, newYearlyRmse,
      origScurveRmse: Math.sqrt(scOrigErr / scN),
      newScurveRmse: Math.sqrt(scNewErr / scN),
    };
  }, [scurveData, yearlyData]);

  // Group features for organized display
  // Build groups from V6E metadata + intercept row
  const groups = [
    { name: 'Intercept', keys: ['_intercept'] },
    ...GROUP_ORDER.map(g => ({ name: g, keys: FEATURE_GROUPS_DEF[g] || [] })).filter(g => g.keys.length > 0),
  ];

  // Detect any drift from base
  const totalChanges = Object.keys(baseCoefs).filter(k => Math.abs(coefs[k] - baseCoefs[k]) > 1e-6).length;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Top action bar */}
      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.textDim }}>
            <span style={{ color: T.accent }}>{totalChanges}</span> coefficient(s) modified from base model
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={resetAll} style={{
            background: totalChanges > 0 ? T.accent : T.borderAccent,
            border: 'none',
            color: totalChanges > 0 ? T.bg : T.textDim,
            fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600,
            padding: '8px 16px', cursor: totalChanges > 0 ? 'pointer' : 'default',
            letterSpacing: '0.05em',
          }}>RESET ALL</button>
        </div>
      </Panel>

      {/* Coefficient sliders, grouped */}
      <Panel title="Coefficient toggles" subtitle="adjust β-scaled values; recompute is live">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {groups.map(g => (
            <div key={g.name}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${T.border}` }}>{g.name}</div>
              {g.keys.map(key => {
                const isIntercept = key === '_intercept';
                const baseVal = baseCoefs[key];
                const curVal = coefs[key] ?? baseVal;
                const drifted = Math.abs(curVal - baseVal) > 1e-6;
                // Slider range: ±2 around base for coefficients, ±3 for intercept
                const range = isIntercept ? 3 : 2;
                const sliderMin = baseVal - range;
                const sliderMax = baseVal + range;
                const step = 0.01;
                const label = isIntercept ? 'Intercept (β₀)' : (FEATURE_LABEL[key] || key);
                return (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.text }}>{label}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim }}>base {baseVal.toFixed(3)}</span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: drifted ? T.accent : T.text, fontWeight: drifted ? 600 : 400, fontFeatureSettings: '"tnum"' }}>
                          {curVal >= 0 ? '+' : ''}{curVal.toFixed(3)}
                        </span>
                        <button onClick={() => resetOne(key)} disabled={!drifted} style={{
                          background: 'transparent', border: 'none',
                          color: drifted ? T.accent : T.borderAccent,
                          fontFamily: FONT_MONO, fontSize: 9,
                          padding: '0 4px', cursor: drifted ? 'pointer' : 'default',
                        }}>↺</button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      step={step}
                      value={curVal}
                      onChange={(e) => setCoefs({ ...coefs, [key]: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: drifted ? T.accent : T.borderAccent }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Panel>

      {/* Live S-curve + yearly fit charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Panel title="S-curve" subtitle="orange=actual, blue=base, purple=current">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={scurveData} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={T.grid} />
              <XAxis type="number" dataKey="ri_mid" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} domain={['dataMin - 20', 'dataMax + 20']} />
              <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(2) + '%'} labelFormatter={(label) => `RI ≈ ${Math.round(label)} bp`} />
              <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
              <ReferenceLine x={0} stroke={T.textDim} strokeDasharray="2 4" />
              <Line type="monotone" dataKey="actual_cpr" stroke={T.accent} strokeWidth={2} dot={{ fill: T.accent, r: 3 }} name="Actual" />
              <Line type="monotone" dataKey="orig_pred_cpr" stroke={T.blue} strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Base predicted" />
              <Line type="monotone" dataKey="new_pred_cpr" stroke={T.purple} strokeWidth={2} dot={{ fill: T.purple, r: 3 }} name="Current predicted" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Yearly fit" subtitle="actual vs base vs current">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={yearlyData} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={T.grid} vertical={false} />
              <XAxis dataKey="year" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} />
              <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(2) + '%'} />
              <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
              <Bar dataKey="actual_cpr" fill={T.accent} name="Actual" />
              <Line type="monotone" dataKey="orig_pred_cpr" stroke={T.blue} strokeWidth={1.5} strokeDasharray="3 3" dot={{ fill: T.blue, r: 2 }} name="Base predicted" />
              <Line type="monotone" dataKey="new_pred_cpr" stroke={T.purple} strokeWidth={2} dot={{ fill: T.purple, r: 3 }} name="Current predicted" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Monthly time series */}
      <Panel title="Monthly fit" subtitle="actual vs base vs current">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis dataKey="period_label" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 9 }} interval={11} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(2) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <ReferenceArea x1="2020-03" x2="2021-12" fill={T.accent} fillOpacity={0.04} />
            <Line type="monotone" dataKey="actual_cpr" stroke={T.accent} strokeWidth={1.5} dot={false} name="Actual" />
            <Line type="monotone" dataKey="orig_pred_cpr" stroke={T.blue} strokeWidth={1.2} strokeDasharray="3 3" dot={false} name="Base predicted" />
            <Line type="monotone" dataKey="new_pred_cpr" stroke={T.purple} strokeWidth={1.5} dot={false} name="Current predicted" />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* Summary table */}
      <Panel title="Summary" subtitle="before/after/Δ for coefficients and fit metrics">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Coefficients table */}
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>COEFFICIENTS</div>
            <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>Feature</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Base</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Current</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {/* Intercept row */}
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: Math.abs(coefs._intercept - baseCoefs._intercept) > 1e-6 ? '#1a0f00' : 'transparent' }}>
                  <td style={{ padding: '6px 8px', color: T.text }}>Intercept</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.textDim }}>{baseCoefs._intercept.toFixed(4)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.text }}>{coefs._intercept.toFixed(4)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(coefs._intercept - baseCoefs._intercept) < 1e-6 ? T.textDim : (coefs._intercept - baseCoefs._intercept) > 0 ? T.green : T.red }}>
                    {Math.abs(coefs._intercept - baseCoefs._intercept) < 1e-6 ? '—' : ((coefs._intercept - baseCoefs._intercept) > 0 ? '+' : '') + (coefs._intercept - baseCoefs._intercept).toFixed(4)}
                  </td>
                </tr>
                {[...MODEL_DATA.coefficients].sort((a,b) => b.importance - a.importance).map(c => {
                  const cur = coefs[c.feature] ?? c.beta_scaled;
                  const delta = cur - c.beta_scaled;
                  const drifted = Math.abs(delta) > 1e-6;
                  return (
                    <tr key={c.feature} style={{ borderBottom: `1px solid ${T.border}`, background: drifted ? '#1a0f00' : 'transparent' }}>
                      <td style={{ padding: '6px 8px', color: T.text }}>{c.feature}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: T.textDim }}>{c.beta_scaled.toFixed(4)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: T.text }}>{cur.toFixed(4)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: !drifted ? T.textDim : delta > 0 ? T.green : T.red }}>
                        {!drifted ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Fit metrics */}
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>FIT METRICS</div>
            <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>Metric</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Base</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Current</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px' }}>Sample-mean predicted CPR</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{pct(aggMetrics.origPredCpr)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.purple }}>{pct(aggMetrics.newPredCpr)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(aggMetrics.newPredCpr - aggMetrics.origPredCpr) < 0.01 ? T.textDim : (aggMetrics.newPredCpr > aggMetrics.origPredCpr ? T.green : T.red) }}>
                    {((aggMetrics.newPredCpr - aggMetrics.origPredCpr) >= 0 ? '+' : '') + (aggMetrics.newPredCpr - aggMetrics.origPredCpr).toFixed(2) + '%'}
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px', color: T.textDim }}>Actual CPR (sample)</td>
                  <td colSpan={3} style={{ padding: '6px 8px', textAlign: 'right', color: T.accent }}>{pct(aggMetrics.actualCpr)}</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px' }}>Yearly RMSE (CPR)</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{aggMetrics.origYearlyRmse.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.purple }}>{aggMetrics.newYearlyRmse.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(aggMetrics.newYearlyRmse - aggMetrics.origYearlyRmse) < 0.001 ? T.textDim : (aggMetrics.newYearlyRmse < aggMetrics.origYearlyRmse ? T.green : T.red) }}>
                    {((aggMetrics.newYearlyRmse - aggMetrics.origYearlyRmse) >= 0 ? '+' : '') + (aggMetrics.newYearlyRmse - aggMetrics.origYearlyRmse).toFixed(3)}
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px' }}>S-curve RMSE (CPR)</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{aggMetrics.origScurveRmse.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.purple }}>{aggMetrics.newScurveRmse.toFixed(3)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(aggMetrics.newScurveRmse - aggMetrics.origScurveRmse) < 0.001 ? T.textDim : (aggMetrics.newScurveRmse < aggMetrics.origScurveRmse ? T.green : T.red) }}>
                    {((aggMetrics.newScurveRmse - aggMetrics.origScurveRmse) >= 0 ? '+' : '') + (aggMetrics.newScurveRmse - aggMetrics.origScurveRmse).toFixed(3)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: T.textDim, marginTop: 12, lineHeight: 1.5 }}>
              <span style={{ color: T.accent }}>NOTE</span> — Live recomputation uses bucket-mean of standardized features. Exact in the limit of zero within-bucket variance; for extreme coefficient moves there is a small approximation bias. AUC and log-loss can&apos;t be recomputed without per-row data, so they&apos;re not shown here.
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Loan Projector — forward CPR vector under flat / parallel-shock rate scenarios
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
// ATTRIBUTION TAB — per-loan CPR decomposition for Excel parity
// ════════════════════════════════════════════════════════════════════
function Attribution() {
  const D = MODEL_DATA;
  const loans = D.attribution_loans || [];
  const [selectedIdx, setSelectedIdx] = useState(0);
  // Build coefficient lookup map for label/group/beta enrichment
  const coefByFeature = useMemo(() => {
    const m = {};
    D.coefficients.forEach(c => { m[c.feature] = c; });
    return m;
  }, []);
  const loan = loans[selectedIdx];
  if (!loan) return <Panel title="Attribution"><div style={{ color: T.textDim }}>No attribution loans available.</div></Panel>;

  const intercept = D.metadata.intercept_scaled;
  const finalCpr = loan.pred_cpr;
  const finalSmm = loan.pred_smm;
  // Absolute attribution math
  const baselineSmm = 1 / (1 + Math.exp(-intercept));
  const baselineCpr = (1 - Math.pow(1 - baselineSmm, 12)) * 100;
  const totalLogitDev = loan.logit_z - intercept;
  const totalCprDev = finalCpr - baselineCpr;

  // Enrich contributions with label/group/beta from coefficients lookup
  const enrichedContribs = loan.contributions.map(c => {
    const coef = coefByFeature[c.feature] || {};
    return {
      ...c,
      label: coef.label || c.feature,
      group: coef.group || 'Other',
      beta_scaled: coef.beta_scaled || 0,
    };
  });

  // Compute waterfall client-side from sorted contributions
  const sortedContribs = [...enrichedContribs].sort((a, b) =>
    Math.abs(b.contribution_logit) - Math.abs(a.contribution_logit)
  );
  const waterfall = useMemo(() => {
    let z_running = intercept;
    let smm_running = 1 / (1 + Math.exp(-z_running));
    let cpr_running = (1 - Math.pow(1 - smm_running, 12)) * 100;
    const wf = [{
      step: 'Intercept', logit_value: intercept,
      smm_after: smm_running, cpr_after: cpr_running,
      delta_smm: 0, delta_cpr: 0, isFirst: true,
    }];
    for (const c of sortedContribs) {
      const smm_prev = smm_running, cpr_prev = cpr_running;
      z_running += c.contribution_logit;
      smm_running = 1 / (1 + Math.exp(-z_running));
      cpr_running = (1 - Math.pow(1 - smm_running, 12)) * 100;
      wf.push({
        step: c.label, feature: c.feature, group: c.group,
        x_native: c.x_native, x_std: c.x_std, beta_scaled: c.beta_scaled,
        logit_value: c.contribution_logit,
        smm_after: smm_running, cpr_after: cpr_running,
        delta_smm: smm_running - smm_prev,
        delta_cpr: cpr_running - cpr_prev,
        isFirst: false,
      });
    }
    return wf;
  }, [loan, intercept, sortedContribs]);

  // Group by feature group
  const byGroup = {};
  enrichedContribs.forEach(c => {
    if (!byGroup[c.group]) byGroup[c.group] = { logit: 0, items: [] };
    byGroup[c.group].logit += c.contribution_logit;
    byGroup[c.group].items.push(c);
  });

  const maxAbs = Math.max(...enrichedContribs.map(c => Math.abs(c.contribution_logit)));

  const fmtX = (x, f) => {
    const isBinary = ['in_prepay_penalty','is_hc_232','is_223a7','is_538','lp_NC','is_post_covid'].includes(f) || f.startsWith('iss_');
    if (isBinary) return x >= 0.5 ? '1' : '0';
    if (Math.abs(x) > 100) return x.toFixed(1);
    if (Math.abs(x) > 10) return x.toFixed(2);
    return x.toFixed(3);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Panel title="Sample Loans (median pred for each archetype)" subtitle="Click a row to view full attribution; this matches what Excel will reproduce">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 10, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderAccent}`, color: T.textDim }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Label</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Loan ID</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>FHA</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>LP</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Issuer</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Period</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>logit z</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>SMM</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>CPR</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((L, i) => {
                const isSel = i === selectedIdx;
                return (
                  <tr key={i} onClick={() => setSelectedIdx(i)} style={{
                    cursor: 'pointer',
                    background: isSel ? T.bgAccent : 'transparent',
                    borderLeft: isSel ? `2px solid ${T.accent}` : '2px solid transparent',
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    <td style={{ padding: '6px 8px', color: T.text }}>{L.label}</td>
                    <td style={{ padding: '6px 8px', color: T.textDim, fontSize: 9 }}>{L.loan_id.slice(0, 18)}…</td>
                    <td style={{ padding: '6px 8px', color: T.textDim }}>{L.fha_category}</td>
                    <td style={{ padding: '6px 8px', color: T.textDim }}>{L.loan_purpose}</td>
                    <td style={{ padding: '6px 8px', color: T.textDim }}>{L.issuer_key}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.textDim }}>{L.period}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.text, fontFeatureSettings: '"tnum"' }}>{L.logit_z.toFixed(3)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.text, fontFeatureSettings: '"tnum"' }}>{(L.pred_smm * 100).toFixed(4)}%</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>{L.pred_cpr.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Panel title={`Selected: ${loan.label}`} subtitle={`Loan ${loan.loan_id} • Period ${loan.period}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Stat label="Baseline CPR" value={baselineCpr.toFixed(2) + '%'} sub={`logit=${intercept.toFixed(3)}`} />
            <Stat label="Σ Δ CPR (abs.)" value={(totalCprDev > 0 ? '+' : '') + totalCprDev.toFixed(2) + '%'} sub="all features combined" />
            <Stat label="Pred CPR" value={finalCpr.toFixed(2) + '%'} sub={`logit=${loan.logit_z.toFixed(3)}`} />
            <Stat label="Pred SMM" value={(finalSmm*100).toFixed(4) + '%'} sub="monthly" />
          </div>
        </Panel>
        <Panel title="Logit decomposition by group" subtitle="Σ across groups + intercept = logit z">
          <div style={{ fontFamily: FONT_MONO, fontSize: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px',
                          color: T.textDim, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
              <span>Component</span><span style={{ textAlign: 'right' }}>logit</span><span style={{ textAlign: 'right' }}>Δ CPR (abs.)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px',
                          padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.text }}>Intercept (baseline)</span>
              <span style={{ textAlign: 'right', color: T.textDim }}>{intercept.toFixed(3)}</span>
              <span style={{ textAlign: 'right', color: T.text, fontFeatureSettings: '"tnum"' }}>{baselineCpr.toFixed(3)}%</span>
            </div>
            {GROUP_ORDER.map(g => {
              const grp = byGroup[g];
              if (!grp) return null;
              const positive = grp.logit > 0;
              return (
                <div key={g} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px',
                                      padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.text }}>{g}</span>
                  <span style={{ textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"' }}>
                    {positive ? '+' : ''}{grp.logit.toFixed(3)}
                  </span>
                  <span style={{ textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                    {positive ? '+' : ''}{(totalLogitDev !== 0 ? (grp.logit / totalLogitDev) * totalCprDev : 0).toFixed(3)}%
                  </span>
                </div>
              );
            })}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px',
                          padding: '6px 0', borderTop: `2px solid ${T.borderAccent}`, marginTop: 4 }}>
              <span style={{ color: T.accent, fontWeight: 600 }}>Pred (intercept + Σ)</span>
              <span style={{ textAlign: 'right', color: T.accent, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
                {loan.logit_z.toFixed(3)}
              </span>
              <span style={{ textAlign: 'right', color: T.accent, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
                {finalCpr.toFixed(3)}%
              </span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Per-feature attribution (logit + absolute CPR)" subtitle="β·xs sums to (logit z − intercept). CPR allocated proportionally so baseline + Σ = pred CPR.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 10, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderAccent}`, color: T.textDim }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Group</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Feature</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>x (native)</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>x (std)</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>β (scaled)</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>β·xs (logit)</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Δ CPR (abs.)</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', minWidth: 200 }}>contribution bar</th>
              </tr>
            </thead>
            <tbody>
              {sortedContribs.map((c, i) => {
                const positive = c.contribution_logit > 0;
                const cprAttr = totalLogitDev !== 0 ? (c.contribution_logit / totalLogitDev) * totalCprDev : 0;
                const w = (Math.abs(c.contribution_logit) / maxAbs) * 100;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 8px', color: T.textDim, fontSize: 9 }}>{c.group}</td>
                    <td style={{ padding: '6px 8px', color: T.text }}>{c.label}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.text, fontFeatureSettings: '"tnum"' }}>
                      {fmtX(c.x_native, c.feature)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.textDim, fontFeatureSettings: '"tnum"' }}>
                      {c.x_std.toFixed(3)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.textDim, fontFeatureSettings: '"tnum"' }}>
                      {c.beta_scaled.toFixed(4)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"' }}>
                      {positive ? '+' : ''}{c.contribution_logit.toFixed(4)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                      {positive ? '+' : ''}{cprAttr.toFixed(3)}%
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ position: 'relative', height: 14, background: T.border, width: '100%' }}>
                        <div style={{ position: 'absolute', left: '50%', top: 0, height: 14, width: 1, background: T.textDim }} />
                        <div style={{
                          position: 'absolute',
                          left: positive ? '50%' : `${50 - w/2}%`,
                          top: 0, height: 14,
                          width: `${w/2}%`,
                          background: positive ? T.green : T.red,
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Waterfall: cumulative SMM/CPR as features add up" subtitle="Same order as table above. Final CPR = pred CPR.">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 10, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderAccent}`, color: T.textDim }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Step</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>+logit</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>SMM after</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>CPR after</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Δ CPR</th>
              </tr>
            </thead>
            <tbody>
              {waterfall.map((w, i) => {
                const isFirst = i === 0;
                const positive = (w.delta_cpr || 0) > 0;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`,
                                       background: isFirst ? T.bgAccent : 'transparent' }}>
                    <td style={{ padding: '6px 8px', color: isFirst ? T.accent : T.text, fontWeight: isFirst ? 600 : 400 }}>
                      {isFirst ? 'Intercept (baseline)' : w.step}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.textDim, fontFeatureSettings: '"tnum"' }}>
                      {isFirst ? w.logit_value.toFixed(3) : (w.logit_value > 0 ? '+' : '') + w.logit_value.toFixed(3)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.text, fontFeatureSettings: '"tnum"' }}>
                      {(w.smm_after * 100).toFixed(4)}%
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: T.text, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                      {w.cpr_after.toFixed(3)}%
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: isFirst ? T.textDim : (positive ? T.green : T.red), fontFeatureSettings: '"tnum"' }}>
                      {isFirst ? '—' : (positive ? '+' : '') + w.delta_cpr.toFixed(3) + '%'}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: `2px solid ${T.borderAccent}` }}>
                <td style={{ padding: '6px 8px', color: T.accent, fontWeight: 600 }}>Final prediction</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{loan.logit_z.toFixed(3)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{(finalSmm * 100).toFixed(4)}%</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{finalCpr.toFixed(3)}%</td>
                <td style={{ padding: '6px 8px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Excel formula recipe" subtitle="Both attribution methods. Method B is the order-independent absolute attribution.">
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.text, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 8, color: T.accent }}>Step 1: Compute logit z (same for both methods)</div>
          <div style={{ paddingLeft: 16, color: T.textDim }}>
            For each feature j:
            <br/>&nbsp;&nbsp;x_std[j] = (x_native[j] − mean[j]) / std[j]
            <br/>&nbsp;&nbsp;contrib_logit[j] = beta_scaled[j] × x_std[j]
            <br/>logit_z = intercept_scaled + Σ contrib_logit[j]
            <br/>SMM = 1 / (1 + EXP(−logit_z))
            <br/>CPR = 1 − (1 − SMM)^12
          </div>
          <div style={{ marginTop: 12, marginBottom: 8, color: T.accent }}>Step 2A (waterfall): cumulative add, order-dependent</div>
          <div style={{ paddingLeft: 16, color: T.textDim }}>
            Sort features by |contrib_logit| descending.
            <br/>For each step k: z_k = z_(k-1) + contrib_logit[k]; cpr_k = 1 − (1 − sigmoid(z_k))^12
            <br/>Δcpr[k] = cpr_k − cpr_(k-1)
            <br/><span style={{ color: T.red }}>⚠ Δcpr depends on add order due to sigmoid nonlinearity.</span>
          </div>
          <div style={{ marginTop: 12, marginBottom: 8, color: T.accent }}>Step 2B (absolute, recommended): proportional CPR allocation</div>
          <div style={{ paddingLeft: 16, color: T.textDim }}>
            baseline_smm = 1 / (1 + EXP(−intercept_scaled))
            <br/>baseline_cpr = 1 − (1 − baseline_smm)^12
            <br/>total_logit_dev = logit_z − intercept_scaled = Σ contrib_logit[j]
            <br/>total_cpr_dev = pred_cpr − baseline_cpr
            <br/>For each feature j:
            <br/>&nbsp;&nbsp;cpr_attr[j] = (contrib_logit[j] / total_logit_dev) × total_cpr_dev
            <br/><span style={{ color: T.green }}>✓ Order-independent. Σ cpr_attr[j] = total_cpr_dev exactly.</span>
            <br/><span style={{ color: T.green }}>✓ baseline_cpr + Σ cpr_attr[j] = pred_cpr exactly.</span>
          </div>
          <div style={{ marginTop: 12, padding: 8, background: T.bgAccent, border: `1px solid ${T.borderAccent}` }}>
            <span style={{ color: T.accent }}>For this loan:</span>
            <br/>&nbsp;&nbsp;intercept = {intercept.toFixed(4)} → baseline CPR = {baselineCpr.toFixed(3)}%
            <br/>&nbsp;&nbsp;Σ contrib_logit = {totalLogitDev.toFixed(4)}
            <br/>&nbsp;&nbsp;logit z = {loan.logit_z.toFixed(4)} → pred CPR = {finalCpr.toFixed(3)}%
            <br/>&nbsp;&nbsp;total CPR deviation = {totalCprDev.toFixed(3)}%
            <br/>&nbsp;&nbsp;sanity: {baselineCpr.toFixed(3)}% + {totalCprDev.toFixed(3)}% = {(baselineCpr + totalCprDev).toFixed(3)}% ≈ {finalCpr.toFixed(3)}% ✓
          </div>
        </div>
      </Panel>
    </div>
  );
}

function LoanProjector() {
  const archetypes = MODEL_DATA.archetype_anchors;
  const archetypeIds = Object.keys(archetypes);
  const plcNowBps = MODEL_DATA.metadata.plc_now_bps ?? MODEL_DATA_INV?.metadata?.plc_now_bps ?? 447;
  const lastPeriod = MODEL_DATA.metadata.last_period;

  // ── Inputs ──────────────────────────────────────────────────────
  const [archId, setArchId] = useState(archetypeIds[0]);
  const [vintage, setVintage] = useState(2024);
  const [origUpb, setOrigUpb] = useState(10);   // $M
  const [origRate, setOrigRate] = useState(5.5); // %
  const [lockoutYrs, setLockoutYrs] = useState(2);
  const [penaltyYrs, setPenaltyYrs] = useState(8);
  const [penaltySchedule, setPenaltySchedule] = useState('5,4,3,2,1,0,0,0'); // standard 5-4-3-2-1-0
  const [origAgeM, setOrigAgeM] = useState(0); // current age (months)
  const [scenario, setScenario] = useState('flat'); // 'flat' | 'shock_up' | 'shock_down' | 'shock_up2' | 'shock_down2'
  const [issuer, setIssuer] = useState('other'); // top-10 issuer key or 'other'
  const [horizonYrs] = useState(30);
  const [attributionMonth, setAttributionMonth] = useState(1);  // which month to attribute (1 = next month)

  const arch = archetypes[archId];
  const issuerKeys = MODEL_DATA.metadata.top_issuers || [];
  const issuerNameMap = MODEL_DATA.metadata.issuer_name_map || {};

  // Apply archetype defaults when archetype changes
  useEffect(() => {
    if (arch && arch.typical) {
      // V6E: mean_loan_rate now embedded in archetype anchors; fallback to 4.0% if missing
      setOrigRate(arch.typical.mean_loan_rate || 4.0);
      setOrigUpb((arch.typical.mean_upb || 5_000_000) / 1e6);
      // Default issuer to the most common one for this archetype
      if (arch.typical.top_issuer) {
        setIssuer(arch.typical.top_issuer);
      }
    }
  }, [archId]);

  // ── Build feature vector for a given month ─────────────────────
  // Path-dependent state: must be computed sequentially across months
  function buildProjection() {
    const horizonM = horizonYrs * 12;
    const coefByFeature = {};
    MODEL_DATA.coefficients.forEach(c => { coefByFeature[c.feature] = c; });
    const intercept = MODEL_DATA.metadata.intercept_scaled;
    const featureList = MODEL_DATA.metadata.feature_list;

    // Involuntary model: separate logistic on a different feature set
    const invCoefByFeature = {};
    MODEL_DATA_INV.coefficients.forEach(c => { invCoefByFeature[c.feature] = c; });
    const invIntercept = MODEL_DATA_INV.metadata.intercept_scaled;
    const invFeatureList = MODEL_DATA_INV.metadata.feature_list;

    // Penalty schedule: parse string of comma-separated points
    const penSched = penaltySchedule.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v));

    // Determine PLC rate path based on scenario
    const shocks = { flat: 0, shock_up: 100, shock_down: -100, shock_up2: 200, shock_down2: -200 };
    const plcShock = shocks[scenario] || 0;
    const plcPathBps = plcNowBps + plcShock;  // held flat

    // Vintage-median proxy for SATO. Use the archetype's typical sato as anchor;
    // for our purposes here (forward-only), SATO is locked at origination, so
    // we just compute it from origRate vs. the panel's vintage-year norm.
    // Approximation: use archetype's median sato (already includes vintage effects).
    // V6E: sato_bps removed from feature set, but loan_rate still drives refi_incentive amortization

    // Static features (V6E spec) — don't change month to month
    const fixed = {
      log_upb: Math.log(1 + origUpb * 1e6),
      is_post_covid: vintage >= 2021 ? 1 : 0,
      is_hc_232: arch.typical.is_hc_232,
      is_223a7: arch.typical.is_223a7,
      is_538: arch.typical.is_538,
      lp_NC: arch.typical.lp_NC,
    };
    // Issuer dummies — exactly one set to 1, the rest 0 ('other' = all 0)
    for (const k of issuerKeys) {
      fixed['iss_' + k] = (issuer === k ? 1 : 0);
    }

    // Path-dependent state
    let cum_itm = 0;
    let projection = [];

    for (let t = 0; t < horizonM; t++) {
      const age = origAgeM + t;
      const ageY = age / 12;

      // Penalty/lockout state
      const inLockout = ageY < lockoutYrs;
      const inPenalty = ageY >= lockoutYrs && ageY < (lockoutYrs + penaltyYrs);
      const penaltyMonth = inPenalty ? Math.floor(ageY - lockoutYrs) : -1;
      const penaltyPoints = (penaltyMonth >= 0 && penaltyMonth < penSched.length)
        ? penSched[penaltyMonth] : 0;
      const past_all_restrictions = !inLockout && !inPenalty ? 1 : 0;
      const in_prepay_penalty = inPenalty ? 1 : 0;

      // Refi incentive: gross = (loan_rate - PLC) * 100, net = gross - penalty cost
      const grossRefi = (origRate - plcPathBps / 100) * 100;
      // Penalty cost in bps: penalty points × ~33 bps each (approximation)
      // Using same convention as the panel: net = gross - prepay_penalty_points × constant
      const netRefi = grossRefi - penaltyPoints * 33;

      // Update cum_itm based on whether this month is ITM (gross > 0)
      if (grossRefi > 0) cum_itm += 1;
      const burn_ratio = age >= 1 ? Math.min(1, cum_itm / age) : 0;

      // Feature vector in canonical order
      const features = {
        refi_incentive_bps: netRefi,
        gross_refi_incentive_bps: grossRefi,
        prepay_penalty_points: penaltyPoints,
        in_prepay_penalty,
        past_all_restrictions,
        loan_age_months: age,
        ...fixed,
        cum_itm,
        burn_ratio,
      };

      // If in lockout, the loan can't voluntarily prepay → SMM = 0
      // (the trained model is on prepay_eligible=1 only, so we shouldn't apply it during lockout)
      let smm = 0;
      if (!inLockout) {
        let z = intercept;
        for (const f of featureList) {
          const c = coefByFeature[f];
          const x = features[f];
          if (typeof x !== 'number' || isNaN(x)) continue;
          z += c.beta_scaled * (x - c.mean) / c.std;
        }
        smm = sigmoid(z);
      }
      const cpr = smm2cpr(smm);

      // Score involuntary CDR — runs even during lockout because
      // involuntary_eligible includes in-lockout loans (issuers can
      // and do buy out delinquent loans regardless of prepay
      // restrictions).
      let invSmm = 0;
      {
        let z = invIntercept;
        for (const f of invFeatureList) {
          const c = invCoefByFeature[f];
          const x = features[f];
          if (typeof x !== 'number' || isNaN(x)) continue;
          z += c.beta_scaled * (x - c.mean) / c.std;
        }
        invSmm = sigmoid(z);
      }
      const cdr = smm2cpr(invSmm);
      const totalSmm = smm + invSmm;     // approximate; SMMs are small so independence is fine
      const totalRate = smm2cpr(totalSmm);  // total monthly hazard → annualized

      projection.push({
        month: t + 1,
        year: ((t + 1) / 12).toFixed(1),
        age_months: age,
        age_yrs: (age / 12).toFixed(1),
        cpr,
        smm,
        cdr,
        inv_smm: invSmm,
        total_rate: totalRate,
        in_lockout: inLockout ? 1 : 0,
        in_penalty: inPenalty ? 1 : 0,
        past_restrictions: past_all_restrictions,
        penalty_points: penaltyPoints,
        net_refi_bps: netRefi,
        gross_refi_bps: grossRefi,
        cum_itm,
        burn_ratio,
        // V6E feature vector at this month (for attribution)
        features: { ...features },
      });
    }

    // Compute survival curve (balance amortization): 
    //   B_{t+1} = B_t × (1 - sched_amort_t) × (1 - SMM_total_t)
    // SMM_total = vol SMM + inv SMM (small enough that independence is fine)
    const termY = arch.typical.lp_NC === 1 ? 35 : 30;
    const remainingTermM = termY * 12 - origAgeM;
    const monthlyRate = origRate / 100 / 12;
    let balance = origUpb * 1e6;
    let cumVolPaid = 0, cumInvPaid = 0;
    const balances = [balance];
    for (let t = 0; t < projection.length; t++) {
      const remM = remainingTermM - t;
      let schedPay = 0;
      if (remM > 0 && monthlyRate > 0) {
        const annPay = balance * monthlyRate / (1 - Math.pow(1 + monthlyRate, -remM));
        schedPay = annPay - balance * monthlyRate;
      } else if (remM > 0) {
        schedPay = balance / remM;
      }
      const schedFrac = balance > 0 ? schedPay / balance : 0;
      const smm = projection[t].smm;
      const invSmm = projection[t].inv_smm;
      // Apportion the survival decay between scheduled, voluntary, involuntary
      const balAfterSched = balance * (1 - schedFrac);
      const volPaid = balAfterSched * smm;
      const invPaid = balAfterSched * invSmm;
      const newBalance = Math.max(0, balAfterSched - volPaid - invPaid);
      cumVolPaid += volPaid;
      cumInvPaid += invPaid;
      balance = newBalance;
      balances.push(balance);
      projection[t].balance = balance;
      projection[t].sched_amort_frac = schedFrac;
      projection[t].cum_vol_paid = cumVolPaid;
      projection[t].cum_inv_paid = cumInvPaid;
    }

    // Aggregate metrics: WAL, total prepay %, balance at end
    let cumTime = 0, cumPrincipal = 0;
    let prevBal = origUpb * 1e6;
    for (let t = 0; t < projection.length; t++) {
      const principalThisMonth = prevBal - projection[t].balance;
      cumPrincipal += principalThisMonth;
      cumTime += principalThisMonth * (t + 1) / 12;
      prevBal = projection[t].balance;
    }
    const wal = cumPrincipal > 0 ? cumTime / cumPrincipal : 0;
    const finalBal = projection[projection.length - 1].balance;
    const totalPrepaidPct = (1 - finalBal / (origUpb * 1e6)) * 100;
    
    // Annualized CPR / CDR by year (simple average of monthly rates)
    const yearly = [];
    for (let y = 1; y <= horizonYrs; y++) {
      const yearProjs = projection.filter(p => p.month > (y - 1) * 12 && p.month <= y * 12);
      if (yearProjs.length === 0) continue;
      const avgCpr = yearProjs.reduce((s, p) => s + p.cpr, 0) / yearProjs.length;
      const avgCdr = yearProjs.reduce((s, p) => s + p.cdr, 0) / yearProjs.length;
      const balStart = y === 1 ? origUpb * 1e6 : yearProjs[0].balance;
      const balEnd = yearProjs[yearProjs.length - 1].balance;
      yearly.push({
        year: y,
        avg_cpr: avgCpr,
        avg_cdr: avgCdr,
        avg_total: avgCpr + avgCdr,
        bal_start: balStart,
        bal_end: balEnd,
        bal_pct: (balEnd / (origUpb * 1e6)) * 100,
      });
    }

    return {
      projection, yearly, wal, totalPrepaidPct, finalBal,
      cumVolPaid, cumInvPaid,
      totalVolPct: (cumVolPaid / (origUpb * 1e6)) * 100,
      totalInvPct: (cumInvPaid / (origUpb * 1e6)) * 100,
    };
  }

  const proj = useMemo(() => buildProjection(),
    [archId, vintage, origUpb, origRate, lockoutYrs, penaltyYrs, penaltySchedule, origAgeM, scenario, issuer]);

  // Decimate for chart (every 3rd month) to keep render fast
  const projChart = useMemo(() => 
    proj.projection.filter((_, i) => i % 3 === 0),
    [proj]);

  // Absolute CPR attribution at the chosen attributionMonth, using same proportional
  // method as the Attribution tab. Order-independent. Sums baseline + Σ = pred CPR exactly.
  const attribution = useMemo(() => {
    if (!proj.projection || proj.projection.length === 0) return null;
    const idx = Math.min(attributionMonth - 1, proj.projection.length - 1);
    const row = proj.projection[idx];
    if (!row || !row.features || row.in_lockout) return null;
    const intercept = MODEL_DATA.metadata.intercept_scaled;
    const baselineSmm = 1 / (1 + Math.exp(-intercept));
    const baselineCpr = (1 - Math.pow(1 - baselineSmm, 12)) * 100;
    const featList = MODEL_DATA.metadata.feature_list;
    const coefByFeat = {};
    MODEL_DATA.coefficients.forEach(c => { coefByFeat[c.feature] = c; });
    const contribs = featList.map(f => {
      const c = coefByFeat[f];
      const x = row.features[f];
      const xStd = (x - c.mean) / c.std;
      const cl = c.beta_scaled * xStd;
      return { feature: f, label: c.label, group: c.group, x_native: x, x_std: xStd,
               beta_scaled: c.beta_scaled, contrib_logit: cl };
    });
    const totalLogitDev = contribs.reduce((s, c) => s + c.contrib_logit, 0);
    const projectedCpr = row.cpr;
    const totalCprDev = projectedCpr - baselineCpr;
    contribs.forEach(c => {
      c.cpr_attr = totalLogitDev !== 0 ? (c.contrib_logit / totalLogitDev) * totalCprDev : 0;
    });
    contribs.sort((a, b) => Math.abs(b.contrib_logit) - Math.abs(a.contrib_logit));
    const byGroup = {};
    contribs.forEach(c => {
      if (!byGroup[c.group]) byGroup[c.group] = { logit: 0, cpr: 0 };
      byGroup[c.group].logit += c.contrib_logit;
      byGroup[c.group].cpr += c.cpr_attr;
    });
    return { contribs, byGroup, intercept, baselineCpr, projectedCpr,
             projectedSmm: row.smm, totalLogitDev, totalCprDev,
             ageMonths: row.age_months, inLockout: row.in_lockout,
             inPenalty: row.in_penalty, netRefiBps: row.net_refi_bps };
  }, [proj, attributionMonth]);

  // Phase shading bounds for the CPR chart
  const phases = useMemo(() => {
    const monthsInLockout = lockoutYrs * 12 - origAgeM;
    const lockoutEnd = Math.max(0, monthsInLockout);
    const penaltyEnd = lockoutEnd + penaltyYrs * 12;
    return { lockoutEnd, penaltyEnd };
  }, [lockoutYrs, penaltyYrs, origAgeM]);

  // ── Render ──────────────────────────────────────────────────────
  const scenarios = [
    { id: 'shock_down2', label: '−200 bp' },
    { id: 'shock_down', label: '−100 bp' },
    { id: 'flat', label: 'Flat' },
    { id: 'shock_up', label: '+100 bp' },
    { id: 'shock_up2', label: '+200 bp' },
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Inputs */}
      <Panel title="Inputs" subtitle={`current PLC rate ${plcNowBps.toFixed(0)} bp (as of ${lastPeriod})`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>ARCHETYPE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              {archetypeIds.map(id => (
                <button key={id} onClick={() => setArchId(id)} style={{
                  background: archId === id ? T.accent : T.bg,
                  border: `1px solid ${archId === id ? T.accent : T.borderAccent}`,
                  color: archId === id ? T.bg : T.text,
                  fontFamily: FONT_MONO, fontSize: 10,
                  padding: '6px 8px', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontWeight: 600 }}>{archetypes[id].name}</div>
                  <div style={{ fontSize: 9, opacity: 0.7 }}>n={archetypes[id].typical.n_total.toLocaleString()} · CPR {pct(archetypes[id].typical.overall_actual_cpr, 1)}</div>
                </button>
              ))}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>SCENARIO</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {scenarios.map(s => (
                <button key={s.id} onClick={() => setScenario(s.id)} style={{
                  flex: 1,
                  background: scenario === s.id ? T.accent : T.bg,
                  border: `1px solid ${scenario === s.id ? T.accent : T.borderAccent}`,
                  color: scenario === s.id ? T.bg : T.text,
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
                  padding: '6px 4px', cursor: 'pointer',
                }}>{s.label}</button>
              ))}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>ISSUER (SERVICER)</div>
            <select
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              style={{
                width: '100%', background: T.bg, color: T.text,
                border: `1px solid ${T.borderAccent}`,
                fontFamily: FONT_MONO, fontSize: 11, padding: '6px 8px', cursor: 'pointer',
              }}
            >
              <option value="other">Other / unknown (~70 issuers, reference category)</option>
              {issuerKeys.map(k => (
                <option key={k} value={k}>{issuerNameMap[k] || k}</option>
              ))}
            </select>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: T.textDim, marginTop: 4 }}>
              Default is the most common issuer for this archetype. Switch to see CPR sensitivity to servicer effects.
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>LOAN ATTRIBUTES</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <NumInput label="Vintage year" value={vintage} setValue={setVintage} min={2010} max={2026} step={1} />
              <NumInput label="Loan rate (%)" value={origRate} setValue={setOrigRate} min={2.0} max={9.0} step={0.05} />
              <NumInput label="Original UPB ($M)" value={origUpb} setValue={setOrigUpb} min={0.5} max={200} step={0.5} />
              <NumInput label="Current age (months)" value={origAgeM} setValue={setOrigAgeM} min={0} max={120} step={1} />
              <NumInput label="Lockout (years)" value={lockoutYrs} setValue={setLockoutYrs} min={0} max={5} step={1} />
              <NumInput label="Penalty period (years)" value={penaltyYrs} setValue={setPenaltyYrs} min={0} max={10} step={1} />
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.text, marginBottom: 2 }}>Penalty schedule (comma-separated)</div>
              <input
                type="text"
                value={penaltySchedule}
                onChange={(e) => setPenaltySchedule(e.target.value)}
                style={{
                  width: '100%', background: T.bg, color: T.text,
                  border: `1px solid ${T.borderAccent}`,
                  fontFamily: FONT_MONO, fontSize: 10, padding: '4px 6px',
                }}
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* Aggregate metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <Panel title="WAL"><Stat label="Weighted avg life" value={proj.wal.toFixed(2) + ' yrs'} sub="dollar-weighted" /></Panel>
        <Panel title="Total prepay"><Stat label="By horizon end" value={pct(proj.totalPrepaidPct, 1)} sub={`vol ${pct(proj.totalVolPct, 1)} + inv ${pct(proj.totalInvPct, 1)}`} /></Panel>
        <Panel title="Balance @ horizon"><Stat label="Year 30" value={'$' + (proj.finalBal / 1e6).toFixed(2) + 'M'} sub={pct((proj.finalBal / (origUpb * 1e6)) * 100, 1) + ' of orig'} /></Panel>
        <Panel title="Yr-1 CPR"><Stat label="Voluntary, yr 1" value={pct(proj.yearly[0]?.avg_cpr || 0, 2)} sub={proj.yearly[0]?.avg_cpr === 0 ? 'in lockout' : 'forward'} /></Panel>
        <Panel title="Yr-1 CDR"><Stat label="Involuntary, yr 1" value={pct(proj.yearly[0]?.avg_cdr || 0, 3)} sub="forward" /></Panel>
      </div>

      {/* Forward CPR / CDR vector chart */}
      <Panel title="Forward CPR / CDR vectors" subtitle="month-by-month with phase shading">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={projChart} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis
              dataKey="month"
              stroke={T.textDim}
              style={{ fontFamily: FONT_MONO, fontSize: 10 }}
              ticks={[0, 60, 120, 180, 240, 300, 360]}
              label={{ value: 'Months', position: 'insideBottom', offset: -4, style: { fill: T.textDim, fontSize: 10, fontFamily: FONT_MONO } }}
            />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v, name) => [v.toFixed(name === 'CDR' ? 3 : 2) + '%', name]} labelFormatter={(label) => `Month ${label} (yr ${(label/12).toFixed(1)})`} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            {phases.lockoutEnd > 0 && <ReferenceArea x1={0} x2={phases.lockoutEnd} fill={T.red} fillOpacity={0.06} label={{ value: 'Lockout', fill: T.textDim, fontSize: 10 }} />}
            {phases.penaltyEnd > phases.lockoutEnd && <ReferenceArea x1={phases.lockoutEnd} x2={phases.penaltyEnd} fill={T.accent} fillOpacity={0.04} label={{ value: 'Penalty', fill: T.textDim, fontSize: 10 }} />}
            <Line type="monotone" dataKey="cpr" stroke={T.purple} strokeWidth={2} dot={false} name="CPR" />
            <Line type="monotone" dataKey="cdr" stroke={T.red} strokeWidth={1.5} dot={false} name="CDR" />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginTop: 8, lineHeight: 1.5 }}>
          <span style={{ color: T.accent }}>NOTE</span> — CDR runs at a much lower scale than CPR (~0.1-1% vs ~5-15%) so the line appears flat against the y-axis. Use the annual table below for precise CDR values, or check the Involuntary tab for a dedicated view of CDR dynamics.
        </div>
      </Panel>

      <Panel title="Absolute CPR attribution (projection-based)" subtitle={attribution ? `At month ${attributionMonth} (age ${attribution.ageMonths}mo): baseline + Σ feature contributions = projected CPR. Order-independent.` : 'Loan is in lockout at this month — cannot prepay voluntarily.'}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginRight: 8 }}>Attribute at month:</span>
          {[1, 6, 12, 36, 60, 120, 240].map(m => (
            <button key={m} onClick={() => setAttributionMonth(m)} style={{
              background: attributionMonth === m ? T.accent : T.bg,
              border: `1px solid ${attributionMonth === m ? T.accent : T.borderAccent}`,
              color: attributionMonth === m ? T.bg : T.text,
              fontFamily: FONT_MONO, fontSize: 10, padding: '4px 10px', cursor: 'pointer',
              fontWeight: attributionMonth === m ? 600 : 400,
            }}>{m === 1 ? '1mo' : m < 12 ? m + 'mo' : (m / 12) + 'yr'}</button>
          ))}
        </div>

        {attribution ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <Stat label="Baseline CPR" value={attribution.baselineCpr.toFixed(2) + '%'} sub="intercept-only" />
              <Stat label="Σ Δ CPR (abs.)" value={(attribution.totalCprDev > 0 ? '+' : '') + attribution.totalCprDev.toFixed(2) + '%'} sub="from features" />
              <Stat label="Projected CPR" value={attribution.projectedCpr.toFixed(2) + '%'} sub={`SMM ${(attribution.projectedSmm * 100).toFixed(4)}%`} />
              <Stat label="Net refi (bp)" value={attribution.netRefiBps.toFixed(0)} sub={attribution.inPenalty ? 'in penalty' : 'past restrictions'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginBottom: 6 }}>By feature group</div>
                <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 10, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.borderAccent}`, color: T.textDim }}>
                      <th style={{ textAlign: 'left', padding: '4px 6px' }}>Group</th>
                      <th style={{ textAlign: 'right', padding: '4px 6px' }}>logit</th>
                      <th style={{ textAlign: 'right', padding: '4px 6px' }}>Δ CPR</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '4px 6px', color: T.text }}>Intercept (baseline)</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: T.textDim, fontFeatureSettings: '"tnum"' }}>{attribution.intercept.toFixed(3)}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: T.text, fontFeatureSettings: '"tnum"' }}>{attribution.baselineCpr.toFixed(3)}%</td>
                    </tr>
                    {GROUP_ORDER.map(g => {
                      const grp = attribution.byGroup[g];
                      if (!grp) return null;
                      const positive = grp.logit > 0;
                      return (
                        <tr key={g} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '4px 6px', color: T.text }}>{g}</td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"' }}>
                            {positive ? '+' : ''}{grp.logit.toFixed(3)}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                            {positive ? '+' : ''}{grp.cpr.toFixed(3)}%
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ borderTop: `2px solid ${T.borderAccent}` }}>
                      <td style={{ padding: '6px 6px', color: T.accent, fontWeight: 600 }}>Pred</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right', color: T.accent, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{(attribution.intercept + attribution.totalLogitDev).toFixed(3)}</td>
                      <td style={{ padding: '6px 6px', textAlign: 'right', color: T.accent, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{attribution.projectedCpr.toFixed(3)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginBottom: 6 }}>Per-feature (sorted by |β·xs|)</div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 10, borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: T.panel }}>
                      <tr style={{ borderBottom: `1px solid ${T.borderAccent}`, color: T.textDim }}>
                        <th style={{ textAlign: 'left', padding: '4px 6px' }}>Feature</th>
                        <th style={{ textAlign: 'right', padding: '4px 6px' }}>x</th>
                        <th style={{ textAlign: 'right', padding: '4px 6px' }}>β·xs</th>
                        <th style={{ textAlign: 'right', padding: '4px 6px' }}>Δ CPR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attribution.contribs.map((c, i) => {
                        const positive = c.contrib_logit > 0;
                        const isBin = ['in_prepay_penalty','is_hc_232','is_223a7','is_538','lp_NC','is_post_covid'].includes(c.feature) || c.feature.startsWith('iss_');
                        const xDisplay = isBin ? (c.x_native >= 0.5 ? '1' : '0')
                          : Math.abs(c.x_native) > 100 ? c.x_native.toFixed(1)
                          : Math.abs(c.x_native) > 10 ? c.x_native.toFixed(2)
                          : c.x_native.toFixed(3);
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: '4px 6px', color: T.text }}>{c.label}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', color: T.textDim, fontFeatureSettings: '"tnum"' }}>{xDisplay}</td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"' }}>
                              {positive ? '+' : ''}{c.contrib_logit.toFixed(3)}
                            </td>
                            <td style={{ padding: '4px 6px', textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"', fontWeight: 600 }}>
                              {positive ? '+' : ''}{c.cpr_attr.toFixed(3)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.textDim, padding: 16, textAlign: 'center' }}>
            {proj.projection && proj.projection[Math.min(attributionMonth - 1, proj.projection.length - 1)] && proj.projection[Math.min(attributionMonth - 1, proj.projection.length - 1)].in_lockout
              ? `Loan is in lockout at month ${attributionMonth} (cannot voluntarily prepay). Try a later month.`
              : 'Attribution unavailable for this month.'}
          </div>
        )}
      </Panel>

      {/* Balance amortization curve */}
      <Panel title="Balance amortization" subtitle="scheduled + prepay decay">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={projChart} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis
              dataKey="month"
              stroke={T.textDim}
              style={{ fontFamily: FONT_MONO, fontSize: 10 }}
              ticks={[0, 60, 120, 180, 240, 300, 360]}
            />
            <YAxis
              stroke={T.textDim}
              style={{ fontFamily: FONT_MONO, fontSize: 10 }}
              tickFormatter={(v) => '$' + (v/1e6).toFixed(0) + 'M'}
            />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => '$' + (v/1e6).toFixed(2) + 'M'} labelFormatter={(label) => `Month ${label} (yr ${(label/12).toFixed(1)})`} />
            <Line type="monotone" dataKey="balance" stroke={T.blue} strokeWidth={2} dot={false} name="Balance" />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      {/* Historical comparison anchor */}
      <Panel title={`Historical comparison · ${arch.name}`} subtitle={`actual & predicted CPR by age, panel-wide (n=${arch.typical.n_total.toLocaleString()})`}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={arch.age_curve} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis dataKey="age_bucket" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(2) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Bar dataKey="actual_cpr" fill={T.accent} name="Actual (panel)" />
            <Bar dataKey="pred_cpr" fill={T.blue} name="Predicted (panel)" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginTop: 8, lineHeight: 1.5 }}>
          <span style={{ color: T.accent }}>HOW TO USE</span> — This shows what your model predicted historically (and what was actually realized) for loans matching this archetype, bucketed by age. Use it as a sanity-check against the forward projection above: a 24-month-old loan in your projection should produce CPR similar to the 13-24 month bar here, all else equal. Differences come from rate-environment shifts, current PLC level, and the loan's specific attributes.
        </div>
      </Panel>

      {/* Annual CPR/CDR vector table */}
      <Panel title="Annual CPR / CDR vectors" subtitle="yearly average rates + balance">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ textAlign: 'left', padding: '6px 12px', fontWeight: 400 }}>Year</th>
                {proj.yearly.slice(0, 15).map(y => (
                  <th key={y.year} style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>{y.year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 12px', color: T.text }}>Avg CPR</td>
                {proj.yearly.slice(0, 15).map(y => (
                  <td key={y.year} style={{ padding: '6px 8px', textAlign: 'right', color: T.purple }}>{pct(y.avg_cpr, 1)}</td>
                ))}
              </tr>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 12px', color: T.text }}>Avg CDR</td>
                {proj.yearly.slice(0, 15).map(y => (
                  <td key={y.year} style={{ padding: '6px 8px', textAlign: 'right', color: T.red }}>{pct(y.avg_cdr, 2)}</td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '6px 12px', color: T.text }}>Bal % orig</td>
                {proj.yearly.slice(0, 15).map(y => (
                  <td key={y.year} style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{pct(y.bal_pct, 1)}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '6px 12px', fontWeight: 400 }}>Year</th>
                  {proj.yearly.slice(15, 30).map(y => (
                    <th key={y.year} style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>{y.year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 12px', color: T.text }}>Avg CPR</td>
                  {proj.yearly.slice(15, 30).map(y => (
                    <td key={y.year} style={{ padding: '6px 8px', textAlign: 'right', color: T.purple }}>{pct(y.avg_cpr, 1)}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 12px', color: T.text }}>Avg CDR</td>
                  {proj.yearly.slice(15, 30).map(y => (
                    <td key={y.year} style={{ padding: '6px 8px', textAlign: 'right', color: T.red }}>{pct(y.avg_cdr, 2)}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '6px 12px', color: T.text }}>Bal % orig</td>
                  {proj.yearly.slice(15, 30).map(y => (
                    <td key={y.year} style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{pct(y.bal_pct, 1)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginTop: 12, lineHeight: 1.5 }}>
          <span style={{ color: T.accent }}>NOTES</span> — Forward projection assumes flat rate path (or shocked, per scenario above). CPR during lockout = 0. Penalty schedule applied as specified. Standard mortgage amortization on a {arch.typical.lp_NC === 1 ? '35' : '30'}-year level-pay schedule. cum_itm and burn_ratio updated month-by-month based on whether each month is ITM. SATO held constant at origination. UPB-related features computed from log(UPB).
        </div>
      </Panel>
    </div>
  );
}

function NumInput({ label, value, setValue, min, max, step }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.text, marginBottom: 2 }}>{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) setValue(Math.max(min, Math.min(max, v)));
        }}
        min={min} max={max} step={step}
        style={{
          width: '100%', background: T.bg, color: T.text,
          border: `1px solid ${T.borderAccent}`,
          fontFamily: FONT_MONO, fontSize: 11, padding: '4px 6px',
        }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Involuntary Buyout Model — separate logistic on credit-event triggers
// ════════════════════════════════════════════════════════════════════
function Involuntary() {
  const D = MODEL_DATA_INV;
  const m = D.metadata;
  const [section, setSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'fit', label: 'Yearly & Monthly Fit' },
    { id: 'cohorts', label: 'Cohorts' },
    { id: 'whatif', label: 'What-if' },
    { id: 'coeffs', label: 'Coefficients' },
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Section sub-nav */}
      <Panel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.12em' }}>INVOLUNTARY MODULE</div>
          <div style={{ flex: 1 }} />
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{
                background: section === s.id ? T.accent : T.bg,
                border: `1px solid ${section === s.id ? T.accent : T.borderAccent}`,
                color: section === s.id ? T.bg : T.text,
                fontFamily: FONT_MONO, fontSize: 10,
                padding: '4px 10px', cursor: 'pointer',
              }}
            >{s.label}</button>
          ))}
        </div>
      </Panel>

      {section === 'overview' && <InvOverview D={D} />}
      {section === 'fit' && <InvFit D={D} />}
      {section === 'cohorts' && <InvCohorts D={D} />}
      {section === 'whatif' && <InvWhatIf D={D} />}
      {section === 'coeffs' && <InvCoefficients D={D} />}
    </div>
  );
}

function InvOverview({ D }) {
  const m = D.metadata;
  const topFeatures = D.coefficients.slice(0, 8);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Panel title="Training pop"><Stat label="Observations" value={m.training_pop_n.toLocaleString()} sub={`${m.period_range[0]} → ${m.period_range[1]}`} /></Panel>
        <Panel title="Events"><Stat label="Involuntary buyouts" value={m.training_events.toLocaleString()} sub={`+${m.reclassified_from_voluntary} reclassified from vol`} /></Panel>
        <Panel title="Base CDR"><Stat label="Annualized" value={pct(m.base_cdr, 3)} sub="below 1% baseline" /></Panel>
        <Panel title="Test AUC"><Stat label="Hold-out" value={m.test_auc.toFixed(4)} sub={`logloss ${m.test_log_loss.toFixed(5)}`} /></Panel>
      </div>
      <Panel title="Top features by |β-scaled|" subtitle="loan-characteristic predictors of eventual buyout">
        <div style={{ fontFamily: FONT_MONO, fontSize: 11 }}>
          {topFeatures.map((f, i) => {
            const w = (Math.abs(f.beta_scaled) / Math.abs(topFeatures[0].beta_scaled)) * 100;
            const positive = f.beta_scaled > 0;
            return (
              <div key={f.feature} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 100px', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: i < topFeatures.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ color: T.textDim }}>{i + 1}</div>
                <div>
                  <div style={{ color: T.text, fontSize: 12 }}>{FEATURE_LABEL[f.feature] || f.feature}</div>
                  <div style={{ background: T.border, height: 3, marginTop: 4, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: 3, width: w + '%', background: positive ? T.green : T.red }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: positive ? T.green : T.red, fontFeatureSettings: '"tnum"' }}>{positive ? '+' : ''}{f.beta_scaled.toFixed(3)}</div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Methodology" subtitle="why this model is structured the way it is">
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.text, lineHeight: 1.6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ color: T.accent, marginBottom: 8 }}>POPULATION & TARGET</div>
            Filtered to <span style={{ color: T.textBright }}>involuntary_eligible == 1</span> (active loans, not in construction). Excluded period 202603 (no future to validate). Target: <span style={{ color: T.textBright }}>prepaid_involuntary</span>. {m.training_pop_n.toLocaleString()} observations, {m.training_events} events, {pct(m.base_cdr, 3)} base CDR. {m.reclassified_from_voluntary} events reclassified from voluntary→involuntary in-script (mdq≥3 with rm=1 or rm=6 — the same fix already in main.py).
          </div>
          <div>
            <div style={{ color: T.accent, marginBottom: 8 }}>FEATURE CHOICE</div>
            Excluded all delinquency features (is_dq_30/60/90, is_seriously_dq, months_dq) so the model captures the loan-characteristic predictors of <span style={{ color: T.textBright }}>eventual</span> buyout, not the trivial conditional "loan is currently distressed." Excluded rate-incentive and penalty features — irrelevant for credit events. 10 features: program type, age, vintage, rate, sato, UPB, macro PLC.
          </div>
        </div>
      </Panel>
    </div>
  );
}

function InvFit({ D }) {
  const monthly = D.monthly.map(m => ({ ...m, period_label: m.period.slice(0, 4) + '-' + m.period.slice(4) }));
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Panel title="Yearly fit" subtitle="actual vs predicted CDR (annualized)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={D.yearly} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis dataKey="year" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(3) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Bar dataKey="actual_cdr" fill={T.accent} name="Actual CDR" />
            <Bar dataKey="pred_cdr" fill={T.blue} name="Predicted CDR" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
      <Panel title="Monthly CDR" subtitle="actual & predicted, involuntary buyouts only">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthly} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis dataKey="period_label" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 9 }} interval={11} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(3) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Line type="monotone" dataKey="actual_cdr" stroke={T.accent} strokeWidth={1.5} dot={false} name="Actual" />
            <Line type="monotone" dataKey="pred_cdr" stroke={T.blue} strokeWidth={1.5} dot={false} name="Predicted" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginTop: 8 }}>
          Actual line is noisy at this scale because monthly events are sparse (1-3 per month average). Predicted line shows the model's smoothed signal.
        </div>
      </Panel>
      <Panel title="Calibration deciles">
        <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>Decile</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>n</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Events</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Pred CDR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Actual CDR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {D.calibration.map((c, i) => {
              const delta = c.actual_cdr - c.pred_cdr;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px', color: T.textBright }}>{c.decile + 1}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{c.n.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.text }}>{c.events}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{c.pred_cdr.toFixed(3)}%</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent }}>{c.actual_cdr.toFixed(3)}%</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(delta) < 0.05 ? T.text : delta > 0 ? T.green : T.red }}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginTop: 8 }}>
          Top decile (decile 10) holds most of the events. With only ~190 events total, expect noisy decile actuals — even small absolute deltas can be large in relative terms.
        </div>
      </Panel>
    </div>
  );
}

function InvCohortBars({ data, dataKey, title }) {
  const sorted = [...data].sort((a, b) => b.actual_cdr - a.actual_cdr);
  const max = Math.max(...sorted.flatMap(d => [d.actual_cdr, d.pred_cdr]));
  return (
    <Panel title={title}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11 }}>
        {sorted.map((d, i) => {
          const aw = (d.actual_cdr / max) * 100;
          const pw = (d.pred_cdr / max) * 100;
          return (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ color: T.text, fontSize: 12 }}>{d[dataKey]}</div>
                <div style={{ color: T.textDim, fontSize: 10 }}>n={d.n.toLocaleString()} · {d.events} events</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                <div style={{ color: T.textDim, fontSize: 9 }}>actual</div>
                <div style={{ background: T.border, height: 8, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: 8, width: aw + '%', background: T.accent }} />
                </div>
                <div style={{ textAlign: 'right', color: T.accent }}>{d.actual_cdr.toFixed(3)}%</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px', gap: 8, alignItems: 'center' }}>
                <div style={{ color: T.textDim, fontSize: 9 }}>predicted</div>
                <div style={{ background: T.border, height: 8, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: 8, width: pw + '%', background: T.blue }} />
                </div>
                <div style={{ textAlign: 'right', color: T.blue }}>{d.pred_cdr.toFixed(3)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function InvCohorts({ D }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <InvCohortBars data={D.fha_cuts} dataKey="fha_category" title="By FHA category" />
      <InvCohortBars data={D.lp_cuts} dataKey="loan_purpose" title="By loan purpose" />
      <InvCohortBars data={D.age_cuts} dataKey="age_bucket" title="By loan age" />
      <Panel title="Vintage year fit" style={{ gridColumn: 'span 1' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={D.vintage_cuts} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} vertical={false} />
            <XAxis dataKey="vintage_year" stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} />
            <YAxis stroke={T.textDim} style={{ fontFamily: FONT_MONO, fontSize: 10 }} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => v.toFixed(3) + '%'} />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 11 }} />
            <Bar dataKey="actual_cdr" fill={T.accent} name="Actual" />
            <Bar dataKey="pred_cdr" fill={T.blue} name="Predicted" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function InvWhatIf({ D }) {
  const initial = useMemo(() => {
    const init = {};
    D.coefficients.forEach(c => { init[c.feature] = c.mean; });
    return init;
  }, [D]);
  const [vals, setVals] = useState(initial);
  const predicted = useMemo(() => {
    let z = D.metadata.intercept_scaled;
    D.coefficients.forEach(c => {
      const xs = (vals[c.feature] - c.mean) / c.std;
      z += c.beta_scaled * xs;
    });
    const smm = sigmoid(z);
    const cdr = smm2cpr(smm);  // same formula: 1-(1-smm)^12
    return { z, smm, cdr };
  }, [vals, D]);
  const contributions = useMemo(() => {
    const items = D.coefficients.map(c => {
      const xs = (vals[c.feature] - c.mean) / c.std;
      return { feature: c.feature, contribution: c.beta_scaled * xs, xs, beta: c.beta_scaled };
    });
    items.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    return items;
  }, [vals, D]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <Panel title="Inputs" subtitle="adjust loan attributes to predict CDR" style={{ gridColumn: 'span 2' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {D.metadata.feature_list.map(f => {
            const stats = D.feature_stats[f];
            const isBinary = ['is_hc_232', 'is_223a7', 'is_538', 'lp_NC'].includes(f);
            const min = isBinary ? 0 : stats.p5;
            const max = isBinary ? 1 : stats.p95;
            const step = isBinary ? 1 : (max - min) / 100;
            return (
              <div key={f}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: FONT_MONO, fontSize: 10, marginBottom: 4 }}>
                  <span style={{ color: T.text }}>{FEATURE_LABEL[f] || f}</span>
                  <span style={{ color: T.accent, fontFeatureSettings: '"tnum"' }}>{isBinary ? (vals[f] >= 0.5 ? '1' : '0') : (typeof vals[f] === 'number' ? vals[f].toFixed(1) : '—')}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={vals[f] ?? stats.mean} onChange={(e) => setVals({ ...vals, [f]: parseFloat(e.target.value) })} style={{ width: '100%', accentColor: T.accent }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 8, color: T.textDim }}>
                  <span>{isBinary ? 0 : stats.p5.toFixed(0)}</span>
                  <span>μ={stats.mean.toFixed(1)}</span>
                  <span>{isBinary ? 1 : stats.p95.toFixed(0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Prediction">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Stat label="logit z" value={predicted.z.toFixed(3)} sub="standardized scale" />
          <Stat label="SMM" value={pct(predicted.smm * 100, 5)} sub="monthly probability" />
          <Stat label="CDR" value={pct(predicted.cdr, 3)} sub="annualized" />
        </div>
      </Panel>
      <Panel title="Logit attribution">
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, maxHeight: 280, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px', color: T.textDim, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
            <span>Feature</span><span style={{ textAlign: 'right' }}>x (std)</span><span style={{ textAlign: 'right' }}>β·xs</span>
          </div>
          {contributions.map(c => {
            const positive = c.contribution > 0;
            const w = (Math.abs(c.contribution) / Math.max(...contributions.map(c => Math.abs(c.contribution)))) * 100;
            return (
              <div key={c.feature} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px', padding: '4px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
                <div>
                  <div style={{ color: T.text, fontSize: 10 }}>{FEATURE_LABEL[c.feature] || c.feature}</div>
                  <div style={{ background: T.border, height: 2, marginTop: 2, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: 2, width: w + '%', background: positive ? T.green : T.red }} />
                  </div>
                </div>
                <span style={{ textAlign: 'right', color: T.textDim }}>{c.xs.toFixed(2)}</span>
                <span style={{ textAlign: 'right', color: positive ? T.green : T.red, fontWeight: 500 }}>{positive ? '+' : ''}{c.contribution.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function InvCoefficients({ D }) {
  const sorted = [...D.coefficients].sort((a, b) => b.importance - a.importance);
  return (
    <Panel title="Logistic coefficients" subtitle="L2-regularized (C=0.5), prior-corrected. 10 features, no delinquency features.">
      <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
            <th style={{ textAlign: 'left', padding: '8px', fontWeight: 400 }}>Feature</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>β-scaled</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>β-native</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>μ</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>σ</th>
            <th style={{ textAlign: 'right', padding: '8px', fontWeight: 400 }}>Importance</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const positive = c.beta_scaled > 0;
            return (
              <tr key={c.feature} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px' }}>
                  <div style={{ color: T.text }}>{c.feature}</div>
                  <div style={{ color: T.textDim, fontSize: 9 }}>{FEATURE_LABEL[c.feature] || ''}</div>
                </td>
                <td style={{ padding: '8px', textAlign: 'right', color: positive ? T.green : T.red, fontWeight: 500 }}>{positive ? '+' : ''}{c.beta_scaled.toFixed(4)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: T.textDim, fontSize: 10 }}>{c.beta_native.toExponential(2)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: T.textDim }}>{c.mean.toFixed(2)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: T.textDim }}>{c.std.toFixed(2)}</td>
                <td style={{ padding: '8px', textAlign: 'right', color: T.text }}>{c.importance.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginTop: 16, lineHeight: 1.6 }}>
        <div style={{ color: T.accent, marginBottom: 6 }}>READING THE COEFFICIENTS</div>
        Same prediction formula as the voluntary model:<br /><br />
        <span style={{ color: T.text, background: T.border, padding: '4px 8px' }}>z = intercept_scaled + Σ β_scaled · (x - μ) / σ;  SMM = sigmoid(z);  CDR = 1 - (1 - SMM)^12</span><br /><br />
        intercept_scaled = {D.metadata.intercept_scaled.toFixed(4)} · intercept_native = {D.metadata.intercept_native.toFixed(4)}
      </div>
    </Panel>
  );
}

// ════════════════════════════════════════════════════════════════════
// Servicer S-curves — compare actual & predicted by servicer × RI bucket
// ════════════════════════════════════════════════════════════════════
function ServicerSCurves() {
  const issuerKeys = MODEL_DATA.metadata.top_issuers || [];
  const allKeys = [...issuerKeys, 'other'];
  const issuerData = MODEL_DATA.issuer_scurves || {};
  const nameMap = MODEL_DATA.metadata.issuer_name_map || {};

  // Selection state — start with ORIX, Lument, and Other (the high/low/baseline triplet)
  const [selected, setSelected] = useState(() => new Set(['orix', 'lument', 'other']));
  const [view, setView] = useState('actual'); // 'actual' | 'predicted' | 'side_by_side'

  function toggle(key) {
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(key)) s.delete(key);
      else s.add(key);
      return s;
    });
  }
  function selectAll() { setSelected(new Set(allKeys)); }
  function selectNone() { setSelected(new Set()); }
  function selectHighLow() { setSelected(new Set(['orix', 'lument', 'other'])); }
  function selectTop5() {
    // Top 5 by panel volume
    setSelected(new Set(['orix', 'berkadia', 'lument', 'walker_dunlop', 'merchants']));
  }

  // Distinct colors for up to 11 servicers
  const COLORS = [
    '#ff8c00', // ORIX — accent (panel-mean visualizer)
    '#4d9fff', // Berkadia — blue
    '#b366ff', // Lument — purple
    '#00d96b', // Walker & Dunlop — green
    '#ff4d6d', // Merchants — red
    '#ffd700', // Greystone — gold
    '#ff66c4', // PNC — pink
    '#00bfff', // Wells Fargo — cyan
    '#90ee90', // Capital Funding — light green
    '#ff7f50', // Dwight — coral
    '#888888', // Other — gray
  ];
  const colorByKey = {};
  allKeys.forEach((k, i) => { colorByKey[k] = COLORS[i % COLORS.length]; });

  // Build chart data: x-axis = ri_mid, one series per selected servicer
  // Use union of RI buckets across all servicers (they're aligned)
  const allBuckets = new Set();
  for (const k of allKeys) {
    if (!issuerData[k]) continue;
    for (const row of issuerData[k].scurve) allBuckets.add(row.ri_bucket);
  }
  const sortedBuckets = [...allBuckets].sort((a, b) => a - b);
  const chartData = sortedBuckets.map(b => {
    const point = { ri_bucket: b };
    // Find a sample ri_mid from the first issuer that has this bucket
    for (const k of allKeys) {
      const row = issuerData[k]?.scurve.find(r => r.ri_bucket === b);
      if (row) { point.ri_mid = row.ri_mid; break; }
    }
    for (const k of allKeys) {
      const row = issuerData[k]?.scurve.find(r => r.ri_bucket === b);
      if (row) {
        point[`${k}_actual`] = row.actual_cpr;
        point[`${k}_pred`] = row.pred_cpr;
      }
    }
    return point;
  });

  // Stats summary table — for each selected servicer, show overall CPR actual & predicted
  const summary = [...selected].map(k => issuerData[k]).filter(Boolean)
    .sort((a, b) => b.overall_actual_cpr - a.overall_actual_cpr);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Top action bar */}
      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em' }}>SERVICER COMPARISON</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, marginRight: 8 }}>QUICK SELECT:</div>
          <button onClick={selectHighLow} style={btnStyle()}>Hi/Lo/Other</button>
          <button onClick={selectTop5} style={btnStyle()}>Top 5</button>
          <button onClick={selectAll} style={btnStyle()}>All</button>
          <button onClick={selectNone} style={btnStyle()}>None</button>
        </div>
      </Panel>

      {/* Servicer toggle grid */}
      <Panel title="Select servicers" subtitle="click to toggle inclusion in chart and table">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {allKeys.map(k => {
            const data = issuerData[k];
            if (!data) return null;
            const isSel = selected.has(k);
            return (
              <button
                key={k}
                onClick={() => toggle(k)}
                style={{
                  background: isSel ? T.bg : 'transparent',
                  border: `2px solid ${isSel ? colorByKey[k] : T.border}`,
                  color: T.text,
                  fontFamily: FONT_MONO, fontSize: 10,
                  padding: '8px 10px', cursor: 'pointer',
                  textAlign: 'left',
                  display: 'grid',
                  gridTemplateColumns: '12px 1fr',
                  gap: 6,
                  alignItems: 'center',
                  opacity: isSel ? 1 : 0.5,
                }}
              >
                <div style={{ width: 12, height: 12, background: colorByKey[k], borderRadius: 2 }} />
                <div>
                  <div style={{ fontWeight: isSel ? 600 : 400, color: isSel ? T.textBright : T.text }}>{nameMap[k] || k}</div>
                  <div style={{ color: T.textDim, fontSize: 9 }}>n={data.n_total.toLocaleString()} · CPR {data.overall_actual_cpr.toFixed(2)}%</div>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* View toggle */}
      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim }}>VIEW:</div>
          {[
            { id: 'actual', label: 'Actual CPR only' },
            { id: 'predicted', label: 'Predicted CPR only' },
            { id: 'side_by_side', label: 'Actual + predicted (overlaid)' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              background: view === v.id ? T.accent : T.bg,
              border: `1px solid ${view === v.id ? T.accent : T.borderAccent}`,
              color: view === v.id ? T.bg : T.text,
              fontFamily: FONT_MONO, fontSize: 10,
              padding: '4px 10px', cursor: 'pointer',
            }}>{v.label}</button>
          ))}
        </div>
      </Panel>

      {/* Main chart */}
      <Panel title={view === 'actual' ? 'Actual S-curves by servicer' : view === 'predicted' ? 'Predicted S-curves by servicer' : 'Actual (solid) vs predicted (dashed) by servicer'} subtitle="actual & predicted CPR by net refi incentive bucket">
        <ResponsiveContainer width="100%" height={460}>
          <ComposedChart data={chartData} margin={{ top: 16, right: 32, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={T.grid} />
            <XAxis
              type="number"
              dataKey="ri_mid"
              stroke={T.textDim}
              style={{ fontFamily: FONT_MONO, fontSize: 10 }}
              label={{ value: 'Net refi incentive (bp)', position: 'insideBottom', offset: -4, style: { fill: T.textDim, fontSize: 10, fontFamily: FONT_MONO } }}
              domain={['dataMin - 20', 'dataMax + 20']}
            />
            <YAxis
              stroke={T.textDim}
              style={{ fontFamily: FONT_MONO, fontSize: 10 }}
              unit="%"
              label={{ value: 'CPR (%)', angle: -90, position: 'insideLeft', style: { fill: T.textDim, fontSize: 10, fontFamily: FONT_MONO } }}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(v, name) => [v != null ? v.toFixed(2) + '%' : '—', name]}
              labelFormatter={(label) => `RI ≈ ${Math.round(label)} bp`}
            />
            <Legend wrapperStyle={{ fontFamily: FONT_MONO, fontSize: 10 }} />
            <ReferenceLine x={0} stroke={T.textDim} strokeDasharray="2 4" />
            {[...selected].map(k => {
              const color = colorByKey[k];
              const label = nameMap[k] || k;
              const lines = [];
              if (view === 'actual' || view === 'side_by_side') {
                lines.push(
                  <Line key={`${k}_actual`} type="monotone" dataKey={`${k}_actual`} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} name={view === 'side_by_side' ? `${label} actual` : label} connectNulls />
                );
              }
              if (view === 'predicted' || view === 'side_by_side') {
                lines.push(
                  <Line key={`${k}_pred`} type="monotone" dataKey={`${k}_pred`} stroke={color} strokeWidth={1.5} strokeDasharray="4 4" dot={{ fill: color, r: 2 }} name={view === 'side_by_side' ? `${label} pred` : label} connectNulls />
                );
              }
              return lines;
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </Panel>

      {/* Summary table */}
      <Panel title="Servicer summary" subtitle="overall CPR + per-bucket detail for selected servicers">
        {summary.length === 0 && (
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.textDim, padding: 16, textAlign: 'center' }}>No servicers selected.</div>
        )}
        {summary.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontFamily: FONT_MONO, fontSize: 11, borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 400 }}>Servicer</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>n</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Events</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Overall actual CPR</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Overall pred CPR</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 400 }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(s => {
                  const delta = s.overall_actual_cpr - s.overall_pred_cpr;
                  return (
                    <tr key={s.key} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, background: colorByKey[s.key], marginRight: 6, borderRadius: 2 }} />
                        <span style={{ color: T.text }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{s.n_total.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{s.events_total.toLocaleString()}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: T.accent }}>{s.overall_actual_cpr.toFixed(2)}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: T.blue }}>{s.overall_pred_cpr.toFixed(2)}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: Math.abs(delta) < 0.5 ? T.text : delta > 0 ? T.green : T.red }}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Per-bucket detail for top selection */}
        {summary.length > 0 && summary.length <= 5 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>PER-BUCKET DETAIL (ACTUAL CPR)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ fontFamily: FONT_MONO, fontSize: 10, borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ color: T.textDim, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 400 }}>RI bucket</th>
                    {summary.map(s => (
                      <th key={s.key} style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 400 }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, background: colorByKey[s.key], marginRight: 4, borderRadius: 2 }} />
                        {nameMap[s.key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map(point => (
                    <tr key={point.ri_bucket} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '4px 8px', color: T.text }}>{point.ri_mid >= 0 ? '+' : ''}{Math.round(point.ri_mid)} bp</td>
                      {summary.map(s => {
                        const v = point[`${s.key}_actual`];
                        return (
                          <td key={s.key} style={{ padding: '4px 8px', textAlign: 'right', color: v == null ? T.textDim : T.text }}>
                            {v == null ? '—' : v.toFixed(2) + '%'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>

      {/* Notes */}
      <Panel>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.textDim, lineHeight: 1.6 }}>
          <span style={{ color: T.accent }}>HOW TO READ THIS</span> — Each line is a servicer's empirical S-curve: actual CPR by RI bucket (left = OTM / no incentive, right = ITM / strong incentive). Use the toggles to compare. The Hi/Lo/Other preset shows ORIX (top), Lument (bottom), and Other (panel mean) so you can see the full spread.<br /><br />
          The dashed-line view (predicted) shows what the model expects given the loan attributes within each bucket. Where actual diverges meaningfully from predicted — for example, ORIX's right-tail running well above its predicted curve — that's residual servicer-specific behavior the model doesn't fully capture.<br /><br />
          <span style={{ color: T.accent }}>WHAT TO LOOK FOR</span> — (1) ORIX's curve sits noticeably above panel mean across all RI buckets, indicating consistent active-refi behavior beyond what FHA mix would predict. (2) Lument's curve is systematically depressed everywhere — the steepest puzzle in the panel. (3) Wells Fargo and Walker & Dunlop run elevated specifically at high-RI buckets, suggesting strong refi outreach when sponsors are deeply in-the-money. (4) Capital Funding (concentrated in 232 healthcare) sits below panel mean reflecting sector mix.
        </div>
      </Panel>
    </div>
  );
}

function btnStyle() {
  return {
    background: T.bg,
    border: `1px solid ${T.borderAccent}`,
    color: T.text,
    fontFamily: FONT_MONO, fontSize: 10,
    padding: '4px 10px', cursor: 'pointer',
  };
}
