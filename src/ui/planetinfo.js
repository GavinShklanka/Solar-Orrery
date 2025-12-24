// Planet information and comparison data
export const planetComparisons = {
  Mercury: {
    volume: 0.056, // Earth volumes
    mass: 0.055, // Earth masses
    avgTemp: 167, // Celsius
    seasons: "None (no axial tilt)",
    daysPerYear: 88,
    surfaceGravity: 0.38, // Earth = 1
    atmosphereComposition: "Essentially none",
    jupitersFit: 24622, // How many Mercurys fit in Jupiter
    earthsFit: 18,
    inSun: 21900000,
    description: "The smallest and closest planet to the Sun. Surface temperatures swing from -173°C at night to 427°C during the day."
  },
  Venus: {
    volume: 0.857,
    mass: 0.815,
    avgTemp: 462,
    seasons: "None (almost no tilt)",
    daysPerYear: 225,
    surfaceGravity: 0.91,
    atmosphereComposition: "96.5% CO₂, thick clouds of sulfuric acid",
    jupitersFit: 1406,
    earthsFit: 1.2,
    inSun: 1500000,
    description: "The hottest planet due to runaway greenhouse effect. Rotates backwards and has a day longer than its year."
  },
  Earth: {
    volume: 1.0,
    mass: 1.0,
    avgTemp: 15,
    seasons: "4 distinct seasons (23.4° tilt)",
    daysPerYear: 365.25,
    surfaceGravity: 1.0,
    atmosphereComposition: "78% N₂, 21% O₂, 1% other",
    jupitersFit: 1321,
    earthsFit: 1,
    inSun: 1300000,
    description: "The only known planet with life. Liquid water covers 71% of surface. Protected by magnetic field and ozone layer."
  },
  Mars: {
    volume: 0.151,
    mass: 0.107,
    avgTemp: -65,
    seasons: "4 seasons (25.2° tilt, similar to Earth)",
    daysPerYear: 687,
    surfaceGravity: 0.38,
    atmosphereComposition: "95% CO₂, very thin",
    jupitersFit: 7000,
    earthsFit: 6.6,
    inSun: 8600000,
    description: "The Red Planet has the largest volcano (Olympus Mons) and canyon (Valles Marineris) in the solar system."
  },
  Jupiter: {
    volume: 1321,
    mass: 317.8,
    avgTemp: -110,
    seasons: "Minimal (3.1° tilt)",
    daysPerYear: 4333,
    surfaceGravity: 2.53,
    atmosphereComposition: "90% H₂, 10% He, no solid surface",
    jupitersFit: 1,
    earthsFit: 0.00076,
    inSun: 1000,
    description: "Largest planet with 79+ moons. The Great Red Spot is a storm larger than Earth that has raged for 350+ years."
  },
  Saturn: {
    volume: 764,
    mass: 95.2,
    avgTemp: -140,
    seasons: "4 seasons (26.7° tilt)",
    daysPerYear: 10759,
    surfaceGravity: 1.07,
    atmosphereComposition: "96% H₂, 3% He, no solid surface",
    jupitersFit: 1.7,
    earthsFit: 0.0013,
    inSun: 1700,
    description: "Famous for spectacular rings made of ice and rock. Could float in water (less dense than H₂O)!"
  },
  Uranus: {
    volume: 63,
    mass: 14.5,
    avgTemp: -195,
    seasons: "Extreme seasons (97.8° tilt - rotates on its side!)",
    daysPerYear: 30687,
    surfaceGravity: 0.89,
    atmosphereComposition: "83% H₂, 15% He, 2% CH₄ (methane gives blue color)",
    jupitersFit: 21,
    earthsFit: 0.016,
    inSun: 21000,
    description: "Coldest planet despite not being farthest. Unique sideways rotation means each pole gets 42 years of sunlight, then 42 years of darkness."
  },
  Neptune: {
    volume: 58,
    mass: 17.1,
    avgTemp: -200,
    seasons: "4 seasons (28.3° tilt)",
    daysPerYear: 60190,
    surfaceGravity: 1.14,
    atmosphereComposition: "80% H₂, 19% He, 1.5% CH₄",
    jupitersFit: 23,
    earthsFit: 0.017,
    inSun: 22000,
    description: "Farthest planet with the fastest winds (2,100 km/h). So far from Sun that it hasn't completed one orbit since discovery (1846)."
  }
};

