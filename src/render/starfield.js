const stars = Array.from({ length: 300 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.2
}));

export function drawStarfield(ctx) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = "white";

  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}
