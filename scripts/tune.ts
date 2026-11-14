import type { DailyFlag } from '@/contracts/types';
import { TUNING_SEEDS } from '@/contracts/constants';
import { generateScenario } from '@/engine';
import { computeSeriousFlagDays } from '@/engine/detector';
import { DETECTOR_CONFIG } from '@/engine/detectorConfig';
import { computeRunMetrics } from '@/engine/metrics';

/* Only constants the tuning protocol allows (ARCHITECTURE.md 6.9) are varied here. */
const H_WATCH_VALUES = [3, 4];
const H_FLAG_VALUES = [6, 8, 10, 12];
const PERSIST_Z_VALUES = [0.75, 1.0, 1.25];
const PERSIST_MIN_DAYS_VALUES = [4, 5];

interface Row {
  hWatch: number;
  hFlag: number;
  persistZ: number;
  persistMinDays: number;
  falsePer100: number;
  detectionRate: number;
  medianDelay: number | null;
}

function toFlags(days: boolean[]): DailyFlag[] {
  return days.map((flagged, index) => ({ day: index + 1, flagged }));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  return sorted[mid] ?? null;
}

function evaluate(hWatch: number, hFlag: number, persistZ: number, persistMinDays: number): Row {
  const config = { ...DETECTOR_CONFIG, hWatch, hFlag, persistZ, persistMinDays };
  let normalEpisodes = 0;
  let normalEligible = 0;
  let detected = 0;
  let driftRuns = 0;
  const driftDelays: number[] = [];

  for (let seed = TUNING_SEEDS.start; seed <= TUNING_SEEDS.end; seed++) {
    const normal = generateScenario({
      scenarioId: 'normal_adaptation',
      seed,
      crewId: 'crew-1',
      crewName: 'Crew 1',
      missionSetting: 'deep_space',
    });
    const normalMetrics = computeRunMetrics(
      toFlags(computeSeriousFlagDays(normal, config)),
      normal.groundTruth,
      normal.missionDays,
    );
    normalEpisodes += normalMetrics.falseEpisodes;
    normalEligible += normalMetrics.eligibleDays;

    const drift = generateScenario({
      scenarioId: 'slow_drift',
      seed,
      crewId: 'crew-1',
      crewName: 'Crew 1',
      missionSetting: 'deep_space',
    });
    const driftMetrics = computeRunMetrics(
      toFlags(computeSeriousFlagDays(drift, config)),
      drift.groundTruth,
      drift.missionDays,
    );
    driftRuns++;
    if (driftMetrics.detectedCount > 0) detected++;
    driftDelays.push(...driftMetrics.delays);
  }

  return {
    hWatch,
    hFlag,
    persistZ,
    persistMinDays,
    falsePer100: normalEligible > 0 ? (100 * normalEpisodes) / normalEligible : 0,
    detectionRate: driftRuns > 0 ? detected / driftRuns : 0,
    medianDelay: median(driftDelays),
  };
}

const rows: Row[] = [];
for (const hWatch of H_WATCH_VALUES) {
  for (const hFlag of H_FLAG_VALUES) {
    for (const persistZ of PERSIST_Z_VALUES) {
      for (const persistMinDays of PERSIST_MIN_DAYS_VALUES) {
        rows.push(evaluate(hWatch, hFlag, persistZ, persistMinDays));
      }
    }
  }
}

process.stdout.write(`Tuning seeds ${TUNING_SEEDS.start}-${TUNING_SEEDS.end}, setting deep_space\n`);
process.stdout.write('H_WATCH  H_FLAG  PERSIST_Z  PERSIST_MIN_DAYS  false_per_100d  detection_rate  median_delay_d\n');
for (const row of rows) {
  const delay = row.medianDelay === null ? 'none' : row.medianDelay.toFixed(1);
  process.stdout.write(
    `${String(row.hWatch).padEnd(8)} ${String(row.hFlag).padEnd(7)} ${row.persistZ.toFixed(2).padEnd(10)} ${String(row.persistMinDays).padEnd(17)} `
    + `${row.falsePer100.toFixed(2).padStart(14)} `
    + `${row.detectionRate.toFixed(3).padStart(15)} ${delay.padStart(14)}\n`,
  );
}

const passing = rows
  .filter((row) => row.falsePer100 <= 1 && row.detectionRate >= 0.9)
  .sort((a, b) => a.falsePer100 - b.falsePer100 || b.detectionRate - a.detectionRate);
process.stdout.write(
  `\nGoal: normal false alarms <= 1.0 per 100 days and slow_drift detection >= 0.90. `
  + `${passing.length} combination(s) meet it.\n`,
);
for (const row of passing) {
  const delay = row.medianDelay === null ? 'none' : row.medianDelay.toFixed(1);
  process.stdout.write(
    `  H_WATCH ${row.hWatch}, H_FLAG ${row.hFlag}, PERSIST_Z ${row.persistZ}, PERSIST_MIN_DAYS ${row.persistMinDays}: `
    + `${row.falsePer100.toFixed(2)} per 100 days, ${(100 * row.detectionRate).toFixed(0)} percent detected, `
    + `median delay ${delay} days\n`,
  );
}
