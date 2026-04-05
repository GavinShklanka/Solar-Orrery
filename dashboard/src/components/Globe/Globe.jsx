import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSatellites } from '../../hooks/useAPI';

const ARTEMIS_II_PROFILE = {
  launch: new Date('2026-04-01T22:35:12Z').getTime(), // Launch to UTC
  lunarFlyby: new Date('2026-04-06T14:30:00Z').getTime(),
  splashdown: new Date('2026-04-11T18:00:00Z').getTime(),
  totalDurationMs: new Date('2026-04-11T18:00:00Z').getTime() - new Date('2026-04-01T22:35:12Z').getTime(),
  maxDistanceKm: 400000, 
  lunarDistanceKm: 384400,
};

const R_EARTH = 6371;

function getMissionState() {
  const now = Date.now();
  const { launch, splashdown, lunarDistanceKm } = ARTEMIS_II_PROFILE;
  
  if (now < launch) return { isActive: false, progress: 0, distanceEarth: 0, distanceMoon: lunarDistanceKm, velocity: 0, met: 'T-MINUS' };
  if (now > splashdown) return { isActive: false, progress: 1, distanceEarth: 0, distanceMoon: lunarDistanceKm, velocity: 0, met: 'MISSION COMPLETE' };
  
  const elapsed = now - launch;
  const progress = elapsed / ARTEMIS_II_PROFILE.totalDurationMs;
  
  // Approximate distance (simplified free return elliptical mapping)
  const angle = progress * Math.PI * 2;
  // Outbound 0-0.5 progress means leaving Earth going to maxDistance
  // Return 0.5-1 progress means returning
  const distanceEarth = Math.abs(Math.sin(progress * Math.PI)) * ARTEMIS_II_PROFILE.maxDistanceKm;
  const distanceMoon = Math.abs(ARTEMIS_II_PROFILE.lunarDistanceKm - distanceEarth);
  
  // Velocity approximation: faster near earth, slower near moon
  // Typical translunar coast is ~3000-8000 km/h, peaking at injection ~40000 km/h
  const velocity = 8000 * Math.max(0.1, Math.cos(progress * Math.PI)); // rough approximation in km/h

  // Format Elapsed Time
  const d = Math.floor(elapsed / 86400000);
  const h = Math.floor((elapsed % 86400000) / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);
  const met = `L+${d.toString().padStart(2, '0')}:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  
  return { isActive: true, progress, distanceEarth, distanceMoon, velocity: Math.abs(velocity), met };
}

export default function Globe() {
  const canvasRef = useRef(null);
  const { data: satData, loading: satLoading } = useSatellites();
  const [missionState, setMissionState] = useState(getMissionState());

  // Simulation Loop
  useEffect(() => {
    let animationFrameId;
    let pulseAngle = 0;

    const render = () => {
      const state = getMissionState();
      setMissionState(state);

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // ── Background Void ──────────────────────────────────────────────
      ctx.fillStyle = '#060912';
      ctx.fillRect(0, 0, width, height);

      // Polar grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const cx = width * 0.3; // Earth center
      const cy = height * 0.5;
      
      for (let r = 50; r < width; r += 100) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(i * Math.PI / 6) * width, cy + Math.sin(i * Math.PI / 6) * width);
        ctx.stroke();
      }

      // Space metrics / Scale
      const scaleKmToPx = (width * 0.6) / ARTEMIS_II_PROFILE.maxDistanceKm;
      
      // Reference Rings
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;

      // LEO Ring (~2000km)
      ctx.beginPath();
      ctx.arc(cx, cy, (R_EARTH + 2000) * scaleKmToPx, 0, Math.PI * 2);
      ctx.stroke();

      // GEO Ring (~35786km)
      ctx.beginPath();
      ctx.arc(cx, cy, (R_EARTH + 35786) * scaleKmToPx, 0, Math.PI * 2);
      ctx.stroke();

      // Lunar Distance
      ctx.beginPath();
      ctx.arc(cx, cy, ARTEMIS_II_PROFILE.lunarDistanceKm * scaleKmToPx, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);
      
      // Labels
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = "10px 'Inter', sans-serif";
      ctx.fillText("LEO", cx + (R_EARTH + 2000) * scaleKmToPx + 4, cy - 4);
      ctx.fillText("GEO", cx + (R_EARTH + 35786) * scaleKmToPx + 4, cy - 4);
      ctx.fillText("LUNAR ORBIT", cx + ARTEMIS_II_PROFILE.lunarDistanceKm * scaleKmToPx + 4, cy - 4);

      // ── Satellite Point Cloud Overlay ─────────────────────────────────
      if (satData?.satellites) {
        const REGIMES = {
          LEO: { color: '#3B82F6', alt: 1000 },
          MEO: { color: '#10B981', alt: 10000 },
          GEO: { color: '#F59E0B', alt: 35786 },
          HEO: { color: '#6366F1', alt: 25000 },
        };
        
        satData.satellites.forEach((sat, idx) => {
          // Fake distribution for demo based on mean_motion
          let regime = 'HEO';
          if (sat.mean_motion > 11) regime = 'LEO';
          else if (sat.mean_motion > 2) regime = 'MEO';
          else if (sat.mean_motion > 0.9 && sat.mean_motion < 1.1) regime = 'GEO';
          
          const clr = REGIMES[regime].color;
          const alt = REGIMES[regime].alt * scaleKmToPx;
          // Seed pseudo-random angle based on index
          const angle = (idx * 137.5) * Math.PI / 180;
          const sx = cx + Math.cos(angle) * (alt + Math.random()*5);
          const sy = cy + Math.sin(angle) * (alt + Math.random()*5);
          
          ctx.fillStyle = clr;
          ctx.globalAlpha = Math.random() * 0.5 + 0.3;
          ctx.beginPath();
          ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      }

      // ── Draw Orbit Trajectory ─────────────────────────────────────────
      // Draw ellipse arc to Moon
      const mx = cx + ARTEMIS_II_PROFILE.lunarDistanceKm * scaleKmToPx;
      const my = cy;
      const ellipseRx = (mx - cx) / 2 + 10;
      const ellipseRy = 100;
      const elCx = cx + ellipseRx;
      const elCy = cy;

      // Full trajectory
      const trajPoints = Array.from({length: 200}).map((_, i) => {
        const t = i / 199;
        const theta = Math.PI - t * Math.PI * 2; // start from Earth left, go out right
        return {
          t,
          x: elCx + ellipseRx * Math.cos(theta),
          y: elCy + ellipseRy * Math.sin(theta)
        };
      });

      // Split into past and future
      const pastTraj = trajPoints.filter(p => p.t <= state.progress);
      const futureTraj = trajPoints.filter(p => p.t > state.progress);

      // Future Trajectory (Dashed)
      if (futureTraj.length > 0) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        // Start from last past point to connect line
        const startP = pastTraj.length > 0 ? pastTraj[pastTraj.length - 1] : futureTraj[0];
        ctx.moveTo(startP.x, startP.y);
        futureTraj.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
      }

      // Past Trajectory (Solid)
      if (pastTraj.length > 0) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pastTraj[0].x, pastTraj[0].y);
        pastTraj.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }

      // ── Orion Position Marker ───────────────────────────────────────
      if (pastTraj.length > 0) {
        pulseAngle += 0.05;
        const orion = pastTraj[pastTraj.length - 1];
        
        // Pulse Ring
        ctx.strokeStyle = 'rgba(59,130,246,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(orion.x, orion.y, 4 + Math.sin(pulseAngle) * 2, 0, Math.PI * 2);
        ctx.stroke();

        // Core Dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(orion.x, orion.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3B82F6';
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText("ORION", orion.x + 10, orion.y - 10);
      }

      // ── Earth ───────────────────────────────────────────────────────
      const earthPx = R_EARTH * scaleKmToPx;
      const glow = ctx.createRadialGradient(cx, cy, earthPx, cx, cy, earthPx * 4);
      glow.addColorStop(0, 'rgba(59,130,246,0.25)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, earthPx * 4, 0, Math.PI * 2);
      ctx.fill();

      // Earth body
      ctx.fillStyle = '#1a3a5c';
      ctx.beginPath();
      ctx.arc(cx, cy, earthPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Earth Label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = "bold 11px 'Inter', sans-serif";
      ctx.fillText("EARTH", cx - 18, cy + earthPx + 15);

      // ── Moon ────────────────────────────────────────────────────────
      const moonR = 1737 * scaleKmToPx;
      
      const moonGlow = ctx.createRadialGradient(mx, my, moonR, mx, my, moonR * 3);
      moonGlow.addColorStop(0, 'rgba(255,255,255,0.1)');
      moonGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(mx, my, moonR * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#444c56';
      ctx.beginPath();
      ctx.arc(mx, my, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b9bb4';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText("MOON", mx - 15, my + moonR + 15);

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [satData]);

  const { met, distanceEarth, distanceMoon, velocity } = missionState;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#060912', overflow: 'hidden' }}>
      
      {/* Top Source Attribution */}
      <div style={{
        position: 'absolute', top: 16, left: 24, zIndex: 10,
        fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.6)'
      }}>
        <div style={{ color: '#fff', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>
          ARTEMIS II — CREW: Wiseman · Glover · Koch · Hansen — ORION 'INTEGRITY'
        </div>
        <div>
          Mission data: NASA Artemis II · Local Trajectory Approximation · Satellite positions: CelesTrak · Not affiliated with NASA
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Intelligence Strip HUD */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '64px', background: 'rgba(6,9,18,0.85)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', zIndex: 10
      }}>
        
        {/* MET */}
        <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={hudLabel}>MISSION ELAPSED TIME</div>
          <div style={hudValue}>{met}</div>
        </div>

        <div style={hudDivider} />

        {/* DISTANCE FROM EARTH */}
        <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={hudLabel}>DISTANCE FROM EARTH</div>
          <div style={hudValue}>
            {Math.round(distanceEarth).toLocaleString()} <span style={hudUnit}>km</span>
          </div>
        </div>

        <div style={hudDivider} />

        {/* DISTANCE TO MOON */}
        <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={hudLabel}>DISTANCE TO MOON</div>
          <div style={hudValue}>
            {Math.round(distanceMoon).toLocaleString()} <span style={hudUnit}>km</span>
          </div>
        </div>

        <div style={hudDivider} />

        {/* VELOCITY */}
        <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={hudLabel}>VELOCITY (APPROX)</div>
          <div style={hudValue}>
            {Math.round(velocity).toLocaleString()} <span style={hudUnit}>km/h</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const hudLabel = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: '4px'
};

const hudValue = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '20px',
  fontWeight: 700,
  color: '#3B82F6',
  letterSpacing: '-0.02em',
};

const hudUnit = {
  fontSize: '11px',
  fontWeight: 400,
  color: 'rgba(255,255,255,0.4)',
  marginLeft: '4px'
};

const hudDivider = {
  width: '1px',
  height: '28px',
  background: 'rgba(255,255,255,0.1)',
  flexShrink: 0,
};
