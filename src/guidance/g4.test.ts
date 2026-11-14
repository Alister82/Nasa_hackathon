/**
 * G4 tests: library.ts — verbatim text check and structural invariants.
 * Verifies that every Appendix A key exists and action texts match the source text exactly.
 * Every referenced source id must exist in SOURCES.
 */
import { describe, it, expect } from 'vitest';
import { LIBRARY, type LibraryEntry } from './library';
import { SOURCES } from './sources';

// All keys from Appendix A.
const APPENDIX_A_KEYS = [
  'heart_rate:up',
  'bp:up',
  'body_temp:up',
  'glucose:high',
  'glucose:low',
  'sleep_hours:down',
  'exercise_minutes:down',
  'behavioral:support',
  'radiation_event',
  'isolated_spike',
  'data_quality_issue',
  'wellbeing:support',
] as const;

function getEntry(key: string): LibraryEntry {
  const e = LIBRARY[key];
  if (!e) throw new Error(`Missing entry ${key}`);
  return e;
}

describe('LIBRARY keys', () => {
  for (const key of APPENDIX_A_KEYS) {
    it(`has key "${key}"`, () => {
      expect(LIBRARY[key], `missing key ${key}`).toBeDefined();
    });
  }
});

describe('LIBRARY structural invariants', () => {
  it('every entry key matches its key field', () => {
    for (const [k, entry] of Object.entries(LIBRARY)) {
      expect(entry.key).toBe(k);
    }
  });

  it('every entry has at least one action', () => {
    for (const [k, entry] of Object.entries(LIBRARY)) {
      expect(entry.actions.length, `${k} has no actions`).toBeGreaterThan(0);
    }
  });

  it('every action id is unique within its entry', () => {
    for (const [k, entry] of Object.entries(LIBRARY)) {
      const ids = entry.actions.map((a) => a.id);
      expect(new Set(ids).size, `${k} has duplicate action ids`).toBe(ids.length);
    }
  });

  it('every source id referenced exists in SOURCES', () => {
    for (const [k, entry] of Object.entries(LIBRARY)) {
      for (const sid of entry.sourceIds) {
        expect(SOURCES[sid], `${k} references unknown source ${sid}`).toBeDefined();
      }
    }
  });
});

// ── Verbatim action text checks (Appendix A) ─────────────────────────────────

describe('LIBRARY verbatim action texts — heart_rate:up', () => {
  const e = getEntry('heart_rate:up');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe('Sit quietly for 5 minutes, then repeat the measurement.');
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe('Check recent caffeine, hydration, and exercise, and adjust if needed.');
  });
  it('a3 text', () => {
    expect(e.actions[2]?.text).toBe(
      'Write down any symptoms such as dizziness, chest discomfort, or shortness of breath.',
    );
  });
  it('a4 text', () => {
    expect(e.actions[3]?.text).toBe('Follow your scheduled exercise and rest plan.');
  });
  it('nextMeasurements a1', () => {
    expect(e.nextMeasurements[0]).toBe('Resting heart rate after 5 minutes seated');
  });
});

describe('LIBRARY verbatim action texts — bp:up', () => {
  const e = getEntry('bp:up');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe(
      'Sit for 5 minutes with your back supported and feet flat, then repeat the reading.',
    );
  });
  it('a1 supply', () => {
    expect(e.actions[0]?.supply).toBe('bp_cuff');
  });
  it('a1 alternative', () => {
    expect(e.actions[0]?.alternative).toBe(
      'Note how you feel and report that a cuff reading is not available.',
    );
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe('Note recent salt, caffeine, stress, and exercise.');
  });
  it('a3 text', () => {
    expect(e.actions[2]?.text).toBe('Record any headache, vision change, or chest discomfort.');
  });
});

describe('LIBRARY verbatim action texts — body_temp:up', () => {
  const e = getEntry('body_temp:up');
  it('a1 text and supply', () => {
    expect(e.actions[0]?.text).toBe('Repeat the temperature in 15 minutes.');
    expect(e.actions[0]?.supply).toBe('thermometer');
    expect(e.actions[0]?.alternative).toBe(
      'Note how warm or chilled you feel and report that a thermometer is not available.',
    );
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe('Drink fluids and rest as your schedule allows.');
  });
  it('a3 text', () => {
    expect(e.actions[2]?.text).toBe('Record other symptoms such as cough, sore throat, or body aches.');
  });
});

