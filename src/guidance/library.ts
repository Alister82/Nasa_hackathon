/**
 * G4: library.ts
 * Guidance library transcribed verbatim from ARCHITECTURE.md Appendix A (section 8).
 *
 * DO NOT add or modify entries without human approval and an update to Appendix A.
 * Text in action items, questions, and nextMeasurements is copied exactly.
 *
 * Keys:
 *   heart_rate:up, bp:up, body_temp:up, glucose:high, glucose:low,
 *   sleep_hours:down, exercise_minutes:down, behavioral:support,
 *   radiation_event, isolated_spike, data_quality_issue, wellbeing:support
 *
 * Pattern cards (multi_signal_pattern) merge member entries: see alertCards.ts.
 * wellbeing:support and behavioral:support share the same four actions (Appendix A).
 */
import type { SupplyId } from '@/contracts/types';

export interface LibraryAction {
  id: string;        // e.g. 'a1', 'a2'
  text: string;
  supply?: SupplyId;
  alternative?: string;
}

export interface LibraryEntry {
  key: string;
  actions: LibraryAction[];
  questions: string[];
  nextMeasurements: string[];
  sourceIds: string[];
}

// ── Shared behavioral / wellbeing actions (identical content, Appendix A) ────
// Used by behavioral:support, wellbeing:support.
const BEHAVIORAL_ACTIONS: LibraryAction[] = [
  { id: 'a1', text: 'Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.' },
  { id: 'a2', text: 'Keep a regular daily routine, including meals, exercise, and sleep.' },
  { id: 'a3', text: 'Talk with a crew member or send a message to someone you trust.' },
  { id: 'a4', text: 'Tell the flight surgeon or behavioral health support if this continues.' },
];

const BEHAVIORAL_QUESTIONS = [
  'How long has this been going on?',
  'Has sleep or workload changed?',
  'Would talking with someone help?',
];

// ── Library ───────────────────────────────────────────────────────────────────

