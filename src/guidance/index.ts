// Guidance module index — public API per CONTRACTS.md section 4.2.
// Import rule: guidance may import contracts only (plus internal guidance files).

export { buildAlertCards } from './alertCards';
export { evaluateCheckIn, supportActions } from './wellbeing';
export { classifyValue, REFERENCE_RANGES } from './referenceRanges';
export { MISSION_SETTINGS, expectedReplyMinutes } from './missionSettings';
export { SUPPLIES, DEFAULT_SUPPLIES } from './supplies';
export { MEASUREMENT_HELP } from './measurementHelp';
export { SOURCES } from './sources';

// Re-export types used by callers (not re-defined here — they come from contracts).
export type {
  AnalysisResult,
  AlertCard,
  MissionContext,
  MissionSetting,
  MissionSettingId,
  SupplyMeta,
  ReferenceRange,
  MeasurementHelp,
  SourceRef,
  ValueClass,
  CheckInInput,
  CheckInResult,
  IndicatorId,
  ActionItem,
  SupplyId,
} from '@/contracts/types';
