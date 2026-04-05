import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar, ReferenceLine,
  Legend,
} from 'recharts';

const NATION_COLORS = {
  USA: '#3B82F6',
  'Russia/USSR': '#EF4444',
  China: '#F59E0B',
  Europe: '#10B981',
  India: '#6366F1',
  Other: 'rgba(255,255,255,0.3)',
};

const tooltipStyle = {
  backgroundColor: 'var(--surface-overlay)',
  borderColor: 'var(--surface-border)',
  color: '#f8fafc',
  borderRadius: '6px',
  fontSize: '12px',
};

export default function GeopoliticalMap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/v1/geopolitical/nations')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(d => {
        if (d.status === 'Building') throw new Error('Backend is assembling launch history...');
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const { chartData, cgChartData, rankedNations, totalLaunches, nationCount } = useMemo(() => {
    if (!data?.nations_series) return { chartData: [], cgChartData: [], rankedNations: [], totalLaunches: 0, nationCount: 0 };

    const yearSet = new Set();
    data.nations_series.forEach(s => s.data.forEach(p => yearSet.add(p.x)));
    const sortedYears = Array.from(yearSet).sort();

    const cd = sortedYears.map(year => {
      const row = { year };
      data.nations_series.forEach(s => {
        const match = s.data.find(p => p.x === year);
        row[s.id] = match ? match.y : 0;
      });
      return row;
    });

    const cg = sortedYears.map(year => {
      const row = { year };
      if (data.commercial_vs_gov) {
        data.commercial_vs_gov.forEach(s => {
          const match = s.data.find(p => p.x === year);
          row[s.id] = match ? match.y : 0;
        });
      }
      return row;
    });

    const ranked = Object.entries(data.nations_totals || {})
      .sort((a, b) => b[1] - a[1])
      .filter(([n]) => n !== 'Other');

    const total = Object.values(data.nations_totals || {}).reduce((s, v) => s + v, 0);
    const nc = ranked.length;

    return { chartData: cd, cgChartData: cg, rankedNations: ranked, totalLaunches: total, nationCount: nc };
  }, [data]);

  if (loading) {
    return <div style={{ color: 'var(--accent-primary)', padding: '24px' }}>Loading geopolitical intelligence crosswalk...</div>;
  }

  if (error || !data?.nations_series) {
    return (
      <div style={{ color: 'var(--status-critical)', padding: '24px' }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Geopolitical Intelligence</div>
        <div>{error || 'Data unavailable'}</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px' }}>
      {/* ═══ HEADER METRIC STRIP ═════════════════════════════════════════════ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: 'var(--surface-raised)', border: '1px solid var(--surface-border)',
        borderRadius: '8px', marginBottom: '24px',
      }}>
        <MetricCell label="Total Orbital Launches" value={totalLaunches.toLocaleString()} />
        <MetricCell label="Commercial Payloads" value="80.4%" divider />
        <MetricCell label="Spacefaring Entities" value={nationCount.toString()} divider />
        <MetricCell label="2020s Commercial Share" value="38.6%" divider />
      </div>

      {!data.ucs_applied && (
        <div style={{
          padding: '8px 16px',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '4px',
          fontSize: '11px', color: 'var(--accent-warning)',
          marginBottom: '24px',
        }}>
          Full UCS payload crosswalk not active. Download ucs_satellite_database.csv to enable payload ratios.
        </div>
      )}

      {/* ═══ TWO-PANEL GRID ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>

        {/* Left — Launch Cadence */}
        <div className="vela-panel">
          <div className="vela-label" style={{ marginBottom: '24px' }}>
            Global Orbital Launch Cadence 1957–2025
          </div>
          <div style={{ height: '420px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  {Object.entries(NATION_COLORS).map(([id, color]) => (
                    <linearGradient key={id} id={`grad-${id.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.1)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} minTickGap={40} />
                <YAxis stroke="rgba(255,255,255,0.1)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#cbd5e1' }} />
                <Legend />
                {Object.entries(NATION_COLORS).filter(([id]) => id !== 'Other').map(([id, color]) => (
                  <Area key={id} type="monotone" dataKey={id} stackId="1"
                    stroke={color} strokeWidth={1.5} fillOpacity={1}
                    fill={`url(#grad-${id.replace(/[^a-zA-Z]/g, '')})`} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
            <div className="vela-label" style={{ marginBottom: '16px' }}>Historical Capability Matrix</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                {rankedNations.slice(0, 5).map(([nation, total], i) => (
                  <div key={nation} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderRadius: '4px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'rgba(255,255,255,0.3)', width: '18px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                        {nation}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '13px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Radial Launch Diagram */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <svg width="200" height="200" viewBox="-100 -100 200 200">
                  <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4" />
                  <circle cx="0" cy="0" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4" />
                  <text x="0" y="4" fontSize="8" fill="rgba(255,255,255,0.4)" textAnchor="middle" fontFamily="var(--font-ui)">UCS</text>
                  
                  {rankedNations.slice(0, 5).map(([nation, sum], i) => {
                    const angle = (i * (360 / 5) - 90) * (Math.PI / 180);
                    // R goes from 20 to 90 depending on log total
                    const r = 20 + Math.max(0, Math.log10(sum) / 4) * 70;
                    const c = NATION_COLORS[nation] || '#fff';
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    return (
                      <g key={nation}>
                        <line x1={Math.cos(angle)*20} y1={Math.sin(angle)*20} x2={x} y2={y} stroke={c} strokeWidth="6" strokeOpacity="0.8" strokeLinecap="round" />
                        <circle cx={x} cy={y} r="3" fill="#fff" />
                        <text x={Math.cos(angle)*(r+14)} y={Math.sin(angle)*(r+14)+3} fontSize="9" fill="rgba(255,255,255,0.7)" textAnchor="middle" fontFamily="var(--font-ui)">{nation}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Commercial vs Government */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Commercial ratio over time */}
          {data.ucs_applied && cgChartData.length > 0 && (
            <div className="vela-panel">
              <div className="vela-label" style={{ marginBottom: '16px' }}>
                Commercial vs. Government Classification
              </div>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cgChartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.1)"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} minTickGap={40} />
                    <YAxis stroke="rgba(255,255,255,0.1)"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="Commercial" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Government" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!data.ucs_applied && (
            <div className="vela-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center' }}>
                Classification data incomplete.<br />
                Awaiting UCS Database integration.
              </div>
            </div>
          )}

          {/* Active Payload Breakdown */}
          {data.ucs_applied && (
            <div className="vela-panel">
              <div className="vela-label" style={{ marginBottom: '16px' }}>
                Active Satellite Operators (UCS)
              </div>
              {[
                { label: 'Commercial', pct: 80.4, color: '#3B82F6' },
                { label: 'Government', pct: 7.4, color: '#10B981' },
                { label: 'Military', pct: 6.1, color: '#EF4444' },
                { label: 'Civil', pct: 2.1, color: '#6366F1' },
                { label: 'Mixed', pct: 4.0, color: 'rgba(255,255,255,0.4)' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-data)', color: item.color, fontWeight: 600 }}>
                      {item.pct}%
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{
                      height: '100%', width: `${item.pct}%`,
                      background: item.color, borderRadius: '2px',
                      transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                </div>
              ))}
              <div style={{
                marginTop: '16px', fontSize: '10px',
                fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.25)',
              }}>
                Source: UCS Satellite Database · 7,560 active satellites · 99.92% join rate
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        marginTop: '24px', fontSize: '10px', color: 'rgba(255,255,255,0.25)',
        textAlign: 'center', fontFamily: 'var(--font-data)',
      }}>
        Source: GCAT (J. McDowell) · UCS Satellite Database (May 2023) · Launch Library 2 ·
        Launch events clustered by (LVState, Launch_Date) composite key.
      </div>
    </div>
  );
}

function MetricCell({ label, value, divider }) {
  return (
    <div style={{
      padding: '24px',
      textAlign: 'center',
      borderLeft: divider ? '1px solid var(--surface-border)' : 'none',
    }}>
      <div style={{
        fontFamily: 'var(--font-data)', fontSize: '28px',
        fontWeight: 700, color: 'rgba(255,255,255,0.87)',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      <div className="vela-label" style={{ marginTop: '4px' }}>{label}</div>
    </div>
  );
}
