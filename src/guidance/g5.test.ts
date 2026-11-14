import { describe, it, expect } from 'vitest';
import { buildAlertCards } from './alertCards';
import { SOURCES } from './sources';
import type {
  AnalysisResult, MissionContext, Finding, IndicatorAnalysis,
  DomainAnalysis, Baseline, IndicatorId, DomainId,
} from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeBaseline(id: IndicatorId, median: number, sigma: number): Baseline {
  return { indicatorId: id, median, sigma, n: 30 };
}

function makeIndicatorAnalysis(
  id: IndicatorId,
  overrides: Partial<IndicatorAnalysis> = {},
): IndicatorAnalysis {
  return {
    indicatorId: id,
    status: 'ok',
    cusumUp: 0,
    cusumDown: 0,
    onsetDay: null,
    persistent: false,
    lastValue: null,
    lastZ: null,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: [],
    ...overrides,
  };
}

function makeDomainAnalysis(domain: DomainId, status: 'ok' | 'watch' | 'flagged' = 'ok'): DomainAnalysis {
  const domainIndicators = INDICATORS.filter((i) => i.domain === domain).map((i) => i.id);
  return { domain, status, indicators: domainIndicators };
}

function makeAllIndicators(overrides: Partial<Record<IndicatorId, Partial<IndicatorAnalysis>>> = {}): Record<IndicatorId, IndicatorAnalysis> {
  const result = {} as Record<IndicatorId, IndicatorAnalysis>;
  for (const meta of INDICATORS) {
    result[meta.id] = makeIndicatorAnalysis(meta.id, overrides[meta.id]);
  }
  return result;
}

function makeAllDomains(): Record<DomainId, DomainAnalysis> {
  const domains: DomainId[] = [
    'cardiovascular', 'sleep_recovery', 'physical_performance',
    'behavioral', 'metabolic_general', 'radiation',
  ];
  const result = {} as Record<DomainId, DomainAnalysis>;
  for (const d of domains) {
    result[d] = makeDomainAnalysis(d);
  }
  return result;
}

function makeBaseAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    crewId: 'crew-1',
    upToDay: 120,
    baselineReady: true,
    baselines: {
      heart_rate: makeBaseline('heart_rate', 64, 2),
      bp_sys: makeBaseline('bp_sys', 116, 4),
      bp_dia: makeBaseline('bp_dia', 74, 3),
      body_temp: makeBaseline('body_temp', 36.6, 0.15),
      glucose: makeBaseline('glucose', 90, 5),
      sleep_hours: makeBaseline('sleep_hours', 6.8, 0.5),
      exercise_minutes: makeBaseline('exercise_minutes', 120, 15),
      mood: makeBaseline('mood', 3.8, 0.4),
      stress: makeBaseline('stress', 2.2, 0.4),
      energy: makeBaseline('energy', 3.7, 0.4),
    },
    indicators: makeAllIndicators(),
    domains: makeAllDomains(),
    findings: [],
    ...overrides,
  };
}

function makeCtx(setting: MissionContext['setting'] = 'station'): MissionContext {
  return {
    setting,
    supplies: {
      bp_cuff: true,
      thermometer: true,
      glucometer: true,
      wrist_hr_monitor: true,
      exercise_equipment: true,
      sleep_mask: true,
    },
  };
}

function makePersistentFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'persistent_change:heart_rate:95',
    kind: 'persistent_change',
    domains: ['cardiovascular'],
    indicators: ['heart_rate'],
    onsetDay: 85,
    firstFlaggedDay: 95,
    evidenceStrength: 'low',
    dataQualityPoor: false,
    urgent: false,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('G5: buildAlertCards — empty when baselineReady is false', () => {
  it('returns [] when baseline not ready', () => {
    const analysis = makeBaseAnalysis({ baselineReady: false });
    expect(buildAlertCards(analysis, makeCtx())).toHaveLength(0);
  });
});

describe('G5: buildAlertCards — no findings and no watch indicators → empty', () => {
  it('returns [] when no findings', () => {
    const analysis = makeBaseAnalysis({ findings: [] });
    expect(buildAlertCards(analysis, makeCtx())).toHaveLength(0);
  });
});

