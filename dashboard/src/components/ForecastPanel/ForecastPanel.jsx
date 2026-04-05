import { useMemo, useState } from 'react';
import { useKpForecast, useKpForecastData, useVelaForecast } from '../../hooks/useAPI';
import { getKpColor, getGScale, formatNumber, formatTimestamp } from '../../utils/kpUtils';

export default function ForecastPanel() {
  const { data: kpCurrent, loading: kpLoading } = useKpForecast();
  const { data: kpForecast, loading: forecastLoading } = useKpForecastData();
  const { data: velaForecast, loading: velaLoading } = useVelaForecast();
  const [activeHorizon, setActiveHorizon] = useState('3h');

  const latestKp = useMemo(() => {
    if (!kpCurrent?.kp_values?.length) return null;
    return kpCurrent.kp_values[kpCurrent.kp_values.length - 1];
  }, [kpCurrent]);

  const recentHistory = useMemo(() => {
    if (!kpCurrent?.kp_values?.length) return [];
    return kpCurrent.kp_values.slice(-24);
  }, [kpCurrent]);

  const forecastEntries = useMemo(() => {
    if (!kpForecast?.forecast?.length) return [];
    return kpForecast.forecast.slice(0, 24);
  }, [kpForecast]);

  if (kpLoading && forecastLoading) {
    return <div style={{ color: 'var(--accent-primary)', padding: '24px' }}>Loading Kp forecast data...</div>;
  }

  const horizons = ['3h', '12h', '24h', '72h'];
  const activePred = velaForecast?.predictions?.[activeHorizon];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.5fr 1fr',
      gap: '24px',
      padding: '24px',
      height: '100%',
      overflow: 'auto',
    }}>
      {/* ═══ LEFT COLUMN — CHARTS ═══════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Observed Kp — 24H History */}
        <div className="vela-panel">
          <div className="vela-label" style={{ marginBottom: '16px' }}>
            Observed Kp — 24H
          </div>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: '2px',
            height: '160px', marginBottom: '16px',
          }}>
            {recentHistory.map((entry, i) => (
              <div key={i} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', height: '100%', justifyContent: 'flex-end',
              }}>
                <span style={{
                  fontSize: '9px', fontFamily: 'var(--font-data)',
                  color: 'rgba(255,255,255,0.4)', marginBottom: '4px',
                }}>
                  {formatNumber(entry.kp, 0)}
                </span>
                <div style={{
                  width: '100%', maxWidth: '24px',
                  height: `${Math.max(4, (entry.kp / 9) * 100)}%`,
                  background: getKpColor(entry.kp),
                  borderRadius: '2px 2px 0 0',
                  transition: 'height 300ms cubic-bezier(0.16,1,0.3,1)',
                  opacity: 0.9,
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* NOAA Operational Forecast */}
        {forecastEntries.length > 0 && (
          <div className="vela-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="vela-label">NOAA Operational Forecast</span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.3)' }}>
                Source: NOAA SWPC
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: '2px',
              height: '120px', marginBottom: '16px',
            }}>
              {forecastEntries.map((entry, i) => (
                <div key={i} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', height: '100%', justifyContent: 'flex-end',
                }}>
                  <span style={{
                    fontSize: '8px', fontFamily: 'var(--font-data)',
                    color: 'rgba(255,255,255,0.3)', marginBottom: '4px',
                  }}>
                    {formatNumber(entry.kp, 0)}
                  </span>
                  <div style={{
                    width: '100%', maxWidth: '20px',
                    height: `${Math.max(4, (entry.kp / 9) * 100)}%`,
                    background: getKpColor(entry.kp),
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.5,
                    border: '1px dashed rgba(255,255,255,0.2)',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
              Data: NOAA Space Weather Prediction Center · Kp index from USGS/GFZ network ·
              This is the NOAA operational forecast, not a Vela model prediction.
            </div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT COLUMN — INTELLIGENCE CARDS ═══════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Current Observed Kp */}
        <div className="vela-panel" style={{ textAlign: 'center' }}>
          <div className="vela-label" style={{ marginBottom: '16px' }}>Observed Kp</div>
          {latestKp ? (
            <>
              <div className="vela-metric" style={{ fontSize: '48px', color: getKpColor(latestKp.kp) }}>
                {formatNumber(latestKp.kp, 2)}
              </div>
              <div style={{
                marginTop: '16px',
                padding: '4px 14px',
                background: `${getKpColor(latestKp.kp)}22`,
                border: `1px solid ${getKpColor(latestKp.kp)}44`,
                borderRadius: '6px',
                display: 'inline-block',
              }}>
                <span style={{ color: getKpColor(latestKp.kp), fontWeight: 600, fontSize: '13px' }}>
                  {getGScale(latestKp.kp).level}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginLeft: '8px' }}>
                  {getGScale(latestKp.kp).label}
                </span>
              </div>
              <div style={{
                fontSize: '10px', color: 'rgba(255,255,255,0.3)',
                marginTop: '16px', fontFamily: 'var(--font-data)',
              }}>
                {formatTimestamp(latestKp.time_tag)}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--status-critical)', fontSize: '12px' }}>
              Kp data unavailable
            </div>
          )}
          
          <div style={{ 
            marginTop: '24px', paddingTop: '16px', 
            borderTop: '1px solid var(--surface-border)', 
            textAlign: 'left', fontSize: '11px', 
            color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 
          }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)', marginRight: '4px' }}>
              What is the Kp Index?
            </span>
            The Planetary K-index (Kp) quantifies disturbances in the Earth's magnetic field with an integer scale from 0 to 9. It is derived from the maximum fluctuations of horizontal components observed on a magnetometer during a three-hour interval. Values ≥ 5 indicate geomagnetic storming capable of disrupting satellite operations, RF communications, and surface grid infrastructure.
          </div>
        </div>

        {/* Vela Model Intelligence Card — LIGHT PANEL */}
        <div className="vela-panel-light">
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Vela Forecast Model PERFORMANCE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {velaForecast?.test_rmse || '0.77'}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>RMSE at 3H</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {velaForecast?.storm_f1 || '0.553'}
              </div>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>Storm F1</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                20.7%
              </div>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>Skill Over Persistence</div>
            </div>
          </div>
          <div style={{
            marginTop: '16px', fontSize: '10px',
            color: '#666', lineHeight: 1.5,
          }}>
            Trained NASA OMNI 1996–2025 · Tested Solar Cycle 25
          </div>
        </div>

        {/* View Forecast Active */}
        {velaForecast?.predictions && (
          <div className="vela-panel">
            <div className="vela-label" style={{ marginBottom: '16px' }}>
              Vela Model Forecast
            </div>
            {/* Horizon tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {horizons.map(h => (
                <button key={h} onClick={() => setActiveHorizon(h)} style={{
                  flex: 1, padding: '6px 0', border: 'none', borderRadius: '4px',
                  fontFamily: 'var(--font-data)', fontSize: '11px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 150ms',
                  background: activeHorizon === h ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: activeHorizon === h ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)',
                }}>
                  t+{h}
                </button>
              ))}
            </div>
            {/* Active prediction */}
            {activePred && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  fontFamily: 'var(--font-data)', fontSize: '36px', fontWeight: 700,
                  color: getKpColor(activePred.kp_predicted), letterSpacing: '-0.02em',
                }}>
                  {activePred.kp_predicted.toFixed(1)}
                </div>
                <div style={{
                  display: 'inline-block', marginTop: '8px',
                  padding: '4px 8px', borderRadius: '4px',
                  background: `${getKpColor(activePred.kp_predicted)}22`,
                  color: getKpColor(activePred.kp_predicted),
                  fontSize: '10px', fontWeight: 600,
                }}>
                  {getGScale(activePred.kp_predicted).level} — {getGScale(activePred.kp_predicted).label}
                </div>
                <div style={{
                  marginTop: '12px', fontSize: '10px',
                  fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.35)',
                }}>
                  p10: {activePred.p10.toFixed(1)} — p90: {activePred.p90.toFixed(1)}
                </div>
                {/* Uncertainty bar */}
                <div style={{
                  position: 'relative', height: '22px', marginTop: '16px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '3px',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: `${(activePred.p10 / 9) * 100}%`,
                    width: `${((activePred.p90 - activePred.p10) / 9) * 100}%`,
                    height: '100%',
                    background: `${getKpColor(activePred.kp_predicted)}15`,
                    borderRadius: '3px',
                    border: `1px solid ${getKpColor(activePred.kp_predicted)}30`,
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: `${(activePred.kp_predicted / 9) * 100}%`,
                    top: '50%', transform: 'translate(-50%, -50%)',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: getKpColor(activePred.kp_predicted),
                    boxShadow: `0 0 6px ${getKpColor(activePred.kp_predicted)}88`,
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ═══ FULL-WIDTH DISCLAIMER (non-negotiable) ═══════════════════════════ */}
      <div style={{
        gridColumn: '1 / -1',
        padding: '16px',
        background: 'var(--surface-raised)',
        borderRadius: '6px',
        border: '1px solid var(--surface-border)',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.35)',
        lineHeight: 1.6,
        textAlign: 'center',
        fontStyle: 'italic',
      }}>
        Vela's Kp forecast is a research model trained on historical solar wind data.
        It is not an operational space weather warning system.
        For official alerts, see{' '}
        <a href="https://www.swpc.noaa.gov/" target="_blank" rel="noopener noreferrer"
           style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
          NOAA Space Weather Prediction Center
        </a>.
      </div>
    </div>
  );
}
