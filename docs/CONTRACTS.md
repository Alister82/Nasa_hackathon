# CONTRACTS: frozen types and function signatures

Version: `CONTRACT_VERSION = 2` · 2026-11-14 (bumped for redesign/premium: SupportingSignal, AlertCard cluster/procedure fields, FollowUpEvaluation).

These files are created **exactly as written below** in checkpoint 0 (by P1, merged to `main`) and then **frozen**. Changing them requires the contract-change process in `RULES.md` section 6. Do not rename, reorder, or "improve" anything. Copy the code blocks verbatim.

## 1. `src/contracts/types.ts`

```ts
export const CONTRACT_VERSION = 2;

/* ---------- identifiers ---------- */
export type IndicatorId =
  | 'heart_rate' | 'bp_sys' | 'bp_dia' | 'body_temp' | 'glucose'
  | 'sleep_hours' | 'exercise_minutes' | 'mood' | 'stress' | 'energy'
  | 'radiation_dose';

export type DomainId =
  | 'cardiovascular' | 'sleep_recovery' | 'physical_performance'
  | 'behavioral' | 'metabolic_general' | 'radiation';

export type MissionSettingId = 'station' | 'lunar_base' | 'deep_space';

export type ScenarioId =
  | 'normal_adaptation' | 'slow_drift' | 'sensor_fault'
  | 'blackout_drift' | 'solar_event' | 'acute_fever';

export type SupplyId =
  | 'bp_cuff' | 'thermometer' | 'glucometer' | 'wrist_hr_monitor'
  | 'exercise_equipment' | 'sleep_mask';

export type SystemId = 'vigil' | 'threshold' | 'zscore';

export type ConcernDirection = 'up' | 'down' | 'both';

/* ---------- indicator metadata ---------- */
export interface IndicatorMeta {
  id: IndicatorId;
  label: string;
  unit: string;
  domain: DomainId;
  decimals: number;
  concernDirection: ConcernDirection;
  minSigma: number;            // 0 for radiation_dose (not used)
  method: 'cusum' | 'rule';
  plausibleMin: number;
  plausibleMax: number;
}

/* ---------- data ---------- */
export interface DailyRecord {
  day: number;                 // -29..0 preflight, 1..180 mission
  values: Partial<Record<IndicatorId, number | null>>; // null = missing
}

export type GroundTruthKind =
  | 'physiological_drift' | 'sensor_fault' | 'solar_event' | 'acute_illness';

export interface GroundTruthEvent {
  kind: GroundTruthKind;
  isMedical: boolean;          // false for sensor_fault
  onsetDay: number;
  endDay: number | null;
  indicators: IndicatorId[];
}

export interface ScenarioConfig {
  scenarioId: ScenarioId;
  seed: number;
  crewId: string;
  crewName: string;
  missionSetting: MissionSettingId;
}

export interface CrewDataset {
  crewId: string;
  crewName: string;
  seed: number;
  scenarioId: ScenarioId;
  missionSetting: MissionSettingId;
  preflightDays: number;       // 30
  missionDays: number;         // 180
  records: DailyRecord[];      // sorted ascending by day, from -29 to 180
  groundTruth: GroundTruthEvent[];
  synthetic: true;
}

/* ---------- analysis ---------- */
export type IndicatorStatus = 'ok' | 'watch' | 'flagged';

export interface Baseline {
  indicatorId: IndicatorId;
  median: number;
  sigma: number;
  n: number;
}

export interface IndicatorPoint {
  day: number;
  value: number | null;
  expected: number;
  z: number | null;
}

export interface IndicatorAnalysis {
  indicatorId: IndicatorId;
  status: IndicatorStatus;
  cusumUp: number;
  cusumDown: number;
  onsetDay: number | null;
  persistent: boolean;
  lastValue: number | null;
  lastZ: number | null;
  missingFractionLast7: number;
  dataQuality: 'good' | 'poor';
  isolatedSpike: boolean;
  adaptationNote: boolean;
  points: IndicatorPoint[];    // mission days 1..upToDay
}

export interface DomainAnalysis {
  domain: DomainId;
  status: IndicatorStatus;
  indicators: IndicatorId[];
}

export type FindingKind =
  | 'persistent_change' | 'multi_signal_pattern' | 'isolated_spike'
  | 'data_quality_issue' | 'expected_adaptation' | 'radiation_event'
  | 'hard_threshold';

export type EvidenceStrength = 'low' | 'moderate' | 'high';

export interface Finding {
  id: string;                  // `${kind}:${indicators.join('+')}:${firstFlaggedDay}`
  kind: FindingKind;
  domains: DomainId[];
  indicators: IndicatorId[];
  onsetDay: number | null;
  firstFlaggedDay: number;
  evidenceStrength: EvidenceStrength;
  dataQualityPoor: boolean;
  urgent: boolean;             // true only for hard_threshold urgent cases
}

export interface AnalysisResult {
  crewId: string;
  upToDay: number;
  baselineReady: boolean;
  baselines: Partial<Record<IndicatorId, Baseline>>;
  indicators: Record<IndicatorId, IndicatorAnalysis>;
  domains: Record<DomainId, DomainAnalysis>;
  findings: Finding[];
}

/* ---------- systems and metrics ---------- */
export interface DailyFlag { day: number; flagged: boolean; }

export interface DetectionSystem {
  id: SystemId;
  label: string;
  run(dataset: CrewDataset): DailyFlag[];   // mission days 1..missionDays
}

export interface SystemMetrics {
  eventCount: number;
  detectedCount: number;
  medianDelayDays: number | null;
  falseEpisodes: number;
  falseAlarmsPer100Days: number;
}

export interface ScenarioResult {
  scenarioId: ScenarioId;
  seedCount: number;
  systems: Record<SystemId, SystemMetrics>;
}

export interface ResultsFile {
  schemaVersion: 1;
  contractVersion: number;
  evaluationSeeds: { start: number; end: number };
  tuningSeeds: { start: number; end: number };
  missionDays: number;
  missionSetting: MissionSettingId;
  scenarios: ScenarioResult[];
}

/* ---------- guidance ---------- */
export type SeverityLevel = 'info' | 'watch' | 'review' | 'urgent';

export type EscalationLevel =
  | 'self_manage' | 'report_to_ground' | 'contact_ground_now' | 'urgent_now';

export interface SourceRef {
  id: string;
  title: string;
  url: string | null;
  status: 'unverified' | 'verified';
}

export interface EvidenceItem {
  indicatorId: IndicatorId;
  text: string;
  days: number[];              // the last up-to-7 observed days used
}

export interface ActionItem {
  id: string;
  text: string;
  requiresSupply?: SupplyId;
  supplyAvailable: boolean;    // true when no supply required
  alternativeText?: string;    // shown when supplyAvailable is false
}

export interface Escalation {
  level: EscalationLevel;
  text: string;
  expectedReplyMinutes: number | null;
}

export interface SupportingSignal {
  indicatorId: IndicatorId;
  name: string;
  severity: SeverityLevel;
  summary: string;
  currentValue?: number;
  unit?: string;
  baselineMean?: number;
  baselineStd?: number;
}

export interface AlertCard {
  id: string;
  kind: FindingKind | 'early_signal';
  day: number;                 // the viewed day the card was built for
  severity: SeverityLevel;
  domains: DomainId[];
  indicators: IndicatorId[];
  title: string;
  observation: string;
  evidence: EvidenceItem[];
  uncertainty: { tier: EvidenceStrength; statement: string; missingInfo: string[] };
  nextMeasurements: string[];
  recommendedActions: ActionItem[];
  escalation: Escalation;
  sourceIds: string[];
  supportingSignals?: SupportingSignal[];
  hasRestTimer?: boolean;
  hasBreathingPacer?: boolean;
  clusterKey?: string;
}

export interface FollowUpEvaluation {
  baselineReading: number;
  repeatReading: number;
  delta: number;
  direction: 'improved' | 'unchanged' | 'worsened';
  guidanceMessage: string;
  recommendedNextStep: string;
}

export interface MissionSetting {
  id: MissionSettingId;
  label: string;
  description: string;
  oneWayDelayMinutes: number;
  radiationRateMsvPerDay: number;
}

export interface SupplyMeta { id: SupplyId; label: string; }

export interface MissionContext {
  setting: MissionSettingId;
  supplies: Record<SupplyId, boolean>;
}

export type ValueClass = 'normal' | 'borderline' | 'out_of_range' | 'urgent';

export interface ReferenceRange {
  indicatorId: IndicatorId;
  displayText: string;         // e.g. "60 to 100 bpm at rest"
  sourceIds: string[];
  illustrative: boolean;       // always true in v1
}

export interface MeasurementHelp {
  indicatorId: IndicatorId;
  howToMeasure: string;        // 1 to 3 short sentences
  whyItMatters: string;        // 1 sentence
  hazards: string[];           // from: 'radiation', 'isolation and confinement', 'distance from Earth', 'altered gravity', 'hostile closed environment'
}

/* ---------- wellbeing ---------- */
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface CheckInInput {
  crewId: string;
  day: number;
  mood: Rating;
  stress: Rating;
  energy: Rating;
  note?: string;
  urgentHelpRequested: boolean;
}

export interface CheckInResult {
  level: 'none' | 'support' | 'urgent';
  message: string;
  suggestions: ActionItem[];
  escalation: Escalation | null;
}

/* ---------- storage ---------- */
export interface MeasurementEntry {
  crewId: string;
  day: number;
  values: Partial<Record<IndicatorId, number>>;
  createdAt: string;           // ISO string
}

export interface CheckInRecord extends CheckInInput {
  createdAt: string;
  sharedWithGround: boolean;
}

export interface LogEntry {
  id?: number;
  crewId: string;
  day: number;
  createdAt: string;
  cardId: string | null;
  observation: string;
  actionTaken: string;
  reviewedBy: 'astronaut' | 'flight_surgeon' | 'unspecified';
  note: string;
}
```

