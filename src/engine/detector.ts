import type {
  AnalysisResult, Baseline, CrewDataset, DailyRecord, DomainAnalysis, DomainId,
  EvidenceStrength, Finding, FindingKind, IndicatorAnalysis, IndicatorId,
  IndicatorMeta, IndicatorPoint, IndicatorStatus,
} from '@/contracts/types';
import { DOMAIN_ORDER, INDICATORS, getIndicator } from '@/contracts/indicators';
import type { DetectorConfig } from './detectorConfig';
import {
  ADAPTATION_DELTA_Z, ADAPTATION_MIN_DAY, DETECTOR_CONFIG, RADIATION_WINDOW_DAYS,
  RECENT_VALUE_WINDOW_DAYS, SPIKE_PRIOR_DAYS, SPIKE_PRIOR_Z, URGENT_BP_DIA,
  URGENT_BP_SYS, URGENT_GLUCOSE_LOW,
} from './detectorConfig';
import { PHASE_MAX_OFFSET, RADIATION_RATES, phaseOffset } from './simulator';

interface SeriesState {
  meta: IndicatorMeta;
  baseline: Baseline | null;
  points: IndicatorPoint[];
  statuses: IndicatorStatus[];
  cusumUp: number[];
  cusumDown: number[];
  onsets: (number | null)[];
  persistent: boolean[];
  lastValue: (number | null)[];
  lastZ: (number | null)[];
  missingFraction: number[];
  quality: ('good' | 'poor')[];
  spike: boolean[];
  adaptation: boolean[];
}

interface ActiveFinding {
  key: string;
  kind: FindingKind;
  indicators: IndicatorId[];
  onsetDay: number | null;
  dataQualityPoor: boolean;
}

export interface DetectorPass {
  upToDay: number;
  baselineReady: boolean;
  baselines: Partial<Record<IndicatorId, Baseline>>;
  series: Record<IndicatorId, SeriesState>;
  dayFindings: Finding[][];
}

const SERIOUS_FINDING_KINDS = new Set<FindingKind>([
  'persistent_change', 'multi_signal_pattern', 'radiation_event', 'hard_threshold',
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const lower = sorted[mid - 1] ?? 0;
    const upper = sorted[mid] ?? 0;
    return (lower + upper) / 2;
  }
  return sorted[mid] ?? 0;
}

function indicatorRecord<T>(build: (meta: IndicatorMeta) => T): Record<IndicatorId, T> {
  const out = {} as Record<IndicatorId, T>;
  for (const meta of INDICATORS) out[meta.id] = build(meta);
  return out;
}

function computeBaseline(recordsByDay: Map<number, DailyRecord>, meta: IndicatorMeta): Baseline | null {
  const values: number[] = [];
  for (const record of recordsByDay.values()) {
    if (record.day > 0) continue;
    const value = record.values[meta.id];
    if (typeof value === 'number') values.push(value);
  }
  if (values.length === 0) return null;
  const med = median(values);
  const deviation = median(values.map((value) => Math.abs(value - med)));
  return {
    indicatorId: meta.id,
    median: med,
    sigma: Math.max(1.4826 * deviation, meta.minSigma),
    n: values.length,
  };
}

function isPersistent(
  zs: (number | null)[],
  day: number,
  direction: IndicatorMeta['concernDirection'],
  config: DetectorConfig,
): boolean {
  const start = Math.max(1, day - config.persistWindow + 1);
  let observed = 0;
  const qualifying: number[] = [];
  for (let d = start; d <= day; d++) {
    const z = zs[d - 1];
    if (z === null || z === undefined) continue;
    observed++;
    if (direction === 'up' && z >= config.persistZ) qualifying.push(z);
    else if (direction === 'down' && z <= -config.persistZ) qualifying.push(z);
    else if (direction === 'both' && Math.abs(z) >= config.persistZ) qualifying.push(z);
  }
  if (observed < config.persistMinObserved) return false;
  if (qualifying.length < config.persistMinDays) return false;
  if (direction === 'both') {
    const hasPositive = qualifying.some((z) => z > 0);
    const hasNegative = qualifying.some((z) => z < 0);
    if (hasPositive && hasNegative) return false;
  }
  return true;
}

