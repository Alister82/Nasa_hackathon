import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';
import { TodayPage } from '@/ui/pages/TodayPage';
import { DomainDetailPage } from '@/ui/pages/DomainDetailPage';
import { LogPage } from '@/ui/pages/LogPage';
import { CheckInPage } from '@/ui/pages/CheckInPage';
import { UrgentPage } from '@/ui/pages/UrgentPage';
import { LabPage } from '@/ui/pages/LabPage';
import { ProofPage } from '@/ui/pages/ProofPage';
import { MissionPage } from '@/ui/pages/MissionPage';
import { JournalPage } from '@/ui/pages/JournalPage';
import { AboutPage } from '@/ui/pages/AboutPage';
import { HelpPage } from '@/ui/pages/HelpPage';
import { DailyCheckPage } from '@/ui/pages/DailyCheckPage';
import { HealthMonitorPage } from '@/ui/pages/HealthMonitorPage';
import { HandoverReportsPage } from '@/ui/pages/HandoverReportsPage';
import { GroundConsolePage } from '@/ui/pages/GroundConsolePage';
import { DevKitPage } from '@/ui/pages/DevKitPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ErrorBoundary><TodayPage /></ErrorBoundary>} />
      <Route path="/check" element={<ErrorBoundary><DailyCheckPage /></ErrorBoundary>} />
      <Route path="/monitor" element={<ErrorBoundary><HealthMonitorPage /></ErrorBoundary>} />
      <Route path="/domain/:domainId" element={<ErrorBoundary><DomainDetailPage /></ErrorBoundary>} />
      <Route path="/log" element={<ErrorBoundary><LogPage /></ErrorBoundary>} />
      <Route path="/checkin" element={<ErrorBoundary><CheckInPage /></ErrorBoundary>} />
      <Route path="/urgent" element={<ErrorBoundary><UrgentPage /></ErrorBoundary>} />
      <Route path="/lab" element={<ErrorBoundary><LabPage /></ErrorBoundary>} />
      <Route path="/proof" element={<ErrorBoundary><ProofPage /></ErrorBoundary>} />
      <Route path="/verification" element={<ErrorBoundary><ProofPage /></ErrorBoundary>} />
      <Route path="/reports" element={<ErrorBoundary><HandoverReportsPage /></ErrorBoundary>} />
      <Route path="/ground" element={<ErrorBoundary><GroundConsolePage /></ErrorBoundary>} />
      <Route path="/mission" element={<ErrorBoundary><MissionPage /></ErrorBoundary>} />
      <Route path="/journal" element={<ErrorBoundary><JournalPage /></ErrorBoundary>} />
      <Route path="/help" element={<ErrorBoundary><HelpPage /></ErrorBoundary>} />
      <Route path="/about" element={<ErrorBoundary><AboutPage /></ErrorBoundary>} />
      <Route path="/dev/kit" element={<ErrorBoundary><DevKitPage /></ErrorBoundary>} />
    </Routes>
  );
}
