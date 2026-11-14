import type {
  CrewDataset, AnalysisResult, AlertCard, MissionContext, ResultsFile, ScenarioId,
} from '@/contracts/types';

/* Checkpoint 0 stub. P3 replaces these bodies at integration (U12). */

const NOT_IMPLEMENTED = 'not implemented';

export async function getDataset(
  _crewId: string,
  _scenarioId?: ScenarioId,
  _seed?: number,
): Promise<CrewDataset> {
  throw new Error(NOT_IMPLEMENTED);
}

export function getAnalysis(_dataset: CrewDataset, _viewDay: number): AnalysisResult {
  throw new Error(NOT_IMPLEMENTED);
}

export function getCards(_analysis: AnalysisResult, _ctx: MissionContext): AlertCard[] {
  throw new Error(NOT_IMPLEMENTED);
}

export async function loadResults(): Promise<ResultsFile | null> {
  throw new Error(NOT_IMPLEMENTED);
}
