/**
 * Detector constants, ARCHITECTURE.md 6.6.
 * This is the only place these numbers are defined; the tuning script (6.9)
 * may change only the fields of DetectorConfig.
 */
export interface DetectorConfig {
  cusumK: number;
  hWatch: number;
  hFlag: number;
  zClamp: number;
  persistWindow: number;
  persistMinDays: number;
  persistZ: number;
  persistMinObserved: number;
  patternOnsetGap: number;
  spikeZ: number;
  poorQualityMissingFraction: number;
  baselineMinN: number;
  radiationWatchRatio: number;
  radiationFlagRatio: number;
}

/* Frozen 2026-11-14 by the 6.9 tuning protocol on seeds 1000-1099 only. */
export const CUSUM_K = 1.25;
export const H_WATCH = 3;
export const H_FLAG = 8;
export const Z_CLAMP = 6;
export const PERSIST_WINDOW = 7;
export const PERSIST_MIN_DAYS = 5;
export const PERSIST_Z = 1.0;
export const PERSIST_MIN_OBSERVED = 4;
export const PATTERN_ONSET_GAP = 14;
export const SPIKE_Z = 5;
export const POOR_QUALITY_MISSING_FRACTION = 0.4;
export const BASELINE_MIN_N = 14;
export const RADIATION_WATCH_RATIO = 1.5;
export const RADIATION_FLAG_RATIO = 2.5;

export const DETECTOR_CONFIG: DetectorConfig = {
  cusumK: CUSUM_K,
  hWatch: H_WATCH,
  hFlag: H_FLAG,
  zClamp: Z_CLAMP,
  persistWindow: PERSIST_WINDOW,
  persistMinDays: PERSIST_MIN_DAYS,
  persistZ: PERSIST_Z,
  persistMinObserved: PERSIST_MIN_OBSERVED,
  patternOnsetGap: PATTERN_ONSET_GAP,
  spikeZ: SPIKE_Z,
  poorQualityMissingFraction: POOR_QUALITY_MISSING_FRACTION,
  baselineMinN: BASELINE_MIN_N,
  radiationWatchRatio: RADIATION_WATCH_RATIO,
  radiationFlagRatio: RADIATION_FLAG_RATIO,
};

/* Fixed rule numbers from ARCHITECTURE.md 6.6 steps 6, 9, and 11. Not tunable. */
export const SPIKE_PRIOR_Z = 2;
export const SPIKE_PRIOR_DAYS = 3;
export const ADAPTATION_DELTA_Z = 1.5;
export const ADAPTATION_MIN_DAY = 21;
export const URGENT_BP_SYS = 180;
export const URGENT_BP_DIA = 120;
export const URGENT_GLUCOSE_LOW = 54;
export const RECENT_VALUE_WINDOW_DAYS = 2;
export const RADIATION_WINDOW_DAYS = 3;
