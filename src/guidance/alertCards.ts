import type {
  AnalysisResult,
  AlertCard,
  MissionContext,
  Finding,
  FindingKind,
  SeverityLevel,
  EscalationLevel,
  Escalation,
  EvidenceItem,
  ActionItem,
  IndicatorId,
  EvidenceStrength,
  IndicatorStatus,
} from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { LIBRARY, type LibraryEntry } from './library';
import { SOURCES } from './sources';
import { MISSION_SETTINGS, expectedReplyMinutes } from './missionSettings';

// Alert card construction per ARCHITECTURE.md 7.4 and 7.5.
// No invented text, numbers, or guidance beyond what is in the library and ARCHITECTURE.md.

// ── Severity mapping ──────────────────────────────────────────────────────────
// ARCHITECTURE.md 7.4: card severity by finding kind.
function findingSeverity(kind: Finding['kind']): SeverityLevel {
  switch (kind) {
    case 'expected_adaptation': return 'info';
    case 'isolated_spike':
    case 'data_quality_issue': return 'watch';
    case 'persistent_change':
    case 'multi_signal_pattern':
    case 'radiation_event': return 'review';
    case 'hard_threshold': return 'urgent'; // only urgent ones appear as findings
    default: {
      const _x: never = kind;
      return _x;
    }
  }
}

// Early-signal severity: watch (indicator at watch, no finding; built in buildAlertCards below).

// ── Escalation matrix ─────────────────────────────────────────────────────────
// Exact text from ARCHITECTURE.md 7.4 table.
function buildEscalation(severity: SeverityLevel, ctx: MissionContext): Escalation {
  const setting = ctx.setting;
  const replyMin = expectedReplyMinutes(setting);

  // Compute delay string for deep_space review cards.
  const delayStr = String(replyMin);

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
    // deep_space
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
    // deep_space — {N} replaced per ARCHITECTURE.md 7.4
    return {
      level: 'report_to_ground',
      text: `Start the steps below now. Send a report to the flight surgeon; a reply may take at least ${delayStr} minutes.`,
      expectedReplyMinutes: replyMin,
    };
  }

  // urgent
  if (setting === 'station' || setting === 'lunar_base') {
    return {
      level: 'urgent_now',
      text: 'Contact the crew medical officer and ground now. Follow your emergency procedures.',
      expectedReplyMinutes: null,
    };
  }
  // deep_space urgent
  return {
    level: 'urgent_now',
    text: 'Contact the crew medical officer now and send an urgent report to ground. Do not wait for a reply to start emergency procedures.',
    expectedReplyMinutes: null,
  };
}

// ── Evidence items ─────────────────────────────────────────────────────────────
// ARCHITECTURE.md 7.5: one EvidenceItem per indicator.
// text: "{label}: pre-flight {baseline}, last 7 days {avg}, {k} of the last 7 days beyond your usual range."
// days: the last 7 observed days used.
function buildEvidenceItem(
  indicatorId: IndicatorId,
  analysis: AnalysisResult,
): EvidenceItem {
  const meta = INDICATORS.find((i) => i.id === indicatorId);
  const label = meta?.label ?? indicatorId;
  const unit = meta?.unit ?? '';
  const dec = meta?.decimals ?? 1;

  const baseline = analysis.baselines[indicatorId];
  const indAnalysis = analysis.indicators[indicatorId];
  const points = indAnalysis?.points ?? [];

  // Last 7 observed days.
  const observedPoints = points.filter((p) => p.value !== null);
  const last7 = observedPoints.slice(-7);
  const days = last7.map((p) => p.day);

  // Average of last 7 observed values.
  const values = last7.map((p) => p.value as number);
  const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;

  // Count of days where z in the concern direction ≥ 0.75 (approximate "beyond usual range").
  const direction = meta?.concernDirection ?? 'up';
  let kBeyond = 0;
  for (const p of last7) {
    const z = p.z;
    if (z === null) continue;
    if (direction === 'up' && z >= 0.75) kBeyond++;
    else if (direction === 'down' && z <= -0.75) kBeyond++;
    else if (direction === 'both' && Math.abs(z) >= 0.75) kBeyond++;
  }

  const baselineStr = baseline
    ? `${baseline.median.toFixed(dec)} ${unit}`
    : 'unknown';
  const avgStr = avg !== null ? `${avg.toFixed(dec)} ${unit}` : 'unknown';

  const text =
    `${label}: pre-flight ${baselineStr}, last 7 days ${avgStr}, ` +
    `${kBeyond} of the last 7 days beyond your usual range.`;

  return { indicatorId, text, days };
}