## 2. `src/contracts/indicators.ts`

```ts
import type { IndicatorMeta, IndicatorId, DomainId } from './types';

export const INDICATORS: IndicatorMeta[] = [
  { id: 'heart_rate', label: 'Resting heart rate', unit: 'bpm', domain: 'cardiovascular', decimals: 0, concernDirection: 'up', minSigma: 1.5, method: 'cusum', plausibleMin: 30, plausibleMax: 220 },
  { id: 'bp_sys', label: 'Blood pressure, systolic', unit: 'mmHg', domain: 'cardiovascular', decimals: 0, concernDirection: 'up', minSigma: 2.5, method: 'cusum', plausibleMin: 60, plausibleMax: 260 },
  { id: 'bp_dia', label: 'Blood pressure, diastolic', unit: 'mmHg', domain: 'cardiovascular', decimals: 0, concernDirection: 'up', minSigma: 2.0, method: 'cusum', plausibleMin: 30, plausibleMax: 150 },
  { id: 'body_temp', label: 'Body temperature', unit: '°C', domain: 'metabolic_general', decimals: 1, concernDirection: 'up', minSigma: 0.1, method: 'cusum', plausibleMin: 33, plausibleMax: 42 },
  { id: 'glucose', label: 'Blood glucose (fasting)', unit: 'mg/dL', domain: 'metabolic_general', decimals: 0, concernDirection: 'both', minSigma: 3.0, method: 'cusum', plausibleMin: 30, plausibleMax: 600 },
  { id: 'sleep_hours', label: 'Sleep', unit: 'hours', domain: 'sleep_recovery', decimals: 1, concernDirection: 'down', minSigma: 0.3, method: 'cusum', plausibleMin: 0, plausibleMax: 16 },
  { id: 'exercise_minutes', label: 'Exercise', unit: 'minutes', domain: 'physical_performance', decimals: 0, concernDirection: 'down', minSigma: 8.0, method: 'cusum', plausibleMin: 0, plausibleMax: 600 },
  { id: 'mood', label: 'Mood', unit: 'score 1 to 5', domain: 'behavioral', decimals: 1, concernDirection: 'down', minSigma: 0.25, method: 'cusum', plausibleMin: 1, plausibleMax: 5 },
  { id: 'stress', label: 'Stress', unit: 'score 1 to 5', domain: 'behavioral', decimals: 1, concernDirection: 'up', minSigma: 0.25, method: 'cusum', plausibleMin: 1, plausibleMax: 5 },
  { id: 'energy', label: 'Energy', unit: 'score 1 to 5', domain: 'behavioral', decimals: 1, concernDirection: 'down', minSigma: 0.25, method: 'cusum', plausibleMin: 1, plausibleMax: 5 },
  { id: 'radiation_dose', label: 'Radiation dose', unit: 'mSv/day', domain: 'radiation', decimals: 3, concernDirection: 'up', minSigma: 0, method: 'rule', plausibleMin: 0, plausibleMax: 50 },
];

export const INDICATOR_IDS: IndicatorId[] = INDICATORS.map((i) => i.id);

export const DOMAIN_LABELS: Record<DomainId, string> = {
  cardiovascular: 'Heart and blood pressure',
  sleep_recovery: 'Sleep and recovery',
  physical_performance: 'Exercise and strength',
  behavioral: 'Mood and stress',
  metabolic_general: 'Temperature and blood sugar',
  radiation: 'Radiation',
};

export const DOMAIN_ORDER: DomainId[] = [
  'cardiovascular', 'sleep_recovery', 'physical_performance',
  'behavioral', 'metabolic_general', 'radiation',
];

export function getIndicator(id: IndicatorId): IndicatorMeta {
  const found = INDICATORS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown indicator: ${id}`);
  return found;
}
```

## 3. `src/contracts/constants.ts`

```ts
import type { ScenarioId, MissionSettingId } from './types';

