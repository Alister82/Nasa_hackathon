import React from 'react';
import { SOURCES } from '@/guidance';
import { APP_NAME, DISCLAIMER_BANNER } from '@/contracts/constants';

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

// NASA HRP risk names are quoted verbatim only on this About screen,
// per RULES.md section 10. All other prose stays in plain decision-support language.
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

export function AboutPage() {
  const sourcesList = Object.values(SOURCES);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-1">
          About {APP_NAME}
        </h1>
        <p className="text-sm text-ink-soft">
          An offline-first health monitoring prototype for astronauts on long missions. Every
          crew reading is simulated.
        </p>
      </div>

      <div className="bg-instrument-soft border border-instrument p-4 rounded-sheet text-ink text-sm font-medium">
        {DISCLAIMER_BANNER} Reference ranges, adaptation offsets, scenarios, and radiation
        rates are illustrative and have not been verified for clinical use.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-panel border border-line rounded-sheet p-5">
          <h2 className="font-bold text-base text-ink mb-2">What the app does</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-ink leading-relaxed">
            <li>Records health indicators and wellbeing check-ins on the device.</li>
            <li>Compares each reading with the astronaut&apos;s own pre-flight baseline and the expected early adaptation to spaceflight.</li>
            <li>Shows changes on a body map, on charts, and in evidence-linked alert cards.</li>
            <li>Uses a fixed guidance library and mission-aware escalation advice.</li>
            <li>Works without a network after the first load.</li>
          </ul>
        </div>

        <div className="bg-panel border border-line rounded-sheet p-5">
          <h2 className="font-bold text-base text-ink mb-2">What the app does not do</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-ink leading-relaxed">
            {NOT_DONE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <section aria-label="NASA risk coverage map" className="bg-panel border border-line rounded-sheet p-5 flex flex-col gap-3">
        <h2 className="font-bold text-lg text-ink">NASA Human Research Program risk coverage</h2>
        <p className="text-xs sm:text-sm text-ink-soft">
          NASA risk names are quoted verbatim from the organizer&apos;s Risks of Human
          Spaceflight page. This table shows what v1 covers and what it does not.
        </p>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-line text-ink-soft font-bold">
                <th className="py-2.5 pr-4">NASA HRP risk</th>
                <th className="py-2.5 px-4 text-center">Coverage in v1</th>
                <th className="py-2.5 pl-4">How</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-ink">
              {RISK_COVERAGE.map((item) => (
                <tr key={item.risk}>
                  <td className="py-3 pr-4 font-bold">{item.risk}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">{item.coverage}</td>
                  <td className="py-3 pl-4 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    {item.how}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Sources" className="bg-panel border border-line rounded-sheet p-5 flex flex-col gap-3">
        <h2 className="font-bold text-lg text-ink">Sources</h2>
        <p className="text-xs sm:text-sm text-ink-soft">
          The five organizer pages are linked with verified URLs. The four external clinical
          references stay marked pending until a human verifies them.
        </p>
        <p className="text-xs sm:text-sm text-ink-soft">
          Longer Moon and Mars missions bring more time in weightlessness, more radiation
          exposure, longer isolation, increased delays in communication with Earth, and less
          ability to rely on Earth for emergency medical assistance. That is why escalation
          advice changes with the mission setting and the app works offline.
        </p>

        <ul className="divide-y divide-line mt-2">
          {sourcesList.map((source) => (
            <li key={source.id} className="py-2.5 flex items-start justify-between gap-3 text-xs sm:text-sm">
              <span className="font-medium text-ink">{source.title}</span>
              {source.url !== null ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-instrument font-semibold underline hover:opacity-80 flex-shrink-0"
                >
                  Source link
                </a>
              ) : (
                <span className="text-ink-soft italic flex-shrink-0">
                  (source link pending)
                </span>
              )}
            </li>
          ))}
        </ul>

        <p className="text-xs text-ink-soft">
          NASA does not endorse non-U.S. Government entities. Follow each website&apos;s data
          use terms.
        </p>
      </section>
    </div>
  );
}
