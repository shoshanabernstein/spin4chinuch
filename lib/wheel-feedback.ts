// Wheel slices start at twelve o'clock; the pointer sits at three o'clock.
export function crossedWheelBoundary(previous: number, current: number, sliceAngle: number) {
  if (sliceAngle <= 0 || current <= previous) return false;
  return Math.floor((current - 90) / sliceAngle) !== Math.floor((previous - 90) / sliceAngle);
}
