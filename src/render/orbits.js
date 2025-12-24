export function drawOrbit(ctx, x, y, radius) {
  const alpha = Math.max(0.03, 0.12 - radius / 3000);
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}
