import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Filter,
  NotebookPen,
  Save,
  Stethoscope,
  UserRound,
} from '@/ui/components/icons';
import type { AlertCard, LogEntry } from '@/contracts/types';
import { addLogEntry, listLogEntries } from '@/storage';
import { useAppState } from '@/app/AppState';
import { EmptyState, PageHeader, SectionHeading, TextLink } from '@/ui/components/ui';
import { SeverityMark } from '@/ui/components/SeverityMark';
import { cn, timeAgo } from '@/ui/lib/format';

type Reviewer = LogEntry['reviewedBy'];

function reviewerLabel(reviewer: Reviewer): string {
  if (reviewer === 'flight_surgeon') return 'Flight surgeon';
  if (reviewer === 'astronaut') return 'Astronaut (self)';
  return 'Unspecified crew member';
}

export function JournalPage() {
  const { crewId, viewDay } = useAppState();
  const location = useLocation();
  const card = (location.state as { card?: AlertCard } | null)?.card ?? null;

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [observation, setObservation] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [reviewedBy, setReviewedBy] = useState<Reviewer>('astronaut');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<'all' | Reviewer>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (card) setObservation(card.observation);
  }, [card]);

  const loadData = useCallback(async () => {
    setEntries(await listLogEntries(crewId));
  }, [crewId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (saved) statusRef.current?.focus();
  }, [saved]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!actionTaken.trim()) return;

    setIsSubmitting(true);
    try {
      await addLogEntry({
        crewId,
        day: viewDay,
        createdAt: new Date().toISOString(),
        cardId: card?.id ?? null,
        observation: observation.trim() || (card?.title ?? 'Manual observation'),
        actionTaken: actionTaken.trim(),
        reviewedBy,
        note: note.trim(),
      });
      setObservation('');
      setActionTaken('');
      setNote('');
      setSaved(true);
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleEntries =
    filter === 'all' ? entries : entries.filter((entry) => entry.reviewedBy === filter);

  return (
    <div className="page-wrap flex flex-col gap-5">
      <PageHeader
        kicker="Investigation journal"
        title="Record what happened and what you did"
        description={
          <>
            Observations, actions taken, and reviews are stored on this device so the flight
            surgeon can follow the evidence later.
          </>
        }
        meta={
          <>
            <span className="chip chip-primary">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              Day {viewDay}
            </span>
            <span className="chip chip-neutral">{entries.length} entries on record</span>
            {card && (
              <span className="chip chip-review">
                <ClipboardList className="h-3 w-3" aria-hidden="true" />
                Linked to alert
              </span>
            )}
          </>
        }
        actions={
          <>
            <TextLink to="/">Back to dashboard</TextLink>
            <Link to="/log?tab=reports" className="btn btn-secondary">
              Saved readings
            </Link>
          </>
        }
      />

      {card && (
        <section className="relative overflow-hidden rounded-[18px] border border-instrument/20 bg-instrument-soft/55 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <SeverityMark severity={card.severity} />
            <div className="min-w-0">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-instrument-deep">
                From alert · day {card.day}
              </p>
              <p className="mt-0.5 text-[0.82rem] font-semibold text-ink">{card.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[0.68rem] leading-relaxed text-ink-soft">
                {card.observation}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <form onSubmit={handleAdd} className="panel overflow-hidden">
          <header className="flex items-center gap-2 border-b border-line/80 bg-surface2/55 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-instrument-soft text-instrument">
              <NotebookPen className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-ink">
                Record observation or action
              </h2>
              <p className="text-[0.64rem] text-ink-soft">Saved against mission day {viewDay}.</p>
            </div>
          </header>

          <div className="flex flex-col gap-3.5 p-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="journal-obs" className="field-label">
                Observation or trigger
              </label>
              <input
                id="journal-obs"
                type="text"
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                placeholder="What changed, and when"
                className="field"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="journal-action" className="field-label">
                Action taken <span className="text-status-urgent">*</span>
              </label>
              <input
                id="journal-action"
                type="text"
                required
                value={actionTaken}
                onChange={(event) => setActionTaken(event.target.value)}
                placeholder="What you did"
                className="field"
              />
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="journal-reviewer" className="field-label">
                  Reviewed by
                </label>
                <select
                  id="journal-reviewer"
                  value={reviewedBy}
                  onChange={(event) => setReviewedBy(event.target.value as Reviewer)}
                  className="field"
                >
                  <option value="astronaut">Astronaut (self)</option>
                  <option value="flight_surgeon">Flight surgeon</option>
                  <option value="unspecified">Unspecified crew member</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="journal-note" className="field-label">
                  Additional note
                </label>
                <input
                  id="journal-note"
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Anything else on the record"
                  className="field"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line/70 pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? 'Saving…' : 'Add journal entry'}
              </button>
              <span className="text-[0.62rem] text-ink-soft">
                Entries are append-only on this device.
              </span>
              {saved && (
                <span
                  ref={statusRef}
                  tabIndex={-1}
                  role="status"
                  className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-status-ok"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Saved for day {viewDay}.
                </span>
              )}
            </div>
          </div>
        </form>

        <aside className="flex min-w-0 flex-col gap-3">
          <section className="panel p-3.5">
            <SectionHeading title="On this record" subtitle="Counts update as you save." />
            <dl className="mt-2.5 space-y-2 text-[0.7rem]">
              {[
                ['Entries', String(entries.length)],
                ['By astronaut', String(entries.filter((entry) => entry.reviewedBy === 'astronaut').length)],
                ['By flight surgeon', String(entries.filter((entry) => entry.reviewedBy === 'flight_surgeon').length)],
                ['Latest mission day', entries.length > 0 ? `Day ${Math.max(...entries.map((entry) => entry.day))}` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2 border-b border-line/60 pb-1.5 last:border-0 last:pb-0">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd className="font-semibold tabular-nums text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-[16px] border border-line bg-surface2 p-3.5">
            <p className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-ink">
              <Stethoscope className="h-3.5 w-3.5 text-instrument" aria-hidden="true" />
              Why write it down?
            </p>
            <p className="mt-1 text-[0.66rem] leading-relaxed text-ink-soft">
              A reading shows a number. The journal shows the context: what you noticed, what you
              changed, and who reviewed it. That is what makes a trend useful later.
            </p>
            <Link to="/help" className="mt-2 inline-flex text-[0.64rem] font-semibold text-instrument hover:underline">
              How to record guidance steps
            </Link>
          </section>

          <section className="rounded-[18px] border border-status-watch/25 bg-status-watch-soft/60 p-3.5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-status-watch">
              Privacy
            </p>
            <p className="mt-1 text-[0.66rem] leading-relaxed text-ink-2">
              Journal text stays in local browser storage. It is not sent to a server or included
              in simulated crew data.
            </p>
          </section>
        </aside>
      </div>

      <section aria-label="Journal entries" className="panel overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line/80 px-4 py-3">
          <SectionHeading
            title={`Past entries (${visibleEntries.length})`}
            subtitle="Newest entries appear first."
          />
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
            <label htmlFor="journal-filter" className="text-[0.66rem] font-semibold text-ink-soft">
              Show
            </label>
            <select
              id="journal-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as 'all' | Reviewer)}
              className="field !min-h-[36px] !w-auto !py-1 !text-[0.7rem]"
            >
              <option value="all">All entries</option>
              <option value="astronaut">Astronaut (self)</option>
              <option value="flight_surgeon">Flight surgeon</option>
              <option value="unspecified">Unspecified</option>
            </select>
          </div>
        </header>

        {visibleEntries.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<NotebookPen className="h-5 w-5" />}
              title="No entries match this filter yet"
              description="Record an observation or action above. Entries stay on this device and are listed newest first."
            />
          </div>
        ) : (
          <ol className="divide-y divide-line/70">
            {visibleEntries.map((entry, index) => (
              <li key={entry.id ?? index} className="flex gap-3 px-4 py-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-soft">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[0.74rem] font-semibold text-ink">Day {entry.day}</span>
                    <span className="chip chip-neutral !py-0.5 !text-[0.56rem]">
                      {reviewerLabel(entry.reviewedBy)}
                    </span>
                    <span className="ml-auto text-[0.6rem] text-ink-faint">{timeAgo(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-[0.76rem] font-semibold leading-relaxed text-ink">
                    <span className="text-ink-faint">Observation:</span> {entry.observation}
                  </p>
                  <p className="mt-0.5 text-[0.74rem] leading-relaxed text-ink-2">
                    <span className="text-ink-faint">Action taken:</span> {entry.actionTaken}
                  </p>
                  {entry.note && (
                    <p className="mt-1 text-[0.66rem] leading-relaxed text-ink-soft">
                      <span className="font-semibold text-ink-soft">Note:</span> {entry.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        <footer className="border-t border-line/80 bg-surface2/55 px-4 py-2.5">
          <p className={cn('text-[0.62rem] text-ink-soft')}>
            Journal entries are decision-support notes, not a medical record of diagnosis or
            treatment.
          </p>
        </footer>
      </section>
    </div>
  );
}
