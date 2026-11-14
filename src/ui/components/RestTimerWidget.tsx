import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, CheckCircle2 } from 'lucide-react';

export interface RestTimerWidgetProps {
  initialSeconds?: number;
  onComplete?: () => void;
  className?: string;
}

export function RestTimerWidget({
  initialSeconds = 300,
  onComplete,
  className = '',
}: RestTimerWidgetProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Play a soft synthetic completion tone using Web Audio API
  const playCompletionTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio autoplay policy fallback; silent safe fail
    }
  };

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setCompleted(true);
            playCompletionTone();
            if (onComplete) onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsLeft, onComplete]);

  const toggleTimer = () => setIsActive((prev) => !prev);

  const resetTimer = () => {
    setIsActive(false);
    setCompleted(false);
    setSecondsLeft(initialSeconds);
  };

  const fastForwardDemo = () => {
    setIsActive(true);
    setCompleted(false);
    setSecondsLeft(2);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPct = ((initialSeconds - secondsLeft) / initialSeconds) * 100;

  return (
    <div
      className={`glass-surface rounded-sheet p-3 sm:p-4 border border-line flex flex-col sm:flex-row items-center justify-between gap-4 select-none ${className}`}
      role="region"
      aria-label="5-minute rest timer tool"
    >
      {/* Timer display */}
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
          <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              className="text-line/40 stroke-current"
              strokeWidth="3.5"
              fill="none"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              className="text-instrument stroke-current transition-all duration-300"
              strokeWidth="3.5"
              strokeDasharray={125.6}
              strokeDashoffset={125.6 - (125.6 * progressPct) / 100}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="absolute text-xs font-bold text-ink tabular-nums">
            {timeFormatted}
          </span>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink">
            {completed ? 'Seated Rest Complete' : '5-Minute Seated Rest'}
          </h4>
          <p className="text-xs text-ink-soft">
            {completed
              ? 'Rest period finished. Repeat your blood pressure reading now.'
              : isActive
                ? 'Sit quietly with feet flat and back supported.'
                : 'Pause and rest before taking a repeat reading.'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {!completed ? (
          <button
            type="button"
            onClick={toggleTimer}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-instrument text-white text-xs font-semibold rounded-input hover:bg-instrument-hover transition-colors min-h-[44px] min-w-[80px]"
            aria-label={isActive ? 'Pause timer' : 'Start rest timer'}
          >
            {isActive ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Start rest
              </>
            )}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-status-ok bg-status-ok-soft px-3 py-2 rounded-input min-h-[44px]">
            <CheckCircle2 className="w-4 h-4 text-status-ok" /> Rest complete
          </span>
        )}

        <button
          type="button"
          onClick={resetTimer}
          className="inline-flex items-center justify-center p-2 text-ink-soft hover:text-ink hover:bg-line/20 rounded-input transition-colors min-h-[44px] min-w-[44px]"
          title="Reset timer"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={fastForwardDemo}
          className="inline-flex items-center justify-center gap-1 text-[11px] text-ink-muted hover:text-ink hover:bg-line/20 px-2 py-1.5 rounded-input transition-colors min-h-[44px]"
          title="Fast-forward for demonstration"
          aria-label="Fast-forward demo"
        >
          <FastForward className="w-3 h-3" />
          <span className="hidden sm:inline">Demo skip</span>
        </button>
      </div>
    </div>
  );
}
