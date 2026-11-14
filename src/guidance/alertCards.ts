/**
 * G5: alertCards.ts
 * buildAlertCards per ARCHITECTURE.md 7.4 and 7.5.
 *
 * Maps AnalysisResult and MissionContext to AlertCard[]:
 * - Severity mapping
 * - Escalation matrix for every severity and mission setting
 * - Reply-time text using 2 x oneWayDelay + 10 minutes for deep_space
 * - Supply fallback (requiresSupply / alternativeText)
 * - Merging for pattern cards with a cap of 5 actions (first action of each key first)
 * - Deterministic ids and ordering (urgent > review > watch > info, then day desc, then id asc)
 * - Invariants: non-empty fields, valid sourceIds, no forbidden words
 */
import type {
  ActionItem,
  AlertCard,
  AnalysisResult,
  EvidenceItem,
  Finding,
  FindingKind,
  IndicatorId,
  MissionContext,
  MissionSettingId,
  SeverityLevel,
  SupplyId,
} from '@/contracts/types';
import { getIndicator, INDICATOR_IDS } from '@/contracts/indicators';
import { LIBRARY, libraryKeyForIndicator, type LibraryAction } from './library';
import { REFERENCE_RANGES } from './referenceRanges';
import { SOURCES } from './sources';
import { expectedReplyMinutes } from './missionSettings';

// ── Severity Mapping (ARCHITECTURE 7.4) ──────────────────────────────────────

export function cardSeverity(kind: FindingKind | 'early_signal', urgent = false): SeverityLevel {
  if (kind === 'hard_threshold') {
    return urgent ? 'urgent' : 'watch';
  }
  switch (kind) {
    case 'expected_adaptation':
      return 'info';
    case 'early_signal':
    case 'isolated_spike':
    case 'data_quality_issue':
      return 'watch';
    case 'persistent_change':
    case 'multi_signal_pattern':
    case 'radiation_event':
      return 'review';
  }
}

// ── Escalation Matrix (ARCHITECTURE 7.4) ─────────────────────────────────────

