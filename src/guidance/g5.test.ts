/**
 * G5 tests: buildAlertCards
 * Tests:
 * - All severity x setting combinations produce exact escalation text
 * - {N} filled with 2 x delay + 10 for deep_space review
 * - Missing supply shows alternativeText and supplyAvailable is false
 * - Pattern cards merge and cap at 5 actions (keeping first action of each key first)
 * - Contract invariants 3, 4, 5 hold
 * - Card order is deterministic (urgent > review > watch > info)
 * - Early signal cards produced for indicators with status === 'watch' not in findings
 */
import { describe, it, expect } from 'vitest';
import { buildAlertCards, cardSeverity, getEscalation } from './alertCards';
import { SOURCES } from './sources';
import { INDICATORS } from '@/contracts/indicators';
import type {
  AnalysisResult,
  IndicatorAnalysis,
  IndicatorId,
  MissionContext,
  MissionSettingId,
  SeverityLevel,
} from '@/contracts/types';

const FORBIDDEN_WORDS = [
  'diagnosis', 'diagnose', 'disease', 'cancer', 'depression', 'anxiety disorder', 'you have',
];

function checkNoForbiddenWords(text: string, context: string): void {
  for (const w of FORBIDDEN_WORDS) {
    expect(text.toLowerCase(), `Forbidden word "${w}" in ${context}`).not.toContain(w.toLowerCase());
  }
}

function emptyIndicatorAnalysis(id: IndicatorId): IndicatorAnalysis {
  return {
    indicatorId: id,
    status: 'ok',
    cusumUp: 0,
    cusumDown: 0,
    onsetDay: null,
    persistent: false,
    lastValue: 70,
    lastZ: 0,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: [
      { day: 1, value: 70, expected: 70, z: 0 },
      { day: 2, value: 70, expected: 70, z: 0 },
      { day: 3, value: 70, expected: 70, z: 0 },
      { day: 4, value: 70, expected: 70, z: 0 },
      { day: 5, value: 70, expected: 70, z: 0 },
      { day: 6, value: 70, expected: 70, z: 0 },
      { day: 7, value: 70, expected: 70, z: 0 },
    ],
  };
}

function createMockAnalysis(): AnalysisResult {
  const indicators = {} as Record<IndicatorId, IndicatorAnalysis>;
  for (const meta of INDICATORS) {
    indicators[meta.id] = emptyIndicatorAnalysis(meta.id);
  }

  return {
    crewId: 'crew-1',
    upToDay: 10,
    baselineReady: true,
    baselines: {
      heart_rate: { indicatorId: 'heart_rate', median: 64, sigma: 2.5, n: 30 },
      bp_sys: { indicatorId: 'bp_sys', median: 116, sigma: 4.0, n: 30 },
      bp_dia: { indicatorId: 'bp_dia', median: 74, sigma: 3.0, n: 30 },
      sleep_hours: { indicatorId: 'sleep_hours', median: 7.0, sigma: 0.5, n: 30 },
      mood: { indicatorId: 'mood', median: 3.8, sigma: 0.3, n: 30 },
    },
    indicators,
    domains: {
      cardiovascular: { domain: 'cardiovascular', status: 'ok', indicators: ['heart_rate', 'bp_sys', 'bp_dia'] },
      sleep_recovery: { domain: 'sleep_recovery', status: 'ok', indicators: ['sleep_hours'] },
      physical_performance: { domain: 'physical_performance', status: 'ok', indicators: ['exercise_minutes'] },
      behavioral: { domain: 'behavioral', status: 'ok', indicators: ['mood', 'stress', 'energy'] },
      metabolic_general: { domain: 'metabolic_general', status: 'ok', indicators: ['body_temp', 'glucose'] },
      radiation: { domain: 'radiation', status: 'ok', indicators: ['radiation_dose'] },
    },
    findings: [],
  };
}

const defaultContext: MissionContext = {
  setting: 'deep_space',
  supplies: {
    bp_cuff: true,
    thermometer: true,
    glucometer: true,
    wrist_hr_monitor: true,
    exercise_equipment: true,
    sleep_mask: true,
  },
};

// ── Escalation Matrix Tests ──────────────────────────────────────────────────

