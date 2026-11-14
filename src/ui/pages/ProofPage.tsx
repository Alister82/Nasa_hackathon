import React, { useState, useEffect } from 'react';
import type { ResultsFile, SystemId } from '@/contracts/types';
import { loadResults } from '@/app/services';
import { ProofChart } from '@/ui/charts/ProofChart';
import { PageHeader, SectionCard } from '@/ui/components/PremiumComponents';

const SYSTEM_LABELS: Record<SystemId, string> = {
  vigil: 'Vigil',
  threshold: 'Fixed thresholds',
  zscore: 'Rolling z-score',
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
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-text-secondary">
        Loading evaluation results...
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="bg-bg-surface border border-border rounded-2xl p-8 shadow-glass">
          <h1 className="text-xl font-bold text-text-primary mb-2">Proof results</h1>
          <p className="text-sm text-text-secondary mb-4">
            Results file not found. Run the harness and rebuild.
          </p>
          <code className="text-xs bg-bg-app px-3 py-1.5 rounded-lg font-mono text-text-primary border border-border">
            npm run harness
          </code>
        </div>
      </div>
    );
  }

  const seedCount = results.evaluationSeeds.end - results.evaluationSeeds.start + 1;
  const start = results.evaluationSeeds.start;
  const end = results.evaluationSeeds.end;
  const tuningStart = results.tuningSeeds.start;
  const tuningEnd = results.tuningSeeds.end;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      <PageHeader
        title="Algorithmic Proof & Verification"
        subtitle={`${seedCount} simulated crews per scenario, seeds ${start} to ${end}. Detector settings were tuned on separate seeds (${tuningStart} to ${tuningEnd}). Results are on simulated data and do not show medical validity.`}
      />

      {/* Methodology Card */}
      <SectionCard>
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-text-primary">Methodology</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-bg-app rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-accent tabular-nums">{seedCount}</div>
              <div className="text-xs text-text-secondary mt-1">Crews tested per scenario</div>
            </div>
            <div className="bg-bg-app rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-accent tabular-nums">
                {start}–{end}
              </div>
              <div className="text-xs text-text-secondary mt-1">Evaluation seed range</div>
            </div>
            <div className="bg-bg-app rounded-xl p-4 border border-border">
              <div className="text-2xl font-bold text-accent tabular-nums">
                {tuningStart}–{tuningEnd}
              </div>
              <div className="text-xs text-text-secondary mt-1">Tuning seed range</div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Scenario Results */}
      <div className="flex flex-col gap-6">
        {results.scenarios.map((sc) => (
          <SectionCard key={sc.scenarioId}>
            <h2 className="text-base font-bold text-text-primary mb-4">
              {sc.scenarioId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </h2>
            <ProofChart scenario={sc} labels={SYSTEM_LABELS} />
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