// ── Uncertainty statement ──────────────────────────────────────────────────────
// ARCHITECTURE.md 7.5 verbatim.
function uncertaintyStatement(tier: EvidenceStrength, dataQualityPoor: boolean): string {
  let stmt: string;
  if (tier === 'low') {
    stmt = 'Only one measure has changed. This alone cannot show a cause.';
  } else if (tier === 'moderate') {
    stmt = 'Two measures have changed together. The cause is still unclear.';
  } else {
    stmt = 'Several measures have changed together. A cause cannot be named from this data.';
  }
  if (dataQualityPoor) {
    stmt += ' Some recent readings are missing, which lowers confidence.';
  }
  return stmt;
}

// ── Action items with supply resolution ──────────────────────────────────────
function resolveActions(
  actions: LibraryEntry['actions'],
  ctx: MissionContext,
): ActionItem[] {
  return actions.map((a) => {
    if (a.requiresSupply) {
      const avail = ctx.supplies[a.requiresSupply] ?? true;
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
      requiresSupply: undefined,
      alternativeText: undefined,
    };
  });
}

// ── Library key lookup for indicators ────────────────────────────────────────
// Maps an indicator + finding context to the library key.
function libraryKeyForIndicator(indicatorId: IndicatorId): string | null {
  switch (indicatorId) {
    case 'heart_rate': return 'heart_rate:up';
    case 'bp_sys':
    case 'bp_dia': return 'bp:up';
    case 'body_temp': return 'body_temp:up';
    case 'glucose': {
      // We'll default to glucose:high for elevated; caller may pass 'low'.
      return 'glucose:high';
    }
    case 'sleep_hours': return 'sleep_hours:down';
    case 'exercise_minutes': return 'exercise_minutes:down';
    case 'mood':
    case 'stress':
    case 'energy': return 'behavioral:support';
    case 'radiation_dose': return 'radiation_event';
    default: return null;
  }
}

// Return the appropriate glucose key based on the last value vs. baseline.
function glucoseKey(analysis: AnalysisResult): string {
  const indA = analysis.indicators['glucose'];
  const baseline = analysis.baselines['glucose'];
  const lastVal = indA?.lastValue;
  if (lastVal !== null && lastVal !== undefined && baseline) {
    if (lastVal < baseline.median) return 'glucose:low';
  }
  return 'glucose:high';
}

// ── Observation text ──────────────────────────────────────────────────────────
// ARCHITECTURE.md 7.5 template.
function buildObservation(finding: Finding, analysis: AnalysisResult): string {
  if (finding.kind === 'multi_signal_pattern') {
    const n = finding.indicators.length;
    const labels = finding.indicators.map((id) => {
      const meta = INDICATORS.find((i) => i.id === id);
      return meta?.label ?? id;
    });
    const earliest = finding.onsetDay;
    return `${n} measures have shifted together since about day ${earliest ?? 'unknown'}: ${labels.join(', ')}.`;
  }

  if (finding.kind === 'isolated_spike' || finding.kind === 'data_quality_issue' || finding.kind === 'expected_adaptation') {
    const id = finding.indicators[0];
    if (!id) return 'An indicator has changed.';
    const meta = INDICATORS.find((i) => i.id === id);
    return `${meta?.label ?? id} has changed recently.`;
  }

  if (finding.kind === 'hard_threshold') {
    const id = finding.indicators[0];
    if (!id) return 'A reading is in the urgent range.';
    const meta = INDICATORS.find((i) => i.id === id);
    return `${meta?.label ?? id} is in the urgent range.`;
  }

  if (finding.kind === 'radiation_event') {
    return 'Radiation dose has risen above the expected rate for the mission setting.';
  }

  // persistent_change — single indicator
  const id = finding.indicators[0];
  if (!id) return 'An indicator has changed.';
  const meta = INDICATORS.find((i) => i.id === id);
  const label = meta?.label ?? id;
  const unit = meta?.unit ?? '';
  const dec = meta?.decimals ?? 1;
  const direction = meta?.concernDirection;

  const baseline = analysis.baselines[id];
  const indA = analysis.indicators[id];
  const points = indA?.points ?? [];
  const observed = points.filter((p) => p.value !== null);
  const last7 = observed.slice(-7);
  const vals = last7.map((p) => p.value as number);
  const recentAvg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  const baselineVal = baseline?.median;

  const roseOrFell = direction === 'down' ? 'fallen' : 'risen';
  const onsetDay = finding.onsetDay ?? 'unknown';
  const baseStr = baselineVal !== undefined ? `${baselineVal.toFixed(dec)} ${unit}` : 'baseline';
  const recentStr = recentAvg !== null ? `${recentAvg.toFixed(dec)} ${unit}` : 'unknown';

  return `${label} has ${roseOrFell} from your pre-flight baseline since about day ${onsetDay}: ${baseStr} → ${recentStr} (average of the last 7 days).`;
}

