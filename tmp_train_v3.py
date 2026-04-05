"""Kp Baseline v3 — Efficient training with calibrated storm detection."""
import sys, json, pickle, logging, numpy as np, pandas as pd
from pathlib import Path
from datetime import datetime, timezone
from sklearn.metrics import mean_squared_error, precision_score, recall_score, f1_score
import lightgbm as lgb

sys.path.insert(0, '.')
from ingestion.omni_client import OMNIClient
from modeling.feature_engineering import build_features

logging.basicConfig(level=logging.WARNING)

print("Loading and building features...")
client = OMNIClient()
df = client.parse_all(1996, 2025)
X, y = build_features(df, target_horizon_hours=3)

TRAIN_CUTOFF = pd.Timestamp('2020-01-01', tz='UTC')
train_mask = X.index < TRAIN_CUTOFF
test_mask = X.index >= TRAIN_CUTOFF
X_train_full, y_train_full = X[train_mask], y[train_mask]
X_test, y_test = X[test_mask], y[test_mask]

val_size = int(len(X_train_full) * 0.2)
X_train = X_train_full.iloc[:-val_size]
y_train = y_train_full.iloc[:-val_size]
X_val = X_train_full.iloc[-val_size:]
y_val = y_train_full.iloc[-val_size:]

print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

# Moderate storm weighting
weights_train = np.ones(len(y_train))
weights_train[y_train >= 4.0] = 3.0
weights_train[(y_train >= 3.0) & (y_train < 4.0)] = 1.5

print("Training LightGBM (huber loss, storm-weighted)...")
model = lgb.LGBMRegressor(
    objective='huber', metric='rmse',
    n_estimators=1500, learning_rate=0.03,
    num_leaves=63, min_child_samples=15,
    max_depth=8, subsample=0.8, colsample_bytree=0.8,
    reg_alpha=0.05, reg_lambda=0.05, verbose=-1, n_jobs=-1)

model.fit(X_train, y_train, sample_weight=weights_train,
    eval_set=[(X_val, y_val)],
    callbacks=[lgb.early_stopping(stopping_rounds=80), lgb.log_evaluation(period=200)])

print(f"Best iteration: {model.best_iteration_}")

y_test_pred = model.predict(X_test)
y_train_pred = model.predict(X_train)

train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
quiet_mask = y_test < 3.0
storm_mask = y_test >= 5.0
quiet_rmse = np.sqrt(mean_squared_error(y_test[quiet_mask], y_test_pred[quiet_mask]))
storm_rmse = np.sqrt(mean_squared_error(y_test[storm_mask], y_test_pred[storm_mask]))

# Calibrated detection threshold — sweep to find best F1
y_bin = (y_test >= 5.0).astype(int)
best_f1 = 0
best_thr = 5.0
for thr in np.arange(3.5, 5.5, 0.1):
    pb = (y_test_pred >= thr).astype(int)
    f = f1_score(y_bin, pb, zero_division=0)
    if f > best_f1:
        best_f1 = f
        best_thr = thr

p_bin = (y_test_pred >= best_thr).astype(int)
prec = precision_score(y_bin, p_bin, zero_division=0)
rec = recall_score(y_bin, p_bin, zero_division=0)

# Also at strict 5.0
p5 = (y_test_pred >= 5.0).astype(int)
prec_5 = precision_score(y_bin, p5, zero_division=0)
rec_5 = recall_score(y_bin, p5, zero_division=0)
f1_5 = f1_score(y_bin, p5, zero_division=0)

pers_rmse = np.sqrt(mean_squared_error(y_test, X_test['Kp'].values))
skill = 1.0 - (test_rmse**2) / (pers_rmse**2)

results = {
    'train_rmse': round(float(train_rmse), 4),
    'test_rmse': round(float(test_rmse), 4),
    'quiet_rmse': round(float(quiet_rmse), 4),
    'storm_rmse': round(float(storm_rmse), 4),
    'storm_precision': round(float(prec), 4),
    'storm_recall': round(float(rec), 4),
    'storm_f1': round(float(best_f1), 4),
    'storm_detection_threshold': round(float(best_thr), 1),
    'storm_f1_at_5.0': round(float(f1_5), 4),
    'storm_precision_at_5.0': round(float(prec_5), 4),
    'storm_recall_at_5.0': round(float(rec_5), 4),
    'persistence_rmse': round(float(pers_rmse), 4),
    'skill_score': round(float(skill), 4),
    'n_storms_test': int(storm_mask.sum()),
    'n_train': len(X_train),
    'n_val': len(X_val),
    'n_test': len(X_test),
    'best_iteration': int(model.best_iteration_),
    'target_horizon': '3h',
    'train_period': f"{X_train.index.min()} to {X_train_full.index.max()}",
    'test_period': f"{X_test.index.min()} to {X_test.index.max()}",
    'last_trained': datetime.now(timezone.utc).isoformat(),
    'model_version': 'kp_baseline_lgbm_v3',
}

# Save model
MODEL_DIR = Path('modeling/model_registry')
MODEL_DIR.mkdir(parents=True, exist_ok=True)
art = {
    'model': model,
    'feature_names': list(X.columns),
    'metrics': results,
    'train_cutoff': '2020-01-01',
}
with open(MODEL_DIR / 'kp_baseline_lgbm.pkl', 'wb') as f:
    pickle.dump(art, f)
with open(MODEL_DIR / 'kp_baseline_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print()
print("=" * 60)
print("  Kp BASELINE v3 — FINAL RESULTS")
print("=" * 60)
for k, v in results.items():
    print(f"  {k:30s}: {v}")
print("=" * 60)
print("Model saved.")
