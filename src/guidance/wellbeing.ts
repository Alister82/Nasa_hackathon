import type {
  CheckInInput,
  CheckInResult,
  ActionItem,
  Escalation,
  SupplyId,
} from '@/contracts/types';
import { LIBRARY } from './library';

// Wellbeing rules per ARCHITECTURE.md 7.6.
// No scores, no labels such as "depressed" or "anxious". Notes are stored on device only.

function urgentEscalation(): Escalation {
  return {
    level: 'urgent_now',
    // ARCHITECTURE.md 7.6 exact message used in escalation text.
    text: 'Contact your crew medical officer and ground now. You do not have to handle this alone.',
    expectedReplyMinutes: null,
  };
}

function resolveLibraryActions(
  key: string,
  supplies: Record<SupplyId, boolean>,
): ActionItem[] {
  const entry = LIBRARY[key];
  if (!entry) return [];
  return entry.actions.map((a) => {
    if (a.requiresSupply) {
      const avail = supplies[a.requiresSupply] ?? true;
      return {
        id: a.id,
        text: a.text,
        requiresSupply: a.requiresSupply,
        supplyAvailable: avail,
        alternativeText: a.alternativeText,
      };
    }
    return {
      id: a.id,
      text: a.text,
      supplyAvailable: true,
    };
  });
}

/**
 * Evaluate a wellbeing check-in and produce a structured result.
 * Rules per ARCHITECTURE.md 7.6 (in priority order):
 *   1. urgentHelpRequested → urgent
 *   2. mood ≤ 2 and stress ≥ 4 → support (combined trigger)
 *   3. mood ≤ 2 or stress ≥ 4 or energy ≤ 2 → support (single trigger)
 *   4. else → none
 */
export function evaluateCheckIn(input: CheckInInput): CheckInResult {
  // All supplies default true for wellbeing — no equipment required.
  const supplies: Record<SupplyId, boolean> = {
    bp_cuff: true,
    thermometer: true,
    glucometer: true,
    wrist_hr_monitor: true,
    exercise_equipment: true,
    sleep_mask: true,
  };

  // Rule 1: urgent help requested.
  if (input.urgentHelpRequested) {
    return {
      level: 'urgent',
      // ARCHITECTURE.md 7.6 exact message.
      message: 'Contact your crew medical officer and ground now. You do not have to handle this alone.',
      suggestions: [],
      escalation: urgentEscalation(),
    };
  }

  // Rule 2: mood ≤ 2 and stress ≥ 4 (combined trigger).
  if (input.mood <= 2 && input.stress >= 4) {
    return {
      level: 'support',
      // ARCHITECTURE.md 7.6 exact message.
      message:
        'It looks like today is hard. Here are some steps that may help, and the flight surgeon or behavioral health support can talk it through with you.',
      suggestions: resolveLibraryActions('wellbeing:support', supplies),
      escalation: null,
    };
  }

  // Rule 3: single trigger.
  if (input.mood <= 2 || input.stress >= 4 || input.energy <= 2) {
    return {
      level: 'support',
      // ARCHITECTURE.md 7.6 exact message.
      message: 'Thank you for checking in. Here are a few steps that may help.',
      suggestions: resolveLibraryActions('wellbeing:support', supplies),
      escalation: null,
    };
  }

  // Rule 4: none.
  return {
    level: 'none',
    // DESIGN.md fixed copy: "Thanks for checking in."
    message: 'Thanks for checking in.',
    suggestions: [],
    escalation: null,
  };
}

/**
 * Returns the behavioral:support actions with supply availability resolved.
 * Used by the guidance index to export supportActions per CONTRACTS.md 4.2.
 */
export function supportActions(supplies: Record<SupplyId, boolean>): ActionItem[] {
  return resolveLibraryActions('wellbeing:support', supplies);
}