export function getEscalation(
  severity: SeverityLevel,
  setting: MissionSettingId,
): AlertCard['escalation'] {
  if (severity === 'info') {
    return {
      level: 'self_manage',
      text: 'No action needed. Keep logging.',
      expectedReplyMinutes: null,
    };
  }

  if (severity === 'watch') {
    if (setting === 'deep_space') {
      return {
        level: 'self_manage',
        text: 'Try the steps below and include this in your next scheduled report.',
        expectedReplyMinutes: null,
      };
    }
    return {
      level: 'report_to_ground',
      text: 'Log it and mention it at your next scheduled ground conference.',
      expectedReplyMinutes: null,
    };
  }

  if (severity === 'review') {
    if (setting === 'deep_space') {
      const delay = expectedReplyMinutes('deep_space');
      return {
        level: 'report_to_ground',
        text: `Start the steps below now. Send a report to the flight surgeon; a reply may take at least ${delay} minutes.`,
        expectedReplyMinutes: delay,
      };
    }
    return {
      level: 'contact_ground_now',
      text: 'Ask the flight surgeon for a call today. Start the steps below while you wait.',
      expectedReplyMinutes: null,
    };
  }

  // urgent
  if (setting === 'deep_space') {
    return {
      level: 'urgent_now',
      text: 'Contact the crew medical officer now and send an urgent report to ground. Do not wait for a reply to start emergency procedures.',
      expectedReplyMinutes: null,
    };
  }
  return {
    level: 'urgent_now',
    text: 'Contact the crew medical officer and ground now. Follow your emergency procedures.',
    expectedReplyMinutes: null,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

function resolveLibraryKey(indicatorId: IndicatorId, recentAvg?: number): string | null {
  if (indicatorId === 'glucose') {
    if (recentAvg !== undefined && recentAvg < 70) return 'glucose:low';
    return 'glucose:high';
  }
  return libraryKeyForIndicator(indicatorId);
}

function computeEvidence(
  indicatorId: IndicatorId,
  analysis: AnalysisResult,
): EvidenceItem {
  const meta = getIndicator(indicatorId);
  const indAnalysis = analysis.indicators[indicatorId];
  const baseline = analysis.baselines[indicatorId];

  const points = indAnalysis?.points ?? [];
  const observed = points.filter((p) => p.value !== null);
  const last7 = observed.slice(-7);
  const days = last7.map((p) => p.day);

  const baselineStr = baseline !== null && baseline !== undefined
    ? `${formatValue(baseline.median, meta.decimals)} ${meta.unit}`
    : 'not established';

  let avg = 0;
  if (last7.length > 0) {
    const sum = last7.reduce((acc, p) => acc + (p.value ?? 0), 0);
    avg = sum / last7.length;
  }
  const avgStr = `${formatValue(avg, meta.decimals)} ${meta.unit}`;

  // Count days beyond usual range
  let k = 0;
  for (const p of last7) {
    if (meta.method === 'rule') {
      if ((p.value ?? 0) > 1.5 * 1.8) k++;
    } else if (p.z !== null) {
      if (meta.concernDirection === 'up' && p.z >= 0.75) k++;
      else if (meta.concernDirection === 'down' && p.z <= -0.75) k++;
      else if (meta.concernDirection === 'both' && Math.abs(p.z) >= 0.75) k++;
    }
  }

  const text = `${meta.label}: pre-flight ${baselineStr}, last 7 days ${avgStr}, ${k} of the last 7 days beyond your usual range.`;

  return {
    indicatorId,
    text,
    days,
  };
}

function buildActions(
  libraryActions: LibraryAction[],
  supplies: Record<SupplyId, boolean>,
): ActionItem[] {
  return libraryActions.map((a) => {
    const req = a.supply;
    if (req) {
      const available = supplies[req] ?? false;
      return {
        id: a.id,
        text: a.text,
        requiresSupply: req,
        supplyAvailable: available,
        alternativeText: a.alternative ?? 'Alternative procedure not specified.',
      };
    }
    return {
      id: a.id,
      text: a.text,
      supplyAvailable: true,
      alternativeText: a.alternative,
    };
  });
}

function mergePatternActions(
  keys: string[],
  supplies: Record<SupplyId, boolean>,
): ActionItem[] {
  const entries = keys.map((k) => LIBRARY[k]).filter((e): e is NonNullable<typeof e> => e !== undefined);
  const selected: LibraryAction[] = [];
  const seenTexts = new Set<string>();

  // First action of each key first
  for (const entry of entries) {
    const first = entry.actions[0];
    if (first && !seenTexts.has(first.text)) {
      seenTexts.add(first.text);
      selected.push(first);
    }
  }

  // Then remaining actions until cap of 5
  for (const entry of entries) {
    for (let i = 1; i < entry.actions.length; i++) {
      if (selected.length >= 5) break;
      const act = entry.actions[i];
      if (act && !seenTexts.has(act.text)) {
        seenTexts.add(act.text);
        selected.push(act);
      }
    }
    if (selected.length >= 5) break;
  }

  return buildActions(selected.slice(0, 5), supplies);
}

function getCardTitle(kind: FindingKind | 'early_signal', indicators: IndicatorId[]): string {
  if (kind === 'multi_signal_pattern') return 'Multi-signal pattern';
  if (kind === 'radiation_event') return 'Radiation exposure event';
  if (kind === 'hard_threshold') return 'Urgent reading threshold';

  const first = indicators[0];
  const meta = first ? getIndicator(first) : null;
  const label = meta ? meta.label : 'Health indicator';

  switch (kind) {
    case 'persistent_change':
      return `${label} shift`;
    case 'isolated_spike':
      return `Isolated spike: ${label.toLowerCase()}`;
    case 'data_quality_issue':
      return `Data quality: ${label.toLowerCase()}`;
    case 'expected_adaptation':
      return `Expected adaptation: ${label.toLowerCase()}`;
    case 'early_signal':
      return `Early signal: ${label.toLowerCase()}`;
  }
}

// ── buildAlertCards ──────────────────────────────────────────────────────────

export function buildAlertCards(
  analysis: AnalysisResult,
  ctx: MissionContext,
): AlertCard[] {
  const cards: AlertCard[] = [];
  const findingIndicators = new Set<IndicatorId>();

  // 1. Cards from analysis findings
  for (const finding of analysis.findings) {
    for (const ind of finding.indicators) {
      findingIndicators.add(ind);
    }

    const severity = cardSeverity(finding.kind, finding.urgent);
    const escalation = getEscalation(severity, ctx.setting);
    const title = getCardTitle(finding.kind, finding.indicators);

    // Observation
    let observation = '';
    if (finding.kind === 'multi_signal_pattern') {
      const labels = finding.indicators.map((id) => getIndicator(id).label).join(', ');
      const earliestOnset = finding.onsetDay ?? analysis.upToDay;
      observation = `${finding.indicators.length} measures have shifted together since about day ${earliestOnset}: ${labels}.`;
    } else {
      const indId = finding.indicators[0] ?? 'heart_rate';
      const meta = getIndicator(indId);
      const baseline = analysis.baselines[indId];
      const indAnalysis = analysis.indicators[indId];

      const points = indAnalysis?.points ?? [];
      const observed = points.filter((p) => p.value !== null);
      const last7 = observed.slice(-7);
      let recentAvg = 0;
      if (last7.length > 0) {
        recentAvg = last7.reduce((acc, p) => acc + (p.value ?? 0), 0) / last7.length;
      }
      const baseVal = baseline?.median ?? recentAvg;
      const direction = recentAvg >= baseVal ? 'risen' : 'fallen';
      const onset = finding.onsetDay ?? indAnalysis?.onsetDay ?? analysis.upToDay;

      observation = `${meta.label} has ${direction} from your pre-flight baseline since about day ${onset}: ${formatValue(baseVal, meta.decimals)} → ${formatValue(recentAvg, meta.decimals)} ${meta.unit} (average of the last 7 days).`;
    }

    // Evidence
    const evidence: EvidenceItem[] = finding.indicators.map((id) => computeEvidence(id, analysis));

    // Uncertainty
    const tier = finding.evidenceStrength;
    let statement = '';
    if (tier === 'low') {
      statement = 'Only one measure has changed. This alone cannot show a cause.';
    } else if (tier === 'moderate') {
      statement = 'Two measures have changed together. The cause is still unclear.';
    } else {
      statement = 'Several measures have changed together. A cause cannot be named from this data.';
    }
    if (finding.dataQualityPoor) {
      statement += ' Some recent readings are missing, which lowers confidence.';
    }

    // Missing info & next measurements & actions & sources
    let missingInfo: string[] = [];
    let nextMeasurements: string[] = [];
    let actions: ActionItem[] = [];
    const sourceIdSet = new Set<string>();

    if (finding.kind === 'hard_threshold') {
      actions = [
        {
          id: 'urgent_1',
          text: 'Follow your emergency medical procedures and contact the crew medical officer now.',
          supplyAvailable: true,
        },
      ];
      if (finding.indicators.includes('glucose')) {
        sourceIdSet.add('src_ada_glucose');
      } else {
        sourceIdSet.add('src_aha_acc_bp');
      }
    } else if (finding.kind === 'multi_signal_pattern') {
      const keys = finding.indicators
        .map((id) => resolveLibraryKey(id))
        .filter((k): k is string => k !== null);

      actions = mergePatternActions(keys, ctx.supplies);

      for (const k of keys) {
        const entry = LIBRARY[k];
        if (entry) {
          missingInfo.push(...entry.questions);
          nextMeasurements.push(...entry.nextMeasurements);
          for (const s of entry.sourceIds) sourceIdSet.add(s);
        }
      }
    } else {
      const indId = finding.indicators[0];
      const key = indId ? resolveLibraryKey(indId) : null;
      const entryKey = finding.kind === 'radiation_event'
        ? 'radiation_event'
        : finding.kind === 'isolated_spike'
          ? 'isolated_spike'
          : finding.kind === 'data_quality_issue'
            ? 'data_quality_issue'
            : key;

      const entry = entryKey ? LIBRARY[entryKey] : undefined;
      if (entry) {
        actions = buildActions(entry.actions.slice(0, 5), ctx.supplies);
        missingInfo = [...entry.questions];
        nextMeasurements = [...entry.nextMeasurements];
        for (const s of entry.sourceIds) sourceIdSet.add(s);
      }
    }

    // Reference range sources
    for (const indId of finding.indicators) {
      const rr = REFERENCE_RANGES[indId];
      if (rr) {
        for (const s of rr.sourceIds) sourceIdSet.add(s);
      }
    }

    // Poor quality indicators list in missingInfo
    const poorQualityLabels = finding.indicators
      .filter((id) => analysis.indicators[id]?.dataQuality === 'poor')
      .map((id) => getIndicator(id).label);
    if (poorQualityLabels.length > 0) {
      missingInfo.push(`Missing readings: ${poorQualityLabels.join(', ')}`);
    }

    // Invariant 3: at least 1 source id that exists in SOURCES
    if (sourceIdSet.size === 0) {
      sourceIdSet.add('src_general_clinical');
    }
    const sourceIds = Array.from(sourceIdSet).filter((s) => s in SOURCES);
    if (sourceIds.length === 0) {
      sourceIds.push('src_general_clinical');
    }

    cards.push({
      id: finding.id,
      kind: finding.kind,
      day: analysis.upToDay,
      severity,
      domains: finding.domains,
      indicators: finding.indicators,
      title,
      observation,
      evidence,
      uncertainty: {
        tier,
        statement,
        missingInfo: Array.from(new Set(missingInfo)),
      },
      nextMeasurements: Array.from(new Set(nextMeasurements)),
      recommendedActions: actions,
      escalation,
      sourceIds,
    });
  }

  // 2. Early signal cards for indicators with status === 'watch' that are not in any finding
  for (const indId of INDICATOR_IDS) {
    const indAnalysis = analysis.indicators[indId];
    if (indAnalysis && indAnalysis.status === 'watch' && !findingIndicators.has(indId)) {
      const meta = getIndicator(indId);
      const severity: SeverityLevel = 'watch';
      const escalation = getEscalation(severity, ctx.setting);
      const onset = indAnalysis.onsetDay ?? analysis.upToDay;
      const cardId = `early_signal:${indId}:${onset}`;
      const title = `Early signal: ${meta.label.toLowerCase()}`;

      const baseline = analysis.baselines[indId];
      const points = indAnalysis.points.filter((p) => p.value !== null);
      const last7 = points.slice(-7);
      let recentAvg = 0;
      if (last7.length > 0) {
        recentAvg = last7.reduce((acc, p) => acc + (p.value ?? 0), 0) / last7.length;
      }
      const baseVal = baseline?.median ?? recentAvg;
      const direction = recentAvg >= baseVal ? 'risen' : 'fallen';
      const observation = `${meta.label} has ${direction} from your pre-flight baseline since about day ${onset}: ${formatValue(baseVal, meta.decimals)} → ${formatValue(recentAvg, meta.decimals)} ${meta.unit} (average of the last 7 days).`;

      const evidence = [computeEvidence(indId, analysis)];
      const tier = 'low';
      let statement = 'Only one measure has changed. This alone cannot show a cause.';
      if (indAnalysis.dataQuality === 'poor') {
        statement += ' Some recent readings are missing, which lowers confidence.';
      }

      const key = resolveLibraryKey(indId, recentAvg);
      const entry = key ? LIBRARY[key] : undefined;
      const actions = entry ? buildActions(entry.actions.slice(0, 5), ctx.supplies) : [];
      const missingInfo = entry ? [...entry.questions] : [];
      const nextMeasurements = entry ? [...entry.nextMeasurements] : [];

      const sourceIdSet = new Set<string>();
      if (entry) {
        for (const s of entry.sourceIds) sourceIdSet.add(s);
      }
      const rr = REFERENCE_RANGES[indId];
      if (rr) {
        for (const s of rr.sourceIds) sourceIdSet.add(s);
      }
      if (sourceIdSet.size === 0) sourceIdSet.add('src_general_clinical');
      const sourceIds = Array.from(sourceIdSet).filter((s) => s in SOURCES);

      cards.push({
        id: cardId,
        kind: 'early_signal',
        day: analysis.upToDay,
        severity,
        domains: [meta.domain],
        indicators: [indId],
        title,
        observation,
        evidence,
        uncertainty: {
          tier,
          statement,
          missingInfo,
        },
        nextMeasurements,
        recommendedActions: actions,
        escalation,
        sourceIds,
      });
    }
  }

  // 3. Sort cards: severity (urgent, review, watch, info), then day descending, then id ascending
  const severityRank: Record<SeverityLevel, number> = {
    urgent: 4,
    review: 3,
    watch: 2,
    info: 1,
  };

  cards.sort((a, b) => {
    const sDiff = severityRank[b.severity] - severityRank[a.severity];
    if (sDiff !== 0) return sDiff;
    const dDiff = b.day - a.day;
    if (dDiff !== 0) return dDiff;
    return a.id.localeCompare(b.id);
  });

  return cards;
}