export const APP_NAME = 'Vigil';
export const PREFLIGHT_DAYS = 30;
export const MISSION_DAYS = 180;
export const FIRST_PREFLIGHT_DAY = -29;

export const EVALUATION_SEEDS = { start: 1, end: 100 } as const;
export const TUNING_SEEDS = { start: 1000, end: 1099 } as const;

export const SCENARIO_IDS: ScenarioId[] = [
  'normal_adaptation', 'slow_drift', 'sensor_fault',
  'blackout_drift', 'solar_event', 'acute_fever',
];

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  normal_adaptation: 'Normal adaptation',
  slow_drift: 'Slow multi-signal drift',
  sensor_fault: 'Sensor fault',
  blackout_drift: 'Drift during a communication blackout',
  solar_event: 'Solar radiation event',
  acute_fever: 'Acute fever',
};

export interface DefaultCrew {
  crewId: string;
  crewName: string;
  scenarioId: ScenarioId;
  seed: number;
}

export const DEFAULT_CREW: DefaultCrew[] = [
  { crewId: 'crew-1', crewName: 'Crew 1', scenarioId: 'slow_drift', seed: 42 },
  { crewId: 'crew-2', crewName: 'Crew 2', scenarioId: 'normal_adaptation', seed: 43 },
  { crewId: 'crew-3', crewName: 'Crew 3', scenarioId: 'sensor_fault', seed: 44 },
];

