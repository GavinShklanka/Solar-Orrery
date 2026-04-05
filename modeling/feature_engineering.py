"""
Feature Engineering for Kp Geomagnetic Index Forecasting.

Implements exactly:
  - Newell coupling function
  - Temporal lags for Bz and solar wind speed (1h, 2h, 3h, 6h, 12h, 24h)
  - Historical Kp lags (3h, 6h, 12h, 24h)
  - 27-day solar recurrence indicator (one Carrington rotation)
  - Solar cycle phase (fractional position within current cycle)
  
Drops all rows where target Kp is NaN.
Drops all rows where Bz_GSM, flow_speed, or proton_density are NaN (no imputation).
"""
import numpy as np
import pandas as pd
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# Known solar cycle minima (month precision)
CYCLE_MINIMA = {
    23: pd.Timestamp("1996-05-01", tz="UTC"),   # Cycle 23 minimum
    24: pd.Timestamp("2008-12-01", tz="UTC"),    # Cycle 24 minimum
    25: pd.Timestamp("2019-12-01", tz="UTC"),    # Cycle 25 minimum
    26: pd.Timestamp("2030-06-01", tz="UTC"),    # Cycle 26 projected (placeholder)
}


def newell_coupling(v: pd.Series, bt: pd.Series, by: pd.Series, bz: pd.Series) -> pd.Series:
    """
    Newell et al. (2007) solar wind-magnetosphere coupling function.
    
    dPhi/dt = v^(4/3) * Bt^(2/3) * sin^(8/3)(theta_c/2)
    
    where theta_c is the IMF clock angle = arctan2(By, Bz) in GSM.
    
    Parameters:
        v:  solar wind speed (km/s)
        bt: IMF transverse magnitude sqrt(By^2 + Bz^2), nT
        by: IMF By (GSM), nT
        bz: IMF Bz (GSM), nT
        
    Returns:
        Newell coupling function value (dimensionless scaling)
    """
    theta_c = np.arctan2(by, bz)
    # Coupling function: v^(4/3) * Bt^(2/3) * sin(theta/2)^(8/3)
    coupling = (v ** (4.0 / 3.0)) * (bt ** (2.0 / 3.0)) * (np.abs(np.sin(theta_c / 2.0)) ** (8.0 / 3.0))
    return coupling


def solar_cycle_phase(timestamps: pd.DatetimeIndex) -> pd.Series:
    """
    Compute fractional position within the current solar cycle.
    
    Uses known cycle minima to determine which cycle a timestamp falls in,
    then returns fractional progress through that cycle (0.0 = minimum, 1.0 = next minimum).
    """
    cycle_nums = sorted(CYCLE_MINIMA.keys())
    phases = pd.Series(np.nan, index=timestamps)
    
    for i in range(len(cycle_nums) - 1):
        c_start = CYCLE_MINIMA[cycle_nums[i]]
        c_end = CYCLE_MINIMA[cycle_nums[i + 1]]
        cycle_duration = (c_end - c_start).total_seconds()
        
        mask = (timestamps >= c_start) & (timestamps < c_end)
        elapsed = (timestamps[mask] - c_start).total_seconds()
        phases[mask] = elapsed / cycle_duration
    
    # Handle timestamps before first known minimum or after last
    first_min = CYCLE_MINIMA[cycle_nums[0]]
    last_min = CYCLE_MINIMA[cycle_nums[-1]]
    
    mask_before = timestamps < first_min
    if mask_before.any():
        phases[mask_before] = 0.0
        
    mask_after = timestamps >= last_min
    if mask_after.any():
        # Extrapolate assuming ~11 year cycle
        elapsed = (timestamps[mask_after] - last_min).total_seconds()
        avg_cycle = 11.0 * 365.25 * 24 * 3600
        phases[mask_after] = elapsed / avg_cycle
    
    return phases


