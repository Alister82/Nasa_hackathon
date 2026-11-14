import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME, DEFAULT_CREW } from '@/contracts/constants';
import type { MissionSettingId } from '@/contracts/types';
import { MISSION_SETTINGS } from '@/guidance';
import { OfflineBadge } from './OfflineBadge';
import { useAppState } from '@/app/AppState';
import {
  AlertOctagon,
  Search,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface TopBarProps {
  selectedCrewId: string;
  onCrewChange: (crewId: string) => void;
  missionSetting: MissionSettingId;
  onOpenCommandPalette?: () => void;
}

export function TopBar({
  selectedCrewId,
  onCrewChange,
  missionSetting,
  onOpenCommandPalette,
}: TopBarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useAppState();

  const cycleTheme = () => {
    if (theme === 'auto') setTheme('light');
    else if (theme === 'light') setTheme('night');
    else setTheme('auto');
  };

  const themeIcon = {
    light: <Sun className="w-4 h-4 text-amber-500" />,
    night: <Moon className="w-4 h-4 text-blue-400" />,
    auto: <Laptop className="w-4 h-4 text-ink-muted" />,
  }[theme];

  const delayNote =
    missionSetting === 'deep_space'
      ? '22m 1-way delay'
      : missionSetting === 'lunar_base'
        ? '1.3s delay'
        : 'Real-time ground';

  return (
    <header className="min-h-16 glass-surface border-b border-line px-3 sm:px-6 py-2 flex items-center justify-between gap-3 sticky top-0 z-20 select-none">
      {/* Left: Brand / App Name & Search Trigger */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-ink hover:text-instrument flex items-center min-h-[44px] min-w-[44px]"
          aria-label={`${APP_NAME} home`}
        >
          {APP_NAME}
        </Link>

        {/* Global Search Bar / Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-pill bg-line/20 hover:bg-line/30 border border-line text-ink-soft hover:text-ink text-xs transition-colors min-h-[40px] max-w-xs"
          aria-label="Open command search"
        >
          <Search className="w-3.5 h-3.5 text-ink-muted" />
          <span className="truncate">Search telemetry, procedures...</span>
          <kbd className="hidden lg:inline-block font-mono text-[10px] bg-panel-solid border border-line px-1.5 py-0.5 rounded text-ink-muted shadow-2xs">
            Ctrl K
          </kbd>
        </button>
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
          className="bg-panel-solid text-ink text-xs sm:text-sm font-semibold border border-line rounded-input px-3 py-1.5 focus:border-instrument min-h-[44px]"
        >
          {DEFAULT_CREW.map((c) => (
            <option key={c.crewId} value={c.crewId}>
              {c.crewName}
            </option>
          ))}
        </select>

        <Link
          to="/mission"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-instrument/10 text-instrument text-xs sm:text-sm font-semibold rounded-pill border border-instrument/20 hover:border-instrument min-h-[44px] transition-colors"
          title={`Mission setting: ${MISSION_SETTINGS[missionSetting].label} (${delayNote})`}
        >
          <span>{MISSION_SETTINGS[missionSetting].label}</span>
          <span className="hidden xl:inline text-[11px] text-ink-muted font-normal">
            ({delayNote})
          </span>
        </Link>
      </div>

      {/* Right: Theme Toggle + Offline Badge + Urgent Help */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Mobile Search Icon */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="sm:hidden p-2 text-ink-soft hover:text-ink rounded-input min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={cycleTheme}
          className="p-2 text-ink-soft hover:text-ink rounded-input border border-line bg-panel-solid min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          title={`Theme: ${theme}. Click to switch (Light, Night, Auto)`}
          aria-label={`Current theme: ${theme}. Switch theme`}
        >
          {themeIcon}
        </button>

        <OfflineBadge />

        {/* Persistent 1-Tap Urgent Help Button */}
        <button
          type="button"
          onClick={() => navigate('/urgent')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-status-urgent text-white font-bold text-xs sm:text-sm rounded-input hover:opacity-90 shadow-sm transition-all min-h-[44px] min-w-[44px]"
          aria-label="Get urgent medical help"
        >
          <AlertOctagon className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span className="hidden sm:inline">Urgent help</span>
        </button>
      </div>
    </header>
  );
}
