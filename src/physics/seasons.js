export function seasonalOffset(tilt, orbitalAngle) {
  return Math.sin(orbitalAngle) * tilt;
}
