import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind } from 'lucide-react';

export interface BreathingPacerWidgetProps {
  durationSeconds?: number;
  onComplete?: () => void;
  className?: string;
}

export function BreathingPacerWidget({
  durationSeconds = 120,
  onComplete,
  className = '',
}: BreathingPacerWidgetProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [phaseCount, setPhaseCount] = useState<number>(4);

  const timerRef = useRef<number | null>(null);
  const phaseTimerRef = useRef<number | null>(null);

  // Cycle: Inhale 4s, Exhale 6s (total 10s cycle)
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    let currentPhase: 'inhale' | 'exhale' = 'inhale';
    let count = 4;

    phaseTimerRef.current = window.setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (currentPhase === 'inhale') {
          currentPhase = 'exhale';
          count = 6;
        } else {
          currentPhase = 'inhale';
          count = 4;
        }
        setPhase(currentPhase);
      }
      setPhaseCount(count);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, [isActive, onComplete]);

  const toggle = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(durationSeconds);
      setPhase('inhale');
      setPhaseCount(4);
    }
    setIsActive((prev) => !prev);
  };

  const reset = () => {
    setIsActive(false);
    setSecondsRemaining(durationSeconds);
    setPhase('inhale');
    setPhaseCount(4);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className={`glass-surface rounded-sheet p-4 border border-line flex flex-col sm:flex-row items-center justify-between gap-5 select-none ${className}`}
      role="region"
      aria-label="4s/6s guided breathing pacer"
    >
      {/* Visual Expanding Ring */}
      <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
        <div
          className={`absolute rounded-full border-2 border-instrument/40 transition-all ease-in-out ${
            isActive && phase === 'inhale'
              ? 'scale-125 duration-[4000ms] bg-instrument/15'
              : isActive && phase === 'exhale'
                ? 'scale-75 duration-[6000ms] bg-instrument/5'
                : 'scale-90 duration-500 bg-line/20'
          }`}
          style={{ width: '100%', height: '100%' }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <Wind className="w-4 h-4 text-instrument mb-0.5" />
          <span className="text-[11px] font-bold text-ink uppercase tracking-wider">
            {isActive ? phase : 'Ready'}
          </span>
          {isActive && (
            <span className="text-xs text-ink-muted tabular-nums font-semibold">
              {phaseCount}s
            </span>
          )}
        </div>
      </div>

      {/* Narrative & session info */}
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
          <h4 className="text-sm font-semibold text-ink">4s / 6s Breathing Pacer</h4>
          <span className="text-xs text-ink-muted tabular-nums font-medium">({timeFormatted})</span>
        </div>
        <p className="text-xs text-ink-soft leading-relaxed max-w-md">
          {isActive
            ? phase === 'inhale'
              ? 'Inhale smoothly through your nose (4 seconds)...'
              : 'Slowly exhale through your mouth (6 seconds)...'
            : 'Slow exhalations engage the parasympathetic system and help stabilize transient vitals.'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 justify-center">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-instrument text-white text-xs font-semibold rounded-input hover:bg-instrument-hover transition-colors min-h-[44px]"
          aria-label={isActive ? 'Pause breathing pacer' : 'Start breathing pacer'}
        >
          {isActive ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Start 2 min
            </>
          )}
        </button>

        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center p-2 text-ink-soft hover:text-ink hover:bg-line/20 rounded-input transition-colors min-h-[44px] min-w-[44px]"
          title="Reset timer"
          aria-label="Reset pacer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
