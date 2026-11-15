import { describe, it, expect } from 'vitest';
import { SOURCES } from './sources';
import { MISSION_SETTINGS, expectedReplyMinutes } from './missionSettings';
import { SUPPLIES, DEFAULT_SUPPLIES } from './supplies';

// G1 acceptance: exports match CONTRACTS.md; all 3 settings present, delays 0, 0.02, 12.

describe('G1: sources', () => {
  it('has 22 source entries', () => {
    expect(Object.keys(SOURCES)).toHaveLength(22);
  });

  it('organizer sources have verified status and non-null URLs', () => {
    const organizer = [
      'src_hrp_hazards',
      'src_hrp_risks',
      'src_hrp_ongoing',
      'src_csa_radiation',
      'src_csa_science',
    ];
    for (const id of organizer) {
      expect(SOURCES[id]).toBeDefined();
      expect(SOURCES[id]!.status).toBe('verified');
      expect(SOURCES[id]!.url).not.toBeNull();
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

  it('verified clinical references have valid source links', () => {
    const verifiedSources = [
      'src_aha_acc_bp',
      'src_ada_glucose',
      'src_aasm_sleep',
    ];
    for (const id of verifiedSources) {
      expect(SOURCES[id]).toBeDefined();
      expect(SOURCES[id]!.url).toMatch(/^https:\/\//);
      expect(SOURCES[id]!.status).toBe('verified');
    }
    expect(SOURCES['src_aha_acc_bp']!.title).toBe(
      'AHA/ACC Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults (Whelton et al.)',
    );
    expect(SOURCES['src_aasm_sleep']!.url).toBe('https://doi.org/10.5664/jcsm.4758');
    expect(SOURCES['src_ada_glucose']!.title).toContain('2024');
    expect(SOURCES['src_lunar_lnd']!.title).toContain('Zhang et al.');
  });

  it('unverified references maintain url: null and status: unverified', () => {
    const unverifiedSources = [
      'src_general_clinical',
      'src_iss_padles',
      'src_nasa_circa',
    ];
    for (const id of unverifiedSources) {
      expect(SOURCES[id]).toBeDefined();
      expect(SOURCES[id]!.url).toBeNull();
      expect(SOURCES[id]!.status).toBe('unverified');
    }
    expect(SOURCES['src_general_clinical']!.title).toBe(
      'General adult clinical reference ranges (heart rate, temperature)',
    );
  });

  it('every source entry conforms to SourceRef contract', () => {
    for (const [key, src] of Object.entries(SOURCES)) {
      expect(src.id).toBe(key);
      expect(typeof src.title).toBe('string');
      expect(src.title.length).toBeGreaterThan(0);
      if (src.status === 'verified') {
        expect(src.url).toMatch(/^https:\/\//);
      } else {
        expect(src.status).toBe('unverified');
        expect(src.url).toBeNull();
      }
    }
  });
});

describe('G1: mission settings', () => {
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

  it('expectedReplyMinutes uses 2×oneWay + 10', () => {
    // station: 2×0 + 10 = 10
    expect(expectedReplyMinutes('station')).toBe(10);
    // lunar_base: 2×0.02 + 10 = 10.04
    expect(expectedReplyMinutes('lunar_base')).toBeCloseTo(10.04);
    // deep_space: 2×12 + 10 = 34
    expect(expectedReplyMinutes('deep_space')).toBe(34);
  });

  it('each setting has id, label, description', () => {
    for (const s of Object.values(MISSION_SETTINGS)) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.label).toBe('string');
      expect(typeof s.description).toBe('string');
    }
  });
});

describe('G1: supplies', () => {
  const EXPECTED_IDS = [
    'bp_cuff',
    'thermometer',
    'glucometer',
    'wrist_hr_monitor',
    'exercise_equipment',
    'sleep_mask',
  ];

  it('has 6 supplies', () => {
    expect(SUPPLIES).toHaveLength(6);
  });

  it('supply ids match the contract SupplyId set', () => {
    const ids = SUPPLIES.map((s) => s.id);
    for (const expected of EXPECTED_IDS) {
      expect(ids).toContain(expected);
    }
  });

  it('DEFAULT_SUPPLIES has all 6 ids set to true', () => {
    for (const id of EXPECTED_IDS) {
      expect(DEFAULT_SUPPLIES[id as keyof typeof DEFAULT_SUPPLIES]).toBe(true);
    }
  });
});

