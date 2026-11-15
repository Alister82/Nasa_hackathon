import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  LineChart,
  Stethoscope,
} from 'lucide-react';
import type { CheckInRecord, DomainId, IndicatorId, MeasurementEntry } from '@/contracts/types';
import { DOMAIN_LABELS, DOMAIN_ORDER, INDICATORS } from '@/contracts/indicators';
import { MISSION_SETTINGS, REFERENCE_RANGES } from '@/guidance';
import { MeasurementForm } from '@/ui/components/MeasurementForm';
import { EmptyState, PageHeader, SegmentedControl, TextLink } from '@/ui/components/ui';
import { DomainIcon, IndicatorIcon } from '@/ui/components/MetricTile';
import { IndicatorChart } from '@/ui/charts/IndicatorChart';
import { useAppState } from '@/app/AppState';
import { loadCheckIns, loadEntries } from '@/storage';
import { cn, timeAgo } from '@/ui/lib/format';

type TabId = 'vitals' | 'trends' | 'reports';

const TABS: Array<{ value: TabId; label: string }> = [
  { value: 'vitals', label: 'Vitals' },
  { value: 'trends', label: 'Trends' },
  { value: 'reports', label: 'Reports' },
];

function isTab(value: string | null): value is TabId {
  return value === 'vitals' || value === 'trends' || value === 'reports';
}

