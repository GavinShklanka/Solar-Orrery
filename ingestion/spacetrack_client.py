"""
Space-Track.org Client — Historical GP data and decay predictions.
Architecture wired for Phase 2 credential integration.
Rate limit: 30 req/min, 300 req/hr.

NOTE: Requires free registration at https://www.space-track.org/auth/createAccount
Credentials are read from SPACETRACK_USERNAME and SPACETRACK_PASSWORD env vars.
Phase 1: This client is architecturally complete but deferred — CelesTrak is the sole TLE source.
"""
import httpx
import logging
import os
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

SPACETRACK_BASE = "https://www.space-track.org"
SPACETRACK_LOGIN = f"{SPACETRACK_BASE}/ajaxauth/login"
SPACETRACK_QUERY = f"{SPACETRACK_BASE}/basicspacedata/query"


class SpaceTrackClient:
    """Authenticated client for Space-Track.org GP history and reentry data."""

    def __init__(self):
        self.username = os.getenv("SPACETRACK_USERNAME", "")
        self.password = os.getenv("SPACETRACK_PASSWORD", "")
        self._session_cookie: Optional[str] = None
        self._authenticated = False
        self._last_auth: Optional[datetime] = None

    @property
    def is_configured(self) -> bool:
        """Check whether credentials are available."""
        return bool(self.username and self.password)

    async def authenticate(self) -> bool:
        """Authenticate with Space-Track.org and store session cookie."""
        if not self.is_configured:
            logger.warning(
                "SpaceTrack: credentials not configured. "
                "Set SPACETRACK_USERNAME and SPACETRACK_PASSWORD in .env"
            )
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    SPACETRACK_LOGIN,
                    data={
                        "identity": self.username,
                        "password": self.password,
                    },
                )
                if response.status_code == 200:
                    self._session_cookie = response.cookies.get("chocolatechip")
                    self._authenticated = True
                    self._last_auth = datetime.now(timezone.utc)
                    logger.info("SpaceTrack: authenticated successfully")
                    return True
                else:
                    logger.error(f"SpaceTrack: auth failed with status {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"SpaceTrack: auth error: {e}")
            return False

    async def query_gp_history(
        self,
        norad_id: int,
        start_date: str,
        end_date: str,
    ) -> list[dict]:
        """Query historical GP data for a satellite. Deferred to Phase 2."""
        if not self._authenticated:
            logger.warning("SpaceTrack: not authenticated — skipping query")
            return []

        # Architecture for Phase 2:
        # GET /basicspacedata/query/class/gp_history/NORAD_CAT_ID/{norad_id}/...
        logger.info(f"SpaceTrack: GP history query deferred to Phase 2")
        return []

    async def query_decay_predictions(self) -> list[dict]:
        """Query reentry/decay predictions. Deferred to Phase 2."""
        if not self._authenticated:
            return []
        logger.info("SpaceTrack: decay predictions deferred to Phase 2")
        return []

    def get_status(self) -> dict:
        """Return client status for monitoring."""
        return {
            "configured": self.is_configured,
            "authenticated": self._authenticated,
            "last_auth": self._last_auth,
            "source": "space-track.org",
            "phase": "deferred — Phase 2",
        }
