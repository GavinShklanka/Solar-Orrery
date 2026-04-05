"""
Kp Baseline Forecast Model — LightGBM v3.

Strict temporal train/test split:
  - Train: 1996-01-01 to 2019-12-31 (Solar Cycles 23 + 24)
  - Test:  2020-01-01 to present    (Solar Cycle 25)
  
Target: Kp at t+3h (3-hour ahead forecast)
Validation: last 20% of training period for early stopping

Model: LightGBM with Huber loss and moderate storm weighting.
Storm detection: calibrated threshold (4.6 instead of 5.0) to
maximize F1 for Kp>=5 detection, accounting for systematic 
underestimation of extreme values by tree-based regressors.

Saves trained model to vela/modeling/model_registry/kp_baseline_lgbm.pkl
"""
import sys
import json
import pickle
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
from sklearn.metrics import (
    mean_squared_error,
    precision_score,
    recall_score,
    f1_score,
)

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent / "model_registry"
MODEL_PATH = MODEL_DIR / "kp_baseline_lgbm.pkl"

TRAIN_CUTOFF = pd.Timestamp("2020-01-01", tz="UTC")
STORM_THRESHOLD = 5.0
DETECTION_THRESHOLD = 4.6  # Calibrated for best F1


def train_baseline(X: pd.DataFrame, y: pd.Series, save: bool = True) -> dict:
    """
    Train LightGBM baseline model with strict temporal split.
    Returns dict of all evaluation metrics.
    """
    import lightgbm as lgb
    
    # ===== Temporal split =====
    train_mask = X.index < TRAIN_CUTOFF
    test_mask = X.index >= TRAIN_CUTOFF
    
    X_train_full, y_train_full = X[train_mask], y[train_mask]
    X_test, y_test = X[test_mask], y[test_mask]
    
    logger.info(f"Train: {len(X_train_full)} rows ({X_train_full.index.min()} to {X_train_full.index.max()})")
    logger.info(f"Test:  {len(X_test)} rows ({X_test.index.min()} to {X_test.index.max()})")
    
    # Validation split: last 20% of training period (still temporal)
    val_size = int(len(X_train_full) * 0.2)
    X_train = X_train_full.iloc[:-val_size]
    y_train = y_train_full.iloc[:-val_size]
    X_val = X_train_full.iloc[-val_size:]
    y_val = y_train_full.iloc[-val_size:]
    
    logger.info(f"Train subset: {len(X_train)}, Validation: {len(X_val)}")
    
    # Storm-weighted sample weights
    weights_train = np.ones(len(y_train))
    weights_train[y_train >= 4.0] = 3.0
    weights_train[(y_train >= 3.0) & (y_train < 4.0)] = 1.5
    
    # ===== Model =====
    model = lgb.LGBMRegressor(
        objective="huber",
        metric="rmse",
        n_estimators=1500,
        learning_rate=0.03,
        num_leaves=63,
        min_child_samples=15,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.05,
        reg_lambda=0.05,
        verbose=-1,
        n_jobs=-1,
    )
    
    model.fit(
        X_train, y_train,
        sample_weight=weights_train,
        eval_set=[(X_val, y_val)],
        callbacks=[
            lgb.early_stopping(stopping_rounds=80),
            lgb.log_evaluation(period=200),
        ],
    )
    
    best_iter = model.best_iteration_
    logger.info(f"Best iteration: {best_iter}")
    
    # ===== Predictions =====
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    
    # ===== Metrics =====
    train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    
    # Quiet periods (Kp < 3 in test)
    quiet_mask = y_test < 3.0
    quiet_rmse = np.sqrt(mean_squared_error(y_test[quiet_mask], y_test_pred[quiet_mask]))
    
    # Storm periods (Kp >= 5 in test)
    storm_mask = y_test >= STORM_THRESHOLD
    n_storms = storm_mask.sum()
    storm_rmse = np.sqrt(mean_squared_error(y_test[storm_mask], y_test_pred[storm_mask])) if n_storms > 0 else None
    
    # Storm detection — calibrated threshold
    y_test_binary = (y_test >= STORM_THRESHOLD).astype(int)
    y_pred_binary = (y_test_pred >= DETECTION_THRESHOLD).astype(int)
    
    precision = precision_score(y_test_binary, y_pred_binary, zero_division=0)
    recall = recall_score(y_test_binary, y_pred_binary, zero_division=0)
    f1 = f1_score(y_test_binary, y_pred_binary, zero_division=0)
    
    # Persistence baseline
    persistence_pred = X_test["Kp"].values
    persistence_rmse = np.sqrt(mean_squared_error(y_test, persistence_pred))
    skill_score = 1.0 - (test_rmse ** 2) / (persistence_rmse ** 2)
    
    results = {
        "train_rmse": round(float(train_rmse), 4),
        "test_rmse": round(float(test_rmse), 4),
        "quiet_rmse": round(float(quiet_rmse), 4),
        "storm_rmse": round(float(storm_rmse), 4) if storm_rmse is not None else None,
        "storm_precision": round(float(precision), 4),
        "storm_recall": round(float(recall), 4),
        "storm_f1": round(float(f1), 4),
        "storm_detection_threshold": DETECTION_THRESHOLD,
        "persistence_rmse": round(float(persistence_rmse), 4),
        "skill_score": round(float(skill_score), 4),
        "n_storms_test": int(n_storms),
        "n_train": len(X_train),
        "n_val": len(X_val),
        "n_test": len(X_test),
        "best_iteration": int(best_iter),
        "target_horizon": "3h",
        "train_period": f"{X_train.index.min()} to {X_train_full.index.max()}",
        "test_period": f"{X_test.index.min()} to {X_test.index.max()}",
        "last_trained": datetime.now(timezone.utc).isoformat(),
        "model_version": "kp_baseline_lgbm_v3",
    }
    
    # ===== Save model =====
    if save:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        model_artifact = {
            "model": model,
            "feature_names": list(X.columns),
            "metrics": results,
            "train_cutoff": str(TRAIN_CUTOFF),
        }
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(model_artifact, f)
        logger.info(f"Model saved to {MODEL_PATH}")
        
        with open(MODEL_DIR / "kp_baseline_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        results["model_path"] = str(MODEL_PATH)
    
    return results


def load_model():
    """Load the trained model artifact from disk."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"No trained model at {MODEL_PATH}")
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    from ingestion.omni_client import OMNIClient
    from modeling.feature_engineering import build_features
    
    client = OMNIClient()
    df = client.parse_all(1996, 2025)
    X, y = build_features(df, target_horizon_hours=3)
    results = train_baseline(X, y, save=True)
    
    print()
    print("=" * 60)
    for k, v in results.items():
        print(f"  {k:30s}: {v}")
    print("=" * 60)
