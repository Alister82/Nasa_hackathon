import React, { useState } from 'react';
import { GlassCard } from '@/ui/components/GlassCard';
import { StatusPill } from '@/ui/components/StatusPill';
import { Sparkline } from '@/ui/components/Sparkline';
import { RangeGauge } from '@/ui/components/RangeGauge';
import { MetricTile } from '@/ui/components/MetricTile';
import { RestTimerWidget } from '@/ui/components/RestTimerWidget';
import { BreathingPacerWidget } from '@/ui/components/BreathingPacerWidget';
import { Stepper } from '@/ui/components/Stepper';
import { SegmentedTabs } from '@/ui/components/SegmentedTabs';
import { useAppState } from '@/app/AppState';
import type { IndicatorStatus } from '@/contracts/types';

export function DevKitPage() {
  const { theme, setTheme, largeControls, setLargeControls } = useAppState();
  const [activeTab, setActiveTab] = useState<'widgets' | 'tokens' | 'cards'>('widgets');
  const [stepperVal, setStepperVal] = useState<number>(72);
  const [demoStatus, setDemoStatus] = useState<IndicatorStatus>('watch');

  const sparklineData = [62, 63, 65, null, 68, 71, 74];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Dev Kit Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Component Kit & Token Verification
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Internal flight deck sandbox (`/dev/kit`) for verifying design tokens, WCAG AA contrast, and interactive widgets.
          </p>
        </div>

        {/* Theme and Large Controls Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <span>Theme:</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'night' | 'auto')}
              className="bg-panel-solid border border-line rounded-input px-2.5 py-1 text-ink min-h-[36px]"
            >
              <option value="light">Light (Aurora)</option>
              <option value="night">Night (Cabin)</option>
              <option value="auto">Auto System</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft cursor-pointer">
            <input
              type="checkbox"
              checked={largeControls}
              onChange={(e) => setLargeControls(e.target.checked)}
              className="rounded text-instrument focus:ring-instrument"
            />
            <span>Large controls</span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <SegmentedTabs
        tabs={[
          { id: 'widgets', label: 'Interactive Widgets & Tiles' },
          { id: 'tokens', label: 'Design Tokens & Statuses' },
          { id: 'cards', label: 'Glass Cards & Form Controls' },
        ]}
        selected={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content: Interactive Widgets */}
      {activeTab === 'widgets' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Interactive In-Card Procedure Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-ink-muted mb-2 block">
                  RestTimerWidget (5-minute seated rest tool)
                </span>
                <RestTimerWidget />
              </div>

              <div>
                <span className="text-xs font-semibold text-ink-muted mb-2 block">
                  BreathingPacerWidget (4s in / 6s out parasympathetic pacer)
                </span>
                <BreathingPacerWidget />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Telemetry Metric Tiles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricTile
                title="Resting Heart Rate"
                value={74}
                unit="bpm"
                status="review"
                deltaText="+8 bpm vs baseline"
                deltaDirection="up"
                sparklineValues={sparklineData}
                sparklineBaseline={64}
              />
              <MetricTile
                title="Systolic BP"
                value={132}
                unit="mmHg"
                status="watch"
                deltaText="+12 mmHg vs baseline"
                deltaDirection="up"
                sparklineValues={[118, 120, 124, 126, 128, 130, 132]}
                sparklineBaseline={120}
              />
              <MetricTile
                title="Sleep Duration"
                value={6.2}
                unit="hrs"
                status="watch"
                deltaText="-1.3 hrs vs baseline"
                deltaDirection="down"
                sparklineValues={[7.5, 7.2, 7.0, 6.8, 6.5, 6.2, 6.2]}
                sparklineBaseline={7.5}
              />
              <MetricTile
                title="Radiation Dose"
                value={0.48}
                unit="mGy/d"
                status="ok"
                deltaText="Nominal GCR rate"
                deltaDirection="neutral"
                sparklineValues={[0.45, 0.46, 0.47, 0.48, 0.48, 0.48, 0.48]}
                sparklineBaseline={0.48}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Range Gauges & Sparklines</h2>
            <GlassCard className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-ink-soft mb-2">
                  Heart Rate Range Gauge (Baseline: 60–70 bpm)
                </h4>
                <RangeGauge
                  value={74}
                  min={40}
                  max={140}
                  baselineRange={[60, 70]}
                  referenceRange={[50, 90]}
                  unit="bpm"
                  status="review"
                />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-ink-soft mb-2">
                  Blood Glucose Gauge (Baseline: 85–95 mg/dL)
                </h4>
                <RangeGauge
                  value={92}
                  min={50}
                  max={180}
                  baselineRange={[85, 95]}
                  referenceRange={[70, 125]}
                  unit="mg/dL"
                  status="ok"
                />
              </div>
            </GlassCard>
          </section>
        </div>
      )}

      {/* Tab Content: Design Tokens */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Semantic Status Badges</h2>
            <div className="flex flex-wrap gap-3">
              <StatusPill status="ok" size="lg" />
              <StatusPill status="info" size="lg" />
              <StatusPill status="watch" size="lg" />
              <StatusPill status="review" size="lg" />
              <StatusPill status="urgent" size="lg" />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <StatusPill status="ok" size="md" />
              <StatusPill status="info" size="md" />
              <StatusPill status="watch" size="md" />
              <StatusPill status="review" size="md" />
              <StatusPill status="urgent" size="md" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Surface Contrast Verification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GlassCard variant="default">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Default Glass</span>
                <p className="text-sm font-semibold text-ink mt-1">High-contrast primary text</p>
                <p className="text-xs text-ink-soft mt-1">Secondary explanation with 5.5:1 contrast</p>
              </GlassCard>

              <GlassCard variant="strong">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Strong Glass</span>
                <p className="text-sm font-semibold text-ink mt-1">Modal / Drawer container</p>
                <p className="text-xs text-ink-soft mt-1">Slightly higher opacity backdrop</p>
              </GlassCard>

              <GlassCard variant="interactive" glow>
                <span className="text-xs font-bold uppercase tracking-wider text-instrument">Glow Accent Glass</span>
                <p className="text-sm font-semibold text-ink mt-1">Highlighted interactive state</p>
                <p className="text-xs text-ink-soft mt-1">Subtle halo and hover lift</p>
              </GlassCard>
            </div>
          </section>
        </div>
      )}

      {/* Tab Content: Form Controls */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Tactile Stepper Control</h2>
            <GlassCard className="max-w-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Target Heart Rate</span>
                <span className="text-xl font-extrabold text-ink tabular-nums">{stepperVal} bpm</span>
              </div>
              <Stepper
                value={stepperVal}
                min={40}
                max={180}
                onChange={setStepperVal}
              />
              <p className="text-xs text-ink-soft">
                Tactile buttons support one-handed adjustment and EVA glove use without keyboard entry.
              </p>
            </GlassCard>
          </section>
        </div>
      )}
    </div>
  );
}
