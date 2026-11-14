import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  NasaLogo,
  DashboardIcon, HealthIcon, LabIcon, JournalIcon,
  MissionIcon, ProofIcon, AboutIcon, CheckInIcon, UrgentIcon,
  OfflineBadge,
} from './PremiumIcons';
import { useAppState } from '@/app/AppState';
import { DEFAULT_CREW, MISSION_DAYS } from '@/contracts/constants';

interface NavItem {
  to:    string;
  label: string;
  icon:  React.ReactNode;
  end?:  boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',        label: 'Dashboard',         icon: <DashboardIcon />, end: true },
  { to: '/log',     label: 'Health Monitor',    icon: <HealthIcon /> },
  { to: '/checkin', label: 'Check-in',          icon: <CheckInIcon /> },
  { to: '/lab',     label: 'Scenario Lab',      icon: <LabIcon /> },
  { to: '/journal', label: 'Investigation Journal', icon: <JournalIcon /> },
  { to: '/mission', label: 'Mission Settings',  icon: <MissionIcon /> },
  { to: '/proof',   label: 'Reports & Proof',   icon: <ProofIcon /> },
  { to: '/about',   label: 'About Vigil',       icon: <AboutIcon /> },
];

function navLinkCls({ isActive }: { isActive: boolean }) {
  const base = `
    group flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium
    transition-all duration-150 ease-smooth min-h-[44px] select-none
  `;
  if (isActive) {
    return `${base} bg-accent-soft text-accent font-semibold`;
  }
  return `${base} text-ink-soft hover:bg-bg-surface-3 hover:text-ink`;
}

function MissionStatusPanel() {
  const { crewName, viewDay, missionSetting, analysis } = useAppState();
  const overallStatus: 'ok' | 'watch' | 'review' | 'urgent' = (() => {
    if (!analysis) return 'ok';
    const statuses = Object.values(analysis.domains).map(d => d.status);
    if (statuses.includes('flagged')) return 'review';
    if (statuses.includes('watch'))   return 'watch';
    return 'ok';
  })();
  const statusColors = {
    ok:     'bg-status-ok',
    watch:  'bg-status-watch',
    review: 'bg-status-review',
    urgent: 'bg-status-urgent',
  };
  const statusLabels = {
    ok:     'Nominal',
    watch:  'Watch',
    review: 'Review',
    urgent: 'Urgent',
  };
  const settingLabel = missionSetting === 'deep_space' ? 'Deep Space'
    : missionSetting === 'lunar_base' ? 'Lunar Base' : 'ISS / Station';

  return (
    <div className="mx-3 mb-3 p-3 rounded-card bg-bg-surface border border-border shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[overallStatus]}`}
          aria-hidden="true"
        />
        <span className="text-xs font-semibold text-ink">{crewName}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div>
          <p className="text-[10px] text-ink-muted uppercase tracking-wide">Day</p>
          <p className="text-sm font-bold text-ink tabular-nums">{viewDay}<span className="text-ink-soft font-normal">/{MISSION_DAYS}</span></p>
        </div>
        <div>
          <p className="text-[10px] text-ink-muted uppercase tracking-wide">Status</p>
          <p className={`text-sm font-bold ${overallStatus === 'ok' ? 'text-status-ok' : overallStatus === 'watch' ? 'text-status-watch' : 'text-status-review'}`}>
            {statusLabels[overallStatus]}
          </p>
        </div>
        <div className="col-span-2 mt-1">
          <p className="text-[10px] text-ink-muted truncate">{settingLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function PremiumSidebar() {
  return (
    <aside
      className="
        fixed top-0 left-0 h-full w-sidebar hidden lg:flex flex-col z-30
        border-r border-border bg-bg-glass backdrop-blur-glass
      "
      style={{ boxShadow: 'var(--shadow-glass)' }}
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-topbar flex-shrink-0 border-b border-border">
        <NasaLogo size={32} />
        <div>
          <p className="text-sm font-bold text-ink leading-none" style={{ fontFamily: 'var(--font-heading)' }}>Vigil</p>
          <p className="text-[10px] text-ink-muted leading-none mt-0.5">Astronaut Health Monitor</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5" aria-label="Sidebar navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navLinkCls}>
            <span className="flex-shrink-0 w-5 text-current opacity-70 group-[.bg-accent-soft]:opacity-100">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Urgent help CTA */}
      <div className="px-2 pb-2">
        <Link
          to="/urgent"
          className="
            flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-semibold
            text-status-urgent bg-status-urgent/8 hover:bg-status-urgent/15
            transition-colors duration-150 min-h-[44px]
          "
          aria-label="Emergency: Get urgent help now"
        >
          <span className="flex-shrink-0 w-5"><UrgentIcon /></span>
          <span>Get Help Now</span>
        </Link>
      </div>

      {/* Mission status panel */}
      <MissionStatusPanel />
    </aside>
  );
}

/* ─── Top bar ─── */
export function PremiumTopBar() {
  const navigate = useNavigate();
  const { crewId, setCrewId } = useAppState();

  return (
    <header
      className="
        fixed top-0 left-0 lg:left-sidebar right-0 h-topbar z-20 flex items-center
        px-4 lg:px-6 gap-4 border-b border-border bg-bg-glass backdrop-blur-glass
      "
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      {/* Mobile brand */}
      <Link
        to="/"
        className="flex items-center gap-2 lg:hidden"
        aria-label="Vigil home"
      >
        <NasaLogo size={28} />
      </Link>

      <div className="flex-1" />

      {/* Crew selector */}
      <label className="sr-only" htmlFor="crew-select">Select crew member</label>
      <select
        id="crew-select"
        value={crewId}
        onChange={(e) => setCrewId(e.target.value)}
        className="
          text-xs font-medium text-ink bg-bg-surface-2 border border-border
          rounded-input px-3 py-1.5 min-h-[36px] focus:outline-none focus:border-accent
          cursor-pointer
        "
        aria-label="Select crew member"
      >
        {DEFAULT_CREW.map((crew) => (
          <option key={crew.crewId} value={crew.crewId}>{crew.crewName}</option>
        ))}
      </select>

      {/* Offline badge */}
      <OfflineBadge />

      {/* Urgent help (desktop visible) */}
      <button
        type="button"
        onClick={() => navigate('/urgent')}
        className="
          hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-input text-xs font-semibold
          text-status-urgent border border-status-review/30 bg-status-review/5
          hover:bg-status-review/10 transition-colors min-h-[44px]
        "
        aria-label="Get urgent medical help"
      >
        <span aria-hidden="true">🆘</span>
        Urgent help
      </button>
    </header>
  );
}

/* ─── Mobile bottom navigation ─── */
const MOBILE_NAV: NavItem[] = [
  { to: '/',        label: 'Today',    icon: <DashboardIcon />, end: true },
  { to: '/log',     label: 'Monitor',  icon: <HealthIcon /> },
  { to: '/checkin', label: 'Check-in', icon: <CheckInIcon /> },
  { to: '/lab',     label: 'Lab',      icon: <LabIcon /> },
  { to: '/mission', label: 'Mission',  icon: <MissionIcon /> },
];

export function PremiumBottomNav() {
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 h-16 z-30 lg:hidden
        flex items-stretch border-t border-border bg-bg-glass backdrop-blur-glass
      "
      aria-label="Mobile navigation"
    >
      {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-accent' : 'text-ink-muted hover:text-ink'
            }`
          }
          aria-label={item.label}
        >
          <span className="w-5 h-5">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

