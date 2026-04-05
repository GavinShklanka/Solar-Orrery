# Vela Claim Registry

## What Vela MAY claim
- Satellite positions are propagated from TLE data updated approximately 3 times daily 
  from the 18th Space Defense Squadron via CelesTrak
- The Kp forecast is produced by a LightGBM model trained on NASA OMNI hourly solar 
  wind data from 1996 to 2025, validated on Solar Cycle 25 (2020–present)
- Validated test RMSE: 0.77 at 3-hour horizon on Solar Cycle 25 test set
- Validated storm detection F1: 0.55 for Kp ≥ 5 events
- The model improves on naive persistence baseline by 20.7% (skill score 0.206)
- NEO close approach data and impact probabilities are sourced directly from 
  NASA JPL Sentry-II and CNEOS — Vela does not independently compute orbital uncertainty
- Launch history and geopolitical data are sourced from GCAT (Jonathan McDowell), 
  UCS Satellite Database (7,560 active satellites, 99.9% join rate), and Launch Library 2
- Commercial payload dominance: 80.4% of active satellites are commercial operators

## What Vela MAY NOT claim
- That satellite positions are exact real-time GPS coordinates — they are SGP4 
  propagations from TLEs with inherent positional uncertainty
- That the Kp forecast meets or exceeds the published neural network benchmark 
  of RMSE 0.64 — the LightGBM baseline does not
- That Vela independently computes asteroid impact probability
- That conjunction risk data constitutes operational collision avoidance intelligence
- That the Kp forecast is an operational space weather warning system

## Validation evidence
- Training data: NASA OMNI2 hourly, 1996–2025, 262,992 records
- Train period: 1996-01-28 to 2019-12-31 (Solar Cycles 23 and 24)
- Test period: 2020-01-01 to 2025-12-31 (Solar Cycle 25)
- Storms in test set: 1,195 hours with Kp ≥ 5
- Model artifact: modeling/model_registry/kp_baseline_lgbm.pkl
- Full validation report: validation/kp_validation_report.html
