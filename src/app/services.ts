import type {
  CrewDataset,
  AnalysisResult,
  AlertCard,
  MissionContext,
  ResultsFile,
  ScenarioId,
} from '@/contracts/types';
import { mockDataset } from '@/mocks/mockDataset';
import { mockAnalysis } from '@/mocks/mockAnalysis';
import { mockCards } from '@/mocks/mockCards';

export const USE_MOCKS = true;

// Simple memoization caches
const analysisCache = new Map<string, AnalysisResult>();

export async function getDataset(
  _crewId: string,
  _scenarioId?: ScenarioId,
  _seed?: number,
): Promise<CrewDataset> {
  if (USE_MOCKS) {
    return mockDataset;
  }
  // Integration will connect to engine and storage
  return mockDataset;
}

export function getAnalysis(dataset: CrewDataset, viewDay: number): AnalysisResult {
  if (USE_MOCKS) {
    return {
      ...mockAnalysis,
      crewId: dataset.crewId,
      upToDay: viewDay,
    };
  }
  const key = `${dataset.crewId}:${dataset.seed}:${dataset.scenarioId}:${viewDay}`;
  const cached = analysisCache.get(key);
  if (cached) return cached;

  // Real engine analysis will be called when USE_MOCKS is false
  return mockAnalysis;
}

export function getCards(analysis: AnalysisResult, _ctx: MissionContext): AlertCard[] {
  if (USE_MOCKS) {
    return mockCards.map((c) => ({
      ...c,
      day: analysis.upToDay,
    }));
  }
  return mockCards;
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
