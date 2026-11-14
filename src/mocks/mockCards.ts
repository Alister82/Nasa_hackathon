import type { AlertCard } from '@/contracts/types';

export const mockCards: AlertCard[] = [
  {
    id: 'multi_signal_pattern:heart_rate+bp_sys+sleep_hours+mood:95',
    kind: 'multi_signal_pattern',
    day: 120,
    severity: 'review',
    domains: ['cardiovascular', 'sleep_recovery', 'behavioral'],
    indicators: ['heart_rate', 'bp_sys', 'sleep_hours', 'mood'],
    title: 'Multiple measures shifting together',
    observation:
      '4 measures have shifted together since about day 70: Resting heart rate, Blood pressure, systolic, Sleep, Mood.',
    evidence: [
      {
        indicatorId: 'heart_rate',
        text: 'Resting heart rate: pre-flight 64 bpm, last 7 days 73 bpm, 7 of the last 7 days beyond your usual range.',
        days: [114, 115, 116, 117, 118, 119, 120],
      },
      {
        indicatorId: 'bp_sys',
        text: 'Blood pressure, systolic: pre-flight 116 mmHg, last 7 days 124 mmHg, 7 of the last 7 days beyond your usual range.',
        days: [114, 115, 116, 117, 118, 119, 120],
      },
      {
        indicatorId: 'sleep_hours',
        text: 'Sleep: pre-flight 6.8 hours, last 7 days 5.6 hours, 6 of the last 7 days beyond your usual range.',
        days: [114, 115, 116, 117, 118, 119, 120],
      },
      {
        indicatorId: 'mood',
        text: 'Mood: pre-flight 3.8 score, last 7 days 2.9 score, 6 of the last 7 days beyond your usual range.',
        days: [114, 115, 116, 117, 118, 119, 120],
      },
    ],
    uncertainty: {
      tier: 'high',
      statement: 'Several measures have changed together. A cause cannot be named from this data.',
      missingInfo: [
        'Was the reading taken at rest?',
        'Was the cuff sized and placed correctly?',
        'Has your sleep schedule shifted?',
      ],
    },
    nextMeasurements: [
      'Resting heart rate after 5 minutes seated',
      'Repeat blood pressure after 5 minutes of rest',
    ],
    recommendedActions: [
      {
        id: 'a1',
        text: 'Sit quietly for 5 minutes, then repeat the measurement.',
        supplyAvailable: true,
      },
      {
        id: 'a2',
        text: 'Sit for 5 minutes with your back supported and feet flat, then repeat the reading.',
        requiresSupply: 'bp_cuff',
        supplyAvailable: true,
        alternativeText: 'Note how you feel and report that a cuff reading is not available.',
      },
      {
        id: 'a3',
        text: 'Keep a consistent sleep window.',
        supplyAvailable: true,
      },
      {
        id: 'a4',
        text: 'Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.',
        supplyAvailable: true,
      },
      {
        id: 'a5',
        text: 'Check recent caffeine, hydration, and exercise, and adjust if needed.',
        supplyAvailable: true,
      },
    ],
    escalation: {
      level: 'report_to_ground',
      text: 'Start the steps below now. Send a report to the flight surgeon; a reply may take at least 34 minutes.',
      expectedReplyMinutes: 34,
    },
    sourceIds: ['src_hrp_hazards', 'src_hrp_risks', 'src_aha_acc_bp', 'src_aasm_sleep'],
  },
  {
    id: 'expected_adaptation:heart_rate:10',
    kind: 'expected_adaptation',
    day: 10,
    severity: 'info',
    domains: ['cardiovascular'],
    indicators: ['heart_rate'],
    title: 'Expected early adaptation: Resting heart rate',
    observation: 'Resting heart rate has changed recently.',
    evidence: [
      {
        indicatorId: 'heart_rate',
        text: 'Resting heart rate: pre-flight 64 bpm, last 7 days 67 bpm, 3 of the last 7 days beyond your usual range.',
        days: [4, 5, 6, 7, 8, 9, 10],
      },
    ],
    uncertainty: {
      tier: 'low',
      statement: 'Only one measure has changed. This alone cannot show a cause.',
      missingInfo: [],
    },
    nextMeasurements: [],
    recommendedActions: [],
    escalation: {
      level: 'self_manage',
      text: 'No action needed. Keep logging.',
      expectedReplyMinutes: null,
    },
    sourceIds: ['src_hrp_risks', 'src_general_clinical'],
  },
];