export const LIBRARY: Record<string, LibraryEntry> = {
  'heart_rate:up': {
    key: 'heart_rate:up',
    actions: [
      { id: 'a1', text: 'Sit quietly for 5 minutes, then repeat the measurement.' },
      { id: 'a2', text: 'Check recent caffeine, hydration, and exercise, and adjust if needed.' },
      {
        id: 'a3',
        text: 'Write down any symptoms such as dizziness, chest discomfort, or shortness of breath.',
      },
      { id: 'a4', text: 'Follow your scheduled exercise and rest plan.' },
    ],
    questions: [
      'Was the reading taken at rest?',
      'Any symptoms such as dizziness or chest discomfort?',
      'Any recent change in workload, caffeine, or sleep?',
    ],
    nextMeasurements: ['Resting heart rate after 5 minutes seated'],
    sourceIds: ['src_hrp_risks', 'src_general_clinical'],
  },

  // bp:up applies to both bp_sys and bp_dia (Appendix A).
  'bp:up': {
    key: 'bp:up',
    actions: [
      {
        id: 'a1',
        text: 'Sit for 5 minutes with your back supported and feet flat, then repeat the reading.',
        supply: 'bp_cuff',
        alternative:
          'Note how you feel and report that a cuff reading is not available.',
      },
      { id: 'a2', text: 'Note recent salt, caffeine, stress, and exercise.' },
      { id: 'a3', text: 'Record any headache, vision change, or chest discomfort.' },
    ],
    questions: [
      'Was the cuff sized and placed correctly?',
      'Any headache or vision change?',
      'Any recent change in exercise or diet?',
    ],
    nextMeasurements: ['Repeat blood pressure after 5 minutes of rest'],
    sourceIds: ['src_aha_acc_bp', 'src_hrp_risks'],
  },

  'body_temp:up': {
    key: 'body_temp:up',
    actions: [
      {
        id: 'a1',
        text: 'Repeat the temperature in 15 minutes.',
        supply: 'thermometer',
        alternative:
          'Note how warm or chilled you feel and report that a thermometer is not available.',
      },
      { id: 'a2', text: 'Drink fluids and rest as your schedule allows.' },
      {
        id: 'a3',
        text: 'Record other symptoms such as cough, sore throat, or body aches.',
      },
    ],
    questions: [
      'Any other symptoms?',
      'Has any crew member been unwell?',
      'Was the thermometer used correctly?',
    ],
    nextMeasurements: ['Temperature again in 15 minutes'],
    sourceIds: ['src_general_clinical', 'src_hrp_risks'],
  },

  'glucose:high': {
    key: 'glucose:high',
    actions: [
      {
        id: 'a1',
        text: 'Confirm the reading was taken fasting, and repeat it.',
        supply: 'glucometer',
        alternative: 'Report that a glucose meter is not available.',
      },
      { id: 'a2', text: 'Note recent meals, snacks, and stress.' },
      { id: 'a3', text: 'Record symptoms such as thirst or frequent urination.' },
    ],
    questions: [
      'Was the reading fasting?',
      'When was the last meal?',
      'Any shakiness, sweating, or confusion?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_ada_glucose'],
  },

  'glucose:low': {
    key: 'glucose:low',
    actions: [
      { id: 'a1', text: 'Repeat the reading now.', supply: 'glucometer' },
      {
        id: 'a2',
        text: 'If you feel shaky or confused, follow your crew medical procedures and tell a crew member.',
      },
      { id: 'a3', text: 'Note your last meal and recent exercise.' },
    ],
    questions: [
      'Was the reading fasting?',
      'When was the last meal?',
      'Any shakiness, sweating, or confusion?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_ada_glucose'],
  },

  'sleep_hours:down': {
    key: 'sleep_hours:down',
    actions: [
      { id: 'a1', text: 'Keep a consistent sleep window.' },
      {
        id: 'a2',
        text: 'Reduce bright light and screens before sleep.',
        alternative: 'Dim your sleep station lighting.',
      },
      { id: 'a3', text: 'Limit caffeine in the hours before sleep.' },
      {
        id: 'a4',
        text: 'Use a sleep mask and earplugs if available.',
        supply: 'sleep_mask',
        alternative: 'Cover or dim the light near your sleep station.',
      },
    ],
    questions: [
      'Has your sleep schedule shifted?',
      'Is noise or light disturbing sleep?',
      'Any change in workload or stress?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_aasm_sleep', 'src_hrp_hazards'],
  },

  'exercise_minutes:down': {
    key: 'exercise_minutes:down',
    actions: [
      {
        id: 'a1',
        text: 'Complete your scheduled exercise session today.',
        supply: 'exercise_equipment',
        alternative:
          'Do body-weight resistance and stretching and report that equipment is not available.',
      },
      { id: 'a2', text: 'Split the session into shorter blocks if time is tight.' },
      {
        id: 'a3',
        text: 'Tell the flight surgeon if pain or fatigue stops you from exercising.',
      },
    ],
    questions: [
      'Was equipment unavailable or a session skipped?',
      'Any pain or unusual fatigue?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_hrp_hazards', 'src_hrp_risks'],
  },

  // mood:down, stress:up, energy:down all use behavioral:support (Appendix A).
  'behavioral:support': {
    key: 'behavioral:support',
    actions: BEHAVIORAL_ACTIONS,
    questions: BEHAVIORAL_QUESTIONS,
    nextMeasurements: [],
    sourceIds: ['src_hrp_hazards', 'src_hrp_risks'],
  },

  'radiation_event': {
    key: 'radiation_event',
    actions: [
      {
        id: 'a1',
        text: 'Move to the best-shielded area of the vehicle, following your radiation procedures.',
      },
      { id: 'a2', text: 'Limit time outside shielded areas until ground advises.' },
      { id: 'a3', text: 'Report the dose reading and your location to ground.' },
    ],
    questions: [
      'Is a solar event alert active?',
      'Where were you when the reading rose?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_csa_radiation', 'src_hrp_hazards'],
  },

  'isolated_spike': {
    key: 'isolated_spike',
    actions: [
      { id: 'a1', text: 'Repeat the measurement to confirm.' },
      { id: 'a2', text: 'Check the sensor placement and device battery.' },
    ],
    questions: [
      'Was the device placed correctly?',
      'Did anything unusual happen at the time of reading?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_general_clinical'],
  },

  'data_quality_issue': {
    key: 'data_quality_issue',
    actions: [
      { id: 'a1', text: 'Log the missing measurements when you can.' },
      { id: 'a2', text: 'Check the device and note why readings were missed.' },
    ],
    questions: ['Why were readings missed?'],
    nextMeasurements: [],
    sourceIds: ['src_hrp_risks'],
  },

  // wellbeing:support — same four actions as behavioral:support (Appendix A).
  'wellbeing:support': {
    key: 'wellbeing:support',
    actions: BEHAVIORAL_ACTIONS,
    questions: BEHAVIORAL_QUESTIONS,
    nextMeasurements: [],
    sourceIds: ['src_hrp_hazards', 'src_hrp_risks'],
  },
};

/**
 * Map an indicator id to its library key.
 * Returns null if the indicator has no direct entry (caller must handle pattern merging).
 */
export function libraryKeyForIndicator(indicatorId: string): string | null {
  switch (indicatorId) {
    case 'heart_rate':  return 'heart_rate:up';
    case 'bp_sys':
    case 'bp_dia':      return 'bp:up';
    case 'body_temp':   return 'body_temp:up';
    case 'glucose':     return null; // caller decides high/low based on value
    case 'sleep_hours': return 'sleep_hours:down';
    case 'exercise_minutes': return 'exercise_minutes:down';
    case 'mood':
    case 'stress':
    case 'energy':      return 'behavioral:support';
    case 'radiation_dose': return 'radiation_event';
    default:            return null;
  }
}

