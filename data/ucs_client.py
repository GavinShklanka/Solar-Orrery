"""
UCS Satellite Database Client — Commercial vs. government payload classification.
Requires manual CSV download from https://www.ucs.org/resources/satellite-database
Place file at vela/data/ucs_satellite_database.csv

If the file is absent, the geopolitical module degrades gracefully.
"""
import csv
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

DEFAULT_PATH = Path(__file__).parent.parent / "data" / "ucs_satellite_database.csv"


class UCSClient:
    """Reads and parses the UCS Satellite Database from local CSV."""

    def __init__(self, csv_path: Optional[str] = None):
        self.csv_path = Path(csv_path) if csv_path else DEFAULT_PATH
        self._data: Optional[list] = None
        self._available = False

    @property
    def is_available(self) -> bool:
        """Check if the UCS database file exists."""
        return self.csv_path.exists()

    def load(self) -> list[dict]:
        """Load and parse the UCS database."""
        if not self.is_available:
            logger.warning(
                f"UCS: database not found at {self.csv_path}. "
                "Download from https://www.ucs.org/resources/satellite-database "
                "and place CSV at vela/data/ucs_satellite_database.csv"
            )
            self._available = False
            return []

        try:
            with open(self.csv_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                self._data = list(reader)
                self._available = True
                logger.info(f"UCS: loaded {len(self._data)} satellite records")
                return self._data
        except Exception as e:
            logger.error(f"UCS: error reading database: {e}")
            self._available = False
            return []

    def get_satellites_by_user(self) -> dict[str, int]:
        """Aggregate satellites by user type (Civil/Commercial/Government/Military)."""
        if not self._data:
            self.load()
        if not self._data:
            return {}

        counts: dict[str, int] = {}
        for sat in self._data:
            user = sat.get("Users", "Unknown").strip()
            counts[user] = counts.get(user, 0) + 1
        return counts

    def get_satellites_by_country(self) -> dict[str, int]:
        """Aggregate satellites by country of operator."""
        if not self._data:
            self.load()
        if not self._data:
            return {}

        counts: dict[str, int] = {}
        for sat in self._data:
            country = sat.get("Country of Operator/Owner", "Unknown").strip()
            counts[country] = counts.get(country, 0) + 1
        return counts

    def get_status(self) -> dict:
        return {
            "source": "UCS Satellite Database",
            "path": str(self.csv_path),
            "available": self.is_available,
            "record_count": len(self._data) if self._data else 0,
            "note": "Download from https://www.ucs.org/resources/satellite-database"
            if not self.is_available
            else "Loaded",
        }
