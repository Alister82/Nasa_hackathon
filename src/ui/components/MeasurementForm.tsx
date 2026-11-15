import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { IndicatorId, MissionSettingId, ValueClass } from '@/contracts/types';
import { INDICATORS } from '@/contracts/indicators';
import { classifyValue, MEASUREMENT_HELP } from '@/guidance';
import { CheckCircle2, ChevronDown, CircleHelp, TriangleAlert } from '@/ui/components/icons';
import { StatusChip, type StatusType } from './StatusChip';
import { IndicatorIcon } from './MetricTile';
import { cn } from '@/ui/lib/format';

export interface MeasurementFormProps {
  day: number;
  setting: MissionSettingId;
  existing?: Partial<Record<IndicatorId, number>>;
  onSave: (values: Partial<Record<IndicatorId, number>>) => Promise<void>;
}

const GROUPS: Array<{ id: string; label: string; hint: string; indicators: IndicatorId[] }> = [
  { id: 'cardio', label: 'Cardiovascular', hint: 'Resting vitals', indicators: ['heart_rate', 'bp_sys', 'bp_dia'] },
  { id: 'metabolic', label: 'Metabolic', hint: 'Temperature and glucose', indicators: ['body_temp', 'glucose'] },
  { id: 'recovery', label: 'Recovery and activity', hint: 'Rest and countermeasures', indicators: ['sleep_hours', 'exercise_minutes'] },
];

