import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MissionPicker } from '@/ui/components/MissionPicker';
import { SupplyChecklist } from '@/ui/components/SupplyChecklist';
import { useAppState } from '@/app/AppState';

export function MissionPage() {
  const navigate = useNavigate();
  const {
    missionSetting,
    supplies,
    setMissionSetting,
    setSupplies,
    resetDemoData,
  } = useAppState();

  const handleReset = () => {
    if (
      window.confirm(
        'This clears measurements, check-ins, and the journal on this device. Reset?',
      )
    ) {
      void resetDemoData().then(() => navigate('/'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Mission setting</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          The setting changes escalation text, expected reply time, and the expected radiation
          rate. Changes are saved on this device.
        </p>
      </div>

      <MissionPicker value={missionSetting} onChange={setMissionSetting} />
      <SupplyChecklist supplies={supplies} onChange={setSupplies} />

      <div className="border-t border-line pt-4">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-line rounded-input text-sm font-bold text-status-urgent hover:bg-status-urgent-soft min-h-[44px]"
        >
          Reset demo data
        </button>
        <p className="text-xs text-ink-soft mt-2">
          Clears measurements, check-ins, and the journal on this device.
        </p>
      </div>
    </div>
  );
}
