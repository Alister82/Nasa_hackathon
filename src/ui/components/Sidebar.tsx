import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Activity,
  FlaskConical,
  Info,
  LayoutDashboard,
  LifeBuoy,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  Signal,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MISSION_SETTINGS } from '@/guidance';
import { useAppState } from '@/app/AppState';
import { MISSION_DAYS } from '@/contracts/constants';
import { cn } from '@/ui/lib/format';
import { VigilMark } from './ui';

interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number;
}

function overallState(cards: ReturnType<typeof useAppState>['cards']): {
  label: string;
  tone: 'ok' | 'watch' | 'review';
} {
  if (cards.some((card) => card.severity === 'urgent')) return { label: 'Urgent review', tone: 'review' };
  if (cards.some((card) => card.severity === 'review')) return { label: 'Review advised', tone: 'review' };
  if (cards.some((card) => card.severity === 'watch')) return { label: 'Watch', tone: 'watch' };
  return { label: 'Nominal', tone: 'ok' };
}

const TONE_STYLES = {
  ok: 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]',
  watch: 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]',
  review: 'bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.85)]',
};

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { crewName, viewDay, missionSetting, cards } = useAppState();
  const setting = MISSION_SETTINGS[missionSetting];
  const state = overallState(cards);
  const attentionCount = cards.filter((card) => card.severity !== 'info').length;

  const groups: Array<{ label: string; items: NavItem[] }> = [
    {
      label: 'Monitoring',
      items: [
        { to: '/', label: 'Dashboard', short: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/log', label: 'Health Monitor', short: 'Monitor', icon: Activity },
        { to: '/lab', label: 'Scenario Lab', short: 'Scenario Lab', icon: FlaskConical },
        { to: '/proof', label: 'Verification', short: 'Verification', icon: ShieldCheck },
      ],
    },
    {
      label: 'Operations',
      items: [
        { to: '/journal', label: 'Investigation Journal', short: 'Journal', icon: NotebookPen },
        { to: '/mission', label: 'Mission Settings', short: 'Mission Settings', icon: Settings2 },
      ],
    },
    {
      label: 'Support',
      items: [
        { to: '/help', label: 'Help & Support', short: 'Help', icon: LifeBuoy },
        { to: '/about', label: 'About Vigil', short: 'About', icon: Info },
      ],
    },
  ];

  return (
    <>
      {/* Mobile scrim */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-[#0b1b33]/35 backdrop-blur-[2px] transition-opacity lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        aria-label="Application sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-white/70 bg-[linear-gradient(165deg,rgba(255,255,255,0.92)_0%,rgba(240,247,255,0.86)_55%,rgba(230,240,253,0.9)_100%)] shadow-[12px_0_50px_-30px_rgba(18,45,82,0.3)] backdrop-blur-2xl transition-all duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[88px]' : 'lg:w-[272px]',
        )}
      >
        <div className={cn('flex items-center gap-3 px-4 pb-3 pt-5', collapsed && 'lg:justify-center lg:px-2')}>
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Vigil dashboard">
            <VigilMark className="h-10 w-10 shrink-0" />
            <span className={cn('min-w-0 transition-opacity', collapsed && 'lg:hidden')}>
              <span className="block font-display text-[1.35rem] font-extrabold leading-none tracking-[-0.045em] text-ink">
                Vigil
              </span>
              <span className="mt-1 block text-[0.63rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Astronaut Health Monitor
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-soft hover:bg-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={cn('mx-4 mb-4 h-px bg-gradient-to-r from-transparent via-line to-transparent', collapsed && 'lg:mx-3')} />

        <nav aria-label="Main sections" className="scroll-thin flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.label} className="mb-5">
              <p
                className={cn(
                  'mb-1.5 px-3 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-ink-faint',
                  collapsed && 'lg:hidden',
                )}
                aria-hidden={collapsed}
              >
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const showBadge = item.to === '/' && attentionCount > 0;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onCloseMobile}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'nav-item',
                            isActive && 'nav-item-active',
                            collapsed && 'lg:justify-center lg:px-0',
                          )
                        }
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                        <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                        {showBadge && (
                          <span
                            className={cn(
                              'ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-status-review px-1 text-[0.58rem] font-bold text-white',
                              collapsed && 'lg:hidden',
                            )}
                            aria-label={`${attentionCount} alerts need attention`}
                          >
                            {attentionCount}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className={cn('px-1.5', collapsed && 'lg:hidden')}>
            <Link
              to="/urgent"
              onClick={onCloseMobile}
              className="group flex min-h-[44px] items-center gap-2.5 rounded-xl border border-status-urgent/20 bg-status-urgent-soft/70 px-3 py-2.5 text-[0.72rem] font-semibold text-status-urgent transition-colors hover:bg-status-urgent hover:text-white"
            >
              <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span className="flex-1">Emergency support</span>
              <Signal className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
            </Link>
          </div>
        </nav>

        {/* Mission status card */}
        <div className={cn('px-3 pb-3', collapsed && 'lg:px-2')}>
          <div
            className={cn(
              'relative overflow-hidden rounded-[18px] border border-white/15 bg-[linear-gradient(155deg,#17345f_0%,#0d2344_48%,#081729_100%)] p-4 text-white shadow-[0_20px_40px_-24px_rgba(9,28,56,0.85)]',
              collapsed && 'lg:flex lg:items-center lg:justify-center lg:p-2',
            )}
          >
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/10" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-4 -top-5 h-24 w-24 rounded-full border border-white/10" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -left-14 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(84,144,238,0.45),rgba(84,144,238,0)_70%)]" aria-hidden="true" />

            <div className={cn('relative', collapsed && 'lg:hidden')}>
              <div className="flex items-center justify-between">
                <span className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-blue-200/80">Mission</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[0.58rem] font-semibold text-blue-50">
                  <span className={cn('h-1.5 w-1.5 rounded-full', TONE_STYLES[state.tone])} />
                  {state.label}
                </span>
              </div>
              <p className="mt-2 font-display text-[0.98rem] font-bold leading-tight tracking-[-0.02em]">{setting.label}</p>
              <p className="mt-0.5 text-[0.64rem] text-blue-100/70">{crewName} · Day {viewDay} of {MISSION_DAYS}</p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-300 to-blue-400"
                  style={{ width: `${Math.min(100, (viewDay / MISSION_DAYS) * 100)}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[0.6rem] text-blue-100/65">
                <span>{setting.oneWayDelayMinutes === 0 ? 'Near-real-time ground link' : `${setting.oneWayDelayMinutes} min one-way delay`}</span>
                <span className="tabular-nums">{Math.round((viewDay / MISSION_DAYS) * 100)}%</span>
              </div>
            </div>

            <div className={cn('hidden', collapsed && 'lg:flex lg:flex-col lg:items-center lg:gap-1')}>
              <span className="font-display text-sm font-extrabold">D{viewDay}</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', TONE_STYLES[state.tone])} />
            </div>
          </div>

          <div className={cn('mt-3 flex items-center justify-between px-1', collapsed && 'lg:hidden')}>
            <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-medium text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-status-ok" />
              On-device record
            </span>
            <Link
              to="/mission"
              onClick={onCloseMobile}
              className="inline-flex min-h-[44px] items-center text-[0.6rem] font-semibold text-instrument hover:underline"
            >
              Configure
            </Link>
          </div>
        </div>

        <div className={cn('border-t border-white/70 px-3 py-2.5', collapsed && 'lg:px-2')}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'hidden min-h-[44px] w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[0.68rem] font-semibold text-ink-soft transition-colors hover:bg-white/70 hover:text-ink lg:flex',
              collapsed && 'lg:justify-center',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            <span className={cn(collapsed && 'lg:hidden')}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
