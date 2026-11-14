import type { IndicatorId, FollowUpEvaluation } from '@/contracts/types';
import { getIndicator } from '@/contracts/indicators';

/**
 * Evaluates whether a repeat reading shows favorable, unchanged, or elevated movement
 * relative to an initial elevated or flagged reading.
 * Follows deterministic aerospace medical guidance without diagnostic assertions.
 */
export function evaluateFollowUp(
  indicatorId: IndicatorId,
  initialReading: number,
  repeatReading: number,
): FollowUpEvaluation {
  const meta = getIndicator(indicatorId);
  const delta = Math.round((repeatReading - initialReading) * 100) / 100;
  const tolerance = Math.max(0.5, meta.minSigma || 1) * 0.4;

  let direction: 'improved' | 'unchanged' | 'worsened';

  if (Math.abs(delta) < tolerance) {
    direction = 'unchanged';
  } else if (meta.concernDirection === 'up') {
    // Concern is higher numbers (e.g. HR, BP, Temp) -> decrease is improved
    direction = delta < 0 ? 'improved' : 'worsened';
  } else if (meta.concernDirection === 'down') {
    // Concern is lower numbers (e.g. Sleep, Energy) -> increase is improved
    direction = delta > 0 ? 'improved' : 'worsened';
  } else {
    // Both directions (e.g. Glucose)
    direction = Math.abs(delta) > 5 ? 'worsened' : 'improved';
  }

  let guidanceMessage = '';
  let recommendedNextStep = '';

  if (direction === 'improved') {
    guidanceMessage = `Repeat reading shows favorable movement (${initialReading} → ${repeatReading} ${meta.unit}).`;
    recommendedNextStep = 'Continue current restful routine. Log again at your next scheduled daily check.';
  } else if (direction === 'unchanged') {
    guidanceMessage = `Repeat reading remains steady (${initialReading} → ${repeatReading} ${meta.unit}).`;
    recommendedNextStep = 'Complete a guided breathing cycle or rest an additional 5 minutes before active tasks.';
  } else {
    guidanceMessage = `Repeat reading shows higher elevation (${initialReading} → ${repeatReading} ${meta.unit}).`;
    recommendedNextStep = 'Notify the crew medical officer or generate a flight-surgeon handover report.';
  }

  return {
    baselineReading: initialReading,
    repeatReading,
    delta,
    direction,
    guidanceMessage,
    recommendedNextStep,
  };
}