// ── Missing info ──────────────────────────────────────────────────────────────
function buildMissingInfo(
  finding: Finding,
  analysis: AnalysisResult,
  libraryQuestions: string[],
): string[] {
  const items: string[] = [...libraryQuestions];

  // Add "Missing readings: {labels}" for poor-quality indicators in the finding.
  const poorLabels: string[] = [];
  for (const id of finding.indicators) {
    if (analysis.indicators[id]?.dataQuality === 'poor') {
      const meta = INDICATORS.find((i) => i.id === id);
      poorLabels.push(meta?.label ?? id);
    }
  }
  if (poorLabels.length > 0) {
    items.push(`Missing readings: ${poorLabels.join(', ')}`);
  }
  return items;
}

// ── Merge and cap actions for multi-signal patterns ───────────────────────────
// ARCHITECTURE.md 7.5: merge entries of all member indicators, cap at 5, keeping first action of each key first.
function mergePatternActions(
  indicators: IndicatorId[],
  analysis: AnalysisResult,
  ctx: MissionContext,
): ActionItem[] {
  const seen = new Set<string>();
  const result: ActionItem[] = [];

  for (const id of indicators) {
    const key = id === 'glucose' ? glucoseKey(analysis) : libraryKeyForIndicator(id);
    if (!key) continue;
    const entry = LIBRARY[key];
    if (!entry) continue;
    for (const a of entry.actions) {
      // De-duplicate by text.
      if (seen.has(a.text)) continue;
      seen.add(a.text);
      const resolved = resolveActions([a], ctx);
      result.push(...resolved);
      if (result.length >= 5) return result;
    }
  }
  return result;
}

// ── Collect source ids ────────────────────────────────────────────────────────
function collectSourceIds(libraryEntries: LibraryEntry[], indicatorIds: IndicatorId[]): string[] {
  const ids = new Set<string>();
  for (const e of libraryEntries) {
    for (const s of e.sourceIds) ids.add(s);
  }
  // Add reference-range source ids.
  for (const iid of indicatorIds) {
    // We'll add sources from the indicator's reference range inline.
    // referenceRanges sourceIds are already in the library for most indicators.
    // No additional lookups needed here — library covers it per Appendix A.
    void iid;
  }
  return [...ids].filter((id) => !!SOURCES[id]);
}

// ── Card title ────────────────────────────────────────────────────────────────
function buildTitle(finding: Finding): string {
  if (finding.kind === 'multi_signal_pattern') {
    return 'Multiple measures shifting together';
  }
  if (finding.kind === 'radiation_event') {
    return 'Radiation above expected rate';
  }
  if (finding.kind === 'isolated_spike') {
    const id = finding.indicators[0];
    const meta = INDICATORS.find((i) => i.id === id);
    return `${meta?.label ?? 'Indicator'} spike — confirm reading`;
  }
  if (finding.kind === 'data_quality_issue') {
    const id = finding.indicators[0];
    const meta = INDICATORS.find((i) => i.id === id);
    return `Missing data: ${meta?.label ?? 'indicator'}`;
  }
  if (finding.kind === 'expected_adaptation') {
    const id = finding.indicators[0];
    const meta = INDICATORS.find((i) => i.id === id);
    return `Expected early adaptation: ${meta?.label ?? 'indicator'}`;
  }
  if (finding.kind === 'hard_threshold') {
    const id = finding.indicators[0];
    const meta = INDICATORS.find((i) => i.id === id);
    return `${meta?.label ?? 'Reading'} in urgent range`;
  }
  // persistent_change
  const id = finding.indicators[0];
  const meta = INDICATORS.find((i) => i.id === id);
  const dir = meta?.concernDirection;
  const dirWord = dir === 'down' ? 'falling' : dir === 'both' ? 'shifting' : 'rising';
  return `${meta?.label ?? 'Indicator'} ${dirWord}`;
}

