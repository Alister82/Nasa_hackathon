export const CONTRACT_VERSION = 1;

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
