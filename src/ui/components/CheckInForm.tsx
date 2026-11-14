import React, { useState } from 'react';
import type { CheckInInput, CheckInResult, Rating } from '@/contracts/types';
import { AlertTriangleIcon } from './Icons';

export interface CheckInFormProps {
  crewId: string;
  day: number;
  onSubmit: (input: CheckInInput) => Promise<CheckInResult>;
  onNeedHelpNow?: () => void;
}

export function CheckInForm({ crewId, day, onSubmit, onNeedHelpNow }: CheckInFormProps) {
  const [mood, setMood] = useState<Rating>(3);
  const [stress, setStress] = useState<Rating>(2);
  const [energy, setEnergy] = useState<Rating>(3);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

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
    <div className="flex flex-col gap-6 w-full">
      <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-sheet p-5 sm:p-6 shadow-sm flex flex-col gap-6">
        <h2 className="text-xl font-bold text-ink">Daily wellbeing rating</h2>

        {/* 1. Mood slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="mood-slider" className="font-bold text-ink">
              Mood: <span className="text-instrument font-bold tabular-nums">{mood}</span> / 5
            </label>
            <span className="text-xs text-ink-soft">1 (Low) to 5 (Good)</span>
          </div>
          <input
            id="mood-slider"
            type="range"
            min={1}
            max={5}
            step={1}
            value={mood}
            onChange={(e) => setMood(Number(e.target.value) as Rating)}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={mood}
            aria-valuetext={`Mood rating ${mood} of 5`}
            className="w-full h-2 bg-ceramic rounded-lg appearance-none cursor-pointer accent-instrument min-h-[44px]"
          />
        </div>

        {/* 2. Stress slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="stress-slider" className="font-bold text-ink">
              Stress: <span className="text-instrument font-bold tabular-nums">{stress}</span> / 5
            </label>
            <span className="text-xs text-ink-soft">1 (Calm) to 5 (High)</span>
          </div>
          <input
            id="stress-slider"
            type="range"
            min={1}
            max={5}
            step={1}
            value={stress}
            onChange={(e) => setStress(Number(e.target.value) as Rating)}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={stress}
            aria-valuetext={`Stress rating ${stress} of 5`}
            className="w-full h-2 bg-ceramic rounded-lg appearance-none cursor-pointer accent-instrument min-h-[44px]"
          />
        </div>

        {/* 3. Energy slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="energy-slider" className="font-bold text-ink">
              Energy: <span className="text-instrument font-bold tabular-nums">{energy}</span> / 5
            </label>
            <span className="text-xs text-ink-soft">1 (Low) to 5 (High)</span>
          </div>
          <input
            id="energy-slider"
            type="range"
            min={1}
            max={5}
            step={1}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value) as Rating)}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={energy}
            aria-valuetext={`Energy rating ${energy} of 5`}
            className="w-full h-2 bg-ceramic rounded-lg appearance-none cursor-pointer accent-instrument min-h-[44px]"
          />
        </div>

        {/* Optional Note */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="checkin-note" className="font-bold text-ink">
              Personal note (optional)
            </label>
            <span className="text-xs text-ink-soft">Stays on this device.</span>
          </div>
          <textarea
            id="checkin-note"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How are you feeling today?"
            className="w-full bg-ceramic border border-line rounded-input p-3 text-sm text-ink focus:outline-none focus:border-instrument"
          />
          <span className="text-xs text-ink-soft text-right tabular-nums">
            {note.length} / 500
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-line flex-wrap">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-instrument text-panel font-bold text-sm sm:text-base rounded-input hover:opacity-90 min-h-[44px] min-w-[44px]"
          >
            {isSubmitting ? 'Saving...' : 'Save check-in'}
          </button>

          <button
            type="button"
            onClick={handleUrgentHelp}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-status-urgent-soft text-status-urgent border border-status-urgent font-bold text-sm rounded-input hover:bg-status-urgent hover:text-panel transition-colors min-h-[44px] min-w-[44px]"
          >
            <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
            <span>I need help now</span>
          </button>
        </div>
      </form>

      {/* Check-in result message & suggestions */}
      {result && (
        <div
          role="status"
          className={`p-5 rounded-sheet border shadow-sm ${
            result.level === 'urgent'
              ? 'bg-status-urgent-soft border-status-urgent text-ink'
              : result.level === 'support'
              ? 'bg-status-watch-soft border-status-watch text-ink'
              : 'bg-panel border-line text-ink'
          }`}
        >
          <h3 className="font-bold text-base mb-2">Check-in response</h3>
          <p className="text-sm sm:text-base leading-relaxed mb-4">{result.message}</p>

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <span className="text-xs font-bold uppercase tracking-wider block mb-2">
                Suggestions that may help:
              </span>
              <ul className="list-disc pl-5 space-y-1.5 text-sm">
                {result.suggestions.map((s, idx) => (
                  <li key={s.id || idx}>{s.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