function detectSpike(
  zs: (number | null)[],
  day: number,
  persistent: boolean,
  config: DetectorConfig,
): boolean {
  let spikeIndex = -1;
  for (let d = day; d >= Math.max(1, day - 1); d--) {
    const z = zs[d - 1];
    if (z !== null && z !== undefined) { spikeIndex = d - 1; break; }
  }
  if (spikeIndex < 0) return false;
  const spikeZ = zs[spikeIndex];
  if (spikeZ === null || spikeZ === undefined || Math.abs(spikeZ) <= config.spikeZ) return false;
  let checked = 0;
  for (let i = spikeIndex - 1; i >= 0 && checked < SPIKE_PRIOR_DAYS; i--) {
    const prior = zs[i];
    if (prior === null || prior === undefined) continue;
    checked++;
    if (Math.abs(prior) > SPIKE_PRIOR_Z) return false;
  }
  return !persistent;
}

function missingFraction(
  recordsByDay: Map<number, DailyRecord>,
  indicatorId: IndicatorId,
  day: number,
  window: number,
): number {
  let missing = 0;
  for (let d = day; d >= Math.max(1, day - window + 1); d--) {
    const value = recordsByDay.get(d)?.values[indicatorId];
    if (typeof value !== 'number') missing++;
  }
  return missing / window;
}

function buildCusumSeries(
  meta: IndicatorMeta,
  baseline: Baseline | null,
  recordsByDay: Map<number, DailyRecord>,
  endDay: number,
  config: DetectorConfig,
): SeriesState {
  const points: IndicatorPoint[] = [];
  const statuses: IndicatorStatus[] = [];
  const cusumUpValues: number[] = [];
  const cusumDownValues: number[] = [];
  const onsets: (number | null)[] = [];
  const persistent: boolean[] = [];
  const lastValues: (number | null)[] = [];
  const lastZs: (number | null)[] = [];
  const missingFractions: number[] = [];
  const quality: ('good' | 'poor')[] = [];
  const spike: boolean[] = [];
  const adaptation: boolean[] = [];

  if (baseline === null) {
    for (let day = 1; day <= endDay; day++) {
      statuses.push('ok');
      cusumUpValues.push(0);
      cusumDownValues.push(0);
      onsets.push(null);
      persistent.push(false);
      lastValues.push(null);
      lastZs.push(null);
      missingFractions.push(missingFraction(recordsByDay, meta.id, day, config.persistWindow));
      quality.push(missingFractions[missingFractions.length - 1]! > config.poorQualityMissingFraction ? 'poor' : 'good');
      spike.push(false);
      adaptation.push(false);
    }
    return {
      meta, baseline, points, statuses, cusumUp: cusumUpValues, cusumDown: cusumDownValues,
      onsets, persistent, lastValue: lastValues, lastZ: lastZs, missingFraction: missingFractions,
      quality, spike, adaptation,
    };
  }

  const zs: (number | null)[] = [];
  let cusumUp = 0;
  let cusumDown = 0;
  let lastZeroUp = 0;
  let lastZeroDown = 0;
  let lastValue: number | null = null;
  let lastZ: number | null = null;
  let lastObservedDay: number | null = null;

  for (let day = 1; day <= endDay; day++) {
    const raw = recordsByDay.get(day)?.values[meta.id];
    const value = typeof raw === 'number' ? raw : null;
    const expected = baseline.median + phaseOffset(meta.id, day);
    const z = value === null ? null : (value - expected) / baseline.sigma;
    zs.push(z);
    points.push({ day, value, expected, z });

    if (value !== null) {
      lastValue = value;
      lastZ = z;
      lastObservedDay = day;
    }

    if (z !== null) {
      const zc = clamp(z, -config.zClamp, config.zClamp);
      cusumUp = Math.max(0, cusumUp + zc - config.cusumK);
      cusumDown = Math.max(0, cusumDown - zc - config.cusumK);
    }
    if (cusumUp === 0) lastZeroUp = day;
    if (cusumDown === 0) lastZeroDown = day;

    let usedCusum: number;
    let onset: number | null;
    if (meta.concernDirection === 'up') {
      usedCusum = cusumUp;
      onset = lastZeroUp + 1;
    } else if (meta.concernDirection === 'down') {
      usedCusum = cusumDown;
      onset = lastZeroDown + 1;
    } else if (cusumUp >= cusumDown) {
      usedCusum = cusumUp;
      onset = lastZeroUp + 1;
    } else {
      usedCusum = cusumDown;
      onset = lastZeroDown + 1;
    }
    if (usedCusum === 0) onset = null;

    const persistentValue = isPersistent(zs, day, meta.concernDirection, config);
    const status: IndicatorStatus =
      usedCusum >= config.hFlag && persistentValue ? 'flagged'
        : usedCusum >= config.hWatch ? 'watch'
          : 'ok';
    const missing = missingFraction(recordsByDay, meta.id, day, config.persistWindow);
    const spikeValue = detectSpike(zs, day, persistentValue, config);
    const adaptationValue =
      lastObservedDay !== null &&
      lastObservedDay <= ADAPTATION_MIN_DAY &&
      (PHASE_MAX_OFFSET[meta.id] ?? 0) !== 0 &&
      lastValue !== null &&
      lastZ !== null &&
      Math.abs((lastValue - baseline.median) / baseline.sigma) >= ADAPTATION_DELTA_Z &&
      Math.abs(lastZ) < ADAPTATION_DELTA_Z;

    statuses.push(status);
    cusumUpValues.push(cusumUp);
    cusumDownValues.push(cusumDown);
    onsets.push(onset);
    persistent.push(persistentValue);
    lastValues.push(lastValue);
    lastZs.push(lastZ);
    missingFractions.push(missing);
    quality.push(missing > config.poorQualityMissingFraction ? 'poor' : 'good');
    spike.push(spikeValue);
    adaptation.push(adaptationValue);
  }

  return {
    meta, baseline, points, statuses, cusumUp: cusumUpValues, cusumDown: cusumDownValues,
    onsets, persistent, lastValue: lastValues, lastZ: lastZs, missingFraction: missingFractions,
    quality, spike, adaptation,
  };
}

