import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  CheckCircle,
  FlaskConical,
  Award,
  FileText,
  Radio,
  BookOpen,
  Settings,
  HelpCircle,
  Info,
} from 'lucide-react';

export interface SidebarProps {
  className?: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/monitor', label: 'Health Monitor', icon: Activity },
  { to: '/check', label: 'Daily Check', icon: CheckCircle },
  { to: '/lab', label: 'Scenario Lab', icon: FlaskConical },
  { to: '/verification', label: 'Verification', icon: Award },
  { to: '/reports', label: 'Handover Reports', icon: FileText },
  { to: '/ground', label: 'Ground Console', icon: Radio },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/mission', label: 'Mission Settings', icon: Settings },
  { to: '/help', label: 'Help & FAQ', icon: HelpCircle },
  { to: '/about', label: 'About & Limits', icon: Info },
];

export function Sidebar({ className = '' }: SidebarProps) {
  return (
    <aside
      className={`hidden md:flex flex-col w-[80px] xl:w-[264px] transition-all duration-300 glass-surface border-r border-line h-screen sticky top-0 z-30 select-none py-5 px-3.5 ${className}`}
      aria-label="Flight deck navigation"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-center xl:justify-start gap-3 px-1 mb-6">
        {/* Simple geometric vector brandmark for Vigil */}
        <div className="w-10 h-10 rounded-input bg-gradient-to-br from-instrument to-blue-400 flex items-center justify-center text-white font-extrabold shadow-sm flex-shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" />
            <circle cx="12" cy="11" r="3" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div className="hidden xl:flex flex-col min-w-0">
          <span className="font-extrabold text-base text-ink tracking-tight flex items-center gap-1.5">
            Flight Deck <span className="text-[10px] font-bold text-instrument px-1.5 py-0.2 rounded-full bg-instrument/15">v2</span>
          </span>
          <span className="text-[11px] text-ink-muted truncate">Autonomous Flight Monitor</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-center xl:justify-start gap-3 px-3 py-2.5 rounded-sheet font-medium text-sm transition-all min-h-[44px] min-w-[48px] group ${
                  isActive
                    ? 'bg-instrument text-white font-semibold shadow-sm'
                    : 'text-ink-soft hover:text-ink hover:bg-line/20'
                }`
              }
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden xl:inline truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="hidden xl:flex flex-col gap-1 px-3 pt-3 border-t border-line text-[11px] text-ink-muted">
        <span className="font-medium text-ink-soft">NASA Space Apps 2026</span>
        <span>Offline-first flight prototype</span>
      </div>
    </aside>
  );
}
