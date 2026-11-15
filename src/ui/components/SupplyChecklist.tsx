import React from 'react';
import { BriefcaseMedical, Check } from '@/ui/components/icons';
import type { SupplyId } from '@/contracts/types';
import { SUPPLIES } from '@/guidance';
import { cn } from '@/ui/lib/format';

export interface SupplyChecklistProps {
  supplies: Record<SupplyId, boolean>;
  onChange: (s: Record<SupplyId, boolean>) => void;
}

export function SupplyChecklist({ supplies, onChange }: SupplyChecklistProps) {
  const handleToggle = (id: SupplyId) => {
    onChange({ ...supplies, [id]: !supplies[id] });
  };

  const aboardCount = SUPPLIES.filter((item) => supplies[item.id] ?? true).length;

  return (
    <fieldset className="panel overflow-hidden">
      <legend className="sr-only">Medical supplies aboard</legend>
      <header className="flex items-center justify-between gap-2 border-b border-line/80 bg-surface2/55 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-instrument-soft text-instrument">
            <BriefcaseMedical className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-ink">
              Medical supplies aboard
            </h2>
            <p className="text-[0.64rem] text-ink-soft">
              Actions only name equipment marked as aboard.
            </p>
          </div>
        </div>
        <span className="chip chip-neutral tabular-nums">
          {aboardCount}/{SUPPLIES.length} aboard
        </span>
      </header>

      <div className="grid grid-cols-1 gap-2 p-3.5 sm:grid-cols-2">
        {SUPPLIES.map((item) => {
          const isAboard = supplies[item.id] ?? true;
          return (
            <label
              key={item.id}
              className={cn(
                'flex min-h-[44px] cursor-pointer select-none items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-all',
                isAboard
                  ? 'border-line bg-surface2 hover:border-line-strong'
                  : 'border-dashed border-line bg-surface2/55',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                    isAboard
                      ? 'border-status-ok/30 bg-status-ok-soft text-status-ok'
                      : 'border-line-strong bg-white text-transparent',
                  )}
                  aria-hidden="true"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className={cn('text-[0.74rem] font-medium', isAboard ? 'text-ink' : 'text-ink-soft')}>
                  {item.label}
                </span>
              </span>
              <input
                type="checkbox"
                checked={isAboard}
                onChange={() => handleToggle(item.id)}
                className="sr-only"
              />
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-wide',
                  isAboard ? 'bg-status-ok-soft text-status-ok' : 'bg-surface3 text-ink-faint',
                )}
                aria-hidden="true"
              >
                {isAboard ? 'Aboard' : 'Not aboard'}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
