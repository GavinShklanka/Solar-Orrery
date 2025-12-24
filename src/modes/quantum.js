const THREE = window.THREE;

import { createCollapsiblePanel } from '../ui/collapsiblePanel.js';

export function createQuantumMode() {
  let engine = null;
  let scene = null;
  let camera = null;
  let renderer = null;
  
  const particles = [];
  const wormholes = [];
  let quantumFoam = null;
  let time = 0;
  let infoPanel = null;
  
  // Camera controls
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let cameraRotation = { theta: 0, phi: Math.PI / 4 };
  let cameraDistance = 80;
  
  return {
    id: "quantum",
    
    init(engineRef) {
      engine = engineRef;
      scene = engineRef.scene;
      camera = engineRef.camera;
      renderer = engineRef.renderer;
      
      camera.position.set(0, 30, 80);
      camera.lookAt(0, 0, 0);
      
      console.log("⚛️ Initializing Quantum Mode");
      
      createQuantumFoam();
      createVirtualParticles();
      createWormholes();
      createInfoPanel();
      setupCameraControls();
      
      console.log("✅ Quantum Mode ready!");
    },
    
    update(dt) {
      time += dt;
      
      // Subtle quantum fluctuations
      particles.forEach((particle, i) => {
        particle.position.x += (Math.random() - 0.5) * 0.2;
        particle.position.y += (Math.random() - 0.5) * 0.2;
        particle.position.z += (Math.random() - 0.5) * 0.2;
        
        // Occasional quantum tunneling
        if (Math.random() < 0.005) {
          particle.position.set(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 60
          );
        }
        
        // Wave-particle duality
        const waveState = Math.sin(time * 3 + i) * 0.3 + 1;
        particle.scale.setScalar(waveState * 0.5);
        particle.material.opacity = 0.4 + waveState * 0.2;
      });
      
      // Wormhole animation
      wormholes.forEach((wormhole, i) => {
        wormhole.rotation.z += dt * 0.3;
        const pulse = Math.sin(time * 1.5 + i) * 0.15 + 1;
        wormhole.scale.setScalar(pulse);
        
        // Update connection tube
        if (wormhole.userData.tube) {
          wormhole.userData.tube.rotation.y += dt * 0.2;
        }
      });
      
      // Quantum foam subtle movement
      if (quantumFoam) {
        quantumFoam.rotation.y += dt * 0.05;
      }
      
      updateCamera();
    },
    
    render() {
      renderer.render(scene, camera);
    },
    
    teardown() {
      particles.forEach(p => scene.remove(p));
      wormholes.forEach(w => {
        scene.remove(w);
        if (w.userData.tube) scene.remove(w.userData.tube);
      });
      if (quantumFoam) scene.remove(quantumFoam);
      if (infoPanel) infoPanel.remove();
      removeCameraControls();
      console.log("⚛️ Quantum Mode cleaned up");
    }
  };
  
  function createQuantumFoam() {
    // Subtle background particles
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    
    for (let i = 0; i < 2000; i++) {
      positions.push(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
      
      const color = new THREE.Color();
      color.setHSL(0.55 + Math.random() * 0.15, 0.6, 0.4);
      colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    
    quantumFoam = new THREE.Points(geometry, material);
    scene.add(quantumFoam);
  }
  
  function createVirtualParticles() {
    // Fewer, more elegant particles
    for (let i = 0; i < 30; i++) {
      const geometry = new THREE.SphereGeometry(0.5, 12, 12);
      const isParticle = Math.random() > 0.5;
      const color = isParticle ? 0x00FFFF : 0xFF00FF;
      
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
      
      scene.add(particle);
      particles.push(particle);
    }
  }
  
  function createWormholes() {
    // 3 clean wormholes
    for (let i = 0; i < 3; i++) {
      const entrance = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );
      
      const exit = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );
      
      const wormhole = createWormhole(entrance, exit);
      scene.add(wormhole);
      wormholes.push(wormhole);
    }
  }
  
  function createWormhole(entrance, exit) {
    const geometry = new THREE.TorusGeometry(4, 0.8, 16, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x9900FF,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    
    const wormhole = new THREE.Mesh(geometry, material);
    wormhole.position.copy(entrance);
    
    // Create curved connection tube
    const curve = new THREE.QuadraticBezierCurve3(
      entrance,
      new THREE.Vector3().addVectors(entrance, exit).multiplyScalar(0.5).add(new THREE.Vector3(0, 15, 0)),
      exit
    );
    
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.3, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xAA00FF,
      transparent: true,
      opacity: 0.25,
      wireframe: true
    });
    
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);
    
    wormhole.userData = { entrance, exit, tube };
    
    return wormhole;
  }
  
  function createInfoPanel() {
    const content = `
      <div style="font-size: 13px; line-height: 1.8;">
        <p style="margin: 0 0 12px 0; color: #ccc;">
          Exploring spacetime at the Planck scale (10⁻³⁵ meters)
        </p>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #9900FF;">🌀 Purple Toruses:</strong> Wormholes<br>
          <span style="font-size: 12px; color: #888;">Einstein-Rosen bridges through spacetime</span>
        </div>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #00FFFF;">⚡ Cyan/Magenta:</strong> Virtual Particles<br>
          <span style="font-size: 12px; color: #888;">Quantum tunneling & wave-particle duality</span>
        </div>
        
        <p style="margin: 0; font-size: 12px; color: #666;">
          Drag to rotate · Scroll to zoom
        </p>
      </div>
    `;
    
    infoPanel = createCollapsiblePanel(
      'quantum-info',
      '⚛️ Quantum Realm',
      content,
      '#9900FF'
    );
    
    infoPanel.collapse();
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
    renderer.domElement.style.cursor = 'grabbing';
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
    renderer.domElement.style.cursor = 'grab';
  }
  
  function onWheel(e) {
    e.preventDefault();
    cameraDistance += e.deltaY * 0.1;
    cameraDistance = Math.max(30, Math.min(200, cameraDistance));
  }
  
  function updateCamera() {
    camera.position.x = cameraDistance * Math.sin(cameraRotation.phi) * Math.cos(cameraRotation.theta);
    camera.position.y = cameraDistance * Math.cos(cameraRotation.phi);
    camera.position.z = cameraDistance * Math.sin(cameraRotation.phi) * Math.sin(cameraRotation.theta);
    camera.lookAt(0, 0, 0);
  }
}