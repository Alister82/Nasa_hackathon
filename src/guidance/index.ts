import type {
  AnalysisResult, AlertCard, MissionContext, MissionSetting, MissionSettingId,
  SupplyMeta, ReferenceRange, MeasurementHelp, SourceRef, ValueClass,
  CheckInInput, CheckInResult, IndicatorId, ActionItem, SupplyId,
} from '@/contracts/types';

/* Checkpoint 0 stub. P2 replaces these bodies in G1 to G6. */

const NOT_IMPLEMENTED = 'not implemented';

export function buildAlertCards(_analysis: AnalysisResult, _ctx: MissionContext): AlertCard[] {
  throw new Error(NOT_IMPLEMENTED);
}

export function evaluateCheckIn(_input: CheckInInput): CheckInResult {
  throw new Error(NOT_IMPLEMENTED);
}

export function classifyValue(
  _indicatorId: IndicatorId,
  _value: number,
  _setting?: MissionSettingId,
): ValueClass {
  throw new Error(NOT_IMPLEMENTED);
}

export const MISSION_SETTINGS = {} as Record<MissionSettingId, MissionSetting>;
export const SUPPLIES: SupplyMeta[] = [];
export const DEFAULT_SUPPLIES = {} as Record<SupplyId, boolean>;
export const REFERENCE_RANGES = {} as Record<IndicatorId, ReferenceRange>;
export const MEASUREMENT_HELP = {} as Record<IndicatorId, MeasurementHelp>;
export const SOURCES: Record<string, SourceRef> = {};

export function supportActions(_supplies: Record<SupplyId, boolean>): ActionItem[] {
  throw new Error(NOT_IMPLEMENTED);
}
