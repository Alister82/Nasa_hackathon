import React, { useEffect } from 'react';
import { HashRouter, useLocation } from 'react-router-dom';
import { AppRoutes } from './routes';
import { AppStateProvider } from './AppState';
import { PremiumSidebar, PremiumTopBar, PremiumBottomNav } from '@/ui/components/PremiumShell';
import { DisclaimerBanner } from '@/ui/components/DisclaimerBanner';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';

function FocusManager() {
  const location = useLocation();
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('main h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
  }, [location.pathname]);
  return null;
}

function AppShell() {
  return (
    <div className="min-h-screen bg-bg-app text-ink font-sans">
      {/* Sidebar (desktop) */}
      <PremiumSidebar />

      {/* Top bar */}
      <PremiumTopBar />

      {/* Disclaimer */}
      <div className="fixed top-topbar left-0 lg:left-sidebar right-0 z-10">
        <DisclaimerBanner />
      </div>

      {/* Main content area */}
      <main
        className="
          pt-topbar lg:pl-sidebar
          flex flex-col min-h-screen
          pb-16 lg:pb-0
        "
        id="main-content"
        aria-label="Main content"
      >
        {/* Reserve space for disclaimer banner (~36px) */}
        <div className="h-9 flex-shrink-0" aria-hidden="true" />

        <div className="flex-1">
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <PremiumBottomNav />

      <FocusManager />
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
