import React, { useEffect } from 'react';
import { HashRouter, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from '@/ui/components/TopBar';
import { DisclaimerBanner } from '@/ui/components/DisclaimerBanner';
import { BottomNav } from '@/ui/components/BottomNav';
import { AppRoutes } from './routes';
import { AppStateProvider, useAppState } from './AppState';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium border-b-2 min-h-[44px] inline-flex items-center ${
    isActive
      ? 'border-instrument text-instrument font-bold'
      : 'border-transparent text-ink-soft hover:text-ink hover:border-line'
  }`;

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    crewId,
    setCrewId,
    missionSetting,
    resetDemoData,
  } = useAppState();

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('main h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
  }, [location.pathname]);

  const handleResetData = () => {
    void resetDemoData().then(() => navigate('/'));
  };

  return (
    <div className="min-h-screen bg-ceramic text-ink flex flex-col font-sans">
      <TopBar
        selectedCrewId={crewId}
        onCrewChange={setCrewId}
        missionSetting={missionSetting}
      />
      <DisclaimerBanner />

      <nav
        aria-label="Main sections"
        className="hidden lg:flex items-center gap-2 px-6 bg-panel border-b border-line overflow-x-auto select-none"
      >
        <NavLink to="/" end className={navLinkClass}>Today</NavLink>
        <NavLink to="/log" className={navLinkClass}>Log</NavLink>
        <NavLink to="/checkin" className={navLinkClass}>Check-in</NavLink>
        <NavLink to="/lab" className={navLinkClass}>Scenario Lab</NavLink>
        <NavLink to="/proof" className={navLinkClass}>Proof</NavLink>
        <NavLink to="/journal" className={navLinkClass}>Journal</NavLink>
        <NavLink to="/mission" className={navLinkClass}>Mission</NavLink>
        <NavLink to="/about" className={navLinkClass}>About</NavLink>
      </nav>

      <main className="flex-1 pb-20 lg:pb-8">
        <AppRoutes />
      </main>

      <BottomNav onResetData={handleResetData} />
    </div>
  );
}

export function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </AppStateProvider>
  );
}
