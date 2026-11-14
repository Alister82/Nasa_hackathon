import React, { useState } from 'react';
import { HashRouter, NavLink } from 'react-router-dom';
import {
  DEFAULT_CREW,
  DEFAULT_MISSION_SETTING,
  DEFAULT_VIEW_DAY,
} from '@/contracts/constants';
import type { MissionSettingId } from '@/contracts/types';
import { TopBar } from '@/ui/components/TopBar';
import { DisclaimerBanner } from '@/ui/components/DisclaimerBanner';
import { BottomNav } from '@/ui/components/BottomNav';
import { AppRoutes } from './routes';

export function App() {
  const [selectedCrewId, setSelectedCrewId] = useState<string>(
    DEFAULT_CREW[0]?.crewId ?? 'crew-1',
  );
  const [missionSetting, setMissionSetting] = useState<MissionSettingId>(
    DEFAULT_MISSION_SETTING,
  );
  const [viewDay, setViewDay] = useState<number>(DEFAULT_VIEW_DAY);

  const handleResetData = () => {
    // Will be wired to storage.clearAll()
    localStorage.clear();
    window.location.reload();
  };

  const desktopNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium border-b-2 min-h-[44px] inline-flex items-center ${
      isActive
        ? 'border-instrument text-instrument font-bold'
        : 'border-transparent text-ink-soft hover:text-ink hover:border-line'
    }`;

  return (
    <HashRouter>
      <div className="min-h-screen bg-ceramic text-ink flex flex-col font-sans">
        {/* Top bar (56 px) */}
        <TopBar
          selectedCrewId={selectedCrewId}
          onCrewChange={setSelectedCrewId}
          missionSetting={missionSetting}
        />

        {/* Disclaimer banner (32 px) */}
        <DisclaimerBanner />

        {/* Desktop secondary navigation bar on lg screens */}
        <nav
          aria-label="Desktop Sub Navigation"
          className="hidden lg:flex items-center gap-2 px-6 bg-panel border-b border-line overflow-x-auto select-none"
        >
          <NavLink to="/" end className={desktopNavLinkClass}>
            Today
          </NavLink>
          <NavLink to="/log" className={desktopNavLinkClass}>
            Log
          </NavLink>
          <NavLink to="/checkin" className={desktopNavLinkClass}>
            Check-in
          </NavLink>
          <NavLink to="/lab" className={desktopNavLinkClass}>
            Scenario Lab
          </NavLink>
          <NavLink to="/proof" className={desktopNavLinkClass}>
            Proof
          </NavLink>
          <NavLink to="/journal" className={desktopNavLinkClass}>
            Journal
          </NavLink>
          <NavLink to="/mission" className={desktopNavLinkClass}>
            Mission
          </NavLink>
          <NavLink to="/about" className={desktopNavLinkClass}>
            About
          </NavLink>
        </nav>

        {/* Main content area */}
        <main className="flex-1 pb-20 lg:pb-8">
          <AppRoutes
            missionSetting={missionSetting}
            onSettingChange={setMissionSetting}
            selectedCrewId={selectedCrewId}
            onCrewChange={setSelectedCrewId}
            viewDay={viewDay}
            onDayChange={setViewDay}
          />
        </main>

        {/* Mobile bottom navigation (hidden on lg) */}
        <BottomNav onResetData={handleResetData} />
      </div>
    </HashRouter>
  );
}
