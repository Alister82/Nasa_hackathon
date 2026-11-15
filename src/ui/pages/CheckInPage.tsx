import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  LifeBuoy,
  MoonStar,
  Sparkles,
  TrendingUp,
} from '@/ui/components/icons';
import type { CheckInInput, CheckInRecord, CheckInResult } from '@/contracts/types';
import { CheckInForm } from '@/ui/components/CheckInForm';
import { CheckInTrend, type CheckInTrendPoint } from '@/ui/charts/CheckInTrend';
import { EmptyState, PageHeader, SectionHeading, TextLink } from '@/ui/components/ui';
import { useAppState } from '@/app/AppState';
import { loadCheckIns } from '@/storage';
import { MISSION_SETTINGS } from '@/guidance';
import { cn, timeAgo } from '@/ui/lib/format';

export function CheckInPage() {
  const navigate = useNavigate();
  const { crewId, crewName, missionSetting, viewDay, analysis, submitCheckIn } = useAppState();
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);

  const reload = useCallback(async () => {
    setCheckIns(await loadCheckIns(crewId));
  }, [crewId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const trendData = useMemo<CheckInTrendPoint[]>(() => {
    const start = Math.max(1, viewDay - 29);
    const byDay = new Map(checkIns.map((record) => [record.day, record]));
    const sleepPoints = new Map(
      (analysis?.indicators.sleep_hours.points ?? []).map((point) => [point.day, point.value]),
    );
    const data: CheckInTrendPoint[] = [];
    for (let day = start; day <= viewDay; day += 1) {
      const record = byDay.get(day);
      const sleep = sleepPoints.get(day);
      data.push({
        day,
        mood: record?.mood,
        stress: record?.stress,
        energy: record?.energy,
        sleep: typeof sleep === 'number' ? sleep : undefined,
      });
    }
    return data;
  }, [analysis, checkIns, viewDay]);

  const handleSubmit = async (input: CheckInInput): Promise<CheckInResult> => {
    const result = await submitCheckIn(input);
    await reload();
    return result;
  };

  const hasCheckIns = checkIns.length > 0;
  const setting = MISSION_SETTINGS[missionSetting];
  const latest = [...checkIns].sort((a, b) => b.day - a.day)[0];
  const checkInDays = checkIns.length;

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker="Wellbeing check-in"
        title="How are you feeling today?"
        description={
          <>
            A short self-check for <span className="font-semibold text-ink">{crewName}</span> on mission
            day {viewDay}. Ratings and notes are stored only on this device.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              Day {viewDay}
            </span>
            <span className="chip chip-neutral">
              <ClipboardCheck className="h-3 w-3" aria-hidden="true" />
              {checkInDays} check-in{checkInDays === 1 ? '' : 's'} on record
            </span>
            <span className="chip chip-neutral">{setting.label}</span>
          </>
        }
        actions={
          <>
            <TextLink to="/log">Health monitor</TextLink>
            <Link to="/urgent" className="btn btn-danger">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Emergency support
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <CheckInForm
            crewId={crewId}
            day={viewDay}
            onSubmit={handleSubmit}
            onNeedHelpNow={() => navigate('/urgent')}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          <section className="relative overflow-hidden rounded-[16px] border border-white/10 panel-dark p-4">
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-medium uppercase tracking-[0.1em] text-white/50">
                  Why this matters
                </p>
                <p className="mt-1.5 font-display text-[1rem] font-semibold leading-snug tracking-[-0.02em]">
                  Self-report catches what sensors miss
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white/80">
                <Sparkles className="h-4 w-4" weight="fill" aria-hidden="true" />
              </span>
            </div>
            <p className="relative mt-2 text-[0.68rem] leading-relaxed text-white/55">
              Mood, stress, and energy are compared with your own record across the mission. The
              check-in does not diagnose; it surfaces changes worth discussing.
            </p>
            <div className="relative mt-3 grid grid-cols-3 gap-2">
              {[
                ['Mood', latest?.mood],
                ['Stress', latest?.stress],
                ['Energy', latest?.energy],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-[10px] bg-white/[0.06] px-2 py-1.5 text-center">
                  <p className="text-[0.55rem] font-medium uppercase tracking-[0.06em] text-white/45">{label}</p>
                  <p className="font-display text-[1rem] font-semibold tabular-nums">
                    {typeof value === 'number' ? value : '—'}
                    <span className="text-[0.58rem] font-normal text-white/40">/5</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="relative mt-2 text-[0.58rem] text-white/40">
              {latest ? `Latest entry: day ${latest.day} · ${timeAgo(latest.createdAt)}` : 'No check-ins saved yet.'}
            </p>
          </section>

          <section className="panel p-3.5">
            <h2 className="text-[0.8rem] font-semibold text-ink">After you save</h2>
            <ol className="mt-2.5 space-y-2">
              {[
                'The rating is stored for this mission day on this device.',
                'Mood and stress feed the behavioural domain as self-check signals.',
                'The 30-day trend compares ratings with recorded sleep.',
                'Emergency routes stay available without waiting for a reply.',
              ].map((step, index) => (
                <li key={step} className="flex gap-2 text-[0.68rem] leading-relaxed text-ink-soft">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface3 text-[0.54rem] font-semibold tabular-nums text-ink-soft">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[18px] border border-status-urgent/25 bg-status-urgent-soft/70 p-3.5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-status-urgent">
              If you feel unwell
            </p>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-ink-2">
              Do not wait for a rating or a reply. Follow your emergency procedures and contact the
              crew medical officer.
            </p>
            <Link
              to="/urgent"
              className="mt-2 inline-flex items-center gap-1 text-[0.66rem] font-semibold text-status-urgent hover:underline"
            >
              Open emergency support
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>

      <section aria-label="30-day wellbeing and sleep trend" className="panel overflow-hidden">
        <header className="border-b border-line/80 px-4 py-3">
          <SectionHeading
            title="30-day trends"
            subtitle="Saved check-ins next to sleep hours for the same days. Days without a check-in stay blank."
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-2.5 py-1 text-[0.62rem] font-semibold text-ink-soft">
                <TrendingUp className="h-3 w-3 text-instrument" aria-hidden="true" />
                Days {Math.max(1, viewDay - 29)}–{viewDay}
              </span>
            }
          />
        </header>

        <div className="p-4">
          {hasCheckIns ? (
            <CheckInTrend data={trendData} />
          ) : (
            <EmptyState
              icon={<MoonStar className="h-5 w-5" />}
              title="No check-ins saved yet"
              description="Save one check-in to start the trend. Ratings and sleep hours appear here day by day as the record grows."
            />
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line/80 bg-surface2/60 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-medium text-ink-soft">
            <HeartPulse className="h-3 w-3 text-instrument" aria-hidden="true" />
            Self-reported ratings are not a diagnosis.
          </span>
          <span
            className={cn(
              'text-[0.62rem] font-semibold',
              latest ? 'text-status-ok' : 'text-ink-faint',
            )}
          >
            {latest ? `Last saved on day ${latest.day}` : 'Awaiting first check-in'}
          </span>
        </footer>
      </section>
    </div>
  );
}
