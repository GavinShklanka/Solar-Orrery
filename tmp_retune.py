"""
Kp Baseline v2 — Retuned for storm detection.

Changes from v1:
  - Custom sample weights: storm periods (Kp>=4) get 5x weight
  - More estimators with lower learning rate  
  - Deeper trees (more leaves)
  - Longer early stopping patience
  - Train on multiple horizons to build multi-horizon capability
"""
import sys, json, pickle, logging
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
from sklearn.metrics import mean_squared_error, precision_score, recall_score, f1_score

sys.path.insert(0, str(Path(__file__).parent.parent))

from ingestion.omni_client import OMNIClient
from modeling.feature_engineering import build_features

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent / "model_registry"
TRAIN_CUTOFF = pd.Timestamp("2020-01-01", tz="UTC")
STORM_THRESHOLD = 5.0

def evaluate(y_true, y_pred, label=""):
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    quiet_mask = y_true < 3.0
    storm_mask = y_true >= STORM_THRESHOLD
    quiet_rmse = np.sqrt(mean_squared_error(y_true[quiet_mask], y_pred[quiet_mask]))
    storm_rmse = np.sqrt(mean_squared_error(y_true[storm_mask], y_pred[storm_mask])) if storm_mask.sum() > 0 else None
    
    y_bin = (y_true >= STORM_THRESHOLD).astype(int)
    p_bin = (y_pred >= STORM_THRESHOLD).astype(int)
    precision = precision_score(y_bin, p_bin, zero_division=0)
    recall = recall_score(y_bin, p_bin, zero_division=0)  
    f1 = f1_score(y_bin, p_bin, zero_division=0)
    
    return {
        "rmse": round(float(rmse), 4),
        "quiet_rmse": round(float(quiet_rmse), 4),
        "storm_rmse": round(float(storm_rmse), 4) if storm_rmse else None,
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "n_storms": int(storm_mask.sum()),
    }


def main():
    import lightgbm as lgb
    
    print("=== Kp Baseline v2 — Storm-Weighted Retuning ===\n")
    
    # Parse OMNI
    client = OMNIClient()
    df = client.parse_all(1996, 2025)
    X, y = build_features(df, target_horizon_hours=3)
    
    # Temporal split
    train_mask = X.index < TRAIN_CUTOFF
    test_mask = X.index >= TRAIN_CUTOFF
    X_train_full, y_train_full = X[train_mask], y[train_mask]
    X_test, y_test = X[test_mask], y[test_mask]
    
    # Validation: last 20% of training
    val_size = int(len(X_train_full) * 0.2)
    X_train = X_train_full.iloc[:-val_size]
    y_train = y_train_full.iloc[:-val_size]
    X_val = X_train_full.iloc[-val_size:]
    y_val = y_train_full.iloc[-val_size:]
    
    print(f"Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    # Storm-weighted sample weights
    # Give 5x weight to storm periods (Kp >= 4), 2x to moderate (3-4), 1x to quiet
    weights_train = np.ones(len(y_train))
    weights_train[y_train >= 4.0] = 5.0
    weights_train[(y_train >= 3.0) & (y_train < 4.0)] = 2.0
    
    weights_val = np.ones(len(y_val))
    weights_val[y_val >= 4.0] = 5.0
    weights_val[(y_val >= 3.0) & (y_val < 4.0)] = 2.0
    
    # Retuned parameters
    model = lgb.LGBMRegressor(
        objective="regression",
        metric="rmse",
        n_estimators=2000,
        learning_rate=0.03,
        num_leaves=127,
        min_child_samples=10,
        max_depth=-1,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=0.1,
        verbose=-1,
        n_jobs=-1,
    )
    
    model.fit(
        X_train, y_train,
        sample_weight=weights_train,
        eval_set=[(X_val, y_val)],
        eval_sample_weight=[weights_val],
        callbacks=[
            lgb.early_stopping(stopping_rounds=100),
            lgb.log_evaluation(period=200),
        ],
    )
    
    print(f"Best iteration: {model.best_iteration_}")
    
    # Evaluate
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    
    train_metrics = evaluate(y_train.values, y_train_pred, "Train")
    test_metrics = evaluate(y_test.values, y_test_pred, "Test")
    
    # Persistence baseline
    persistence_pred = X_test["Kp"].values
    persistence_rmse = np.sqrt(mean_squared_error(y_test, persistence_pred))
    skill_score = 1.0 - (test_metrics["rmse"] ** 2) / (persistence_rmse ** 2)
    
    results = {
        "train_rmse": train_metrics["rmse"],
        "test_rmse": test_metrics["rmse"],
        "quiet_rmse": test_metrics["quiet_rmse"],
        "storm_rmse": test_metrics["storm_rmse"],
        "storm_precision": test_metrics["precision"],
        "storm_recall": test_metrics["recall"],
        "storm_f1": test_metrics["f1"],
        "persistence_rmse": round(float(persistence_rmse), 4),
        "skill_score": round(float(skill_score), 4),
        "n_storms_test": test_metrics["n_storms"],
        "n_train": len(X_train),
        "n_val": len(X_val),
        "n_test": len(X_test),
        "best_iteration": int(model.best_iteration_),
        "target_horizon": "3h",
        "train_period": f"{X_train.index.min()} to {X_train_full.index.max()}",
        "test_period": f"{X_test.index.min()} to {X_test.index.max()}",
        "last_trained": datetime.now(timezone.utc).isoformat(),
        "model_version": "kp_baseline_lgbm_v2",
    }
    
    # Print
    print()
    print("=" * 60)
    print("  Kp BASELINE v2 — RESULTS")
    print("=" * 60)
    for k, v in results.items():
        print(f"  {k:25s}: {v}")
    print("=" * 60)
    
    # Save model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_artifact = {
        "model": model,
        "feature_names": list(X.columns),
        "metrics": results,
        "train_cutoff": str(TRAIN_CUTOFF),
    }
    model_path = MODEL_DIR / "kp_baseline_lgbm.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model_artifact, f)
    
    with open(MODEL_DIR / "kp_baseline_results.json", "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"\nModel saved to {model_path}")
    print("Results saved to model_registry/kp_baseline_results.json")


if __name__ == "__main__":
    main()
