import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { AlertCard, LogEntry } from '@/contracts/types';
import { addLogEntry, listLogEntries } from '@/storage';
import { useAppState } from '@/app/AppState';

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
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Investigation journal</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Record observations, actions taken, and reviews on this device so the flight surgeon
          can follow the evidence.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-panel border border-line rounded-sheet p-5 flex flex-col gap-4"
      >
        <h2 className="font-bold text-base text-ink">Record observation or action</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="journal-obs" className="text-xs font-bold text-ink-soft">
            Observation or trigger
          </label>
          <input
            id="journal-obs"
            type="text"
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="What changed, and when"
            className="bg-ceramic border border-line rounded-input px-3 py-2 text-sm text-ink focus:border-instrument min-h-[44px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="journal-action" className="text-xs font-bold text-ink-soft">
            Action taken <span className="text-status-urgent">*</span>
          </label>
          <input
            id="journal-action"
            type="text"
            required
            value={actionTaken}
            onChange={(event) => setActionTaken(event.target.value)}
            placeholder="What you did"
            className="bg-ceramic border border-line rounded-input px-3 py-2 text-sm text-ink focus:border-instrument min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="journal-reviewer" className="text-xs font-bold text-ink-soft">
              Reviewed by
            </label>
            <select
              id="journal-reviewer"
              value={reviewedBy}
              onChange={(event) => setReviewedBy(event.target.value as Reviewer)}
              className="bg-ceramic border border-line rounded-input px-3 py-2 text-sm text-ink focus:border-instrument min-h-[44px]"
            >
              <option value="astronaut">Astronaut (self)</option>
              <option value="flight_surgeon">Flight surgeon</option>
              <option value="unspecified">Unspecified crew member</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="journal-note" className="text-xs font-bold text-ink-soft">
              Additional note
            </label>
            <input
              id="journal-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Anything else on the record"
              className="bg-ceramic border border-line rounded-input px-3 py-2 text-sm text-ink focus:border-instrument min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-instrument text-panel font-bold text-sm rounded-input min-h-[44px]"
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

      <section aria-label="Journal entries" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-base text-ink">Past entries ({visibleEntries.length})</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="journal-filter" className="text-xs font-semibold text-ink-soft">
              Show
            </label>
            <select
              id="journal-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as 'all' | Reviewer)}
              className="bg-panel border border-line rounded-input px-2 py-1 text-xs text-ink min-h-[44px]"
            >
              <option value="all">All entries</option>
              <option value="astronaut">Astronaut (self)</option>
              <option value="flight_surgeon">Flight surgeon</option>
              <option value="unspecified">Unspecified</option>
            </select>
          </div>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="p-6 bg-panel border border-line rounded-sheet text-center text-ink-soft text-sm">
            No entries match this filter yet.
          </div>
        ) : (
          visibleEntries.map((entry, index) => (
            <article
              key={entry.id ?? index}
              className="bg-panel border border-line rounded-sheet p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs text-ink-soft gap-2 flex-wrap">
                <span className="font-bold text-ink">Day {entry.day}</span>
                <span>{reviewerLabel(entry.reviewedBy)}</span>
              </div>
              <p className="text-sm font-semibold text-ink">
                <strong>Observation:</strong> <span>{entry.observation}</span>
              </p>
              <p className="text-sm text-ink leading-relaxed">
                <strong>Action taken:</strong> <span>{entry.actionTaken}</span>
              </p>
              {entry.note && (
                <p className="text-xs text-ink-soft">
                  <strong>Note:</strong> <span>{entry.note}</span>
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
