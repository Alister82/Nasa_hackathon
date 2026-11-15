import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  HeartPulse,
  Info,
  LifeBuoy,
  Radio,
  Search,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react';
import type { IndicatorId } from '@/contracts/types';
import { DOMAIN_LABELS, INDICATORS } from '@/contracts/indicators';
import { MEASUREMENT_HELP, MISSION_SETTINGS, SOURCES, SUPPLIES, expectedReplyMinutes } from '@/guidance';
import { PageHeader, SectionHeading, TextLink } from '@/ui/components/ui';
import { IndicatorIcon } from '@/ui/components/MetricTile';
import { DISCLAIMER_BANNER } from '@/contracts/constants';
import { cn } from '@/ui/lib/format';

const SETTING_ORDER = ['station', 'lunar_base', 'deep_space'] as const;

const SEVERITY_GUIDE = [
  {
    level: 'Urgent',
    tone: 'chip-urgent',
    text: 'A reading or pattern needs immediate attention. Follow your emergency procedures and contact your crew medical officer and ground now.',
  },
  {
    level: 'Review',
    tone: 'chip-review',
    text: 'The engine found a sustained departure from your own baseline or expected adaptation. Repeat the measurement and review the evidence with the crew medical officer.',
  },
  {
    level: 'Watch',
    tone: 'chip-watch',
    text: 'One or more values sit near the expected edge. A single reading is weak evidence; the trend matters more.',
  },
  {
    level: 'Expected',
    tone: 'chip-primary',
    text: 'A change that fits expected early adaptation. It stays visible so it can be compared with later readings.',
  },
  {
    level: 'Steady',
    tone: 'chip-ok',
    text: 'Recorded values are within their expected range for this indicator and mission day.',
  },
];

const DECISION_STEPS = [
  {
    title: 'Own baseline first',
    text: 'Vigil compares each reading with the same astronaut’s pre-flight baseline rather than a crew-wide average. The baseline is built from the pre-flight window in the simulated mission.',
  },
  {
    title: 'Expected adaptation second',
    text: 'A detector compares the observed value with an expected early-adaptation trajectory for that indicator. A change that follows the expected path is treated differently from an abrupt departure.',
  },
  {
    title: 'Sustained change, not one number',
    text: 'The CUSUM detector looks for a persistent shift across days. One unusual reading can be a sensor issue or a transient event, so the evidence list and data-quality findings stay visible.',
  },
  {
    title: 'Mission context shapes escalation',
    text: 'The same finding produces different escalation wording on station, at a lunar base, and in deep space because the expected reply time changes. The on-board steps stay explicit.',
  },
  {
    title: 'Fixed guidance library',
    text: 'Advice comes from a fixed library of actions, questions, and next measurements. There is no chatbot and no generated diagnosis. Supply-aware alternatives replace equipment that is marked as not aboard.',
  },
];

