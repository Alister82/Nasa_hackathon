import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { AlertCard, LogEntry } from '@/contracts/types';
import { addLogEntry, listLogEntries } from '@/storage';
import { useAppState } from '@/app/AppState';
import { PageHeader, SectionCard } from '@/ui/components/PremiumComponents';

type Reviewer = LogEntry['reviewedBy'];

function reviewerLabel(reviewer: Reviewer): string {
  if (reviewer === 'flight_surgeon') return 'Flight surgeon';
  if (reviewer === 'astronaut') return 'Astronaut (self)';
  return 'Unspecified crew member';
}

const inputCls =
  'w-full bg-bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors min-h-[44px]';

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
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <PageHeader
        title="Investigation Journal"
        subtitle="Record observations, actions taken, and reviews on this device so the flight surgeon can follow the evidence."
      />

      {/* Add Entry Form */}
      <SectionCard>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <h2 className="font-bold text-base text-text-primary">Record observation or action</h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="journal-obs" className="text-xs font-semibold text-text-secondary">
              Observation or trigger
            </label>
            <input
              id="journal-obs"
              type="text"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              placeholder="What changed, and when"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="journal-action" className="text-xs font-semibold text-text-secondary">
              Action taken <span className="text-status-urgent">*</span>
            </label>
            <input
              id="journal-action"
              type="text"
              required
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
              placeholder="What you did"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="journal-reviewer" className="text-xs font-semibold text-text-secondary">
                Reviewed by
              </label>
              <select
                id="journal-reviewer"
                value={reviewedBy}
                onChange={(event) => setReviewedBy(event.target.value as Reviewer)}
                className={inputCls}
              >
                <option value="astronaut">Astronaut (self)</option>
                <option value="flight_surgeon">Flight surgeon</option>
                <option value="unspecified">Unspecified crew member</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="journal-note" className="text-xs font-semibold text-text-secondary">
                Additional note
              </label>
              <input
                id="journal-note"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Anything else on the record"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-accent text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Add journal entry'}
            </button>
            {saved && (
              <span ref={statusRef} tabIndex={-1} role="status" className="text-sm font-bold text-status-ok">
                Saved for day {viewDay}.
              </span>
            )}
          </div>
        </form>
      </SectionCard>

      {/* Entries List */}
      <section aria-label="Journal entries" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-base text-text-primary">
            Past entries ({visibleEntries.length})
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="journal-filter" className="text-xs font-semibold text-text-secondary">
              Show
            </label>
            <select
              id="journal-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as 'all' | Reviewer)}
              className="bg-bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 min-h-[44px]"
            >
              <option value="all">All entries</option>
              <option value="astronaut">Astronaut (self)</option>
              <option value="flight_surgeon">Flight surgeon</option>
              <option value="unspecified">Unspecified</option>
            </select>
          </div>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="bg-bg-surface border border-border rounded-2xl p-6 text-center text-text-secondary text-sm">
            No entries match this filter yet.
          </div>
        ) : (
          visibleEntries.map((entry, index) => (
            <article
              key={entry.id ?? index}
              className="bg-bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between text-xs text-text-secondary gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary text-sm">Day {entry.day}</span>
                  <span className="w-1 h-1 rounded-full bg-border inline-block" />
                  <span>{reviewerLabel(entry.reviewedBy)}</span>
                </div>
                <time className="tabular-nums">{new Date(entry.createdAt).toLocaleString()}</time>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">
                <span className="font-semibold">Observation: </span>
                <span>{entry.observation}</span>
              </p>
              <p className="text-sm text-text-primary leading-relaxed">
                <span className="font-semibold">Action taken: </span>
                <span>{entry.actionTaken}</span>
              </p>
              {entry.note && (
                <p className="text-xs text-text-secondary">
                  <span className="font-semibold">Note: </span>
                  <span>{entry.note}</span>
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
