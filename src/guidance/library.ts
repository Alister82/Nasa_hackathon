import type { SupplyId } from '@/contracts/types';

// Guidance library — transcribed verbatim from ARCHITECTURE.md Appendix A.
// Do not add, remove, or rephrase entries without human approval (RULES.md 1).
// Each key's actions use ids a1, a2, ... for deterministic ordering.
// supply and alternativeText present where Appendix A lists them.

export interface LibraryAction {
  id: string;
  text: string;
  requiresSupply?: SupplyId;
  alternativeText?: string;
}

export interface LibraryEntry {
  actions: LibraryAction[];
  questions: string[];
  nextMeasurements: string[];
  sourceIds: string[];
}

export const LIBRARY: Record<string, LibraryEntry> = {
  // ── heart_rate:up ──────────────────────────────────────────────────────────
  'heart_rate:up': {
    actions: [
      { id: 'a1', text: 'Sit quietly for 5 minutes, then repeat the measurement.' },
      { id: 'a2', text: 'Check recent caffeine, hydration, and exercise, and adjust if needed.' },
      { id: 'a3', text: 'Write down any symptoms such as dizziness, chest discomfort, or shortness of breath.' },
      { id: 'a4', text: 'Follow your scheduled exercise and rest plan.' },
    ],
    questions: [
      'Was the reading taken at rest?',
      'Any symptoms such as dizziness or chest discomfort?',
      'Any recent change in workload, caffeine, or sleep?',
    ],
    nextMeasurements: [
      'Resting heart rate after 5 minutes seated',
    ],
    sourceIds: ['src_hrp_risks', 'src_general_clinical'],
  },

  // ── bp:up ──────────────────────────────────────────────────────────────────
  // Applies to bp_sys and bp_dia per Appendix A.
  'bp:up': {
    actions: [
      {
        id: 'a1',
        text: 'Sit for 5 minutes with your back supported and feet flat, then repeat the reading.',
        requiresSupply: 'bp_cuff',
        alternativeText: 'Note how you feel and report that a cuff reading is not available.',
      },
      { id: 'a2', text: 'Note recent salt, caffeine, stress, and exercise.' },
      { id: 'a3', text: 'Record any headache, vision change, or chest discomfort.' },
    ],
    questions: [
      'Was the cuff sized and placed correctly?',
      'Any headache or vision change?',
      'Any recent change in exercise or diet?',
    ],
    nextMeasurements: [
      'Repeat blood pressure after 5 minutes of rest',
    ],
    sourceIds: ['src_aha_acc_bp', 'src_hrp_risks'],
  },

  // ── body_temp:up ──────────────────────────────────────────────────────────
  'body_temp:up': {
    actions: [
      {
        id: 'a1',
        text: 'Repeat the temperature in 15 minutes.',
        requiresSupply: 'thermometer',
        alternativeText: 'Note how warm or chilled you feel and report that a thermometer is not available.',
      },
      { id: 'a2', text: 'Drink fluids and rest as your schedule allows.' },
      { id: 'a3', text: 'Record other symptoms such as cough, sore throat, or body aches.' },
    ],
    questions: [
      'Any other symptoms?',
      'Has any crew member been unwell?',
      'Was the thermometer used correctly?',
    ],
    nextMeasurements: [
      'Temperature again in 15 minutes',
    ],
    sourceIds: ['src_general_clinical', 'src_hrp_risks'],
  },

  // ── glucose:high ──────────────────────────────────────────────────────────
  'glucose:high': {
    actions: [
      {
        id: 'a1',
        text: 'Confirm the reading was taken fasting, and repeat it.',
        requiresSupply: 'glucometer',
        alternativeText: 'Report that a glucose meter is not available.',
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

  // ── glucose:low ───────────────────────────────────────────────────────────
  'glucose:low': {
    actions: [
      {
        id: 'a1',
        text: 'Repeat the reading now.',
        requiresSupply: 'glucometer',
        alternativeText: 'Report that a glucose meter is not available.',
      },
      { id: 'a2', text: 'If you feel shaky or confused, follow your crew medical procedures and tell a crew member.' },
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

  // ── sleep_hours:down ──────────────────────────────────────────────────────
  'sleep_hours:down': {
    actions: [
      { id: 'a1', text: 'Keep a consistent sleep window.' },
      {
        id: 'a2',
        text: 'Reduce bright light and screens before sleep.',
        alternativeText: 'Dim your sleep station lighting.',
      },
      { id: 'a3', text: 'Limit caffeine in the hours before sleep.' },
      {
        id: 'a4',
        text: 'Use a sleep mask and earplugs if available.',
        requiresSupply: 'sleep_mask',
        alternativeText: 'Cover or dim the light near your sleep station.',
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

  // ── exercise_minutes:down ─────────────────────────────────────────────────
  'exercise_minutes:down': {
    actions: [
      {
        id: 'a1',
        text: 'Complete your scheduled exercise session today.',
        requiresSupply: 'exercise_equipment',
        alternativeText: 'Do body-weight resistance and stretching and report that equipment is not available.',
      },
      { id: 'a2', text: 'Split the session into shorter blocks if time is tight.' },
      { id: 'a3', text: 'Tell the flight surgeon if pain or fatigue stops you from exercising.' },
    ],
    questions: [
      'Was equipment unavailable or a session skipped?',
      'Any pain or unusual fatigue?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_hrp_hazards', 'src_hrp_risks'],
  },

  // ── behavioral:support ────────────────────────────────────────────────────
  // Used for mood:down, stress:up, energy:down (Appendix A).
  'behavioral:support': {
    actions: [
      { id: 'a1', text: 'Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.' },
      { id: 'a2', text: 'Keep a regular daily routine, including meals, exercise, and sleep.' },
      { id: 'a3', text: 'Talk with a crew member or send a message to someone you trust.' },
      { id: 'a4', text: 'Tell the flight surgeon or behavioral health support if this continues.' },
    ],
    questions: [
      'How long has this been going on?',
      'Has sleep or workload changed?',
      'Would talking with someone help?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_hrp_hazards', 'src_hrp_risks'],
  },

  // ── radiation_event ───────────────────────────────────────────────────────
  'radiation_event': {
    actions: [
      { id: 'a1', text: 'Move to the best-shielded area of the vehicle, following your radiation procedures.' },
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

  // ── isolated_spike ────────────────────────────────────────────────────────
  'isolated_spike': {
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

  // ── data_quality_issue ────────────────────────────────────────────────────
  'data_quality_issue': {
    actions: [
      { id: 'a1', text: 'Log the missing measurements when you can.' },
      { id: 'a2', text: 'Check the device and note why readings were missed.' },
    ],
    questions: [
      'Why were readings missed?',
    ],
    nextMeasurements: [],
    sourceIds: ['src_hrp_risks'],
  },

  // ── wellbeing:support ─────────────────────────────────────────────────────
  // Same four actions as behavioral:support per Appendix A.
  'wellbeing:support': {
    actions: [
      { id: 'a1', text: 'Try slow breathing: in for 4 seconds, out for 6, for 2 minutes.' },
      { id: 'a2', text: 'Keep a regular daily routine, including meals, exercise, and sleep.' },
      { id: 'a3', text: 'Talk with a crew member or send a message to someone you trust.' },
      { id: 'a4', text: 'Tell the flight surgeon or behavioral health support if this continues.' },
    ],
    questions: [],
    nextMeasurements: [],
    sourceIds: ['src_hrp_hazards', 'src_hrp_risks'],
  },

  // ── urgent:bp ─────────────────────────────────────────────────────────────
  // bp crisis (bp_sys ≥ 180 or bp_dia ≥ 120) per Appendix A.
  'urgent:bp': {
    actions: [
      { id: 'a1', text: 'Follow your emergency medical procedures and contact the crew medical officer now.' },
    ],
    questions: [],
    nextMeasurements: [],
    sourceIds: ['src_aha_acc_bp'],
  },

  // ── urgent:glucose ────────────────────────────────────────────────────────
  // glucose below 54 per Appendix A.
  'urgent:glucose': {
    actions: [
      { id: 'a1', text: 'Follow your emergency medical procedures and contact the crew medical officer now.' },
    ],
    questions: [],
    nextMeasurements: [],
    sourceIds: ['src_ada_glucose'],
  },
};

/**
 * Look up a library entry.  Returns undefined when the key is not in Appendix A.
 * Callers should check and fall back gracefully (do not throw into the UI).
 */
export function getLibraryEntry(key: string): LibraryEntry | undefined {
  return LIBRARY[key];
}