describe('G5: escalation matrix — all severity × setting combinations', () => {
  // info severity (expected_adaptation) → self_manage always
  it('info + station → self_manage', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'expected_adaptation', evidenceStrength: 'low' };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    expect(cards[0]!.escalation.level).toBe('self_manage');
    expect(cards[0]!.escalation.text).toBe('No action needed. Keep logging.');
  });

  it('info + deep_space → self_manage', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'expected_adaptation', evidenceStrength: 'low' };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('deep_space'));
    expect(cards[0]!.escalation.level).toBe('self_manage');
  });

  // watch severity
  it('watch (isolated_spike) + station → report_to_ground', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'isolated_spike', evidenceStrength: 'low' };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    expect(cards[0]!.escalation.level).toBe('report_to_ground');
    expect(cards[0]!.escalation.text).toBe('Log it and mention it at your next scheduled ground conference.');
  });

  it('watch (isolated_spike) + lunar_base → report_to_ground', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'isolated_spike', evidenceStrength: 'low' };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('lunar_base'));
    expect(cards[0]!.escalation.level).toBe('report_to_ground');
  });

  it('watch (isolated_spike) + deep_space → self_manage', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'isolated_spike', evidenceStrength: 'low' };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('deep_space'));
    expect(cards[0]!.escalation.level).toBe('self_manage');
    expect(cards[0]!.escalation.text).toBe('Try the steps below and include this in your next scheduled report.');
  });

  // review severity
  it('review (persistent_change) + station → contact_ground_now', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'persistent_change' };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    expect(cards[0]!.escalation.level).toBe('contact_ground_now');
    expect(cards[0]!.escalation.text).toBe('Ask the flight surgeon for a call today. Start the steps below while you wait.');
  });

  it('review + lunar_base → contact_ground_now', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'persistent_change' };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('lunar_base'));
    expect(cards[0]!.escalation.level).toBe('contact_ground_now');
  });

  it('review + deep_space → report_to_ground with delay text', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'persistent_change' };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('deep_space'));
    expect(cards[0]!.escalation.level).toBe('report_to_ground');
    // deep_space: 2×12+10 = 34 minutes
    expect(cards[0]!.escalation.text).toContain('34');
    expect(cards[0]!.escalation.expectedReplyMinutes).toBe(34);
  });

  // urgent severity
  it('urgent (hard_threshold) + station → urgent_now', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'hard_threshold', urgent: true };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    expect(cards[0]!.escalation.level).toBe('urgent_now');
    expect(cards[0]!.escalation.text).toBe('Contact the crew medical officer and ground now. Follow your emergency procedures.');
  });

  it('urgent (hard_threshold) + deep_space → urgent_now different text', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'hard_threshold', urgent: true };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('deep_space'));
    expect(cards[0]!.escalation.level).toBe('urgent_now');
    expect(cards[0]!.escalation.text).toContain('Do not wait for a reply');
  });
});

describe('G5: missing supply shows alternativeText', () => {
  it('when bp_cuff unavailable, first bp action shows alternativeText', () => {
    const f: Finding = { ...makePersistentFinding(), kind: 'persistent_change', indicators: ['bp_sys'], domains: ['cardiovascular'] };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const ctx: MissionContext = { ...makeCtx('station'), supplies: { ...makeCtx('station').supplies, bp_cuff: false } };
    const cards = buildAlertCards(analysis, ctx);
    const bpAction = cards[0]!.recommendedActions.find((a) => a.requiresSupply === 'bp_cuff');
    expect(bpAction).toBeDefined();
    expect(bpAction!.supplyAvailable).toBe(false);
    expect(bpAction!.alternativeText).toBeDefined();
  });
});

describe('G5: card sort order — urgent before review before watch before info', () => {
  it('sorts correctly', () => {
    const findings: Finding[] = [
      { ...makePersistentFinding({ id: 'a', kind: 'isolated_spike', firstFlaggedDay: 100 }) },
      { ...makePersistentFinding({ id: 'b', kind: 'hard_threshold', firstFlaggedDay: 100, urgent: true, indicators: ['bp_sys'], domains: ['cardiovascular'] }) },
      { ...makePersistentFinding({ id: 'c', kind: 'persistent_change', firstFlaggedDay: 100 }) },
      { ...makePersistentFinding({ id: 'd', kind: 'expected_adaptation', firstFlaggedDay: 100 }) },
    ];
    const analysis = makeBaseAnalysis({ findings });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    const severities = cards.map((c) => c.severity);
    expect(severities[0]).toBe('urgent');
    expect(severities[1]).toBe('review');
    expect(severities[2]).toBe('watch');
    expect(severities[3]).toBe('info');
  });
});

