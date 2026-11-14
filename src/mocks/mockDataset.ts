import type { CrewDataset, DailyRecord } from '@/contracts/types';

const records: DailyRecord[] = [];

for (let day = -29; day <= 180; day++) {
  // Simple deterministic baseline with slow drift starting after day 70
  const isDrift = day >= 70;
  const driftProgress = isDrift ? Math.min(1, (day - 70) / 40) : 0;

  records.push({
    day,
    values: {
      heart_rate: Math.round(64 + (isDrift ? 9 * driftProgress : 0)),
      bp_sys: Math.round(116 + (isDrift ? 8 * driftProgress : 0)),
      bp_dia: Math.round(74 + (isDrift ? 5 * driftProgress : 0)),
      body_temp: 36.6,
      glucose: 90,
      sleep_hours: Number((6.8 - (isDrift ? 1.2 * driftProgress : 0)).toFixed(1)),
      exercise_minutes: Math.round(120 - (isDrift ? 25 * driftProgress : 0)),
      mood: Number((3.8 - (isDrift ? 0.9 * driftProgress : 0)).toFixed(1)),
      stress: Number((2.2 + (isDrift ? 0.9 * driftProgress : 0)).toFixed(1)),
      energy: Number((3.7 - (isDrift ? 0.7 * driftProgress : 0)).toFixed(1)),
      radiation_dose: 1.8,
    },
  });
}

export const mockDataset: CrewDataset = {
  crewId: 'crew-1',
  crewName: 'Crew 1',
  seed: 42,
  scenarioId: 'slow_drift',
  missionSetting: 'deep_space',
  preflightDays: 30,
  missionDays: 180,
  records,
  groundTruth: [
    {
      kind: 'physiological_drift',
      isMedical: true,
      onsetDay: 70,
      endDay: null,
      indicators: [
        'heart_rate',
        'bp_sys',
        'bp_dia',
        'sleep_hours',
        'mood',
        'stress',
        'energy',
        'exercise_minutes',
      ],
    },
  ],
  synthetic: true,
};

