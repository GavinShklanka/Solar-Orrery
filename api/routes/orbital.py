"""
Orbital routes — Live satellite positions from TLE data.
"""
from fastapi import APIRouter, HTTPException
from state import scheduler

router = APIRouter()


@router.get("/satellites")
async def get_satellites(group: str = "active", limit: int = 500):
    """Get satellite TLE data for browser-side SGP4 propagation."""
    try:
        data = await scheduler.celestrak.fetch_tle_group(group)
        # Return subset with TLE lines for satellite.js
        satellites = data[:limit]
        return {
            "count": len(data),
            "returned": len(satellites),
            "group": group,
            "satellites": satellites,
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "source": "CelesTrak",
                "error": str(e),
                "last_known_timestamp": None,
            },
        )


@router.get("/satellites/{norad_id}")
async def get_satellite_by_id(norad_id: int):
    """Get a specific satellite by NORAD Catalog ID."""
    try:
        data = await scheduler.celestrak.fetch_tle_group("active")
        for sat in data:
            if sat.get("norad_cat_id") == norad_id:
                return sat
        raise HTTPException(status_code=404, detail=f"Satellite {norad_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/satellites/stations")
async def get_stations():
    """Get space stations (ISS, Tiangong, etc.)."""
    try:
        data = await scheduler.celestrak.fetch_stations()
        return {"count": len(data), "stations": data}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
