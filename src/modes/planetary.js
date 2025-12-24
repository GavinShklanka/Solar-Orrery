// Use global THREE loaded from index.html
const THREE = window.THREE;

import { solarSystemData, scaleConfig, getVisualSize } from '../data/solarsystem.js';
import { createPlanetInfoPanel, showPlanetInfo, createHoverLabel, updateHoverLabel } from '../ui/planetInfo.js';
import { createCollapsiblePanel } from '../ui/collapsiblePanel.js';

export function createPlanetaryMode() {
  if (!THREE) {
    throw new Error("Three.js not loaded! Check index.html");
  }

  let engine = null;
  let scene = null;
  let camera = null;
  let renderer = null;
  
  const celestialBodies = [];
  const orbitLines = [];
  const labels = [];
  const comets = [];
  let habitableZone = null;
  let time = 0;
  let cometSpawnTimer = 0;
  
  // UI elements
  let infoPanel = null;
  let hoverLabel = null;
  
  // Raycasting for mouse interaction
  let raycaster = null;
  let mouse = null;
  let hoveredPlanet = null;
  
  // Camera controls
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let cameraRotation = { theta: 0, phi: Math.PI / 6 };
  let cameraDistance = 600; // Much further back to see entire system

  return {
    id: "planetary",
    
    init(engineRef) {
      engine = engineRef;
      scene = engineRef.scene;
      camera = engineRef.camera;
      renderer = engineRef.renderer;
      
      // Initialize raycaster and mouse
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      // Create UI elements
      infoPanel = createPlanetInfoPanel();
      hoverLabel = createHoverLabel();
      
      // Adjust camera to see entire solar system
      camera.position.set(0, 200, 600);
      camera.far = 50000; // Increase view distance
      camera.updateProjectionMatrix();
      
      console.log("🌍 Initializing Planetary Mode...");
      createSolarSystem();
      setupCameraControls();
      setupMouseInteraction();
      console.log("✅ Planetary Mode ready - All planets visible!");
    },
    
    update(dt) {
      time += dt;
      cometSpawnTimer += dt;
      
      // Spawn random comet every 10-20 seconds
      if (cometSpawnTimer > 10 + Math.random() * 10) {
        createComet();
        cometSpawnTimer = 0;
      }
      
      // Update comets
      comets.forEach((comet, index) => {
        comet.position.add(comet.userData.velocity);
        comet.userData.life -= dt;
        
        // Update tail
        if (comet.userData.tail) {
          comet.userData.tail.material.opacity = comet.userData.life / 10;
        }
        
        // Remove dead comets
        if (comet.userData.life <= 0) {
          scene.remove(comet);
          if (comet.userData.tail) scene.remove(comet.userData.tail);
          comets.splice(index, 1);
        }
      });
      
      // Update planet positions
      celestialBodies.forEach(body => {
        if (body.type === 'planet') {
          const planet = body.data;
          // Speed scales inversely with distance (Kepler's laws approximation)
          const baseSpeed = 0.5; // Slower for better viewing
          const speed = baseSpeed / Math.sqrt(planet.distance);
          const angle = time * speed;
          
          // Use the safe visual distance
          const distance = planet.visualDistance || (planet.distance * scaleConfig.planetary.distanceScale);
          body.mesh.position.x = Math.cos(angle) * distance;
          body.mesh.position.z = Math.sin(angle) * distance;
          
          // Rotate planet on axis
          const rotationSpeed = planet.rotationPeriod > 0 ? 0.01 : -0.01;
          body.mesh.rotation.y += rotationSpeed;
          
          // Update moon if Earth
          if (planet.name === "Earth" && body.moon) {
            const moonSpeed = 2.0; // Moon orbits faster for visibility
            const moonAngle = time * moonSpeed;
            const moonDist = 5; // Fixed distance from Earth
            
            body.moon.position.x = body.mesh.position.x + Math.cos(moonAngle) * moonDist;
            body.moon.position.z = body.mesh.position.z + Math.sin(moonAngle) * moonDist;
          }
        }
      });
      
      updateCamera();
    },
    
    render() {
      // Check for planet hover
      checkPlanetHover();
      renderer.render(scene, camera);
    },
    
    teardown() {
      celestialBodies.forEach(body => {
        scene.remove(body.mesh);
        if (body.moon) scene.remove(body.moon);
      });
      orbitLines.forEach(line => scene.remove(line));
      comets.forEach(comet => {
        scene.remove(comet);
        if (comet.userData.tail) scene.remove(comet.userData.tail);
      });
      if (habitableZone) scene.remove(habitableZone);
      
      // Remove UI elements
      if (infoPanel) infoPanel.remove();
      if (hoverLabel) hoverLabel.remove();
      
      removeCameraControls();
      removeMouseInteraction();
      console.log("🌍 Planetary Mode cleaned up");
    }
  };

  function createSolarSystem() {
    // Create Sun with better visual size
    const sunVisualRadius = solarSystemData.sun.radius * scaleConfig.planetary.sunSizeScale;
    const sunGeometry = new THREE.SphereGeometry(sunVisualRadius, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: solarSystemData.sun.color,
      emissive: solarSystemData.sun.emissive,
      emissiveIntensity: 1
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Add sun glow effect
    const glowGeometry = new THREE.SphereGeometry(sunVisualRadius * 1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFAA00,
      transparent: true,
      opacity: 0.3
    });
    const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(sunGlow);
    
    // Add point light at sun
    const sunLight = new THREE.PointLight(0xFFFFFF, 2, 5000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    
    celestialBodies.push({ mesh: sun, type: 'star', data: solarSystemData.sun });
    console.log("☀️ Sun created");
    
    // Create habitable zone FIRST (so it's behind planets)
    createHabitableZone();
    
    // Create planets with improved scaling
    solarSystemData.planets.forEach(planetData => {
      createPlanet(planetData);
    });
    
    console.log(`✅ Created ${celestialBodies.length} celestial bodies`);
    console.log(`📏 View spans from Mercury to Neptune`);
  }
  
  function createPlanet(planetData) {
    // Use logarithmic scaling for size
    const radius = getVisualSize(planetData.radius);
    const distance = planetData.distance * scaleConfig.planetary.distanceScale;
    
    // Calculate sun's visual radius to ensure planets orbit outside it
    const sunVisualRadius = solarSystemData.sun.radius * scaleConfig.planetary.sunSizeScale;
    const minSafeDistance = sunVisualRadius * 2.5; // Planets must be at least 2.5x sun radius away
    
    // Ensure planet is outside the sun
    const safeDistance = Math.max(distance, minSafeDistance);
    
    if (distance < minSafeDistance) {
      console.log(`⚠️ ${planetData.name}: Adjusted distance from ${distance.toFixed(1)} to ${safeDistance.toFixed(1)} (outside sun)`);
    }
    
    console.log(`🪐 ${planetData.name}: size=${radius.toFixed(1)}, distance=${safeDistance.toFixed(1)}`);
    
    // Create planet mesh with better materials
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: planetData.color,
      shininess: planetData.name === "Earth" ? 30 : 10,
      specular: planetData.name === "Earth" ? 0x333333 : 0x111111
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.x = safeDistance; // Use safe distance
    
    // Apply axial tilt
    planet.rotation.z = (planetData.axialTilt * Math.PI) / 180;
    
    scene.add(planet);
    
    const body = { 
      mesh: planet, 
      type: 'planet', 
      data: { ...planetData, visualDistance: safeDistance } // Store actual visual distance
    };
    
    // Add moon for Earth
    if (planetData.hasMoon) {
      const moonRadius = 0.6; // Small but visible moon
      const moonGeometry = new THREE.SphereGeometry(moonRadius, 16, 16);
      const moonMaterial = new THREE.MeshPhongMaterial({ color: solarSystemData.moon.color });
      const moon = new THREE.Mesh(moonGeometry, moonMaterial);
      scene.add(moon);
      body.moon = moon;
      console.log(`  🌙 Moon added to Earth`);
    }
    
    // Add rings for Saturn
    if (planetData.hasRings) {
      createRings(planet, radius);
    }
    
    celestialBodies.push(body);
    
    // Create orbit line with safe distance
    createOrbitLine(safeDistance, planetData.name);
  }
  
  function createRings(planet, planetRadius) {
    const ringGeometry = new THREE.RingGeometry(
      planetRadius * 1.5, 
      planetRadius * 2.5, 
      64
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xC9A46D,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    planet.add(rings);
    console.log(`  💍 Rings added`);
  }
  
  function createOrbitLine(radius, planetName) {
    const segments = 128;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      positions.push(
        Math.cos(theta) * radius,
        0,
        Math.sin(theta) * radius
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    // Different colors for inner vs outer planets
    const isInnerPlanet = radius < 50;
    const color = isInnerPlanet ? 0x666666 : 0x444444;
    const opacity = isInnerPlanet ? 0.4 : 0.25;
    
    const material = new THREE.LineBasicMaterial({ 
      color: color, 
      transparent: true, 
      opacity: opacity 
    });
    const orbitLine = new THREE.Line(geometry, material);
    scene.add(orbitLine);
    orbitLines.push(orbitLine);
  }
  
  function createHabitableZone() {
    const innerRadius = solarSystemData.habitableZone.inner * scaleConfig.planetary.distanceScale;
    const outerRadius = solarSystemData.habitableZone.outer * scaleConfig.planetary.distanceScale;
    
    console.log(`💚 Habitable zone: ${innerRadius.toFixed(1)} to ${outerRadius.toFixed(1)} units`);
    
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const material = new THREE.MeshBasicMaterial({
      color: solarSystemData.habitableZone.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2, // Slightly more visible
      depthWrite: false // Render behind planets
    });
    
    habitableZone = new THREE.Mesh(geometry, material);
    habitableZone.rotation.x = Math.PI / 2;
    habitableZone.renderOrder = -1; // Render first
    scene.add(habitableZone);
    
    console.log("💚 Habitable zone created (between Venus and Mars)");
  }
  
  function setupCameraControls() {
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  }
  
  function removeCameraControls() {
    renderer.domElement.removeEventListener('mousedown', onMouseDown);
    renderer.domElement.removeEventListener('mousemove', onMouseMove);
    renderer.domElement.removeEventListener('mouseup', onMouseUp);
    renderer.domElement.removeEventListener('wheel', onWheel);
  }
  
  function onMouseDown(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  function onMouseMove(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    
    cameraRotation.theta -= deltaX * 0.005;
    cameraRotation.phi -= deltaY * 0.005;
    
    cameraRotation.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.phi));
    
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  function onMouseUp() {
    isDragging = false;
  }
  
  function onWheel(e) {
    e.preventDefault();
    cameraDistance += e.deltaY * 0.5;
    cameraDistance = Math.max(100, Math.min(1500, cameraDistance)); // Wider zoom range for bigger system
  }
  
  function updateCamera() {
    camera.position.x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
    camera.position.y = cameraDistance * Math.cos(cameraRotation.phi);
    camera.position.z = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);
    camera.lookAt(0, 0, 0);
  }
  
  function setupMouseInteraction() {
    renderer.domElement.addEventListener('click', onPlanetClick);
    renderer.domElement.addEventListener('mousemove', onMouseMoveHover);
  }
  
  function removeMouseInteraction() {
    renderer.domElement.removeEventListener('click', onPlanetClick);
    renderer.domElement.removeEventListener('mousemove', onMouseMoveHover);
  }
  
  function onMouseMoveHover(event) {
    // Update mouse position for raycasting
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  function checkPlanetHover() {
    raycaster.setFromCamera(mouse, camera);
    
    const planetMeshes = celestialBodies
      .filter(b => b.type === 'planet')
      .map(b => b.mesh);
    
    const intersects = raycaster.intersectObjects(planetMeshes);
    
    if (intersects.length > 0) {
      const planetMesh = intersects[0].object;
      const body = celestialBodies.find(b => b.mesh === planetMesh);
      
      if (body && body.data.name !== hoveredPlanet) {
        hoveredPlanet = body.data.name;
        renderer.domElement.style.cursor = 'pointer';
        
        // Get mouse position for label
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = (mouse.x + 1) / 2 * rect.width + rect.left;
        const mouseY = (-mouse.y + 1) / 2 * rect.height + rect.top;
        
        updateHoverLabel(hoverLabel, hoveredPlanet, mouseX, mouseY);
      }
    } else {
      if (hoveredPlanet) {
        hoveredPlanet = null;
        renderer.domElement.style.cursor = 'default';
        updateHoverLabel(hoverLabel, null);
      }
    }
  }
  
  function onPlanetClick(event) {
    // Don't trigger if dragging
    if (isDragging) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const planetMeshes = celestialBodies
      .filter(b => b.type === 'planet')
      .map(b => b.mesh);
    
    const intersects = raycaster.intersectObjects(planetMeshes);
    
    if (intersects.length > 0) {
      const planetMesh = intersects[0].object;
      const body = celestialBodies.find(b => b.mesh === planetMesh);
      
      if (body) {
        console.log(`🖱️ Clicked on ${body.data.name}`);
        showPlanetInfo(body.data.name, infoPanel);
      }
    }
  }
}