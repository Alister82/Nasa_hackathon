import type {
  CrewDataset,
  AnalysisResult,
  AlertCard,
  MissionContext,
  ResultsFile,
  ScenarioId,
  ScenarioConfig,
  MissionSettingId,
} from '@/contracts/types';
import { DEFAULT_CREW, DEFAULT_MISSION_SETTING } from '@/contracts/constants';
import { generateScenario, mergeEntries, analyze } from '@/engine';
import { buildAlertCards } from '@/guidance';
import { getSetting, loadEntries } from '@/storage';

// Integration flag kept for the contract from CONTRACTS.md section 5.
// The real engine, guidance, and storage modules are wired in: mocks are test fixtures only.
export const USE_MOCKS = false;

/** Generated base datasets, keyed by crew, scenario, seed, and mission setting. */
const datasetCache = new Map<string, CrewDataset>();

/** Analysis is cached per dataset object, so a newly merged dataset is never stale. */
const analysisCache = new WeakMap<CrewDataset, Map<number, AnalysisResult>>();

/** Cards depend on the mission context as well as the analysis. */
const cardCache = new WeakMap<AnalysisResult, Map<string, AlertCard[]>>();

const SUPPLY_ORDER = [
  'bp_cuff',
  'thermometer',
  'glucometer',
  'wrist_hr_monitor',
  'exercise_equipment',
  'sleep_mask',
] as const;

function crewDefaults(crewId: string): (typeof DEFAULT_CREW)[number] {
  return DEFAULT_CREW.find((crew) => crew.crewId === crewId) ?? DEFAULT_CREW[0]!;
}

function contextKey(ctx: MissionContext): string {
  const supplies = SUPPLY_ORDER.map((id) => (ctx.supplies[id] ? '1' : '0')).join('');
  return `${ctx.setting}:${supplies}`;
}

/** Call after manual entries change so the next read regenerates and re-merges. */
export function notifyEntriesChanged(): void {
  datasetCache.clear();
}

export async function getDataset(
  crewId: string,
  scenarioId?: ScenarioId,
  seed?: number,
): Promise<CrewDataset> {
  const crew = crewDefaults(crewId);
  const usedScenario = scenarioId ?? crew.scenarioId;
  const usedSeed = seed ?? crew.seed;

  // The simulator and the detector both depend on the mission setting (radiation rates),
  // so the setting is part of the generated dataset rather than a display-only flag.
  const storedSetting = await getSetting<MissionSettingId>(
    'missionSetting',
    DEFAULT_MISSION_SETTING,
  );
  const usedSetting: MissionSettingId =
    storedSetting === 'station' || storedSetting === 'lunar_base' || storedSetting === 'deep_space'
      ? storedSetting
      : DEFAULT_MISSION_SETTING;

  const config: ScenarioConfig = {
    crewId,
    crewName: crew.crewName,
    scenarioId: usedScenario,
    seed: usedSeed,
    missionSetting: usedSetting,
  };

  const cacheKey = `${crewId}:${usedScenario}:${usedSeed}:${usedSetting}`;
  let base = datasetCache.get(cacheKey);
  if (!base) {
    base = generateScenario(config);
    datasetCache.set(cacheKey, base);
  }

  const entries = await loadEntries(crewId);
  return entries.length > 0 ? mergeEntries(base, entries) : base;
}

export function getAnalysis(dataset: CrewDataset, viewDay: number): AnalysisResult {
  let perDay = analysisCache.get(dataset);
  if (!perDay) {
    perDay = new Map<number, AnalysisResult>();
    analysisCache.set(dataset, perDay);
  }
  const cached = perDay.get(viewDay);
  if (cached) return cached;

  const result = analyze(dataset, viewDay);
  perDay.set(viewDay, result);
  return result;
}

export function getCards(analysis: AnalysisResult, ctx: MissionContext): AlertCard[] {
  let perContext = cardCache.get(analysis);
  if (!perContext) {
    perContext = new Map<string, AlertCard[]>();
    cardCache.set(analysis, perContext);
  }
  const key = contextKey(ctx);
  const cached = perContext.get(key);
  if (cached) return cached;

  const cards = buildAlertCards(analysis, ctx);
  perContext.set(key, cards);
  return cards;
}

export async function loadResults(): Promise<ResultsFile | null> {
  try {
    const response = await fetch('./data/results.json');
    if (!response.ok) return null;
    const data = (await response.json()) as ResultsFile;
    if (data.schemaVersion !== 1 || !Array.isArray(data.scenarios)) return null;
    return data;
  } catch {
    return null;
  }
}
