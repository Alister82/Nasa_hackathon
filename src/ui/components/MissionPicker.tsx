import React from 'react';
import { Check, Radio, Satellite, Telescope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MissionSetting, MissionSettingId } from '@/contracts/types';
import { MISSION_SETTINGS, expectedReplyMinutes } from '@/guidance';
import { cn } from '@/ui/lib/format';

export interface MissionPickerProps {
  value: MissionSettingId;
  onChange: (m: MissionSettingId) => void;
}

const ORDER: MissionSettingId[] = ['station', 'lunar_base', 'deep_space'];

const SETTING_ICONS: Record<MissionSettingId, LucideIcon> = {
  station: Satellite,
  lunar_base: Telescope,
  deep_space: Radio,
};

export function MissionPicker({ value, onChange }: MissionPickerProps) {
  return (
    <fieldset className="panel overflow-hidden">
      <legend className="sr-only">Operational setting</legend>
      <header className="border-b border-line/80 bg-surface2/55 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-instrument-soft text-instrument">
            <Radio className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[0.95rem] font-extrabold tracking-[-0.02em] text-ink">
              Operational setting
            </h2>
            <p className="text-[0.64rem] text-ink-soft">
              Changes escalation text, expected reply time, and the expected radiation rate.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2.5 p-3.5 md:grid-cols-3">
        {ORDER.map((id) => {
          const setting: MissionSetting = MISSION_SETTINGS[id];
          const isSelected = value === id;
          const Icon = SETTING_ICONS[id];
          const reply = expectedReplyMinutes(id);
          return (
            <label
              key={id}
              className={cn(
                'group relative flex cursor-pointer flex-col gap-2 rounded-[16px] border px-3.5 py-3 transition-all',
                isSelected
                  ? 'border-instrument/40 bg-instrument-soft/60 shadow-xs ring-1 ring-instrument/15'
                  : 'border-line bg-white/70 hover:border-line-strong hover:bg-white',
              )}
            >
              <input
                type="radio"
                name="mission-setting"
                value={id}
                checked={isSelected}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              <span className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg',
                    isSelected ? 'bg-white text-instrument shadow-xs' : 'bg-surface3 text-ink-soft',
                  )}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                    isSelected
                      ? 'border-instrument bg-instrument text-white'
                      : 'border-line-strong bg-white text-transparent',
                  )}
                  aria-hidden="true"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              </span>

              <span className="min-w-0">
                <span className="block text-[0.82rem] font-bold text-ink">{setting.label}</span>
                <span className="mt-0.5 block text-[0.66rem] leading-relaxed text-ink-soft">
                  {setting.description}
                </span>
              </span>

              <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                <span
                  className={cn(
                    'chip !py-0.5 !text-[0.58rem]',
                    isSelected ? 'chip-primary' : 'chip-neutral',
                  )}
                >
                  {setting.oneWayDelayMinutes} min one-way
                </span>
                <span className="chip chip-neutral !py-0.5 !text-[0.58rem]">≥ {reply} min reply</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
