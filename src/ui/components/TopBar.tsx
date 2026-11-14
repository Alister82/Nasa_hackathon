import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME, DEFAULT_CREW } from '@/contracts/constants';
import type { MissionSettingId } from '@/contracts/types';
import { MISSION_SETTINGS } from '@/guidance';
import { OfflineBadge } from './OfflineBadge';
import { AlertTriangleIcon } from './Icons';

interface TopBarProps {
  selectedCrewId: string;
  onCrewChange: (crewId: string) => void;
  missionSetting: MissionSettingId;
}

export function TopBar({ selectedCrewId, onCrewChange, missionSetting }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="min-h-14 bg-panel border-b border-line px-3 sm:px-4 py-1 flex flex-wrap items-center justify-between gap-2 sm:gap-4 select-none">
      {/* Left: App Name */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-ink hover:text-instrument flex items-center min-h-[44px] min-w-[44px]"
          aria-label={`${APP_NAME} home`}
        >
          {APP_NAME}
        </Link>
      </div>

      {/* Center: Crew Picker + Mission Setting Pill */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        <label htmlFor="crew-select" className="sr-only">
          Select crew member
        </label>
        <select
          id="crew-select"
          value={selectedCrewId}
          onChange={(e) => onCrewChange(e.target.value)}
          className="bg-ceramic text-ink text-sm font-medium border border-line rounded-input px-2.5 py-1.5 focus:border-instrument min-h-[44px]"
        >
          {DEFAULT_CREW.map((c) => (
            <option key={c.crewId} value={c.crewId}>
              {c.crewName}
            </option>
          ))}
        </select>

        <Link
          to="/mission"
          className="inline-flex items-center px-3 py-1.5 bg-instrument-soft text-instrument text-xs sm:text-sm font-medium rounded-pill border border-line hover:border-instrument min-h-[44px]"
          title="Mission setting and supplies"
        >
          {MISSION_SETTINGS[missionSetting].label}
        </Link>
      </div>

      {/* Right: Offline Badge + Urgent Help Button */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <OfflineBadge />
        <button
          type="button"
          onClick={() => navigate('/urgent')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-status-urgent-soft text-status-urgent border border-status-urgent font-bold text-xs sm:text-sm rounded-input hover:bg-status-urgent hover:text-panel transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Get urgent medical help"
        >
          <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
          <span>Urgent help</span>
        </button>
      </div>
    </header>
  );
}

