const THREE = window.THREE;

import { createCollapsiblePanel } from '../ui/collapsiblePanel.js';

// Hertzsprung-Russell Diagram data
const starTypes = [
  {
    type: "O-Type",
    name: "Blue Supergiant",
    color: 0x9BB0FF,
    temp: 30000,
    luminosity: 1000000,
    mass: 60,
    size: 15,
    examples: ["Rigel", "Naos"]
  },
  {
    type: "B-Type",
    name: "Blue Giant",
    color: 0xAABFFF,
    temp: 20000,
    luminosity: 10000,
    mass: 18,
    size: 12,
    examples: ["Spica", "Achernar"]
  },
  {
    type: "A-Type",
    name: "White Star",
    color: 0xCAD7FF,
    temp: 9000,
    luminosity: 40,
    mass: 2.5,
    size: 8,
    examples: ["Sirius", "Vega"]
  },
  {
    type: "F-Type",
    name: "Yellow-White",
    color: 0xF8F7FF,
    temp: 7200,
    luminosity: 5,
    mass: 1.5,
    size: 6,
    examples: ["Procyon"]
  },
  {
    type: "G-Type",
    name: "Our Sun ☀️",
    color: 0xFFF4EA,
    temp: 5800,
    luminosity: 1,
    mass: 1,
    size: 5,
    examples: ["Sun", "Alpha Centauri A"]
  },
  {
    type: "K-Type",
    name: "Orange Dwarf",
    color: 0xFFD2A1,
    temp: 4800,
    luminosity: 0.4,
    mass: 0.8,
    size: 4,
    examples: ["Epsilon Eridani"]
  },
  {
    type: "M-Type",
    name: "Red Dwarf",
    color: 0xFFCC6F,
    temp: 3000,
    luminosity: 0.05,
    mass: 0.3,
    size: 3,
    examples: ["Proxima Centauri"]
  },
  {
    type: "Giant",
    name: "Red Giant",
    color: 0xFF6B6B,
    temp: 3500,
    luminosity: 1000,
    mass: 1,
    size: 18,
    examples: ["Betelgeuse", "Antares"]
  },
  {
    type: "Dwarf",
    name: "White Dwarf",
    color: 0xF0F0FF,
    temp: 10000,
    luminosity: 0.001,
    mass: 0.6,
    size: 2,
    examples: ["Sirius B"]
  }
];

