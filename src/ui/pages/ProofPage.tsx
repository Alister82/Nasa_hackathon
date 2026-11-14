import React, { useState, useEffect } from 'react';
import type { ResultsFile, SystemId } from '@/contracts/types';
import { loadResults } from '@/app/services';
import { ProofChart } from '@/ui/charts/ProofChart';

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
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-ink-soft">
        Loading evaluation results...
      </div>
    );
  }

  // Exact copy from DESIGN.md section 7 when null
  if (!results) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="bg-panel border border-line rounded-sheet p-8 shadow-sm">
          <h1 className="text-xl font-bold text-ink mb-2">Proof results</h1>
          <p className="text-sm text-ink-soft mb-4">
            Results file not found. Run the harness and rebuild.
          </p>
          <code className="text-xs bg-ceramic px-3 py-1.5 rounded font-mono text-ink">
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
      {/* Title & Methodology Text */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">
          Algorithmic proof & verification
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
          {seedCount} simulated crews per scenario, seeds {start} to {end}. Detector settings were tuned on separate seeds ({tuningStart} to {tuningEnd}). Results are on simulated data and do not show medical validity.
        </p>
      </div>

      {/* Scenario Results Section */}
      <div className="flex flex-col gap-6">
        {results.scenarios.map((sc) => (
          <ProofChart key={sc.scenarioId} scenario={sc} labels={SYSTEM_LABELS} />
        ))}
      </div>
    </div>
  );
}
