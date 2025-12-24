import { initCanvas } from "./render/canvas.js";
import { createEngine } from "./engine/engine.js";
import { createPlanetaryMode } from "./modes/planetary.js";
import { createControlPanel } from "./ui/controls.js";
import { createHelpButton } from "./ui/collapsiblePanel.js";

export function bootstrap() {
  console.log("🚀 Bootstrap starting...");
  
  const { renderer, scene, camera } = initCanvas();
  console.log("✅ Canvas initialized");
  
  const engine = createEngine({ renderer, scene, camera });
  console.log("✅ Engine created");
  
  engine.setMode(createPlanetaryMode());
  console.log("✅ Planetary mode set");
  
  // Create control panel
  createControlPanel(engine);
  console.log("✅ Control panel created");
  
  // Create help button
  const helpBtn = createHelpButton();
  helpBtn.addEventListener('click', () => {
    alert('🌌 Solar Orrery Controls:\n\n' +
          '🖱️ Drag to rotate view\n' +
          '🖱️ Scroll to zoom in/out\n' +
          '🖱️ Click planets/stars for details\n' +
          '📊 Use scale slider to explore all sizes\n' +
          '⏱️ Adjust time speed with controls\n\n' +
          'Click info panels (▼) in top right to expand!');
  });
  
  engine.start();
  console.log("✅ Engine started - Solar system should be visible!");
}