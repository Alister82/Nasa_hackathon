import React, { useState, useEffect } from 'react';
import { HashRouter, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from '@/ui/components/TopBar';
import { Sidebar } from '@/ui/components/Sidebar';
import { DisclaimerBanner } from '@/ui/components/DisclaimerBanner';
import { BottomNav } from '@/ui/components/BottomNav';
import { CommandPalette } from '@/ui/components/CommandPalette';
import { AppRoutes } from './routes';
import { AppStateProvider, useAppState } from './AppState';

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
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

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResetData = () => {
    void resetDemoData().then(() => navigate('/'));
  };

  return (
    <div className="min-h-screen text-ink flex flex-row font-sans relative selection:bg-instrument selection:text-white">
      {/* Fixed Ambient Glow Background Layer (Zero cost, no repaints) */}
      <div className="ambient-glow-layer" aria-hidden="true">
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
      </div>

      {/* Modern Left Sidebar (hidden on mobile, collapsed rail on tablet, 264px on desktop) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <TopBar
          selectedCrewId={crewId}
          onCrewChange={setCrewId}
          missionSetting={missionSetting}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <DisclaimerBanner />

        <main className="flex-1 pb-24 md:pb-10">
          <AppRoutes />
        </main>

        {/* Mobile Bottom Navigation (< 768px) */}
        <div className="md:hidden">
          <BottomNav onResetData={handleResetData} />
        </div>
      </div>

      {/* Global Command Search Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
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
