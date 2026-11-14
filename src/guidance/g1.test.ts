/**
 * G1 tests: sources, missionSettings, supplies.
 */
import { describe, it, expect } from 'vitest';
import { SOURCES } from './sources';
import { MISSION_SETTINGS, expectedReplyMinutes } from './missionSettings';
import { SUPPLIES, DEFAULT_SUPPLIES } from './supplies';

// ── Sources ──────────────────────────────────────────────────────────────────

describe('SOURCES', () => {
  const ORGANIZER_IDS = [
    'src_hrp_hazards',
    'src_hrp_risks',
    'src_hrp_ongoing',
    'src_csa_radiation',
    'src_csa_science',
  ] as const;

  const UNVERIFIED_IDS = [
    'src_aha_acc_bp',
    'src_ada_glucose',
    'src_aasm_sleep',
    'src_general_clinical',
  ] as const;

  it('has exactly 9 entries', () => {
    expect(Object.keys(SOURCES)).toHaveLength(9);
  });

  it('organizer sources have status verified and non-null URLs', () => {
    for (const id of ORGANIZER_IDS) {
      const src = SOURCES[id];
      expect(src, `missing ${id}`).toBeDefined();
      expect(src!.status).toBe('verified');
      expect(src!.url).not.toBeNull();
      expect(typeof src!.url).toBe('string');
    }
  });

  it('organizer URLs match ARCHITECTURE.md 7.2 exactly', () => {
    expect(SOURCES['src_hrp_hazards']!.url).toBe('https://www.nasa.gov/hrp/hazards/');
    expect(SOURCES['src_hrp_risks']!.url).toBe('https://www.nasa.gov/hrp/risks/');
    expect(SOURCES['src_hrp_ongoing']!.url).toBe('https://www.nasa.gov/hrp/ongoing-hrp-research/');
    expect(SOURCES['src_csa_radiation']!.url).toBe(
      'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    );
    expect(SOURCES['src_csa_science']!.url).toBe(
      'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp',
    );
  });

  it('non-organizer sources have status unverified and url null', () => {
    for (const id of UNVERIFIED_IDS) {
      const src = SOURCES[id];
      expect(src, `missing ${id}`).toBeDefined();
      expect(src!.status).toBe('unverified');
      expect(src!.url).toBeNull();
    }
  });

  it('every entry has id matching its key', () => {
    for (const [key, src] of Object.entries(SOURCES)) {
      expect(src.id).toBe(key);
    }
  });

  it('every entry has a non-empty title', () => {
    for (const src of Object.values(SOURCES)) {
      expect(src.title.length).toBeGreaterThan(0);
    }
  });
});

// ── Mission settings ──────────────────────────────────────────────────────────

describe('MISSION_SETTINGS', () => {
  it('has all three settings', () => {
    expect(MISSION_SETTINGS.station).toBeDefined();
    expect(MISSION_SETTINGS.lunar_base).toBeDefined();
    expect(MISSION_SETTINGS.deep_space).toBeDefined();
  });

  it('one-way delays match ARCHITECTURE.md 7.3', () => {
    expect(MISSION_SETTINGS.station.oneWayDelayMinutes).toBe(0);
    expect(MISSION_SETTINGS.lunar_base.oneWayDelayMinutes).toBe(0.02);
    expect(MISSION_SETTINGS.deep_space.oneWayDelayMinutes).toBe(12);
  });

  it('radiation rates match ARCHITECTURE.md 7.3', () => {
    expect(MISSION_SETTINGS.station.radiationRateMsvPerDay).toBe(0.5);
    expect(MISSION_SETTINGS.lunar_base.radiationRateMsvPerDay).toBe(1.0);
    expect(MISSION_SETTINGS.deep_space.radiationRateMsvPerDay).toBe(1.8);
  });

  it('expectedReplyMinutes = 2 × delay + 10', () => {
    // station: 2×0+10 = 10
    expect(expectedReplyMinutes('station')).toBe(10);
    // lunar_base: 2×0.02+10 = 10.04
    expect(expectedReplyMinutes('lunar_base')).toBeCloseTo(10.04, 5);
    // deep_space: 2×12+10 = 34
    expect(expectedReplyMinutes('deep_space')).toBe(34);
  });

  it('every setting id matches its key', () => {
    for (const [key, s] of Object.entries(MISSION_SETTINGS)) {
      expect(s.id).toBe(key);
    }
  });
});

// ── Supplies ──────────────────────────────────────────────────────────────────

describe('SUPPLIES', () => {
  it('has 6 entries', () => {
    expect(SUPPLIES).toHaveLength(6);
  });

  const EXPECTED_IDS = [
    'bp_cuff', 'thermometer', 'glucometer',
    'wrist_hr_monitor', 'exercise_equipment', 'sleep_mask',
  ] as const;

  it('contains all expected supply ids', () => {
    const ids = SUPPLIES.map((s) => s.id);
    for (const id of EXPECTED_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('every entry has a non-empty label', () => {
    for (const s of SUPPLIES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe('DEFAULT_SUPPLIES', () => {
  it('all 6 supplies default to true', () => {
    expect(DEFAULT_SUPPLIES.bp_cuff).toBe(true);
    expect(DEFAULT_SUPPLIES.thermometer).toBe(true);
    expect(DEFAULT_SUPPLIES.glucometer).toBe(true);
    expect(DEFAULT_SUPPLIES.wrist_hr_monitor).toBe(true);
    expect(DEFAULT_SUPPLIES.exercise_equipment).toBe(true);
    expect(DEFAULT_SUPPLIES.sleep_mask).toBe(true);
  });
});

