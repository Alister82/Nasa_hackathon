import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock3,
  Database,
  HardDriveDownload,
  Radio,
  ShieldAlert,
  Sparkles,
  Timer,
} from 'lucide-react';
import { MissionPicker } from '@/ui/components/MissionPicker';
import { SupplyChecklist } from '@/ui/components/SupplyChecklist';
import { PageHeader, SectionHeading, TextLink } from '@/ui/components/ui';
import { useAppState } from '@/app/AppState';
import { MISSION_SETTINGS, expectedReplyMinutes } from '@/guidance';
import { MISSION_DAYS } from '@/contracts/constants';
import { cn } from '@/ui/lib/format';

export function MissionPage() {
  const navigate = useNavigate();
  const {
    crewName,
    viewDay,
    missionSetting,
    supplies,
    setMissionSetting,
    setSupplies,
    resetDemoData,
  } = useAppState();

  const handleReset = () => {
    if (
      window.confirm(
        'This clears measurements, check-ins, and the journal on this device. Reset?',
      )
    ) {
      void resetDemoData().then(() => navigate('/'));
    }
  };

  const setting = MISSION_SETTINGS[missionSetting];
  const reply = expectedReplyMinutes(missionSetting);
  const aboard = Object.values(supplies).filter(Boolean).length;

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker="Mission settings"
        title="Mission context and constraints"
        description={
          <>
            Mission context shapes escalation wording, expected reply time, and the radiation
            reference rate for {crewName}. Changes are saved on this device.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">{setting.label}</span>
            <span className="chip chip-neutral tabular-nums">Day {viewDay} of {MISSION_DAYS}</span>
            <span className="chip chip-neutral">
              <HardDriveDownload className="h-3 w-3" aria-hidden="true" />
              Local device
            </span>
          </>
        }
        actions={<TextLink to="/about">Scope and limits</TextLink>}
      />

      <section
        aria-label="Current mission context"
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: 'One-way delay',
            value: `${setting.oneWayDelayMinutes} min`,
            hint: 'Signal travel time to ground',
            icon: Clock3,
          },
          {
            label: 'Expected reply',
            value: `≥ ${reply} min`,
            hint: '2 × delay + 10 minutes',
            icon: Timer,
          },
          {
            label: 'Radiation rate',
            value: `${setting.radiationRateMsvPerDay} mSv/day`,
            hint: 'Illustrative expected rate',
            icon: Radio,
          },
          {
            label: 'Supplies aboard',
            value: `${aboard}/${Object.keys(supplies).length}`,
            hint: 'Named in guidance actions',
            icon: Database,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="panel px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-faint">{stat.label}</p>
                <Icon className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
              </div>
              <p className="metric-number mt-1.5 text-[1.3rem] leading-none">{stat.value}</p>
              <p className="mt-1 text-[0.6rem] text-ink-soft">{stat.hint}</p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <MissionPicker value={missionSetting} onChange={setMissionSetting} />
          <SupplyChecklist supplies={supplies} onChange={setSupplies} />
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          <section className="relative overflow-hidden rounded-[20px] border border-white/15 panel-dark p-4">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/10"
              aria-hidden="true"
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-blue-200/80">
                  Why the setting matters
                </p>
                <p className="mt-1.5 font-display text-[1rem] font-bold leading-snug tracking-[-0.02em]">
                  Escalation has to fit the link
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100">
                <Radio className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              </span>
            </div>
            <p className="relative mt-2 text-[0.68rem] leading-relaxed text-blue-100/75">
              On station, ground can respond quickly. On a lunar base or in deep space, a reply may
              take longer than the clinical decision. Vigil keeps the on-board steps explicit so
              care does not wait on the link.
            </p>
            <div className="relative mt-3 flex flex-wrap gap-1.5">
              <span className="chip !border-white/15 !bg-white/10 !text-blue-50">{setting.label}</span>
              <span className="chip !border-white/15 !bg-white/10 !text-blue-50">≥ {reply} min reply</span>
            </div>
          </section>

          <section className="panel p-3.5">
            <SectionHeading title="What changes" subtitle="Applied across the app immediately." />
            <ul className="mt-2.5 space-y-2">
              {[
                'Escalation wording in every alert card.',
                'Expected reply time shown with guidance.',
                'Expected radiation rate used for comparisons.',
                'Supply-aware alternatives inside action lists.',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[0.68rem] leading-relaxed text-ink-soft">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-instrument" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[18px] border border-status-urgent/25 bg-status-urgent-soft/65 p-3.5">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-status-urgent" aria-hidden="true" />
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-status-urgent">
                Reset demo data
              </p>
            </div>
            <p className="mt-1 text-[0.66rem] leading-relaxed text-ink-2">
              Clears measurements, check-ins, and the journal on this device. The simulated crew
              dataset remains available.
            </p>
            <button type="button" onClick={handleReset} className="btn btn-danger mt-2.5 w-full !min-h-[40px]">
              Reset demo data
            </button>
          </section>

          <section className="rounded-[16px] border border-line bg-white/65 px-3.5 py-3">
            <p className="inline-flex items-center gap-1.5 text-[0.64rem] font-semibold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-instrument" aria-hidden="true" />
              Need the guidance behind these settings?
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Link to="/help" className="text-[0.64rem] font-semibold text-instrument hover:underline">
                Help &amp; Support
              </Link>
              <span className="text-ink-faint" aria-hidden="true">·</span>
              <Link to="/urgent" className={cn('text-[0.64rem] font-semibold text-status-urgent hover:underline')}>
                Emergency support
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
