import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, HeartPulse, MessageSquareText, Sparkles } from 'lucide-react';
import type { CheckInInput, CheckInResult, Rating } from '@/contracts/types';
import { cn } from '@/ui/lib/format';

export interface CheckInFormProps {
  crewId: string;
  day: number;
  onSubmit: (input: CheckInInput) => Promise<CheckInResult>;
  onNeedHelpNow?: () => void;
}

interface RatingField {
  id: 'mood' | 'stress' | 'energy';
  label: string;
  low: string;
  high: string;
  accent: string;
}

const RATING_FIELDS: RatingField[] = [
  { id: 'mood', label: 'Mood', low: '1 · Low', high: '5 · Good', accent: 'var(--instrument)' },
  { id: 'stress', label: 'Stress', low: '1 · Calm', high: '5 · High', accent: 'var(--status-review)' },
  { id: 'energy', label: 'Energy', low: '1 · Low', high: '5 · High', accent: 'var(--status-ok)' },
];

const LEVEL_STYLES: Record<
  CheckInResult['level'],
  { panel: string; label: string; chip: string }
> = {
  urgent: {
    panel: 'border-status-urgent/35 bg-status-urgent-soft/80',
    label: 'Urgent',
    chip: 'chip-urgent',
  },
  support: {
    panel: 'border-status-watch/35 bg-status-watch-soft/80',
    label: 'Support suggested',
    chip: 'chip-watch',
  },
  none: {
    panel: 'border-status-ok/30 bg-white/80',
    label: 'Recorded',
    chip: 'chip-ok',
  },
};

export function CheckInForm({ crewId, day, onSubmit, onNeedHelpNow }: CheckInFormProps) {
  const [mood, setMood] = useState<Rating>(3);
  const [stress, setStress] = useState<Rating>(2);
  const [energy, setEnergy] = useState<Rating>(3);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

  const values: Record<RatingField['id'], Rating> = { mood, stress, energy };
  const setters: Record<RatingField['id'], (value: Rating) => void> = {
    mood: setMood,
    stress: setStress,
    energy: setEnergy,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        crewId,
        day,
        mood,
        stress,
        energy,
        note: note.trim() || undefined,
        urgentHelpRequested: false,
      });
      setResult(res);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrgentHelp = async () => {
    if (onNeedHelpNow) {
      onNeedHelpNow();
      return;
    }
    const res = await onSubmit({
      crewId,
      day,
      mood,
      stress,
      energy,
      note: note.trim() || undefined,
      urgentHelpRequested: true,
    });
    setResult(res);
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="panel overflow-hidden"
        aria-label="Daily wellbeing check-in form"
      >
        <header className="relative overflow-hidden border-b border-line/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(240,247,255,0.9))] px-4 py-4 sm:px-5">
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(78,139,235,0.22),transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white bg-white/85 text-instrument shadow-xs">
              <Sparkles className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-[1.05rem] font-extrabold tracking-[-0.03em] text-ink">
                Daily wellbeing rating
              </h2>
              <p className="mt-0.5 text-[0.7rem] leading-relaxed text-ink-soft">
                Three self-ratings for mission day {day}. Personal notes stay on this device.
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-3 p-4 sm:p-5">
          {RATING_FIELDS.map((field) => {
            const value = values[field.id];
            const setValue = setters[field.id];
            const percent = ((value - 1) / 4) * 100;
            return (
              <div
                key={field.id}
                className="rounded-[16px] border border-line bg-white/78 px-3.5 py-3 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor={`${field.id}-slider`} className="text-[0.8rem] font-semibold text-ink">
                    {field.label}
                  </label>
                  <span className="inline-flex items-baseline gap-1 text-[0.66rem] font-medium text-ink-soft">
                    <span
                      className="font-display text-[1.2rem] font-extrabold tabular-nums leading-none"
                      style={{ color: field.accent }}
                    >
                      {value}
                    </span>
                    / 5
                  </span>
                </div>

                <div className="mt-2.5">
                  <div className="relative">
                    <div
                      className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-surface3"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: field.accent }}
                      />
                    </div>
                    <input
                      id={`${field.id}-slider`}
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value) as Rating)}
                      aria-valuemin={1}
                      aria-valuemax={5}
                      aria-valuenow={value}
                      aria-valuetext={`${field.label} rating ${value} of 5`}
                      className="relative z-10 h-11 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_8px_rgba(22,52,92,0.4)]"
                      style={{ accentColor: field.accent }}
                    />
                  </div>
                  <div className="mt-0.5 flex justify-between text-[0.6rem] font-medium text-ink-faint">
                    <span>{field.low}</span>
                    <span>{field.high}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="rounded-[16px] border border-line bg-white/78 px-3.5 py-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="checkin-note" className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-ink">
                <MessageSquareText className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                Personal note (optional)
              </label>
              <span className="text-[0.6rem] text-ink-soft">Stays on this device.</span>
            </div>
            <textarea
              id="checkin-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How are you feeling today?"
              className="field mt-2 resize-none"
            />
            <span className="mt-1 block text-right text-[0.6rem] tabular-nums text-ink-faint">
              {note.length} / 500
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/80 bg-surface2/70 px-4 py-3 sm:px-5">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary !min-h-[44px] !px-5">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Saving…' : 'Save check-in'}
          </button>

          <button
            type="button"
            onClick={handleUrgentHelp}
            className="btn btn-danger !min-h-[44px]"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>I need help now</span>
          </button>
        </div>
      </form>

      {result && (
        <section
          role="status"
          className={cn('rounded-[18px] border px-4 py-4 shadow-card', LEVEL_STYLES[result.level].panel)}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 font-display text-[0.95rem] font-bold tracking-[-0.02em] text-ink">
              <HeartPulse className="h-4 w-4 text-instrument" aria-hidden="true" />
              Check-in response
            </h3>
            <span className={cn('chip', LEVEL_STYLES[result.level].chip)}>
              {LEVEL_STYLES[result.level].label}
            </span>
          </div>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-2">{result.message}</p>

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="mt-3 border-t border-ink/10 pt-3">
              <span className="mb-1.5 block text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink-faint">
                Suggestions that may help
              </span>
              <ul className="space-y-1.5">
                {result.suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id || index}
                    className="flex gap-2 text-[0.76rem] leading-relaxed text-ink-2"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-instrument" aria-hidden="true" />
                    {suggestion.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