export function createStellarMode() {
  let engine = null;
  let scene = null;
  let camera = null;
  let renderer = null;
  
  const stars = [];
  let infoPanel = null;
  
  // Raycasting
  let raycaster = null;
  let mouse = null;
  
  // Camera controls
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let cameraRotation = { theta: 0, phi: Math.PI / 4 };
  let cameraDistance = 250;
  
  return {
    id: "stellar",
    
    init(engineRef) {
      engine = engineRef;
      scene = engineRef.scene;
      camera = engineRef.camera;
      renderer = engineRef.renderer;
      
      camera.position.set(0, 100, 250);
      camera.lookAt(0, 0, 0);
      
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      console.log("⭐ Initializing Stellar Mode - Star Classification");
      
      createStarField();
      createInfoPanel();
      setupMouseInteraction();
      
      console.log("✅ Stellar Mode ready!");
    },
    
    update(dt) {
      // Gentle twinkling
      stars.forEach((star, i) => {
        const twinkle = Math.sin(Date.now() * 0.001 + i) * 0.05 + 1;
        star.scale.setScalar(star.userData.baseSize * twinkle);
      });
      
      updateCamera();
    },
    
    render() {
      checkStarHover();
      renderer.render(scene, camera);
    },
    
    teardown() {
      stars.forEach(s => scene.remove(s));
      if (infoPanel) infoPanel.remove();
      removeMouseInteraction();
      console.log("⭐ Stellar Mode cleaned up");
    }
  };
  
  function createStarField() {
    const cols = 3;
    const rows = 3;
    const spacing = 80;
    
    starTypes.forEach((type, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = (col - 1) * spacing;
      const y = (1 - row) * spacing;
      
      const star = createStar(type, x, y);
      scene.add(star);
      stars.push(star);
    });
  }
  
  function createStar(type, x, y) {
    const geometry = new THREE.SphereGeometry(type.size, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: type.color,
      emissive: type.color,
      emissiveIntensity: 0.6
    });
    const star = new THREE.Mesh(geometry, material);
    
    star.position.set(x, y, 0);
    star.userData = {
      type: type,
      baseSize: type.size
    };
    
    // Subtle glow
    const glowGeometry = new THREE.SphereGeometry(type.size * 1.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: type.color,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    star.add(glow);
    
    return star;
  }
  
  function createInfoPanel() {
    const content = `
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #ccc;">
        Hertzsprung-Russell Diagram showing star classification
      </p>
      <p style="margin: 0; font-size: 12px; color: #888;">
        Click any star to see details
      </p>
    `;
    
    infoPanel = createCollapsiblePanel(
      'stellar-info',
      '⭐ Star Types',
      content,
      '#FFD700'
    );
    
    // Start collapsed for clean view
    infoPanel.collapse();
  }
  
  function showStarDetails(type) {
    const content = `
      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px 0; color: #${type.color.toString(16).padStart(6, '0')};">
          ${type.name}
        </h4>
        <p style="margin: 0; font-size: 12px; color: #aaa;">Type: ${type.type}</p>
      </div>
      
      <table style="width: 100%; font-size: 13px; margin-bottom: 15px;">
        <tr>
          <td style="color: #888; padding: 4px 0;">Temperature:</td>
          <td style="text-align: right;"><strong>${type.temp.toLocaleString()}K</strong></td>
        </tr>
        <tr>
          <td style="color: #888; padding: 4px 0;">Luminosity:</td>
          <td style="text-align: right;"><strong>${type.luminosity}× Sun</strong></td>
        </tr>
        <tr>
          <td style="color: #888; padding: 4px 0;">Mass:</td>
          <td style="text-align: right;"><strong>${type.mass}× Sun</strong></td>
        </tr>
      </table>
      
      <div style="font-size: 12px; color: #aaa;">
        <strong>Examples:</strong> ${type.examples.join(', ')}
      </div>
    `;
    
    infoPanel.updateContent(content);
    infoPanel.expand();
  }
  
  function setupMouseInteraction() {
    renderer.domElement.addEventListener('click', onStarClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  }
  
  function removeMouseInteraction() {
    renderer.domElement.removeEventListener('click', onStarClick);
    renderer.domElement.removeEventListener('mousemove', onMouseMove);
    renderer.domElement.removeEventListener('mousedown', onMouseDown);
    renderer.domElement.removeEventListener('mouseup', onMouseUp);
    renderer.domElement.removeEventListener('wheel', onWheel);
  }
  
  function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (isDragging) {
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;
      
      cameraRotation.theta -= deltaX * 0.005;
      cameraRotation.phi -= deltaY * 0.005;
      cameraRotation.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotation.phi));
      
      previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  }
  
  function onMouseDown(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  function onMouseUp() {
    isDragging = false;
  }
  
  function onWheel(e) {
    e.preventDefault();
    cameraDistance += e.deltaY * 0.2;
    cameraDistance = Math.max(100, Math.min(500, cameraDistance));
  }
  
  function updateCamera() {
    camera.position.x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
    camera.position.y = cameraDistance * Math.cos(cameraRotation.phi);
    camera.position.z = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);
    camera.lookAt(0, 0, 0);
  }
  
  function checkStarHover() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(stars);
    
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
  }
  
  function onStarClick(event) {
    if (isDragging) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(stars);
    
    if (intersects.length > 0) {
      const star = intersects[0].object;
      const type = star.userData.type;
      console.log(`⭐ Clicked on ${type.name}`);
      showStarDetails(type);
    }
  }
}