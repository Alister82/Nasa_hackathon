import type { MissionSetting, MissionSettingId } from '@/contracts/types';

// Mission settings per ARCHITECTURE.md 7.3.
// All numbers are illustrative; a human must verify before the project page quotes them.
// expectedReplyMinutes = 2 × oneWayDelayMinutes + 10 (fixed ground-response time, illustrative).

export const MISSION_SETTINGS: Record<MissionSettingId, MissionSetting> = {
  station: {
    id: 'station',
    label: 'Space station',
    description: 'Ground contact within minutes',
    oneWayDelayMinutes: 0,
    radiationRateMsvPerDay: 0.5,
  },
  lunar_base: {
    id: 'lunar_base',
    label: 'Lunar base',
    description: 'Short delay',
    oneWayDelayMinutes: 0.02,
    radiationRateMsvPerDay: 1.0,
  },
  deep_space: {
    id: 'deep_space',
    label: 'Deep-space transit',
    description: 'Reply may take many minutes',
    oneWayDelayMinutes: 12,
    radiationRateMsvPerDay: 1.8,
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

