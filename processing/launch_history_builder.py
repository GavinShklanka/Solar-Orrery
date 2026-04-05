import logging
from collections import defaultdict
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Normalize GCAT state codes to standardized geopolitical entities
STATE_MAPPING = {
    "US": "USA",
    "RU": "Russia/USSR",
    "SU": "Russia/USSR",
    "CN": "China",
    "PRC": "China",
    "F": "Europe",
    "ESA": "Europe",
    "IT": "Europe",
    "D": "Europe",
    "UK": "Europe",
    "IN": "India",
    "JP": "Japan",
}

# Known commercial actors in GCAT for fallback classification
COMMERCIAL_ACTORS = {
    "SpaceX", "SPX", "Planet", "Spire", "OneWeb", "Iridium", 
    "O3b", "Maxar", "DigitalGlobe", "RocketLab", "RL", "Virgin"
}

class LaunchHistoryBuilder:
    """
    Processes and merges historical space flight data to supply
    the Geopolitical and Mission Replay views.
    """

    def __init__(self, gcat_client, ll2_client, ucs_client):
        self.gcat = gcat_client
        self.ll2 = ll2_client
        self.ucs = ucs_client
        
        self.geopolitical_cache = None
        self.timeline_cache = None

    async def build(self) -> bool:
        """Fetch upstream data and rebuild derived caches."""
        launches = await self.gcat.get_launch_history()
        if not launches:
            logger.warning("HistoryBuilder: No GCAT launches available.")
            return False
            
        self._build_geopolitical_series(launches)
        self._build_mission_timeline(launches)
        
        # Merge UCS data if available for advanced commercial vs gov breakdown
        if self.ucs.is_available:
            self._apply_ucs_classification()
            
        return True

    def _build_geopolitical_series(self, launches: List[Dict]):
        """Aggregates launches by nation and year, counting discrete launch events."""
        nation_yearly = defaultdict(lambda: defaultdict(int))
        nation_totals = defaultdict(int)
        
        seen_flights = set()
        
        for launch in launches:
            # Cluster by LVState + Launch_Date to properly count discrete launch events (not payloads)
            raw_state = launch.get("LVState", "") or launch.get("SatState", "Unknown")
            date_str = launch.get("Launch_Date", "")
            
            cluster_key = f"{raw_state}_{date_str}"
            if cluster_key in seen_flights:
                continue
            seen_flights.add(cluster_key)

            # Parse Year
            date_str = launch.get("Launch_Date", "")
            if len(date_str) < 4:
                continue
            year = date_str[:4]
            if not year.isdigit():
                continue
                
            # Parse Nation: Primary attribution is Launch Vehicle State (the provider), fallback to SatState
            raw_state = launch.get("LVState", "") or launch.get("SatState", "Unknown")
            nation = STATE_MAPPING.get(raw_state, "Other")
            
            nation_yearly[nation][year] += 1
            nation_totals[nation] += 1

        # Format for frontend
        series = []
        for nation, years_data in nation_yearly.items():
            series.append({
                "id": nation,
                "data": [{"x": str(y), "y": c} for y, c in sorted(years_data.items()) if int(y) > 1956]
            })
            
        # Leave commercial vs gov classifications empty until UCS is parsed
        commercial_gov_series = []

        self.geopolitical_cache = {
            "nations_series": series,
            "nations_totals": dict(nation_totals),
            "commercial_vs_gov": commercial_gov_series,
            "status": "Ready"
        }
        logger.info("HistoryBuilder: Geopolitical series built.")

    def _build_mission_timeline(self, launches: List[Dict]):
        """Creates chronological event timeline for Mission Replay."""
        timeline = []
        for l in launches:
            date = l.get("Launch_Date", "")
            if not date or len(date) < 4:
                continue
            
            # Only track significant or recognizable missions for the timeline to avoid sending 30k objects
            # We'll filter to 1 per month or significant tags to keep the UI snappy, 
            # or we send down a reduced decimation.
            timeline.append({
                "id": l.get("Launch_Tag"),
                "date": date,
                "name": l.get("PLName", "Unknown"),
                "nation": STATE_MAPPING.get(l.get("SatState"), "Other"),
                "vehicle": l.get("LV_Type", "")
            })
            
        # Optional: decimate timeline or sort
        timeline.sort(key=lambda x: x["date"])
        
        self.timeline_cache = {
            "events": timeline[-500:], # Last 500 for phase 1 efficiency
            "total_recorded": len(timeline)
        }
        logger.info("HistoryBuilder: Mission timeline built.")

    def _apply_ucs_classification(self):
        """Crosswalks UCS Database for rigorous civil/commercial/military counts."""
        self.ucs.load()
        if not self.ucs.is_available or not self.ucs._data or not self.gcat._launch_cache:
            return

        ucs_sats = self.ucs._data
        ucs_map = {}
        
        # Build payload-to-launch crosswalk
        for sat in ucs_sats:
            cospar = str(sat.get("COSPAR Number", "")).strip()
            launch_id = cospar[:8] if len(cospar) >= 8 else cospar
            # Primary user split by '/' (e.g. Commercial/Military -> Commercial)
            user = str(sat.get("Users", "Unknown")).split("/")[0].strip()
            ucs_map[launch_id] = user

        yearly_counts = defaultdict(lambda: {"Commercial": 0, "Government": 0, "Military": 0, "Civil": 0})
        seen_flights = set()
        
        # Apply crosswalk overlay
        for launch in self.gcat._launch_cache:
            year = launch.get("Launch_Date", "")[:4]
            if not year.isdigit():
                continue
                
            raw_state = launch.get("LVState", "") or launch.get("SatState", "Unknown")
            cluster_key = f"{raw_state}_{launch.get('Launch_Date', '')}"
            if cluster_key in seen_flights:
                continue
            seen_flights.add(cluster_key)
            
            launch_id = launch.get("Launch_Tag", "")
            if launch_id in ucs_map:
                user = ucs_map[launch_id]
            else:
                pl_name = launch.get("PLName", "")
                is_comm = any(c.lower() in pl_name.lower() for c in COMMERCIAL_ACTORS)
                user = "Commercial" if is_comm else "Government"
                
            if user in ["Commercial", "Government", "Military", "Civil"]:
                yearly_counts[year][user] += 1
            else:
                yearly_counts[year]["Government"] += 1

        series = []
        for cat in ["Commercial", "Government", "Military", "Civil"]:
            series.append({
                "id": cat,
                "data": [{"x": y, "y": yearly_counts[y][cat]} for y in sorted(yearly_counts.keys())]
            })

        self.geopolitical_cache["commercial_vs_gov"] = series
        self.geopolitical_cache["ucs_applied"] = True

    def get_geopolitical_data(self) -> Dict:
        return self.geopolitical_cache or {"status": "Building"}
        
    def get_timeline_data(self) -> Dict:
        return self.timeline_cache or {"status": "Building"}
