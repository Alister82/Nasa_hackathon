import React from 'react';

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  disabled = false,
  className = '',
}: StepperProps) {
  const adjust = (delta: number) => {
    if (disabled) return;
    const next = Math.max(min, Math.min(max, Math.round((value + delta) * 10) / 10));
    onChange(next);
  };

  const buttonClass =
    'px-2 py-1.5 text-xs font-bold rounded-input bg-panel hover:bg-line/20 border border-line text-ink transition-colors min-h-[44px] min-w-[40px] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed select-none';

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => adjust(-5)}
        disabled={disabled || value <= min}
        className={buttonClass}
        aria-label="Decrease by 5"
      >
        -5
      </button>
      <button
        type="button"
        onClick={() => adjust(-1)}
        disabled={disabled || value <= min}
        className={buttonClass}
        aria-label="Decrease by 1"
      >
        -1
      </button>
      <button
        type="button"
        onClick={() => adjust(1)}
        disabled={disabled || value >= max}
        className={buttonClass}
        aria-label="Increase by 1"
      >
        +1
      </button>
      <button
        type="button"
        onClick={() => adjust(5)}
        disabled={disabled || value >= max}
        className={buttonClass}
        aria-label="Increase by 5"
      >
        +5
      </button>
    </div>
  );
}