export function LogPage() {
  const { crewId, crewName, missionSetting, viewDay, analysis, cards, saveMeasurements } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab: TabId = isTab(requestedTab) ? requestedTab : 'vitals';

  const [existing, setExisting] = useState<Partial<Record<IndicatorId, number>>>({});
  const [entriesVersion, setEntriesVersion] = useState(0);
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [domain, setDomain] = useState<DomainId>('cardiovascular');

  const reloadEntries = useCallback(async () => {
    const all = await loadEntries(crewId);
    setEntries(all);
    const today = all.find((entry) => entry.day === viewDay);
    setExisting(today?.values ?? {});
  }, [crewId, viewDay]);

  useEffect(() => {
    void reloadEntries();
  }, [reloadEntries, entriesVersion]);

  useEffect(() => {
    void loadCheckIns(crewId).then(setCheckIns);
  }, [crewId]);

  const handleSave = async (values: Partial<Record<IndicatorId, number>>) => {
    await saveMeasurements(values);
    setEntriesVersion((version) => version + 1);
  };

  const setTab = (next: TabId) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const todayEntry = entries.find((entry) => entry.day === viewDay);
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.day - a.day),
    [entries],
  );
  const domainIndicators = INDICATORS.filter((indicator) => indicator.domain === domain);
  const domainStatus = analysis?.domains[domain]?.status ?? 'ok';
  const setting = MISSION_SETTINGS[missionSetting];
  const attentionCount = cards.filter((card) => card.severity !== 'info').length;

  const formKey = String(viewDay);

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker="Health monitor"
        title="Measurements and trends"
        description={
          <>
            Manual health indicators for mission day {viewDay}. Values are saved on this device
            and replace the simulated reading for that day only.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">{crewName}</span>
            <span className="chip chip-neutral">{setting.label}</span>
            <span className="chip chip-neutral">
              <Database className="h-3 w-3" aria-hidden="true" />
              IndexedDB · local only
            </span>
            {todayEntry && (
              <span className="chip chip-ok">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                {Object.keys(todayEntry.values).length} values saved today
              </span>
            )}
          </>
        }
        actions={
          <>
            <TextLink to="/checkin">Wellbeing check-in</TextLink>
            <Link to="/" className="btn btn-secondary">
              Back to dashboard
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          options={TABS}
          value={tab}
          onChange={setTab}
          ariaLabel="Health monitor sections"
        />
        <span className="text-[0.64rem] text-ink-soft">
          Measurement logic and thresholds are unchanged from the guidance module.
        </span>
      </div>

      {tab === 'vitals' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0">
            <MeasurementForm
              key={formKey}
              day={viewDay}
              setting={missionSetting}
              existing={existing}
              onSave={handleSave}
            />
          </div>

          <aside className="flex min-w-0 flex-col gap-3">
            <section className="panel p-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-instrument-soft text-instrument">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-[0.78rem] font-bold text-ink">After you save</h2>
                  <p className="text-[0.62rem] text-ink-soft">Deterministic, on-device steps</p>
                </div>
              </div>
              <ol className="mt-3 space-y-2">
                {[
                  'Values replace the simulated reading for this mission day.',
                  'Vigil re-runs the CUSUM detector against your own pre-flight baseline.',
                  'Alert cards and escalation text update with the mission setting.',
                  'The timeline and domain status refresh from the same evidence.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-2 text-[0.68rem] leading-relaxed text-ink-soft">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface3 text-[0.54rem] font-bold text-ink-soft tabular-nums">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            <section className="panel p-3.5">
              <h2 className="text-[0.78rem] font-bold text-ink">Current context</h2>
              <dl className="mt-2.5 space-y-2 text-[0.68rem]">
                {[
                  ['Viewed day', `Day ${viewDay}`],
                  ['Reply window', `≥ ${setting.oneWayDelayMinutes === 0 ? 10 : 34} min`],
                  ['Active alerts', String(attentionCount)],
                  ['Saved days', String(entries.length)],
                  ['Check-ins', String(checkIns.length)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-2 border-b border-line/60 pb-1.5 last:border-0 last:pb-0">
                    <dt className="text-ink-soft">{label}</dt>
                    <dd className="font-semibold tabular-nums text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-[18px] border border-status-watch/25 bg-status-watch-soft/70 p-3.5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-status-watch">
                Safety note
              </p>
              <p className="mt-1 text-[0.68rem] leading-relaxed text-ink-2">
                Reference ranges are illustrative. If you feel unwell, follow your emergency
                procedures rather than waiting for a reading to change.
              </p>
              <Link to="/urgent" className="mt-2 inline-flex text-[0.66rem] font-bold text-status-urgent underline">
                Emergency support
              </Link>
            </section>
          </aside>
        </div>
      )}

      {tab === 'trends' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {DOMAIN_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setDomain(id)}
                className={cn(
                  'inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-[0.68rem] font-semibold transition-all',
                  domain === id
                    ? 'border-instrument/25 bg-instrument-soft text-instrument-deep shadow-xs'
                    : 'border-line bg-white/70 text-ink-soft hover:border-line-strong hover:text-ink',
                )}
              >
                <DomainIcon domain={id} className="h-3.5 w-3.5" />
                {DOMAIN_LABELS[id]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[1.05rem] font-extrabold tracking-[-0.03em] text-ink">
                {DOMAIN_LABELS[domain]}
              </h2>
              <span
                className={cn(
                  'chip',
                  domainStatus === 'ok' ? 'chip-ok' : domainStatus === 'watch' ? 'chip-watch' : 'chip-review',
                )}
              >
                {domainStatus === 'ok' ? 'Steady' : domainStatus === 'watch' ? 'Watch' : 'Review'}
              </span>
            </div>
            <span className="text-[0.64rem] text-ink-soft">
              {domainIndicators.length} indicators · mission days 1–{analysis?.upToDay ?? viewDay}
            </span>
          </div>

          {analysis ? (
            <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
              {domainIndicators.map((meta) => {
                const indicator = analysis.indicators[meta.id];
                const range = REFERENCE_RANGES[meta.id];
                if (!indicator || !range) return null;
                return (
                  <IndicatorChart
                    key={meta.id}
                    analysis={indicator}
                    baseline={analysis.baselines[meta.id]}
                    meta={meta}
                    range={range}
                    height={200}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<LineChart className="h-5 w-5" />}
              title="Charts need crew data"
              description="Simulated crew data is still loading. Trends appear once the engine finishes evaluating."
            />
          )}

          <div className="panel flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <p className="text-[0.66rem] text-ink-soft">
              Observed values are solid. The dashed line is expected early adaptation, not a
              prediction. The band is the pre-flight baseline ±1σ.
            </p>
            <TextLink to="/log?tab=reports">Open saved readings</TextLink>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {[
              { label: 'Saved reading days', value: entries.length, icon: Database },
              { label: 'Values on record', value: entries.reduce((sum, entry) => sum + Object.keys(entry.values).length, 0), icon: ClipboardList },
              { label: 'Wellbeing check-ins', value: checkIns.length, icon: Activity },
              { label: 'Active alerts', value: attentionCount, icon: FileText },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="panel px-3.5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">{stat.label}</p>
                    <Icon className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                  </div>
                  <p className="metric-number mt-1.5 text-[1.5rem] leading-none">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <section className="panel overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <div>
                <h2 className="text-[0.85rem] font-bold text-ink">Manually saved measurements</h2>
                <p className="text-[0.62rem] text-ink-soft">
                  Newest mission day first. Each row replaces the simulated reading for that day.
                </p>
              </div>
              <TextLink to="/journal">Investigation journal</TextLink>
            </header>

            {sortedEntries.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={<Database className="h-5 w-5" />}
                  title="No manual readings yet"
                  description="Save a measurement in the Vitals tab and it will appear here with the rest of the on-device record."
                  action={
                    <button type="button" onClick={() => setTab('vitals')} className="btn btn-primary">
                      <Stethoscope className="h-4 w-4" aria-hidden="true" />
                      Open vitals
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Mission day</th>
                      <th scope="col">Indicators saved</th>
                      <th scope="col" className="text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.slice(0, 12).map((entry) => {
                      const ids = Object.keys(entry.values) as IndicatorId[];
                      return (
                        <tr key={`${entry.crewId}-${entry.day}`}>
                          <td>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                              <CalendarDays className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                              Day {entry.day}
                            </span>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {ids.slice(0, 5).map((id) => {
                                const meta = INDICATORS.find((candidate) => candidate.id === id);
                                return (
                                  <span key={id} className="chip chip-neutral !py-0.5">
                                    <IndicatorIcon indicator={id} className="h-2.5 w-2.5" />
                                    {meta?.label ?? id}
                                  </span>
                                );
                              })}
                              {ids.length > 5 && (
                                <span className="chip chip-neutral !py-0.5">+{ids.length - 5}</span>
                              )}
                            </div>
                          </td>
                          <td className="text-right text-[0.66rem] text-ink-soft">
                            {timeAgo(entry.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {checkIns.length > 0 && (
            <section className="panel overflow-hidden">
              <header className="border-b border-line px-4 py-3">
                <h2 className="text-[0.85rem] font-bold text-ink">Recent wellbeing check-ins</h2>
                <p className="text-[0.62rem] text-ink-soft">Notes remain on this device and are not transmitted.</p>
              </header>
              <ul className="divide-y divide-line/70">
                {[...checkIns]
                  .sort((a, b) => b.day - a.day)
                  .slice(0, 6)
                  .map((record) => (
                    <li key={`${record.crewId}-${record.day}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <span className="font-semibold tabular-nums text-ink">Day {record.day}</span>
                      <span className="text-[0.66rem] text-ink-soft">
                        Mood {record.mood} · Stress {record.stress} · Energy {record.energy}
                      </span>
                      {record.urgentHelpRequested && (
                        <span className="chip chip-urgent">Help requested</span>
                      )}
                      <span className="ml-auto text-[0.62rem] text-ink-faint">{timeAgo(record.createdAt)}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