function buildRadiationSeries(
  dataset: CrewDataset,
  recordsByDay: Map<number, DailyRecord>,
  endDay: number,
  config: DetectorConfig,
): SeriesState {
  const meta = getIndicator('radiation_dose');
  const expected = RADIATION_RATES[dataset.missionSetting];
  const points: IndicatorPoint[] = [];
  const statuses: IndicatorStatus[] = [];
  const onsets: (number | null)[] = [];
  const persistent: boolean[] = [];
  const lastValues: (number | null)[] = [];
  const missingFractions: number[] = [];
  const quality: ('good' | 'poor')[] = [];
  let runStart: number | null = null;
  let previousFlagged = false;
  let lastValue: number | null = null;

  for (let day = 1; day <= endDay; day++) {
    const raw = recordsByDay.get(day)?.values[meta.id];
    const value = typeof raw === 'number' ? raw : null;
    if (value !== null) lastValue = value;
    points.push({ day, value, expected, z: null });

    let flagged = false;
    let watch = false;
    for (let d = day; d >= Math.max(1, day - RADIATION_WINDOW_DAYS + 1); d--) {
      const windowValue = recordsByDay.get(d)?.values[meta.id];
      if (typeof windowValue !== 'number') continue;
      const ratio = windowValue / expected;
      if (ratio > config.radiationFlagRatio) flagged = true;
      else if (ratio > config.radiationWatchRatio) watch = true;
    }
    const status: IndicatorStatus = flagged ? 'flagged' : watch ? 'watch' : 'ok';
    if (flagged) {
      if (!previousFlagged) runStart = day;
    } else {
      runStart = null;
    }
    previousFlagged = flagged;

    const missing = missingFraction(recordsByDay, meta.id, day, config.persistWindow);
    statuses.push(status);
    onsets.push(runStart);
    persistent.push(false);
    lastValues.push(lastValue);
    missingFractions.push(missing);
    quality.push(missing > config.poorQualityMissingFraction ? 'poor' : 'good');
  }

  return {
    meta,
    baseline: null,
    points,
    statuses,
    cusumUp: statuses.map(() => 0),
    cusumDown: statuses.map(() => 0),
    onsets,
    persistent,
    lastValue: lastValues,
    lastZ: statuses.map(() => null),
    missingFraction: missingFractions,
    quality,
    spike: statuses.map(() => false),
    adaptation: statuses.map(() => false),
  };
}

