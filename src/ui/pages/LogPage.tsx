import React, { useState } from 'react';
import type { IndicatorId, MissionSettingId } from '@/contracts/types';
import { MeasurementForm } from '@/ui/components/MeasurementForm';

export function LogPage() {
  const [day, setDay] = useState(120);
  const [setting] = useState<MissionSettingId>('deep_space');
  const [savedData, setSavedData] = useState<Partial<Record<IndicatorId, number>>>({});

  const handleSave = async (values: Partial<Record<IndicatorId, number>>) => {
    // In-memory / storage adapter
    setSavedData((prev) => ({ ...prev, ...values }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">Log measurements</h1>
          <p className="text-xs sm:text-sm text-ink-soft">
            Manual health indicator logging for Mission Day {day}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="log-day-select" className="text-xs font-semibold text-ink-soft">
            Day:
          </label>
          <input
            id="log-day-select"
            type="number"
            min={1}
            max={180}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="w-20 bg-panel border border-line rounded-input px-2 py-1 text-sm font-bold text-ink tabular-nums min-h-[44px]"
          />
        </div>
      </div>

      <MeasurementForm
        day={day}
        setting={setting}
        existing={savedData}
        onSave={handleSave}
      />
    </div>
  );
}
