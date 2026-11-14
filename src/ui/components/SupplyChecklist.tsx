import React from 'react';
import type { SupplyId } from '@/contracts/types';
import { SUPPLIES } from '@/guidance';

export interface SupplyChecklistProps {
  supplies: Record<SupplyId, boolean>;
  onChange: (s: Record<SupplyId, boolean>) => void;
}

export function SupplyChecklist({ supplies, onChange }: SupplyChecklistProps) {
  const handleToggle = (id: SupplyId) => {
    onChange({ ...supplies, [id]: !supplies[id] });
  };

  return (
    <fieldset className="bg-panel border border-line rounded-sheet p-5">
      <legend className="text-base sm:text-lg font-bold text-ink mb-1 px-1">
        Medical supplies aboard
      </legend>
      <p className="text-xs sm:text-sm text-ink-soft mb-4">
        Actions only name equipment marked as aboard.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUPPLIES.map((item) => {
          const isAboard = supplies[item.id] ?? true;
          return (
            <label
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-sheet border cursor-pointer select-none min-h-[44px] ${
                isAboard
                  ? 'border-line bg-panel hover:bg-ceramic/40'
                  : 'border-line bg-ceramic/50 text-ink-soft'
              }`}
            >
              <span className={`text-sm font-medium ${isAboard ? 'text-ink' : 'text-ink-soft'}`}>
                {item.label}
              </span>
              <input
                type="checkbox"
                checked={isAboard}
                onChange={() => handleToggle(item.id)}
                className="h-4 w-4 rounded accent-instrument cursor-pointer"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