function latestObserved(
  recordsByDay: Map<number, DailyRecord>,
  indicatorId: IndicatorId,
  day: number,
): number | null {
  for (let d = day; d >= Math.max(1, day - RECENT_VALUE_WINDOW_DAYS + 1); d--) {
    const value = recordsByDay.get(d)?.values[indicatorId];
    if (typeof value === 'number') return value;
  }
  return null;
}

function domainsOf(indicators: IndicatorId[]): DomainId[] {
  const domains = new Set<DomainId>();
  for (const id of indicators) {
    const meta = INDICATORS.find((candidate) => candidate.id === id);
    if (meta) domains.add(meta.domain);
  }
  return DOMAIN_ORDER.filter((domain) => domains.has(domain));
}

function strengthOf(count: number, dataQualityPoor: boolean): EvidenceStrength {
  const base: EvidenceStrength = count >= 3 ? 'high' : count === 2 ? 'moderate' : 'low';
  if (!dataQualityPoor) return base;
  return base === 'high' ? 'moderate' : 'low';
}

function collectActiveFindings(
  day: number,
  series: Record<IndicatorId, SeriesState>,
  recordsByDay: Map<number, DailyRecord>,
  config: DetectorConfig,
): ActiveFinding[] {
  const idx = day - 1;
  const items: ActiveFinding[] = [];

  for (const meta of INDICATORS) {
    if (meta.method !== 'cusum') continue;
    const state = series[meta.id];
    if (state.statuses[idx] === 'flagged') {
      items.push({
        key: `persistent_change:${meta.id}`,
        kind: 'persistent_change',
        indicators: [meta.id],
        onsetDay: state.onsets[idx] ?? null,
        dataQualityPoor: state.quality[idx] === 'poor',
      });
    }
  }

  const candidates: { id: IndicatorId; domain: DomainId; onset: number }[] = [];
  for (const meta of INDICATORS) {
    if (meta.method !== 'cusum') continue;
    const state = series[meta.id];
    const onset = state.onsets[idx] ?? null;
    if (state.statuses[idx] !== 'ok' && state.persistent[idx] === true && onset !== null) {
      candidates.push({ id: meta.id, domain: meta.domain, onset });
    }
  }
  if (candidates.length >= 2) {
    candidates.sort((a, b) => a.onset - b.onset || a.id.localeCompare(b.id));
    const earliest = candidates[0];
    if (earliest !== undefined) {
      const members = candidates.filter((candidate) => candidate.onset - earliest.onset <= config.patternOnsetGap);
      const domains = new Set(members.map((member) => member.domain));
      if (members.length >= 2 && domains.size >= 2) {
        const indicatorIds = INDICATORS
          .filter((meta) => members.some((member) => member.id === meta.id))
          .map((meta) => meta.id);
        items.push({
          key: 'multi_signal_pattern',
          kind: 'multi_signal_pattern',
          indicators: indicatorIds,
          onsetDay: earliest.onset,
          dataQualityPoor: indicatorIds.some((id) => series[id].quality[idx] === 'poor'),
        });
      }
    }
  }

  const radiation = series.radiation_dose;
  if (radiation.statuses[idx] === 'flagged') {
    items.push({
      key: 'radiation_event',
      kind: 'radiation_event',
      indicators: ['radiation_dose'],
      onsetDay: radiation.onsets[idx] ?? null,
      dataQualityPoor: radiation.quality[idx] === 'poor',
    });
  }

  const urgentIndicators: IndicatorId[] = [];
  const bpSys = latestObserved(recordsByDay, 'bp_sys', day);
  if (bpSys !== null && bpSys >= URGENT_BP_SYS) urgentIndicators.push('bp_sys');
  const bpDia = latestObserved(recordsByDay, 'bp_dia', day);
  if (bpDia !== null && bpDia >= URGENT_BP_DIA) urgentIndicators.push('bp_dia');
  const glucose = latestObserved(recordsByDay, 'glucose', day);
  if (glucose !== null && glucose < URGENT_GLUCOSE_LOW) urgentIndicators.push('glucose');
  if (urgentIndicators.length > 0) {
    items.push({
      key: `hard_threshold:${urgentIndicators.join('+')}`,
      kind: 'hard_threshold',
      indicators: urgentIndicators,
      onsetDay: day,
      dataQualityPoor: urgentIndicators.some((id) => series[id].quality[idx] === 'poor'),
    });
  }

  for (const meta of INDICATORS) {
    if (meta.method !== 'cusum') continue;
    const state = series[meta.id];
    if (state.spike[idx] === true) {
      items.push({
        key: `isolated_spike:${meta.id}`,
        kind: 'isolated_spike',
        indicators: [meta.id],
        onsetDay: day,
        dataQualityPoor: state.quality[idx] === 'poor',
      });
    }
  }

  for (const meta of INDICATORS) {
    const state = series[meta.id];
    if (state.quality[idx] === 'poor') {
      items.push({
        key: `data_quality_issue:${meta.id}`,
        kind: 'data_quality_issue',
        indicators: [meta.id],
        onsetDay: day,
        dataQualityPoor: true,
      });
    }
  }

  for (const meta of INDICATORS) {
    if (meta.method !== 'cusum') continue;
    const state = series[meta.id];
    if (state.adaptation[idx] === true) {
      items.push({
        key: `expected_adaptation:${meta.id}`,
        kind: 'expected_adaptation',
        indicators: [meta.id],
        onsetDay: day,
        dataQualityPoor: state.quality[idx] === 'poor',
      });
    }
  }

  return items;
}

