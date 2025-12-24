// Use global THREE loaded from index.html
const THREE = window.THREE;

export function initCanvas() {
  if (!THREE) {
    throw new Error("Three.js not loaded! Check index.html");
  }

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false 
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.appendChild(renderer.domElement);

  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100000
  );
  camera.position.set(0, 50, 150);
  camera.lookAt(0, 0, 0);

  // Add cosmic background (starfield)
  createStarfield(scene);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x333333, 0.3);
  scene.add(ambientLight);

  // Resize handler
  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", resize);
  resize();

  console.log("✅ Canvas initialized with Three.js");

  return { 
    renderer, 
    scene, 
    camera,
    canvas: renderer.domElement
  };
}

function createStarfield(scene) {
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 5000 + Math.random() * 5000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const color = new THREE.Color();
    color.setHSL(0.55 + Math.random() * 0.1, 0.2, 0.7 + Math.random() * 0.3);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starsMaterial = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
  
  console.log("✅ Starfield created");
  
  return stars;
}

export function clearCanvas(renderer) {
  // Not needed with Three.js - renderer handles clearing
}