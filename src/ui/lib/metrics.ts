import type {
  AnalysisResult,
  IndicatorAnalysis,
  IndicatorId,
  IndicatorMeta,
  ResultsFile,
  ScenarioResult,
  SeverityLevel,
  SystemId,
} from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';

export interface MetricSnapshot {
  id: IndicatorId;
  meta: IndicatorMeta;
  latest: number | null;
  baseline: number | null;
  delta: number | null;
  deltaPercent: number | null;
  status: IndicatorAnalysis['status'];
  points: Array<{ day: number; value: number | null }>;
  recent: number[];
  lastDay: number | null;
  secondary?: { label: string; value: number | null; unit: string };
}

export function metricSnapshot(
  analysis: AnalysisResult,
  id: IndicatorId,
  options: { secondaryId?: IndicatorId; days?: number } = {},
): MetricSnapshot {
  const meta = INDICATORS.find((candidate) => candidate.id === id) ?? INDICATORS[0]!;
  const indicator = analysis.indicators[id];
  const baseline = analysis.baselines[id]?.median ?? null;
  const points = (indicator?.points ?? []).map((point) => ({ day: point.day, value: point.value }));
  const values = points
    .map((point) => point.value)
    .filter((value): value is number => typeof value === 'number');
  const recent = values.slice(-(options.days ?? 14));
  const latest = indicator?.lastValue ?? values[values.length - 1] ?? null;
  const lastPoint = [...points].reverse().find((point) => typeof point.value === 'number');
  const delta = latest !== null && baseline !== null ? latest - baseline : null;
  const deltaPercent =
    delta !== null && baseline !== null && baseline !== 0 ? (delta / baseline) * 100 : null;

  let secondary: MetricSnapshot['secondary'];
  if (options.secondaryId) {
    const secondaryMeta = INDICATORS.find((candidate) => candidate.id === options.secondaryId);
    const secondaryValue = analysis.indicators[options.secondaryId]?.lastValue ?? null;
    if (secondaryMeta) {
      secondary = {
        label: secondaryMeta.label,
        value: secondaryValue,
        unit: secondaryMeta.unit,
      };
    }
  }

  return {
    id,
    meta,
    latest,
    baseline,
    delta,
    deltaPercent,
    status: indicator?.status ?? 'ok',
    points,
    recent,
    lastDay: lastPoint?.day ?? null,
    secondary,
  };
}

export function formatWithUnit(meta: IndicatorMeta, value: number | null): string {
  if (value === null) return '—';
  const text = value.toFixed(meta.decimals);
  return meta.unit.startsWith('score') ? text : `${text} ${meta.unit}`;
}

export function statusLabel(status: IndicatorAnalysis['status']): string {
  if (status === 'flagged') return 'Review';
  if (status === 'watch') return 'Watch';
  return 'Steady';
}

export function statusTone(status: IndicatorAnalysis['status']): 'ok' | 'watch' | 'review' {
  if (status === 'flagged') return 'review';
  if (status === 'watch') return 'watch';
  return 'ok';
}

export const SEVERITY_RANK: Record<SeverityLevel, number> = {
  urgent: 4,
  review: 3,
  watch: 2,
  info: 1,
};

export function severityLabel(severity: SeverityLevel): string {
  if (severity === 'urgent') return 'Urgent';
  if (severity === 'review') return 'Review';
  if (severity === 'watch') return 'Watch';
  return 'Expected';
}

export interface TimelineSeries {
  id: IndicatorId;
  label: string;
  color: string;
  unit: string;
  decimals: number;
}

export const TIMELINE_SERIES: Record<string, TimelineSeries> = {
  heart_rate: { id: 'heart_rate', label: 'Heart rate', color: 'var(--chart-hr)', unit: 'bpm', decimals: 0 },
  bp_sys: { id: 'bp_sys', label: 'Systolic BP', color: 'var(--chart-bp)', unit: 'mmHg', decimals: 0 },
  sleep_hours: { id: 'sleep_hours', label: 'Sleep', color: 'var(--chart-sleep)', unit: 'hrs', decimals: 1 },
  stress: { id: 'stress', label: 'Stress', color: 'var(--chart-stress)', unit: 'score', decimals: 1 },
  body_temp: { id: 'body_temp', label: 'Temperature', color: 'var(--chart-temp)', unit: '°C', decimals: 1 },
};

export interface TimelinePoint {
  day: number;
  [key: string]: number | null;
}

export function buildTimelineData(
  analysis: AnalysisResult,
  ids: IndicatorId[],
  days: number,
): TimelinePoint[] {
  const start = Math.max(1, analysis.upToDay - days + 1);
  const byDay = new Map<number, TimelinePoint>();
  for (let day = start; day <= analysis.upToDay; day += 1) {
    byDay.set(day, { day });
  }
  for (const id of ids) {
    for (const point of analysis.indicators[id]?.points ?? []) {
      if (point.day < start) continue;
      const row = byDay.get(point.day);
      if (row) row[id] = point.value;
    }
  }
  return [...byDay.values()];
}

export interface ResultsAggregate {
  system: SystemId;
  detectionRate: number;
  detected: number;
  events: number;
  weightedDelay: number | null;
  falseAlarmsPer100Days: number;
  falseEpisodes: number;
  scenarioCount: number;
}

export function aggregateResults(results: ResultsFile): ResultsAggregate[] {
  const systems: SystemId[] = ['vigil', 'threshold', 'zscore'];
  return systems.map((system) => {
    let detected = 0;
    let events = 0;
    let falseEpisodes = 0;
    let falseRateSum = 0;
    let delayWeighted = 0;
    let delayWeight = 0;

    for (const scenario of results.scenarios) {
      const metrics = scenario.systems[system];
      if (!metrics) continue;
      detected += metrics.detectedCount;
      events += metrics.eventCount;
      falseEpisodes += metrics.falseEpisodes;
      falseRateSum += metrics.falseAlarmsPer100Days;
      if (metrics.medianDelayDays !== null && metrics.detectedCount > 0) {
        delayWeighted += metrics.medianDelayDays * metrics.detectedCount;
        delayWeight += metrics.detectedCount;
      }
    }

    return {
      system,
      detectionRate: events > 0 ? detected / events : 0,
      detected,
      events,
      weightedDelay: delayWeight > 0 ? delayWeighted / delayWeight : null,
      falseAlarmsPer100Days:
        results.scenarios.length > 0 ? falseRateSum / results.scenarios.length : 0,
      falseEpisodes,
      scenarioCount: results.scenarios.length,
    };
  });
}

export function bestScenarioSystem(scenario: ScenarioResult): SystemId {
  const systems: SystemId[] = ['vigil', 'threshold', 'zscore'];
  let best: SystemId = 'vigil';
  let bestScore = Number.POSITIVE_INFINITY;
  for (const system of systems) {
    const metrics = scenario.systems[system];
    if (!metrics) continue;
    const delay = metrics.medianDelayDays ?? 999;
    const score = delay + metrics.falseAlarmsPer100Days * 2;
    if (score < bestScore) {
      bestScore = score;
      best = system;
    }
  }
  return best;
}
