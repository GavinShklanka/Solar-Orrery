"""
Geopolitical routes — Nation power index, launch history, payload ownership.
Phase 1: Stub endpoints. Full implementation in Phase 2.
"""
from fastapi import APIRouter
from api.state import scheduler

router = APIRouter()


@router.get("/geopolitical/launches")
async def get_launch_data():
    """Get summarized geopolitical launch history from GCAT."""
    return scheduler.launch_history.get_geopolitical_data()

@router.get("/geopolitical/nations")
async def get_nation_data():
    """Get space power index by nation (Uses UCS crosswalk)."""
    return scheduler.launch_history.get_geopolitical_data()
