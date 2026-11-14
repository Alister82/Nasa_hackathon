import React from 'react';
import type { MissionSettingId } from '@/contracts/types';

export interface MissionPickerProps {
  value: MissionSettingId;
  onChange: (m: MissionSettingId) => void;
}

interface SettingOption {
  id: MissionSettingId;
  label: string;
  description: string;
  delayText: string;
}

const SETTINGS: SettingOption[] = [
  {
    id: 'station',
    label: 'Space station',
    description: 'Ground contact within minutes. Fast escalation and continuous Earth support.',
    delayText: '0 minutes one-way delay',
  },
  {
    id: 'lunar_base',
    label: 'Lunar base',
    description: 'Short communications delay with Earth mission control.',
    delayText: '1.2 seconds (~0.02 min) delay',
  },
  {
    id: 'deep_space',
    label: 'Deep-space transit',
    description: 'Substantial communication latency. Autonomy required; replies may take time.',
    delayText: '12 minutes one-way delay',
  },
];

export function MissionPicker({ value, onChange }: MissionPickerProps) {
  return (
    <fieldset className="bg-panel border border-line rounded-sheet p-5 shadow-sm">
      <legend className="text-base sm:text-lg font-bold text-ink mb-2 px-1">
        Operational setting
      </legend>
      <p className="text-xs sm:text-sm text-ink-soft mb-4">
        Adjusting the mission environment recalibrates ground communication delays and alert card escalation instructions.
      </p>

      <div className="space-y-3">
        {SETTINGS.map((s) => {
          const isSelected = value === s.id;
          return (
            <label
              key={s.id}
              className={`flex items-start gap-3 p-3.5 rounded-sheet border cursor-pointer transition-colors min-h-[44px] ${
                isSelected
                  ? 'border-instrument bg-instrument-soft/40 text-ink'
                  : 'border-line bg-panel hover:bg-ceramic/50 text-ink'
              }`}
            >
              <input
                type="radio"
                name="mission-setting"
                value={s.id}
                checked={isSelected}
                onChange={() => onChange(s.id)}
                className="mt-1 h-4 w-4 accent-instrument cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-ink">{s.label}</span>
                <span className="text-xs sm:text-sm text-ink-soft">{s.description}</span>
                <span className="text-xs font-semibold text-instrument mt-1">{s.delayText}</span>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

