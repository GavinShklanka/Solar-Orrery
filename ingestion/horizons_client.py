"""
NASA JPL Horizons Client — Spacecraft and solar system ephemerides.
No auth. Sequential requests only — queue calls.
Used for deep-space mission trajectories (Voyager, New Horizons, JWST, etc.).
"""
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"

# Key deep-space mission IDs in JPL Horizons
DEEP_SPACE_MISSIONS = {
    "voyager_1": {"id": "-31", "name": "Voyager 1"},
    "voyager_2": {"id": "-32", "name": "Voyager 2"},
    "new_horizons": {"id": "-98", "name": "New Horizons"},
    "jwst": {"id": "-170", "name": "James Webb Space Telescope"},
    "pioneer_10": {"id": "-23", "name": "Pioneer 10"},
    "pioneer_11": {"id": "-24", "name": "Pioneer 11"},
}


class HorizonsClient:
    """Sequential ephemeris queries to JPL Horizons for deep-space missions."""

    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout
        self._cache: dict = {}
        self._last_fetch: dict[str, datetime] = {}

    async def get_mission_state(
        self,
        mission_key: str,
        start_time: Optional[str] = None,
        stop_time: Optional[str] = None,
    ) -> Optional[dict]:
        """Get state vectors for a deep-space mission."""
        mission = DEEP_SPACE_MISSIONS.get(mission_key)
        if not mission:
            logger.warning(f"Horizons: unknown mission key '{mission_key}'")
            return None

        now = datetime.now(timezone.utc)
        if not start_time:
            start_time = now.strftime("'%Y-%m-%d'")
        if not stop_time:
            stop_time = now.strftime("'%Y-%m-%d 12:00'")

        params = {
            "format": "json",
            "COMMAND": f"'{mission['id']}'",
            "EPHEM_TYPE": "'VECTORS'",
            "CENTER": "'500@10'",  # Sun-centered
            "START_TIME": start_time,
            "STOP_TIME": stop_time,
            "STEP_SIZE": "'1 d'",
            "VEC_TABLE": "'2'",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(HORIZONS_URL, params=params)
                response.raise_for_status()
                data = response.json()

                result = {
                    "mission": mission["name"],
                    "mission_key": mission_key,
                    "horizons_id": mission["id"],
                    "raw_result": data.get("result", ""),
                    "fetched_at": now.isoformat(),
                }

                self._cache[mission_key] = result
                self._last_fetch[mission_key] = now
                logger.info(f"Horizons: fetched state for {mission['name']}")
                return result

        except Exception as e:
            logger.error(f"Horizons: error for {mission.get('name', mission_key)}: {e}")
            return self._cache.get(mission_key)

    async def get_all_missions(self) -> dict:
        """Sequentially fetch all deep-space mission states."""
        results = {}
        for key in DEEP_SPACE_MISSIONS:
            result = await self.get_mission_state(key)
            if result:
                results[key] = result
        return results

    def get_status(self) -> dict:
        return {
            "source": "NASA JPL Horizons",
            "missions": {
                key: {
                    "name": DEEP_SPACE_MISSIONS[key]["name"],
                    "last_fetch": self._last_fetch.get(key),
                    "cached": key in self._cache,
                }
                for key in DEEP_SPACE_MISSIONS
            },
        }
