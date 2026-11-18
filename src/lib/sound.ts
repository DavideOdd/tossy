/** Synthesized sounds (no audio files). Must be unlocked by a user gesture (iOS). */
let ctx: AudioContext | null = null;
let muted = false;

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  void ctx?.resume();
}

export const setMuted = (m: boolean) => {
  muted = m;
};
export const isMuted = () => muted;

function tone(freq: number, start: number, dur: number, gain: number, type: OscillatorType = "sine") {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Metallic clink: inharmonic partials. */
export function clink(strength = 1) {
  if (muted || !ctx) return;
  const base = 2100 + Math.random() * 300;
  [1, 2.76, 5.4].forEach((m, i) => tone(base * m, 0, 0.22 / (i + 1), 0.09 * strength / (i + 1)));
}

/** Soft felt thud + coin ring on arrival. */
export function thud() {
  if (muted || !ctx) return;
  tone(110, 0, 0.14, 0.35);
  tone(70, 0, 0.18, 0.3);
  clink(1.2);
  tone(3300, 0.06, 0.3, 0.04);
}

export function jingle() {
  if (muted || !ctx) return;
  [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.11, 0.5, 0.12, "triangle"));
}
