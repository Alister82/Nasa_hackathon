import { describe, it, expect } from 'vitest';
import { LIBRARY } from './library';
import { SOURCES } from './sources';

// G4 acceptance: every key in Appendix A exists; action texts match verbatim;
// every referenced source id exists in SOURCES.

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
  'urgent:bp',
  'urgent:glucose',
];

describe('G4: library keys', () => {
  it('has every key from Appendix A', () => {
    for (const key of APPENDIX_A_KEYS) {
      expect(LIBRARY[key], `missing key: ${key}`).toBeDefined();
    }
  });
});

describe('G4: library source ids', () => {
  it('every sourceId referenced in the library exists in SOURCES', () => {
    for (const [key, entry] of Object.entries(LIBRARY)) {
      for (const sid of entry.sourceIds) {
        expect(SOURCES[sid], `key ${key} references unknown source ${sid}`).toBeDefined();
      }
    }
  });
});

describe('G4: library action text — heart_rate:up (verbatim from Appendix A)', () => {
  const e = LIBRARY['heart_rate:up'];
  it('a1 text', () => expect(e!.actions[0]!.text).toBe('Sit quietly for 5 minutes, then repeat the measurement.'));
  it('a2 text', () => expect(e!.actions[1]!.text).toBe('Check recent caffeine, hydration, and exercise, and adjust if needed.'));
  it('a3 text', () => expect(e!.actions[2]!.text).toBe('Write down any symptoms such as dizziness, chest discomfort, or shortness of breath.'));
  it('a4 text', () => expect(e!.actions[3]!.text).toBe('Follow your scheduled exercise and rest plan.'));
  it('has 3 questions', () => expect(e!.questions).toHaveLength(3));
  it('nextMeasurements includes resting HR text', () => {
    expect(e!.nextMeasurements[0]).toContain('Resting heart rate after 5 minutes seated');
  });
});

describe('G4: library action text — bp:up (verbatim)', () => {
  const e = LIBRARY['bp:up'];
  it('a1 text', () => expect(e!.actions[0]!.text).toBe('Sit for 5 minutes with your back supported and feet flat, then repeat the reading.'));
  it('a1 requiresSupply bp_cuff', () => expect(e!.actions[0]!.requiresSupply).toBe('bp_cuff'));
  it('a1 alternativeText', () => expect(e!.actions[0]!.alternativeText).toBe('Note how you feel and report that a cuff reading is not available.'));
  it('a2 text', () => expect(e!.actions[1]!.text).toBe('Note recent salt, caffeine, stress, and exercise.'));
  it('a3 text', () => expect(e!.actions[2]!.text).toBe('Record any headache, vision change, or chest discomfort.'));
});

describe('G4: library action text — behavioral:support (verbatim)', () => {
  const e = LIBRARY['behavioral:support'];
  it('a1 text', () => expect(e!.actions[0]!.text).toBe('Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.'));
  it('a2 text', () => expect(e!.actions[1]!.text).toBe('Keep a regular daily routine, including meals, exercise, and sleep.'));
  it('a3 text', () => expect(e!.actions[2]!.text).toBe('Talk with a crew member or send a message to someone you trust.'));
  it('a4 text', () => expect(e!.actions[3]!.text).toBe('Tell the flight surgeon or behavioral health support if this continues.'));
});

describe('G4: library action text — wellbeing:support same as behavioral:support', () => {
  const wb = LIBRARY['wellbeing:support'];
  const bs = LIBRARY['behavioral:support'];
  it('all four action texts match', () => {
    for (let i = 0; i < 4; i++) {
      expect(wb!.actions[i]!.text).toBe(bs!.actions[i]!.text);
    }
  });
});

describe('G4: library action text — sleep_hours:down (verbatim)', () => {
  const e = LIBRARY['sleep_hours:down'];
  it('a1', () => expect(e!.actions[0]!.text).toBe('Keep a consistent sleep window.'));
  it('a4 requiresSupply sleep_mask', () => expect(e!.actions[3]!.requiresSupply).toBe('sleep_mask'));
  it('a4 alternativeText', () => expect(e!.actions[3]!.alternativeText).toBe('Cover or dim the light near your sleep station.'));
});

describe('G4: library action text — exercise_minutes:down (verbatim)', () => {
  const e = LIBRARY['exercise_minutes:down'];
  it('a1 requiresSupply exercise_equipment', () => expect(e!.actions[0]!.requiresSupply).toBe('exercise_equipment'));
  it('a1 alternativeText', () => expect(e!.actions[0]!.alternativeText).toBe('Do body-weight resistance and stretching and report that equipment is not available.'));
});

describe('G4: library action text — urgent cards', () => {
  it('urgent:bp has one action with correct text', () => {
    expect(LIBRARY['urgent:bp']!.actions[0]!.text).toBe(
      'Follow your emergency medical procedures and contact the crew medical officer now.',
    );
  });
  it('urgent:glucose has one action with correct text', () => {
    expect(LIBRARY['urgent:glucose']!.actions[0]!.text).toBe(
      'Follow your emergency medical procedures and contact the crew medical officer now.',
    );
  });
});

describe('G4: no forbidden words in any library text', () => {
  const FORBIDDEN = [
    'diagnos', 'you have', 'disease', 'cancer', 'depression',
    'anxiety disorder', 'risk score', 'probability of', 'predict', 'ai doctor',
  ];

  it('action texts contain no forbidden words', () => {
    for (const [key, entry] of Object.entries(LIBRARY)) {
      const allText = [
        ...entry.actions.map((a) => a.text),
        ...entry.actions.map((a) => a.alternativeText ?? ''),
        ...entry.questions,
        ...entry.nextMeasurements,
      ].join(' ').toLowerCase();
      for (const word of FORBIDDEN) {
        expect(allText, `"${word}" found in key ${key}`).not.toContain(word);
      }
    }
  });
});

