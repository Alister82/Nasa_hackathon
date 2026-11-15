import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  Info,
  ShieldCheck,
  Sparkles,
} from '@/ui/components/icons';
import { SOURCES } from '@/guidance';
import { APP_NAME, DISCLAIMER_BANNER } from '@/contracts/constants';
import { PageHeader, SectionHeading } from '@/ui/components/ui';
import { cn } from '@/ui/lib/format';
import { ScientificGroundingPanel } from '@/ui/components/ScientificGroundingPanel';

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

const DOES = [
  'Records health indicators and wellbeing check-ins on the device.',
  "Compares each reading with the astronaut's own pre-flight baseline and the expected early adaptation to spaceflight.",
  'Shows changes on a body map, on charts, and in evidence-linked alert cards.',
  'Uses a fixed guidance library and mission-aware escalation advice.',
  'Works without a network after the first load.',
];

function coverageTone(coverage: Coverage): string {
  if (coverage === 'Covered') return 'chip-ok';
  if (coverage === 'Not covered') return 'chip-urgent';
  if (coverage === 'Partly') return 'chip-watch';
  return 'chip-primary';
}

export function AboutPage() {
  const sourcesList = Object.values(SOURCES);
  const verifiedCount = sourcesList.filter((source) => source.url !== null).length;

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker="About"
        title={`About ${APP_NAME}`}
        description={
          <>
            An offline-first health monitoring prototype for astronauts on long missions. Every
            crew reading is simulated.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Decision support only
            </span>
            <span className="chip chip-neutral">Local-first</span>
            <span className="chip chip-neutral">{sourcesList.length} sources</span>
          </>
        }
        actions={<Link to="/help" className="btn btn-secondary">Help &amp; Support</Link>}
      />

      <section className="rounded-[16px] border border-instrument/20 bg-instrument-soft/40 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-instrument" aria-hidden="true" />
          <p className="text-[0.76rem] font-medium leading-relaxed text-ink-2">
            {DISCLAIMER_BANNER} Sleep period means use published NASA ISS group summaries as an
            approximate calibration. Other crew distributions and scenario effects are synthetic
            assumptions; no outputs are clinically validated.
          </p>
        </div>
      </section>

      <ScientificGroundingPanel />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="panel overflow-hidden">
          <header className="flex items-center gap-2 border-b border-line/80 bg-status-ok-soft/40 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-status-ok" aria-hidden="true" />
            <h2 className="font-display text-[0.9rem] font-semibold tracking-[-0.02em] text-ink">
              What the app does
            </h2>
          </header>
          <ul className="space-y-2 p-4">
            {DOES.map((item) => (
              <li key={item} className="flex gap-2 text-[0.74rem] leading-relaxed text-ink-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-status-ok" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel overflow-hidden">
          <header className="flex items-center gap-2 border-b border-line/80 bg-surface2/60 px-4 py-3">
            <CircleSlash className="h-4 w-4 text-ink-soft" aria-hidden="true" />
            <h2 className="font-display text-[0.9rem] font-semibold tracking-[-0.02em] text-ink">
              What the app does not do
            </h2>
          </header>
          <ul className="space-y-2 p-4">
            {NOT_DONE.map((item) => (
              <li key={item} className="flex gap-2 text-[0.74rem] leading-relaxed text-ink-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-faint" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-label="NASA risk coverage map" className="panel overflow-hidden">
        <header className="border-b border-line/80 bg-surface2/50 px-4 py-3">
          <SectionHeading
            title="NASA Human Research Program risk coverage"
            subtitle="NASA risk names are quoted verbatim from the organizer's Risks of Human Spaceflight page. This table shows what v1 covers and what it does not."
            action={
              <span className="chip chip-neutral">
                <BookOpen className="h-3 w-3" aria-hidden="true" />
                {RISK_COVERAGE.length} risks
              </span>
            }
          />
        </header>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">NASA HRP risk</th>
                <th scope="col" className="text-center">Coverage in v1</th>
                <th scope="col">How</th>
              </tr>
            </thead>
            <tbody>
              {RISK_COVERAGE.map((item) => (
                <tr key={item.risk}>
                  <td className="font-semibold text-ink">{item.risk}</td>
                  <td className="text-center">
                    <span className={cn('chip !py-0.5 !text-[0.58rem]', coverageTone(item.coverage))}>
                      {item.coverage}
                    </span>
                  </td>
                  <td className="max-w-[34rem] text-[0.72rem] leading-relaxed text-ink-soft">
                    {item.how}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Sources" className="panel overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line/80 bg-surface2/50 px-4 py-3">
          <SectionHeading
            title="Sources"
            subtitle="NASA, clinical, and research records are linked to their source pages."
          />
          <span className="chip chip-neutral tabular-nums">{verifiedCount}/{sourcesList.length} linked</span>
        </header>

        <div className="px-4 py-3">
          <p className="max-w-3xl text-[0.7rem] leading-relaxed text-ink-soft">
            Longer Moon and Mars missions bring more time in weightlessness, more radiation
            exposure, longer isolation, increased delays in communication with Earth, and less
            ability to rely on Earth for emergency medical assistance. That is why escalation
            advice changes with the mission setting and the app works offline.
          </p>
        </div>

        <ul className="divide-y divide-line/70 border-t border-line/80">
          {sourcesList.map((source) => (
            <li key={source.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <span className="inline-flex items-center gap-2 text-[0.72rem] font-medium text-ink">
                <Sparkles className="h-3 w-3 text-ink-faint" aria-hidden="true" />
                {source.title}
              </span>
              {source.url !== null ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[32px] items-center gap-1 text-[0.68rem] font-semibold text-instrument hover:underline"
                >
                  Source link
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>

        <footer className="border-t border-line/80 bg-surface2/45 px-4 py-2.5 text-[0.62rem] text-ink-soft">
          NASA does not endorse non-U.S. Government entities. Follow each website&apos;s data use
          terms.
        </footer>
      </section>
    </div>
  );
}
