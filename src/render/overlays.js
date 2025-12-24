let fps = 0;
let last = performance.now();

export function drawDebug(ctx, dt) {
  const now = performance.now();
  fps = Math.round(1000 / (now - last));
  last = now;

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "12px monospace";
  ctx.fillText(`FPS: ${fps}`, 12, 20);
  ctx.fillText(`dt: ${dt.toFixed(3)}`, 12, 36);
}
import { drawDebug } from "../render/overlays.js";
