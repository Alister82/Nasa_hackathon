import { describe, expect, it } from 'vitest';
import type { MissionContext } from '@/contracts/types';
import { DEFAULT_VIEW_DAY, DEMO_STORY } from '@/contracts/constants';
import { analyze, generateScenario } from '@/engine';
import { buildAlertCards } from './alertCards';
import { DEFAULT_SUPPLIES, SOURCES } from './index';

const context: MissionContext = { setting: 'deep_space', supplies: DEFAULT_SUPPLIES };

function demoAnalysis() {
  const dataset = generateScenario({
    crewId: DEMO_STORY.crewId,
    crewName: 'Crew 1',
    scenarioId: DEMO_STORY.scenarioId,
    seed: DEMO_STORY.seed,
    missionSetting: DEMO_STORY.missionSetting,
  });
  return analyze(dataset, DEFAULT_VIEW_DAY);
}

describe('alert cards on the real demo analysis', () => {
  it('produces a review pattern card with evidence, sources, and deep-space reply time', () => {
    const analysis = demoAnalysis();
    const cards = buildAlertCards(analysis, context);
    const reviewCards = cards.filter((card) => card.severity === 'review');

    expect(reviewCards.length).toBeGreaterThan(0);
    expect(cards.some((card) => card.kind === 'multi_signal_pattern')).toBe(true);

    const review = reviewCards[0];
    expect(review).toBeDefined();
    if (!review) return;
    expect(review.escalation.level).toBe('report_to_ground');
    expect(review.escalation.expectedReplyMinutes).toBe(34);
    expect(review.escalation.text).toContain('at least 34 minutes');
    expect(review.evidence.length).toBe(review.indicators.length);
    expect(review.sourceIds.length).toBeGreaterThan(0);
  });

  it('never emits placeholder observations or sourceless evidence on any card', () => {
    const cards = buildAlertCards(demoAnalysis(), context);
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      expect(card.observation.length).toBeGreaterThan(10);
      expect(card.observation).not.toContain('has changed recently');
      expect(card.observation).not.toContain('unknown');
      expect(card.uncertainty.statement.length).toBeGreaterThan(0);
      expect(card.evidence.length).toBeGreaterThan(0);
      expect(card.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of card.sourceIds) {
        expect(SOURCES[sourceId]).toBeDefined();
      }
      for (const action of card.recommendedActions) {
        if (!action.supplyAvailable) {
          expect(action.alternativeText).toBeDefined();
        }
      }
      expect(card.recommendedActions.length).toBeLessThanOrEqual(5);
    }
  });

  it('shows the supply alternative when the cuff is marked unavailable', () => {
    const cards = buildAlertCards(demoAnalysis(), {
      setting: 'deep_space',
      supplies: { ...DEFAULT_SUPPLIES, bp_cuff: false },
    });
    const bpCard = cards.find((card) => card.indicators.includes('bp_sys'));
    expect(bpCard).toBeDefined();
    const cuffAction = bpCard?.recommendedActions.find(
      (action) => action.requiresSupply === 'bp_cuff',
    );
    expect(cuffAction?.supplyAvailable).toBe(false);
    expect(cuffAction?.alternativeText).toContain('cuff reading is not available');
  });
});
