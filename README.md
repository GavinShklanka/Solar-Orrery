# Vela Space Analytics

A comprehensive, operational-grade space domain awareness and space weather forecasting platform.

**Rationale for the name "Vela":** The platform is named in honor of the Vela satellite network (1963–1984), a group of satellites originally developed to monitor compliance with the 1963 Partial Test Ban Treaty by detecting nuclear detonations in space. Through their continuous monitoring, the Vela satellites inadvertently made the first discoveries of cosmic gamma-ray bursts, demonstrating how operational intelligence systems often yield profound scientific value.

---

## Architecture

```text
 [ Live External APIs ]
    |      |      |
    v      v      v
+------------------------+
|   Ingestion Layer      | (CelesTrak, NOAA, JPL Sentry, GCAT, UCS, CCMC)
+------------------------+
            |
            v
+------------------------+
|   Processing Layer     | (Data cleaning, TLE parsing, crosswalking, aggregation)
+------------------------+
            |
            v
+------------------------+
|    Modeling Layer      | (Feature engineering, LightGBM Kp forecasting)
+------------------------+
            |
            v
+------------------------+
|      FastAPI           | (REST endpoints, background schedulers, caching)
+------------------------+
            |
            v
+------------------------+
|   React Dashboard      | (Vite, CesiumJS globe, Recharts, interactive UI)
+------------------------+
```

---

## Data Sources

| Source | URL | Data Provided | Auth Required | Update Cadence |
|--------|-----|---------------|---------------|----------------|
| **CelesTrak** | celestrak.org | Satellite orbital elements (GP/TLE) | No | ~3x Daily |
| **NOAA SWPC** | swpc.noaa.gov | Kp index, solar wind, space weather scales | No | Minutely/Hourly |
| **NASA DONKI** | ccmc.gsfc.nasa.gov | Coronal Mass Ejections, Flares, Storms | API Key | Daily |
| **NASA JPL Sentry-II** | ssd.jpl.nasa.gov | NEO close approaches, impact probabilities | No | Daily |
| **NASA OMNIWeb** | spdf.gsfc.nasa.gov | Historical solar wind parameters (1996-2025) | No | Yearly updates |
| **UCS Database** | ucsusa.org | Satellite operator classification, mass, purpose | No | Periodic (May 2023) |
| **GCAT** | planet4589.org | Comprehensive orbital launch history | No | Monthly |
| **Launch Library 2** | thespacedevs.com | Upcoming launch schedules | No | Daily |

*Note: The platform integrates 9 major data streams to provide a unified operational picture.*

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup
1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\\Scripts\\activate` on Windows
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables (create a `.env` file in the project root):
   ```
   NASA_API_KEY=your_api_key_here  # Get from api.nasa.gov
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn vela.api.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup
1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Set up frontend environment variables (create a `.env` file in the `dashboard` directory):
   ```
   VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:5173`.

### What to expect on first load
When you first start the application, the backend will immediately begin fetching live data from upstream providers (CelesTrak, NOAA, JPL). Some panels (like the Globe and Space Weather) will populate within 2-3 seconds, while comprehensive aggregations (like the complete UCS crosswalk for geopolitical analysis) may take 10-15 seconds to fully compile. Once cached, subsequent reloads are near-instantaneous.

---

## Dashboard Views

**Globe View (Orbital Operations)**
A real-time 3D visualization of Earth rendering over 7,500 active satellites using CesiumJS. Satellite positions are propagated using SGP4 approximations from TLE data. The HUD overlay displays the current tracked object count, latest Kp index, and live solar wind speed.

**Geopolitical Map (Strategic Context)**
Visualizes the historical and current state of space operations. It features a historical launch cadence chart correctly clustering discrete orbital launches, demonstrating the geopolitical shift from government dominance (USA/USSR) to the current era. It includes the UCS Satellite Database crosswalk, proving the modern landscape is overwhelmingly commercial (80.4%).

**Forecast Panel (Space Weather)**
Displays the current observed Kp index, NOAA's operational 3-day forecast, and Vela's proprietary machine learning forecast model. It provides clear operations impact assessments for satellite drag, GPS accuracy, HF radio, and power grid stability based on the G-scale mapping.

