import type {
  AnalysisResult,
  IndicatorAnalysis,
  DomainAnalysis,
  Baseline,
  IndicatorId,
  DomainId,
  IndicatorPoint,
} from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';

function makePoints(id: IndicatorId, upToDay: number): IndicatorPoint[] {
  const points: IndicatorPoint[] = [];
  const meta = INDICATORS.find((i) => i.id === id);
  const baselineVal = id === 'heart_rate' ? 64 : id === 'bp_sys' ? 116 : id === 'sleep_hours' ? 6.8 : id === 'mood' ? 3.8 : 36.6;

  for (let d = 1; d <= upToDay; d++) {
    const isDrift = d >= 70;
    const progress = isDrift ? Math.min(1, (d - 70) / 40) : 0;
    let val = baselineVal;
    if (id === 'heart_rate') val = 64 + 9 * progress;
    if (id === 'bp_sys') val = 116 + 8 * progress;
    if (id === 'sleep_hours') val = 6.8 - 1.2 * progress;
    if (id === 'mood') val = 3.8 - 0.9 * progress;

    const dec = meta?.decimals ?? 1;
    const roundedVal = Number(val.toFixed(dec));
    const z = isDrift ? Number((progress * 2.5).toFixed(2)) : 0;

    points.push({
      day: d,
      value: roundedVal,
      expected: baselineVal,
      z,
    });
  }
  return points;
}

const baselines: Partial<Record<IndicatorId, Baseline>> = {
  heart_rate: { indicatorId: 'heart_rate', median: 64, sigma: 2.5, n: 30 },
  bp_sys: { indicatorId: 'bp_sys', median: 116, sigma: 4.0, n: 30 },
  bp_dia: { indicatorId: 'bp_dia', median: 74, sigma: 3.0, n: 30 },
  body_temp: { indicatorId: 'body_temp', median: 36.6, sigma: 0.15, n: 30 },
  glucose: { indicatorId: 'glucose', median: 90, sigma: 5.0, n: 30 },
  sleep_hours: { indicatorId: 'sleep_hours', median: 6.8, sigma: 0.6, n: 30 },
  exercise_minutes: { indicatorId: 'exercise_minutes', median: 120, sigma: 15, n: 30 },
  mood: { indicatorId: 'mood', median: 3.8, sigma: 0.4, n: 30 },
  stress: { indicatorId: 'stress', median: 2.2, sigma: 0.4, n: 30 },
  energy: { indicatorId: 'energy', median: 3.7, sigma: 0.4, n: 30 },
  radiation_dose: { indicatorId: 'radiation_dose', median: 1.8, sigma: 0, n: 30 },
};

const indicators: Record<IndicatorId, IndicatorAnalysis> = {
  heart_rate: {
    indicatorId: 'heart_rate',
    status: 'flagged',
    cusumUp: 8.4,
    cusumDown: 0,
    onsetDay: 70,
    persistent: true,
    lastValue: 73,
    lastZ: 3.6,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('heart_rate', 120),
  },
  bp_sys: {
    indicatorId: 'bp_sys',
    status: 'flagged',
    cusumUp: 7.2,
    cusumDown: 0,
    onsetDay: 72,
    persistent: true,
    lastValue: 124,
    lastZ: 2.0,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('bp_sys', 120),
  },
  bp_dia: {
    indicatorId: 'bp_dia',
    status: 'watch',
    cusumUp: 4.1,
    cusumDown: 0,
    onsetDay: 75,
    persistent: true,
    lastValue: 79,
    lastZ: 1.67,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('bp_dia', 120),
  },
  body_temp: {
    indicatorId: 'body_temp',
    status: 'ok',
    cusumUp: 0,
    cusumDown: 0,
    onsetDay: null,
    persistent: false,
    lastValue: 36.6,
    lastZ: 0,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('body_temp', 120),
  },
  glucose: {
    indicatorId: 'glucose',
    status: 'ok',
    cusumUp: 0,
    cusumDown: 0,
    onsetDay: null,
    persistent: false,
    lastValue: 90,
    lastZ: 0,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('glucose', 120),
  },
  sleep_hours: {
    indicatorId: 'sleep_hours',
    status: 'watch',
    cusumUp: 0,
    cusumDown: 4.8,
    onsetDay: 74,
    persistent: true,
    lastValue: 5.6,
    lastZ: -2.0,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('sleep_hours', 120),
  },
  exercise_minutes: {
    indicatorId: 'exercise_minutes',
    status: 'ok',
    cusumUp: 0,
    cusumDown: 2.1,
    onsetDay: null,
    persistent: false,
    lastValue: 95,
    lastZ: -1.67,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('exercise_minutes', 120),
  },
  mood: {
    indicatorId: 'mood',
    status: 'flagged',
    cusumUp: 0,
    cusumDown: 7.5,
    onsetDay: 75,
    persistent: true,
    lastValue: 2.9,
    lastZ: -2.25,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('mood', 120),
  },
  stress: {
    indicatorId: 'stress',
    status: 'watch',
    cusumUp: 4.5,
    cusumDown: 0,
    onsetDay: 76,
    persistent: true,
    lastValue: 3.1,
    lastZ: 2.25,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('stress', 120),
  },
  energy: {
    indicatorId: 'energy',
    status: 'watch',
    cusumUp: 0,
    cusumDown: 4.2,
    onsetDay: 78,
    persistent: true,
    lastValue: 3.0,
    lastZ: -1.75,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('energy', 120),
  },
  radiation_dose: {
    indicatorId: 'radiation_dose',
    status: 'ok',
    cusumUp: 0,
    cusumDown: 0,
    onsetDay: null,
    persistent: false,
    lastValue: 1.8,
    lastZ: 0,
    missingFractionLast7: 0,
    dataQuality: 'good',
    isolatedSpike: false,
    adaptationNote: false,
    points: makePoints('radiation_dose', 120),
  },
};

const domains: Record<DomainId, DomainAnalysis> = {
  cardiovascular: {
    domain: 'cardiovascular',
    status: 'flagged',
    indicators: ['heart_rate', 'bp_sys', 'bp_dia'],
  },
  sleep_recovery: {
    domain: 'sleep_recovery',
    status: 'watch',
    indicators: ['sleep_hours'],
  },
  physical_performance: {
    domain: 'physical_performance',
    status: 'ok',
    indicators: ['exercise_minutes'],
  },
  behavioral: {
    domain: 'behavioral',
    status: 'flagged',
    indicators: ['mood', 'stress', 'energy'],
  },
  metabolic_general: {
    domain: 'metabolic_general',
    status: 'ok',
    indicators: ['body_temp', 'glucose'],
  },
  radiation: {
    domain: 'radiation',
    status: 'ok',
    indicators: ['radiation_dose'],
  },
};

export const mockAnalysis: AnalysisResult = {
  crewId: 'crew-1',
  upToDay: 120,
  baselineReady: true,
  baselines,
  indicators,
  domains,
  findings: [
    {
      id: 'multi_signal_pattern:heart_rate+bp_sys+sleep_hours+mood:95',
      kind: 'multi_signal_pattern',
      domains: ['cardiovascular', 'sleep_recovery', 'behavioral'],
      indicators: ['heart_rate', 'bp_sys', 'sleep_hours', 'mood'],
      onsetDay: 70,
      firstFlaggedDay: 95,
      evidenceStrength: 'high',
      dataQualityPoor: false,
      urgent: false,
    },
  ],
};

