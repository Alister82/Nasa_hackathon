import type { MissionSetting, MissionSettingId } from '@/contracts/types';

// Fixed simulator settings. Rates remain illustrative rounded values; the linked
// measurements below are context and are not presented as mission-specific predictions.
// expectedReplyMinutes = 2 × oneWayDelayMinutes + 10 (fixed ground-response time, illustrative).

export const MISSION_SETTINGS: Record<MissionSettingId, MissionSetting> = {
  station: {
    id: 'station',
    label: 'Space station',
    description: 'Low Earth orbit with near-real-time ground support; the app rate is a rounded setting informed by historical PADLES measurements.',
    oneWayDelayMinutes: 0,
    radiationRateMsvPerDay: 0.5,
    radiationSourceId: 'src_iss_padles',
    radiationBenchmark: 'ISS PADLES publication: 0.48 ± 0.08 mSv/day (reported measurement; not a universal ISS rate).',
  },
  lunar_base: {
    id: 'lunar_base',
    label: 'Lunar base',
    description: 'Lunar scenario with seconds-scale light time; 1.0 mSv/day is a simulator setting compared with the Chang’E-4 LND surface benchmark.',
    oneWayDelayMinutes: 0.02,
    radiationRateMsvPerDay: 1.0,
    radiationSourceId: 'src_lunar_lnd',
    radiationBenchmark: 'Chang’E-4 LND measured 1.369 mSv/day dose equivalent at the lunar surface; this was not an Artemis measurement.',
  },
  deep_space: {
    id: 'deep_space',
    label: 'Deep-space transit',
    description: 'Mars-transit scenario; NASA reports Earth–Mars one-way light time can vary from about 4 to 22 minutes.',
    oneWayDelayMinutes: 12,
    radiationRateMsvPerDay: 1.8,
    radiationSourceId: 'src_nasa_msl_rad',
    radiationBenchmark: 'MSL RAD measured 1.84 ± 0.33 mSv/day GCR dose equivalent during cruise, excluding solar particle events; app value is rounded.',
  },
};

/**
 * Expected reply time in minutes (illustrative).
 * Per ARCHITECTURE.md 7.3: 2 × oneWayDelayMinutes + 10 for ground to respond.
 */
export function expectedReplyMinutes(settingId: MissionSettingId): number {
  const s = MISSION_SETTINGS[settingId];
  return 2 * s.oneWayDelayMinutes + 10;
}

