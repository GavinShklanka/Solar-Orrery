"""
Launch Library 2 Client — Historical and upcoming launches.
Free tier: 15 req/hr. Dev server for bulk historical pulls.
Using v2.2.0 (confirmed working — v2.3.0 returns 404).
"""
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

LL2_BASE = "https://ll.thespacedevs.com/2.2.0"
LL2_DEV_BASE = "https://lldev.thespacedevs.com/2.2.0"


class LaunchLibraryClient:
    """Fetches launch data from Launch Library 2 API (v2.2.0)."""

    def __init__(self, timeout: float = 20.0, use_dev: bool = True):
        self.timeout = timeout
        self.base_url = LL2_DEV_BASE if use_dev else LL2_BASE
        self._cache: dict = {}
        self._last_fetch: dict[str, datetime] = {}
        self._errors: dict[str, str] = {}

    async def get_upcoming_launches(self, limit: int = 20) -> dict:
        """Fetch upcoming launches."""
        url = f"{self.base_url}/launch/upcoming/"
        params = {"format": "json", "limit": limit}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                launches = []
                for launch in data.get("results", []):
                    launches.append(self._parse_launch(launch))

                result = {
                    "count": data.get("count", 0),
                    "launches": launches,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }
                self._cache["upcoming"] = result
                self._last_fetch["upcoming"] = datetime.now(timezone.utc)
                self._errors.pop("upcoming", None)
                return result

        except Exception as e:
            logger.error(f"LaunchLib: error fetching upcoming: {e}")
            self._errors["upcoming"] = str(e)
            return self._cache.get("upcoming", {"count": 0, "launches": [], "error": str(e)})

    async def get_historical_launches(self, limit: int = 100, offset: int = 0) -> dict:
        """Fetch historical launches with pagination."""
        url = f"{self.base_url}/launch/"
        params = {"format": "json", "limit": limit, "offset": offset}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                launches = []
                for launch in data.get("results", []):
                    launches.append(self._parse_launch(launch))

                result = {
                    "count": data.get("count", 0),
                    "launches": launches,
                    "next": data.get("next"),
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                }
                self._cache["historical"] = result
                self._last_fetch["historical"] = datetime.now(timezone.utc)
                return result

        except Exception as e:
            logger.error(f"LaunchLib: error fetching historical: {e}")
            self._errors["historical"] = str(e)
            return self._cache.get("historical", {"count": 0, "launches": [], "error": str(e)})

    def _parse_launch(self, launch: dict) -> dict:
        """Parse a launch record into normalized format."""
        provider = launch.get("launch_service_provider", {})
        rocket = launch.get("rocket", {})
        config = rocket.get("configuration", {})
        mission = launch.get("mission") or {}
        pad = launch.get("pad", {})
        location = pad.get("location", {})

        return {
            "id": launch.get("id", ""),
            "name": launch.get("name", ""),
            "net": launch.get("net", ""),
            "status": launch.get("status", {}).get("name", ""),
            "provider_name": provider.get("name", ""),
            "provider_type": provider.get("type", ""),
            "rocket_name": config.get("name", ""),
            "rocket_family": config.get("family", ""),
            "mission_name": mission.get("name", ""),
            "mission_type": mission.get("type", ""),
            "orbit": mission.get("orbit", {}).get("name", "") if mission.get("orbit") else "",
            "pad_name": pad.get("name", ""),
            "location_name": location.get("name", ""),
            "country_code": location.get("country_code", ""),
            "latitude": pad.get("latitude"),
            "longitude": pad.get("longitude"),
            "image": launch.get("image", ""),
        }

    def get_status(self) -> dict:
        return {
            "source": "Launch Library 2 (v2.2.0)",
            "base_url": self.base_url,
            "endpoints": {
                key: {
                    "last_fetch": self._last_fetch.get(key),
                    "cached": key in self._cache,
                    "error": self._errors.get(key),
                }
                for key in ["upcoming", "historical"]
            },
        }
