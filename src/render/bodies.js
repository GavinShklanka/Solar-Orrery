export function drawBody(ctx, x, y, r, color) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.3, x, y, r);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, "#000000");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
