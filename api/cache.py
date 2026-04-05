"""
In-memory TTL cache for rate-limit compliance.
"""
from datetime import datetime, timezone, timedelta
from typing import Any, Optional


class TTLCache:
    """Simple in-memory cache with per-key TTL."""

    def __init__(self):
        self._store: dict[str, dict] = {}

    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired."""
        if key not in self._store:
            return None
        entry = self._store[key]
        if datetime.now(timezone.utc) > entry["expires"]:
            del self._store[key]
            return None
        return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set value with TTL in seconds."""
        self._store[key] = {
            "value": value,
            "expires": datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds),
            "stored_at": datetime.now(timezone.utc),
        }

    def invalidate(self, key: str):
        """Remove a cached entry."""
        self._store.pop(key, None)

    def status(self) -> dict:
        """Return cache status."""
        now = datetime.now(timezone.utc)
        return {
            key: {
                "stored_at": entry["stored_at"].isoformat(),
                "expires": entry["expires"].isoformat(),
                "expired": now > entry["expires"],
            }
            for key, entry in self._store.items()
        }


# Global cache instance
cache = TTLCache()
