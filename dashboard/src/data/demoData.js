/**
 * demoData.js — Fallback data for GitHub Pages static deployment
 * 
 * All shapes match exactly what each component expects from the API.
 * Values are realistic snapshots inspired by real data.
 */

// ─── Satellite Data (consumed by Globe.jsx) ──────────────────────────────────
// Globe reads: satData.satellites[].mean_motion
export const DEMO_SATELLITES = {
  satellites: Array.from({ length: 200 }, (_, i) => ({
    norad_cat_id: 25544 + i,
    object_name: ['ISS', 'STARLINK-1007', 'GPS BIIR-2', 'GOES 16', 'COSMOS 2251'][i % 5],
    mean_motion: [15.5, 15.1, 2.0, 1.0027, 14.8][i % 5],
    inclination: [51.6, 53.0, 55.0, 0.1, 82.5][i % 5],
    eccentricity: 0.0001,
    epoch: new Date().toISOString(),
  })),
};

// ─── Solar Wind Mag (consumed by SpaceWeather.jsx) ───────────────────────────
// SpaceWeather reads: magData.data[].bz_gsm, bt, bx_gsm, by_gsm, time_tag
export const DEMO_SOLAR_WIND_MAG = {
  data: Array.from({ length: 24 }, (_, i) => ({
    time_tag: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    bz_gsm: [-3.2, -1.5, 0.8, -2.1, 1.3, -0.9, -4.1, 2.2, -1.7, 0.5, -3.8, 1.1,
             -2.5, 0.3, -1.2, -5.3, 2.8, -0.4, 1.6, -2.9, 0.7, -1.8, -3.2, -2.1][i],
    bt: [6.1, 4.8, 3.2, 5.5, 4.1, 3.7, 7.2, 5.0, 4.3, 3.1, 6.8, 4.5,
         5.2, 3.5, 4.0, 8.1, 5.8, 3.3, 4.6, 6.0, 3.9, 4.7, 6.1, 5.3][i],
    bx_gsm: [2.1, 1.5, -0.8, 2.3, -1.1, 0.6, 3.2, -1.8, 1.2, -0.3, 2.8, -0.9,
             1.7, -0.5, 0.9, 3.5, -2.0, 0.4, -1.3, 2.4, -0.7, 1.4, 2.1, 1.8][i],
    by_gsm: [-4.3, -3.2, 2.1, -3.8, 2.5, -1.7, -5.1, 3.3, -2.4, 1.2, -4.7, 2.8,
             -3.5, 1.8, -2.1, -5.8, 3.6, -1.0, 2.7, -4.0, 1.5, -2.6, -4.3, -3.1][i],
  })),
  source: 'NOAA SWPC (demo)',
};

// ─── Solar Wind Plasma (consumed by SpaceWeather.jsx) ────────────────────────
// SpaceWeather reads: plasmaData.data[].speed, density, temperature
export const DEMO_SOLAR_WIND_PLASMA = {
  data: Array.from({ length: 24 }, (_, i) => ({
    time_tag: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    speed: [423, 415, 432, 418, 440, 428, 412, 445, 435, 421, 430, 425,
            438, 419, 427, 450, 442, 416, 433, 422, 436, 429, 423, 431][i],
    density: [5.8, 6.2, 4.9, 5.5, 7.1, 5.3, 6.8, 4.5, 5.9, 6.4, 5.1, 5.7,
              6.0, 5.4, 6.6, 4.8, 5.2, 6.3, 5.6, 5.0, 6.1, 5.8, 5.8, 5.5][i],
    temperature: [120000, 115000, 135000, 125000, 140000, 118000, 128000, 145000,
                  132000, 122000, 138000, 126000, 130000, 119000, 133000, 148000,
                  136000, 117000, 129000, 124000, 137000, 127000, 120000, 131000][i],
  })),
  source: 'NOAA SWPC (demo)',
};

// ─── Kp Current (consumed by SpaceWeather + ForecastPanel) ───────────────────
// Both read: kpData.kp_values[].kp, time_tag
export const DEMO_KP_CURRENT = {
  kp_values: Array.from({ length: 24 }, (_, i) => ({
    time_tag: new Date(Date.now() - (23 - i) * 3 * 3600000).toISOString(),
    kp: [1.0, 1.3, 1.7, 2.0, 2.3, 1.7, 1.3, 2.0, 2.7, 3.0, 3.3, 2.7,
         2.3, 2.0, 1.7, 1.3, 1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 2.33][i],
  })),
  source: 'NOAA SWPC (demo)',
};

