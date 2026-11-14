import type {
  CrewDataset,
  AnalysisResult,
  AlertCard,
  MissionContext,
  ResultsFile,
  ScenarioId,
  ScenarioConfig,
} from '@/contracts/types';
import { DEFAULT_CREW, DEFAULT_MISSION_SETTING } from '@/contracts/constants';
import { generateScenario, mergeEntries, analyze } from '@/engine';
import { buildAlertCards } from '@/guidance';
import { loadEntries } from '@/storage';
import { mockDataset } from '@/mocks/mockDataset';
import { mockAnalysis } from '@/mocks/mockAnalysis';
import { mockCards } from '@/mocks/mockCards';

// Checkpoint 2 integration flag
export const USE_MOCKS = false;

// Memoization caches
const datasetCache = new Map<string, CrewDataset>();
const analysisCache = new Map<string, AnalysisResult>();

export async function getDataset(
  crewId: string,
  scenarioId?: ScenarioId,
  seed?: number,
): Promise<CrewDataset> {
  if (USE_MOCKS) {
    return mockDataset;
  }

  const defaultCrewInfo = DEFAULT_CREW.find((c) => c.crewId === crewId) ?? DEFAULT_CREW[0]!;
  const usedScenario = scenarioId ?? defaultCrewInfo.scenarioId;
  const usedSeed = seed ?? defaultCrewInfo.seed;
  const usedSetting = DEFAULT_MISSION_SETTING;

  const config: ScenarioConfig = {
    crewId,
    crewName: defaultCrewInfo.crewName,
    scenarioId: usedScenario,
    seed: usedSeed,
    missionSetting: usedSetting,
  };

  const cacheKey = `${crewId}:${usedScenario}:${usedSeed}:${usedSetting}`;
  let baseDs = datasetCache.get(cacheKey);
  if (!baseDs) {
    baseDs = generateScenario(config);
    datasetCache.set(cacheKey, baseDs);
  }

  // Load manual entries from storage and merge
  try {
    const entries = await loadEntries(crewId);
    if (entries && entries.length > 0) {
      return mergeEntries(baseDs, entries);
    }
  } catch {
    // If storage unavailable, return base dataset
  }

  return baseDs;
}

export function getAnalysis(dataset: CrewDataset, viewDay: number): AnalysisResult {
  if (USE_MOCKS) {
    return {
      ...mockAnalysis,
      crewId: dataset.crewId,
      upToDay: viewDay,
    };
  }

  const cacheKey = `${dataset.crewId}:${dataset.scenarioId}:${dataset.seed}:${dataset.missionSetting}:${viewDay}`;
  const cached = analysisCache.get(cacheKey);
  if (cached) return cached;

  const result = analyze(dataset, viewDay);
  analysisCache.set(cacheKey, result);
  return result;
}

export function getCards(analysis: AnalysisResult, ctx: MissionContext): AlertCard[] {
  if (USE_MOCKS) {
    return mockCards.map((c) => ({
      ...c,
      day: analysis.upToDay,
    }));
  }

  return buildAlertCards(analysis, ctx);
}

export async function loadResults(): Promise<ResultsFile | null> {
  try {
    const res = await fetch('./data/results.json');
    if (!res.ok) return null;
    const data = (await res.json()) as ResultsFile;
    return data;
  } catch {
    return null;
  }
}
