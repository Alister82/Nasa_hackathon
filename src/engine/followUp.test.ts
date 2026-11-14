import { describe, expect, it } from 'vitest';
import { evaluateFollowUp } from './followUp';

describe('evaluateFollowUp', () => {
  it('correctly evaluates improvement for heart_rate (concern up)', () => {
    const res = evaluateFollowUp('heart_rate', 92, 78);
    expect(res.direction).toBe('improved');
    expect(res.delta).toBe(-14);
    expect(res.guidanceMessage).toContain('favorable movement');
  });

  it('correctly evaluates worsening for heart_rate', () => {
    const res = evaluateFollowUp('heart_rate', 92, 105);
    expect(res.direction).toBe('worsened');
    expect(res.delta).toBe(13);
    expect(res.guidanceMessage).toContain('higher elevation');
  });

  it('correctly evaluates unchanged within tolerance', () => {
    const res = evaluateFollowUp('heart_rate', 80, 80.2);
    expect(res.direction).toBe('unchanged');
    expect(res.guidanceMessage).toContain('remains steady');
  });

  it('correctly evaluates improvement for sleep_hours (concern down)', () => {
    const res = evaluateFollowUp('sleep_hours', 4.5, 7.2);
    expect(res.direction).toBe('improved');
    expect(res.delta).toBe(2.7);
  });
});
