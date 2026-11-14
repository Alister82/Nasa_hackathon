import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { IndicatorId, MissionSettingId, ValueClass } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { classifyValue, MEASUREMENT_HELP } from '@/guidance';
import { StatusChip, type StatusType } from './StatusChip';
import { AlertTriangleIcon } from './Icons';

export interface MeasurementFormProps {
  day: number;
  setting: MissionSettingId;
  existing?: Partial<Record<IndicatorId, number>>;
  onSave: (values: Partial<Record<IndicatorId, number>>) => Promise<void>;
}

const LOGGABLE_INDICATORS: IndicatorId[] = [
  'heart_rate',
  'bp_sys',
  'bp_dia',
  'body_temp',
  'glucose',
  'sleep_hours',
  'exercise_minutes',
];

const EMPTY_EXISTING: Partial<Record<IndicatorId, number>> = {};

const VALUE_CLASS_TO_STATUS: Record<ValueClass, { status: StatusType; label: string }> = {
  normal: { status: 'ok', label: 'In range' },
  borderline: { status: 'watch', label: 'Borderline' },
  out_of_range: { status: 'review', label: 'Outside range' },
  urgent: { status: 'urgent', label: 'Urgent' },
};

function initialValues(
  existing: Partial<Record<IndicatorId, number>>,
): Partial<Record<IndicatorId, string>> {
  const values: Partial<Record<IndicatorId, string>> = {};
  for (const id of LOGGABLE_INDICATORS) {
    const value = existing[id];
    if (value !== undefined) values[id] = String(value);
  }
  return values;
}

export function MeasurementForm({
  day,
  setting: _setting,
  existing = EMPTY_EXISTING,
  onSave,
}: MeasurementFormProps) {
  const [values, setValues] = useState<Partial<Record<IndicatorId, string>>>(() =>
    initialValues(existing),
  );
  const [blurred, setBlurred] = useState<Partial<Record<IndicatorId, boolean>>>({});
  const [expandedHelp, setExpandedHelp] = useState<Partial<Record<IndicatorId, boolean>>>({});
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setValues(initialValues(existing));
    setBlurred({});
    setShowErrors(false);
  }, [day, existing]);

  useEffect(() => {
    if (savedSuccess) statusRef.current?.focus();
  }, [savedSuccess]);

  const rows = useMemo(
    () =>
      LOGGABLE_INDICATORS.map((id) => {
        const meta = INDICATORS.find((candidate) => candidate.id === id);
        if (!meta) return null;
        const raw = values[id] ?? '';
        const trimmed = raw.trim();
        const number = Number(trimmed);
        const hasValue = trimmed !== '' && Number.isFinite(number);
        const isPlausible =
          hasValue && number >= meta.plausibleMin && number <= meta.plausibleMax;
        const isOutOfRange =
          hasValue && (number < meta.plausibleMin || number > meta.plausibleMax);
        return { id, meta, raw, hasValue, isPlausible, isOutOfRange };
      }).filter((row): row is NonNullable<typeof row> => row !== null),
    [values],
  );

  const hasInvalid = rows.some((row) => row.isOutOfRange);
  const hasAnyValue = rows.some((row) => row.hasValue);
  const hasUrgentReading = rows.some(
    (row) => row.isPlausible && classifyValue(row.id, Number(row.raw)) === 'urgent',
  );
  const dueIndicators = rows
    .filter((row) => !row.hasValue)
    .map((row) => row.meta.label);

  const handleChange = (id: IndicatorId, text: string) => {
    setValues((previous) => ({ ...previous, [id]: text }));
    setSavedSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (hasInvalid || !hasAnyValue) {
      setShowErrors(true);
      return;
    }

    const parsed: Partial<Record<IndicatorId, number>> = {};
    for (const row of rows) {
      if (row.hasValue) parsed[row.id] = Number(row.raw);
    }

    setIsSaving(true);
    try {
      await onSave(parsed);
      setSavedSuccess(`Saved for day ${day}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full" aria-label="Log measurements form">
      <div className="bg-instrument-soft/60 border border-instrument text-ink px-4 py-2.5 rounded-chip text-sm font-medium">
        {dueIndicators.length > 0 ? (
          <span>
            <strong>Measurements due today:</strong> {dueIndicators.join(', ')}
          </span>
        ) : (
          <span>All daily measurements have been logged for day {day}.</span>
        )}
      </div>

      {hasUrgentReading && (
        <div
          role="alert"
          className="bg-status-urgent-soft border-2 border-status-urgent text-ink p-4 rounded-sheet flex items-start gap-3"
        >
          <AlertTriangleIcon className="w-5 h-5 text-status-urgent flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium leading-relaxed">
            <strong className="block text-status-urgent font-bold mb-1">
              Urgent attention
            </strong>
            One reading is in the urgent range. Repeat it once, and if it is confirmed, follow
            your emergency medical procedures and contact the crew medical officer now.
          </div>
        </div>
      )}

      <div className="bg-panel border border-line rounded-sheet p-4 sm:p-6 divide-y divide-line">
        {rows.map((row) => {
          const { id, meta, raw, isPlausible, isOutOfRange } = row;
          const chipInfo =
            isPlausible && blurred[id]
              ? VALUE_CLASS_TO_STATUS[classifyValue(id, Number(raw))]
              : null;
          const help = MEASUREMENT_HELP[id];
          const isHelpOpen = Boolean(expandedHelp[id]);
          const showError = isOutOfRange && (showErrors || blurred[id]);

          return (
            <div key={id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <label htmlFor={`input-${id}`} className="font-bold text-sm sm:text-base text-ink">
                  {meta.label}{' '}
                  <span className="text-xs text-ink-soft font-normal">({meta.unit})</span>
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
                  onChange={(event) => handleChange(id, event.target.value)}
                  onBlur={() => setBlurred((previous) => ({ ...previous, [id]: true }))}
                  placeholder={`${meta.plausibleMin} to ${meta.plausibleMax}`}
                  aria-invalid={showError}
                  aria-describedby={showError ? `error-${id}` : undefined}
                  className={`w-full sm:w-48 bg-ceramic border rounded-input px-3 py-2 text-ink text-base tabular-nums focus:border-instrument min-h-[44px] ${
                    showError ? 'border-status-urgent' : 'border-line'
                  }`}
                />
                <span className="text-sm font-medium text-ink-soft">{meta.unit}</span>
              </div>

              {showError && (
                <p id={`error-${id}`} className="text-xs text-status-urgent font-medium">
                  Enter a reading between {meta.plausibleMin} and {meta.plausibleMax}{' '}
                  {meta.unit}.
                </p>
              )}

              {help && (
                <div className="text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedHelp((previous) => ({ ...previous, [id]: !previous[id] }))
                    }
                    className="text-instrument font-medium hover:underline inline-flex items-center min-h-[44px]"
                    aria-expanded={isHelpOpen}
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

      {showErrors && (hasInvalid || !hasAnyValue) && (
        <p role="alert" className="text-sm text-status-urgent font-medium">
          {hasInvalid
            ? 'Fix the readings outside the valid range before saving.'
            : 'Enter at least one measurement before saving.'}
        </p>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="submit"
          disabled={isSaving || hasInvalid || !hasAnyValue}
          className="px-6 py-3 bg-instrument text-panel font-bold text-sm sm:text-base rounded-input min-h-[44px] min-w-[44px] disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save measurements'}
        </button>

        {savedSuccess && (
          <span
            ref={statusRef}
            tabIndex={-1}
            role="status"
            className="text-sm font-bold text-status-ok"
          >
            {savedSuccess}
          </span>
        )}
      </div>
    </form>
  );
}