export function runPass(
  dataset: CrewDataset,
  upToDay: number,
  config: DetectorConfig = DETECTOR_CONFIG,
): DetectorPass {
  const endDay = Math.max(0, Math.min(upToDay, dataset.missionDays));
  const recordsByDay = new Map<number, DailyRecord>();
  for (const record of dataset.records) recordsByDay.set(record.day, record);

  const baselines: Partial<Record<IndicatorId, Baseline>> = {};
  for (const meta of INDICATORS) {
    if (meta.method !== 'cusum') continue;
    const baseline = computeBaseline(recordsByDay, meta);
    if (baseline !== null) baselines[meta.id] = baseline;
  }
  const baselineReady = INDICATORS
    .filter((meta) => meta.method === 'cusum')
    .every((meta) => (baselines[meta.id]?.n ?? 0) >= config.baselineMinN);

  const series = indicatorRecord((meta) => (
    meta.method === 'rule'
      ? buildRadiationSeries(dataset, recordsByDay, endDay, config)
      : buildCusumSeries(meta, baselines[meta.id] ?? null, recordsByDay, endDay, config)
  ));

  const dayFindings: Finding[][] = [];
  if (!baselineReady) {
    for (const meta of INDICATORS) series[meta.id].statuses.fill('ok');
    for (let day = 1; day <= endDay; day++) dayFindings.push([]);
    return { upToDay: endDay, baselineReady, baselines, series, dayFindings };
  }

  const tracked = new Map<string, { lastDay: number; firstFlaggedDay: number }>();
  for (let day = 1; day <= endDay; day++) {
    const active = collectActiveFindings(day, series, recordsByDay, config);
    const findings: Finding[] = [];
    for (const item of active) {
      const previous = tracked.get(item.key);
      const firstFlaggedDay =
        previous !== undefined && previous.lastDay === day - 1 ? previous.firstFlaggedDay : day;
      tracked.set(item.key, { lastDay: day, firstFlaggedDay });
      findings.push({
        id: `${item.kind}:${item.indicators.join('+')}:${firstFlaggedDay}`,
        kind: item.kind,
        domains: domainsOf(item.indicators),
        indicators: item.indicators,
        onsetDay: item.onsetDay,
        firstFlaggedDay,
        evidenceStrength: strengthOf(item.indicators.length, item.dataQualityPoor),
        dataQualityPoor: item.dataQualityPoor,
        urgent: item.kind === 'hard_threshold',
      });
    }
    dayFindings.push(findings);
  }

  return { upToDay: endDay, baselineReady, baselines, series, dayFindings };
}

