"""
NEO routes — Close approach calendar and Sentry impact probabilities.
"""
from fastapi import APIRouter, HTTPException
from api.state import scheduler

router = APIRouter()


@router.get("/neo/upcoming")
async def get_upcoming_approaches(dist_max: float = 0.05):
    """Get upcoming NEO close approaches within specified AU distance."""
    try:
        data = await scheduler.cneos.get_close_approaches(dist_max=dist_max)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "source": "NASA CNEOS",
                "error": str(e),
                "last_known_timestamp": None,
            },
        )


@router.get("/neo/sentry")
async def get_sentry_objects():
    """Get Sentry-monitored objects with impact probabilities.

    Source: NASA JPL Sentry-II.
    Vela surfaces JPL's authoritative probability computations;
    it does not independently compute impact risk.
    """
    try:
        data = await scheduler.cneos.get_sentry_objects()
        data["attribution"] = (
            "Impact probabilities sourced from NASA JPL Sentry-II. "
            "Vela does not independently compute orbital uncertainty."
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
