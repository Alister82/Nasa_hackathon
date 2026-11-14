import type {
  AnalysisResult,
  AlertCard,
  MissionContext,
  Finding,
  SeverityLevel,
  Escalation,
  EvidenceItem,
  ActionItem,
  IndicatorId,
  EvidenceStrength,
  IndicatorStatus,
  IndicatorPoint,
  IndicatorMeta,
  SupportingSignal,
} from '@/contracts/types';
import { INDICATORS, getIndicator } from '@/contracts/indicators';
import { LIBRARY, type LibraryAction, type LibraryEntry } from './library';
import { SOURCES } from './sources';
import { REFERENCE_RANGES } from './referenceRanges';
import { expectedReplyMinutes } from './missionSettings';

// Alert card construction per ARCHITECTURE.md 7.4 and 7.5.

function findingSeverity(kind: Finding['kind']): SeverityLevel {
  switch (kind) {
    case 'expected_adaptation':
      return 'info';
    case 'isolated_spike':
    case 'data_quality_issue':
      return 'watch';
    case 'persistent_change':
    case 'multi_signal_pattern':
    case 'radiation_event':
      return 'review';
    case 'hard_threshold':
      return 'urgent';
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function buildEscalation(severity: SeverityLevel, ctx: MissionContext): Escalation {
  const setting = ctx.setting;

  if (severity === 'info') {
    return {
      level: 'self_manage',
      text: 'No action needed. Keep logging.',
      expectedReplyMinutes: null,
    };
  }

  if (severity === 'watch') {
    if (setting === 'station' || setting === 'lunar_base') {
      return {
        level: 'report_to_ground',
        text: 'Log it and mention it at your next scheduled ground conference.',
        expectedReplyMinutes: null,
      };
    }
    return {
      level: 'self_manage',
      text: 'Try the steps below and include this in your next scheduled report.',
      expectedReplyMinutes: null,
    };
  }

  if (severity === 'review') {
    if (setting === 'station' || setting === 'lunar_base') {
      return {
        level: 'contact_ground_now',
        text: 'Ask the flight surgeon for a call today. Start the steps below while you wait.',
        expectedReplyMinutes: null,
      };
    }
    const replyMinutes = expectedReplyMinutes(setting);
    return {
      level: 'report_to_ground',
      text: `Start the steps below now. Send a report to the flight surgeon; a reply may take at least ${replyMinutes} minutes.`,
      expectedReplyMinutes: replyMinutes,
    };
  }

  if (setting === 'station' || setting === 'lunar_base') {
    return {
      level: 'urgent_now',
      text: 'Contact the crew medical officer and ground now. Follow your emergency procedures.',
      expectedReplyMinutes: null,
    };
  }
  return {
    level: 'urgent_now',
    text: 'Contact the crew medical officer now and send an urgent report to ground. Do not wait for a reply to start emergency procedures.',
    expectedReplyMinutes: null,
  };
}

interface ObservedPoint {
  day: number;
  value: number;
  z: number | null;
  expected: number;
}

function observedPoints(points: IndicatorPoint[]): ObservedPoint[] {
  const observed: ObservedPoint[] = [];
  for (const point of points) {
    if (point.value === null) continue;
    observed.push({ day: point.day, value: point.value, z: point.z, expected: point.expected });
  }
  return observed;
}

function unitSuffix(meta: IndicatorMeta): string {
  return meta.unit.startsWith('score') ? '' : ` ${meta.unit}`;
}

function valueText(value: number, meta: IndicatorMeta): string {
  return `${value.toFixed(meta.decimals)}${unitSuffix(meta)}`;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isBeyondUsual(z: number, direction: IndicatorMeta['concernDirection']): boolean {
  // "Usual range" is one baseline sigma, the unit used by the detector's z statistic.
  if (direction === 'up') return z >= 1;
  if (direction === 'down') return z <= -1;
  return Math.abs(z) >= 1;
}

function buildEvidenceItem(indicatorId: IndicatorId, analysis: AnalysisResult): EvidenceItem {
  const meta = getIndicator(indicatorId);
  const last7 = observedPoints(analysis.indicators[indicatorId].points).slice(-7);
  const days = last7.map((point) => point.day);
  const avg = average(last7.map((point) => point.value));

  if (indicatorId === 'radiation_dose') {
    const expected = last7[last7.length - 1]?.expected ?? null;
    const above = expected === null ? 0 : last7.filter((point) => point.value / expected > 1.5).length;
    const expectedText =
      expected === null ? 'expected rate unavailable' : `${expected.toFixed(meta.decimals)} mSv/day`;
    const avgText = avg === null ? 'no recent readings' : `${avg.toFixed(meta.decimals)} mSv/day`;
    return {
      indicatorId,
      text:
        `Radiation dose: expected ${expectedText} for this mission setting, ` +
        `last 7 days ${avgText}, ${above} of the last 7 days above 1.5 times the expected rate.`,
      days,
    };
  }

  const baseline = analysis.baselines[indicatorId];
  const baselineText = baseline
    ? `${baseline.median.toFixed(meta.decimals)}${unitSuffix(meta)}`
    : 'not available';
  const avgText = avg === null ? 'no recent readings' : valueText(avg, meta);
  const beyond = last7.filter(
    (point) => point.z !== null && isBeyondUsual(point.z, meta.concernDirection),
  ).length;

  return {
    indicatorId,
    text:
      `${meta.label}: pre-flight ${baselineText}, last 7 days ${avgText}, ` +
      `${beyond} of the last 7 days beyond your usual range.`,
    days,
  };
}

function uncertaintyStatement(tier: EvidenceStrength, dataQualityPoor: boolean): string {
  let statement =
    tier === 'low'
      ? 'Only one measure has changed. This alone cannot show a cause.'
      : tier === 'moderate'
        ? 'Two measures have changed together. The cause is still unclear.'
        : 'Several measures have changed together. A cause cannot be named from this data.';
  if (dataQualityPoor) {
    statement += ' Some recent readings are missing, which lowers confidence.';
  }
  return statement;
}

function resolveActions(actions: LibraryAction[], ctx: MissionContext): ActionItem[] {
  return actions.map((action) => {
    if (action.requiresSupply) {
      return {
        id: action.id,
        text: action.text,
        requiresSupply: action.requiresSupply,
        supplyAvailable: ctx.supplies[action.requiresSupply] ?? true,
        alternativeText: action.alternativeText,
      };
    }
    return {
      id: action.id,
      text: action.text,
      supplyAvailable: true,
    };
  });
}

function libraryKeyForIndicator(indicatorId: IndicatorId, z: number | null): string {
  switch (indicatorId) {
    case 'heart_rate':
      return 'heart_rate:up';
    case 'bp_sys':
    case 'bp_dia':
      return 'bp:up';
    case 'body_temp':
      return 'body_temp:up';
    case 'glucose':
      return z !== null && z < 0 ? 'glucose:low' : 'glucose:high';
    case 'sleep_hours':
      return 'sleep_hours:down';
    case 'exercise_minutes':
      return 'exercise_minutes:down';
    case 'mood':
    case 'stress':
    case 'energy':
      return 'behavioral:support';
    case 'radiation_dose':
      return 'radiation_event';
    default: {
      const exhaustive: never = indicatorId;
      return exhaustive;
    }
  }
}

function libraryKeysForFinding(finding: Finding, analysis: AnalysisResult): string[] {
  if (finding.kind === 'isolated_spike') return ['isolated_spike'];
  if (finding.kind === 'data_quality_issue') return ['data_quality_issue'];
  if (finding.kind === 'radiation_event') return ['radiation_event'];
  if (finding.kind === 'hard_threshold') {
    const keys = finding.indicators.map((id) =>
      id === 'glucose' || id === 'bp_sys' || id === 'bp_dia'
        ? id === 'glucose'
          ? 'urgent:glucose'
          : 'urgent:bp'
        : libraryKeyForIndicator(id, analysis.indicators[id].lastZ),
    );
    return [...new Set(keys)];
  }
  return [
    ...new Set(
      finding.indicators.map((id) =>
        libraryKeyForIndicator(id, analysis.indicators[id].lastZ),
      ),
    ),
  ];
}

function mergePatternActions(
  findings: string[],
  ctx: MissionContext,
): ActionItem[] {
  const firstActions: LibraryAction[] = [];
  const remainingActions: LibraryAction[] = [];

  for (const key of findings) {
    const entry = LIBRARY[key];
    if (!entry) continue;
    const [first, ...rest] = entry.actions;
    if (first) firstActions.push(first);
    remainingActions.push(...rest);
  }

  const seen = new Set<string>();
  const result: ActionItem[] = [];
  for (const action of [...firstActions, ...remainingActions]) {
    if (seen.has(action.text)) continue;
    seen.add(action.text);
    const [resolved] = resolveActions([action], ctx);
    if (resolved) result.push(resolved);
    if (result.length >= 5) break;
  }
  return result;
}

function collectSourceIds(entries: LibraryEntry[], indicators: IndicatorId[]): string[] {
  const ids: string[] = [];
  const add = (id: string) => {
    if (SOURCES[id] && !ids.includes(id)) ids.push(id);
  };
  for (const entry of entries) {
    for (const sourceId of entry.sourceIds) add(sourceId);
  }
  for (const indicator of indicators) {
    for (const sourceId of REFERENCE_RANGES[indicator].sourceIds) add(sourceId);
  }
  return ids;
}

function buildTitle(finding: Finding): string {
  const first = finding.indicators[0];
  const label = first ? getIndicator(first).label : 'Reading';
  switch (finding.kind) {
    case 'multi_signal_pattern':
      return 'Several measures shifted together';
    case 'radiation_event':
      return 'Radiation dose above expected';
    case 'isolated_spike':
      return `${label}: one reading stands out`;
    case 'data_quality_issue':
      return `${label}: readings missing`;
    case 'expected_adaptation':
      return `${label}: expected early adaptation`;
    case 'hard_threshold':
      return `${label} in the urgent range`;
    case 'persistent_change':
      return `${label} has shifted`;
    default: {
      const exhaustive: never = finding.kind;
      return exhaustive;
    }
  }
}

function buildObservation(finding: Finding, analysis: AnalysisResult): string {
  if (finding.kind === 'multi_signal_pattern') {
    const labels = finding.indicators.map((id) => getIndicator(id).label);
    const onset = finding.onsetDay ?? finding.firstFlaggedDay;
    return `${labels.length} measures have shifted together since about day ${onset}: ${labels.join(', ')}.`;
  }

  const first = finding.indicators[0];
  if (!first) return 'A reading is worth attention.';
  const meta = getIndicator(first);
  const indicator = analysis.indicators[first];
  const points = observedPoints(indicator.points);
  const last7 = points.slice(-7);
  const recentAverage = average(last7.map((point) => point.value));
  const latest = points[points.length - 1];
  const baseline = analysis.baselines[first];

  if (finding.kind === 'hard_threshold') {
    const parts = finding.indicators.map((id) => {
      const itemMeta = getIndicator(id);
      const value = analysis.indicators[id].lastValue;
      return value === null
        ? `${itemMeta.label} has a recent reading`
        : `${itemMeta.label} is at ${valueText(value, itemMeta)}`;
    });
    return `${parts.join('; ')}, in the urgent range.`;
  }

  if (finding.kind === 'radiation_event') {
    const avgText =
      recentAverage === null ? 'above the expected rate' : `${recentAverage.toFixed(meta.decimals)} mSv/day`;
    return `Radiation dose has risen above the expected rate for this mission setting: ${avgText} (average of the last 7 days).`;
  }

  if (finding.kind === 'isolated_spike') {
    if (!latest) return `${meta.label} has one reading outside your usual range.`;
    return `${meta.label} has a single reading outside your usual range: ${valueText(latest.value, meta)} on day ${latest.day}.`;
  }

  if (finding.kind === 'data_quality_issue') {
    const missing = Math.round(indicator.missingFractionLast7 * 7);
    return `Some readings are missing for ${meta.label}: ${missing} of the last 7 days have no value.`;
  }

  if (finding.kind === 'expected_adaptation') {
    if (!latest || !baseline) {
      return `${meta.label} differs from your pre-flight baseline but matches the expected early adaptation.`;
    }
    return `${meta.label} differs from your pre-flight baseline but matches the expected early adaptation: ${valueText(baseline.median, meta)} to ${valueText(latest.value, meta)} on day ${latest.day}.`;
  }

  // persistent_change
  if (!baseline || recentAverage === null) {
    return `${meta.label} has changed from your pre-flight baseline.`;
  }
  const direction = recentAverage >= baseline.median ? 'risen' : 'fallen';
  const onset = finding.onsetDay ?? finding.firstFlaggedDay;
  return `${meta.label} has ${direction} from your pre-flight baseline since about day ${onset}: ${valueText(baseline.median, meta)} to ${valueText(recentAverage, meta)} (average of the last 7 days).`;
}

function buildMissingInfo(finding: Finding, analysis: AnalysisResult, questions: string[]): string[] {
  const missingInfo = [...questions];
  const poorLabels: string[] = [];
  for (const id of finding.indicators) {
    if (analysis.indicators[id].dataQuality === 'poor') {
      poorLabels.push(getIndicator(id).label);
    }
  }
  if (poorLabels.length > 0) {
    missingInfo.push(`Missing readings: ${poorLabels.join(', ')}`);
  }
  return missingInfo;
}

function detectProcedures(actions: ActionItem[]): { hasRestTimer: boolean; hasBreathingPacer: boolean } {
  const hasRestTimer = actions.some((a) =>
    /sit.*5 minutes|5-minute.*rest|rest.*5 minutes|sit quietly/i.test(a.text),
  );
  const hasBreathingPacer = actions.some((a) =>
    /breathing|4 seconds|4s\/6s|slow breathing/i.test(a.text),
  );
  return { hasRestTimer, hasBreathingPacer };
}

function buildSupportingSignals(
  indicatorIds: IndicatorId[],
  analysis: AnalysisResult,
): SupportingSignal[] {
  return indicatorIds.map((id) => {
    const meta = getIndicator(id);
    const ind = analysis.indicators[id];
    const base = analysis.baselines[id];
    const points = observedPoints(ind.points);
    const latest = points[points.length - 1];
    const currentValue = latest?.value ?? ind.lastValue ?? undefined;
    const severity: SeverityLevel = ind.status === 'flagged' ? 'review' : 'watch';
    const summary = `${meta.label} has shifted from baseline (${base?.median ?? '—'} → ${currentValue !== undefined ? valueText(currentValue, meta) : '—'})`;
    return {
      indicatorId: id,
      name: meta.label,
      severity,
      summary,
      currentValue,
      unit: meta.unit,
      baselineMean: base?.median,
      baselineStd: base?.sigma,
    };
  });
}

function buildCardFromFinding(
  finding: Finding,
  analysis: AnalysisResult,
  ctx: MissionContext,
  viewDay: number,
): AlertCard {
  const severity = findingSeverity(finding.kind);
  const keys = libraryKeysForFinding(finding, analysis);
  const entries = keys
    .map((key) => LIBRARY[key])
    .filter((entry): entry is LibraryEntry => entry !== undefined);

  const questions: string[] = [];
  const nextMeasurements: string[] = [];
  for (const entry of entries) {
    for (const question of entry.questions) {
      if (!questions.includes(question)) questions.push(question);
    }
    for (const measurement of entry.nextMeasurements) {
      if (!nextMeasurements.includes(measurement)) nextMeasurements.push(measurement);
    }
  }

  const actions =
    finding.kind === 'multi_signal_pattern'
      ? mergePatternActions(keys, ctx)
      : resolveActions(
          entries.flatMap((entry) => entry.actions).slice(0, 5),
          ctx,
        );

  const evidence = finding.indicators.map((id) => buildEvidenceItem(id, analysis));
  const { hasRestTimer, hasBreathingPacer } = detectProcedures(actions);

  return {
    id: `${finding.kind}:${finding.indicators.join('+')}:${finding.firstFlaggedDay}`,
    kind: finding.kind,
    day: viewDay,
    severity,
    domains: finding.domains,
    indicators: finding.indicators,
    title: buildTitle(finding),
    observation: buildObservation(finding, analysis),
    evidence,
    uncertainty: {
      tier: finding.evidenceStrength,
      statement: uncertaintyStatement(finding.evidenceStrength, finding.dataQualityPoor),
      missingInfo: buildMissingInfo(finding, analysis, questions),
    },
    nextMeasurements,
    recommendedActions: actions,
    escalation: buildEscalation(severity, ctx),
    sourceIds: collectSourceIds(entries, finding.indicators),
    hasRestTimer,
    hasBreathingPacer,
  };
}

function buildEarlySignalCard(
  indicatorId: IndicatorId,
  analysis: AnalysisResult,
  ctx: MissionContext,
  viewDay: number,
): AlertCard {
  const meta = getIndicator(indicatorId);
  const indicator = analysis.indicators[indicatorId];
  const key = libraryKeyForIndicator(indicatorId, indicator.lastZ);
  const entry = LIBRARY[key];
  const questions = entry ? [...entry.questions] : [];
  const poor = indicator.dataQuality === 'poor';
  if (poor) questions.push(`Missing readings: ${meta.label}`);

  const latest = observedPoints(indicator.points).slice(-1)[0];
  const observation =
    latest === undefined
      ? `${meta.label} is worth attention. Keep logging.`
      : `${meta.label} is worth attention: ${valueText(latest.value, meta)} on day ${latest.day}, beyond your usual range.`;

  const actions = entry ? resolveActions(entry.actions.slice(0, 5), ctx) : [];
  const { hasRestTimer, hasBreathingPacer } = detectProcedures(actions);

  return {
    id: `early_signal:${indicatorId}:${indicator.onsetDay ?? viewDay}`,
    kind: 'early_signal',
    day: viewDay,
    severity: 'watch',
    domains: [meta.domain],
    indicators: [indicatorId],
    title: `${meta.label}: worth watching`,
    observation,
    evidence: [buildEvidenceItem(indicatorId, analysis)],
    uncertainty: {
      tier: 'low',
      statement: uncertaintyStatement('low', poor),
      missingInfo: questions,
    },
    nextMeasurements: entry ? [...entry.nextMeasurements] : [],
    recommendedActions: actions,
    escalation: buildEscalation('watch', ctx),
    sourceIds: collectSourceIds(entry ? [entry] : [], [indicatorId]),
    hasRestTimer,
    hasBreathingPacer,
  };
}

/**
 * Build alert cards from an analysis result and the mission context.
 * Sorted by severity (urgent, review, watch, info), then day descending, then id.
 * Multi-signal patterns consolidate co-occurring single-indicator findings into supportingSignals.
 */
export function buildAlertCards(analysis: AnalysisResult, ctx: MissionContext): AlertCard[] {
  if (!analysis.baselineReady) return [];

  const viewDay = analysis.upToDay;

  // Identify pattern clusters to avoid duplicate cards for indicators already grouped
  const patternFindings = analysis.findings.filter((f) => f.kind === 'multi_signal_pattern');
  const clusterIndicatorIds = new Set<IndicatorId>(
    patternFindings.flatMap((f) => f.indicators),
  );

  const cards: AlertCard[] = [];

  for (const finding of analysis.findings) {
    // If it's a single-indicator persistent_change finding whose indicator is already part of a multi_signal_pattern cluster,
    // fold it into the pattern card rather than creating a separate alert card wall.
    if (
      finding.kind === 'persistent_change' &&
      finding.indicators.length === 1 &&
      clusterIndicatorIds.has(finding.indicators[0]!)
    ) {
      continue;
    }

    const card = buildCardFromFinding(finding, analysis, ctx, viewDay);
    if (finding.kind === 'multi_signal_pattern') {
      card.supportingSignals = buildSupportingSignals(finding.indicators, analysis);
      card.clusterKey = finding.id;
    }
    cards.push(card);
  }

  const covered = new Set<IndicatorId>([
    ...analysis.findings.flatMap((finding) => finding.indicators),
    ...clusterIndicatorIds,
  ]);
  for (const meta of INDICATORS) {
    const indicator: IndicatorStatus = analysis.indicators[meta.id].status;
    if (indicator === 'watch' && !covered.has(meta.id)) {
      cards.push(buildEarlySignalCard(meta.id, analysis, ctx, viewDay));
    }
  }

  const severityOrder: Record<SeverityLevel, number> = {
    urgent: 0,
    review: 1,
    watch: 2,
    info: 3,
  };
  cards.sort((a, b) => {
    const bySeverity = severityOrder[a.severity] - severityOrder[b.severity];
    if (bySeverity !== 0) return bySeverity;
    if (b.day !== a.day) return b.day - a.day;
    return a.id.localeCompare(b.id);
  });

  return cards;
}