export const DEFAULT_MISSION_SETTING: MissionSettingId = 'deep_space';
export const DEFAULT_VIEW_DAY = 120;

export const DEMO_STORY = {
  crewId: 'crew-1',
  scenarioId: 'slow_drift' as ScenarioId,
  seed: 42,
  missionSetting: 'deep_space' as MissionSettingId,
  viewDay: 120,
};

export const DISCLAIMER_BANNER =
  'Simulated crew data. Decision support only, not a medical device.';
```

## 4. Module public APIs (exact exported names)

### 4.1 `src/engine/index.ts` (P1)

```ts
import type {
  CrewDataset, ScenarioConfig, AnalysisResult, DetectionSystem, SystemId,
  MeasurementEntry, ScenarioResult, ResultsFile, ScenarioId,
} from '@/contracts/types';

export function generateScenario(config: ScenarioConfig): CrewDataset;
export function mergeEntries(dataset: CrewDataset, entries: MeasurementEntry[]): CrewDataset; // entry values overwrite that day's values; ignores entries with day outside -29..180
export function truncateDataset(dataset: CrewDataset, upToDay: number): CrewDataset;          // keeps records with day <= upToDay
export function analyze(dataset: CrewDataset, upToDay: number): AnalysisResult;
export const SYSTEMS: Record<SystemId, DetectionSystem>;
export function evaluateScenario(scenarioId: ScenarioId, seeds: number[], missionSetting: ScenarioConfig['missionSetting']): ScenarioResult;
export function buildResultsFile(seedsStart: number, seedsEnd: number, missionSetting: ScenarioConfig['missionSetting']): ResultsFile;
export function phaseOffset(indicatorId: import('@/contracts/types').IndicatorId, missionDay: number): number;
```

### 4.2 `src/guidance/index.ts` (P2)

```ts
import type {
  AnalysisResult, AlertCard, MissionContext, MissionSetting, MissionSettingId,
  SupplyMeta, ReferenceRange, MeasurementHelp, SourceRef, ValueClass,
  CheckInInput, CheckInResult, IndicatorId, ActionItem,
} from '@/contracts/types';

