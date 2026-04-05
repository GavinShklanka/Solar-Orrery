import { useMemo } from 'react';
import {
  useSolarWindMag, useSolarWindPlasma, useKpForecast,
  useDONKICME, useDONKIStorms, useDONKIFlares, useSpaceWeatherScales,
} from '../../hooks/useAPI';
import { getKpColor, getGScale, formatNumber, formatTimestamp } from '../../utils/kpUtils';

export default function SpaceWeather() {
  const { data: magData, loading: magLoading } = useSolarWindMag();
  const { data: plasmaData, loading: plasmaLoading } = useSolarWindPlasma();
  const { data: kpData, loading: kpLoading } = useKpForecast();
  const { data: cmeData } = useDONKICME();
  const { data: stormsData } = useDONKIStorms();
  const { data: flaresData } = useDONKIFlares();
  const { data: scalesData } = useSpaceWeatherScales();

  const latestMag = useMemo(() => {
    if (!magData?.data?.length) return null;
    return magData.data[magData.data.length - 1];
  }, [magData]);

  const latestPlasma = useMemo(() => {
    if (!plasmaData?.data?.length) return null;
    return plasmaData.data[plasmaData.data.length - 1];
  }, [plasmaData]);

  const latestKp = useMemo(() => {
    if (!kpData?.kp_values?.length) return null;
    return kpData.kp_values[kpData.kp_values.length - 1];
  }, [kpData]);

  const recentKp = useMemo(() => {
    if (!kpData?.kp_values?.length) return [];
    return kpData.kp_values.slice(-8);
  }, [kpData]);

  if (magLoading && plasmaLoading && kpLoading) {
    return <div style={{ color: 'var(--accent-primary)', padding: '24px' }}>Loading space weather data...</div>;
  }

  const bzValue = latestMag?.bz_gsm ?? 0;
  const isSouthward = bzValue != null && bzValue < -5;

  const renderMagnetosphere = () => {
    // Arrow color and direction depend on Bz
    // If Bz > 0 (Northward), arrows point UP, green
    // If Bz < 0 (Southward), arrows point DOWN, red
    const isSouth = bzValue < 0;
    const arrowColor = isSouth ? 'var(--status-critical)' : 'var(--status-safe)';
    const arrowDir = isSouth ? 1 : -1;

    return (
      <div className="vela-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="vela-label" style={{ marginBottom: '16px', alignSelf: 'flex-start' }}>Magnetosphere Coupling</div>
        <svg width="240" height="120" viewBox="-120 -60 240 120">
          {/* Earth */}
          <circle cx="0" cy="0" r="15" fill="#3B82F6" />
          <path d="M0,-15 A15,15 0 0,0 0,15 Z" fill="#1a3a5c" />
          
          {/* Magnetopause boundary lines */}
          <path d="M-80,-50 C-40,-40 -25,-20 -25,0 C-25,20 -40,40 -80,50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <path d="M-100,-60 C-50,-50 -35,-25 -35,0 C-35,25 -50,50 -100,60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 2" />

          {/* Solar Wind Bz Arrows */}
          {[ -15, 0, 15 ].map((yOffset, i) => (
            <g key={i} transform={`translate(-80, ${yOffset})`}>
              <line x1="0" y1={arrowDir * -10} x2="0" y2={arrowDir * 10} stroke={arrowColor} strokeWidth="2" />
              {/* Arrow head */}
              <polygon points={`0,${arrowDir * 12} -3,${arrowDir * 6} 3,${arrowDir * 6}`} fill={arrowColor} />
            </g>
          ))}

          {/* Reconnection graphic if highly southward */}
          {isSouthward && (
             <circle cx="-25" cy="0" r="4" fill="var(--status-critical)" className="live-pulse" />
          )}

          {/* Indicators */}
          <text x="40" y="-10" fontSize="10" fill="rgba(255,255,255,0.6)" fontFamily="var(--font-ui)">Bz {bzValue > 0 ? 'Northward' : 'Southward'}</text>
          <text x="40" y="5" fontSize="14" fill={arrowColor} fontFamily="var(--font-data)" fontWeight="bold">{formatNumber(bzValue, 1)} nT</text>
          <text x="40" y="20" fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="var(--font-ui)">
            {isSouthward ? 'Magnetic Reconnection ACTIVE' : 'Magnetosphere CLOSED'}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px' }}>
      {/* ═══ TOP — FOUR LIVE GAUGES ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>

        {/* Bz Gauge */}
        <div className="vela-panel" style={{ textAlign: 'center' }}>
          <div className="vela-label" style={{ marginBottom: '8px' }}>IMF Bz (nT)</div>
          {latestMag ? (
            <>
              <div style={{
                fontFamily: 'var(--font-data)', fontSize: '36px', fontWeight: 700,
                color: bzValue < -5 ? 'var(--status-critical)' : bzValue < 0 ? 'var(--accent-warning)' : 'var(--status-safe)',
                letterSpacing: '-0.02em',
              }}>
                {formatNumber(bzValue, 1)}
              </div>
              {isSouthward && (
                <div style={{ marginTop: '8px', fontSize: '8px', color: 'var(--status-critical)', padding: '2px 4px', border: '1px solid currentColor', borderRadius: '4px', display: 'inline-block', textTransform: 'uppercase' }}>
                  Southward — Coupling Active
                </div>
              )}
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                {formatTimestamp(latestMag.time_tag)}
              </div>
            </>
          ) : <ErrorMsg source="NOAA SWPC" msg="Bz unavailable" />}
        </div>

        {/* Solar Wind Speed */}
        <div className="vela-panel" style={{ textAlign: 'center' }}>
          <div className="vela-label" style={{ marginBottom: '8px' }}>Solar Wind km/s</div>
          {latestPlasma ? (
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: '36px', fontWeight: 700,
              color: latestPlasma.speed > 600 ? 'var(--accent-warning)' : latestPlasma.speed > 400 ? 'rgba(255,255,255,0.87)' : 'var(--status-safe)',
              letterSpacing: '-0.02em',
            }}>
              {formatNumber(latestPlasma.speed, 0)}
            </div>
          ) : <ErrorMsg source="NOAA SWPC" msg="Speed unavailable" />}
        </div>

        {/* Proton Density */}
        <div className="vela-panel" style={{ textAlign: 'center' }}>
          <div className="vela-label" style={{ marginBottom: '8px' }}>Density n/cm³</div>
          {latestPlasma ? (
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: '36px', fontWeight: 700,
              color: 'rgba(255,255,255,0.87)', letterSpacing: '-0.02em',
            }}>
              {formatNumber(latestPlasma.density, 1)}
            </div>
          ) : <ErrorMsg source="NOAA SWPC" msg="Density unavailable" />}
        </div>

        {/* Bt Magnitude */}
        <div className="vela-panel" style={{ textAlign: 'center' }}>
          <div className="vela-label" style={{ marginBottom: '8px' }}>IMF Bt (nT)</div>
          {latestMag ? (
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: '36px', fontWeight: 700,
              color: 'rgba(255,255,255,0.87)', letterSpacing: '-0.02em',
            }}>
              {formatNumber(latestMag.bt, 1)}
            </div>
          ) : <ErrorMsg source="NOAA SWPC" msg="Bt unavailable" />}
        </div>
      </div>

      {/* ═══ MIDDLE — Kp CHART + MAGNETOSPHERE + DONKI EVENTS ════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }}>

        {/* 24h Kp Bar Chart */}
        <div className="vela-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="vela-label">Kp Index — 24H History</span>
            {latestKp && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontFamily: 'var(--font-data)', fontSize: '20px', fontWeight: 700,
                  color: getKpColor(latestKp.kp),
                }}>
                  {formatNumber(latestKp.kp, 1)}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, color: getKpColor(latestKp.kp),
                  padding: '2px 6px', borderRadius: '3px',
                  background: `${getKpColor(latestKp.kp)}22`,
                }}>
                  {getGScale(latestKp.kp).level}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '140px' }}>
            {recentKp.map((entry, i) => (
              <div key={i} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', height: '100%', justifyContent: 'flex-end',
              }}>
                <span style={{
                  fontSize: '9px', fontFamily: 'var(--font-data)',
                  color: 'rgba(255,255,255,0.4)', marginBottom: '4px',
                }}>
                  {formatNumber(entry.kp, 1)}
                </span>
                <div style={{
                  width: '100%', maxWidth: '36px',
                  height: `${Math.max(4, (entry.kp / 9) * 100)}%`,
                  background: getKpColor(entry.kp),
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 300ms cubic-bezier(0.16,1,0.3,1)',
                  minHeight: '4px', opacity: 0.85,
                }} />
                <span style={{
                  fontSize: '8px', fontFamily: 'var(--font-data)',
                  color: 'rgba(255,255,255,0.3)', marginTop: '4px',
                  transform: 'rotate(-45deg)', whiteSpace: 'nowrap',
                }}>
                  {entry.time_tag ? entry.time_tag.slice(11, 16) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Magnetosphere SVG */}
        {renderMagnetosphere()}

        {/* DONKI Events */}
        <div className="vela-panel">
          <div className="vela-label" style={{ marginBottom: '12px' }}>Recent Solar Events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            <EventRow icon="☀️" label="CME Events (30d)" count={cmeData?.count} />
            <EventRow icon="⚡" label="Geomagnetic Storms" count={stormsData?.count} />
            <EventRow icon="🔥" label="Solar Flares" count={flaresData?.count} />
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontFamily: 'var(--font-ui)' }}>
        Data: NOAA Space Weather Prediction Center (SWPC) · NASA CCMC DONKI ·
        Updated in real-time. Vela surfaces authoritative federal measurement data.
      </div>
    </div>
  );
}

function EventRow({ icon, label, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid var(--surface-border)',
    }}>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
        {icon} {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-data)', fontWeight: 600, fontSize: '14px',
        color: count > 0 ? 'rgba(255,255,255,0.87)' : 'rgba(255,255,255,0.3)',
      }}>
        {count ?? '—'}
      </span>
    </div>
  );
}

function ErrorMsg({ source, msg }) {
  return (
    <div style={{ padding: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--status-critical)', marginBottom: '4px' }}>{source}</div>
      <div style={{ fontSize: '10px', fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.3)' }}>{msg}</div>
    </div>
  );
}
