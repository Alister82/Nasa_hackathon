import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppStateProvider, useAppState } from './AppState';
import { clearAll, getSetting, loadEntries } from '@/storage';

function Probe() {
  const state = useAppState();
  return (
    <div>
      <span data-testid="loading">{String(state.loading)}</span>
      <span data-testid="setting">{state.dataset?.missionSetting ?? 'none'}</span>
      <span data-testid="day">{state.viewDay}</span>
      <span data-testid="findings">
        {state.analysis?.findings.map((finding) => `${finding.kind}${finding.urgent ? '!' : ''}`).join(',') ?? ''}
      </span>
      <button type="button" onClick={() => state.setMissionSetting('station')}>
        set station
      </button>
      <button type="button" onClick={() => void state.saveMeasurements({ bp_sys: 185 })}>
        save high blood pressure
      </button>
      <button type="button" onClick={() => void state.setViewDay(90)}>
        day 90
      </button>
      <button type="button" onClick={() => void state.resetDemoData()}>
        reset
      </button>
    </div>
  );
}

async function renderProvider() {
  render(
    <AppStateProvider>
      <Probe />
    </AppStateProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
}

describe('app state integration', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('loads simulated demo data and persists mission setting and viewed day', async () => {
    await renderProvider();
    expect(screen.getByTestId('setting')).toHaveTextContent('deep_space');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'set station' }));
    });
    await waitFor(() => expect(screen.getByTestId('setting')).toHaveTextContent('station'));
    expect(await getSetting('missionSetting', 'deep_space')).toBe('station');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'day 90' }));
    });
    expect(screen.getByTestId('day')).toHaveTextContent('90');
    expect(await getSetting('viewDay', 120)).toBe(90);
  });

  it('refreshes analysis after a manual reading and clears everything on reset', async () => {
    await renderProvider();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'save high blood pressure' }));
    });
    await waitFor(() =>
      expect(screen.getByTestId('findings').textContent).toContain('hard_threshold!'),
    );
    expect(await loadEntries('crew-1')).toHaveLength(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    });
    await waitFor(() =>
      expect(screen.getByTestId('findings').textContent).not.toContain('hard_threshold!'),
    );
    await waitFor(() => expect(screen.getByTestId('setting')).toHaveTextContent('deep_space'));
    expect(await loadEntries('crew-1')).toHaveLength(0);
    expect(await getSetting('missionSetting', 'deep_space')).toBe('deep_space');
  });
});