describe('G5: multi_signal_pattern merges and caps at 5 actions', () => {
  it('caps at 5 actions', () => {
    const f: Finding = {
      id: 'multi_signal_pattern:heart_rate+bp_sys+sleep_hours+mood:95',
      kind: 'multi_signal_pattern',
      domains: ['cardiovascular', 'sleep_recovery', 'behavioral'],
      indicators: ['heart_rate', 'bp_sys', 'sleep_hours', 'mood'],
      onsetDay: 85,
      firstFlaggedDay: 95,
      evidenceStrength: 'high',
      dataQualityPoor: false,
      urgent: false,
    };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    expect(cards[0]!.recommendedActions.length).toBeLessThanOrEqual(5);
  });

  it('observation includes count and labels', () => {
    const f: Finding = {
      id: 'multi_signal_pattern:heart_rate+sleep_hours:95',
      kind: 'multi_signal_pattern',
      domains: ['cardiovascular', 'sleep_recovery'],
      indicators: ['heart_rate', 'sleep_hours'],
      onsetDay: 85,
      firstFlaggedDay: 95,
      evidenceStrength: 'moderate',
      dataQualityPoor: false,
      urgent: false,
    };
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    expect(cards[0]!.observation).toContain('2 measures');
    expect(cards[0]!.observation).toContain('day 85');
  });
});

describe('G5: contract invariants 3–5', () => {
  it('every card has non-empty observation, uncertainty.statement, escalation.text, and ≥1 sourceId in SOURCES', () => {
    const f: Finding = makePersistentFinding();
    const analysis = makeBaseAnalysis({ findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('deep_space'));
    for (const card of cards) {
      expect(card.observation.length).toBeGreaterThan(0);
      expect(card.uncertainty.statement.length).toBeGreaterThan(0);
      expect(card.escalation.text.length).toBeGreaterThan(0);
      expect(card.sourceIds.length).toBeGreaterThan(0);
      for (const sid of card.sourceIds) {
        expect(SOURCES[sid], `source ${sid} not in SOURCES`).toBeDefined();
      }
    }
  });

  it('no action with supplyAvailable=false lacks alternativeText (invariant 4)', () => {
    const f: Finding = makePersistentFinding({ indicators: ['bp_sys'], domains: ['cardiovascular'] });
    const analysis = makeBaseAnalysis({ findings: [f] });
    const ctx: MissionContext = { ...makeCtx('station'), supplies: { ...makeCtx('station').supplies, bp_cuff: false } };
    const cards = buildAlertCards(analysis, ctx);
    for (const card of cards) {
      for (const action of card.recommendedActions) {
        if (!action.supplyAvailable) {
          expect(action.alternativeText, `action ${action.id} has supplyAvailable=false but no alternativeText`).toBeDefined();
        }
      }
    }
  });

  it('no forbidden words in any card text (invariant 5)', () => {
    const findings: Finding[] = [
      makePersistentFinding(),
      makePersistentFinding({ id: 'x', kind: 'isolated_spike', firstFlaggedDay: 90 }),
    ];
    const analysis = makeBaseAnalysis({ findings });
    const cards = buildAlertCards(analysis, makeCtx('deep_space'));
    const FORBIDDEN = ['diagnos', 'you have', 'disease', 'cancer', 'depression', 'anxiety disorder'];
    for (const card of cards) {
      const allText = [
        card.observation,
        card.uncertainty.statement,
        card.escalation.text,
        card.title,
        ...card.recommendedActions.map((a) => a.text + (a.alternativeText ?? '')),
        ...card.evidence.map((e) => e.text),
        ...card.uncertainty.missingInfo,
        ...card.nextMeasurements,
      ].join(' ').toLowerCase();
      for (const word of FORBIDDEN) {
        expect(allText, `"${word}" found in card`).not.toContain(word);
      }
    }
  });
});

describe('G5: card determinism', () => {
  it('calling buildAlertCards twice gives identical card ids', () => {
    const f: Finding = makePersistentFinding();
    const analysis = makeBaseAnalysis({ findings: [f] });
    const ctx = makeCtx('deep_space');
    const cards1 = buildAlertCards(analysis, ctx);
    const cards2 = buildAlertCards(analysis, ctx);
    expect(cards1.map((c) => c.id)).toEqual(cards2.map((c) => c.id));
  });
});

describe('G5: early_signal cards for watch-status indicators', () => {
  it('watch indicator not covered by a finding produces an early_signal card', () => {
    const indicators = makeAllIndicators({
      heart_rate: { status: 'watch', onsetDay: 100 },
    });
    const analysis = makeBaseAnalysis({ indicators, findings: [] });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    expect(cards.some((c) => c.kind === 'early_signal' && c.indicators.includes('heart_rate'))).toBe(true);
  });

  it('watch indicator covered by a finding does NOT produce an early_signal card', () => {
    const indicators = makeAllIndicators({
      heart_rate: { status: 'flagged', onsetDay: 85 },
    });
    const f: Finding = makePersistentFinding();
    const analysis = makeBaseAnalysis({ indicators, findings: [f] });
    const cards = buildAlertCards(analysis, makeCtx('station'));
    // Should have exactly 1 card (the finding), no duplicate early_signal.
    expect(cards.filter((c) => c.kind === 'early_signal' && c.indicators.includes('heart_rate'))).toHaveLength(0);
  });
});

