import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Search, TriangleAlert } from 'lucide-react';
import { DEFAULT_CREW } from '@/contracts/constants';
import { MISSION_SETTINGS } from '@/guidance';
import { useAppState } from '@/app/AppState';
import { severityLabel, SEVERITY_RANK } from '@/ui/lib/metrics';
import { cn } from '@/ui/lib/format';
import { OfflineBadge } from './OfflineBadge';

export interface TopBarProps {
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
}

const SEVERITY_DOT = {
  urgent: 'bg-status-urgent',
  review: 'bg-status-review',
  watch: 'bg-status-watch',
  info: 'bg-instrument',
} as const;

export function TopBar({ onOpenMobileNav, onOpenSearch }: TopBarProps) {
  const navigate = useNavigate();
  const { crewId, setCrewId, crewName, missionSetting, viewDay, cards } = useAppState();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const attention = [...cards]
    .filter((card) => card.severity !== 'info')
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const setting = MISSION_SETTINGS[missionSetting];
  const initials = crewName.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'CR';

  useEffect(() => {
    if (!notificationsOpen) return;
    const handlePointer = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [notificationsOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/65 bg-[linear-gradient(180deg,rgba(248,251,255,0.9),rgba(245,250,255,0.72))] backdrop-blur-2xl">
      <div className="flex min-h-[64px] items-center gap-2 px-3 py-2.5 sm:px-4 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="icon-btn lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </button>

        {/* Functional search entry */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="group hidden h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/80 bg-white/70 px-3 text-left shadow-xs backdrop-blur transition-all hover:border-line-strong hover:bg-white sm:flex lg:max-w-[420px]"
          aria-label="Search metrics, alerts, or procedures"
        >
          <Search className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-ink-soft" aria-hidden="true" />
          <span className="truncate text-[0.78rem] font-medium text-ink-faint">Search metrics, alerts, or procedures…</span>
          <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-md border border-line bg-white px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold text-ink-soft lg:inline-flex">
            ⌘ K
          </kbd>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none sm:ml-auto">
          <span className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/55 px-2.5 py-1 text-[0.64rem] font-semibold text-ink-soft xl:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-status-ok" />
            Mission day <span className="tabular-nums text-ink">{viewDay}</span>
          </span>

          <label htmlFor="crew-select" className="sr-only">
            Select crew member
          </label>
          <div className="relative min-w-0">
            <select
              id="crew-select"
              value={crewId}
              onChange={(event) => setCrewId(event.target.value)}
              className="h-11 max-w-[122px] appearance-none rounded-lg border border-line bg-white/80 pl-2.5 pr-7 text-[0.72rem] font-semibold text-ink shadow-xs transition-colors hover:border-line-strong focus:border-instrument sm:max-w-none"
            >
              {DEFAULT_CREW.map((crew) => (
                <option key={crew.crewId} value={crew.crewId}>
                  {crew.crewName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          </div>

          <Link
            to="/mission"
            className="hidden h-11 items-center gap-1.5 rounded-lg border border-instrument/15 bg-instrument-soft/80 px-2.5 text-[0.68rem] font-semibold text-instrument-deep transition-colors hover:bg-instrument-soft md:inline-flex"
            title={`Mission setting: ${setting.label}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-instrument" aria-hidden="true" />
            {setting.label}
          </Link>

          <OfflineBadge compact className="hidden md:inline-flex" />

          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((open) => !open)}
              className="icon-btn relative"
              aria-label={`Notifications${attention.length > 0 ? `, ${attention.length} need attention` : ''}`}
              aria-expanded={notificationsOpen}
            >
              <Bell className="h-[17px] w-[17px]" strokeWidth={1.9} />
              {attention.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-status-review px-0.5 text-[0.52rem] font-bold text-white tabular-nums">
                  {attention.length > 9 ? '9+' : attention.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-[18px] border border-white/80 bg-white/97 shadow-[0_30px_80px_-24px_rgba(12,38,72,0.45)] backdrop-blur-2xl"
                role="dialog"
                aria-label="Current health alerts"
              >
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <div>
                    <p className="text-[0.8rem] font-bold text-ink">Health alerts</p>
                    <p className="text-[0.62rem] text-ink-soft">Derived from the viewed mission day</p>
                  </div>
                  <span className="chip chip-neutral tabular-nums">{attention.length}</span>
                </div>
                <div className="scroll-thin max-h-[320px] overflow-y-auto">
                  {attention.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-[0.78rem] font-semibold text-ink">No active alerts</p>
                      <p className="mt-1 text-[0.68rem] text-ink-soft">All monitored domains are within expected range.</p>
                    </div>
                  ) : (
                    attention.slice(0, 6).map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate(`/domain/${card.domains[0] ?? 'cardiovascular'}`);
                        }}
                        className="flex w-full items-start gap-2.5 border-b border-line/70 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface2"
                      >
                        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', SEVERITY_DOT[card.severity])} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-[0.74rem] font-semibold text-ink">{card.title}</span>
                            <span className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-wide text-ink-faint">{severityLabel(card.severity)}</span>
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-[0.65rem] leading-relaxed text-ink-soft">{card.observation}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <Link
                  to="/"
                  onClick={() => setNotificationsOpen(false)}
                  className="flex min-h-[44px] items-center justify-center border-t border-line bg-surface2/70 px-4 text-center text-[0.68rem] font-semibold text-instrument hover:bg-instrument-soft"
                >
                  View all on dashboard
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/urgent')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-status-urgent/25 bg-status-urgent-soft px-0 text-status-urgent transition-colors hover:bg-status-urgent hover:text-white lg:min-h-[44px] lg:px-3"
            aria-label="Get urgent medical help"
          >
            <TriangleAlert className="h-[17px] w-[17px] lg:h-4 lg:w-4" strokeWidth={2.1} aria-hidden="true" />
            <span className="hidden text-[0.72rem] font-bold lg:inline">Urgent help</span>
            <span className="w-9 lg:hidden" aria-hidden="true" />
          </button>

          <div
            className="ml-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white bg-[linear-gradient(145deg,#dcebff,#b8d3f8)] text-[0.66rem] font-bold tracking-wide text-[#19457e] shadow-xs sm:flex"
            title={`${crewName} — active crew record`}
            aria-label={`${crewName} profile`}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
