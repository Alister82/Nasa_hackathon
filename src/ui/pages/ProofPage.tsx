import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  FlaskConical,
  Info,
  ShieldCheck,
  Terminal,
  TriangleAlert,
} from '@/ui/components/icons';
import type { ResultsFile, SystemId } from '@/contracts/types';
import { loadResults } from '@/app/services';
import { ProofChart } from '@/ui/charts/ProofChart';
import { PageHeader, SectionHeading, TextLink } from '@/ui/components/ui';

const SYSTEM_LABELS: Record<SystemId, string> = {
  vigil: 'Vigil',
  threshold: 'Fixed thresholds',
  zscore: 'Rolling z-score',
};

const SYSTEMS: SystemId[] = ['vigil', 'threshold', 'zscore'];

const SYSTEM_TONE: Record<SystemId, string> = {
  vigil: 'bg-instrument',
  threshold: 'bg-status-watch',
  zscore: 'bg-status-review',
};

export function ProofPage() {
  const [results, setResults] = useState<ResultsFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadResults()
      .then((data) => {
        if (active) {
          setResults(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setResults(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="panel mx-auto max-w-xl px-6 py-12 text-center" role="status">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[12px] bg-instrument-soft text-instrument">
            <Activity className="h-5 w-5 animate-pulse" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink">Loading evaluation results…</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="page-wrap">
        <div className="mx-auto max-w-xl">
          <div className="panel px-6 py-10 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[12px] bg-status-watch-soft text-status-watch">
              <TriangleAlert className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-ink">
              Proof results
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Results file not found. Run the harness and rebuild.
            </p>
            <code className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface2 px-3 py-1.5 font-mono text-[0.72rem] text-ink">
              <Terminal className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
              npm run harness
            </code>
          </div>
        </div>
      </div>
    );
  }

  const seedCount = results.evaluationSeeds.end - results.evaluationSeeds.start + 1;
  const start = results.evaluationSeeds.start;
  const end = results.evaluationSeeds.end;
  const tuningStart = results.tuningSeeds.start;
  const tuningEnd = results.tuningSeeds.end;
  const totalCrews = results.scenarios.reduce((sum, scenario) => sum + scenario.seedCount, 0);

  const aggregate = SYSTEMS.map((systemId) => {
    const metrics = results.scenarios
      .map((scenario) => scenario.systems[systemId])
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    const detected = metrics.reduce((sum, entry) => sum + entry.detectedCount, 0);
    const events = metrics.reduce((sum, entry) => sum + entry.eventCount, 0);
    const falseRate =
      metrics.length > 0
        ? metrics.reduce((sum, entry) => sum + entry.falseAlarmsPer100Days, 0) / metrics.length
        : 0;
    return {
      systemId,
      label: SYSTEM_LABELS[systemId],
      detected,
      events,
      falseRate,
      detectionRate: events > 0 ? (detected / events) * 100 : null,
    };
  });

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker="Verification"
        title="Algorithmic proof & verification"
        description={
          <>
            {seedCount} simulated crews per scenario, seeds {start} to {end}. Detector settings
            were tuned on separate seeds ({tuningStart} to {tuningEnd}). Results are on simulated
            data and do not show medical validity.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">
              <FlaskConical className="h-3 w-3" aria-hidden="true" />
              {results.scenarios.length} scenarios
            </span>
            <span className="chip chip-neutral">{totalCrews.toLocaleString()} crew runs</span>
            <span className="chip chip-neutral">{results.missionDays}-day missions</span>
            <span className="chip chip-neutral">{results.missionSetting.replace(/_/g, ' ')}</span>
          </>
        }
        actions={<TextLink to="/lab">Open Scenario Lab</TextLink>}
      />

      <section aria-label="Evaluation summary" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {aggregate.map((system) => (
          <article key={system.systemId} className="panel px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold text-ink">
                <span className={['h-2 w-2 rounded-full', SYSTEM_TONE[system.systemId]].join(' ')} aria-hidden="true" />
                {system.label}
              </span>
              <span className="chip chip-neutral !py-0.5 !text-[0.54rem]">all scenarios</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  Detection
                </p>
                <p className="metric-number text-[1.15rem] leading-tight">
                  {system.detectionRate === null ? '—' : `${system.detectionRate.toFixed(0)}%`}
                </p>
                <p className="text-[0.55rem] tabular-nums text-ink-soft">
                  {system.detected}/{system.events} events
                </p>
              </div>
              <div>
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  False alarms
                </p>
                <p className="metric-number text-[1.15rem] leading-tight">
                  {system.falseRate.toFixed(2)}
                </p>
                <p className="text-[0.55rem] text-ink-soft">avg / 100 days</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section aria-label="What this means" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-[18px] border border-status-ok/25 bg-status-ok-soft/45 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-ok" aria-hidden="true" />
            <h2 className="text-[0.8rem] font-semibold text-ink">What this shows</h2>
          </div>
          <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ink-2">
            How each detector behaves on the same simulated scenarios, seeds, and mission length.
            Detection timing, missed events, and false-alarm rates are reported together so the
            trade-offs stay visible.
          </p>
        </div>
        <div className="rounded-[18px] border border-status-watch/25 bg-status-watch-soft/45 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-status-watch" aria-hidden="true" />
            <h2 className="text-[0.8rem] font-semibold text-ink">What this does not show</h2>
          </div>
          <p className="mt-1.5 text-[0.7rem] leading-relaxed text-ink-2">
            Clinical validity, diagnostic accuracy, or performance on real astronaut data. The
            simulator and reference ranges are illustrative, and tuning seeds are kept separate
            from evaluation seeds.
          </p>
        </div>
      </section>

      <section aria-label="Scenario results" className="flex flex-col gap-3">
        <SectionHeading
          title="Scenario results"
          subtitle="Median detection delay and false-alarm rate for each detector, with the full numerical table."
          action={
            <span className="chip chip-neutral">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Seeds {start}–{end}
            </span>
          }
        />
        <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
          {results.scenarios.map((scenario) => (
            <ProofChart key={scenario.scenarioId} scenario={scenario} labels={SYSTEM_LABELS} />
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-line bg-surface2 px-4 py-3 text-[0.64rem] text-ink-soft">
        <span>
          Simulated evaluation only. Not a medical-device validation and not a clinical claim.
        </span>
        <Link to="/about" className="font-semibold text-instrument hover:underline">
          Read scope and limits
        </Link>
      </footer>
    </div>
  );
}
