import { describe, expect, it } from 'vitest';
import { CONTRACT_VERSION } from '@/contracts/types';
import { DOMAIN_ORDER, INDICATOR_IDS } from '@/contracts/indicators';

describe('contracts', () => {
  it('defines 11 indicators with unique ids', () => {
    expect(INDICATOR_IDS).toHaveLength(11);
    expect(new Set(INDICATOR_IDS).size).toBe(11);
  });

  it('defines 6 domains in DOMAIN_ORDER', () => {
    expect(DOMAIN_ORDER).toHaveLength(6);
    expect(new Set(DOMAIN_ORDER).size).toBe(6);
  });

  it('is contract version 2', () => {
    expect(CONTRACT_VERSION).toBe(2);
  });
});
