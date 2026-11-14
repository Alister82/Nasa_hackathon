/**
 * Deterministic randomness for the engine.
 * The two functions in 6.3 are copied exactly; the stream helper follows the
 * per-(seed, crew, indicator) rule in the same section.
 */

export function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** One independent stream per seed, crew, and label (ARCHITECTURE 6.3). */
export function createStream(seed: number, crewId: string, label: string): () => number {
  return mulberry32(fnv1a(`${seed}:${crewId}:${label}`));
}

/** Box-Muller standard normal from two uniform draws (ARCHITECTURE 6.3). */
export function gaussian(rng: () => number): number {
  let u1 = rng();
  const u2 = rng();
  if (u1 <= 0) u1 = Number.MIN_VALUE;
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
