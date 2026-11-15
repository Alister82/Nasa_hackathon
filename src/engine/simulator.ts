import type {
  CrewDataset, DailyRecord, GroundTruthEvent, IndicatorId, MissionSettingId,
  ScenarioConfig, ScenarioId,
} from '@/contracts/types';
import { FIRST_PREFLIGHT_DAY, MISSION_DAYS, PREFLIGHT_DAYS } from '@/contracts/constants';
import { INDICATORS } from '@/contracts/indicators';
import { applyForcedNulls, applyMissingness } from './degradation';
import { createStream, gaussian } from './rng';

/** Synthetic simulation parameters. Values are evidence-calibrated only where
 * an empiricalProfile is documented; remaining spread parameters are explicit
 * modeling assumptions, not measured astronaut distributions. */
export interface SimulationParams {
  popMean: number;
  betweenSD: number;
  withinSD: number;
  phi: number;
  clipMin: number;
  clipMax: number;
}

/** NASA OCHMO-TB-041, ISS actigraphy (Barger et al. 2014): group means/SDs.
 * SDs are published aggregate dispersion, not separated into crew and daily
 * components; the in-flight SD is used as an approximate daily-noise scale. */
export const NASA_ISS_SLEEP_PROFILE = {
  baselineMeanHours: 6.41,
  baselineAggregateSDHours: 0.65,
  prelaunchMeanHours: 5.86,
  prelaunchAggregateSDHours: 0.94,
  inflightMeanHours: 6.09,
  inflightAggregateSDHours: 0.67,
  prelaunchStartDay: -11,
} as const;

export const SIM_PARAMS: Record<IndicatorId, SimulationParams | null> = {
  heart_rate: { popMean: 64, betweenSD: 6, withinSD: 2.5, phi: 0.3, clipMin: 35, clipMax: 180 },
  bp_sys: { popMean: 116, betweenSD: 7, withinSD: 4.0, phi: 0.2, clipMin: 70, clipMax: 220 },
  bp_dia: { popMean: 74, betweenSD: 5, withinSD: 3.0, phi: 0.2, clipMin: 40, clipMax: 130 },
  body_temp: { popMean: 36.6, betweenSD: 0.15, withinSD: 0.15, phi: 0.3, clipMin: 34, clipMax: 41 },
  glucose: { popMean: 90, betweenSD: 6, withinSD: 5.0, phi: 0.2, clipMin: 40, clipMax: 400 },
  sleep_hours: { popMean: 6.41, betweenSD: 0.5, withinSD: NASA_ISS_SLEEP_PROFILE.inflightAggregateSDHours, phi: 0.3, clipMin: 2, clipMax: 10 },
  exercise_minutes: { popMean: 120, betweenSD: 10, withinSD: 15, phi: 0.2, clipMin: 0, clipMax: 240 },
  mood: { popMean: 3.8, betweenSD: 0.3, withinSD: 0.4, phi: 0.4, clipMin: 1, clipMax: 5 },
  stress: { popMean: 2.2, betweenSD: 0.3, withinSD: 0.4, phi: 0.4, clipMin: 1, clipMax: 5 },
  energy: { popMean: 3.7, betweenSD: 0.3, withinSD: 0.4, phi: 0.4, clipMin: 1, clipMax: 5 },
  radiation_dose: null,
};

/** No blanket cardiovascular adaptation is applied: NASA's small CIRCA
 * investigation found HR/BP generally not greatly changed in flight, with
 * day/night-specific exceptions that this daily-resolution model cannot
 * represent. The old generic offsets were not supported by the cited data. */
export const PHASE_MAX_OFFSET: Partial<Record<IndicatorId, number>> = {
  // NASA ISS actigraphy in-flight mean minus the baseline assessment mean.
  sleep_hours: -0.32,
};

function sleepReferenceMean(day: number): number {
  if (day < NASA_ISS_SLEEP_PROFILE.prelaunchStartDay) return NASA_ISS_SLEEP_PROFILE.baselineMeanHours;
  if (day <= 0) return NASA_ISS_SLEEP_PROFILE.prelaunchMeanHours;
  return NASA_ISS_SLEEP_PROFILE.inflightMeanHours;
}

/** Evidence-based sleep expectation; no generic cardiovascular phase curve. */
export function phaseOffset(indicatorId: IndicatorId, missionDay: number): number {
  if (missionDay < 1) return 0;
  if (indicatorId === 'sleep_hours') {
    return NASA_ISS_SLEEP_PROFILE.inflightMeanHours - NASA_ISS_SLEEP_PROFILE.baselineMeanHours;
  }
  const max = PHASE_MAX_OFFSET[indicatorId] ?? 0;
  return max * Math.max(0, (15 - missionDay) / 14);
}

export interface IndicatorEffect {
  indicatorId: IndicatorId;
  magnitude: number;
  onsetDay: number;
  endDay?: number | null;
  rampDays: number;
  recoverDays?: number;
}

/** Ramp and linear-recovery effect, ARCHITECTURE.md 6.4. */
export function effectAt(effect: IndicatorEffect, day: number): number {
  if (day < effect.onsetDay) return 0;
  const ramp = Math.min(1, Math.max(0, (day - effect.onsetDay) / effect.rampDays));
  const endDay = effect.endDay;
  if (endDay === undefined || endDay === null) return effect.magnitude * ramp;
  if (day <= endDay) return effect.magnitude * ramp;
  const recoverDays = effect.recoverDays ?? 0;
  if (recoverDays <= 0) return 0;
  const atEnd = effect.magnitude * Math.min(1, Math.max(0, (endDay - effect.onsetDay) / effect.rampDays));
  return atEnd * Math.max(0, 1 - (day - endDay) / recoverDays);
}

