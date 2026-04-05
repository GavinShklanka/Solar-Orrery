"""
Scheduler — Polling coordinator with rate guards for all ingestion sources.
Manages fetch intervals per source to respect API rate limits.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from .celestrak_client import CelesTrakClient
from .noaa_swpc_client import NOAASWPCClient
from .cneos_client import CNEOSClient
from .donki_client import DONKIClient
from .horizons_client import HorizonsClient
from .launchlib_client import LaunchLibraryClient
from .gcat_client import GCATClient
from .ucs_client import UCSClient
from .spacetrack_client import SpaceTrackClient
from processing.launch_history_builder import LaunchHistoryBuilder

logger = logging.getLogger(__name__)


class DataScheduler:
    """Coordinates data fetching across all sources with rate guards."""

    def __init__(self):
        self.celestrak = CelesTrakClient()
        self.noaa = NOAASWPCClient()
        self.cneos = CNEOSClient()
        self.donki = DONKIClient()
        self.horizons = HorizonsClient()
        self.launchlib = LaunchLibraryClient()
        self.gcat = GCATClient()
        self.ucs = UCSClient()
        self.spacetrack = SpaceTrackClient()
        
        self.launch_history = LaunchHistoryBuilder(self.gcat, self.launchlib, self.ucs)

        self._running = False
        self._last_full_fetch: Optional[datetime] = None

    async def initial_fetch(self):
        """Perform initial data fetch for all sources on startup."""
        logger.info("Scheduler: starting initial data fetch...")
        tasks = [
            self._safe_fetch("CelesTrak", self.celestrak.fetch_active_satellites),
            self._safe_fetch("NOAA Kp", self.noaa.get_kp_index),
            self._safe_fetch("NOAA Solar Wind Mag", self.noaa.get_solar_wind_mag),
            self._safe_fetch("NOAA Solar Wind Plasma", self.noaa.get_solar_wind_plasma),
            self._safe_fetch("NOAA Kp Forecast", self.noaa.get_kp_forecast),
            self._safe_fetch("CNEOS Close Approach", self.cneos.get_close_approaches),
            self._safe_fetch("CNEOS Sentry", self.cneos.get_sentry_objects),
            self._safe_fetch("DONKI CME", self.donki.get_cme_events),
            self._safe_fetch("DONKI GST", self.donki.get_geomagnetic_storms),
            self._safe_fetch("DONKI Flares", self.donki.get_solar_flares),
            self._safe_fetch("Launch History (GCAT/UCS)", self.launch_history.build),
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)
        self._last_full_fetch = datetime.now(timezone.utc)

        success_count = sum(1 for r in results if not isinstance(r, Exception))
        logger.info(
            f"Scheduler: initial fetch complete — {success_count}/{len(tasks)} sources loaded"
        )

    async def _safe_fetch(self, name: str, coro_func):
        """Safely execute a fetch coroutine with error isolation."""
        try:
            result = await coro_func()
            logger.info(f"Scheduler: {name} — OK")
            return result
        except Exception as e:
            logger.error(f"Scheduler: {name} — FAILED: {e}")
            return None

    def get_all_status(self) -> dict:
        """Return combined status of all data sources."""
        return {
            "last_full_fetch": self._last_full_fetch,
            "sources": {
                "celestrak": self.celestrak.get_cache_status(),
                "noaa_swpc": self.noaa.get_status(),
                "cneos": self.cneos.get_status(),
                "donki": self.donki.get_status(),
                "horizons": self.horizons.get_status(),
                "launch_library": self.launchlib.get_status(),
                "gcat": self.gcat.get_status(),
                "ucs": self.ucs.get_status(),
                "spacetrack": self.spacetrack.get_status(),
            },
        }