// ─── Kp Forecast (consumed by ForecastPanel) ─────────────────────────────────
// ForecastPanel reads: kpForecast.forecast[].kp
export const DEMO_KP_FORECAST = {
  forecast: Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() + i * 3 * 3600000).toISOString(),
    kp: [2.0, 2.3, 2.7, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.7, 2.0, 2.3,
         2.7, 3.0, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 2.0, 2.3, 2.7, 2.5][i],
    source: 'noaa',
  })),
};

// ─── Vela Forecast (consumed by ForecastPanel) ───────────────────────────────
// ForecastPanel reads: velaForecast.predictions.{3h,12h,24h,72h}.kp_predicted/p10/p90
// Also reads: velaForecast.test_rmse, velaForecast.storm_f1
export const DEMO_VELA_FORECAST = {
  predictions: {
    '3h':  { kp_predicted: 2.4, p10: 1.8, p90: 3.1, g_scale: 'G0' },
    '12h': { kp_predicted: 2.8, p10: 1.9, p90: 3.8, g_scale: 'G0' },
    '24h': { kp_predicted: 3.1, p10: 2.0, p90: 4.5, g_scale: 'G1' },
    '72h': { kp_predicted: 2.5, p10: 1.5, p90: 4.0, g_scale: 'G0' },
  },
  model_version: 'kp_baseline_lgbm_v1',
  last_trained: '2025-12-31',
  test_rmse: '0.77',
  storm_f1: '0.553',
  skill_score: 0.2065,
};

// ─── Solar Wind Current (consumed by useAPI) ─────────────────────────────────
export const DEMO_SOLAR_WIND_CURRENT = {
  bz: -3.2,
  speed: 423,
  density: 5.8,
  bt: 6.1,
  bx: 2.1,
  by: -4.3,
  time_tag: new Date().toISOString(),
  source: 'NOAA SWPC (demo)',
};

// ─── NEO Upcoming (consumed by NEOPanel) ─────────────────────────────────────
// NEOPanel reads: neoData.approaches[].fullname/designation/close_approach_date/
//                 dist_lunar/v_rel_km_s/h_mag/dist_au + neoData.count
export const DEMO_NEO_UPCOMING = {
  count: 6,
  approaches: [
    { fullname: '2024 YR4', designation: '2024 YR4', close_approach_date: '2032-12-22T00:00:00', dist_au: 0.0027, dist_lunar: 1.05, v_rel_km_s: 17.2, h_mag: 26.0 },
    { fullname: '2020 XR', designation: '2020 XR', close_approach_date: '2028-01-15T00:00:00', dist_au: 0.012, dist_lunar: 4.67, v_rel_km_s: 12.8, h_mag: 27.5 },
    { fullname: '99942 Apophis', designation: '99942 Apophis', close_approach_date: '2029-04-13T00:00:00', dist_au: 0.00025, dist_lunar: 0.1, v_rel_km_s: 7.4, h_mag: 19.7 },
    { fullname: '2023 DW', designation: '2023 DW', close_approach_date: '2046-02-14T00:00:00', dist_au: 0.0005, dist_lunar: 0.19, v_rel_km_s: 24.6, h_mag: 26.2 },
    { fullname: '2024 ON', designation: '2024 ON', close_approach_date: '2037-09-01T00:00:00', dist_au: 0.008, dist_lunar: 3.11, v_rel_km_s: 19.3, h_mag: 22.8 },
    { fullname: '2021 QM1', designation: '2021 QM1', close_approach_date: '2052-04-02T00:00:00', dist_au: 0.0003, dist_lunar: 0.12, v_rel_km_s: 14.1, h_mag: 25.1 },
  ],
  source: 'NASA JPL CNEOS (demo)',
};

// ─── Sentry Data (consumed by NEOPanel) ──────────────────────────────────────
// NEOPanel reads: sentryData.objects[].fullname/designation/impact_probability/
//                 palermo_scale_cum/torino_scale_max/diameter_km/n_impacts/range + sentryData.count
export const DEMO_SENTRY = {
  count: 3,
  objects: [
    { fullname: '2024 YR4', designation: '2024 YR4', impact_probability: 1.2e-4, palermo_scale_cum: -1.45, torino_scale_max: 1, diameter_km: 0.065, n_impacts: 3, range: '2032-2042', last_obs: '2025-01-15', v_inf: 17.2 },
    { fullname: '99942 Apophis', designation: '99942 Apophis', impact_probability: 4.5e-10, palermo_scale_cum: -2.8, torino_scale_max: 0, diameter_km: 0.340, n_impacts: 1, range: '2029', last_obs: '2021-03-09', v_inf: 7.4 },
    { fullname: '2023 DW', designation: '2023 DW', impact_probability: 2.1e-7, palermo_scale_cum: -3.9, torino_scale_max: 0, diameter_km: 0.055, n_impacts: 2, range: '2046-2048', last_obs: '2023-03-01', v_inf: 24.6 },
  ],
  source: 'NASA Sentry-II (demo)',
};

