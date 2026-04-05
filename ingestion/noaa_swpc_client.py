"""
NOAA SWPC Client — Real-time solar wind, Kp index, and space weather scales.
No auth required. 5-minute cadence for solar wind, 3-hour for Kp.
"""
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

SWPC_BASE = "https://services.swpc.noaa.gov"

ENDPOINTS = {
    "kp_index": f"{SWPC_BASE}/products/noaa-planetary-k-index.json",
    "kp_forecast": f"{SWPC_BASE}/products/noaa-planetary-k-index-forecast.json",
    "solar_wind_plasma": f"{SWPC_BASE}/products/solar-wind/plasma-5-minute.json",
    "solar_wind_mag": f"{SWPC_BASE}/products/solar-wind/mag-5-minute.json",
    "scales": f"{SWPC_BASE}/products/noaa-scales.json",
    "alerts": f"{SWPC_BASE}/products/alerts.json",
    "forecast_45day": f"{SWPC_BASE}/json/45-day-forecast.json",
}


class NOAASWPCClient:
    """Fetches real-time space weather data from NOAA SWPC."""

    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout
        self._cache: dict = {}
        self._last_fetch: dict[str, datetime] = {}
        self._errors: dict[str, str] = {}

    async def _fetch(self, key: str) -> Optional[list | dict]:
        """Generic fetch with caching and error tracking."""
        url = ENDPOINTS[key]
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                self._cache[key] = data
                self._last_fetch[key] = datetime.now(timezone.utc)
                self._errors.pop(key, None)
                return data
        except Exception as e:
            error_msg = f"NOAA SWPC: error fetching {key}: {e}"
            logger.error(error_msg)
            self._errors[key] = str(e)
            return self._cache.get(key)

    async def get_kp_index(self) -> list[dict]:
        """Get current and recent Kp index values (3-hour cadence)."""
        data = await self._fetch("kp_index")
        if not data:
            return []
        # Data is array of objects with time_tag, Kp, a_running, station_count
        return [
            {
                "time_tag": entry.get("time_tag"),
                "kp": float(entry.get("Kp", 0)),
                "a_running": int(entry.get("a_running", 0)),
                "station_count": int(entry.get("station_count", 0)),
            }
            for entry in data
            if isinstance(entry, dict)
        ]

    async def get_kp_forecast(self) -> list[dict]:
        """Get Kp index forecast from NOAA."""
        data = await self._fetch("kp_forecast")
        if not data:
            return []
        result = []
        for entry in data:
            if isinstance(entry, dict):
                result.append({
                    "time_tag": entry.get("time_tag"),
                    "kp": float(entry.get("kp", entry.get("Kp", 0))),
                    "observed": entry.get("observed", ""),
                    "noaa_scale": entry.get("noaa_scale", ""),
                })
        return result

    async def get_solar_wind_mag(self) -> list[dict]:
        """Get solar wind magnetic field data (5-min cadence)."""
        data = await self._fetch("solar_wind_mag")
        if not data or len(data) < 2:
            return []
        # First element is headers, rest are data
        headers = data[0]
        result = []
        for row in data[1:]:
            if len(row) >= 7:
                result.append({
                    "time_tag": row[0],
                    "bx_gsm": self._safe_float(row[1]),
                    "by_gsm": self._safe_float(row[2]),
                    "bz_gsm": self._safe_float(row[3]),
                    "lon_gsm": self._safe_float(row[4]),
                    "lat_gsm": self._safe_float(row[5]),
                    "bt": self._safe_float(row[6]),
                })
        return result

    async def get_solar_wind_plasma(self) -> list[dict]:
        """Get solar wind plasma data (5-min cadence)."""
        data = await self._fetch("solar_wind_plasma")
        if not data or len(data) < 2:
            return []
        result = []
        for row in data[1:]:
            if len(row) >= 4:
                result.append({
                    "time_tag": row[0],
                    "density": self._safe_float(row[1]),
                    "speed": self._safe_float(row[2]),
                    "temperature": self._safe_float(row[3]),
                })
        return result

    async def get_scales(self) -> Optional[dict]:
        """Get current NOAA G/S/R scale levels."""
        return await self._fetch("scales")

    async def get_alerts(self) -> Optional[list]:
        """Get current space weather alerts."""
        return await self._fetch("alerts")

    def _safe_float(self, value) -> Optional[float]:
        try:
            return float(value) if value is not None else None
        except (ValueError, TypeError):
            return None

    def get_status(self) -> dict:
        return {
            "source": "NOAA SWPC",
            "endpoints": {
                key: {
                    "last_fetch": self._last_fetch.get(key),
                    "cached": key in self._cache,
                    "error": self._errors.get(key),
                }
                for key in ENDPOINTS
            },
        }
