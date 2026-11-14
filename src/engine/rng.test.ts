import { describe, expect, it } from 'vitest';
import { createStream, fnv1a, gaussian, mulberry32 } from './rng';

function firstFive(seed: number): number[] {
  const rng = mulberry32(seed);
  return Array.from({ length: 5 }, () => rng());
}

describe('mulberry32', () => {
  it('gives identical first five outputs across runs for the same seed', () => {
    expect(firstFive(42)).toEqual(firstFive(42));
  });

  it('returns numbers in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('gives different sequences for different seeds', () => {
    expect(firstFive(1)).not.toEqual(firstFive(2));
  });
});

describe('fnv1a', () => {
  it('hashes the empty string to the FNV offset basis', () => {
    expect(fnv1a('')).toBe(2166136261);
  });

  it('is deterministic and sensitive to the input', () => {
    expect(fnv1a('42:crew-1:heart_rate')).toBe(fnv1a('42:crew-1:heart_rate'));
    expect(fnv1a('42:crew-1:heart_rate')).not.toBe(fnv1a('42:crew-1:bp_sys'));
  });
});

describe('createStream', () => {
  it('gives the same sequence for the same seed, crew, and label', () => {
    const a = createStream(42, 'crew-1', 'heart_rate');
    const b = createStream(42, 'crew-1', 'heart_rate');
    expect(Array.from({ length: 5 }, () => a())).toEqual(Array.from({ length: 5 }, () => b()));
  });

  it('separates streams by label and by crew', () => {
    const base = createStream(42, 'crew-1', 'missing');
    const otherLabel = createStream(42, 'crew-1', 'event');
    const otherCrew = createStream(42, 'crew-2', 'missing');
    const draw = (rng: () => number) => Array.from({ length: 5 }, () => rng());
    expect(draw(base)).not.toEqual(draw(otherLabel));
    expect(draw(base)).not.toEqual(draw(otherCrew));
  });
});

describe('gaussian', () => {
  it('has mean within 0.05 of 0 and SD within 0.05 of 1 over 20,000 draws', () => {
    const rng = mulberry32(2026);
    const draws = Array.from({ length: 20_000 }, () => gaussian(rng));
    const mean = draws.reduce((sum, x) => sum + x, 0) / draws.length;
    const variance = draws.reduce((sum, x) => sum + (x - mean) ** 2, 0) / draws.length;
    const sd = Math.sqrt(variance);
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(Math.abs(sd - 1)).toBeLessThan(0.05);
  });

  it('is deterministic for a fixed seed', () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    expect(gaussian(a)).toBe(gaussian(b));
  });
});
