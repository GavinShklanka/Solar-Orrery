/**
 * GeopoliticalMap.jsx — Vela Geopolitical Space Power Index (Meridian V2)
 * 
 * Hero metric strip + left stacked area + right column (commercialization line + UCS bars).
 * Nation callouts at bottom with flags.
 * 
 * PRESERVED DATA (non-negotiable):
 * - Launch totals: USA 2,276 | USSR/Russia 3,099 | China 726
 * - Commercial 80.4%, Government 7.4%, Military 6.1%, Civil 2.1%
 * - Decade breakdown 1950s 0% → 2020s 38.6% commercial
 * - UCS: 7,560 active satellites, 99.92% join rate
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine,
  Legend,
} from 'recharts';
import { IS_STATIC } from '../../hooks/useAPI';
import { DEMO_GEOPOLITICAL } from '../../data/demoData';

const NATION_COLORS = {
  USA: '#3B82F6',
  'Russia/USSR': '#EF4444',
  China: '#F59E0B',
  Europe: '#10B981',
  India: '#6366F1',
  Japan: '#8B5CF6',
  Other: 'rgba(255,255,255,0.2)',
};

const COMMERCIALIZATION_DECADES = [
  { decade: '1950s', share: 0 },
  { decade: '1960s', share: 0.3 },
  { decade: '1970s', share: 1.2 },
  { decade: '1980s', share: 3.1 },
  { decade: '1990s', share: 4.8 },
  { decade: '2000s', share: 19.3 },
  { decade: '2010s', share: 30.8 },
  { decade: '2020s', share: 38.6 },
];

const tooltipStyle = {
  backgroundColor: '#141C35',
  borderColor: 'rgba(255,255,255,0.07)',
  color: '#f8fafc',
  borderRadius: '6px',
  fontSize: '12px',
};

export default function GeopoliticalMap() {
  const [data, setData] = useState(IS_STATIC ? DEMO_GEOPOLITICAL : null);
  const [loading, setLoading] = useState(!IS_STATIC);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (IS_STATIC) return; // Demo data already set
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
        // Fall back to demo data on error
        setData(DEMO_GEOPOLITICAL);
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
    return <div style={{ color: 'var(--accent-primary)', padding: '24px', fontFamily: 'var(--font-data)', fontSize: '12px' }}>Loading geopolitical intelligence crosswalk...</div>;
  }

  if (!data?.nations_series) {
    return (
      <div style={{ padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px' }}>Geopolitical Intelligence</div>
        <div>{error || 'Data unavailable'}</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px' }}>
      {/* ═══ HERO METRIC STRIP ═══════════════════════════════════════════════ */}
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
          background: 'rgba(245,158,11,0.08)',
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

        {/* Left — Launch Cadence Stacked Area */}
        <div className="vela-panel">
          <div className="vela-label" style={{ marginBottom: '24px' }}>
            Global Orbital Launch Cadence · 1957–2025
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

          {/* Nation Rankings */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
            <div className="vela-label" style={{ marginBottom: '12px' }}>Historical Capability Matrix</div>
            {rankedNations.slice(0, 7).map(([nation, total], i) => (
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
                <span style={{ fontFamily: 'var(--font-data)', fontSize: '13px', fontWeight: 600, color: NATION_COLORS[nation] || 'var(--accent-primary)' }}>
                  {total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column — Commercialization + UCS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Commercialization Ratio Line Chart */}
          <div className="vela-panel">
            <div className="vela-label" style={{ marginBottom: '16px' }}>
              Commercial Share of Orbital Launches by Decade
            </div>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={COMMERCIALIZATION_DECADES} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradComm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="decade" stroke="rgba(255,255,255,0.1)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis domain={[0, 60]} stroke="rgba(255,255,255,0.1)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                    ticks={[0, 10, 20, 30, 40, 50, 60]} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <ReferenceLine y={50} stroke="var(--accent-warning)" strokeDasharray="6 4" strokeWidth={1.5}
                    label={{ value: 'PARITY THRESHOLD', position: 'right', fill: 'var(--accent-warning)', fontSize: 9, fontWeight: 600 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Commercial Share']} />
                  <Area type="monotone" dataKey="share" stroke="#3B82F6" strokeWidth={2}
                    fill="url(#gradComm)" dot={{ r: 3, fill: '#3B82F6', stroke: '#fff', strokeWidth: 1 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginTop: '8px' }}>
              Data: UCS Satellite Database · GCAT crosswalk
            </div>
          </div>

          {/* Active Satellite Operators — UCS */}
          <div className="vela-panel">
            <div className="vela-label" style={{ marginBottom: '16px' }}>
              Active Satellite Operators · UCS Database
            </div>
            {[
              { label: 'Commercial', pct: 80.4, color: '#3B82F6' },
              { label: 'Government', pct: 7.4, color: '#6366F1' },
              { label: 'Military', pct: 6.1, color: '#EF4444' },
              { label: 'Civil', pct: 2.1, color: '#10B981' },
              { label: 'Mixed', pct: 4.0, color: 'rgba(255,255,255,0.3)' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-data)', color: item.color, fontWeight: 600 }}>
                    {item.pct}%
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                  <div style={{
                    height: '100%', width: `${item.pct}%`,
                    background: item.color, borderRadius: '3px',
                    transition: 'width 800ms cubic-bezier(0.16,1,0.3,1)',
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

          {/* Key Nation Callouts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <NationCard flag="🇺🇸" nation="USA" launches="2,276" color="#3B82F6" />
            <NationCard flag="🇷🇺" nation="Russia/USSR" launches="3,099" sub="2,227 SU + 872 RU" color="#EF4444" />
            <NationCard flag="🇨🇳" nation="China" launches="726" color="#F59E0B" />
          </div>
        </div>
      </div>

      {/* Attribution */}
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
        fontFamily: 'var(--font-data)', fontSize: '36px',
        fontWeight: 700, color: 'rgba(255,255,255,0.9)',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      <div className="vela-label" style={{ marginTop: '8px' }}>{label}</div>
    </div>
  );
}

function NationCard({ flag, nation, launches, sub, color }) {
  return (
    <div style={{
      background: 'var(--surface-raised)', border: '1px solid var(--surface-border)',
      borderRadius: '8px', padding: '16px', textAlign: 'center',
      borderTop: `2px solid ${color}`,
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{flag}</div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: '20px', fontWeight: 700, color, letterSpacing: '-0.02em' }}>
        {launches}
      </div>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
        {nation}
      </div>
      {sub && (
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-data)', marginTop: '2px' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