describe('Escalation matrix', () => {
  const severities: SeverityLevel[] = ['info', 'watch', 'review', 'urgent'];
  const settings: MissionSettingId[] = ['station', 'lunar_base', 'deep_space'];

  it('station and lunar_base info -> self_manage', () => {
    for (const setting of ['station', 'lunar_base'] as const) {
      const esc = getEscalation('info', setting);
      expect(esc.level).toBe('self_manage');
      expect(esc.text).toBe('No action needed. Keep logging.');
      expect(esc.expectedReplyMinutes).toBeNull();
    }
  });

  it('deep_space info -> self_manage', () => {
    const esc = getEscalation('info', 'deep_space');
    expect(esc.level).toBe('self_manage');
    expect(esc.text).toBe('No action needed. Keep logging.');
    expect(esc.expectedReplyMinutes).toBeNull();
  });

  it('station and lunar_base watch -> report_to_ground', () => {
    for (const setting of ['station', 'lunar_base'] as const) {
      const esc = getEscalation('watch', setting);
      expect(esc.level).toBe('report_to_ground');
      expect(esc.text).toBe('Log it and mention it at your next scheduled ground conference.');
      expect(esc.expectedReplyMinutes).toBeNull();
    }
  });

  it('deep_space watch -> self_manage', () => {
    const esc = getEscalation('watch', 'deep_space');
    expect(esc.level).toBe('self_manage');
    expect(esc.text).toBe('Try the steps below and include this in your next scheduled report.');
    expect(esc.expectedReplyMinutes).toBeNull();
  });

  it('station and lunar_base review -> contact_ground_now', () => {
    for (const setting of ['station', 'lunar_base'] as const) {
      const esc = getEscalation('review', setting);
      expect(esc.level).toBe('contact_ground_now');
      expect(esc.text).toBe('Ask the flight surgeon for a call today. Start the steps below while you wait.');
      expect(esc.expectedReplyMinutes).toBeNull();
    }
  });

  it('deep_space review -> report_to_ground with 34 minutes', () => {
    const esc = getEscalation('review', 'deep_space');
    expect(esc.level).toBe('report_to_ground');
    expect(esc.text).toBe('Start the steps below now. Send a report to the flight surgeon; a reply may take at least 34 minutes.');
    expect(esc.expectedReplyMinutes).toBe(34);
  });

  it('station and lunar_base urgent -> urgent_now', () => {
    for (const setting of ['station', 'lunar_base'] as const) {
      const esc = getEscalation('urgent', setting);
      expect(esc.level).toBe('urgent_now');
      expect(esc.text).toBe('Contact the crew medical officer and ground now. Follow your emergency procedures.');
      expect(esc.expectedReplyMinutes).toBeNull();
    }
  });

  it('deep_space urgent -> urgent_now', () => {
    const esc = getEscalation('urgent', 'deep_space');
    expect(esc.level).toBe('urgent_now');
    expect(esc.text).toBe('Contact the crew medical officer now and send an urgent report to ground. Do not wait for a reply to start emergency procedures.');
    expect(esc.expectedReplyMinutes).toBeNull();
  });
});

// ── Supply fallback tests ────────────────────────────────────────────────────

describe('Supply fallback in alert cards', () => {
  it('when bp_cuff is false, bp action has supplyAvailable false and displays alternativeText', () => {
    const analysis = createMockAnalysis();
    analysis.findings.push({
      id: 'persistent_change:bp_sys:5',
      kind: 'persistent_change',
      domains: ['cardiovascular'],
      indicators: ['bp_sys'],
      onsetDay: 5,
      firstFlaggedDay: 5,
      evidenceStrength: 'low',
      dataQualityPoor: false,
      urgent: false,
    });

    const ctxWithoutCuff: MissionContext = {
      ...defaultContext,
      supplies: {
        ...defaultContext.supplies,
        bp_cuff: false,
      },
    };

    const cards = buildAlertCards(analysis, ctxWithoutCuff);
    expect(cards).toHaveLength(1);
    const card = cards[0];
    const cuffAction = card?.recommendedActions.find((a) => a.requiresSupply === 'bp_cuff');
    expect(cuffAction).toBeDefined();
    expect(cuffAction?.supplyAvailable).toBe(false);
    expect(cuffAction?.alternativeText).toBe(
      'Note how you feel and report that a cuff reading is not available.',
    );
  });
});

// ── Pattern card action merging ──────────────────────────────────────────────

describe('Pattern card action merging', () => {
  it('merges actions up to 5, keeping first action of each key first', () => {
    const analysis = createMockAnalysis();
    analysis.findings.push({
      id: 'multi_signal_pattern:heart_rate+bp_sys+sleep_hours+mood:85',
      kind: 'multi_signal_pattern',
      domains: ['cardiovascular', 'sleep_recovery', 'behavioral'],
      indicators: ['heart_rate', 'bp_sys', 'sleep_hours', 'mood'],
      onsetDay: 85,
      firstFlaggedDay: 90,
      evidenceStrength: 'high',
      dataQualityPoor: false,
      urgent: false,
    });

    const cards = buildAlertCards(analysis, defaultContext);
    expect(cards).toHaveLength(1);
    const card = cards[0];
    expect(card?.kind).toBe('multi_signal_pattern');
    expect(card?.recommendedActions.length).toBeLessThanOrEqual(5);
    expect(card?.recommendedActions.length).toBe(5);

    // First action of heart_rate:up, bp:up, sleep_hours:down, behavioral:support
    const firstTexts = [
      'Sit quietly for 5 minutes, then repeat the measurement.',
      'Sit for 5 minutes with your back supported and feet flat, then repeat the reading.',
      'Keep a consistent sleep window.',
      'Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.',
    ];
    for (let i = 0; i < 4; i++) {
      expect(card?.recommendedActions[i]?.text).toBe(firstTexts[i]);
    }
  });
});

