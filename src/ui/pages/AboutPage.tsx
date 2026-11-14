import React from 'react';
import { SOURCES } from '@/guidance';
import { APP_NAME, DISCLAIMER_BANNER } from '@/contracts/constants';

interface RiskCoverageItem {
  risk: string;
  coverage: 'Covered' | 'Partly' | 'Not covered';
  how: string;
}

const RISK_COVERAGE: RiskCoverageItem[] = [
  {
    risk: 'Risk of Cardiovascular Adaptations',
    coverage: 'Covered',
    how: 'Heart rate and blood pressure, domain cardiovascular',
  },
  {
    risk: 'Risk of Inadequate Sleep and Irregular Schedules',
    coverage: 'Covered',
    how: 'Sleep hours, domain sleep_recovery',
  },
  {
    risk: 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness',
    coverage: 'Covered',
    how: 'Exercise minutes as a countermeasure-adherence indicator; tracking adherence against scheduled sessions',
  },
  {
    risk: 'Risk of Spaceflight-Induced Bone Changes',
    coverage: 'Partly',
    how: 'Exercise adherence as a proxy only; bone density is not directly measured in v1',
  },
  {
    risk: 'Risk of Behavioral Changes and Psychiatric Disorders',
    coverage: 'Covered',
    how: 'Mood, stress, energy self-checkin; strictly self-check, no automated diagnosis or psychiatric assessment',
  },
  {
    risk: 'Risk of Radiation-Induced Cancers',
    coverage: 'Covered',
    how: 'Daily and cumulative dose tracking against expected mission setting rate; no clinical outcome predictions',
  },
  {
    risk: 'Risk of Altered Immune System Responses',
    coverage: 'Partly',
    how: 'Core body temperature monitoring only',
  },
  {
    risk: 'Risk of Inadequate Food and Nutrition',
    coverage: 'Partly',
    how: 'Fasting blood glucose monitoring only; no nutrition logging in v1',
  },
  {
    risk: 'Other Spaceflight Risks (Sensorimotor, Decompression, Hypoxia, SANS, etc.)',
    coverage: 'Not covered',
    how: 'Out of scope in v1: Altered Sensorimotor and Vestibular Function, Decompression Sickness, Host-Microorganism Interactions, Hypoxia, Injury from Spacewalks, SANS, Inadequate Teamwork, Inadequate Systems Support, Dynamic Loads',
  },
];

export function AboutPage() {
  const sourcesList = Object.values(SOURCES);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">
          About {APP_NAME}
        </h1>
        <p className="text-sm text-ink-soft">
          Offline-first astronaut health monitoring and clinical decision support for deep space exploration.
        </p>
      </div>

      {/* Persistent Disclaimer Callout */}
      <div className="bg-instrument-soft border border-instrument p-4 rounded-sheet text-ink text-sm font-medium">
        <strong>Important Medical & Data Notice:</strong> {DISCLAIMER_BANNER} All crew data, trajectories, baselines, and reference thresholds are illustrative and simulated for demonstration purposes. Vigil is an autonomous self-assessment decision-support prototype and does not replace the flight surgeon or onboard emergency medical protocols.
      </div>

      {/* What Vigil Is vs. What It Is Not */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-panel border border-line rounded-sheet p-5 shadow-sm">
          <h2 className="font-bold text-base text-status-ok mb-2">What Vigil is</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-ink leading-relaxed">
            <li>An offline-first decision support tool for long-duration space missions.</li>
            <li>A baseline-relative change detection engine based on CUSUM statistics.</li>
            <li>A procedure-sheet generator linking observations to verified public health guidance.</li>
            <li>A latency-aware escalation coordinator adapting to mission communication delays.</li>
          </ul>
        </div>

        <div className="bg-panel border border-line rounded-sheet p-5 shadow-sm">
          <h2 className="font-bold text-base text-status-urgent mb-2">What Vigil is not</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-ink leading-relaxed">
            <li>Not a diagnostic device and does not predict diseases or clinical outcomes.</li>
            <li>Not an autonomous medical practitioner or automated therapist.</li>
            <li>Does not prescribe medications, clinical diagnoses, or off-nominal treatments.</li>
            <li>Does not transmit sensitive crew check-ins or personal notes across external networks.</li>
          </ul>
        </div>
      </div>

      {/* NASA Risk Coverage Map (ARCHITECTURE.md 7.7) */}
      <section aria-label="NASA Risk Coverage Map" className="bg-panel border border-line rounded-sheet p-5 shadow-sm flex flex-col gap-3">
        <h2 className="font-bold text-lg text-ink">NASA Human Research Program (HRP) Risk Coverage</h2>
        <p className="text-xs sm:text-sm text-ink-soft">
          Mapping of official NASA Human Spaceflight risks (quoted verbatim from NASA HRP) to Vigil v1 capabilities.
        </p>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-line text-ink-soft font-bold">
                <th className="py-2.5 pr-4">NASA HRP Risk</th>
                <th className="py-2.5 px-4 text-center">Status in v1</th>
                <th className="py-2.5 pl-4">How it is addressed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-ink">
              {RISK_COVERAGE.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 pr-4 font-bold">{item.risk}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-chip text-xs font-bold border ${
                        item.coverage === 'Covered'
                          ? 'bg-status-ok-soft text-status-ok border-status-ok'
                          : item.coverage === 'Partly'
                          ? 'bg-status-watch-soft text-status-watch border-status-watch'
                          : 'bg-ceramic text-ink-soft border-line'
                      }`}
                    >
                      {item.coverage}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    {item.how}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Public Sources List */}
      <section aria-label="Sources and References" className="bg-panel border border-line rounded-sheet p-5 shadow-sm flex flex-col gap-3">
        <h2 className="font-bold text-lg text-ink">Sources & Literature</h2>
        <p className="text-xs sm:text-sm text-ink-soft">
          Sourced public health guidelines and official agency resources utilized for thresholds, hazards, and guidance.
        </p>

        <ul className="divide-y divide-line mt-2">
          {sourcesList.map((src) => (
            <li key={src.id} className="py-2.5 flex items-start justify-between gap-3 text-xs sm:text-sm">
              <span className="font-medium text-ink">{src.title}</span>
              {src.url ? (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-instrument font-semibold underline hover:opacity-80 flex-shrink-0"
                >
                  Source link
                </a>
              ) : (
                <span className="text-ink-soft italic flex-shrink-0">(source link pending)</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
