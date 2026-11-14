import { describe, it, expect } from 'vitest';
import { evaluateCheckIn, supportActions } from './wellbeing';
import type { CheckInInput, SupplyId } from '@/contracts/types';

// G6 acceptance: tests for every branch (urgent flag; mood ≤ 2 and stress ≥ 4;
// each single trigger; none).

function makeInput(overrides: Partial<CheckInInput> = {}): CheckInInput {
  return {
    crewId: 'crew-1',
    day: 50,
    mood: 4,
    stress: 2,
    energy: 4,
    urgentHelpRequested: false,
    ...overrides,
  };
}

const allSupplies: Record<SupplyId, boolean> = {
  bp_cuff: true,
  thermometer: true,
  glucometer: true,
  wrist_hr_monitor: true,
  exercise_equipment: true,
  sleep_mask: true,
};

describe('G6: evaluateCheckIn — rule 1: urgentHelpRequested', () => {
  it('returns level urgent', () => {
    const result = evaluateCheckIn(makeInput({ urgentHelpRequested: true }));
    expect(result.level).toBe('urgent');
  });

  it('returns exact message', () => {
    const result = evaluateCheckIn(makeInput({ urgentHelpRequested: true }));
    expect(result.message).toBe(
      'Contact your crew medical officer and ground now. You do not have to handle this alone.',
    );
  });

  it('escalation is urgent_now', () => {
    const result = evaluateCheckIn(makeInput({ urgentHelpRequested: true }));
    expect(result.escalation?.level).toBe('urgent_now');
  });

  it('no suggestions in urgent', () => {
    const result = evaluateCheckIn(makeInput({ urgentHelpRequested: true }));
    expect(result.suggestions).toHaveLength(0);
  });

  it('urgent takes priority even when mood and stress also trigger', () => {
    const result = evaluateCheckIn(makeInput({ urgentHelpRequested: true, mood: 1, stress: 5 }));
    expect(result.level).toBe('urgent');
  });
});

describe('G6: evaluateCheckIn — rule 2: mood ≤ 2 and stress ≥ 4', () => {
  it('mood=2, stress=4 → support', () => {
    const result = evaluateCheckIn(makeInput({ mood: 2, stress: 4 }));
    expect(result.level).toBe('support');
  });

  it('mood=1, stress=5 → support', () => {
    const result = evaluateCheckIn(makeInput({ mood: 1, stress: 5 }));
    expect(result.level).toBe('support');
  });

  it('exact combined-trigger message', () => {
    const result = evaluateCheckIn(makeInput({ mood: 2, stress: 4 }));
    expect(result.message).toBe(
      'It looks like today is hard. Here are some steps that may help, and the flight surgeon or behavioral health support can talk it through with you.',
    );
  });

  it('suggestions are non-empty', () => {
    const result = evaluateCheckIn(makeInput({ mood: 2, stress: 4 }));
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('escalation is null', () => {
    const result = evaluateCheckIn(makeInput({ mood: 2, stress: 4 }));
    expect(result.escalation).toBeNull();
  });
});

describe('G6: evaluateCheckIn — rule 3: single triggers', () => {
  it('mood ≤ 2 alone → support', () => {
    const result = evaluateCheckIn(makeInput({ mood: 2, stress: 2, energy: 3 }));
    expect(result.level).toBe('support');
  });

  it('stress ≥ 4 alone → support', () => {
    const result = evaluateCheckIn(makeInput({ mood: 3, stress: 4, energy: 3 }));
    expect(result.level).toBe('support');
  });

  it('energy ≤ 2 alone → support', () => {
    const result = evaluateCheckIn(makeInput({ mood: 3, stress: 2, energy: 2 }));
    expect(result.level).toBe('support');
  });

  it('single trigger message', () => {
    const result = evaluateCheckIn(makeInput({ mood: 2, stress: 2, energy: 3 }));
    expect(result.message).toBe('Thank you for checking in. Here are a few steps that may help.');
  });

  it('suggestions are non-empty', () => {
    const result = evaluateCheckIn(makeInput({ mood: 2, stress: 2, energy: 3 }));
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

describe('G6: evaluateCheckIn — rule 4: none', () => {
  it('all in normal range → none', () => {
    const result = evaluateCheckIn(makeInput({ mood: 4, stress: 2, energy: 4 }));
    expect(result.level).toBe('none');
  });

  it('exact none message', () => {
    const result = evaluateCheckIn(makeInput());
    expect(result.message).toBe('Thanks for checking in.');
  });

  it('no suggestions', () => {
    const result = evaluateCheckIn(makeInput());
    expect(result.suggestions).toHaveLength(0);
  });

  it('escalation is null', () => {
    const result = evaluateCheckIn(makeInput());
    expect(result.escalation).toBeNull();
  });
});

describe('G6: evaluateCheckIn — boundary values', () => {
  it('mood=3 (normal boundary) → none', () => {
    const result = evaluateCheckIn(makeInput({ mood: 3, stress: 2, energy: 3 }));
    expect(result.level).toBe('none');
  });

  it('stress=3 (normal boundary) → none', () => {
    const result = evaluateCheckIn(makeInput({ mood: 3, stress: 3, energy: 3 }));
    expect(result.level).toBe('none');
  });

  it('energy=3 (normal boundary) → none', () => {
    const result = evaluateCheckIn(makeInput({ mood: 3, stress: 2, energy: 3 }));
    expect(result.level).toBe('none');
  });
});

describe('G6: supportActions', () => {
  it('returns 4 actions from wellbeing:support', () => {
    const actions = supportActions(allSupplies);
    expect(actions).toHaveLength(4);
  });

  it('all actions have supplyAvailable true (no supply required)', () => {
    const actions = supportActions(allSupplies);
    for (const a of actions) {
      expect(a.supplyAvailable).toBe(true);
    }
  });

  it('no forbidden words in suggestions text', () => {
    const actions = supportActions(allSupplies);
    const FORBIDDEN = ['diagnos', 'you have', 'disease', 'cancer', 'depression', 'anxiety disorder'];
    const allText = actions.map((a) => a.text).join(' ').toLowerCase();
    for (const word of FORBIDDEN) {
      expect(allText).not.toContain(word);
    }
  });
});

