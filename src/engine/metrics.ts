import type {
  CrewDataset, DailyFlag, DetectionSystem, GroundTruthEvent, MissionSettingId,
  ResultsFile, ScenarioId, ScenarioResult, SystemId, SystemMetrics,
} from '@/contracts/types';
import { CONTRACT_VERSION } from '@/contracts/types';
import { MISSION_DAYS, SCENARIO_IDS, TUNING_SEEDS } from '@/contracts/constants';
import { generateScenario } from './scenarios';

export interface RunMetrics {
  eventCount: number;
  detectedCount: number;
  delays: number[];
  falseAlarmDays: number[];
  falseEpisodes: number;
  eligibleDays: number;
}

interface Window {
  start: number;
  end: number;
}

function buildWindows(
  groundTruth: GroundTruthEvent[],
  missionDays: number,
): { medical: Window[]; nonMedical: Window[] } {
  const medical: Window[] = [];
  const nonMedical: Window[] = [];
  for (const event of groundTruth) {
    if (event.isMedical) {
      medical.push({
        start: event.onsetDay,
        end: Math.min(missionDays, (event.endDay ?? missionDays) + 14),
      });
    } else {
      // Non-medical windows are narrow: [onsetDay, endDay + 1], ARCHITECTURE.md 6.8.
      nonMedical.push({
        start: event.onsetDay,
        end: Math.min(missionDays, (event.endDay ?? missionDays) + 1),
      });
    }
  }
  return { medical, nonMedical };
}

function inWindow(day: number, windows: Window[]): boolean {
  return windows.some((window) => day >= window.start && day <= window.end);
}

/** Metrics for one system on one dataset, ARCHITECTURE.md 6.8. */
export function computeRunMetrics(
  flags: DailyFlag[],
  groundTruth: GroundTruthEvent[],
  missionDays: number,
): RunMetrics {
  const { medical } = buildWindows(groundTruth, missionDays);
  const flaggedDays = new Set(flags.filter((flag) => flag.flagged).map((flag) => flag.day));

  const delays: number[] = [];
  let detectedCount = 0;
  for (const window of medical) {
    let firstFlag: number | null = null;
    for (let day = window.start; day <= window.end; day++) {
      if (flaggedDays.has(day)) { firstFlag = day; break; }
    }
    if (firstFlag !== null) {
      detectedCount++;
      delays.push(firstFlag - window.start);
    }
  }

  const falseAlarmDays = [...flaggedDays]
    .filter((day) => !inWindow(day, medical))
    .sort((a, b) => a - b);

  let falseEpisodes = 0;
  let previous: number | null = null;
  for (const day of falseAlarmDays) {
    // Runs separated by two or fewer clean days merge into one episode.
    if (previous === null || day - previous > 3) falseEpisodes++;
    previous = day;
  }

  let inMedicalWindow = 0;
  for (let day = 1; day <= missionDays; day++) {
    if (inWindow(day, medical)) inMedicalWindow++;
  }

  return {
    eventCount: medical.length,
    detectedCount,
    delays,
    falseAlarmDays,
    falseEpisodes,
    eligibleDays: missionDays - inMedicalWindow,
  };
}

function medianOrNull(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? null;
}

interface Totals {
  eventCount: number;
  detectedCount: number;
  delays: number[];
  falseEpisodes: number;
  eligibleDays: number;
}

const SYSTEM_IDS: SystemId[] = ['vigil', 'threshold', 'zscore'];

function toSystemMetrics(totals: Totals): SystemMetrics {
  return {
    eventCount: totals.eventCount,
    detectedCount: totals.detectedCount,
    medianDelayDays: medianOrNull(totals.delays),
    falseEpisodes: totals.falseEpisodes,
    falseAlarmsPer100Days:
      totals.eligibleDays > 0 ? (100 * totals.falseEpisodes) / totals.eligibleDays : 0,
  };
}

export function evaluateScenarioWith(
  scenarioId: ScenarioId,
  seeds: number[],
  missionSetting: MissionSettingId,
  systems: Record<SystemId, DetectionSystem>,
): ScenarioResult {
  const totals: Record<SystemId, Totals> = {
    vigil: { eventCount: 0, detectedCount: 0, delays: [], falseEpisodes: 0, eligibleDays: 0 },
    threshold: { eventCount: 0, detectedCount: 0, delays: [], falseEpisodes: 0, eligibleDays: 0 },
    zscore: { eventCount: 0, detectedCount: 0, delays: [], falseEpisodes: 0, eligibleDays: 0 },
  };

  for (const seed of seeds) {
    const dataset: CrewDataset = generateScenario({
      scenarioId,
      seed,
      crewId: 'crew-1',
      crewName: 'Crew 1',
      missionSetting,
    });
    for (const id of SYSTEM_IDS) {
      const flags = systems[id].run(dataset);
      const metrics = computeRunMetrics(flags, dataset.groundTruth, dataset.missionDays);
      const total = totals[id];
      total.eventCount += metrics.eventCount;
      total.detectedCount += metrics.detectedCount;
      total.delays.push(...metrics.delays);
      total.falseEpisodes += metrics.falseEpisodes;
      total.eligibleDays += metrics.eligibleDays;
    }
  }

  return {
    scenarioId,
    seedCount: seeds.length,
    systems: {
      vigil: toSystemMetrics(totals.vigil),
      threshold: toSystemMetrics(totals.threshold),
      zscore: toSystemMetrics(totals.zscore),
    },
  };
}

export function buildResultsFileWith(
  seedsStart: number,
  seedsEnd: number,
  missionSetting: MissionSettingId,
  systems: Record<SystemId, DetectionSystem>,
): ResultsFile {
  const seeds: number[] = [];
  for (let seed = seedsStart; seed <= seedsEnd; seed++) seeds.push(seed);
  const scenarios = SCENARIO_IDS.map((scenarioId) =>
    evaluateScenarioWith(scenarioId, seeds, missionSetting, systems),
  );
  return {
    schemaVersion: 1,
    contractVersion: CONTRACT_VERSION,
    evaluationSeeds: { start: seedsStart, end: seedsEnd },
    tuningSeeds: { start: TUNING_SEEDS.start, end: TUNING_SEEDS.end },
    missionDays: MISSION_DAYS,
    missionSetting,
    scenarios,
  };
}