**NEO Monitor (Planetary Defense)**
Tracks Near-Earth Objects (NEOs) utilizing data from JPL Sentry-II. It presents upcoming close approaches, filtering out routine debris to highlight significant objects. It incorporates the Torino and Palermo impact hazard scales for proper risk contextualization.

**Mission Replay (Historical Milestones)**
A curated timeline of pivotal moments in space history, replacing routine granular launches with significant events (e.g., Sputnik, Apollo 11, JWST). This provides narrative context to the rapid acceleration of space exploration over the decades.

---

## Forecast Model

Vela features a proprietary forecasting model to predict the geomagnetic Kp index up to 72 hours in advance based on upstream solar wind parameters.

- **Training Data:** NASA OMNI2 hourly solar wind data (262,992 records).
- **Train Period:** Solar Cycles 23 and 24 (1996-01-28 to 2019-12-31).
- **Test Period:** Solar Cycle 25 (2020-01-01 to 2025-12-31).
- **Features:** 30 engineered features, including Newell coupling, Bz/speed/Kp temporal lags (1h-24h), 27-day Carrington recurrence, and solar cycle fractional phase.
- **Validation Results:**
  - **Test RMSE (3-hour horizon):** 0.77
  - **Storm Detection F1 (Kp ≥ 5):** 0.55
  - **Skill Score:** 0.206 (20.7% improvement over naive persistence)
- **Benchmarks:** The model serves as an analytical baseline. A strictly evaluated persistence model yields an RMSE of 0.86. Current state-of-the-art neural network ensembles achieve approximately 0.64 RMSE.

### Claim Boundaries
The model **MAY claim** that it improves upon naive persistence by a validated 20.7% and achieves an F1 > 0.50 for storm detection on an unobserved Solar Cycle.
The model **MAY NOT claim** that it is an operational space weather warning system (refer to NOAA SWPC for official alerts) or that it meets the 0.64 published NN benchmark.

For full validation metrics, please refer to the `validation/claim_registry.md` and the static `validation/kp_validation_report.html`.

---

## Known Limitations

- **TLE Positional Uncertainty:** Satellite positions rendered on the globe use SGP4 propagations from TLEs. These are approximate and possess inherent positional uncertainty; they are not exact real-time GPS coordinates and cannot be used for precise conjunction analysis.
- **Forecast Model Gap:** The LightGBM baseline model achieves an RMSE of 0.77, which leaves a gap compared to the published neural network benchmark of 0.64. This is an expected limitation of single tree-based regressors for sequence prediction.
- **UCS Database Recency:** The Union of Concerned Scientists (UCS) Satellite Database was last updated in May 2023. The geopolitical ratios (80.4% commercial) reflect that snapshot in time.
- **CelesTrak Active Group Workaround:** Due to API changes, fetching the absolute 'active' group from CelesTrak sometimes fails or yields 403 Forbidden. The platform mitigates this by fetching overlapping named groups (e.g., 'last-30-days', constellation names) to build a representative active catalog.
- **Conjunction Data:** High-fidelity conjunction data (CDMs) is not publicly accessible without operator credentials (e.g., Space-Track). Vela visualizes orbital density rather than literal collision risks.
- **Cesium Globe Imagery:** A Cesium Ion token (`VITE_CESIUM_ION_TOKEN` in `.env`) is required to load high-resolution NASA Blue Marble Next Generation imagery. Without a token, the platform falls back to offline, low-resolution `NaturalEarthII` built-in textures to ensure the globe remains visible rather than rendering as a dark sphere.

---

## Portfolio Context

For technical reviewers: Vela was built to demonstrate full-stack data integrity and the transition from raw telemetry to operational intelligence. Analytical rigor was prioritized over superficial metrics. The UCS crosswalk was implemented to derive true commercialization ratios rather than hardcoding fabricated data. The Kp forecast model was explicitly evaluated on a strict temporal split (Solar Cycle 25) without target leakage, and a calibrated detection threshold (4.6) was used to maximize storm F1 given the Huber-loss model's tendency to underpredict extremes. The integration focuses on gracefully handling upstream API volatility (CelesTrak blocks, DONKI rate limits) using Redis-like memory caches, while the React UI parses complex geodetic and space weather arrays into scannable, policy-ready formats without sacrificing analytical honesty.
