"""
NASA CNEOS + Sentry Client — Close approach calendar and NEO impact probabilities.
No auth required.
"""
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

CNEOS_CAD_URL = "https://ssd-api.jpl.nasa.gov/cad.api"
SENTRY_URL = "https://ssd-api.jpl.nasa.gov/sentry.api"


class CNEOSClient:
    """Fetches close approach data and Sentry impact probabilities from NASA JPL."""

    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout
        self._cad_cache: Optional[dict] = None
        self._sentry_cache: Optional[dict] = None
        self._last_cad_fetch: Optional[datetime] = None
        self._last_sentry_fetch: Optional[datetime] = None
        self._errors: dict[str, str] = {}

    async def get_close_approaches(
        self,
        dist_max: float = 0.05,
        date_min: str = "now",
        fullname: bool = True,
    ) -> dict:
        """Fetch upcoming close approaches from CNEOS CAD API."""
        params = {
            "dist-max": str(dist_max),
            "date-min": date_min,
            "fullname": str(fullname).lower(),
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(CNEOS_CAD_URL, params=params)
                response.raise_for_status()
                data = response.json()

                # Parse into structured objects
                fields = data.get("fields", [])
                raw_data = data.get("data", [])
                count = int(data.get("count", 0))

                approaches = []
                for row in raw_data:
                    obj = dict(zip(fields, row))
                    approaches.append({
                        "designation": obj.get("des", ""),
                        "fullname": obj.get("fullname", "").strip(),
                        "close_approach_date": obj.get("cd", ""),
                        "dist_au": self._safe_float(obj.get("dist")),
                        "dist_min_au": self._safe_float(obj.get("dist_min")),
                        "dist_max_au": self._safe_float(obj.get("dist_max")),
                        "v_rel_km_s": self._safe_float(obj.get("v_rel")),
                        "h_mag": self._safe_float(obj.get("h")),
                        "diameter_km": self._safe_float(obj.get("diameter")),
                        # Derived: lunar distances
                        "dist_lunar": self._au_to_lunar(obj.get("dist")),
                    })

                result = {
                    "count": count,
                    "approaches": approaches,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }
                self._cad_cache = result
                self._last_cad_fetch = datetime.now(timezone.utc)
                self._errors.pop("cad", None)
                logger.info(f"CNEOS: fetched {count} close approaches")
                return result

        except Exception as e:
            logger.error(f"CNEOS: error fetching close approaches: {e}")
            self._errors["cad"] = str(e)
            if self._cad_cache:
                return self._cad_cache
            return {"count": 0, "approaches": [], "error": str(e)}

    async def get_sentry_objects(self) -> dict:
        """Fetch all Sentry-monitored objects with impact probabilities."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(SENTRY_URL)
                response.raise_for_status()
                data = response.json()

                count = int(data.get("count", 0))
                raw = data.get("data", [])

                objects = []
                for entry in raw[:200]:  # Cap display at 200 for UI performance
                    objects.append({
                        "designation": entry.get("des", ""),
                        "fullname": entry.get("fullname", "").strip(),
                        "impact_probability": self._safe_float(entry.get("ip")),
                        "palermo_scale_cum": self._safe_float(entry.get("ps_cum")),
                        "palermo_scale_max": self._safe_float(entry.get("ps_max")),
                        "torino_scale_max": int(entry.get("ts_max", 0)),
                        "diameter_km": self._safe_float(entry.get("diameter")),
                        "n_impacts": int(entry.get("n_imp", 0)),
                        "v_inf": self._safe_float(entry.get("v_inf")),
                        "h_mag": self._safe_float(entry.get("h")),
                        "range": entry.get("range", ""),
                        "last_obs": entry.get("last_obs", ""),
                    })

                result = {
                    "count": count,
                    "objects": objects,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }
                self._sentry_cache = result
                self._last_sentry_fetch = datetime.now(timezone.utc)
                self._errors.pop("sentry", None)
                logger.info(f"CNEOS Sentry: fetched {count} monitored objects")
                return result

        except Exception as e:
            logger.error(f"CNEOS Sentry: error: {e}")
            self._errors["sentry"] = str(e)
            if self._sentry_cache:
                return self._sentry_cache
            return {"count": 0, "objects": [], "error": str(e)}

    def _safe_float(self, value) -> Optional[float]:
        try:
            return float(value) if value else None
        except (ValueError, TypeError):
            return None

    def _au_to_lunar(self, au_str) -> Optional[float]:
        """Convert AU to lunar distances (1 AU ≈ 389.17 lunar distances)."""
        au = self._safe_float(au_str)
        return round(au * 389.17, 2) if au else None

    def get_status(self) -> dict:
        return {
            "source": "NASA CNEOS / JPL Sentry",
            "cad": {
                "last_fetch": self._last_cad_fetch,
                "cached_count": self._cad_cache["count"] if self._cad_cache else 0,
                "error": self._errors.get("cad"),
            },
            "sentry": {
                "last_fetch": self._last_sentry_fetch,
                "cached_count": self._sentry_cache["count"] if self._sentry_cache else 0,
                "error": self._errors.get("sentry"),
            },
        }
