import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Light haptic tap — uses navigator.vibrate where available */
export function haptic(ms = 10) {
  try {
    navigator?.vibrate?.(ms);
  } catch {
    /* silent — not all platforms support vibrate */
  }
}

/** Medium haptic for important actions */
export function hapticMedium() {
  haptic(20);
}

/** Success haptic pattern */
export function hapticSuccess() {
  try {
    navigator?.vibrate?.([10, 40, 10]);
  } catch {
    /* silent */
  }
}