// ── Build a single AlertCard from a Finding ───────────────────────────────────
function buildCardFromFinding(
  finding: Finding,
  analysis: AnalysisResult,
  ctx: MissionContext,
  viewDay: number,
): AlertCard {
  const severity = findingSeverity(finding.kind);

  // Gather library entries for this finding's indicators.
  const libEntries: LibraryEntry[] = [];
  let libActions: ActionItem[] = [];
  let libNextMeasurements: string[] = [];
  let libQuestions: string[] = [];

  if (finding.kind === 'multi_signal_pattern') {
    libActions = mergePatternActions(finding.indicators, analysis, ctx);
    for (const id of finding.indicators) {
      const key = id === 'glucose' ? glucoseKey(analysis) : libraryKeyForIndicator(id);
      if (!key) continue;
      const entry = LIBRARY[key];
      if (!entry) continue;
      libEntries.push(entry);
      for (const q of entry.questions) {
        if (!libQuestions.includes(q)) libQuestions.push(q);
      }
      for (const nm of entry.nextMeasurements) {
        if (!libNextMeasurements.includes(nm)) libNextMeasurements.push(nm);
      }
    }
  } else if (finding.kind === 'hard_threshold') {
    // Determine which urgent key.
    const id = finding.indicators[0];
    const urgentKey = id === 'glucose' ? 'urgent:glucose' : 'urgent:bp';
    const entry = LIBRARY[urgentKey];
    if (entry) {
      libEntries.push(entry);
      libActions = resolveActions(entry.actions, ctx);
      libNextMeasurements = [...entry.nextMeasurements];
      libQuestions = [...entry.questions];
    }
  } else {
    for (const id of finding.indicators) {
      const key = id === 'glucose' ? glucoseKey(analysis) : libraryKeyForIndicator(id);
      if (!key) continue;
      const entry = LIBRARY[key];
      if (!entry) continue;
      libEntries.push(entry);
      for (const q of entry.questions) {
        if (!libQuestions.includes(q)) libQuestions.push(q);
      }
      for (const nm of entry.nextMeasurements) {
        if (!libNextMeasurements.includes(nm)) libNextMeasurements.push(nm);
      }
    }
    if (finding.kind !== 'multi_signal_pattern') {
      const firstEntry = libEntries[0];
      if (firstEntry) {
        libActions = resolveActions(firstEntry.actions, ctx);
      }
    }
  }

  // Evidence items — one per indicator (not for data_quality_issue / expected_adaptation).
  const evidence: EvidenceItem[] = [];
  if (
    finding.kind === 'persistent_change' ||
    finding.kind === 'multi_signal_pattern' ||
    finding.kind === 'radiation_event' ||
    finding.kind === 'hard_threshold' ||
    finding.kind === 'isolated_spike'
  ) {
    for (const id of finding.indicators) {
      evidence.push(buildEvidenceItem(id, analysis));
    }
  }

  // Uncertainty.
  const missingInfo = buildMissingInfo(finding, analysis, libQuestions);
  const tierStatement = uncertaintyStatement(finding.evidenceStrength, finding.dataQualityPoor);

  // Observation.
  const observation = buildObservation(finding, analysis);

  // Escalation.
  const escalation = buildEscalation(severity, ctx);

  // Source ids.
  const sourceIds = collectSourceIds(libEntries, finding.indicators);

  // Card id.
  const cardId = `${finding.kind}:${finding.indicators.join('+')}:${finding.firstFlaggedDay}`;

  return {
    id: cardId,
    kind: finding.kind,
    day: viewDay,
    severity,
    domains: finding.domains,
    indicators: finding.indicators,
    title: buildTitle(finding),
    observation,
    evidence,
    uncertainty: {
      tier: finding.evidenceStrength,
      statement: tierStatement,
      missingInfo,
    },
    nextMeasurements: libNextMeasurements,
    recommendedActions: libActions,
    escalation,
    sourceIds,
  };
}

