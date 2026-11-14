import React, { useState } from 'react';
import type { IndicatorId, MissionSettingId, ValueClass } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { StatusChip, type StatusType } from './StatusChip';
import { mockMeasurementHelp } from '@/mocks/mockGuidance';
import { AlertTriangleIcon } from './Icons';

export interface MeasurementFormProps {
  day: number;
  setting: MissionSettingId;
  existing?: Partial<Record<IndicatorId, number>>;
  onSave: (values: Partial<Record<IndicatorId, number>>) => Promise<void>;
}

// Indicators for manual measurement entry
const LOGGABLE_INDICATORS: IndicatorId[] = [
  'heart_rate',
  'bp_sys',
  'bp_dia',
  'body_temp',
  'glucose',
  'sleep_hours',
  'exercise_minutes',
];

export function classifyValueLocal(id: IndicatorId, val: number): ValueClass {
  switch (id) {
    case 'heart_rate':
      if (val >= 60 && val <= 100) return 'normal';
      if ((val >= 50 && val <= 59) || (val >= 101 && val <= 110)) return 'borderline';
      return 'out_of_range';
    case 'bp_sys':
      if (val >= 180) return 'urgent';
      if (val >= 90 && val < 120) return 'normal';
      if ((val >= 120 && val <= 139) || (val >= 80 && val <= 89)) return 'borderline';
      return 'out_of_range';
    case 'bp_dia':
      if (val >= 120) return 'urgent';
      if (val >= 60 && val < 80) return 'normal';
      if ((val >= 80 && val <= 89) || (val >= 50 && val <= 59)) return 'borderline';
      return 'out_of_range';
    case 'body_temp':
      if (val >= 36.1 && val <= 37.2) return 'normal';
      if ((val >= 37.3 && val <= 37.9) || (val >= 35.5 && val <= 36.0)) return 'borderline';
      return 'out_of_range';
    case 'glucose':
      if (val < 54) return 'urgent';
      if (val >= 70 && val <= 99) return 'normal';
      if (val >= 100 && val <= 125) return 'borderline';
      return 'out_of_range';
    case 'sleep_hours':
      if (val >= 7) return 'normal';
      if (val >= 6.0 && val < 7) return 'borderline';
      return 'out_of_range';
    case 'exercise_minutes':
      if (val >= 96) return 'normal';
      if (val >= 60 && val <= 95) return 'borderline';
      return 'out_of_range';
    default:
      return 'normal';
  }
}

const VALUE_CLASS_TO_STATUS: Record<ValueClass, { status: StatusType; label: string }> = {
  normal: { status: 'ok', label: 'In range' },
  borderline: { status: 'watch', label: 'Borderline' },
  out_of_range: { status: 'review', label: 'Outside range' },
  urgent: { status: 'urgent', label: 'Urgent' },
};