function toIndicatorAnalysis(state: SeriesState, day: number): IndicatorAnalysis {
  const idx = day - 1;
  if (idx < 0 || idx >= state.statuses.length) {
    return {
      indicatorId: state.meta.id,
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
    };
  }
  return {
    indicatorId: state.meta.id,
    status: state.statuses[idx] ?? 'ok',
    cusumUp: state.cusumUp[idx] ?? 0,
    cusumDown: state.cusumDown[idx] ?? 0,
    onsetDay: state.onsets[idx] ?? null,
    persistent: state.persistent[idx] ?? false,
    lastValue: state.lastValue[idx] ?? null,
    lastZ: state.lastZ[idx] ?? null,
    missingFractionLast7: state.missingFraction[idx] ?? 0,
    dataQuality: state.quality[idx] ?? 'good',
    isolatedSpike: state.spike[idx] ?? false,
    adaptationNote: state.adaptation[idx] ?? false,
    points: state.points,
  };
}

function buildDomains(
  indicators: Record<IndicatorId, IndicatorAnalysis>,
): Record<DomainId, DomainAnalysis> {
  const out = {} as Record<DomainId, DomainAnalysis>;
  for (const domain of DOMAIN_ORDER) {
    const ids = INDICATORS.filter((meta) => meta.domain === domain).map((meta) => meta.id);
    let status: IndicatorStatus = 'ok';
    for (const id of ids) {
      const indicatorStatus = indicators[id].status;
      if (indicatorStatus === 'flagged') status = 'flagged';
      else if (indicatorStatus === 'watch' && status !== 'flagged') status = 'watch';
    }
    out[domain] = { domain, status, indicators: ids };
  }
  return out;
}

export function analyzeWithConfig(
  dataset: CrewDataset,
  upToDay: number,
  config: DetectorConfig,
): AnalysisResult {
  const pass = runPass(dataset, upToDay, config);
  const indicators = indicatorRecord((meta) => toIndicatorAnalysis(pass.series[meta.id], pass.upToDay));
  const findings = pass.upToDay > 0 ? pass.dayFindings[pass.upToDay - 1] ?? [] : [];
  return {
    crewId: dataset.crewId,
    upToDay: pass.upToDay,
    baselineReady: pass.baselineReady,
    baselines: pass.baselines,
    indicators,
    domains: buildDomains(indicators),
    findings,
  };
}

export function analyze(dataset: CrewDataset, upToDay: number): AnalysisResult {
  return analyzeWithConfig(dataset, upToDay, DETECTOR_CONFIG);
}

/** Days on which the Vigil system would flag, computed in one forward pass. */
export function computeSeriousFlagDays(
  dataset: CrewDataset,
  config: DetectorConfig = DETECTOR_CONFIG,
): boolean[] {
  const pass = runPass(dataset, dataset.missionDays, config);
  return pass.dayFindings.map((findings) => findings.some((finding) => SERIOUS_FINDING_KINDS.has(finding.kind)));
}
