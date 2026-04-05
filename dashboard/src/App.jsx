import React, { useState, useEffect } from 'react';
import { Globe, Zap, TrendingUp, Rocket, BarChart2, Crosshair } from 'lucide-react';

// Views
import OrbitalView from './components/Globe/Globe';
import SpaceWeather from './components/SpaceWeather/SpaceWeather';
import ForecastPanel from './components/ForecastPanel/ForecastPanel';
import Missions from './components/Timeline/Timeline';
import GeopoliticalMap from './components/GeopoliticalMap/GeopoliticalMap';
import NEOPanel from './components/NEOPanel/NEOPanel';

const VIEWS = [
  { id: 'orbital', label: 'Orbital View', icon: Globe, component: OrbitalView },
  { id: 'weather', label: 'Space Weather', icon: Zap, component: SpaceWeather },
  { id: 'forecast', label: 'Kp Forecast', icon: TrendingUp, component: ForecastPanel },
  { id: 'missions', label: 'Missions', icon: Rocket, component: Missions },
  { id: 'geo', label: 'Geopolitical', icon: BarChart2, component: GeopoliticalMap },
  { id: 'neo', label: 'NEO Watch', icon: Crosshair, component: NEOPanel },
];

export default function App() {
  const [activeView, setActiveView] = useState(VIEWS[0].id);
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const ActiveComponent = VIEWS.find(v => v.id === activeView)?.component || OrbitalView;

  return (
    <div className="vela-app">
      
      {/* 200px Left Nav Rail */}
      <div className="vela-nav">
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '4px', background: 'var(--accent-primary)', borderRadius: '4px' }}>
            <Globe size={18} color="#000" />
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '16px', letterSpacing: '0.05em' }}>
            VELA
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {VIEWS.map(view => {
            const Icon = view.icon;
            const isActive = activeView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '6px', border: 'none',
                  background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  textAlign: 'left', width: '100%'
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: isActive ? 600 : 500 }}>
                  {view.label}
                </span>
              </button>
            );
          })}
        </div>
        
        <div style={{ padding: '24px 20px', borderTop: '1px solid var(--surface-border)' }}>
          <div className="vela-label" style={{ marginBottom: '4px' }}>SYSTEM STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="live-pulse" />
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '11px', color: 'var(--status-critical)' }}>
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="vela-main">
        {/* Topbar */}
        <div className="vela-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="vela-label">{VIEWS.find(v => v.id === activeView)?.label}</div>
            <div style={{ width: '1px', height: '16px', background: 'var(--surface-border)' }} />
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              MERIDIAN V2
            </div>
          </div>
          
          <div style={{ fontFamily: 'var(--font-data)', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            {utcTime}
          </div>
        </div>

        {/* View Container */}
        <div className="vela-content">
          <ActiveComponent />
        </div>
      </div>
      
    </div>
  );
}
