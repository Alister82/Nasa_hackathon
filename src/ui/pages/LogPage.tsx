import React, { useCallback, useEffect, useState } from 'react';
import type { IndicatorId } from '@/contracts/types';
import { MeasurementForm } from '@/ui/components/MeasurementForm';
import { useAppState } from '@/app/AppState';
import { loadEntries } from '@/storage';

export function LogPage() {
  const { crewId, missionSetting, viewDay, saveMeasurements } = useAppState();
  const [existing, setExisting] = useState<Partial<Record<IndicatorId, number>>>({});
  const [entriesVersion, setEntriesVersion] = useState(0);

  const reloadEntries = useCallback(async () => {
    const entries = await loadEntries(crewId);
    const today = entries.find((entry) => entry.day === viewDay);
    setExisting(today?.values ?? {});
  }, [crewId, viewDay]);

  useEffect(() => {
    void reloadEntries();
  }, [reloadEntries, entriesVersion]);

  const handleSave = async (values: Partial<Record<IndicatorId, number>>) => {
    await saveMeasurements(values);
    setEntriesVersion((version) => version + 1);
  };

  const formKey = `${viewDay}:${JSON.stringify(existing)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Log measurements</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Manual health indicators for mission day {viewDay}. Values are saved on this device
          and replace the simulated reading for that day.
        </p>
        <p className="text-xs text-ink-soft mt-1">
          Escape setting in use: {missionSetting === 'deep_space' ? 'deep space' : missionSetting.replace('_', ' ')}.
          Change the viewed day with the timeline on Today.
        </p>
      </div>

      <MeasurementForm
        key={formKey}
        day={viewDay}
        setting={missionSetting}
        existing={existing}
        onSave={handleSave}
      />
    </div>
  );
}
