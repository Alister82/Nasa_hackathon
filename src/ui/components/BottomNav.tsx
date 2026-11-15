import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  FlaskConical,
  Info,
  LayoutDashboard,
  LifeBuoy,
  MoreHorizontal,
  NotebookPen,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  X,
} from '@/ui/components/icons';
import type { IconComponent } from '@/ui/components/icons';
import { MISSION_SETTINGS } from '@/guidance';
import { MISSION_DAYS } from '@/contracts/constants';
import { useAppState } from '@/app/AppState';
import { cn } from '@/ui/lib/format';

interface BottomNavProps {
  onResetData: () => void;
}

const PRIMARY = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/log', label: 'Monitor', icon: Activity },
  { to: '/checkin', label: 'Check-in', icon: CheckCircle2 },
  { to: '/lab', label: 'Lab', icon: FlaskConical },
];

const MORE_LINKS: Array<{ to: string; label: string; icon: IconComponent; hint: string }> = [
  { to: '/proof', label: 'Verification', icon: ShieldCheck, hint: 'Algorithm evidence and evaluation results' },
  { to: '/journal', label: 'Investigation Journal', icon: NotebookPen, hint: 'Observations, actions, and reviews' },
  { to: '/mission', label: 'Mission Settings', icon: Settings2, hint: 'Mission context, communications, supplies' },
  { to: '/help', label: 'Help & Support', icon: LifeBuoy, hint: 'Guidance and emergency routes' },
  { to: '/about', label: 'About Vigil', icon: Info, hint: 'Scope, limits, and NASA risk coverage' },
];

export function BottomNav({ onResetData }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { crewName, viewDay, missionSetting, cards } = useAppState();
  const setting = MISSION_SETTINGS[missionSetting];
  const attention = cards.filter((card) => card.severity !== 'info').length;

  useEffect(() => {
    if (!moreOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [moreOpen]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[0.58rem] font-semibold transition-colors',
      isActive ? 'text-instrument' : 'text-ink-soft hover:text-ink',
    );

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-[rgba(252,252,253,0.92)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-2xl lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {({ isActive }) => (
                  <>
                    <span className={cn('flex h-7 w-9 items-center justify-center rounded-lg transition-colors', isActive && 'bg-instrument-soft')}>
                      <Icon className="h-[18px] w-[18px]" weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
          <button type="button" onClick={() => setMoreOpen(true)} className="relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[0.58rem] font-semibold text-ink-soft">
            <span className="relative flex h-7 w-9 items-center justify-center rounded-lg">
              <MoreHorizontal className="h-[18px] w-[18px]" weight="bold" aria-hidden="true" />
              {attention > 0 && <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-status-review" />}
            </span>
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMoreOpen(false)}
          role="presentation"
        >
          <div
            className="mx-auto w-full max-w-lg rounded-t-[20px] border border-black/[0.06] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_64px_-24px_rgba(0,0,0,0.28)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="More navigation options"
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line-strong/70" aria-hidden="true" />
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-display text-base font-semibold tracking-[-0.02em] text-ink">Mission controls</p>
                <p className="text-[0.66rem] text-ink-soft">{crewName} · {setting.label} · Day {viewDay} of {MISSION_DAYS}</p>
              </div>
              <button type="button" onClick={() => setMoreOpen(false)} className="icon-btn" aria-label="Close menu">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 rounded-[12px] border border-line bg-surface2 p-2.5">
              <div className="flex items-center justify-between text-[0.64rem]">
                <span className="inline-flex items-center gap-1.5 font-medium text-status-urgent">
                  <TriangleAlert className="h-3.5 w-3.5" weight="fill" /> Emergency support
                </span>
                <Link to="/urgent" onClick={() => setMoreOpen(false)} className="font-medium text-status-urgent underline">
                  Open
                </Link>
              </div>
              <p className="mt-1 text-[0.6rem] leading-relaxed text-ink-soft">Contact your crew medical officer and ground now. Do not wait for a reply.</p>
            </div>

            <div className="grid grid-cols-1 gap-0.5">
              {MORE_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors hover:bg-black/[0.045]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-surface3 text-ink-soft">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.76rem] font-medium text-ink">{item.label}</span>
                      <span className="block truncate text-[0.62rem] text-ink-soft">{item.hint}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  if (window.confirm('This clears measurements, check-ins, and the journal on this device. Reset?')) {
                    onResetData();
                  }
                }}
                className="w-full rounded-[10px] px-3 py-2 text-left text-[0.7rem] font-medium text-status-urgent hover:bg-status-urgent-soft"
              >
                Reset demo data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
