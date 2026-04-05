import React, { useState, useMemo } from 'react';
import { MILESTONES } from './milestones';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

function getDistance(name) {
  const n = name.toLowerCase();
  if (n.includes('voyager 1 enters interstellar')) return 24000000000;
  if (n.includes('voyager')) return 15000000000;
  if (n.includes('pluto')) return 5000000000;
  if (n.includes('saturn') || n.includes('cassini')) return 1400000000;
  if (n.includes('jupiter') || n.includes('galileo')) return 750000000;
  if (n.includes('mars') || n.includes('viking')) return 225000000;
  if (n.includes('comet') || n.includes('rosetta')) return 500000000;
  if (n.includes('sun') || n.includes('solar') || n.includes('parker')) return 150000000;
  if (n.includes('jwst') || n.includes('james webb')) return 1500000;
  if (n.includes('luna') || n.includes('apollo') || n.includes('artemis') || n.includes('chandrayaan') || n.includes('chang\'e')) return 384400;
  if (n.includes('geo') || n.includes('telstar')) return 35786;
  return 400; // default LEO (Sputnik, ISS, Mir, Vostok, etc)
}

function getTier(id) {
  if (id.includes('Apollo11') || id.includes('Sputnik') || id.includes('Voyager1IS') || id.includes('JWST') || id.includes('Vostok1')) return 1;
  return 2;
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
    const data = payload[0].payload;
    return (
      <div style={{ background: 'var(--surface-overlay)', border: '1px solid var(--surface-border)', padding: '12px', borderRadius: '4px' }}>
        <p style={{ fontFamily: 'var(--font-data)', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>{data.date.substring(0,4)} • {data.nation}</p>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{data.name}</p>
        <p style={{ fontSize: '11px', color: 'var(--accent-primary)', fontFamily: 'var(--font-data)' }}>Dist: {data.distance.toExponential(2)} km</p>
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
        tier: getTier(m.id)
      };
    });
  }, []);

  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <div style={{
        padding: '24px',
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', height: '100%', overflow: 'hidden' }}>
        
        {/* Scatter Plot */}
        <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="year" domain={[1955, 2026]} tickCount={8} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'var(--font-data)' }}
                  stroke="rgba(255,255,255,0.1)" />
                <YAxis type="number" dataKey="logDist" domain={[2, 11]} 
                  tickFormatter={val => `10^${val}`}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'var(--font-data)' }}
                  stroke="rgba(255,255,255,0.1)" label={{ value: 'Distance (km, log scale)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                
                {/* Reference Lines for Regimes */}
                <ReferenceLine y={Math.log10(400)} stroke="rgba(255,255,255,0.1)" strokeDasharray="2 4" />
                <ReferenceLine y={Math.log10(384400)} stroke="rgba(255,255,255,0.1)" strokeDasharray="2 4" />
                <ReferenceLine y={Math.log10(225000000)} stroke="rgba(255,255,255,0.1)" strokeDasharray="2 4" />
                
                <ZAxis type="number" dataKey="tier" range={[40, 100]} />
                <Tooltip content={<CustomTooltip />} cursor={{strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)'}} />
                
                <Scatter data={events} onClick={(e) => {
                  const idx = MILESTONES.findIndex(m => m.id === e.id);
                  if (idx >= 0) setSelectedIdx(idx);
                }}>
                  {events.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={NATION_COLORS[entry.nation] || '#fff'} 
                      stroke={index === selectedIdx ? '#fff' : 'none'} strokeWidth={2}
                      opacity={index === selectedIdx ? 1 : 0.6} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            {Object.entries(NATION_COLORS).map(([nation, color]) => (
              <div key={nation} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                {nation}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Log */}
        <div style={{ borderLeft: '1px solid var(--surface-border)', overflowY: 'auto', background: 'var(--surface-raised)' }}>
          {events.map((evt, i) => (
             <div
             key={evt.id}
             onClick={() => setSelectedIdx(i)}
             style={{
               padding: '16px', borderBottom: '1px solid var(--surface-border)',
               cursor: 'pointer',
               background: i === selectedIdx ? 'var(--accent-primary-dim)' : 'transparent',
               borderLeft: i === selectedIdx ? '2px solid var(--accent-primary)' : '2px solid transparent',
               transition: 'all 150ms',
             }}
           >
             <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
               {evt.date} • {evt.nation}
             </div>
             <div style={{ fontSize: '12px', fontWeight: i === selectedIdx ? 600 : 400, color: i === selectedIdx ? '#fff' : 'rgba(255,255,255,0.8)' }}>
               {evt.name}
             </div>
             <div style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--accent-primary)', marginTop: '4px' }}>
               {(evt.distance).toExponential(2)} km
             </div>
           </div>
          ))}
        </div>

      </div>
    </div>
  );
}