// ─── DONKI CME (consumed by SpaceWeather) ────────────────────────────────────
// SpaceWeather reads: cmeData.count
export const DEMO_DONKI_CME = {
  count: 2,
  events: [
    { type: 'CME', time: '2026-04-03T14:22:00Z', speed_kms: 620, note: 'Partial halo, Earth-directed component unlikely' },
    { type: 'CME', time: '2026-04-01T08:15:00Z', speed_kms: 450, note: 'Narrow, away from Earth' },
  ],
};

// ─── DONKI Flares (consumed by SpaceWeather) ─────────────────────────────────
export const DEMO_DONKI_FLARES = {
  count: 3,
  events: [
    { type: 'FLR', time: '2026-04-04T10:32:00Z', class_type: 'C4.2', region: 3945 },
    { type: 'FLR', time: '2026-04-03T22:17:00Z', class_type: 'M1.1', region: 3942 },
    { type: 'FLR', time: '2026-04-02T06:45:00Z', class_type: 'C2.8', region: 3945 },
  ],
};

// ─── DONKI Storms (consumed by SpaceWeather) ─────────────────────────────────
export const DEMO_DONKI_STORMS = {
  count: 1,
  events: [
    { type: 'GST', time: '2026-04-02T18:00:00Z', kp_index: 5, link: null },
  ],
};

// ─── Space Weather Scales (consumed by useSpaceWeatherScales) ────────────────
export const DEMO_SPACE_WEATHER_SCALES = {
  geomagnetic: { scale: 'G1', text: 'Minor' },
  solar_radiation: { scale: 'S0', text: 'None' },
  radio_blackout: { scale: 'R1', text: 'Minor' },
};

// ─── Geopolitical Nations (consumed by GeopoliticalMap directly) ──────────────
// GeopoliticalMap reads:
//   data.nations_series[].id / .data[].x / .y
//   data.nations_totals{}
//   data.commercial_vs_gov
//   data.ucs_applied
const DECADES = ['1957','1960','1965','1970','1975','1980','1985','1990','1995','2000','2005','2010','2015','2020','2025'];
const NATION_PROFILES = {
  USA:          [0, 30, 35, 25, 20, 18, 22, 28, 32, 18, 20, 25, 30, 40, 45],
  'Russia/USSR':[1, 35, 45, 55, 60, 65, 60, 55, 40, 30, 25, 18, 15, 10, 5],
  China:        [0, 0,  0,  1,  1,  2,  2,  3,  5,  8,  12, 20, 30, 40, 50],
  Europe:       [0, 0,  1,  1,  2,  4,  5,  6,  8,  6,  5,  7,  6,  5,  6],
  India:        [0, 0,  0,  0,  0,  1,  1,  1,  1,  2,  2,  3,  4,  5,  4],
  Japan:        [0, 0,  0,  1,  1,  2,  2,  2,  2,  2,  3,  3,  3,  3,  2],
};

export const DEMO_GEOPOLITICAL = {
  nations_series: Object.entries(NATION_PROFILES).map(([id, values]) => ({
    id,
    data: DECADES.map((yr, i) => ({ x: parseInt(yr), y: values[i] })),
  })),
  nations_totals: {
    USA: 2276,
    'Russia/USSR': 3099,
    China: 726,
    Europe: 320,
    India: 94,
    Japan: 115,
  },
  commercial_vs_gov: [
    { id: 'Commercial', data: DECADES.map((yr, i) => ({ x: parseInt(yr), y: [0,0,0,0,0,1,2,3,5,10,15,25,35,50,60][i] })) },
    { id: 'Government', data: DECADES.map((yr, i) => ({ x: parseInt(yr), y: [1,60,78,80,82,85,83,80,70,50,40,35,28,22,18][i] })) },
  ],
  ucs_applied: true,
  status: 'OK',
};
