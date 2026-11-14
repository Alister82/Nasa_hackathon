import React, { useState, useEffect } from 'react';
import type { LogEntry } from '@/contracts/types';
import { listLogEntries, addLogEntry } from '@/storage';

export function JournalPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [observation, setObservation] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [reviewedBy, setReviewedBy] = useState<'astronaut' | 'flight_surgeon' | 'unspecified'>('astronaut');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const list = await listLogEntries('crew-1');
      setEntries(list);
    } catch {
      // In-memory fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) return;

    setIsSubmitting(true);
    try {
      await addLogEntry({
        crewId: 'crew-1',
        day: 120,
        createdAt: new Date().toISOString(),
        cardId: null,
        observation: observation.trim() || 'Manual observation logged',
        actionTaken: actionTaken.trim(),
        reviewedBy,
        note: note.trim(),
      });
      setObservation('');
      setActionTaken('');
      setNote('');
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Investigation journal</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Log observations, actions taken, and ground reviews for auditability and flight surgeon handoffs.
        </p>
      </div>

      {/* Form: Add Entry */}
      <form onSubmit={handleAdd} className="bg-panel border border-line rounded-sheet p-5 shadow-sm flex flex-col gap-4">
        <h2 className="font-bold text-base text-ink">Record observation or action</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="journal-obs" className="text-xs font-bold text-ink-soft">
            Observation / trigger
          </label>
          <input
            id="journal-obs"
            type="text"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="e.g. Heart rate elevated above baseline for 5 days"
            className="bg-ceramic border border-line rounded-input px-3 py-2 text-sm text-ink focus:outline-none focus:border-instrument min-h-[44px]"
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
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="e.g. Repeated resting measurement after 5 minutes seated, hydrated"
            className="bg-ceramic border border-line rounded-input px-3 py-2 text-sm text-ink focus:outline-none focus:border-instrument min-h-[44px]"
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
              onChange={(e) => setReviewedBy(e.target.value as any)}
              className="bg-ceramic border border-line rounded-input px-3 py-2 text-sm text-ink focus:outline-none focus:border-instrument min-h-[44px]"
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
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ground notified via teleconference"
              className="bg-ceramic border border-line rounded-input px-3 py-2 text-sm text-ink focus:outline-none focus:border-instrument min-h-[44px]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start px-5 py-2.5 bg-instrument text-panel font-bold text-sm rounded-input hover:opacity-90 min-h-[44px]"
        >
          {isSubmitting ? 'Saving...' : 'Add journal entry'}
        </button>
      </form>

      {/* Entry List: Newest First */}
      <section aria-label="Journal Entries List" className="flex flex-col gap-3">
        <h2 className="font-bold text-base text-ink">Past entries ({entries.length})</h2>

        {entries.length === 0 ? (
          <div className="p-6 bg-panel border border-line rounded-sheet text-center text-ink-soft text-sm">
            No entries recorded yet. Use the form above to log observations and actions.
          </div>
        ) : (
          entries.map((entry, idx) => (
            <article
              key={entry.id ?? idx}
              className="bg-panel border border-line rounded-sheet p-4 shadow-sm flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs text-ink-soft">
                <span className="font-bold text-ink">Day {entry.day}</span>
                <span className="capitalize">Reviewer: {entry.reviewedBy.replace('_', ' ')}</span>
              </div>
              <p className="text-sm font-semibold text-ink">
                <strong>Observation:</strong> {entry.observation}
              </p>
              <p className="text-sm text-ink leading-relaxed">
                <strong>Action taken:</strong> {entry.actionTaken}
              </p>
              {entry.note && (
                <p className="text-xs text-ink-soft italic">
                  Note: {entry.note}
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
