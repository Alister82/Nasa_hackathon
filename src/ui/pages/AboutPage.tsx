import React from 'react';
import { SOURCES } from '@/guidance';
import { APP_NAME, DISCLAIMER_BANNER } from '@/contracts/constants';
import { PageHeader, SectionCard } from '@/ui/components/PremiumComponents';

type Coverage =
  | 'Covered'
  | 'Covered (adherence only)'
  | 'Covered (self-check only)'
  | 'Covered (dose tracking only)'
  | 'Partly'
  | 'Not covered';

interface RiskCoverageItem {
  risk: string;
  coverage: Coverage;
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
    coverage: 'Covered (adherence only)',
    how: 'Exercise minutes as a countermeasure-adherence indicator; the Risks page says all astronauts exercise to counteract losses in bone density, muscle strength, and heart and blood vessel performance',
  },
  {
    risk: 'Risk of Spaceflight-Induced Bone Changes',
    coverage: 'Partly',
    how: 'Exercise adherence as a proxy only; bone density is not measured',
  },
  {
    risk: 'Risk of Behavioral Changes and Psychiatric Disorders',
    coverage: 'Covered (self-check only)',
    how: 'Mood, stress, and energy check-in; no assessment or screening',
  },
  {
    risk: 'Risk of Radiation-Induced Cancers',
    coverage: 'Covered (dose tracking only)',
    how: 'Daily and cumulative dose against the expected rate for the mission setting; no health outcome claims',
  },
  {
    risk: 'Risk of Altered Immune System Responses',
    coverage: 'Partly',
    how: 'Body temperature only',
  },
  {
    risk: 'Risk of Inadequate Food and Nutrition',
    coverage: 'Partly',
    how: 'Blood glucose only; no nutrition tracking in v1',
  },
  {
    risk: 'Not covered in v1',
    coverage: 'Not covered',
    how: 'Altered Sensorimotor and Vestibular Function; Decompression Sickness; Host-Microorganism Interactions; Hypoxia; Injury and Compromised Performance from Spacewalks; Spaceflight Associated Neuro-ocular Syndrome (SANS); Inadequate Teamwork; Inadequate Systems Operations Support; Injury from Dynamic Loads',
  },
];

const NOT_DONE = [
  'It is not a medical device and does not replace the flight surgeon or emergency procedures.',
  'It does not name a cause for a change or state what is happening in the body.',
  'It does not prescribe treatment, medication, or doses.',
  'It does not assign a single overall health score.',
  'It does not use an AI model or a chatbot; guidance comes from a fixed library.',
];

function coverageBadge(coverage: Coverage) {
  if (coverage === 'Covered') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-status-ok/10 text-status-ok ring-1 ring-inset ring-status-ok/20 whitespace-nowrap">
        ✓ Covered
      </span>
    );
  }
  if (coverage === 'Not covered') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-status-review/10 text-status-review ring-1 ring-inset ring-status-review/20 whitespace-nowrap">
        ✗ Not covered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-status-watch/10 text-status-watch ring-1 ring-inset ring-status-watch/20 whitespace-nowrap">
      ~ Partly
    </span>
  );
}

export function AboutPage() {
  const sourcesList = Object.values(SOURCES);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
      <PageHeader
        title={`About ${APP_NAME}`}
        subtitle="An offline-first health monitoring prototype for astronauts on long missions. Every crew reading is simulated."
      />

      {/* Disclaimer box */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl px-5 py-4 text-text-primary text-sm font-medium leading-relaxed">
        {DISCLAIMER_BANNER} Reference ranges, adaptation offsets, scenarios, and radiation
        rates are illustrative and have not been verified for clinical use.
      </div>

      {/* What it does / does not */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard>
          <h2 className="font-bold text-base text-text-primary mb-3">What the app does</h2>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-text-primary leading-relaxed">
            <li>Records health indicators and wellbeing check-ins on the device.</li>
            <li>
              Compares each reading with the astronaut&apos;s own pre-flight baseline and the
              expected early adaptation to spaceflight.
            </li>
            <li>Shows changes on a body map, on charts, and in evidence-linked alert cards.</li>
            <li>Uses a fixed guidance library and mission-aware escalation advice.</li>
            <li>Works without a network after the first load.</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <h2 className="font-bold text-base text-text-primary mb-3">What the app does not do</h2>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-text-primary leading-relaxed">
            {NOT_DONE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* NASA Risk Coverage Table */}
      <SectionCard>
        <h2 className="font-bold text-lg text-text-primary mb-1">
          NASA Human Research Program risk coverage
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mb-4">
          NASA risk names are quoted verbatim from the organizer&apos;s Risks of Human
          Spaceflight page. This table shows what v1 covers and what it does not.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary font-bold">
                <th className="py-2.5 pr-4">NASA HRP risk</th>
                <th className="py-2.5 px-4 text-center whitespace-nowrap">Coverage in v1</th>
                <th className="py-2.5 pl-4">How</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-text-primary">
              {RISK_COVERAGE.map((item) => (
                <tr key={item.risk} className="hover:bg-bg-app transition-colors">
                  <td className="py-3 pr-4 font-semibold">{item.risk}</td>
                  <td className="py-3 px-4 text-center">{coverageBadge(item.coverage)}</td>
                  <td className="py-3 pl-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {item.how}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Sources */}
      <SectionCard>
        <h2 className="font-bold text-lg text-text-primary mb-1">Sources</h2>
        <p className="text-xs sm:text-sm text-text-secondary mb-1">
          The five organizer pages are linked with verified URLs. The four external clinical
          references stay marked pending until a human verifies them.
        </p>
        <p className="text-xs sm:text-sm text-text-secondary mb-4">
          Longer Moon and Mars missions bring more time in weightlessness, more radiation
          exposure, longer isolation, increased delays in communication with Earth, and less
          ability to rely on Earth for emergency medical assistance. That is why escalation
          advice changes with the mission setting and the app works offline.
        </p>
        <ul className="divide-y divide-border">
          {sourcesList.map((source) => (
            <li
              key={source.id}
              className="py-3 flex items-start justify-between gap-3 text-xs sm:text-sm"
            >
              <span className="font-medium text-text-primary">{source.title}</span>
              {source.url !== null ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent font-semibold underline hover:opacity-80 flex-shrink-0 inline-flex items-center gap-1 min-h-[44px]"
                >
                  Source link
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              ) : (
                <span className="text-text-secondary italic flex-shrink-0">
                  (source link pending)
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-text-secondary mt-3">
          NASA does not endorse non-U.S. Government entities. Follow each website&apos;s data
          use terms.
        </p>
      </SectionCard>
    </div>
  );
}