describe('LIBRARY verbatim action texts — glucose:high', () => {
  const e = getEntry('glucose:high');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe('Confirm the reading was taken fasting, and repeat it.');
  });
  it('a1 alternative', () => {
    expect(e.actions[0]?.alternative).toBe('Report that a glucose meter is not available.');
  });
});

describe('LIBRARY verbatim action texts — glucose:low', () => {
  const e = getEntry('glucose:low');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe('Repeat the reading now.');
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe(
      'If you feel shaky or confused, follow your crew medical procedures and tell a crew member.',
    );
  });
});

describe('LIBRARY verbatim action texts — sleep_hours:down', () => {
  const e = getEntry('sleep_hours:down');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe('Keep a consistent sleep window.');
  });
  it('a2 text and alternative', () => {
    expect(e.actions[1]?.text).toBe('Reduce bright light and screens before sleep.');
    expect(e.actions[1]?.alternative).toBe('Dim your sleep station lighting.');
  });
  it('a3 text', () => {
    expect(e.actions[2]?.text).toBe('Limit caffeine in the hours before sleep.');
  });
  it('a4 supply and alternative', () => {
    expect(e.actions[3]?.supply).toBe('sleep_mask');
    expect(e.actions[3]?.alternative).toBe('Cover or dim the light near your sleep station.');
  });
});

describe('LIBRARY verbatim action texts — exercise_minutes:down', () => {
  const e = getEntry('exercise_minutes:down');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe('Complete your scheduled exercise session today.');
  });
  it('a1 supply and alternative', () => {
    expect(e.actions[0]?.supply).toBe('exercise_equipment');
    expect(e.actions[0]?.alternative).toBe(
      'Do body-weight resistance and stretching and report that equipment is not available.',
    );
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe('Split the session into shorter blocks if time is tight.');
  });
  it('a3 text', () => {
    expect(e.actions[2]?.text).toBe(
      'Tell the flight surgeon if pain or fatigue stops you from exercising.',
    );
  });
});

describe('LIBRARY verbatim action texts — behavioral:support', () => {
  const e = getEntry('behavioral:support');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe('Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.');
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe('Keep a regular daily routine, including meals, exercise, and sleep.');
  });
  it('a3 text', () => {
    expect(e.actions[2]?.text).toBe('Talk with a crew member or send a message to someone you trust.');
  });
  it('a4 text', () => {
    expect(e.actions[3]?.text).toBe(
      'Tell the flight surgeon or behavioral health support if this continues.',
    );
  });
});

describe('LIBRARY verbatim action texts — radiation_event', () => {
  const e = getEntry('radiation_event');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe(
      'Move to the best-shielded area of the vehicle, following your radiation procedures.',
    );
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe('Limit time outside shielded areas until ground advises.');
  });
  it('a3 text', () => {
    expect(e.actions[2]?.text).toBe('Report the dose reading and your location to ground.');
  });
});

describe('LIBRARY verbatim action texts — isolated_spike', () => {
  const e = getEntry('isolated_spike');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe('Repeat the measurement to confirm.');
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe('Check the sensor placement and device battery.');
  });
});

describe('LIBRARY verbatim action texts — data_quality_issue', () => {
  const e = getEntry('data_quality_issue');
  it('a1 text', () => {
    expect(e.actions[0]?.text).toBe('Log the missing measurements when you can.');
  });
  it('a2 text', () => {
    expect(e.actions[1]?.text).toBe('Check the device and note why readings were missed.');
  });
});

describe('LIBRARY wellbeing:support same as behavioral:support', () => {
  it('action texts match', () => {
    const bs = getEntry('behavioral:support');
    const ws = getEntry('wellbeing:support');
    expect(ws.actions.map((a) => a.text)).toEqual(bs.actions.map((a) => a.text));
  });
});

// ── No forbidden words in library ────────────────────────────────────────────

const FORBIDDEN_WORDS = [
  'diagnos', 'you have', 'disease', 'cancer', 'depression', 'anxiety disorder',
];

describe('LIBRARY no forbidden words', () => {
  for (const [k, entry] of Object.entries(LIBRARY)) {
    for (const action of entry.actions) {
      it(`${k} action "${action.id}" has no forbidden words`, () => {
        for (const w of FORBIDDEN_WORDS) {
          expect(action.text.toLowerCase()).not.toContain(w);
          if (action.alternative) {
            expect(action.alternative.toLowerCase()).not.toContain(w);
          }
        }
      });
    }
    for (const q of entry.questions) {
      it(`${k} question has no forbidden words`, () => {
        for (const w of FORBIDDEN_WORDS) {
          expect(q.toLowerCase()).not.toContain(w);
        }
      });
    }
  }
});
