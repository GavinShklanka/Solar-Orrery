/**
 * Timeline.jsx — Vela Mission Reach Diagram (Meridian V2)
 * 
 * Scatter plot of humanity's furthest operational assets over time.
 * Y-axis: log10(distance in km). X-axis: year.
 * Era bands: Space Race (1957-1991), Post-Cold War (1991-2010), Commercial (2010+).
 * Reference lines at Lunar distance (384,400 km) and Mars (225M km).
 * 
 * All 54 milestones preserved from milestones.js.
 */

import React, { useState, useMemo } from 'react';
import { MILESTONES } from './milestones';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, ReferenceArea,
} from 'recharts';

function getDistance(name) {
  const n = name.toLowerCase();
  if (n.includes('voyager 1 enters interstellar')) return 24000000000;
  if (n.includes('voyager')) return 15000000000;
  if (n.includes('pluto') || n.includes('new horizons exactly')) return 5000000000;
  if (n.includes('saturn') || n.includes('cassini') || n.includes('huygens')) return 1400000000;
  if (n.includes('jupiter') || n.includes('galileo') || n.includes('pioneer 10')) return 750000000;
  if (n.includes('mars') || n.includes('viking') || n.includes('curiosity') || n.includes('perseverance') || n.includes('mariner 9') || n.includes('mangalyaan')) return 225000000;
  if (n.includes('comet') || n.includes('rosetta') || n.includes('philae')) return 500000000;
  if (n.includes('venus') || n.includes('venera')) return 108000000;
  if (n.includes('sun') || n.includes('solar') || n.includes('parker')) return 150000000;
  if (n.includes('jwst') || n.includes('james webb')) return 1500000;
  if (n.includes('luna') || n.includes('apollo') || n.includes('artemis') || n.includes('chandrayaan') || n.includes('chang\'e')) return 384400;
  if (n.includes('hubble') || n.includes('kepler')) return 570;
  if (n.includes('geo') || n.includes('telstar')) return 35786;
  return 400; // default LEO
}

function getTier(id) {
  const t1 = ['Apollo11', 'Sputnik', 'Voyager1IS', 'JWST', 'Vostok1', 'Hubble', 'Falcon9LZ1', 'Zarya'];
  return t1.some(k => id.includes(k)) ? 1 : 2;
}

