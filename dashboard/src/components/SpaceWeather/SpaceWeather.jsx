/**
 * SpaceWeather.jsx — Vela Space Weather Live (Meridian V2)
 * 
 * Top row: four live gauges (Bz, Speed, Density, Bt).
 * Middle: 24h Kp bar chart + magnetosphere SVG + DONKI events.
 * Bottom: IMF components + plasma detail.
 * 
 * Southward Bz indicator highlights active magnetospheric coupling.
 */

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

  const bzValue = latestMag?.bz_gsm ?? null;
  const isSouthward = bzValue != null && bzValue < -5;

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px' }}>
      {/* ═══ TOP — FOUR LIVE GAUGES ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <GaugeCard
          label="IMF Bz (nT)"
          value={latestMag ? formatNumber(bzValue, 1) : null}
          color={bzValue == null ? null : bzValue < -5 ? 'var(--status-critical)' : bzValue < 0 ? 'var(--accent-warning)' : 'var(--status-safe)'}
          badge={isSouthward ? 'SOUTHWARD — COUPLING ACTIVE' : null}
          badgeColor="var(--status-critical)"
          timestamp={latestMag?.time_tag}
          loading={magLoading && !magData}
        />
        <GaugeCard
          label="Solar Wind km/s"
          value={latestPlasma ? formatNumber(latestPlasma.speed, 0) : null}
          color={latestPlasma ? (latestPlasma.speed > 600 ? 'var(--accent-warning)' : latestPlasma.speed > 400 ? 'rgba(255,255,255,0.87)' : 'var(--status-safe)') : null}
          loading={plasmaLoading && !plasmaData}
        />
        <GaugeCard
          label="Density n/cm³"
          value={latestPlasma ? formatNumber(latestPlasma.density, 1) : null}
          loading={plasmaLoading && !plasmaData}
        />
        <GaugeCard
          label="IMF Bt (nT)"
          value={latestMag ? formatNumber(latestMag.bt, 1) : null}
          loading={magLoading && !magData}
        />
      </div>

      {/* ═══ MIDDLE ROW — Kp + Magnetosphere + DONKI ═════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>

        {/* 24h Kp Bar Chart */}
        <div className="vela-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="vela-label">Kp Index — 24H</span>
            {latestKp && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontFamily: 'var(--font-data)', fontSize: '20px', fontWeight: 700,
                  color: getKpColor(latestKp.kp),
                }}>
                  {formatNumber(latestKp.kp, 1)}
                </span>
                <span style={{
                  fontSize: '9px', fontWeight: 600, color: getKpColor(latestKp.kp),
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

        {/* Magnetosphere Coupling SVG */}
        <div className="vela-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="vela-label" style={{ marginBottom: '16px', alignSelf: 'flex-start' }}>Magnetosphere Coupling</div>
          <MagnetosphereSVG bzValue={bzValue} isSouthward={isSouthward} />
        </div>

        {/* DONKI Events */}
        <div className="vela-panel">
          <div className="vela-label" style={{ marginBottom: '16px' }}>Recent Solar Events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <EventRow icon="☀️" label="CME Events (30d)" count={cmeData?.count} />
            <EventRow icon="⚡" label="Geomag. Storms" count={stormsData?.count} />
            <EventRow icon="🔥" label="Solar Flares" count={flaresData?.count} />
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM — IMF DETAIL + PLASMA ══════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="vela-panel">
          <div className="vela-label" style={{ marginBottom: '16px' }}>IMF Components</div>
          {latestMag ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <SmallGauge label="Bx GSM" value={formatNumber(latestMag.bx_gsm, 1)} unit="nT" />
              <SmallGauge label="By GSM" value={formatNumber(latestMag.by_gsm, 1)} unit="nT" />
              <SmallGauge label="Bz GSM" value={formatNumber(latestMag.bz_gsm, 1)} unit="nT"
                color={latestMag.bz_gsm < -5 ? 'var(--status-critical)' : latestMag.bz_gsm < 0 ? 'var(--accent-warning)' : 'var(--status-safe)'} />
              <SmallGauge label="Bt" value={formatNumber(latestMag.bt, 1)} unit="nT" />
            </div>
          ) : <PulseLoader />}
        </div>

        <div className="vela-panel">
          <div className="vela-label" style={{ marginBottom: '16px' }}>Solar Wind Plasma</div>
          {latestPlasma ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SmallGauge label="Speed" value={formatNumber(latestPlasma.speed, 0)} unit="km/s"
                color={latestPlasma.speed > 600 ? 'var(--accent-warning)' : 'var(--status-safe)'} />
              <SmallGauge label="Density" value={formatNumber(latestPlasma.density, 1)} unit="n/cm³" />
              <SmallGauge label="Temperature" value={latestPlasma.temperature ? `${(latestPlasma.temperature / 1000).toFixed(0)}K` : '—'} unit="×10³" />
            </div>
          ) : <PulseLoader />}
        </div>
      </div>

      {/* Attribution */}
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontFamily: 'var(--font-data)' }}>
        Data: NOAA Space Weather Prediction Center (SWPC) · NASA CCMC DONKI ·
        Updated in real-time. Vela surfaces authoritative federal measurement data.
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function GaugeCard({ label, value, color, badge, badgeColor, timestamp, loading }) {
  return (
    <div className="vela-panel" style={{ textAlign: 'center', position: 'relative' }}>
      <div className="vela-label" style={{ marginBottom: '12px' }}>{label}</div>
      {value != null ? (
        <>
          <div style={{
            fontFamily: 'var(--font-data)', fontSize: '36px', fontWeight: 700,
            color: color || 'rgba(255,255,255,0.87)',
            letterSpacing: '-0.02em',
          }}>
            {value}
          </div>
          {badge && (
            <div style={{
              marginTop: '10px', fontSize: '8px',
              color: badgeColor, padding: '3px 8px',
              border: `1px solid ${badgeColor}`,
              borderRadius: '4px', display: 'inline-block',
              textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em',
            }}>
              {badge}
            </div>
          )}
          {timestamp && (
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>
              {formatTimestamp(timestamp)}
            </div>
          )}
        </>
      ) : (
        <PulseLoader />
      )}
    </div>
  );
}

