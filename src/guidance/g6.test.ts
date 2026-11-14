/**
 * G6 tests: wellbeing.ts
 * evaluateCheckIn and supportActions per ARCHITECTURE.md 7.6.
 * Tests for every branch:
 *   1. urgentHelpRequested
 *   2. mood <= 2 && stress >= 4
 *   3. each single trigger (mood <= 2; stress >= 4; energy <= 2)
 *   4. none
 * Checks forbidden words in all returned strings.
 */
import { describe, it, expect } from 'vitest';
import { evaluateCheckIn, supportActions } from './wellbeing';
import type { CheckInInput, Rating } from '@/contracts/types';

const FORBIDDEN_WORDS = [
  'diagnosis', 'diagnose', 'disease', 'cancer', 'depression', 'anxiety disorder', 'you have',
];

function checkNoForbiddenWords(text: string, context: string): void {
  for (const w of FORBIDDEN_WORDS) {
    expect(text.toLowerCase(), `Forbidden word "${w}" in ${context}`).not.toContain(w.toLowerCase());
  }
}

describe('evaluateCheckIn', () => {
  const baseInput: CheckInInput = {
    crewId: 'crew-1',
    day: 10,
    mood: 3,
    stress: 3,
    energy: 3,
    urgentHelpRequested: false,
  };

  it('urgentHelpRequested branch -> level: urgent, escalation: urgent_now', () => {
    const res = evaluateCheckIn({
      ...baseInput,
      urgentHelpRequested: true,
    });
    expect(res.level).toBe('urgent');
    expect(res.escalation).toBeDefined();
    expect(res.escalation?.level).toBe('urgent_now');
    expect(res.message).toBe(
      'Contact your crew medical officer and ground now. You do not have to handle this alone.',
    );
    expect(res.escalation?.text).toBe(res.message);
    checkNoForbiddenWords(res.message, 'urgent message');
  });

  it('mood <= 2 and stress >= 4 -> level: support (harder combination)', () => {
    const res = evaluateCheckIn({
      ...baseInput,
      mood: 2,
      stress: 4,
    });
    expect(res.level).toBe('support');
    expect(res.escalation).toBeNull();
    expect(res.message).toBe(
      'It looks like today is hard. Here are some steps that may help, and the flight surgeon or behavioral health support can talk it through with you.',
    );
    expect(res.suggestions.length).toBe(4);
    checkNoForbiddenWords(res.message, 'support both message');
  });

  it('single trigger: mood <= 2 -> level: support', () => {
    const res = evaluateCheckIn({
      ...baseInput,
      mood: 2,
      stress: 3,
      energy: 3,
    });
    expect(res.level).toBe('support');
    expect(res.escalation).toBeNull();
    expect(res.message).toBe(
      'Thank you for checking in. Here are a few steps that may help.',
    );
    expect(res.suggestions.length).toBe(4);
    checkNoForbiddenWords(res.message, 'support mood message');
  });

  it('single trigger: stress >= 4 -> level: support', () => {
    const res = evaluateCheckIn({
      ...baseInput,
      mood: 3,
      stress: 4,
      energy: 3,
    });
    expect(res.level).toBe('support');
    expect(res.escalation).toBeNull();
    expect(res.message).toBe(
      'Thank you for checking in. Here are a few steps that may help.',
    );
    expect(res.suggestions.length).toBe(4);
  });

  it('single trigger: energy <= 2 -> level: support', () => {
    const res = evaluateCheckIn({
      ...baseInput,
      mood: 3,
      stress: 3,
      energy: 2,
    });
    expect(res.level).toBe('support');
    expect(res.escalation).toBeNull();
    expect(res.message).toBe(
      'Thank you for checking in. Here are a few steps that may help.',
    );
    expect(res.suggestions.length).toBe(4);
  });

  it('none branch -> level: none', () => {
    const res = evaluateCheckIn({
      ...baseInput,
      mood: 4,
      stress: 2,
      energy: 4,
    });
    expect(res.level).toBe('none');
    expect(res.escalation).toBeNull();
    expect(res.message).toBe('Thanks for checking in.');
    expect(res.suggestions).toEqual([]);
    checkNoForbiddenWords(res.message, 'none message');
  });
});

describe('supportActions', () => {
  it('returns 4 actions with supplyAvailable true', () => {
    const actions = supportActions({
      bp_cuff: true,
      thermometer: true,
      glucometer: true,
      wrist_hr_monitor: true,
      exercise_equipment: true,
      sleep_mask: true,
    });
    expect(actions).toHaveLength(4);
    for (const a of actions) {
      expect(a.supplyAvailable).toBe(true);
      expect(a.text.length).toBeGreaterThan(0);
      checkNoForbiddenWords(a.text, `action ${a.id}`);
    }
  });
});

