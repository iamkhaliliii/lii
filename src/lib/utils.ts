import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Cross-platform tactile feedback using Web Audio API.
 * navigator.vibrate is Android-only; iOS Safari ignores it entirely.
 * A short synthesized click via AudioContext works on both iOS and Android.
 */

let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (_audioCtx.state === "suspended") {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

function playTick(freq = 1800, duration = 0.012, gain = 0.08) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  } catch {
    /* silent */
  }
}

/** Light tap feedback — works on iOS + Android */
export function haptic() {
  try { navigator?.vibrate?.(10); } catch { /* Android only */ }
  playTick(1800, 0.012, 0.06);
}

/** Medium tap for important actions */
export function hapticMedium() {
  try { navigator?.vibrate?.(20); } catch { /* Android only */ }
  playTick(1400, 0.02, 0.1);
}

/** Success double-tick */
export function hapticSuccess() {
  try { navigator?.vibrate?.([10, 40, 10]); } catch { /* Android only */ }
  playTick(2000, 0.015, 0.07);
  setTimeout(() => playTick(2400, 0.015, 0.09), 80);
}
