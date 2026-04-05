"""
Pydantic models for API response contracts.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SatelliteResponse(BaseModel):
    object_name: str
    norad_cat_id: Optional[int] = None
    epoch: str = ""
    mean_motion: float = 0.0
    eccentricity: float = 0.0
    inclination: float = 0.0
    ra_of_asc_node: float = 0.0
    arg_of_pericenter: float = 0.0
    mean_anomaly: float = 0.0
    bstar: float = 0.0
    classification_type: str = "U"
    tle_line1: str = ""
    tle_line2: str = ""


class KpIndexEntry(BaseModel):
    time_tag: Optional[str] = None
    kp: float = 0.0
    a_running: int = 0
    station_count: int = 0


class SolarWindMagEntry(BaseModel):
    time_tag: Optional[str] = None
    bx_gsm: Optional[float] = None
    by_gsm: Optional[float] = None
    bz_gsm: Optional[float] = None
    lon_gsm: Optional[float] = None
    lat_gsm: Optional[float] = None
    bt: Optional[float] = None


class SolarWindPlasmaEntry(BaseModel):
    time_tag: Optional[str] = None
    density: Optional[float] = None
    speed: Optional[float] = None
    temperature: Optional[float] = None


class CloseApproach(BaseModel):
    designation: str = ""
    fullname: str = ""
    close_approach_date: str = ""
    dist_au: Optional[float] = None
    dist_min_au: Optional[float] = None
    dist_max_au: Optional[float] = None
    v_rel_km_s: Optional[float] = None
    h_mag: Optional[float] = None
    diameter_km: Optional[float] = None
    dist_lunar: Optional[float] = None


class SentryObject(BaseModel):
    designation: str = ""
    fullname: str = ""
    impact_probability: Optional[float] = None
    palermo_scale_cum: Optional[float] = None
    palermo_scale_max: Optional[float] = None
    torino_scale_max: int = 0
    diameter_km: Optional[float] = None
    n_impacts: int = 0
    v_inf: Optional[float] = None
    h_mag: Optional[float] = None
    range: str = ""
    last_obs: str = ""


class APIError(BaseModel):
    source: str
    error: str
    last_known_timestamp: Optional[str] = None
