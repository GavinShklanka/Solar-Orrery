import { useMemo, useState } from 'react';
import { useNEO, useSentry } from '../../hooks/useAPI';
import { formatNumber } from '../../utils/kpUtils';

export default function NEOPanel() {
  const { data: neoData, loading: neoLoading, error: neoError } = useNEO();
  const { data: sentryData, loading: sentryLoading } = useSentry();
  const [activeTab, setActiveTab] = useState('approaches');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const approaches = useMemo(() => {
    if (!neoData?.approaches) return [];
    return [...neoData.approaches].sort(
      (a, b) => new Date(a.close_approach_date) - new Date(b.close_approach_date)
    );
  }, [neoData]);

  const sentryObjects = useMemo(() => {
    if (!sentryData?.objects) return [];
    return [...sentryData.objects]
      .sort((a, b) => (b.impact_probability || 0) - (a.impact_probability || 0))
      .slice(0, 50);
  }, [sentryData]);

  if (neoLoading && sentryLoading) {
    return <div style={{ color: 'var(--accent-primary)', padding: '24px' }}>Loading NEO data from NASA JPL...</div>;
  }

  const selected = activeTab === 'approaches' ? approaches[selectedIdx] : sentryObjects[selectedIdx];

  // SVG Geometry Calculator for Approach Diagram
  const renderGeometry = () => {
    if (activeTab !== 'approaches' || !selected) return null;
    
    // Scale mapping for visual approach diagram
    const ld = selected.dist_lunar || 40; // Default out of frame if missing
    
    // Geometry logic: Center is Earth. Lunar orbit radius = 40px in SVG.
    // At exactly 1 LD, NEO passes exactly on lunar orbit ring.
    // If it's 5 LD, it passes at 5 * 40 = 200px away.
    const earthR = 4;
    const moonOrbitR = 40;
    const neoDistanceR = Math.min(100, Math.max(10, ld * 40)); 
    
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0', background: 'var(--surface-void)', padding: '16px', borderRadius: '4px', border: '1px solid var(--surface-border)' }}>
        <svg width="200" height="100" viewBox="-100 -50 200 100">
          {/* Earth */}
          <circle cx="0" cy="0" r={earthR} fill="#3B82F6" />
          <circle cx="0" cy="0" r={earthR + 2} fill="transparent" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
          
          {/* Lunar Orbit Reference (1 LD) */}
          <ellipse cx="0" cy="0" rx={moonOrbitR} ry={moonOrbitR * 0.3} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 3" />
          <text x="-42" y="3" fontSize="6" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-ui)">1 LD</text>

          {/* NEO Flight Path */}
          {/* Approximating passing path simply as a horizontal line offset by distance * scale */}
          <line x1="-90" y1={-neoDistanceR} x2="90" y2={-neoDistanceR} stroke="var(--status-critical)" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
          
          {/* NEO Object Dot */}
          <circle cx="20" cy={-neoDistanceR} r="2" fill="var(--status-critical)" />
          
          {/* Distance connection line */}
          <line x1="0" y1="0" x2="20" y2={-neoDistanceR} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          
          {/* Warning geometry text */}
          <text x="0" y="45" fontSize="8" fill="rgba(255,255,255,0.5)" textAnchor="middle" fontFamily="var(--font-data)">
            Close Approach Vectors: {formatNumber(selected.v_rel_km_s, 1)} km/s
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: '1px', padding: '8px 24px 0',
        background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--surface-border)',
        flexShrink: 0,
      }}>
        <TabBtn active={activeTab === 'approaches'} onClick={() => { setActiveTab('approaches'); setSelectedIdx(0); }}
          label={`Close Approaches (${neoData?.count ?? '—'})`} />
        <TabBtn active={activeTab === 'sentry'} onClick={() => { setActiveTab('sentry'); setSelectedIdx(0); }}
          label={`Sentry Catalog (${sentryData?.count ?? '—'})`} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.8fr 1fr', overflow: 'hidden' }}>

        {/* ═══ LEFT — TABLE ═══════════════════════════════════════════════════ */}
        <div style={{ overflow: 'auto', padding: '24px' }}>
          {activeTab === 'approaches' && (
            <>
              {neoError ? (
                <div style={{ color: 'var(--status-critical)', fontSize: '12px' }}>
                  <div>NASA CNEOS</div>
                  <div>{neoError.message}</div>
                </div>
              ) : approaches.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>No upcoming close approaches within 0.05 AU</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-overlay)', borderBottom: '1px solid var(--surface-border)', color: 'rgba(255,255,255,0.4)', textAlign: 'left', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
                      <th style={{ padding: '12px 16px' }}>Object</th>
                      <th style={{ padding: '12px 16px' }}>Date (UTC)</th>
                      <th style={{ padding: '12px 16px' }}>Dist (AU)</th>
                      <th style={{ padding: '12px 16px' }}>Dist (LD)</th>
                      <th style={{ padding: '12px 16px' }}>V_rel (km/s)</th>
                      <th style={{ padding: '12px 16px' }}>H (mag)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approaches.map((obj, i) => (
                      <tr key={i}
                        onClick={() => setSelectedIdx(i)}
                        style={{
                          cursor: 'pointer',
                          background: selectedIdx === i ? 'rgba(59,130,246,0.1)' : (i % 2 === 0 ? 'var(--surface-raised)' : 'var(--surface-overlay)'),
                          borderLeft: selectedIdx === i ? '2px solid var(--accent-primary)' : '2px solid transparent',
                          fontFamily: 'var(--font-data)'
                        }}>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.87)', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>
                          {obj.fullname || obj.designation}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{obj.close_approach_date ? obj.close_approach_date.replace('T', ' ').slice(0, 16) : '—'}</td>
                        <td style={{ padding: '12px 16px' }}>{formatNumber(obj.dist_au, 5)}</td>
                        <td style={{
                          padding: '12px 16px',
                          color: obj.dist_lunar < 5 ? 'var(--status-critical)' : obj.dist_lunar < 20 ? 'var(--accent-warning)' : 'rgba(255,255,255,0.6)',
                          fontWeight: obj.dist_lunar < 5 ? 600 : 400,
                        }}>
                          {formatNumber(obj.dist_lunar, 1)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{formatNumber(obj.v_rel_km_s, 2)}</td>
                        <td style={{ padding: '12px 16px' }}>{formatNumber(obj.h_mag, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'sentry' && (
            <>
              {sentryObjects.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)' }}>Loading Sentry catalog...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-overlay)', borderBottom: '1px solid var(--surface-border)', color: 'rgba(255,255,255,0.4)', textAlign: 'left', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
                      <th style={{ padding: '12px 16px' }}>Object</th>
                      <th style={{ padding: '12px 16px' }}>Impact Prob.</th>
                      <th style={{ padding: '12px 16px' }}>Palermo (cum)</th>
                      <th style={{ padding: '12px 16px' }}>Torino</th>
                      <th style={{ padding: '12px 16px' }}>Diameter (km)</th>
                      <th style={{ padding: '12px 16px' }}>N Impacts</th>
                      <th style={{ padding: '12px 16px' }}>Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentryObjects.map((obj, i) => (
                      <tr key={i}
                        onClick={() => setSelectedIdx(i)}
                        style={{
                          cursor: 'pointer',
                          background: selectedIdx === i ? 'rgba(59,130,246,0.1)' : (i % 2 === 0 ? 'var(--surface-raised)' : 'var(--surface-overlay)'),
                          borderLeft: selectedIdx === i ? '2px solid var(--accent-primary)' : getTorinoColor(obj.torino_scale_max),
                          fontFamily: 'var(--font-data)'
                        }}>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.87)', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>
                          {obj.fullname || obj.designation}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          color: obj.impact_probability > 1e-4 ? 'var(--status-critical)' : 'rgba(255,255,255,0.6)',
                        }}>
                          {obj.impact_probability ? obj.impact_probability.toExponential(2) : '—'}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          color: obj.palermo_scale_cum > -2 ? 'var(--accent-warning)' : 'rgba(255,255,255,0.3)',
                        }}>
                          {formatNumber(obj.palermo_scale_cum, 2)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <TorinoScale value={obj.torino_scale_max} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>{obj.diameter_km ? formatNumber(obj.diameter_km, 3) : '—'}</td>
                        <td style={{ padding: '12px 16px' }}>{obj.n_impacts}</td>
                        <td style={{ padding: '12px 16px', fontSize: '10px' }}>{obj.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* ═══ RIGHT — DETAIL + CONTEXT ═══════════════════════════════════════ */}
        <div style={{
          borderLeft: '1px solid var(--surface-border)',
          padding: '24px',
          overflow: 'auto',
          display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
          {selected && (
            <div className="vela-panel">
              <div className="vela-label" style={{ marginBottom: '12px' }}>
                Selected Object
              </div>
              <div style={{
                fontFamily: 'var(--font-data)', fontSize: '18px',
                fontWeight: 700, color: 'rgba(255,255,255,0.87)',
                marginBottom: '12px',
              }}>
                {selected.fullname || selected.designation}
              </div>
              
              {renderGeometry()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeTab === 'approaches' && (
                  <>
                    <DetailRow label="Approach Date" value={selected.close_approach_date?.replace('T', ' ').slice(0, 16) || '—'} />
                    <DetailRow label="Distance (AU)" value={formatNumber(selected.dist_au, 5)} />
                    <DetailRow label="Distance (LD)" value={formatNumber(selected.dist_lunar, 1)}
                      highlight={selected.dist_lunar < 5} />
                    <DetailRow label="Velocity" value={`${formatNumber(selected.v_rel_km_s, 2)} km/s`} />
                    <DetailRow label="Abs. Magnitude" value={formatNumber(selected.h_mag, 1)} />
                  </>
                )}
                {activeTab === 'sentry' && (
                  <>
                    <DetailRow label="Impact Probability" value={selected.impact_probability?.toExponential(2) || '—'}
                      highlight={selected.impact_probability > 1e-4} />
                    <DetailRow label="Palermo Scale" value={formatNumber(selected.palermo_scale_cum, 2)} />
                    <DetailRow label="Torino Scale" value={selected.torino_scale_max?.toString() || '0'} />
                    <DetailRow label="Diameter" value={selected.diameter_km ? `${formatNumber(selected.diameter_km, 3)} km` : '—'} />
                    <DetailRow label="Potential Impacts" value={selected.n_impacts?.toString() || '—'} />
                    <DetailRow label="Window" value={selected.range || '—'} />
                  </>
                )}
              </div>
            </div>
          )}

          <div className="vela-panel" style={{ background: 'var(--surface-overlay)' }}>
            <div className="vela-label" style={{ marginBottom: '12px' }}>
              Cosmological Context
            </div>
            <p style={{
              fontSize: '11px', lineHeight: 1.7,
              color: 'rgba(255,255,255,0.4)', fontStyle: 'italic',
            }}>
              The Andromeda–Milky Way merger is predicted in approximately 4.5 billion years.
              This is not an actionable risk horizon. Vela monitors objects within the next 300 years only.
            </p>
          </div>

          <div style={{
            fontSize: '10px', fontFamily: 'var(--font-data)',
            color: 'rgba(255,255,255,0.25)', lineHeight: 1.6,
          }}>
            Close approach data: NASA JPL CNEOS · Impact probabilities: NASA Sentry-II ·
            Vela does not independently compute orbital uncertainty.
          </div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--surface-base)' : 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
      padding: '12px 24px',
      color: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)',
      fontSize: '12px', fontWeight: active ? 600 : 400,
      cursor: 'pointer', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.05em',
      transition: 'all 150ms',
    }}>
      {label}
    </button>
  );
}

function TorinoScale({ value }) {
  const colors = {
    0: 'rgba(255,255,255,0.3)', 1: 'var(--status-safe)',
    2: 'var(--accent-warning)', 3: 'var(--accent-warning)',
    4: 'var(--status-critical)', 5: 'var(--status-critical)',
    6: 'var(--status-critical)', 7: 'var(--status-critical)',
    8: '#ef4444', 9: '#ef4444', 10: '#ef4444',
  };
  return (
    <span style={{
      color: colors[value] || 'rgba(255,255,255,0.3)',
      fontWeight: value > 0 ? 700 : 400,
      fontFamily: 'var(--font-data)',
    }}>
      {value}
    </span>
  );
}

function getTorinoColor(torino) {
  if (torino >= 4) return '2px solid var(--status-critical)';
  if (torino >= 1) return '2px solid var(--accent-warning)';
  return '2px solid transparent';
}

function DetailRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid var(--surface-border)',
    }}>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span style={{
        fontSize: '12px', fontFamily: 'var(--font-data)', fontWeight: 600,
        color: highlight ? 'var(--status-critical)' : 'rgba(255,255,255,0.87)',
      }}>
        {value}
      </span>
    </div>
  );
}
