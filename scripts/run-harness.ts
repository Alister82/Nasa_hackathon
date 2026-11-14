import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ResultsFile, SystemId } from '@/contracts/types';
import { EVALUATION_SEEDS } from '@/contracts/constants';
import { buildResultsFile } from '@/engine';

const SYSTEM_IDS: SystemId[] = ['vigil', 'threshold', 'zscore'];

function printSummary(results: ResultsFile): void {
  process.stdout.write(
    `Vigil harness: seeds ${results.evaluationSeeds.start}-${results.evaluationSeeds.end} per scenario, `
    + `setting ${results.missionSetting}, ${results.missionDays} mission days\n`,
  );
  for (const scenario of results.scenarios) {
    process.stdout.write(`\n${scenario.scenarioId}\n`);
    for (const id of SYSTEM_IDS) {
      const metrics = scenario.systems[id];
      const delay = metrics.medianDelayDays === null ? 'not detected' : `${metrics.medianDelayDays} days`;
      process.stdout.write(
        `  ${id.padEnd(10)} detected ${metrics.detectedCount}/${metrics.eventCount}`
        + `  median delay ${delay}`
        + `  false episodes ${metrics.falseEpisodes}`
        + `  false/100d ${metrics.falseAlarmsPer100Days.toFixed(2)}\n`,
      );
    }
  }
  process.stdout.write('\nWrote public/data/results.json\n');
}

async function main(): Promise<void> {
  const results = buildResultsFile(EVALUATION_SEEDS.start, EVALUATION_SEEDS.end, 'deep_space');
  const filePath = join(process.cwd(), 'public', 'data', 'results.json');
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  printSummary(results);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
