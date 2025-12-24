export function createControlPanel(engine) {
  const panel = document.createElement('div');
  panel.id = 'control-panel';
  panel.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    padding: 20px;
    border-radius: 12px;
    border: 2px solid #4A90E2;
    font-family: Arial, sans-serif;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    backdrop-filter: blur(10px);
    min-width: 800px;
  `;
  
  panel.innerHTML = `
    <div style="color: white; width: 100%;">
      <div style="margin-bottom: 8px; font-size: 12px; color: #888;">VIEW MODE</div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button id="btn-quantum" class="mode-btn">⚛️ Quantum</button>
        <button id="btn-planetary" class="mode-btn active">🪐 Planetary</button>
        <button id="btn-stellar" class="mode-btn">⭐ Stellar</button>
        <button id="btn-cosmic" class="mode-btn">🌌 Cosmic</button>
        <button id="btn-multiverse" class="mode-btn">🌐 Multiverse</button>
      </div>
    </div>
    
    <div style="width: 100%; color: white;">
      <div style="margin-bottom: 8px; font-size: 12px; color: #888; display: flex; justify-content: space-between;">
        <span>UNIVERSAL SCALE</span>
        <span id="current-scale" style="color: #4A90E2; font-weight: bold;">Planetary</span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="font-size: 10px; color: #666;">Quantum</span>
        <input type="range" id="scale-slider" min="0" max="10" value="6" step="0.1" 
               style="flex: 1; height: 8px; border-radius: 4px; background: linear-gradient(to right, #9900FF, #4A90E2, #00FF00, #FF00FF);">
        <span style="font-size: 10px; color: #666;">Multiverse</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 9px; color: #444;">
        <span>10⁻³⁵m</span>
        <span>Human</span>
        <span>Planet</span>
        <span>Galaxy</span>
        <span>∞</span>
      </div>
    </div>
    
    <div style="width: 2px; height: 40px; background: #333;"></div>
    
    <div style="color: white;">
      <div style="margin-bottom: 8px; font-size: 12px; color: #888;">TIME SPEED</div>
      <div style="display: flex; gap: 10px;">
        <button id="btn-pause" class="time-btn">⏸️ Pause</button>
        <button id="btn-slow" class="time-btn">0.5× Slow</button>
        <button id="btn-normal" class="time-btn active">1× Normal</button>
        <button id="btn-fast" class="time-btn">3× Fast</button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .mode-btn, .time-btn {
      background: rgba(74, 144, 226, 0.2);
      border: 1px solid #4A90E2;
      color: white;
      padding: 10px 15px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      font-family: Arial, sans-serif;
    }
    
    .mode-btn:hover:not(:disabled), .time-btn:hover:not(:disabled) {
      background: rgba(74, 144, 226, 0.4);
      transform: translateY(-2px);
    }
    
    .mode-btn.active, .time-btn.active {
      background: #4A90E2;
      border-color: #6AB0FF;
    }
    
    .mode-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    #scale-slider {
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
    }
    
    #scale-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #4A90E2;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(74, 144, 226, 0.8);
    }
    
    #scale-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #4A90E2;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(74, 144, 226, 0.8);
      border: none;
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(panel);
  
  // Add event listeners
  setupEventListeners(engine);
  
  return panel;
}

function setupEventListeners(engine) {
  // Mode switching
  document.getElementById('btn-quantum').addEventListener('click', () => {
    switchMode('quantum', engine);
  });
  
  document.getElementById('btn-planetary').addEventListener('click', () => {
    switchMode('planetary', engine);
  });
  
  document.getElementById('btn-stellar').addEventListener('click', () => {
    switchMode('stellar', engine);
  });
  
  document.getElementById('btn-cosmic').addEventListener('click', () => {
    switchMode('cosmic', engine);
  });
  
  document.getElementById('btn-multiverse').addEventListener('click', () => {
    switchMode('multiverse', engine);
  });
  
  // Scale slider
  const scaleNames = [
    'Quantum', 'Subatomic', 'Atomic', 'Molecular', 
    'Cellular', 'Human', 'Planetary', 'Stellar', 
    'Galactic', 'Cosmic', 'Multiverse'
  ];
  
  document.getElementById('scale-slider').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    const index = Math.floor(value);
    const scaleName = scaleNames[index];
    document.getElementById('current-scale').textContent = scaleName;
    
    // Auto-switch mode based on scale
    if (index <= 1) switchMode('quantum', engine);
    else if (index <= 5) switchMode('planetary', engine);
    else if (index <= 8) switchMode('cosmic', engine);
    else switchMode('multiverse', engine);
  });
  
  // Time controls
  document.getElementById('btn-pause').addEventListener('click', () => {
    engine.time.pause();
    setActiveButton('time-btn', 'btn-pause');
  });
  
  document.getElementById('btn-slow').addEventListener('click', () => {
    engine.time.play();
    engine.time.setSpeed(0.5);
    setActiveButton('time-btn', 'btn-slow');
  });
  
  document.getElementById('btn-normal').addEventListener('click', () => {
    engine.time.play();
    engine.time.setSpeed(1);
    setActiveButton('time-btn', 'btn-normal');
  });
  
  document.getElementById('btn-fast').addEventListener('click', () => {
    engine.time.play();
    engine.time.setSpeed(3);
    setActiveButton('time-btn', 'btn-fast');
  });
}

function switchMode(modeName, engine) {
  console.log(`🔄 Switching to ${modeName} mode`);
  
  // Import and set the new mode
  if (modeName === 'quantum') {
    import('../modes/quantum.js').then(module => {
      engine.setMode(module.createQuantumMode());
      setActiveButton('mode-btn', 'btn-quantum');
    });
  } else if (modeName === 'planetary') {
    import('../modes/planetary.js').then(module => {
      engine.setMode(module.createPlanetaryMode());
      setActiveButton('mode-btn', 'btn-planetary');
    });
  } else if (modeName === 'stellar') {
    import('../modes/stellar.js').then(module => {
      engine.setMode(module.createStellarMode());
      setActiveButton('mode-btn', 'btn-stellar');
    });
  } else if (modeName === 'cosmic') {
    import('../modes/cosmic.js').then(module => {
      engine.setMode(module.createCosmicMode());
      setActiveButton('mode-btn', 'btn-cosmic');
    });
  } else if (modeName === 'multiverse') {
    import('../modes/multiverse.js').then(module => {
      engine.setMode(module.createMultiverseMode());
      setActiveButton('mode-btn', 'btn-multiverse');
    });
  }
}

function setActiveButton(className, activeId) {
  document.querySelectorAll(`.${className}`).forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(activeId).classList.add('active');
}