function MagnetosphereSVG({ bzValue, isSouthward }) {
  const bz = bzValue ?? 0;
  const isSouth = bz < 0;
  const arrowColor = isSouth ? 'var(--status-critical)' : 'var(--status-safe)';
  const arrowDir = isSouth ? 1 : -1;

  return (
    <>
      <svg width="220" height="110" viewBox="-110 -55 220 110">
        {/* Earth */}
        <circle cx="0" cy="0" r="14" fill="#3B82F6" />
        <path d="M0,-14 A14,14 0 0,0 0,14 Z" fill="#1a3a5c" />
        
        {/* Magnetopause: compress if southward, expand if northward */}
        <path d={`M-${isSouthward ? 60 : 80},-${isSouthward ? 40 : 50} C-${isSouthward ? 30 : 40},-${isSouthward ? 35 : 40} -${isSouthward ? 20 : 25},-18 -${isSouthward ? 20 : 25},0 C-${isSouthward ? 20 : 25},18 -${isSouthward ? 30 : 40},${isSouthward ? 35 : 40} -${isSouthward ? 60 : 80},${isSouthward ? 40 : 50}`}
          fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        
        {/* Outer magnetopause */}
        <path d={`M-100,-55 C-55,-48 -35,-22 -35,0 C-35,22 -55,48 -100,55`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 3" />

        {/* Solar Wind Bz Arrows */}
        {[-14, 0, 14].map((yOff, i) => (
          <g key={i} transform={`translate(-75, ${yOff})`}>
            <line x1="0" y1={arrowDir * -8} x2="0" y2={arrowDir * 8} stroke={arrowColor} strokeWidth="2" opacity="0.8" />
            <polygon points={`0,${arrowDir * 10} -3,${arrowDir * 5} 3,${arrowDir * 5}`} fill={arrowColor} opacity="0.8" />
          </g>
        ))}

        {/* Reconnection flash if southward */}
        {isSouthward && (
          <circle cx={`-${isSouthward ? 20 : 25}`} cy="0" r="3" fill="var(--status-critical)" className="live-pulse" />
        )}

        {/* Labels */}
        <text x="35" y="-8" fontSize="10" fill="rgba(255,255,255,0.6)" fontFamily="var(--font-ui)">
          Bz {bz > 0 ? '↑ N' : '↓ S'}
        </text>
        <text x="35" y="7" fontSize="14" fill={isSouth ? 'var(--status-critical)' : 'var(--status-safe)'} fontFamily="var(--font-data)" fontWeight="bold">
          {formatNumber(bz, 1)} nT
        </text>
        <text x="35" y="22" fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="var(--font-ui)">
          {isSouthward ? 'Reconnection ACTIVE' : 'Magnetosphere CLOSED'}
        </text>
      </svg>
    </>
  );
}

function PulseLoader() {
  return (
    <div style={{
      padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', height: '32px', borderRadius: '4px',
        background: 'linear-gradient(90deg, var(--surface-raised) 25%, var(--surface-overlay) 50%, var(--surface-raised) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function SmallGauge({ label, value, unit, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-data)', fontSize: '18px', fontWeight: 600,
        color: color || 'rgba(255,255,255,0.87)',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '9px', color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '2px',
      }}>
        {label}
      </div>
      {unit && (
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-data)' }}>
          {unit}
        </div>
      )}
    </div>
  );
}

function EventRow({ icon, label, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
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
