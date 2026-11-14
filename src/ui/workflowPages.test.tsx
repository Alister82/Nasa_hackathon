import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider } from '@/app/AppState';
import { DailyCheckPage } from './pages/DailyCheckPage';
import { HealthMonitorPage } from './pages/HealthMonitorPage';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AppStateProvider>
        {ui}
      </AppStateProvider>
    </MemoryRouter>,
  );
}

describe('Phase 3: DailyCheckPage Guided Workflow', () => {
  it('renders the 3-step daily check wizard and handles step navigation', async () => {
    renderWithProviders(<DailyCheckPage />);

    expect(await screen.findByText('Astronaut Daily Check')).toBeInTheDocument();
    expect(screen.getByText(/Physical Telemetry & Vitals/i)).toBeInTheDocument();
    expect(screen.getByText(/1-Tap Wearable Stream/i)).toBeInTheDocument();

    // Advance to Step 2
    const continueBtn = screen.getByRole('button', { name: /Continue to Wellbeing Check/i });
    fireEvent.click(continueBtn);

    expect(screen.getByText(/Cognitive & Mental Wellbeing/i)).toBeInTheDocument();
    expect(screen.getByText(/Subjective Stress Level/i)).toBeInTheDocument();

    // Advance to Step 3
    const reviewBtn = screen.getByRole('button', { name: /Review & Transmit/i });
    fireEvent.click(reviewBtn);

    expect(screen.getByText(/Pre-Flight Baseline Variance Check/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Commit & Transmit to Flight Deck/i })).toBeInTheDocument();
  });
});

describe('Phase 3: HealthMonitorPage', () => {
  it('renders health monitor tabs and switches between vitals, domains, and logs', async () => {
    renderWithProviders(<HealthMonitorPage />);

    expect(await screen.findByText('Health & Sensor Monitor')).toBeInTheDocument();
    expect(screen.getByText('Vitals Overview')).toBeInTheDocument();
    expect(screen.getByText('Physiological Domains')).toBeInTheDocument();

    // Switch to Physiological Domains tab
    const domainsTab = screen.getByRole('tab', { name: 'Physiological Domains' });
    fireEvent.click(domainsTab);

    expect(await screen.findByText('Heart and blood pressure')).toBeInTheDocument();
    expect(screen.getByText('Sleep and recovery')).toBeInTheDocument();
  });
});