export function MeasurementForm({ day, setting: _setting, existing = {}, onSave }: MeasurementFormProps) {
  const [values, setValues] = useState<Partial<Record<IndicatorId, string>>>(() => {
    const init: Partial<Record<IndicatorId, string>> = {};
    for (const id of LOGGABLE_INDICATORS) {
      if (existing[id] !== undefined && existing[id] !== null) {
        init[id] = String(existing[id]);
      }
    }
    return init;
  });

  const [blurred, setBlurred] = useState<Partial<Record<IndicatorId, boolean>>>({});
  const [expandedHelp, setExpandedHelp] = useState<Partial<Record<IndicatorId, boolean>>>({});
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (id: IndicatorId, text: string) => {
    setValues((prev) => ({ ...prev, [id]: text }));
    setSavedSuccess(null);
  };

  const handleBlur = (id: IndicatorId) => {
    setBlurred((prev) => ({ ...prev, [id]: true }));
  };

  const toggleHelp = (id: IndicatorId) => {
    setExpandedHelp((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Check if any reading is urgent
  let hasUrgentReading = false;
  for (const id of LOGGABLE_INDICATORS) {
    const raw = values[id];
    if (raw && !isNaN(Number(raw))) {
      const vClass = classifyValueLocal(id, Number(raw));
      if (vClass === 'urgent') {
        hasUrgentReading = true;
        break;
      }
    }
  }

  // Measurements due today (unlogged indicators)
  const dueIndicators = LOGGABLE_INDICATORS.filter(
    (id) => values[id] === undefined || values[id]?.trim() === '',
  ).map((id) => INDICATORS.find((i) => i.id === id)?.label ?? id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const parsed: Partial<Record<IndicatorId, number>> = {};

    for (const id of LOGGABLE_INDICATORS) {
      const raw = values[id];
      if (raw && raw.trim() !== '' && !isNaN(Number(raw))) {
        parsed[id] = Number(raw);
      }
    }

    try {
      await onSave(parsed);
      setSavedSuccess(`Saved for day ${day}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full" aria-label="Log measurements form">
      {/* Due Today Prompt Strip */}
      <div className="bg-instrument-soft/60 border border-instrument text-ink px-4 py-2.5 rounded-chip text-sm font-medium">
        {dueIndicators.length > 0 ? (
          <span>
            <strong>Measurements due today:</strong> {dueIndicators.join(', ')}
          </span>
        ) : (
          <span>All daily measurements have been logged for Day {day}.</span>
        )}
      </div>

      {/* Urgent Callout if any value is in urgent range (exact copy from DESIGN.md section 7) */}
      {hasUrgentReading && (
        <div
          role="alert"
          className="bg-status-urgent-soft border-2 border-status-urgent text-ink p-4 rounded-sheet flex items-start gap-3 shadow-sm"
        >
          <AlertTriangleIcon className="w-5 h-5 text-status-urgent flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium leading-relaxed">
            <strong className="block text-status-urgent font-bold mb-1">Urgent Attention Required</strong>
            One reading is in the urgent range. Repeat it once, and if it is confirmed, follow your emergency medical procedures and contact the crew medical officer now.
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="bg-panel border border-line rounded-sheet p-4 sm:p-6 shadow-sm divide-y divide-line">
        {LOGGABLE_INDICATORS.map((id) => {
          const meta = INDICATORS.find((i) => i.id === id);
          if (!meta) return null;

          const raw = values[id] ?? '';
          const num = Number(raw);
          const hasValue = raw.trim() !== '' && !isNaN(num);
          const isPlausible = hasValue && num >= meta.plausibleMin && num <= meta.plausibleMax;
          const isOutOfRange = hasValue && (num < meta.plausibleMin || num > meta.plausibleMax);

          let chipInfo: { status: StatusType; label: string } | null = null;
          if (hasValue && isPlausible && blurred[id]) {
            const vClass = classifyValueLocal(id, num);
            chipInfo = VALUE_CLASS_TO_STATUS[vClass];
          }

          const help = mockMeasurementHelp[id];
          const isHelpOpen = !!expandedHelp[id];

          return (
            <div key={id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <label htmlFor={`input-${id}`} className="font-bold text-sm sm:text-base text-ink">
                  {meta.label} <span className="text-xs text-ink-soft font-normal">({meta.unit})</span>
                </label>
                {chipInfo && <StatusChip status={chipInfo.status} label={chipInfo.label} />}
              </div>

              <div className="flex items-center gap-3">
                <input
                  id={`input-${id}`}
                  type="number"
                  step={meta.decimals === 0 ? '1' : '0.1'}
                  min={meta.plausibleMin}
                  max={meta.plausibleMax}
                  value={raw}
                  onChange={(e) => handleChange(id, e.target.value)}
                  onBlur={() => handleBlur(id)}
                  placeholder={`${meta.plausibleMin} – ${meta.plausibleMax}`}
                  className={`w-full sm:w-48 bg-ceramic border rounded-input px-3 py-2 text-ink text-base tabular-nums focus:outline-none focus:border-instrument min-h-[44px] ${
                    isOutOfRange ? 'border-status-urgent bg-status-urgent-soft/40' : 'border-line'
                  }`}
                />
                <span className="text-sm font-medium text-ink-soft">{meta.unit}</span>
              </div>

              {/* Validation error */}
              {isOutOfRange && (
                <p className="text-xs text-status-urgent font-medium">
                  Please enter a valid reading between {meta.plausibleMin} and {meta.plausibleMax} {meta.unit}.
                </p>
              )}

              {/* Expandable how to measure */}
              {help && (
                <div className="text-xs">
                  <button
                    type="button"
                    onClick={() => toggleHelp(id)}
                    className="text-instrument font-medium hover:underline inline-flex items-center"
                  >
                    {isHelpOpen ? 'Hide instructions' : 'How to measure'}
                  </button>
                  {isHelpOpen && (
                    <p className="mt-1.5 p-2 bg-ceramic rounded text-ink leading-relaxed">
                      {help.howToMeasure}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button & Status message */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 bg-instrument text-panel font-bold text-sm sm:text-base rounded-input hover:opacity-90 transition-opacity min-h-[44px] min-w-[44px]"
        >
          {isSaving ? 'Saving...' : 'Save measurements'}
        </button>

        {savedSuccess && (
          <span role="status" className="text-sm font-bold text-status-ok">
            ✓ {savedSuccess}
          </span>
        )}
      </div>
    </form>
  );
}

