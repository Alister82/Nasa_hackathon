import React, { useCallback, useEffect, useState } from 'react';
import type { IndicatorId } from '@/contracts/types';
import { MeasurementForm } from '@/ui/components/MeasurementForm';
import { useAppState } from '@/app/AppState';
import { loadEntries } from '@/storage';
import { PageHeader, SectionCard } from '@/ui/components/PremiumComponents';

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

  const formKey = String(viewDay);
  const settingLabel =
    missionSetting === 'deep_space'
      ? 'Deep Space'
      : missionSetting === 'lunar_base'
        ? 'Lunar Base'
        : 'Space Station';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <PageHeader
        title="Health Monitor"
        subtitle={`Day ${viewDay} · ${settingLabel} · Manual readings override simulated data for that day`}
      />

      <SectionCard>
        <div className="mb-5">
          <h2 className="text-base font-bold text-text-primary mb-1">
            Log measurements for Day {viewDay}
          </h2>
          <p className="text-xs text-text-secondary">
            Values are saved on this device and replace the simulated reading for that day.
            Change the viewed day with the timeline on the Dashboard.
          </p>
        </div>
        <MeasurementForm
          key={formKey}
          day={viewDay}
          setting={missionSetting}
          existing={existing}
          onSave={handleSave}
        />
      </SectionCard>
    </div>
  );
}
