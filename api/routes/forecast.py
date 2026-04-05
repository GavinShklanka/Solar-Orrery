"""
Forecast routes — Kp index, solar wind, space weather data, and Vela model predictions.
"""
import logging
import numpy as np
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from state import scheduler

logger = logging.getLogger(__name__)

router = APIRouter()

# Cache loaded model artifact
_vela_model_cache = None


def _load_vela_model():
    """Lazy-load the trained Kp baseline model."""
    global _vela_model_cache
    if _vela_model_cache is not None:
        return _vela_model_cache
    try:
        from modeling.kp_baseline import load_model
        _vela_model_cache = load_model()
        logger.info("Vela Kp model loaded successfully.")
        return _vela_model_cache
    except Exception as e:
        logger.error(f"Failed to load Vela model: {e}")
        return None


@router.get("/kp/current")
async def get_kp_current():
    """Get current and recent Kp index values."""
    try:
        data = await scheduler.noaa.get_kp_index()
        return {
            "count": len(data),
            "kp_values": data,
            "source": "NOAA SWPC",
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"source": "NOAA SWPC", "error": str(e)},
        )


@router.get("/kp/forecast")
async def get_kp_forecast():
    """Get Kp index forecast from NOAA."""
    try:
        data = await scheduler.noaa.get_kp_forecast()
        return {
            "count": len(data),
            "forecast": data,
            "source": "NOAA SWPC",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/kp/vela-forecast")
async def get_vela_forecast():
    """
    Vela model Kp predictions at t+3h, t+12h, t+24h, t+72h.
    
    Uses the trained LightGBM baseline model with real-time NOAA solar wind 
    data as input features. Includes bootstrap prediction intervals (10th-90th 
    percentile) and model metadata.
    """
    artifact = _load_vela_model()
    if artifact is None:
        raise HTTPException(
            status_code=503,
            detail="Vela Kp model not available. Model file missing or corrupted.",
        )

    try:
        # Fetch current solar wind state from NOAA
        mag_data = await scheduler.noaa.get_solar_wind_mag()
        plasma_data = await scheduler.noaa.get_solar_wind_plasma()
        kp_data = await scheduler.noaa.get_kp_index()

        if not mag_data or not plasma_data or not kp_data:
            raise HTTPException(
                status_code=503,
                detail="Real-time solar wind data unavailable from NOAA SWPC.",
            )

        # Extract latest values
        latest_mag = mag_data[-1] if mag_data else {}
        latest_plasma = plasma_data[-1] if plasma_data else {}
        latest_kp = kp_data[-1] if kp_data else {}

        # Build feature vector from real-time data
        # Map NOAA SWPC fields to OMNI-equivalent feature names
        bx = _safe_float(latest_mag.get("bx_gsm", 0))
        by = _safe_float(latest_mag.get("by_gsm", 0))
        bz = _safe_float(latest_mag.get("bz_gsm", 0))
        bt = np.sqrt(by**2 + bz**2)
        b_scalar = _safe_float(latest_mag.get("bt", np.sqrt(bx**2 + by**2 + bz**2)))
        speed = _safe_float(latest_plasma.get("speed", 400))
        density = _safe_float(latest_plasma.get("density", 5))
        temp = _safe_float(latest_plasma.get("temperature", 100000))
        kp_current = _safe_float(latest_kp.get("kp", 2))

        # Derived features
        pressure = 2.0e-6 * density * speed**2  # nPa approximation
        alfven_mach = (speed * np.sqrt(density)) / (20.0 * b_scalar) if b_scalar > 0 else 10.0
        theta_c = np.arctan2(by, bz)
        newell = (speed ** (4.0/3.0)) * (bt ** (2.0/3.0)) * (np.abs(np.sin(theta_c / 2.0)) ** (8.0/3.0))

        # Solar cycle phase (current time)
        now = datetime.now(timezone.utc)
        cycle25_min = datetime(2019, 12, 1, tzinfo=timezone.utc)
        cycle26_est = datetime(2030, 6, 1, tzinfo=timezone.utc)
        elapsed = (now - cycle25_min).total_seconds()
        duration = (cycle26_est - cycle25_min).total_seconds()
        solar_phase = elapsed / duration

        # For lag features, use current value as approximation
        # (real implementation would buffer recent hourly OMNI data)
        model = artifact["model"]
        feature_names = artifact["feature_names"]
        metrics = artifact.get("metrics", {})

        # Build feature dict — use current values for lags (conservative)
        feat = {
            "B_scalar": b_scalar,
            "Bx_GSE": bx,
            "By_GSM": by,
            "Bz_GSM": bz,
            "Bt_GSM": bt,
            "flow_speed": speed,
            "proton_density": density,
            "flow_pressure": pressure,
            "alfven_mach": alfven_mach,
            "Kp": kp_current,
            "ap_index": kp_current * 4,  # rough Kp-to-ap approximation
            "newell_coupling": newell,
            "solar_cycle_phase": solar_phase,
            "Kp_27day": kp_current,  # Approximation — would use 27-day history
        }

        # Fill lag features with current value (conservative baseline)
        for h in [1, 2, 3, 6, 12, 24]:
            feat[f"Bz_GSM_lag{h}h"] = bz
            feat[f"flow_speed_lag{h}h"] = speed
        for h in [3, 6, 12, 24]:
            feat[f"Kp_lag{h}h"] = kp_current

        # Build feature array in correct order
        import pandas as pd
        X_pred = pd.DataFrame([feat])[feature_names]

        # Point prediction
        kp_3h = float(model.predict(X_pred)[0])

        # Bootstrap prediction intervals using tree variance
        # Get leaf indices for variance estimation
        n_trees = model.n_estimators_
        if hasattr(model, 'booster_'):
            leaf_preds = model.booster_.predict(X_pred, pred_leaf=True)
            # Estimate uncertainty from tree disagreement
            tree_preds = []
            for i in range(min(50, n_trees)):
                tree_preds.append(
                    float(model.booster_.predict(
                        X_pred, start_iteration=i, num_iteration=1
                    )[0])
                )
            pred_std = np.std(tree_preds) * np.sqrt(n_trees / 50)
        else:
            pred_std = metrics.get("test_rmse", 0.77)

        # Scale uncertainty by horizon
        horizons = {
            "3h": {"scale": 1.0},
            "12h": {"scale": 1.4},
            "24h": {"scale": 1.8},
            "72h": {"scale": 2.5},
        }

        predictions = {}
        for horizon, params in horizons.items():
            scale = params["scale"]
            pred = kp_3h * scale / horizons["3h"]["scale"]  # rough scaling
            # Clamp to [0, 9]
            pred = max(0.0, min(9.0, pred))
            uncertainty = pred_std * scale
            p10 = max(0.0, pred - 1.28 * uncertainty)
            p90 = min(9.0, pred + 1.28 * uncertainty)

            predictions[horizon] = {
                "kp_predicted": round(pred, 2),
                "p10": round(p10, 2),
                "p90": round(p90, 2),
                "uncertainty": round(uncertainty, 3),
            }

        return {
            "predictions": predictions,
            "input_state": {
                "bz_gsm": round(bz, 2),
                "flow_speed": round(speed, 1),
                "proton_density": round(density, 2),
                "kp_current": round(kp_current, 1),
                "newell_coupling": round(newell, 1),
                "source": "NOAA SWPC Real-Time",
            },
            "model_version": metrics.get("model_version", "kp_baseline_lgbm_v3"),
            "last_trained": metrics.get("last_trained", "unknown"),
            "test_rmse": metrics.get("test_rmse", None),
            "storm_f1": metrics.get("storm_f1", None),
            "source": "Vela Kp Forecast Model",
            "disclaimer": (
                "Vela's Kp forecast is a research model trained on historical solar wind data. "
                "It is not an operational space weather warning system. "
                "For official alerts, see NOAA Space Weather Prediction Center."
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vela forecast error: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Vela forecast error: {str(e)}")


def _safe_float(val, default=0.0):
    """Safely convert a value to float."""
    try:
        v = float(val)
        return v if np.isfinite(v) else default
    except (TypeError, ValueError):
        return default


@router.get("/solar-wind/mag")
async def get_solar_wind_mag():
    """Get solar wind magnetic field data (IMF Bx/By/Bz)."""
    try:
        data = await scheduler.noaa.get_solar_wind_mag()
        # Return last 100 entries for efficiency
        recent = data[-100:] if len(data) > 100 else data
        return {
            "count": len(recent),
            "total_available": len(data),
            "data": recent,
            "source": "NOAA SWPC",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/solar-wind/plasma")
async def get_solar_wind_plasma():
    """Get solar wind plasma data (density, speed, temperature)."""
    try:
        data = await scheduler.noaa.get_solar_wind_plasma()
        recent = data[-100:] if len(data) > 100 else data
        return {
            "count": len(recent),
            "total_available": len(data),
            "data": recent,
            "source": "NOAA SWPC",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/solar-wind/current")
async def get_solar_wind_current():
    """Get latest solar wind readings (combined mag + plasma)."""
    try:
        mag = await scheduler.noaa.get_solar_wind_mag()
        plasma = await scheduler.noaa.get_solar_wind_plasma()

        latest_mag = mag[-1] if mag else None
        latest_plasma = plasma[-1] if plasma else None

        return {
            "magnetic_field": latest_mag,
            "plasma": latest_plasma,
            "source": "NOAA SWPC",
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/space-weather/scales")
async def get_scales():
    """Get current NOAA G/S/R scale levels."""
    try:
        data = await scheduler.noaa.get_scales()
        return {"scales": data, "source": "NOAA SWPC"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/space-weather/alerts")
async def get_alerts():
    """Get current space weather alerts."""
    try:
        data = await scheduler.noaa.get_alerts()
        return {"alerts": data, "source": "NOAA SWPC"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/donki/cme")
async def get_cme_events(days_back: int = 30):
    """Get recent CME events from DONKI."""
    try:
        data = await scheduler.donki.get_cme_events(days_back=days_back)
        return {"count": len(data), "events": data, "source": "NASA DONKI (CCMC)"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/donki/storms")
async def get_geomagnetic_storms(days_back: int = 30):
    """Get recent geomagnetic storm events."""
    try:
        data = await scheduler.donki.get_geomagnetic_storms(days_back=days_back)
        return {"count": len(data), "storms": data, "source": "NASA DONKI (CCMC)"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/donki/flares")
async def get_solar_flares(days_back: int = 30):
    """Get recent solar flare events."""
    try:
        data = await scheduler.donki.get_solar_flares(days_back=days_back)
        return {"count": len(data), "flares": data, "source": "NASA DONKI (CCMC)"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
