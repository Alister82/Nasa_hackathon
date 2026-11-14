import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { AlertCard, LogEntry, IndicatorId, FollowUpEvaluation } from '@/contracts/types';
import { addLogEntry, listLogEntries } from '@/storage';
import { useAppState } from '@/app/AppState';
import { evaluateFollowUp } from '@/engine';
import { CheckCircle2, RotateCcw, Activity } from 'lucide-react';

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

  // Procedure follow-up evaluation state
  const [followUpIndicator, setFollowUpIndicator] = useState<IndicatorId>('heart_rate');
  const [initialReading, setInitialReading] = useState<number>(90);
  const [repeatReading, setRepeatReading] = useState<number>(76);
  const [evaluation, setEvaluation] = useState<FollowUpEvaluation | null>(null);

  const handleEvaluate = () => {
    const res = evaluateFollowUp(followUpIndicator, initialReading, repeatReading);
    setEvaluation(res);
  };

  const handleApplyToJournal = () => {
    if (!evaluation) return;
    const text = `Repeat reading evaluated: ${evaluation.baselineReading} → ${evaluation.repeatReading} (${evaluation.delta > 0 ? '+' : ''}${evaluation.delta}, ${evaluation.direction}). ${evaluation.guidanceMessage}`;
    setActionTaken((prev) => (prev ? `${prev}. ${text}` : text));
  };

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

      {/* Interactive Procedure Follow-Up Evaluator */}
      <div className="glass-panel border border-line rounded-3xl p-5 shadow-card space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-primary" />
            <h2 className="text-base font-bold text-ink">Procedure Follow-up Evaluator</h2>
          </div>
          <p className="text-xs text-ink-soft mt-0.5">
            Test whether an in-flight intervention (e.g. 5m seated rest, 4s/6s breathing) produced favorable telemetry movement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-soft">Indicator</label>
            <select
              value={followUpIndicator}
              onChange={(e) => setFollowUpIndicator(e.target.value as IndicatorId)}
              className="w-full bg-panel text-ink text-xs border border-line rounded-xl px-2.5 py-2 min-h-[44px]"
            >
              <option value="heart_rate">Resting heart rate</option>
              <option value="bp_sys">Systolic BP</option>
              <option value="bp_dia">Diastolic BP</option>
              <option value="body_temp">Core temperature</option>
              <option value="glucose">Glucose</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-soft">Initial Reading</label>
            <input
              type="number"
              value={initialReading}
              onChange={(e) => setInitialReading(Number(e.target.value))}
              className="w-full bg-panel text-ink text-xs border border-line rounded-xl px-2.5 py-2 min-h-[44px] tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-ink-soft">Repeat Reading</label>
            <input
              type="number"
              value={repeatReading}
              onChange={(e) => setRepeatReading(Number(e.target.value))}
              className="w-full bg-panel text-ink text-xs border border-line rounded-xl px-2.5 py-2 min-h-[44px] tabular-nums"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleEvaluate}
            className="px-4 py-2 bg-accent-primary text-panel font-bold text-xs rounded-xl shadow-sm hover:opacity-95 min-h-[44px]"
          >
            Evaluate Follow-up
          </button>
        </div>

        {evaluation && (
          <div className="p-4 rounded-2xl bg-panel/80 border border-line space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">Evaluation Result:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full capitalize text-[11px] ${
                  evaluation.direction === 'improved'
                    ? 'bg-status-ok/20 text-status-ok'
                    : evaluation.direction === 'unchanged'
                      ? 'bg-status-watch/20 text-status-watch'
                      : 'bg-status-review/20 text-status-review'
                }`}
              >
                {evaluation.direction} ({evaluation.delta > 0 ? `+${evaluation.delta}` : evaluation.delta})
              </span>
            </div>
            <p className="text-ink leading-relaxed">{evaluation.guidanceMessage}</p>
            <p className="text-ink-soft leading-relaxed">
              <strong>Next step:</strong> {evaluation.recommendedNextStep}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleApplyToJournal}
                className="text-xs font-semibold text-accent-primary hover:underline min-h-[44px] inline-flex items-center"
              >
                + Copy evaluation into action taken
              </button>
            </div>
          </div>
        )}
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