export function buildAlertCards(analysis: AnalysisResult, ctx: MissionContext): AlertCard[];
export function evaluateCheckIn(input: CheckInInput): CheckInResult;
export function classifyValue(indicatorId: IndicatorId, value: number, setting?: MissionSettingId): ValueClass;
export const MISSION_SETTINGS: Record<MissionSettingId, MissionSetting>;
export const SUPPLIES: SupplyMeta[];
export const DEFAULT_SUPPLIES: Record<import('@/contracts/types').SupplyId, boolean>; // all true
export const REFERENCE_RANGES: Record<IndicatorId, ReferenceRange>;
export const MEASUREMENT_HELP: Record<IndicatorId, MeasurementHelp>;
export const SOURCES: Record<string, SourceRef>;
export function supportActions(supplies: Record<import('@/contracts/types').SupplyId, boolean>): ActionItem[]; // the behavioral:support actions
```

### 4.3 `src/storage/index.ts` (P2)

```ts
import type { MeasurementEntry, CheckInRecord, LogEntry, MissionSettingId, SupplyId } from '@/contracts/types';

export function saveEntry(entry: MeasurementEntry): Promise<void>;                    // key `${crewId}:${day}`; merges values into an existing entry for that key
export function loadEntries(crewId: string): Promise<MeasurementEntry[]>;
export function saveCheckIn(record: CheckInRecord): Promise<void>;
export function loadCheckIns(crewId: string): Promise<CheckInRecord[]>;
export function addLogEntry(entry: Omit<LogEntry, 'id'>): Promise<number | null>;
export function listLogEntries(crewId: string): Promise<LogEntry[]>;                  // newest first
export function getSetting<T>(key: string, fallback: T): Promise<T>;
export function setSetting<T>(key: string, value: T): Promise<void>;
export function clearAll(): Promise<void>;                                            // used by "Reset demo data"
```

### 4.4 `src/app/services.ts` (P3; facade the UI uses)

```ts
export function getDataset(crewId: string, scenarioId?: ScenarioId, seed?: number): Promise<CrewDataset>;  // generateScenario + mergeEntries; cached per (crewId, scenarioId, seed, entriesVersion)
export function getAnalysis(dataset: CrewDataset, viewDay: number): AnalysisResult;                         // memoized
export function getCards(analysis: AnalysisResult, ctx: MissionContext): AlertCard[];
export function loadResults(): Promise<ResultsFile | null>;                                                 // fetch('./data/results.json'), null on failure
```

## 5. Mocks (P3 creates in `src/mocks/` until real modules merge)

- `mockDataset.ts`: a hand-built `CrewDataset` with 30 + 180 days (simple deterministic arrays, no randomness needed).
- `mockAnalysis.ts`: an `AnalysisResult` for `upToDay = 120` with: cardiovascular `flagged`, behavioral `flagged`, sleep_recovery `watch`, others `ok`; findings: one `multi_signal_pattern` with indicators `heart_rate`, `bp_sys`, `sleep_hours`, `mood`.
- `mockCards.ts`: two `AlertCard`s (one `review`, one `info`) that satisfy the type exactly.
- `src/app/services.ts` imports mocks behind a single flag `USE_MOCKS` in `src/app/services.ts` until P3 switches it to `false` at integration checkpoint 2.

## 6. Contract invariants (tests must assert)

1. `INDICATOR_IDS` has 11 ids and every one appears in `AnalysisResult.indicators`.
2. `CrewDataset.records` is sorted ascending, has days −29 through 180 with no gaps.
3. Every `AlertCard` has non-empty `observation`, `uncertainty.statement`, `escalation.text`, and at least 1 id in `sourceIds` that exists in `SOURCES`.
4. `AlertCard.recommendedActions` never contains an action whose `supplyAvailable` is false without `alternativeText`.
5. No string produced by `guidance` contains the words "diagnosis", "diagnose", "disease", "cancer", "depression", "anxiety disorder", or "you have".
