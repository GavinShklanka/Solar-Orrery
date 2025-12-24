import { createTime } from "./time.js";

export function createEngine({ renderer, scene, camera }) {
  let lastTime = performance.now();
  let currentMode = null;
  let running = false;
  const time = createTime();

  function setMode(mode) {
    if (currentMode) {
      currentMode.teardown();
    }
    currentMode = mode;
    // Pass engine API including Three.js objects
    currentMode.init({ ...api, scene, camera, renderer });
  }

  function loop(now) {
    if (!running || !currentMode) return;

    const rawDt = (now - lastTime) / 1000;
    lastTime = now;
    const dt = time.update(rawDt);

    currentMode.update(dt);
    currentMode.render();

    requestAnimationFrame(loop);
  }

  function start() {
    if (!currentMode) {
      throw new Error("Engine requires a mode before starting.");
    }
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  const api = {
    setMode,
    start,
    time,
    scene,
    camera,
    renderer
  };

  return api;
}