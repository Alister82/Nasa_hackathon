import React from 'react';
import { Link } from 'react-router-dom';
import type { MissionSettingId } from '@/contracts/types';

interface UrgentPageProps {
  missionSetting?: MissionSettingId;
}

export function UrgentPage({ missionSetting = 'deep_space' }: UrgentPageProps) {
  return (
    <div className="p-6 max-w-xl mx-auto my-8 bg-panel border-2 border-status-urgent rounded-sheet text-center shadow-card">
      <h1 className="text-2xl sm:text-3xl font-bold text-status-urgent mb-4">
        Get help now
      </h1>
      <p className="text-ink text-base sm:text-lg mb-4 leading-relaxed">
        Contact your crew medical officer and ground now. You do not have to handle this alone. Follow your emergency procedures.
      </p>
      {missionSetting === 'deep_space' && (
        <p className="text-status-urgent font-medium text-sm sm:text-base mb-6">
          A reply from ground may take a while. Do not wait for a reply before starting emergency procedures.
        </p>
      )}
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-instrument text-panel font-bold text-base rounded-input hover:opacity-90 min-h-[44px] min-w-[44px]"
        >
          Back to Today
        </Link>
      </div>
    </div>
  );
}

