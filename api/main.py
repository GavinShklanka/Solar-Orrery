"""
Vela API — FastAPI backend for space operations analytics.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import orbital, forecast, neo, missions, geopolitical
from state import scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: fetch initial data from all sources."""
    logger.info("Vela API starting — initiating data fetch...")
    await scheduler.initial_fetch()
    logger.info("Vela API ready — all data sources loaded")
    yield
    logger.info("Vela API shutting down")


app = FastAPI(
    title="Vela — Space Operations Analytics API",
    description=(
        "Live intelligence platform for orbital monitoring, space weather forecasting, "
        "NEO tracking, and geopolitical space power analysis."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow dashboard frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(orbital.router, prefix="/api/v1", tags=["Orbital"])
app.include_router(forecast.router, prefix="/api/v1", tags=["Forecast"])
app.include_router(neo.router, prefix="/api/v1", tags=["NEO"])
app.include_router(missions.router, prefix="/api/v1", tags=["Missions"])
app.include_router(geopolitical.router, prefix="/api/v1", tags=["Geopolitical"])


@app.get("/api/v1/status", tags=["System"])
async def get_system_status():
    """Return status of all data sources."""
    return scheduler.get_all_status()

# ─── FRONTEND SPA FALLBACK ────────────────────────────────────────────────────
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

static_dir = Path(__file__).resolve().parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Ignore api routes
        if full_path.startswith("api/"):
            return {"error": "Not found"}

        # Serve requested file if it exists (e.g. favicon.ico, data.csv)
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)

        # Fallback to index.html for React Router
        return FileResponse(static_dir / "index.html")
else:
    @app.get("/", tags=["System"])
    async def root():
        return {
            "name": "Vela",
            "version": "1.0.0",
            "description": "Space Operations Analytics API (Static missing)",
            "docs": "/docs",
        }