const LOGGABLE_INDICATORS: IndicatorId[] = GROUPS.flatMap((group) => group.indicators);

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
  const completed = rows.length - dueIndicators.length;

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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4" aria-label="Log measurements form">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-instrument/15 bg-instrument-soft/55 px-3.5 py-2.5 text-[0.72rem] font-medium text-ink-2">
        <span className="inline-flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.58rem] font-semibold text-instrument tabular-nums">
            {completed}/{rows.length}
          </span>
          {dueIndicators.length > 0 ? (
            <span>
              <strong className="font-semibold text-ink">Measurements due:</strong>{' '}
              {dueIndicators.join(', ')}
            </span>
          ) : (
            <span>All daily measurements have been logged for day {day}.</span>
          )}
        </span>
        <span className="text-[0.62rem] text-ink-soft">Saved on this device</span>
      </div>

      {hasUrgentReading && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[14px] border border-status-urgent/35 bg-status-urgent-soft px-3.5 py-3 text-ink"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-urgent" aria-hidden="true" />
          <div className="text-[0.72rem] font-medium leading-relaxed">
            <strong className="mb-0.5 block font-semibold text-status-urgent">Urgent attention</strong>
            One reading is in the urgent range. Repeat it once, and if it is confirmed, follow
            your emergency medical procedures and contact the crew medical officer now.
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {GROUPS.map((group) => (
          <section key={group.id} aria-label={`${group.label} measurements`} className="panel overflow-hidden">
            <header className="flex items-center justify-between gap-2 border-b border-line/80 bg-surface2/55 px-4 py-2.5">
              <div>
                <h2 className="text-[0.8rem] font-semibold tracking-[-0.01em] text-ink">{group.label}</h2>
                <p className="text-[0.62rem] text-ink-soft">{group.hint}</p>
              </div>
              <span className="chip chip-neutral">
                {group.indicators.filter((id) => values[id]?.trim()).length}/{group.indicators.length} entered
              </span>
            </header>

            <div className="grid grid-cols-1 gap-3 p-3.5 md:grid-cols-2">
              {rows
                .filter((row) => group.indicators.includes(row.id))
                .map((row) => {
                  const { id, meta, raw, isPlausible, isOutOfRange } = row;
                  const chipInfo =
                    isPlausible && blurred[id]
                      ? VALUE_CLASS_TO_STATUS[classifyValue(id, Number(raw))]
                      : null;
                  const help = MEASUREMENT_HELP[id];
                  const isHelpOpen = Boolean(expandedHelp[id]);
                  const showError = isOutOfRange && (showErrors || blurred[id]);
                  const filled = raw.trim() !== '';

                  return (
                    <div
                      key={id}
                      className={cn(
                        'flex flex-col gap-2 rounded-[14px] border px-3 py-3 transition-colors',
                        showError
                          ? 'border-status-urgent/40 bg-status-urgent-soft/35'
                          : filled
                            ? 'border-status-ok/20 bg-status-ok-soft/25'
                            : 'border-line bg-surface2',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label htmlFor={`input-${id}`} className="flex min-w-0 items-center gap-2 text-[0.76rem] font-semibold text-ink">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-ink-soft shadow-xs">
                            <IndicatorIcon indicator={id} className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate">{meta.label}</span>
                            <span className="block text-[0.6rem] font-normal text-ink-faint">
                              Typical {meta.plausibleMin}–{meta.plausibleMax} {meta.unit}
                            </span>
                          </span>
                        </label>
                        {chipInfo ? (
                          <StatusChip status={chipInfo.status} label={chipInfo.label} />
                        ) : filled && isPlausible ? (
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-status-ok" aria-hidden="true" />
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            id={`input-${id}`}
                            type="number"
                            step={meta.decimals === 0 ? '1' : '0.1'}
                            min={meta.plausibleMin}
                            max={meta.plausibleMax}
                            value={raw}
                            onChange={(event) => handleChange(id, event.target.value)}
                            onBlur={() => setBlurred((previous) => ({ ...previous, [id]: true }))}
                            placeholder={`${meta.plausibleMin}–${meta.plausibleMax}`}
                            aria-invalid={showError}
                            aria-describedby={showError ? `error-${id}` : undefined}
                            className={cn(
                              'field tabular-nums pr-14 text-[0.9rem] font-semibold !min-h-[42px]',
                              showError && '!border-status-urgent !bg-white',
                            )}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.62rem] font-semibold text-ink-faint">
                            {meta.unit}
                          </span>
                        </div>
                        {blurred[id] && isPlausible && (
                          <button
                            type="button"
                            onClick={() => setBlurred((previous) => ({ ...previous, [id]: false }))}
                            className="text-[0.6rem] font-semibold text-instrument hover:underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {showError && (
                        <p id={`error-${id}`} className="text-[0.64rem] font-medium text-status-urgent">
                          Enter a reading between {meta.plausibleMin} and {meta.plausibleMax} {meta.unit}.
                        </p>
                      )}

                      {help && (
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedHelp((previous) => ({ ...previous, [id]: !previous[id] }))
                            }
                            className="inline-flex min-h-[44px] items-center gap-1 text-[0.62rem] font-medium text-instrument hover:text-instrument-deep"
                            aria-expanded={isHelpOpen}
                          >
                            <CircleHelp className="h-3 w-3" aria-hidden="true" />
                            {isHelpOpen ? 'Hide instructions' : 'How to measure'}
                            <ChevronDown className={cn('h-3 w-3 transition-transform', isHelpOpen && 'rotate-180')} aria-hidden="true" />
                          </button>
                          {isHelpOpen && (
                            <p className="mt-1.5 rounded-lg border border-line/80 bg-surface2/80 p-2.5 text-[0.66rem] leading-relaxed text-ink-soft">
                              {help.howToMeasure}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      {showErrors && (hasInvalid || !hasAnyValue) && (
        <p role="alert" className="text-[0.72rem] font-medium text-status-urgent">
          {hasInvalid
            ? 'Fix the readings outside the valid range before saving.'
            : 'Enter at least one measurement before saving.'}
        </p>
      )}

      <div className="sticky bottom-[72px] z-20 flex flex-wrap items-center gap-3 rounded-[16px] border border-line bg-white px-3.5 py-2.5 shadow-float lg:static lg:shadow-none">
        <button
          type="submit"
          disabled={isSaving || hasInvalid || !hasAnyValue}
          className="btn btn-primary !min-h-[42px] !px-5"
        >
          {isSaving ? 'Saving…' : 'Save measurements'}
        </button>
        <span className="text-[0.64rem] text-ink-soft">
          Existing values are replaced for day {day} only.
        </span>

        {savedSuccess && (
          <span
            ref={statusRef}
            tabIndex={-1}
            role="status"
            className="ml-auto inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-status-ok"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {savedSuccess}
          </span>
        )}
      </div>
    </form>
  );
}