// ── Early-signal cards (watch-status indicators with no finding) ──────────────
// ARCHITECTURE.md 7.4: "early_signal" (indicator watch, no finding) → watch severity.
// CONTRACTS.md 4.4 AlertCard.kind allows 'early_signal'.
function buildEarlySignalCard(
  indicatorId: IndicatorId,
  analysis: AnalysisResult,
  ctx: MissionContext,
  viewDay: number,
): AlertCard {
  const indA = analysis.indicators[indicatorId];
  const meta = INDICATORS.find((i) => i.id === indicatorId);
  const label = meta?.label ?? indicatorId;
  const severity: SeverityLevel = 'watch';

  const key = libraryKeyForIndicator(indicatorId);
  const entry = key ? LIBRARY[key] : undefined;
  const libActions = entry ? resolveActions(entry.actions.slice(0, 2), ctx) : [];
  const libNextMeasurements = entry?.nextMeasurements ?? [];
  const libQuestions = entry?.questions ?? [];

  const escalation = buildEscalation(severity, ctx);

  const sourceIds = entry ? [...entry.sourceIds].filter((id) => !!SOURCES[id]) : [];

  // Simple observation for early_signal.
  const dir = meta?.concernDirection;
  const dirWord = dir === 'down' ? 'fallen slightly' : dir === 'both' ? 'shifted slightly' : 'risen slightly';
  const observation = `${label} has ${dirWord} from your pre-flight baseline. Continue monitoring.`;

  const onsetDay = indA?.onsetDay;
  const cardId = `early_signal:${indicatorId}:${onsetDay ?? viewDay}`;

  return {
    id: cardId,
    kind: 'early_signal',
    day: viewDay,
    severity,
    domains: [meta?.domain ?? 'metabolic_general'],
    indicators: [indicatorId],
    title: `${label} — early signal`,
    observation,
    evidence: [buildEvidenceItem(indicatorId, analysis)],
    uncertainty: {
      tier: 'low',
      statement: 'Only one measure has changed. This alone cannot show a cause.',
      missingInfo: libQuestions,
    },
    nextMeasurements: libNextMeasurements,
    recommendedActions: libActions,
    escalation,
    sourceIds,
  };
}

// ── Main export: buildAlertCards ──────────────────────────────────────────────
/**
 * Build alert cards from an AnalysisResult and MissionContext.
 * Per ARCHITECTURE.md 7.5: sorted by severity (urgent, review, watch, info), then day descending.
 * Deterministic ids.
 */
export function buildAlertCards(analysis: AnalysisResult, ctx: MissionContext): AlertCard[] {
  if (!analysis.baselineReady) return [];

  const viewDay = analysis.upToDay;
  const cards: AlertCard[] = [];

  // Cards from findings.
  for (const finding of analysis.findings) {
    cards.push(buildCardFromFinding(finding, analysis, ctx, viewDay));
  }

  // Early-signal cards for watch-status indicators not already covered by a finding.
  const coveredIndicators = new Set<IndicatorId>(
    analysis.findings.flatMap((f) => f.indicators as IndicatorId[]),
  );

  for (const [idKey, indA] of Object.entries(analysis.indicators) as [IndicatorId, typeof analysis.indicators[IndicatorId]][]) {
    const status: IndicatorStatus = indA.status;
    if (status === 'watch' && !coveredIndicators.has(idKey)) {
      cards.push(buildEarlySignalCard(idKey, analysis, ctx, viewDay));
    }
  }

  // Sort: urgent > review > watch > info, then day descending.
  const severityOrder: Record<SeverityLevel, number> = { urgent: 0, review: 1, watch: 2, info: 3 };
  cards.sort((a, b) => {
    const sd = severityOrder[a.severity] - severityOrder[b.severity];
    if (sd !== 0) return sd;
    return b.day - a.day;
  });

  return cards;
}

