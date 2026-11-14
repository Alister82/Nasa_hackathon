import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DomainId, IndicatorId } from '@/contracts/types';
import { INDICATORS, DOMAIN_ORDER, DOMAIN_LABELS } from '@/contracts/indicators';
import { SegmentedTabs } from '@/ui/components/SegmentedTabs';
import { MetricTile } from '@/ui/components/MetricTile';
import { RangeGauge } from '@/ui/components/RangeGauge';
import { StatusPill } from '@/ui/components/StatusPill';
import { useAppState } from '@/app/AppState';
import {
  Activity,
  Heart,
  Moon,
  Brain,
  Thermometer,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';

export function HealthMonitorPage() {
  const navigate = useNavigate();
  const { analysis, viewDay, crewName, missionSetting } = useAppState();
  const [selectedTab, setSelectedTab] = useState<'vitals' | 'domains' | 'logs'>('vitals');
  const [activeDrawerIndicator, setActiveDrawerIndicator] = useState<IndicatorId | null>(null);

  if (!analysis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-ink-soft">
        Loading health telemetry...
      </div>
    );
  }

  const selectedDrawerMeta = activeDrawerIndicator
    ? INDICATORS.find((i) => i.id === activeDrawerIndicator)
    : null;
  const selectedDrawerInd = activeDrawerIndicator
    ? analysis.indicators[activeDrawerIndicator]
    : null;
  const selectedDrawerBase = activeDrawerIndicator
    ? analysis.baselines[activeDrawerIndicator]
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              Telemetry Surveillance
            </span>
            <span className="text-xs text-ink-soft">
              Day {viewDay} • {crewName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1">
            Health & Sensor Monitor
          </h1>
        </div>

        <div className="w-full sm:w-auto">
          <SegmentedTabs
            tabs={[
              { id: 'vitals', label: 'Vitals Overview' },
              { id: 'domains', label: 'Physiological Domains' },
              { id: 'logs', label: 'Telemetry Stream' },
            ]}
            selected={selectedTab}
            onChange={(tab) => setSelectedTab(tab as any)}
          />
        </div>
      </div>

      {/* TAB 1: VITALS OVERVIEW */}
      {selectedTab === 'vitals' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INDICATORS.map((meta) => {
              const ind = analysis.indicators[meta.id];
              const base = analysis.baselines[meta.id];
              const points = ind.points.filter((p) => p.value !== null);
              const recent = points.slice(-14).map((p) => p.value);
              const lastVal = ind.lastValue;
              const delta =
                lastVal !== null && base !== undefined ? lastVal - base.median : null;

              let status: 'ok' | 'watch' | 'review' = 'ok';
              if (ind.status === 'flagged') status = 'review';
              else if (ind.status === 'watch') status = 'watch';

              return (
                <div
                  key={meta.id}
                  onClick={() => setActiveDrawerIndicator(meta.id)}
                  className="glass-panel p-4 rounded-2xl border border-line hover:border-accent-primary/40 transition-all cursor-pointer shadow-card space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
                        {meta.domain.replace('_', ' ')}
                      </span>
                      <h3 className="font-bold text-sm text-ink group-hover:text-accent-primary transition-colors">
                        {meta.label}
                      </h3>
                    </div>
                    <StatusPill status={status} size="sm" />
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-ink tabular-nums">
                        {lastVal !== null ? lastVal.toFixed(meta.decimals) : '—'}
                      </span>
                      <span className="text-xs text-ink-soft">{meta.unit}</span>
                    </div>
                    {delta !== null && (
                      <span className="text-xs font-semibold text-ink-soft tabular-nums">
                        {delta > 0 ? '+' : ''}{delta.toFixed(meta.decimals)} from base
                      </span>
                    )}
                  </div>

                  <RangeGauge
                    value={lastVal}
                    baselineRange={[
                      base ? base.median - base.sigma : 0,
                      base ? base.median + base.sigma : 100,
                    ]}
                    min={meta.plausibleMin}
                    max={meta.plausibleMax}
                    unit={meta.unit}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: PHYSIOLOGICAL DOMAINS */}
      {selectedTab === 'domains' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOMAIN_ORDER.map((domainId) => {
            const domainAnalysis = analysis.domains[domainId];
            const domainIndicators = INDICATORS.filter((i) => i.domain === domainId);
            return (
              <div
                key={domainId}
                onClick={() => navigate(`/domain/${domainId}`)}
                className="glass-panel p-5 rounded-2xl border border-line hover:border-accent-primary/50 transition-all cursor-pointer shadow-card space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-ink group-hover:text-accent-primary transition-colors flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent-primary" />
                    <span>{DOMAIN_LABELS[domainId]}</span>
                  </h3>
                  <StatusPill status={domainAnalysis.status === 'flagged' ? 'review' : domainAnalysis.status === 'watch' ? 'watch' : 'ok'} />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {domainIndicators.map((ind) => (
                    <span
                      key={ind.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-panel/80 border border-line/60 text-ink font-medium"
                    >
                      {ind.label}: <strong className="font-bold">{analysis.indicators[ind.id]?.lastValue ?? '—'} {ind.unit}</strong>
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-accent-primary font-semibold">
                  <span>View longitudinal telemetry charts</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* TAB 3: TELEMETRY STREAM */}
      {selectedTab === 'logs' && (
        <section className="glass-panel p-5 rounded-3xl border border-line shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent-primary" />
              <span>Simulated Sensor & Ground Telemetry Packets</span>
            </h3>
            <span className="text-xs text-ink-soft">Day 1 to Day {viewDay}</span>
          </div>

          <div className="divide-y divide-line/60 rounded-2xl bg-panel/60 border border-line/70 overflow-hidden text-xs">
            {analysis.indicators.heart_rate.points.slice(-10).reverse().map((pt) => (
              <div key={pt.day} className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink">Day {pt.day}</span>
                  <span className="text-ink-soft">HR: {pt.value ?? '—'} bpm</span>
                  <span className="text-ink-soft">Sys BP: {analysis.indicators.bp_sys.points.find((p) => p.day === pt.day)?.value ?? '—'} mmHg</span>
                </div>
                <span className="text-[11px] font-semibold text-accent-teal px-2 py-0.5 rounded bg-accent-teal/10">
                  Telemetry Synced
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Side Drawer for Indicator Inspection */}
      {activeDrawerIndicator && selectedDrawerMeta && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-panel p-6 shadow-2xl border-l border-line flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="space-y-0.5">
                  <span className="text-xs uppercase font-semibold text-ink-soft">
                    Sensor Telemetry Inspection
                  </span>
                  <h2 className="text-lg font-bold text-ink">{selectedDrawerMeta.label}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawerIndicator(null)}
                  className="p-2 rounded-lg hover:bg-ceramic text-ink-soft hover:text-ink min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-ceramic/40 border border-line space-y-1">
                  <span className="text-xs text-ink-soft">Latest Observed Value:</span>
                  <div className="text-2xl font-bold text-ink tabular-nums">
                    {selectedDrawerInd?.lastValue ?? '—'} {selectedDrawerMeta.unit}
                  </div>
                  {selectedDrawerBase && (
                    <div className="text-xs text-ink-soft tabular-nums">
                      Pre-flight baseline: {selectedDrawerBase.median} ± {selectedDrawerBase.sigma} {selectedDrawerMeta.unit}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-ceramic/40 border border-line space-y-2">
                  <span className="text-xs font-bold text-ink">Aerospace Context:</span>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    Measured under microgravity conditions. CUSUM statistical change detector tracks cumulative deviation from pre-flight baseline without making clinical diagnoses.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex gap-3">
              <button
                type="button"
                onClick={() => {
                  navigate(`/domain/${selectedDrawerMeta.domain}`);
                  setActiveDrawerIndicator(null);
                }}
                className="w-full py-2.5 rounded-xl bg-accent-primary text-panel font-bold text-xs shadow-sm hover:opacity-95 min-h-[44px]"
              >
                Open Full Domain Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