export function HelpPage() {
  const [query, setQuery] = useState('');
  const [openIndicator, setOpenIndicator] = useState<IndicatorId | null>('heart_rate');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INDICATORS.filter((indicator) => {
      if (!needle) return true;
      const help = MEASUREMENT_HELP[indicator.id];
      return (
        indicator.label.toLowerCase().includes(needle) ||
        DOMAIN_LABELS[indicator.domain].toLowerCase().includes(needle) ||
        help?.howToMeasure.toLowerCase().includes(needle) ||
        help?.whyItMatters.toLowerCase().includes(needle)
      );
    });
  }, [query]);

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker="Help & support"
        title="Guidance, measurements, and emergency routes"
        description={
          <>
            Everything on this page is drawn from the same fixed guidance library used by the
            alert cards. It explains how to measure, how to read an alert, and when to stop
            waiting for the app.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              {INDICATORS.length} indicators
            </span>
            <span className="chip chip-neutral">{Object.keys(SOURCES).length} sources</span>
            <span className="chip chip-neutral">Offline after first load</span>
          </>
        }
        actions={
          <Link to="/urgent" className="btn btn-danger">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Emergency support
          </Link>
        }
      />

      <section className="relative overflow-hidden rounded-[20px] border border-status-urgent/25 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(255,242,242,0.9))] p-4">
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-urgent" aria-hidden="true" />
            <div>
              <h2 className="font-display text-[0.9rem] font-extrabold tracking-[-0.02em] text-ink">
                If you feel unwell, act before you read further
              </h2>
              <p className="mt-0.5 text-[0.72rem] leading-relaxed text-ink-2">
                Contact your crew medical officer and ground now. You do not have to handle this
                alone. Follow your emergency procedures.
              </p>
            </div>
          </div>
          <Link to="/urgent" className="btn btn-danger shrink-0 !min-h-[40px]">
            Open emergency support
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section id="measurement-guide" aria-label="Measurement guide" className="panel overflow-hidden">
            <header className="border-b border-line/80 bg-surface2/50 px-4 py-3">
              <SectionHeading
                title="How to measure"
                subtitle="Methods come from the guidance module. They are general and non-prescriptive."
                action={<span className="chip chip-neutral">{filtered.length} shown</span>}
              />
              <div className="relative mt-2.5">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint"
                  aria-hidden="true"
                />
                <label htmlFor="help-search" className="sr-only">
                  Search measurement guidance
                </label>
                <input
                  id="help-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search an indicator, domain, or instruction…"
                  className="field !min-h-[40px] !pl-9 !text-[0.76rem]"
                />
              </div>
            </header>

            <div className="divide-y divide-line/70">
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <CircleHelp className="mx-auto h-6 w-6 text-ink-faint" aria-hidden="true" />
                  <p className="mt-2 text-[0.8rem] font-semibold text-ink">No guide matches that search</p>
                  <p className="mt-1 text-[0.68rem] text-ink-soft">
                    Try an indicator name such as heart rate, sleep, or temperature.
                  </p>
                </div>
              ) : (
                filtered.map((indicator) => {
                  const help = MEASUREMENT_HELP[indicator.id];
                  const isOpen = openIndicator === indicator.id;
                  return (
                    <div key={indicator.id}>
                      <button
                        type="button"
                        onClick={() => setOpenIndicator(isOpen ? null : indicator.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface2/60"
                        aria-expanded={isOpen}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-soft">
                          <IndicatorIcon indicator={indicator.id} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.78rem] font-semibold text-ink">{indicator.label}</span>
                          <span className="block text-[0.62rem] text-ink-soft">
                            {DOMAIN_LABELS[indicator.domain]}
                          </span>
                        </span>
                        <ChevronDown
                          className={cn('h-4 w-4 shrink-0 text-ink-faint transition-transform', isOpen && 'rotate-180')}
                          aria-hidden="true"
                        />
                      </button>

                      {isOpen && help && (
                        <div className="border-t border-line/60 bg-white/55 px-4 py-3">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <p className="section-kicker mb-1">How to measure</p>
                              <p className="text-[0.72rem] leading-relaxed text-ink-2">{help.howToMeasure}</p>
                            </div>
                            <div>
                              <p className="section-kicker mb-1">Why it matters</p>
                              <p className="text-[0.72rem] leading-relaxed text-ink-2">{help.whyItMatters}</p>
                            </div>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-ink-faint">
                              Hazards
                            </span>
                            {help.hazards.map((hazard) => (
                              <span key={hazard} className="chip chip-neutral !py-0.5 !text-[0.56rem]">
                                {hazard}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <footer className="border-t border-line/80 bg-surface2/45 px-4 py-2.5 text-[0.62rem] text-ink-soft">
              {DISCLAIMER_BANNER} If a reading is urgent, repeat it once and follow emergency
              procedures rather than waiting for another reading to change.
            </footer>
          </section>

          <section id="reading-alerts" aria-label="Reading an alert" className="panel overflow-hidden">
            <header className="border-b border-line/80 bg-surface2/50 px-4 py-3">
              <SectionHeading
                title="Reading an alert card"
                subtitle="Severity orders attention; evidence and uncertainty explain why the card exists."
              />
            </header>
            <div className="grid grid-cols-1 gap-2 p-3.5 sm:grid-cols-2">
              {SEVERITY_GUIDE.map((item) => (
                <div key={item.level} className="rounded-[14px] border border-line bg-white/70 px-3 py-2.5">
                  <span className={cn('chip !py-0.5 !text-[0.56rem]', item.tone)}>{item.level}</span>
                  <p className="mt-1.5 text-[0.68rem] leading-relaxed text-ink-soft">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 border-t border-line/80 px-3.5 py-3 sm:grid-cols-3">
              {[
                ['What changed', 'The plain-language observation built from the evidence.'],
                ['What we do not know', 'Missing information and the evidence-strength tier.'],
                ['Do now / Measure next', 'Fixed library actions and the next readings to repeat.'],
              ].map(([title, text]) => (
                <div key={title}>
                  <p className="text-[0.66rem] font-bold text-ink">{title}</p>
                  <p className="mt-0.5 text-[0.62rem] leading-relaxed text-ink-soft">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="how-vigil-decides" aria-label="How Vigil decides" className="panel overflow-hidden">
            <header className="border-b border-line/80 bg-surface2/50 px-4 py-3">
              <SectionHeading
                title="How Vigil decides"
                subtitle="Deterministic steps, own-baseline comparison, and a fixed guidance library."
              />
            </header>
            <ol className="divide-y divide-line/70">
              {DECISION_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3 px-4 py-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-instrument-soft text-[0.62rem] font-bold tabular-nums text-instrument-deep">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[0.76rem] font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[0.68rem] leading-relaxed text-ink-soft">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <footer className="border-t border-line/80 bg-surface2/45 px-4 py-2.5">
              <TextLink to="/proof" className="!text-[0.66rem]">
                See evaluation results
              </TextLink>
            </footer>
          </section>

          <section id="mission-settings" aria-label="Mission settings and reply windows" className="panel overflow-hidden">
            <header className="border-b border-line/80 bg-surface2/50 px-4 py-3">
              <SectionHeading
                title="Mission settings and reply windows"
                subtitle="Expected reply = 2 × one-way delay + 10 minutes, per the guidance module."
              />
            </header>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Setting</th>
                    <th scope="col" className="text-center">One-way delay</th>
                    <th scope="col" className="text-center">Expected reply</th>
                    <th scope="col" className="text-center">Radiation rate</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {SETTING_ORDER.map((id) => {
                    const setting = MISSION_SETTINGS[id];
                    return (
                      <tr key={id}>
                        <td className="font-semibold text-ink">{setting.label}</td>
                        <td className="text-center">{setting.oneWayDelayMinutes} min</td>
                        <td className="text-center">≥ {expectedReplyMinutes(id)} min</td>
                        <td className="text-center">{setting.radiationRateMsvPerDay} mSv/day</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line/80 bg-surface2/45 px-4 py-2.5">
              <p className="text-[0.62rem] text-ink-soft">
                Reply estimates are illustrative. They do not delay the need to follow emergency
                procedures.
              </p>
              <TextLink to="/mission" className="!text-[0.66rem]">
                Change mission setting
              </TextLink>
            </footer>
          </section>

          <section id="supplies" aria-label="Supplies" className="panel overflow-hidden">
            <header className="border-b border-line/80 bg-surface2/50 px-4 py-3">
              <SectionHeading
                title="Supplies referenced by guidance"
                subtitle="If an item is marked not aboard, the alert card shows the library alternative instead."
              />
            </header>
            <ul className="grid grid-cols-1 gap-2 p-3.5 sm:grid-cols-2">
              {SUPPLIES.map((supply) => (
                <li
                  key={supply.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white/70 px-3 py-2 text-[0.7rem] font-medium text-ink"
                >
                  {supply.label}
                  <Stethoscope className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </section>

          <section id="sources" aria-label="Help sources" className="panel overflow-hidden">
            <header className="border-b border-line/80 bg-surface2/50 px-4 py-3">
              <SectionHeading
                title="Sources"
                subtitle="Same source list as About. Unverified clinical references stay marked pending."
              />
            </header>
            <ul className="divide-y divide-line/70">
              {Object.values(SOURCES).map((source) => (
                <li key={source.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span className="text-[0.7rem] font-medium text-ink">{source.title}</span>
                  {source.url !== null ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[32px] items-center gap-1 text-[0.66rem] font-semibold text-instrument hover:underline"
                    >
                      Source link
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-[0.64rem] italic text-ink-soft">(source link pending)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          <nav aria-label="Help sections" className="panel p-3.5">
            <p className="section-kicker mb-1.5">On this page</p>
            <ul className="space-y-0.5">
              {[
                ['measurement-guide', 'How to measure', Stethoscope],
                ['reading-alerts', 'Reading an alert', Info],
                ['how-vigil-decides', 'How Vigil decides', ShieldAlert],
                ['mission-settings', 'Mission settings', Radio],
                ['supplies', 'Supplies', HeartPulse],
                ['sources', 'Sources', BookOpen],
              ].map(([id, label, Icon]) => {
                const IconComponent = Icon as React.ComponentType<{ className?: string; strokeWidth?: number }>;
                return (
                  <li key={String(id)}>
                    <a
                      href={`#${id}`}
                      className="flex min-h-[36px] items-center gap-2 rounded-lg px-2 text-[0.72rem] font-medium text-ink-soft transition-colors hover:bg-surface2 hover:text-ink"
                    >
                      <IconComponent className="h-3.5 w-3.5 text-ink-faint" />
                      {String(label)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section className="panel p-3.5">
            <p className="section-kicker mb-1.5">Common questions</p>
            <dl className="space-y-2.5">
              {[
                ['Does Vigil diagnose?', 'No. It reports changes and points to fixed guidance. It does not name a cause or prescribe treatment.'],
                ['Why does the same reading look different?', 'Every comparison uses the astronaut’s own baseline, expected adaptation, and mission context, not a crew-wide average.'],
                ['What if a sensor seems wrong?', 'The data-quality findings stay visible. Repeat the measurement and note what changed in the journal.'],
                ['What happens offline?', 'The dataset, detector, guidance library, and local records work without a network after the first load.'],
              ].map(([question, answer]) => (
                <div key={question}>
                  <dt className="text-[0.7rem] font-semibold text-ink">{question}</dt>
                  <dd className="mt-0.5 text-[0.64rem] leading-relaxed text-ink-soft">{answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-[18px] border border-line bg-white/65 p-3.5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-faint">Quick links</p>
            <div className="mt-1.5 flex flex-col gap-1">
              {([
                ['/checkin', 'Start a wellbeing check-in'],
                ['/log', 'Log measurements'],
                ['/journal', 'Open the investigation journal'],
                ['/about', 'Scope and NASA risk coverage'],
              ] as const).map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex min-h-[32px] items-center justify-between gap-2 rounded-lg px-1.5 text-[0.68rem] font-semibold text-instrument hover:bg-instrument-soft"
                >
                  {label}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-status-watch/25 bg-status-watch-soft/60 p-3.5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-status-watch">
              Reminder
            </p>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-ink-2">
              This is decision support for a simulated mission. It is not a medical device and does
              not replace the flight surgeon or emergency procedures.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
