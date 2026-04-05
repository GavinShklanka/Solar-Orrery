"""
Missions routes — Historical mission replay and deep-space trajectories.
Phase 1: Stub endpoints. Full implementation in Phase 2.
"""
from fastapi import APIRouter
from state import scheduler

router = APIRouter()

@router.get("/missions/deep-space")
async def get_deep_space_missions():
    """Get deep-space mission data (Phase 2 — architecture ready)."""
    return {
        "status": "Phase 2 — coming soon",
        "missions": [
            {"key": "voyager_1", "name": "Voyager 1", "status": "interstellar space"},
            {"key": "voyager_2", "name": "Voyager 2", "status": "interstellar space"},
            {"key": "new_horizons", "name": "New Horizons", "status": "Kuiper Belt"},
            {"key": "jwst", "name": "James Webb Space Telescope", "status": "L2 halo orbit"},
            {"key": "pioneer_10", "name": "Pioneer 10", "status": "signal lost 2003"},
            {"key": "pioneer_11", "name": "Pioneer 11", "status": "signal lost 1995"},
        ],
        "note": "Full trajectory data from JPL Horizons will be available in Phase 2.",
    }


@router.get("/missions/timeline")
async def get_mission_timeline():
    """Get historical mission timeline events from GCAT."""
    return scheduler.launch_history.get_timeline_data()
