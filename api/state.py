"""
Shared application state for Vela API.
Avoids circular imports between main.py and route modules.
"""
from ingestion.scheduler import DataScheduler

# Global scheduler instance — initialized once, shared across all routes
scheduler = DataScheduler()