// ── Contract Invariants ──────────────────────────────────────────────────────

describe('Contract invariants 3-5 in alert cards', () => {
  it('satisfies contract invariants 3, 4, and 5', () => {
    const analysis = createMockAnalysis();
    // Add multiple kinds of findings
    analysis.findings.push({
      id: 'hard_threshold:bp_sys:10',
      kind: 'hard_threshold',
      domains: ['cardiovascular'],
      indicators: ['bp_sys'],
      onsetDay: 10,
      firstFlaggedDay: 10,
      evidenceStrength: 'low',
      dataQualityPoor: false,
      urgent: true,
    });
    analysis.findings.push({
      id: 'expected_adaptation:heart_rate:2',
      kind: 'expected_adaptation',
      domains: ['cardiovascular'],
      indicators: ['heart_rate'],
      onsetDay: 2,
      firstFlaggedDay: 2,
      evidenceStrength: 'low',
      dataQualityPoor: false,
      urgent: false,
    });
    // Indicator with watch status and no finding -> generates early_signal card
    analysis.indicators.sleep_hours.status = 'watch';
    analysis.indicators.sleep_hours.onsetDay = 4;

    const cards = buildAlertCards(analysis, {
      ...defaultContext,
      supplies: {
        ...defaultContext.supplies,
        bp_cuff: false, // test supply missing with invariant 4
      },
    });

    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      // Invariant 3: non-empty observation, uncertainty.statement, escalation.text, and at least 1 id in sourceIds in SOURCES
      expect(card.observation.length).toBeGreaterThan(0);
      expect(card.uncertainty.statement.length).toBeGreaterThan(0);
      expect(card.escalation.text.length).toBeGreaterThan(0);
      expect(card.sourceIds.length).toBeGreaterThan(0);
      for (const sid of card.sourceIds) {
        expect(SOURCES[sid], `Unknown source id ${sid}`).toBeDefined();
      }

      // Invariant 4: recommendedActions never contains an action whose supplyAvailable is false without alternativeText
      for (const act of card.recommendedActions) {
        if (!act.supplyAvailable) {
          expect(act.alternativeText).toBeDefined();
          expect(act.alternativeText!.length).toBeGreaterThan(0);
        }
      }

      // Invariant 5: no forbidden words in any string
      checkNoForbiddenWords(card.title, `card ${card.id} title`);
      checkNoForbiddenWords(card.observation, `card ${card.id} observation`);
      checkNoForbiddenWords(card.uncertainty.statement, `card ${card.id} uncertainty statement`);
      checkNoForbiddenWords(card.escalation.text, `card ${card.id} escalation text`);
      for (const e of card.evidence) {
        checkNoForbiddenWords(e.text, `card ${card.id} evidence`);
      }
      for (const a of card.recommendedActions) {
        checkNoForbiddenWords(a.text, `card ${card.id} action text`);
        if (a.alternativeText) {
          checkNoForbiddenWords(a.alternativeText, `card ${card.id} alternative text`);
        }
      }
    }
  });

  it('cards are sorted deterministically: urgent > review > watch > info', () => {
    const analysis = createMockAnalysis();
    analysis.findings.push(
      {
        id: 'expected_adaptation:heart_rate:2',
        kind: 'expected_adaptation',
        domains: ['cardiovascular'],
        indicators: ['heart_rate'],
        onsetDay: 2,
        firstFlaggedDay: 2,
        evidenceStrength: 'low',
        dataQualityPoor: false,
        urgent: false,
      },
      {
        id: 'persistent_change:bp_sys:5',
        kind: 'persistent_change',
        domains: ['cardiovascular'],
        indicators: ['bp_sys'],
        onsetDay: 5,
        firstFlaggedDay: 5,
        evidenceStrength: 'low',
        dataQualityPoor: false,
        urgent: false,
      },
      {
        id: 'hard_threshold:bp_sys:10',
        kind: 'hard_threshold',
        domains: ['cardiovascular'],
        indicators: ['bp_sys'],
        onsetDay: 10,
        firstFlaggedDay: 10,
        evidenceStrength: 'low',
        dataQualityPoor: false,
        urgent: true,
      },
    );
    // sleep_hours watch -> watch severity
    analysis.indicators.sleep_hours.status = 'watch';

    const cards = buildAlertCards(analysis, defaultContext);
    expect(cards.map((c) => c.severity)).toEqual(['urgent', 'review', 'watch', 'info']);
  });
});
