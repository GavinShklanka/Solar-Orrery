const THREE = window.THREE;

// Hubble's constant (simplified): ~70 km/s/Mpc
const HUBBLE_CONSTANT = 0.00007; // Scaled for visualization

export function createCosmicMode() {
  let engine = null;
  let scene = null;
  let camera = null;
  let renderer = null;
  
  const galaxies = [];
  let universeAge = 13.8; // Billion years
  let timeDirection = 1; // 1 = forward, -1 = backward
  let cosmicTime = 0; // Simulation time
  
  // Timeline visualization
  let timeline = null;
  let timelineMarkers = [];
  
  return {
    id: "cosmic",
    
    init(engineRef) {
      engine = engineRef;
      scene = engineRef.scene;
      camera = engineRef.camera;
      renderer = engineRef.renderer;
      
      camera.position.set(0, 500, 2000);
      camera.lookAt(0, 0, 0);
      
      console.log("🌌 Initializing Cosmic Mode - Universe Expansion");
      
      createGalaxies();
      createTimeline();
      createInfoOverlay();
      
      console.log("✅ Cosmic Mode ready - Watch the universe expand!");
    },
    
    update(dt) {
      cosmicTime += dt * timeDirection * 0.05; // Much slower - was 0.5
      
      // Update galaxy positions based on Hubble's Law
      // v = H₀ × d (velocity = Hubble constant × distance)
      galaxies.forEach(galaxy => {
        const initialDistance = galaxy.userData.initialDistance;
        
        // Calculate expansion factor based on time - very slow
        const expansionFactor = 1 + (cosmicTime * HUBBLE_CONSTANT * 0.1);
        
        // Update position
        const newDistance = initialDistance * expansionFactor;
        const direction = galaxy.userData.direction;
        
        galaxy.position.x = direction.x * newDistance;
        galaxy.position.y = direction.y * newDistance;
        galaxy.position.z = direction.z * newDistance;
        
        // Calculate redshift (objects moving away appear redder)
        const velocity = (newDistance - initialDistance);
        const redshift = Math.min(Math.abs(velocity) * 0.001, 0.5);
        
        // Apply redshift to color
        const baseColor = galaxy.userData.baseColor;
        const shiftedColor = new THREE.Color(baseColor);
        shiftedColor.r = Math.min(1, shiftedColor.r + redshift * 0.2);
        shiftedColor.b = Math.max(0, shiftedColor.b - redshift * 0.2);
        
        galaxy.material.color = shiftedColor;
        
        // Slow rotation
        galaxy.rotation.z += dt * 0.02;
      });
      
      updateTimeline();
    },
    
    render() {
      renderer.render(scene, camera);
    },
    
    teardown() {
      galaxies.forEach(g => scene.remove(g));
      if (timeline) scene.remove(timeline);
      timelineMarkers.forEach(m => scene.remove(m));
      
      const overlay = document.getElementById('cosmic-overlay');
      if (overlay) overlay.remove();
      
      console.log("🌌 Cosmic Mode cleaned up");
    }
  };
  
  function createGalaxies() {
    // Create multiple galaxies at various distances
    const galaxyCount = 100;
    
    for (let i = 0; i < galaxyCount; i++) {
      const galaxy = createGalaxy();
      
      // Random spherical distribution
      const distance = 500 + Math.random() * 1500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const direction = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );
      
      galaxy.position.copy(direction.multiplyScalar(distance));
      
      // Store initial state
      galaxy.userData = {
        initialDistance: distance,
        direction: direction.normalize(),
        baseColor: galaxy.material.color.clone()
      };
      
      scene.add(galaxy);
      galaxies.push(galaxy);
    }
    
    console.log(`🌌 Created ${galaxyCount} galaxies`);
  }
  
  function createGalaxy() {
    // Create spiral galaxy shape
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    const arms = 2;
    const starsPerArm = 500;
    
    for (let arm = 0; arm < arms; arm++) {
      for (let i = 0; i < starsPerArm; i++) {
        const t = i / starsPerArm;
        const angle = arm * (Math.PI * 2 / arms) + t * Math.PI * 4;
        const radius = t * 30;
        
        const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 5;
        const y = (Math.random() - 0.5) * 3;
        const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 5;
        
        positions.push(x, y, z);
        
        // Color varies from blue (young stars) to red (old stars)
        const color = new THREE.Color();
        color.setHSL(0.6 - t * 0.1, 0.8, 0.5 + Math.random() * 0.3);
        colors.push(color.r, color.g, color.b);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Points(geometry, material);
  }
  
  function createTimeline() {
    // Create horizontal timeline: Past → Present → Future
    // Universe is 13.8B years old, expected to last trillions of years
    const totalTimespan = 100; // Representing ~100 billion years
    const currentAge = 13.8; // We are here
    const length = 6000; // Much longer timeline
    
    // Main timeline
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * length - length / 2;
      positions.push(x, -400, 0);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.8
    });
    
    timeline = new THREE.Line(geometry, material);
    scene.add(timeline);
    
    // Add gradient segments to show universe phases
    createTimelineSegments(length);
    
    // Add markers for major cosmic events (PAST)
    const events = [
      { time: 0, label: "Big Bang\n13.8B years ago", color: 0xFF4444, size: 20 },
      { time: 0.00038, label: "Cosmic Microwave\nBackground", color: 0xFFAA44, size: 12 },
      { time: 0.4, label: "First Stars\n13.4B years ago", color: 0xAAAAFF, size: 15 },
      { time: 1, label: "First Galaxies\n12.8B years ago", color: 0x8888FF, size: 15 },
      { time: 9.3, label: "Solar System\n4.5B years ago", color: 0x44FF44, size: 15 },
      { time: 13.77, label: "Dinosaurs\n65M years ago", color: 0x88FF88, size: 10 },
      { time: 13.799, label: "Humans\n300K years ago", color: 0x00FFFF, size: 10 },
      { time: 13.8, label: "TODAY ⭐\nYou Are Here!", color: 0xFFFFFF, size: 25 },
      
      // FUTURE events
      { time: 14.8, label: "1B years\nOceans evaporate", color: 0xFF8844, size: 12 },
      { time: 18.8, label: "5B years\nSun dies", color: 0xFF4444, size: 15 },
      { time: 113.8, label: "100B years\nStar formation ends", color: 0x444444, size: 15 },
      { time: 1013.8, label: "1T years\nGalaxies dissolve", color: 0x222222, size: 12 },
    ];
    
    events.forEach(event => {
      const fraction = event.time / totalTimespan;
      const marker = createTimelineMarker(fraction, event.label, event.color, event.size, length);
      scene.add(marker);
      timelineMarkers.push({ mesh: marker, event });
    });
    
    // Add "TODAY" beacon
    createTodayBeacon(currentAge / totalTimespan, length);
  }
  
  function createTimelineSegments(length) {
    // Show different eras with colored segments
    const segments = [
      { start: 0, end: 0.14, color: 0xFF4444, label: "PAST: Formation Era" },
      { start: 0.138, end: 0.14, color: 0x00FF00, label: "PRESENT: Stelliferous Era" },
      { start: 0.14, end: 1, color: 0x444444, label: "FUTURE: Degenerate Era" }
    ];
    
    segments.forEach(seg => {
      const geo = new THREE.PlaneGeometry((seg.end - seg.start) * length, 50);
      const mat = new THREE.MeshBasicMaterial({
        color: seg.color,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(geo, mat);
      plane.position.x = ((seg.start + seg.end) / 2) * length - length / 2;
      plane.position.y = -430;
      plane.rotation.x = Math.PI / 2;
      scene.add(plane);
    });
  }
  
  function createTodayBeacon(fraction, length) {
    // Subtle vertical line instead of intrusive beacon
    const lineGeo = new THREE.BufferGeometry();
    const linePos = [];
    linePos.push(fraction * length - length / 2, -500, 0);
    linePos.push(fraction * length - length / 2, 200, 0);
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00FF00,
      transparent: true,
      opacity: 0.4
    });
    
    const beacon = new THREE.Line(lineGeo, lineMat);
    scene.add(beacon);
    
    // Small glow at base
    const glowGeo = new THREE.SphereGeometry(8, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00FF00,
      transparent: true,
      opacity: 0.6
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(fraction * length - length / 2, -400, 0);
    scene.add(glow);
  }
  
  function createTimelineMarker(fraction, label, color, size, length) {
    const geometry = new THREE.SphereGeometry(size || 10, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
      color,
      emissive: color,
      emissiveIntensity: 0.5
    });
    const marker = new THREE.Mesh(geometry, material);
    
    marker.position.x = fraction * length - length / 2;
    marker.position.y = -400;
    marker.position.z = 0;
    
    marker.userData = { label, fraction };
    
    // Add text label (simplified - could use sprite for better text)
    createTextLabel(marker.position, label, color);
    
    return marker;
  }
  
  function createTextLabel(position, text, color) {
    // Create a simple visual label above the marker
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'Bold 20px Arial';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.textAlign = 'center';
    
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      context.fillText(line, 128, 40 + i * 25);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 60;
    sprite.scale.set(100, 50, 1);
    
    scene.add(sprite);
  }
  
  function updateTimeline() {
    // Move camera along timeline as universe ages
    const length = 3000;
    const fraction = (cosmicTime % 1);
    camera.position.x = fraction * length - length / 2;
  }
  
  function createInfoOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'cosmic-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 12px;
      max-width: 400px;
      border: 2px solid #4A90E2;
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;
    
    overlay.innerHTML = `
      <h2 style="margin: 0 0 15px 0; color: #4A90E2;">🌌 Cosmic Expansion</h2>
      
      <div style="margin-bottom: 15px; padding: 15px; background: rgba(74, 144, 226, 0.2); border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">Hubble's Law</h3>
        <p style="margin: 0; font-size: 14px; line-height: 1.6;">
          <strong>v = H₀ × d</strong><br>
          Velocity = Hubble Constant × Distance<br>
          <span style="font-size: 12px; color: #888;">
            Objects farther away recede faster
          </span>
        </p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #FF8844;">🔴 Redshift Effect</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #ccc;">
          As galaxies move away, their light stretches (redshifts). 
          Distant galaxies appear redder due to Doppler effect.
        </p>
      </div>
      
      <div style="margin-bottom: 15px; padding: 12px; background: rgba(255, 100, 100, 0.2); border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">⏱️ 4D Spacetime</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">
          The timeline below shows <strong>time as a dimension</strong>. 
          As we move forward in time (→), galaxies spread apart.
        </p>
      </div>
      
      <div style="margin-bottom: 15px; padding: 15px; background: rgba(255, 255, 0, 0.15); border-radius: 8px; border: 2px solid rgba(255, 255, 0, 0.4);">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #FFFF00;">⭐ We Are Young!</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">
          The universe is only <strong>13.8 billion years old</strong>. 
          Stars will keep forming for another <strong>100 trillion years</strong>!
          <br><br>
          We're in the "<strong>Stelliferous Era</strong>" - 
          the golden age of star and galaxy formation. 
          We're witnessing the universe's <em>youth</em>! 🌟
        </p>
      </div>
      
      <div style="font-size: 12px; color: #888; padding-top: 15px; border-top: 1px solid #333;">
        <strong>Universe Age:</strong> 13.8 billion years (0.0138% of total lifespan!)<br>
        <strong>Expansion Rate:</strong> ~70 km/s/Mpc<br>
        <strong>Observable Universe:</strong> ~93 billion light-years<br>
        <strong>Expected Star Formation:</strong> Until ~100 trillion years
      </div>
    `;
    
    document.body.appendChild(overlay);
  }
}