def build_features(df: pd.DataFrame, target_horizon_hours: int = 3) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Build all features for Kp forecasting from an OMNI2 DataFrame.
    
    Parameters:
        df: OMNI2 DataFrame with UTC datetime index and columns:
            Bz_GSM, By_GSM, B_scalar, flow_speed, proton_density, Kp, etc.
        target_horizon_hours: forecast horizon in hours (default 3h)
        
    Returns:
        (X, y): Feature matrix and target series, both cleaned of NaN
    """
    logger.info(f"Building features from {len(df)} hourly records...")
    
    # Work on a copy
    feat = df.copy()
    
    # ===== Derived features =====
    
    # Transverse IMF magnitude Bt = sqrt(By^2 + Bz^2) in GSM
    feat["Bt_GSM"] = np.sqrt(feat["By_GSM"] ** 2 + feat["Bz_GSM"] ** 2)
    
    # Newell coupling function
    feat["newell_coupling"] = newell_coupling(
        feat["flow_speed"], feat["Bt_GSM"], feat["By_GSM"], feat["Bz_GSM"]
    )
    
    # ===== Temporal lags =====
    
    bz_lag_hours = [1, 2, 3, 6, 12, 24]
    speed_lag_hours = [1, 2, 3, 6, 12, 24]
    kp_lag_hours = [3, 6, 12, 24]
    
    for h in bz_lag_hours:
        feat[f"Bz_GSM_lag{h}h"] = feat["Bz_GSM"].shift(h)
        
    for h in speed_lag_hours:
        feat[f"flow_speed_lag{h}h"] = feat["flow_speed"].shift(h)
        
    for h in kp_lag_hours:
        feat[f"Kp_lag{h}h"] = feat["Kp"].shift(h)
    
    # 27-day solar recurrence: Kp from exactly 27 days (648 hours) prior
    feat["Kp_27day"] = feat["Kp"].shift(27 * 24)
    
    # Solar cycle phase
    feat["solar_cycle_phase"] = solar_cycle_phase(feat.index)
    
    # ===== Target variable =====
    # Kp at t + target_horizon_hours (future value we're predicting)
    feat["Kp_target"] = feat["Kp"].shift(-target_horizon_hours)
    
    # ===== Feature selection =====
    feature_cols = [
        # Current solar wind state
        "B_scalar", "Bx_GSE", "By_GSM", "Bz_GSM", "Bt_GSM",
        "flow_speed", "proton_density", "flow_pressure",
        "alfven_mach", "Kp", "ap_index",
        # Derived
        "newell_coupling",
        # Bz lags
        "Bz_GSM_lag1h", "Bz_GSM_lag2h", "Bz_GSM_lag3h",
        "Bz_GSM_lag6h", "Bz_GSM_lag12h", "Bz_GSM_lag24h",
        # Speed lags
        "flow_speed_lag1h", "flow_speed_lag2h", "flow_speed_lag3h",
        "flow_speed_lag6h", "flow_speed_lag12h", "flow_speed_lag24h",
        # Kp lags
        "Kp_lag3h", "Kp_lag6h", "Kp_lag12h", "Kp_lag24h",
        # Recurrence
        "Kp_27day",
        # Cycle
        "solar_cycle_phase",
    ]
    
    # Validate all feature columns exist
    missing_cols = [c for c in feature_cols if c not in feat.columns]
    if missing_cols:
        raise ValueError(f"Missing columns: {missing_cols}")
    
    X = feat[feature_cols].copy()
    y = feat["Kp_target"].copy()
    
    # ===== Drop rows with NaN in critical columns =====
    # Drop where target is NaN
    valid_mask = y.notna()
    # Drop where Bz_GSM, flow_speed, or proton_density are NaN (fill values)
    valid_mask &= X["Bz_GSM"].notna()
    valid_mask &= X["flow_speed"].notna()
    valid_mask &= X["proton_density"].notna()
    
    # Drop where any feature is NaN (lag features will have NaN at boundaries)
    valid_mask &= X.notna().all(axis=1)
    
    X_clean = X[valid_mask]
    y_clean = y[valid_mask]
    
    logger.info(f"Features built: {len(X_clean)} rows, {len(feature_cols)} features "
                f"(dropped {len(df) - len(X_clean)} rows with NaN)")
    
    return X_clean, y_clean


def run_feature_importance(X: pd.DataFrame, y: pd.Series, top_n: int = 15) -> pd.DataFrame:
    """
    Quick LightGBM fit to assess feature importance.
    Returns top_n features sorted by importance score.
    """
    try:
        import lightgbm as lgb
    except ImportError:
        raise ImportError("LightGBM required: pip install lightgbm")
    
    logger.info("Running quick LightGBM feature importance check...")
    
    model = lgb.LGBMRegressor(
        n_estimators=200,
        learning_rate=0.1,
        num_leaves=31,
        min_child_samples=50,
        verbose=-1,
        n_jobs=-1,
    )
    
    # Use a small sample for speed if dataset is very large
    if len(X) > 100000:
        sample_idx = np.random.RandomState(42).choice(len(X), 100000, replace=False)
        X_sample = X.iloc[sample_idx]
        y_sample = y.iloc[sample_idx]
    else:
        X_sample, y_sample = X, y
    
    model.fit(X_sample, y_sample)
    
    importance = pd.DataFrame({
        "feature": X.columns,
        "importance": model.feature_importances_,
    }).sort_values("importance", ascending=False).reset_index(drop=True)
    
    return importance.head(top_n)
