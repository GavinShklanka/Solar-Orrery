"""
GCAT Client — Jonathan McDowell's General Catalog of Artificial Space Objects.
CC-BY license. TSV format. Every orbital launch since Sputnik.
"""
import httpx
import csv
import io
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)

GCAT_LAUNCHLOG_URL = "https://planet4589.org/space/gcat/tsv/derived/launchlog.tsv"
GCAT_LV_URL = "https://planet4589.org/space/gcat/tsv/launch/lv.tsv"


class GCATClient:
    """Fetches and parses GCAT launch history data."""

    def __init__(self, timeout: float = 60.0):
        self.timeout = timeout
        self._launch_cache: Optional[list] = None
        self._lv_cache: Optional[list] = None
        self._last_fetch: dict[str, datetime] = {}
        self._errors: dict[str, str] = {}

    async def get_launch_history(self) -> list[dict]:
        """Fetch complete orbital launch history from GCAT."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    GCAT_LAUNCHLOG_URL,
                    headers={"User-Agent": "Vela/1.0"},
                )
                response.raise_for_status()
                text = response.text

                # Parse TSV
                reader = csv.reader(io.StringIO(text), delimiter="\t")
                rows = list(reader)

                if len(rows) < 2:
                    logger.warning("GCAT: launchlog appears empty")
                    return []

                # First row is headers
                headers = [h.strip().replace("#", "").strip() for h in rows[0]]
                launches = []
                for row in rows[1:]:
                    if len(row) >= len(headers):
                        entry = dict(zip(headers, [c.strip() for c in row]))
                        launches.append(entry)

                self._launch_cache = launches
                self._last_fetch["launchlog"] = datetime.now(timezone.utc)
                self._errors.pop("launchlog", None)
                logger.info(f"GCAT: parsed {len(launches)} launch records")
                return launches

        except Exception as e:
            logger.error(f"GCAT: error fetching launch history: {e}")
            self._errors["launchlog"] = str(e)
            return self._launch_cache or []

    async def get_launch_vehicles(self) -> list[dict]:
        """Fetch launch vehicle catalog."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    GCAT_LV_URL,
                    headers={"User-Agent": "Vela/1.0"},
                )
                response.raise_for_status()
                text = response.text

                reader = csv.reader(io.StringIO(text), delimiter="\t")
                rows = list(reader)

                if len(rows) < 2:
                    return []

                headers = [h.strip().replace("#", "").strip() for h in rows[0]]
                vehicles = []
                for row in rows[1:]:
                    if len(row) >= len(headers):
                        entry = dict(zip(headers, [c.strip() for c in row]))
                        vehicles.append(entry)

                self._lv_cache = vehicles
                self._last_fetch["lv"] = datetime.now(timezone.utc)
                logger.info(f"GCAT: parsed {len(vehicles)} launch vehicles")
                return vehicles

        except Exception as e:
            logger.error(f"GCAT: error fetching LV catalog: {e}")
            self._errors["lv"] = str(e)
            return self._lv_cache or []

    def get_status(self) -> dict:
        return {
            "source": "GCAT (Jonathan McDowell)",
            "launchlog": {
                "last_fetch": self._last_fetch.get("launchlog"),
                "cached_count": len(self._launch_cache) if self._launch_cache else 0,
                "error": self._errors.get("launchlog"),
            },
            "lv_catalog": {
                "last_fetch": self._last_fetch.get("lv"),
                "cached_count": len(self._lv_cache) if self._lv_cache else 0,
                "error": self._errors.get("lv"),
            },
        }
