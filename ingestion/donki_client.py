"""
NASA DONKI Client — CME, Geomagnetic Storm, and Solar Flare event catalog.
No API key required on CCMC endpoint.
"""
import httpx
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

logger = logging.getLogger(__name__)

DONKI_BASE = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get"


class DONKIClient:
    """Fetches CME, GST, and FLR data from NASA DONKI."""

    def __init__(self, timeout: float = 20.0):
        self.timeout = timeout
        self._cache: dict = {}
        self._last_fetch: dict[str, datetime] = {}
        self._errors: dict[str, str] = {}

    async def _fetch(self, event_type: str, start_date: str, end_date: str) -> list:
        """Generic DONKI event fetcher."""
        url = f"{DONKI_BASE}/{event_type}"
        params = {"startDate": start_date, "endDate": end_date}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                if data is None:
                    data = []
                self._cache[event_type] = data
                self._last_fetch[event_type] = datetime.now(timezone.utc)
                self._errors.pop(event_type, None)
                return data
        except Exception as e:
            logger.error(f"DONKI: error fetching {event_type}: {e}")
            self._errors[event_type] = str(e)
            return self._cache.get(event_type, [])

    async def get_cme_events(self, days_back: int = 30) -> list[dict]:
        """Fetch Coronal Mass Ejection events."""
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days_back)
        data = await self._fetch(
            "CME",
            start.strftime("%Y-%m-%d"),
            end.strftime("%Y-%m-%d"),
        )

        events = []
        for cme in data:
            event = {
                "activity_id": cme.get("activityID", ""),
                "start_time": cme.get("startTime", ""),
                "source_location": cme.get("sourceLocation", ""),
                "note": cme.get("note", ""),
                "catalog": cme.get("catalog", ""),
            }
            # Extract ENLIL analysis if available
            analyses = cme.get("cmeAnalyses", [])
            if analyses:
                a = analyses[0]
                event["speed_km_s"] = a.get("speed")
                event["half_angle"] = a.get("halfAngle")
                event["latitude"] = a.get("latitude")
                event["longitude"] = a.get("longitude")
                event["is_earth_directed"] = a.get("isMostAccurate", False)
            events.append(event)

        logger.info(f"DONKI: fetched {len(events)} CME events")
        return events

    async def get_geomagnetic_storms(self, days_back: int = 30) -> list[dict]:
        """Fetch Geomagnetic Storm events with Kp data."""
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days_back)
        data = await self._fetch(
            "GST",
            start.strftime("%Y-%m-%d"),
            end.strftime("%Y-%m-%d"),
        )

        storms = []
        for gst in data:
            storm = {
                "gst_id": gst.get("gstID", ""),
                "start_time": gst.get("startTime", ""),
            }
            kp_indices = gst.get("allKpIndex", [])
            if kp_indices:
                storm["kp_values"] = [
                    {
                        "observed_time": kp.get("observedTime", ""),
                        "kp_index": kp.get("kpIndex"),
                        "source": kp.get("source", ""),
                    }
                    for kp in kp_indices
                ]
                storm["max_kp"] = max(
                    (kp.get("kpIndex", 0) for kp in kp_indices), default=0
                )
            storms.append(storm)

        logger.info(f"DONKI: fetched {len(storms)} geomagnetic storms")
        return storms

    async def get_solar_flares(self, days_back: int = 30) -> list[dict]:
        """Fetch Solar Flare events."""
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days_back)
        data = await self._fetch(
            "FLR",
            start.strftime("%Y-%m-%d"),
            end.strftime("%Y-%m-%d"),
        )

        flares = []
        for flr in data:
            flares.append({
                "flr_id": flr.get("flrID", ""),
                "begin_time": flr.get("beginTime", ""),
                "peak_time": flr.get("peakTime", ""),
                "end_time": flr.get("endTime", ""),
                "class_type": flr.get("classType", ""),
                "source_location": flr.get("sourceLocation", ""),
                "active_region": flr.get("activeRegionNum"),
            })

        logger.info(f"DONKI: fetched {len(flares)} solar flares")
        return flares

    def get_status(self) -> dict:
        return {
            "source": "NASA DONKI (CCMC)",
            "events": {
                key: {
                    "last_fetch": self._last_fetch.get(key),
                    "cached_count": len(self._cache.get(key, [])),
                    "error": self._errors.get(key),
                }
                for key in ["CME", "GST", "FLR"]
            },
        }
