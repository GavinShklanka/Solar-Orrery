export function drawLabel(ctx, text, x, y) {
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "11px system-ui";
  ctx.fillText(text, x, y);
}