const NATION_COLORS = {
  'Russia/USSR': '#EF4444',
  'USA': '#3B82F6',
  'Europe': '#10B981',
  'Japan': '#a855f7',
  'China': '#F59E0B',
  'India': '#6366F1',
  'Global': '#cbd5e1',
  'USA/Europe': '#38bdf8',
  'Russia/USA': '#f43f5e',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)',
        padding: '12px 16px', borderRadius: '6px', maxWidth: '280px',
      }}>
        <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
          {d.date} · {d.nation}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '6px', lineHeight: 1.3 }}>
          {d.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontFamily: 'var(--font-data)' }}>
          {d.distance.toExponential(2)} km
        </div>
        {d.vehicle && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-data)', marginTop: '4px' }}>
            {d.vehicle}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function Timeline() {
  const events = useMemo(() => {
    return MILESTONES.map(m => {
      const year = parseInt(m.date.substring(0, 4)) + (parseInt(m.date.substring(5, 7)) / 12);
      const dist = getDistance(m.name);
      return {
        ...m,
        year,
        distance: dist,
        logDist: Math.log10(dist),
        tier: getTier(m.id),
      };
    });
  }, []);

  const [selectedIdx, setSelectedIdx] = useState(
    events.findIndex(e => e.id === '1969-Apollo11') || 0
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <div style={{
        padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)', flexShrink: 0,
      }}>
        <div>
          <div className="vela-label">Mission Reach Diagram</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
            Plot of humanity's furthest operational assets over time (1957–Present).
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-data)', fontSize: '13px', color: 'var(--accent-primary)', fontWeight: 600 }}>
          {MILESTONES.length} MILESTONES
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', flex: 1, overflow: 'hidden' }}>

        {/* Scatter Plot */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                {/* Era bands */}
                <ReferenceArea x1={1957} x2={1991} fill="rgba(239,68,68,0.03)" />
                <ReferenceArea x1={1991} x2={2010} fill="rgba(59,130,246,0.03)" />
                <ReferenceArea x1={2010} x2={2026} fill="rgba(16,185,129,0.03)" />

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="year" domain={[1955, 2026]} tickCount={8}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'var(--font-data)' }}
                  stroke="rgba(255,255,255,0.1)" />
                <YAxis type="number" dataKey="logDist" domain={[2, 11]}
                  tickFormatter={val => {
                    const labels = { 2: 'LEO', 3: '1K', 4: '10K', 5: 'Lunar', 6: '1M', 7: '10M', 8: 'Mars', 9: 'Jupiter', 10: '10B', 11: 'ISM' };
                    return labels[val] || `10^${val}`;
                  }}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'var(--font-data)' }}
                  stroke="rgba(255,255,255,0.1)"
                  label={{ value: 'Distance (km, log scale)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />

                {/* Reference lines */}
                <ReferenceLine y={Math.log10(384400)} stroke="rgba(255,255,255,0.15)" strokeDasharray="6 4"
                  label={{ value: 'LUNAR DISTANCE', position: 'right', fill: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 600 }} />
                <ReferenceLine y={Math.log10(225000000)} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 6"
                  label={{ value: 'MARS', position: 'right', fill: 'rgba(255,255,255,0.25)', fontSize: 9 }} />

                <ZAxis type="number" dataKey="tier" range={[50, 120]} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }} />

                <Scatter data={events} onClick={(e) => {
                  const idx = events.findIndex(m => m.id === e.id);
                  if (idx >= 0) setSelectedIdx(idx);
                }}>
                  {events.map((entry, index) => (
                    <Cell key={`cell-${index}`}
                      fill={NATION_COLORS[entry.nation] || '#fff'}
                      stroke={index === selectedIdx ? '#fff' : 'none'}
                      strokeWidth={index === selectedIdx ? 2 : 0}
                      opacity={index === selectedIdx ? 1 : 0.65} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
            {Object.entries(NATION_COLORS).map(([nation, color]) => (
              <div key={nation} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                {nation}
              </div>
            ))}
          </div>

          {/* Era labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '0 40px' }}>
            <span style={{ fontSize: '8px', color: 'rgba(239,68,68,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Space Race 1957–1991
            </span>
            <span style={{ fontSize: '8px', color: 'rgba(59,130,246,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Post-Cold War 1991–2010
            </span>
            <span style={{ fontSize: '8px', color: 'rgba(16,185,129,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Commercial Era 2010+
            </span>
          </div>
        </div>

        {/* Sidebar Log */}
        <div style={{ borderLeft: '1px solid var(--surface-border)', overflowY: 'auto', background: 'var(--surface-raised)' }}>
          {events.map((evt, i) => (
            <div
              key={evt.id}
              onClick={() => setSelectedIdx(i)}
              style={{
                padding: '14px 16px', borderBottom: '1px solid var(--surface-border)',
                cursor: 'pointer',
                background: i === selectedIdx ? 'var(--accent-primary-dim)' : 'transparent',
                borderLeft: i === selectedIdx ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'all 150ms',
              }}
            >
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
                {evt.date} · {evt.nation}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: i === selectedIdx ? 600 : 400,
                color: i === selectedIdx ? '#fff' : 'rgba(255,255,255,0.7)',
                lineHeight: 1.4,
              }}>
                {evt.name}
              </div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--accent-primary)', marginTop: '4px', opacity: 0.7 }}>
                {evt.distance >= 1e9 ? `${(evt.distance / 1e9).toFixed(1)}B km` :
                 evt.distance >= 1e6 ? `${(evt.distance / 1e6).toFixed(1)}M km` :
                 evt.distance >= 1e3 ? `${(evt.distance / 1e3).toFixed(0)}K km` :
                 `${evt.distance} km`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