/** Radiation rates are illustrative (ARCHITECTURE.md 6.2 and 7.3). */
export const RADIATION_PREFLIGHT_RATE = 0.007;
export const RADIATION_PREFLIGHT_NOISE = 0.1;
export const RADIATION_MISSION_NOISE = 0.08;
export const RADIATION_RATES: Record<MissionSettingId, number> = {
  station: 0.5,
  lunar_base: 1.0,
  deep_space: 1.8,
};

export interface ScenarioDefinition {
  scenarioId: ScenarioId;
  groundTruth: GroundTruthEvent[];
  effects: IndicatorEffect[];
  radiationEvent?: { onsetDay: number; endDay: number; factor: number };
  heartRateSpike?: { day: number; offsetFromCrewBase: number };
  forcedNullDays?: number[];
  forcedNullIndicatorDays?: { indicatorId: IndicatorId; days: number[] }[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function simulateDataset(config: ScenarioConfig, definition: ScenarioDefinition): CrewDataset {
  const dayCount = MISSION_DAYS - FIRST_PREFLIGHT_DAY + 1;
  const crewBases = new Map<IndicatorId, number>();
  const valuesByIndicator = new Map<IndicatorId, (number | null)[]>();

  for (const meta of INDICATORS) {
    const params = SIM_PARAMS[meta.id];
    if (params === null) continue;

    const rng = createStream(config.seed, config.crewId, meta.id);
    const crewBase = params.popMean + gaussian(rng) * params.betweenSD;
    crewBases.set(meta.id, crewBase);
    let noise = gaussian(rng) * params.withinSD;
    const effects = definition.effects.filter((effect) => effect.indicatorId === meta.id);
    const series: number[] = [];

    for (let i = 0; i < dayCount; i++) {
      const day = FIRST_PREFLIGHT_DAY + i;
      if (i > 0) {
        noise = params.phi * noise + Math.sqrt(1 - params.phi ** 2) * params.withinSD * gaussian(rng);
      }
      const referenceShift = meta.id === 'sleep_hours'
        ? sleepReferenceMean(day) - params.popMean
        : phaseOffset(meta.id, day);
      let value = crewBase + referenceShift + noise;
      for (const effect of effects) value += effectAt(effect, day);
      series.push(roundTo(clamp(value, params.clipMin, params.clipMax), meta.decimals));
    }
    valuesByIndicator.set(meta.id, series);
  }

  const radiationRng = createStream(config.seed, config.crewId, 'radiation_dose');
  const radiationSeries: number[] = [];
  for (let i = 0; i < dayCount; i++) {
    const day = FIRST_PREFLIGHT_DAY + i;
    let rate: number;
    if (day <= 0) {
      rate = RADIATION_PREFLIGHT_RATE * (1 + gaussian(radiationRng) * RADIATION_PREFLIGHT_NOISE);
    } else {
      const event = definition.radiationEvent;
      const factor = event && day >= event.onsetDay && day <= event.endDay ? event.factor : 1;
      rate = RADIATION_RATES[config.missionSetting] * (1 + gaussian(radiationRng) * RADIATION_MISSION_NOISE) * factor;
    }
    radiationSeries.push(roundTo(Math.max(0, rate), 3));
  }
  valuesByIndicator.set('radiation_dose', radiationSeries);

  let records: DailyRecord[] = [];
  for (let i = 0; i < dayCount; i++) {
    const day = FIRST_PREFLIGHT_DAY + i;
    const values: Partial<Record<IndicatorId, number | null>> = {};
    for (const meta of INDICATORS) {
      values[meta.id] = valuesByIndicator.get(meta.id)?.[i] ?? null;
    }
    records.push({ day, values });
  }

  const missingStream = createStream(config.seed, config.crewId, 'missing');
  records = applyMissingness(records, missingStream, (id) => (id === 'radiation_dose' ? 0.01 : 0.02));

  if (definition.forcedNullDays) records = applyForcedNulls(records, definition.forcedNullDays);
  for (const spec of definition.forcedNullIndicatorDays ?? []) {
    records = applyForcedNulls(records, spec.days, spec.indicatorId);
  }

  // Structural sensor spike is applied last so a random missing value cannot erase it.
  const spike = definition.heartRateSpike;
  const heartRateParams = SIM_PARAMS.heart_rate;
  const heartRateBase = crewBases.get('heart_rate');
  if (spike && heartRateParams && heartRateBase !== undefined) {
    records = records.map((record) => {
      if (record.day !== spike.day) return record;
      const value = roundTo(
        clamp(heartRateBase + spike.offsetFromCrewBase, heartRateParams.clipMin, heartRateParams.clipMax),
        0,
      );
      return { day: record.day, values: { ...record.values, heart_rate: value } };
    });
  }

  return {
    crewId: config.crewId,
    crewName: config.crewName,
    seed: config.seed,
    scenarioId: config.scenarioId,
    missionSetting: config.missionSetting,
    preflightDays: PREFLIGHT_DAYS,
    missionDays: MISSION_DAYS,
    records,
    groundTruth: definition.groundTruth.map((event) => ({ ...event, indicators: [...event.indicators] })),
    synthetic: true,
  };
}
