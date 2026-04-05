/**
 * NEOPanel.jsx — Vela NEO Watch (Meridian V2)
 * 
 * Left panel (65%): ranked close approach table with Torino/Palermo risk.
 * Right panel (35%): selected object detail + approach geometry SVG + cosmological context.
 * 
 * Data: NASA JPL CNEOS + Sentry-II. Vela does not independently
 * compute orbital uncertainty.
 */

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

  const selected = activeTab === 'approaches' ? approaches[selectedIdx] : sentryObjects[selectedIdx];

  // Approach Geometry SVG
  const renderApproachGeometry = () => {
    if (!selected || activeTab !== 'approaches') return null;
    const ld = selected.dist_lunar || 20;
    // Scale: 1 LD = 18px, max radius 80px
    const scaledDist = Math.min(80, Math.max(20, ld * 18));
    
    return (
      <div style={{ 
        display: 'flex', justifyContent: 'center', padding: '16px',
        background: 'var(--surface-void)', borderRadius: '6px', 
        border: '1px solid var(--surface-border)', margin: '16px 0',
      }}>
        <svg width="220" height="140" viewBox="-110 -70 220 140">
          {/* Reference rings */}
          <circle cx="0" cy="0" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
          <circle cx="0" cy="0" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 3" />
          <circle cx="0" cy="0" r="72" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 3" />
          
          {/* Ring labels */}
          <text x="20" y="-4" fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="var(--font-data)">1 LD</text>
          <text x="38" y="-4" fontSize="7" fill="rgba(255,255,255,0.25)" fontFamily="var(--font-data)">5 LD</text>
          <text x="74" y="-4" fontSize="7" fill="rgba(255,255,255,0.2)" fontFamily="var(--font-data)">10 LD</text>
          
          {/* Earth */}
          <circle cx="0" cy="0" r="5" fill="#3B82F6" />
          <circle cx="0" cy="0" r="7" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
          
          {/* NEO trajectory line */}
          <line x1="-100" y1={-scaledDist} x2="100" y2={-scaledDist}
            stroke="var(--status-critical)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
          
          {/* NEO marker */}
          <circle cx="30" cy={-scaledDist} r="3" fill="var(--status-critical)" />
          <circle cx="30" cy={-scaledDist} r="5" fill="none" stroke="var(--status-critical)" strokeWidth="0.5" opacity="0.5" />
          
          {/* Distance line */}
          <line x1="0" y1="0" x2="30" y2={-scaledDist}
            stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
          
          {/* Distance label */}
          <text x="0" y="60" fontSize="9" fill="rgba(255,255,255,0.5)" textAnchor="middle" fontFamily="var(--font-data)">
            Miss Distance: {formatNumber(ld, 1)} LD · {formatNumber(selected.v_rel_km_s, 1)} km/s
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: '0', padding: '0 24px',
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
              {(neoLoading && !neoData) ? (
                <LoadingState message="Awaiting CNEOS data connection..." />
              ) : (neoError && !neoData) ? (
                <LoadingState message="Awaiting CNEOS data connection — will retry automatically" />
              ) : approaches.length === 0 ? (
                <LoadingState message="No upcoming close approaches within 0.05 AU" />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      {['Object', 'Approach Date', 'Miss Distance', 'Velocity', 'Diameter', 'Risk'].map(h => (
                        <th key={h} style={{
                          padding: '12px 14px', textAlign: 'left',
                          fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: 'rgba(255,255,255,0.4)', background: 'var(--surface-overlay)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {approaches.map((obj, i) => (
                      <tr key={i}
                        onClick={() => setSelectedIdx(i)}
                        style={{
                          cursor: 'pointer',
                          background: selectedIdx === i ? 'rgba(59,130,246,0.08)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'),
                          borderLeft: selectedIdx === i ? '2px solid var(--accent-primary)' : '2px solid transparent',
                          transition: 'background 150ms',
                        }}>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.87)', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>
                          {obj.fullname || obj.designation}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-data)', fontSize: '11px' }}>
                          {obj.close_approach_date ? obj.close_approach_date.replace('T', ' ').slice(0, 16) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-data)', fontSize: '11px',
                          color: obj.dist_lunar < 5 ? 'var(--status-critical)' : obj.dist_lunar < 20 ? 'var(--accent-warning)' : 'rgba(255,255,255,0.6)',
                          fontWeight: obj.dist_lunar < 5 ? 600 : 400,
                        }}>
                          {formatNumber(obj.dist_lunar, 1)} LD
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-data)', fontSize: '11px' }}>
                          {formatNumber(obj.v_rel_km_s, 1)} km/s
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-data)', fontSize: '11px' }}>
                          {obj.h_mag ? `H ${formatNumber(obj.h_mag, 1)}` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '9px', padding: '2px 6px', borderRadius: '3px',
                            background: obj.dist_lunar < 5 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)',
                            color: obj.dist_lunar < 5 ? 'var(--status-critical)' : 'var(--status-safe)',
                            fontWeight: 600, textTransform: 'uppercase',
                          }}>
                            {obj.dist_lunar < 5 ? 'CLOSE' : 'NOMINAL'}
                          </span>
                        </td>
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
                <LoadingState message="Awaiting Sentry-II catalog connection..." />
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      {['Object', 'Impact Prob.', 'Palermo (cum)', 'Torino', 'Diameter (km)', 'N Impacts', 'Window'].map(h => (
                        <th key={h} style={{
                          padding: '12px 14px', textAlign: 'left',
                          fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: 'rgba(255,255,255,0.4)', background: 'var(--surface-overlay)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sentryObjects.map((obj, i) => (
                      <tr key={i}
                        onClick={() => setSelectedIdx(i)}
                        style={{
                          cursor: 'pointer',
                          background: selectedIdx === i ? 'rgba(59,130,246,0.08)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'),
                          borderLeft: selectedIdx === i ? '2px solid var(--accent-primary)' : getTorinoAccent(obj.torino_scale_max),
                          fontFamily: 'var(--font-data)', fontSize: '11px',
                          transition: 'background 150ms',
                        }}>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.87)', fontWeight: 500, fontFamily: 'var(--font-ui)' }}>
                          {obj.fullname || obj.designation}
                        </td>
                        <td style={{ padding: '12px 14px',
                          color: obj.impact_probability > 1e-4 ? 'var(--status-critical)' : 'rgba(255,255,255,0.6)',
                        }}>
                          {obj.impact_probability ? obj.impact_probability.toExponential(2) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px',
                          color: obj.palermo_scale_cum > -2 ? 'var(--accent-warning)' : 'rgba(255,255,255,0.3)',
                        }}>
                          {formatNumber(obj.palermo_scale_cum, 2)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <TorinoScale value={obj.torino_scale_max} />
                        </td>
                        <td style={{ padding: '12px 14px' }}>{obj.diameter_km ? formatNumber(obj.diameter_km, 3) : '—'}</td>
                        <td style={{ padding: '12px 14px' }}>{obj.n_impacts}</td>
                        <td style={{ padding: '12px 14px', fontSize: '10px' }}>{obj.range}</td>
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
                marginBottom: '4px',
              }}>
                {selected.fullname || selected.designation}
              </div>
              
              {renderApproachGeometry()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
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

          {/* Cosmological Context Card */}
          <div className="vela-panel" style={{ background: 'var(--surface-overlay)' }}>
            <div className="vela-label" style={{ marginBottom: '12px' }}>
              Cosmological Context
            </div>
            <p style={{
              fontSize: '11px', lineHeight: 1.7,
              color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', margin: 0,
            }}>
              The Andromeda–Milky Way merger is predicted in approximately 4.5 billion years.
              This is not an actionable risk horizon. Vela monitors objects within the next 300 years only.
            </p>
          </div>

          {/* Source Attribution */}
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function LoadingState({ message }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '200px', padding: '48px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '32px', height: '32px', border: '2px solid var(--surface-border)',
          borderTopColor: 'var(--accent-primary)', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 16px',
        }} />
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{message}</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
      padding: '14px 24px',
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

function getTorinoAccent(torino) {
  if (torino >= 4) return '2px solid var(--status-critical)';
  if (torino >= 1) return '2px solid var(--accent-warning)';
  return '2px solid transparent';
}

function DetailRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0',
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
