export function haptic(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

export const hapticPickup = () => haptic(8);
export const hapticArrive = () => haptic([12, 30, 12]);
