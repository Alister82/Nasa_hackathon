import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MissionPicker } from '@/ui/components/MissionPicker';
import { SupplyChecklist } from '@/ui/components/SupplyChecklist';
import { useAppState } from '@/app/AppState';
import { PageHeader, SectionCard, OutlineButton } from '@/ui/components/PremiumComponents';

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
      <PageHeader
        title="Mission Settings"
        subtitle="The setting changes escalation text, expected reply time, and the expected radiation rate. Changes are saved on this device."
      />

      <SectionCard>
        <h2 className="text-base font-bold text-text-primary mb-4">Operational Settings</h2>
        <MissionPicker value={missionSetting} onChange={setMissionSetting} />
      </SectionCard>

      <SectionCard>
        <h2 className="text-base font-bold text-text-primary mb-4">Medical Supplies Onboard</h2>
        <SupplyChecklist supplies={supplies} onChange={setSupplies} />
      </SectionCard>

      <SectionCard>
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-text-primary">Reset Demo Data</h2>
          <p className="text-xs text-text-secondary">
            Clears measurements, check-ins, and the journal on this device.
          </p>
          <div>
            <OutlineButton onClick={handleReset} danger>
              Reset demo data
            </OutlineButton>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
