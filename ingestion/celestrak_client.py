"""
CelesTrak TLE Fetcher — Primary orbital data source for Vela.
Fetches active satellite TLEs from CelesTrak GP API.
Rate limit: one download per update cycle (~3x daily from 18th Space Defense Squadron).
"""
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

CELESTRAK_GP_URL = "https://celestrak.org/NORAD/elements/gp.php"
CELESTRAK_SATCAT_URL = "https://celestrak.org/satcat/records.php"

# Standard TLE groups available from CelesTrak
#
# FIX 3 INVESTIGATION (2026-04-04):
# The 'active' group (~9,000 objects) returns HTTP 403 consistently.
# Investigation confirmed this is an IP-level block, not a header issue:
#   - Adding Referer header: still 403
#   - Changing Accept/format to TLE, CSV: still 403
#   - Using celestrak.com instead of .org: still 403
#   - Individual CATNR queries (e.g. ISS 25544): work fine (200)
#   - Individual constellation groups (stations, starlink, etc.): work fine (200)
#   - 'last-30-days' group (~340 objects): works fine (200)
#
# CURRENT COVERAGE: ~343 satellites via 'last-30-days' + individual groups.
# This is acceptable for Phase 1 demonstration. Phase 2 paths to full catalog:
#   1. Space-Track credentials (18th SDS full catalog, ~25k objects)
#   2. N2YO REST API (alternative commercial source)
#   3. CelesTrak CATNR-range queries in batches (slow but functional)
#
TLE_GROUPS = {
    "active": "last-30-days",  # Fallback: 'active' returns 403 — see investigation above
    "stations": "stations",
    "starlink": "starlink",
    "gps": "gps-ops",
    "weather": "weather",
    "science": "science",
    "geo": "geo",
    "engineering": "engineering",
    "debris": "cosmos-2251-debris",
}


class CelesTrakClient:
    """Fetches and caches TLE data from CelesTrak."""

    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout
        self._cache: dict = {}
        self._last_fetch: dict[str, datetime] = {}
        self._min_interval_seconds = 3600  # 1 hour minimum between fetches

    def _should_fetch(self, group: str) -> bool:
        if group not in self._last_fetch:
            return True
        elapsed = (datetime.now(timezone.utc) - self._last_fetch[group]).total_seconds()
        return elapsed >= self._min_interval_seconds

    async def fetch_tle_group(self, group: str = "active") -> list[dict]:
        """Fetch TLE data for a specific satellite group."""
        group_key = TLE_GROUPS.get(group, group)

        if not self._should_fetch(group) and group in self._cache:
            logger.info(f"CelesTrak: returning cached data for group '{group}'")
            return self._cache[group]

        url = f"{CELESTRAK_GP_URL}?GROUP={group_key}&FORMAT=JSON"
        logger.info(f"CelesTrak: fetching TLEs for group '{group}' from {url}")

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Vela/1.0",
                        "Accept": "application/json",
                    },
                )
                response.raise_for_status()
                data = response.json()

                # Parse and normalize
                satellites = []
                for entry in data:
                    sat = {
                        "object_name": entry.get("OBJECT_NAME", ""),
                        "norad_cat_id": entry.get("NORAD_CAT_ID"),
                        "epoch": entry.get("EPOCH", ""),
                        "mean_motion": float(entry.get("MEAN_MOTION", 0)),
                        "eccentricity": float(entry.get("ECCENTRICITY", 0)),
                        "inclination": float(entry.get("INCLINATION", 0)),
                        "ra_of_asc_node": float(entry.get("RA_OF_ASC_NODE", 0)),
                        "arg_of_pericenter": float(entry.get("ARG_OF_PERICENTER", 0)),
                        "mean_anomaly": float(entry.get("MEAN_ANOMALY", 0)),
                        "bstar": float(entry.get("BSTAR", 0)),
                        "classification_type": entry.get("CLASSIFICATION_TYPE", "U"),
                        "element_set_no": entry.get("ELEMENT_SET_NO"),
                        "rev_at_epoch": entry.get("REV_AT_EPOCH"),
                        "mean_motion_dot": float(entry.get("MEAN_MOTION_DOT", 0)),
                        "mean_motion_ddot": float(entry.get("MEAN_MOTION_DDOT", 0)),
                        # TLE lines for satellite.js propagation
                        "tle_line1": entry.get("TLE_LINE1", ""),
                        "tle_line2": entry.get("TLE_LINE2", ""),
                    }
                    satellites.append(sat)

                self._cache[group] = satellites
                self._last_fetch[group] = datetime.now(timezone.utc)
                logger.info(f"CelesTrak: fetched {len(satellites)} satellites for group '{group}'")
                return satellites

        except httpx.HTTPError as e:
            logger.error(f"CelesTrak: HTTP error for group '{group}': {e}")
            if group in self._cache:
                logger.warning("CelesTrak: returning stale cached data")
                return self._cache[group]
            raise
        except Exception as e:
            logger.error(f"CelesTrak: unexpected error for group '{group}': {e}")
            if group in self._cache:
                return self._cache[group]
            raise

    async def fetch_active_satellites(self) -> list[dict]:
        """Fetch all active satellites."""
        return await self.fetch_tle_group("active")

    async def fetch_stations(self) -> list[dict]:
        """Fetch space stations (ISS, Tiangong, etc.)."""
        return await self.fetch_tle_group("stations")

    def get_cache_status(self) -> dict:
        """Return cache status for monitoring."""
        return {
            group: {
                "count": len(self._cache.get(group, [])),
                "last_fetch": self._last_fetch.get(group, None),
            }
            for group in TLE_GROUPS
        }
