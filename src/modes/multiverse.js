const THREE = window.THREE;

export function createMultiverseMode() {
  let engine = null;
  let scene = null;
  let camera = null;
  let renderer = null;
  
  const universes = [];
  const branes = []; // Higher dimensional membranes
  let time = 0;
  
  return {
    id: "multiverse",
    
    init(engineRef) {
      engine = engineRef;
      scene = engineRef.scene;
      camera = engineRef.camera;
      renderer = engineRef.renderer;
      
      camera.position.set(0, 500, 2000);
      camera.lookAt(0, 0, 0);
      
      console.log("🌐 Initializing Multiverse Mode - Infinite Realities");
      
      createBubbleUniverses();
      createBraneWorlds();
      createDimensionalGrid();
      createInfoOverlay();
      
      console.log("✅ Multiverse Mode ready - Exploring parallel realities!");
    },
    
    update(dt) {
      time += dt;
      
      // Universes expand and contract
      universes.forEach((universe, i) => {
        const breathe = Math.sin(time * 0.3 + i) * 0.1 + 1;
        universe.scale.setScalar(breathe);
        
        // Slow rotation
        universe.rotation.y += dt * 0.1;
        universe.rotation.x += dt * 0.05;
        
        // Color shift showing different physical laws
        const hue = (i / universes.length + time * 0.05) % 1;
        universe.material.color.setHSL(hue, 0.8, 0.5);
        universe.material.emissive.setHSL(hue, 0.8, 0.3);
      });
      
      // Branes oscillate through higher dimensions
      branes.forEach((brane, i) => {
        brane.position.y = Math.sin(time * 0.5 + i * 2) * 200;
        brane.rotation.z += dt * 0.2;
        
        // Transparency pulsing
        const pulse = Math.sin(time * 2 + i) * 0.2 + 0.3;
        brane.material.opacity = pulse;
      });
    },
    
    render() {
      renderer.render(scene, camera);
    },
    
    teardown() {
      universes.forEach(u => scene.remove(u));
      branes.forEach(b => scene.remove(b));
      
      const overlay = document.getElementById('multiverse-overlay');
      if (overlay) overlay.remove();
      
      console.log("🌐 Multiverse Mode cleaned up");
    }
  };
  
  function createBubbleUniverses() {
    // Eternal inflation - bubble universes nucleating from quantum foam
    const universeTypes = [
      { 
        name: "Our Universe", 
        laws: "Standard Model", 
        color: 0x4A90E2,
        description: "Our reality with 4 fundamental forces, stable atoms, and life"
      },
      { 
        name: "High-Mass Universe", 
        laws: "Strong gravity", 
        color: 0xFF4444,
        description: "Gravity 100× stronger - stars burn out in millions (not billions) of years"
      },
      { 
        name: "Low-Mass Universe", 
        laws: "Weak gravity", 
        color: 0x44FF44,
        description: "Weak gravity prevents star/galaxy formation - dark and diffuse"
      },
      { 
        name: "No-Photon Universe", 
        laws: "No electromagnetic force", 
        color: 0x444444,
        description: "No light, no chemistry, no atoms - only gravity and dark matter"
      },
      { 
        name: "Different Constants", 
        laws: "Altered fine-structure", 
        color: 0xFF00FF,
        description: "Fine-structure constant changed - atoms unstable, no molecules"
      },
      { 
        name: "Higher-Dim Universe", 
        laws: "11 dimensions visible", 
        color: 0x00FFFF,
        description: "Extra dimensions macro-scale - gravity behaves completely differently"
      },
      { 
        name: "Anti-Matter Universe", 
        laws: "CP symmetry reversed", 
        color: 0xFFFF00,
        description: "Made of antimatter instead of matter - identical physics, opposite charge"
      },
      { 
        name: "Fast-Time Universe", 
        laws: "Time flows 1000× faster", 
        color: 0xFF8800,
        description: "Aging accelerated - civilizations rise and fall in what feels like days"
      }
    ];
    
    universeTypes.forEach((type, i) => {
      const universe = createBubbleUniverse(type);
      
      // Arrange in 3D grid
      const gridSize = 3;
      const spacing = 600;
      const x = ((i % gridSize) - 1) * spacing;
      const y = (Math.floor(i / gridSize) - 1) * spacing;
      const z = (Math.floor(i / (gridSize * gridSize)) - 1) * spacing;
      
      universe.position.set(x, y, z);
      universe.userData = type;
      
      scene.add(universe);
      universes.push(universe);
      
      // Add label with description
      createUniverseLabel(universe.position, type.name, type.description, type.color);
    });
  }
  
  function createBubbleUniverse(type) {
    // Each universe as a bubble with internal structure
    const geometry = new THREE.SphereGeometry(200, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: type.color,
      transparent: true,
      opacity: 0.3,
      emissive: type.color,
      emissiveIntensity: 0.2,
      wireframe: false
    });
    
    const bubble = new THREE.Mesh(geometry, material);
    
    // Add internal galaxies
    for (let i = 0; i < 100; i++) {
      const galaxyGeo = new THREE.SphereGeometry(2, 8, 8);
      const galaxyMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const galaxy = new THREE.Mesh(galaxyGeo, galaxyMat);
      
      // Random position inside bubble
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * 180;
      
      galaxy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      
      bubble.add(galaxy);
    }
    
    // Outer membrane
    const membraneGeo = new THREE.SphereGeometry(210, 32, 32);
    const membraneMat = new THREE.MeshBasicMaterial({
      color: type.color,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      wireframe: true
    });
    const membrane = new THREE.Mesh(membraneGeo, membraneMat);
    bubble.add(membrane);
    
    return bubble;
  }
  
  function createBraneWorlds() {
    // M-Theory: 11-dimensional space with 3D branes
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.PlaneGeometry(2000, 2000, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        wireframe: true
      });
      
      const brane = new THREE.Mesh(geometry, material);
      brane.position.y = (i - 2) * 300;
      brane.rotation.x = Math.PI / 2;
      
      scene.add(brane);
      branes.push(brane);
      
      // Add label
      createBraneLabel(brane.position, `Brane ${i + 1}`, 0x00FFFF);
    }
  }
  
  function createDimensionalGrid() {
    // Visual representation of higher dimensions
    const gridHelper = new THREE.GridHelper(4000, 40, 0x444444, 0x222222);
    gridHelper.position.y = -800;
    scene.add(gridHelper);
    
    // Add dimensional axes
    const axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);
  }
  
  function createUniverseLabel(position, text, description, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 384;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.85)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    context.font = 'Bold 32px Arial';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.textAlign = 'center';
    context.fillText(text, 256, 60);
    
    // Description
    context.font = '20px Arial';
    context.fillStyle = '#CCCCCC';
    
    // Wrap text
    const words = description.split(' ');
    let line = '';
    let y = 120;
    const maxWidth = 480;
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        context.fillText(line, 256, y);
        line = word + ' ';
        y += 30;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, 256, y);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 280;
    sprite.scale.set(350, 260, 1);
    
    scene.add(sprite);
  }
  
  function createBraneLabel(position, text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    context.font = 'Bold 24px Arial';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.textAlign = 'center';
    context.fillText(text, 128, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.x += 1100;
    sprite.scale.set(200, 100, 1);
    
    scene.add(sprite);
  }
  
  function createInfoOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'multiverse-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 20px;
      border-radius: 12px;
      max-width: 420px;
      border: 2px solid #00FFFF;
      font-family: Arial;
      z-index: 1000;
      max-height: 90vh;
      overflow-y: auto;
    `;
    
    overlay.innerHTML = `
      <h2 style="margin: 0 0 15px 0; color: #00FFFF;">🌐 The Multiverse</h2>
      
      <div style="margin-bottom: 15px; padding: 15px; background: rgba(0, 255, 255, 0.2); border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">🫧 Bubble Universes</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">
          <strong>Eternal Inflation Theory:</strong> New universes constantly "bud off" 
          from quantum fluctuations. Each bubble has different physical constants and laws.
          <br><br>
          Our universe (blue) may be just one bubble in an infinite cosmic foam!
        </p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #FF00FF;">📐 Brane Worlds</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #ccc;">
          <strong>M-Theory (String Theory):</strong> Our 3D universe is a "brane" 
          (membrane) floating in 11-dimensional space. Multiple branes exist, each 
          potentially hosting a universe.
          <br><br>
          The flat grids represent different branes oscillating through higher dimensions.
        </p>
      </div>
      
      <div style="margin-bottom: 15px; padding: 12px; background: rgba(255, 255, 0, 0.1); border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">🌀 Many-Worlds Interpretation</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">
          Every quantum measurement creates a branching universe. When you observe a 
          particle, the universe splits: one where it's here, one where it's there.
          <br><br>
          <strong>Result:</strong> Infinite parallel yous making different choices!
        </p>
      </div>
      
      <div style="margin-bottom: 15px; padding: 12px; background: rgba(74, 144, 226, 0.1); border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">⚖️ Different Physical Laws</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">
          Each universe may have:
          <ul style="margin: 5px 0; padding-left: 20px; font-size: 12px;">
            <li>Different fundamental forces</li>
            <li>Alternate particle physics</li>
            <li>Varied speed of light</li>
            <li>Different number of dimensions</li>
            <li>Unique constants (gravity, charge, etc.)</li>
          </ul>
          Most would be inhospitable to life!
        </p>
      </div>
      
      <div style="font-size: 11px; color: #888; padding-top: 15px; border-top: 1px solid #333; line-height: 1.6;">
        <strong>⚠️ Note:</strong> All multiverse theories are currently hypothetical 
        and cannot be directly tested. They arise from mathematics and physics but 
        remain in the realm of theoretical cosmology.
        <br><br>
        <strong>Spheres:</strong> Bubble universes with internal galaxies<br>
        <strong>Grids:</strong> Branes in 11D space<br>
        <strong>Colors:</strong> Different physical laws per universe
      </div>
    `;
    
    document.body.appendChild(overlay);
  }
}