import React, { useState } from 'react';
import type { MissionSettingId, SupplyId } from '@/contracts/types';
import { MissionPicker } from '@/ui/components/MissionPicker';
import { SupplyChecklist } from '@/ui/components/SupplyChecklist';

export function MissionPage() {
  const [setting, setSetting] = useState<MissionSettingId>('deep_space');
  const [supplies, setSupplies] = useState<Record<SupplyId, boolean>>({
    bp_cuff: true,
    thermometer: true,
    glucometer: true,
    wrist_hr_monitor: true,
    exercise_equipment: true,
    sleep_mask: true,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Mission configuration</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Configure mission environment parameters and verified onboard supplies.
        </p>
      </div>

      <MissionPicker value={setting} onChange={setSetting} />
      <SupplyChecklist supplies={supplies} onChange={setSupplies} />
    </div>
  );
}