export function createPlanetInfoPanel() {
  const panel = document.createElement('div');
  panel.id = 'planet-info-panel';
  panel.style.cssText = `
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 12px;
    max-width: 350px;
    border: 2px solid #4A90E2;
    box-shadow: 0 0 30px rgba(74, 144, 226, 0.5);
    font-family: Arial, sans-serif;
    display: none;
    z-index: 1000;
    backdrop-filter: blur(10px);
  `;
  
  document.body.appendChild(panel);
  return panel;
}

export function showPlanetInfo(planetName, panel) {
  const info = planetComparisons[planetName];
  if (!info) return;
  
  const earthsInJupiter = planetComparisons.Jupiter.volume;
  const thisInJupiter = info.jupitersFit;
  
  panel.innerHTML = `
    <div style="border-bottom: 2px solid #4A90E2; padding-bottom: 10px; margin-bottom: 15px;">
      <h2 style="margin: 0; color: #4A90E2; font-size: 24px;">🪐 ${planetName}</h2>
      <p style="margin: 5px 0 0 0; font-size: 13px; color: #888; font-style: italic;">
        ${info.description}
      </p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #4A90E2;">📊 Size Comparisons</h3>
      <div style="background: rgba(74, 144, 226, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
        <strong>Relative to Earth:</strong><br>
        ${info.volume === 1 ? 
          "This is Earth! 🌍" : 
          info.volume > 1 ? 
            `${info.volume.toFixed(1)}× larger (${Math.round(1/info.earthsFit).toLocaleString()} Earths fit inside)` :
            `${(1/info.volume).toFixed(1)}× smaller (${info.earthsFit.toFixed(1)} ${planetName}s fit in Earth)`
        }
      </div>
      <div style="background: rgba(201, 164, 109, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
        <strong>Relative to Jupiter:</strong><br>
        ${planetName === 'Jupiter' ? 
          "This is Jupiter! Largest planet 🎯" :
          `${thisInJupiter.toLocaleString()} ${planetName}s fit in Jupiter`
        }
      </div>
      <div style="background: rgba(253, 184, 19, 0.1); padding: 10px; border-radius: 8px;">
        <strong>Relative to Sun:</strong><br>
        ${info.inSun.toLocaleString()} ${planetName}s fit in the Sun ☀️
      </div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #4A90E2;">🌡️ Physical Properties</h3>
      <table style="width: 100%; font-size: 13px; line-height: 1.8;">
        <tr>
          <td style="color: #888;">Avg Temperature:</td>
          <td style="text-align: right;"><strong>${info.avgTemp}°C</strong></td>
        </tr>
        <tr>
          <td style="color: #888;">Surface Gravity:</td>
          <td style="text-align: right;"><strong>${info.surfaceGravity}× Earth</strong></td>
        </tr>
        <tr>
          <td style="color: #888;">Days per Year:</td>
          <td style="text-align: right;"><strong>${info.daysPerYear.toLocaleString()}</strong></td>
        </tr>
        <tr>
          <td style="color: #888;">Mass:</td>
          <td style="text-align: right;"><strong>${info.mass}× Earth</strong></td>
        </tr>
      </table>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #4A90E2;">🌦️ Climate</h3>
      <div style="background: rgba(0, 255, 0, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
        <strong>Seasons:</strong><br>
        ${info.seasons}
      </div>
      <div style="background: rgba(100, 180, 255, 0.1); padding: 10px; border-radius: 8px; font-size: 12px;">
        <strong>Atmosphere:</strong><br>
        ${info.atmosphereComposition}
      </div>
    </div>
    
    <button onclick="this.parentElement.style.display='none'" 
            style="width: 100%; padding: 10px; background: #4A90E2; border: none; 
                   border-radius: 6px; color: white; font-size: 14px; cursor: pointer;
                   font-weight: bold;">
      Close
    </button>
  `;
  
  panel.style.display = 'block';
}

export function createHoverLabel() {
  const label = document.createElement('div');
  label.id = 'planet-hover-label';
  label.style.cssText = `
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    pointer-events: none;
    display: none;
    z-index: 999;
    border: 1px solid rgba(255, 255, 255, 0.3);
  `;
  
  document.body.appendChild(label);
  return label;
}

export function updateHoverLabel(label, planetName, mouseX, mouseY) {
  if (!planetName) {
    label.style.display = 'none';
    return;
  }
  
  const info = planetComparisons[planetName];
  label.innerHTML = `
    <strong>${planetName}</strong><br>
    <span style="font-size: 12px; color: #aaa;">
      ${info.avgTemp}°C · ${info.surfaceGravity}g · ${info.volume.toFixed(1)}× Earth
    </span>
  `;
  label.style.display = 'block';
  label.style.left = (mouseX + 15) + 'px';
  label.style.top = (mouseY + 15) + 'px';
}