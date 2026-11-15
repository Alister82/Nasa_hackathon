import React, { useEffect, useState } from 'react';
import { HashRouter, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '@/ui/components/BottomNav';
import { CommandPalette } from '@/ui/components/CommandPalette';
import { DisclaimerBanner } from '@/ui/components/DisclaimerBanner';
import { Sidebar } from '@/ui/components/Sidebar';
import { TopBar } from '@/ui/components/TopBar';
import { AppRoutes } from './routes';
import { AppStateProvider, useAppState } from './AppState';
import { cn } from '@/ui/lib/format';

function FooterStatus() {
  return (
    <footer className="mx-auto mt-6 w-full max-w-[1480px] px-4 pb-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 border-t border-line/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <DisclaimerBanner />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.6rem] font-medium text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-status-ok" aria-hidden="true" />
            Local-first · IndexedDB
          </span>
          <span className="hidden sm:inline">No accounts · no network calls</span>
          <span className="tabular-nums">Vigil 0.1 · Prototype</span>
        </div>
      </div>
    </footer>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetDemoData } = useAppState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleResetData = () => {
    void resetDemoData().then(() => navigate('/'));
  };

  return (
    <div className="min-h-screen text-ink">
      <a
        href="#main-content"
        className="sr-only-focusable fixed left-3 top-3 z-[100] rounded-lg bg-instrument px-3 py-2 text-xs font-semibold text-white shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300',
          sidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-[272px]',
        )}
      >
        <TopBar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main id="main-content" className="flex-1 pb-[76px] lg:pb-0">
          <AppRoutes />
        </main>

        <FooterStatus />
      </div>

      <BottomNav onResetData={handleResetData} />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
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
