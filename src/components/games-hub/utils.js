// Shared utilities for the LinkedIn Games Hub
// Pure JS — no React, no JSX

// ╔══════════════════════════════════════════════════════════╗
// ║  SHARED UTILITIES                                        ║
// ╚══════════════════════════════════════════════════════════╝

export function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seedFromString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h;
}
export function shuffleWith(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function formatTime(ms) {
  if (ms == null) return "00:00";
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
export function formatTimeFull(ms) {
  if (ms == null) return "00:00.000";
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), ms3 = ms % 1000;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(ms3).padStart(3,"0")}`;
}
