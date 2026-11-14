import React from 'react';
import type { MissionSetting, MissionSettingId } from '@/contracts/types';
import { MISSION_SETTINGS } from '@/guidance';

export interface MissionPickerProps {
  value: MissionSettingId;
  onChange: (m: MissionSettingId) => void;
}

const ORDER: MissionSettingId[] = ['station', 'lunar_base', 'deep_space'];

export function MissionPicker({ value, onChange }: MissionPickerProps) {
  return (
    <fieldset className="bg-panel border border-line rounded-sheet p-5">
      <legend className="text-base sm:text-lg font-bold text-ink mb-2 px-1">
        Operational setting
      </legend>
      <p className="text-xs sm:text-sm text-ink-soft mb-4">
        The setting changes escalation text, expected reply time, and the expected radiation
        rate for the mission.
      </p>

      <div className="space-y-3">
        {ORDER.map((id) => {
          const setting: MissionSetting = MISSION_SETTINGS[id];
          const isSelected = value === id;
          return (
            <label
              key={id}
              className={`flex items-start gap-3 p-3.5 rounded-sheet border cursor-pointer min-h-[44px] ${
                isSelected
                  ? 'border-instrument bg-instrument-soft/40 text-ink'
                  : 'border-line bg-panel hover:bg-ceramic/50 text-ink'
              }`}
            >
              <input
                type="radio"
                name="mission-setting"
                value={id}
                checked={isSelected}
                onChange={() => onChange(id)}
                className="mt-1 h-4 w-4 accent-instrument cursor-pointer"
              />
              <span className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-ink">{setting.label}</span>
                <span className="text-xs sm:text-sm text-ink-soft">{setting.description}</span>
                <span className="text-xs font-semibold text-instrument mt-1">
                  {setting.oneWayDelayMinutes} minutes one-way delay
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
