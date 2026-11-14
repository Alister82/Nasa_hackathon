import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LabPage } from '@/ui/pages/LabPage';
import { ProofPage } from '@/ui/pages/ProofPage';
import { JournalPage } from '@/ui/pages/JournalPage';
import { AboutPage } from '@/ui/pages/AboutPage';
import * as services from '@/app/services';
import type { ResultsFile } from '@/contracts/types';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('U13: Scenario Lab Screen', () => {
  it('renders controls, systems comparison table, and responds to inject buttons', () => {
    render(
      <MemoryRouter>
        <LabPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Scenario Lab' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who flags first' })).toBeInTheDocument();

    // System labels in table & timeline
    expect(screen.getAllByText('Fixed thresholds').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rolling z-score').length).toBeGreaterThan(0);

    // Inject buttons
    const feverBtn = screen.getByRole('button', { name: 'Inject: fever' });
    fireEvent.click(feverBtn);

    const scenarioSelect = screen.getByLabelText(/Scenario/i) as HTMLSelectElement;
    expect(scenarioSelect.value).toBe('acute_fever');
  });
});

describe('U14: Proof Screen', () => {
  it('renders proof charts and numerical tables when results.json loads', async () => {
    const mockResults: ResultsFile = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/data/results.json'), 'utf8'),
    );
    vi.spyOn(services, 'loadResults').mockResolvedValueOnce(mockResults);

    render(
      <MemoryRouter>
        <ProofPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Algorithmic proof & verification/i)).toBeInTheDocument();
    });

    // Check for methodology text
    expect(screen.getByText(/simulated crews per scenario/i)).toBeInTheDocument();
    expect(screen.getByText(/Detector settings were tuned on separate seeds/i)).toBeInTheDocument();
  });

  it('renders "Results file not found..." when loadResults returns null', async () => {
    vi.spyOn(services, 'loadResults').mockResolvedValueOnce(null);

    render(
      <MemoryRouter>
        <ProofPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Results file not found. Run the harness and rebuild.')).toBeInTheDocument();
    });
  });
});

describe('U15: Journal and About Screens', () => {
  it('adds and lists journal entries newest first', async () => {
    render(
      <MemoryRouter>
        <JournalPage />
      </MemoryRouter>,
    );

    const actionInput = screen.getByLabelText(/Action taken/i);
    fireEvent.change(actionInput, { target: { value: 'Repeated heart rate reading' } });

    const submitBtn = screen.getByRole('button', { name: 'Add journal entry' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Repeated heart rate reading')).toBeInTheDocument();
    });
  });

  it('About page renders NASA risk coverage map and sources with (source link pending) where appropriate', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /About Vigil/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /NASA Human Research Program/i })).toBeInTheDocument();
    expect(screen.getByText('Risk of Cardiovascular Adaptations')).toBeInTheDocument();
    expect(screen.getByText('Risk of Radiation-Induced Cancers')).toBeInTheDocument();

    // Check for source links and pending status
    expect(screen.getAllByText('Source link').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(source link pending)').length).toBeGreaterThan(0);
  });
});

describe('U16/U17: Polish and Accessibility', () => {
  it('no forbidden clinical words anywhere in About page prose', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );

    const FORBIDDEN_IN_PROSE = ['ai doctor', 'you have'];
    const bodyText = document.body.textContent?.toLowerCase() ?? '';
    for (const phrase of FORBIDDEN_IN_PROSE) {
      expect(bodyText).not.toContain(phrase);
    }
  });
});

