export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Minutes since midnight → "HH:MM" (store clock). */
export const clock = (minute: number) => {
  const m = ((Math.round(minute) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const shelf = (h: number) => (h >= 72 ? `${Math.round(h / 24)} d` : `${Math.round(h)} h`);

/** Deterministic PRNG so server and client render identical seeded data. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mean-reverting noisy series around `base`. */
export function seededSeries(seed: number, n: number, base: number, jitter: number) {
  const r = mulberry32(seed);
  let v = base;
  return Array.from({ length: n }, () => {
    v += (base - v) * 0.3 + (r() - 0.5) * jitter;
    return Math.round(v * 100) / 100;
  });
}
