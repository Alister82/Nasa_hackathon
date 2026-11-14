/**
 * G6: wellbeing.ts
 * evaluateCheckIn and supportActions per ARCHITECTURE.md 7.6.
 *
 * Rules (in order):
 * 1. urgentHelpRequested → urgent, escalation urgent_now.
 * 2. mood ≤ 2 AND stress ≥ 4 → support (harder combination).
 * 3. mood ≤ 2 OR stress ≥ 4 OR energy ≤ 2 → support.
 * 4. else none.
 *
 * Messages are taken verbatim from ARCHITECTURE.md 7.6.
 * supportActions derives ActionItem list from the wellbeing:support library entry.
 *
 * NEVER include the note in any card, log, or export (RULES.md 10).
 * Notes stay on device only.
 */
import type {
  CheckInInput,
  CheckInResult,
  ActionItem,
  SupplyId,
} from '@/contracts/types';
import { LIBRARY } from './library';

// ── Message texts (verbatim from ARCHITECTURE.md 7.6) ────────────────────────

const MSG_URGENT =
  'Contact your crew medical officer and ground now. You do not have to handle this alone.';

const MSG_SUPPORT_BOTH =
  'It looks like today is hard. Here are some steps that may help, and the flight surgeon or behavioral health support can talk it through with you.';

const MSG_SUPPORT_ONE =
  'Thank you for checking in. Here are a few steps that may help.';

const MSG_NONE = 'Thanks for checking in.';

// ── supportActions ────────────────────────────────────────────────────────────

/**
 * Returns the four wellbeing:support actions as ActionItem[].
 * supplyAvailable = true for all (no supply required by any wellbeing action).
 */
export function supportActions(supplies: Record<SupplyId, boolean>): ActionItem[] {
  // supplies not used by wellbeing:support (no supply requirements), but
  // kept as parameter to match the CONTRACTS.md 4.2 signature.
  void supplies;
  const entry = LIBRARY['wellbeing:support'];
  if (!entry) {
    throw new Error('Missing library entry: wellbeing:support');
  }
  return entry.actions.map((a) => ({
    id: a.id,
    text: a.text,
    supplyAvailable: true,
  }));
}

// ── evaluateCheckIn ───────────────────────────────────────────────────────────

export function evaluateCheckIn(input: CheckInInput): CheckInResult {
  // Rule 1: urgent help requested.
  if (input.urgentHelpRequested) {
    return {
      level: 'urgent',
      message: MSG_URGENT,
      suggestions: [],
      escalation: {
        level: 'urgent_now',
        text: MSG_URGENT,
        expectedReplyMinutes: null,
      },
    };
  }

  // Rule 2: mood ≤ 2 AND stress ≥ 4 (harder combination — specific message).
  if (input.mood <= 2 && input.stress >= 4) {
    return {
      level: 'support',
      message: MSG_SUPPORT_BOTH,
      suggestions: supportActions({} as Record<SupplyId, boolean>),
      escalation: null,
    };
  }

  // Rule 3: mood ≤ 2 OR stress ≥ 4 OR energy ≤ 2.
  if (input.mood <= 2 || input.stress >= 4 || input.energy <= 2) {
    return {
      level: 'support',
      message: MSG_SUPPORT_ONE,
      suggestions: supportActions({} as Record<SupplyId, boolean>),
      escalation: null,
    };
  }

  // Rule 4: none.
  return {
    level: 'none',
    message: MSG_NONE,
    suggestions: [],
    escalation: null,
  };
}

