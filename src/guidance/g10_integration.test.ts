/**
 * G10 integration tests: buildAlertCards on real engine analyze output
 * Scenarios tested:
 *   1. Demo story (Crew 1, slow_drift, seed 42, day 85 and day 120, deep_space)
 *   2. normal_adaptation (Crew 2, normal_adaptation, seed 43, day 120)
 *   3. sensor_fault (Crew 3, sensor_fault, seed 44, day 90)
 * Asserts:
 *   - Demo story yields review cards (including multi_signal_pattern around day 85)
 *   - Invariants 3-5 hold across all cards
 *   - No diagnosis words / forbidden words anywhere
 */
import { describe, it, expect } from 'vitest';
import { generateScenario, analyze } from '@/engine';
import { buildAlertCards } from './alertCards';
import { DEFAULT_SUPPLIES } from './supplies';
import { SOURCES } from './sources';
import { DEMO_STORY } from '@/contracts/constants';
import type { AlertCard, MissionContext } from '@/contracts/types';

const FORBIDDEN_WORDS = [
  'diagnosis', 'diagnose', 'disease', 'cancer', 'depression', 'anxiety disorder', 'you have',
];

function checkCardInvariants(card: AlertCard): void {
  // Invariant 3: non-empty observation, uncertainty.statement, escalation.text, at least 1 source in SOURCES
  expect(card.observation.length).toBeGreaterThan(0);
  expect(card.uncertainty.statement.length).toBeGreaterThan(0);
  expect(card.escalation.text.length).toBeGreaterThan(0);
  expect(card.sourceIds.length).toBeGreaterThan(0);
  for (const sid of card.sourceIds) {
    expect(SOURCES[sid], `Unknown source id ${sid}`).toBeDefined();
  }

  // Invariant 4: no action with supplyAvailable: false lacking alternativeText
  for (const act of card.recommendedActions) {
    if (!act.supplyAvailable) {
      expect(act.alternativeText).toBeDefined();
      expect(act.alternativeText!.length).toBeGreaterThan(0);
    }
  }

  // Invariant 5: no forbidden words
  for (const w of FORBIDDEN_WORDS) {
    expect(card.title.toLowerCase()).not.toContain(w);
    expect(card.observation.toLowerCase()).not.toContain(w);
    expect(card.uncertainty.statement.toLowerCase()).not.toContain(w);
    expect(card.escalation.text.toLowerCase()).not.toContain(w);
    for (const e of card.evidence) {
      expect(e.text.toLowerCase()).not.toContain(w);
    }
    for (const a of card.recommendedActions) {
      expect(a.text.toLowerCase()).not.toContain(w);
      if (a.alternativeText) {
        expect(a.alternativeText.toLowerCase()).not.toContain(w);
      }
    }
  }
}

describe('G10 integration: Demo story (slow_drift)', () => {
  const dataset = generateScenario({
    scenarioId: DEMO_STORY.scenarioId,
    seed: DEMO_STORY.seed,
    crewId: DEMO_STORY.crewId,
    crewName: 'Crew 1',
    missionSetting: DEMO_STORY.missionSetting,
  });

  const ctx: MissionContext = {
    setting: DEMO_STORY.missionSetting,
    supplies: DEFAULT_SUPPLIES,
  };

  it('yields at least one review card with multi_signal_pattern around day 85', () => {
    const analysisDay85 = analyze(dataset, 85);
    const cardsDay85 = buildAlertCards(analysisDay85, ctx);

    expect(cardsDay85.length).toBeGreaterThan(0);
    const patternCard = cardsDay85.find((c) => c.kind === 'multi_signal_pattern');
    expect(patternCard).toBeDefined();
    expect(patternCard?.severity).toBe('review');
    expect(patternCard?.escalation.level).toBe('report_to_ground');
    expect(patternCard?.escalation.expectedReplyMinutes).toBe(34);
    expect(patternCard?.escalation.text).toContain('at least 34 minutes');
    if (patternCard) checkCardInvariants(patternCard);
  });

  it('yields review cards on viewed day 120 satisfying all invariants', () => {
    const analysisDay120 = analyze(dataset, DEMO_STORY.viewDay);
    const cardsDay120 = buildAlertCards(analysisDay120, ctx);

    expect(cardsDay120.length).toBeGreaterThan(0);
    const reviewCards = cardsDay120.filter((c) => c.severity === 'review');
    expect(reviewCards.length).toBeGreaterThan(0);
    for (const card of cardsDay120) {
      checkCardInvariants(card);
    }
  });
});

describe('G10 integration: normal_adaptation day 120', () => {
  const dataset = generateScenario({
    scenarioId: 'normal_adaptation',
    seed: 43,
    crewId: 'crew-2',
    crewName: 'Crew 2',
    missionSetting: 'deep_space',
  });

  const analysis = analyze(dataset, 120);
  const ctx: MissionContext = {
    setting: 'deep_space',
    supplies: DEFAULT_SUPPLIES,
  };

  const cards = buildAlertCards(analysis, ctx);

  it('produces no review or urgent cards', () => {
    const seriousCards = cards.filter(
      (c) => c.severity === 'review' || c.severity === 'urgent',
    );
    expect(seriousCards).toHaveLength(0);
  });

  it('all produced cards satisfy invariants', () => {
    for (const card of cards) {
      checkCardInvariants(card);
    }
  });
});

describe('G10 integration: sensor_fault day 90', () => {
  const dataset = generateScenario({
    scenarioId: 'sensor_fault',
    seed: 44,
    crewId: 'crew-3',
    crewName: 'Crew 3',
    missionSetting: 'deep_space',
  });

  const analysis = analyze(dataset, 90);
  const ctx: MissionContext = {
    setting: 'deep_space',
    supplies: DEFAULT_SUPPLIES,
  };

  const cards = buildAlertCards(analysis, ctx);

  it('produces an isolated_spike card with watch severity and no review card', () => {
    const spikeCard = cards.find((c) => c.kind === 'isolated_spike');
    expect(spikeCard).toBeDefined();
    expect(spikeCard?.severity).toBe('watch');

    const reviewCards = cards.filter((c) => c.severity === 'review');
    expect(reviewCards).toHaveLength(0);
  });

  it('all produced cards satisfy invariants', () => {
    for (const card of cards) {
      checkCardInvariants(card);
    }
  });
});
