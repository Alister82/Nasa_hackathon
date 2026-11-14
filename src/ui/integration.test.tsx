import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { getDataset, getAnalysis, getCards, USE_MOCKS } from '@/app/services';
import { MeasurementForm } from '@/ui/components/MeasurementForm';
import { CheckInForm } from '@/ui/components/CheckInForm';
import { MissionPicker } from '@/ui/components/MissionPicker';
import { SupplyChecklist } from '@/ui/components/SupplyChecklist';
import type { MissionContext } from '@/contracts/types';

describe('U12 Integration: Real engine and guidance pipeline', () => {
  it('USE_MOCKS is set to false for real integration', () => {
    expect(USE_MOCKS).toBe(false);
  });

  it('runs end-to-end demo story: Crew 1 at day 120 in deep space produces review cards', async () => {
    const ds = await getDataset('crew-1');
    expect(ds.records).toHaveLength(210);

    const analysis = getAnalysis(ds, 120);
    expect(analysis.upToDay).toBe(120);
    expect(analysis.baselineReady).toBe(true);

    // Cardiovascular status flagged
    expect(analysis.domains.cardiovascular.status).toBe('flagged');
    expect(analysis.findings.length).toBeGreaterThan(0);

    const ctx: MissionContext = {
      setting: 'deep_space',
      supplies: {
        bp_cuff: true,
        thermometer: true,
        glucometer: true,
        wrist_hr_monitor: true,
        exercise_equipment: true,
        sleep_mask: true,
      },
    };

    const cards = getCards(analysis, ctx);
    const reviewCards = cards.filter((c) => c.severity === 'review');
    expect(reviewCards.length).toBeGreaterThan(0);

    // Escalation text for deep space transit
    const card = reviewCards[0]!;
    expect(card.escalation.level).toBe('report_to_ground');
    expect(card.escalation.text).toContain('reply may take at least 34 minutes');
    expect(card.escalation.expectedReplyMinutes).toBe(34);
  });

  it('switching mission setting changes escalation text on card', async () => {
    const ds = await getDataset('crew-1');
    const analysis = getAnalysis(ds, 120);

    const stationCtx: MissionContext = {
      setting: 'station',
      supplies: {
        bp_cuff: true,
        thermometer: true,
        glucometer: true,
        wrist_hr_monitor: true,
        exercise_equipment: true,
        sleep_mask: true,
      },
    };

    const stationCards = getCards(analysis, stationCtx);
    const stationReview = stationCards.find((c) => c.severity === 'review');
    expect(stationReview!.escalation.level).toBe('contact_ground_now');
    expect(stationReview!.escalation.text).toBe(
      'Ask the flight surgeon for a call today. Start the steps below while you wait.',
    );
  });
});

describe('U9: MeasurementForm component', () => {
  it('renders all 7 loggable indicator rows with validation', () => {
    render(
      <MeasurementForm
        day={120}
        setting="deep_space"
        onSave={async () => {}}
      />,
    );

    expect(screen.getByLabelText(/Resting heart rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blood pressure, systolic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blood pressure, diastolic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Body temperature/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blood glucose/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sleep/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Exercise/i)).toBeInTheDocument();
  });

  it('displays urgent callout when reading is in urgent range (e.g. bp_sys 185)', () => {
    render(
      <MeasurementForm
        day={120}
        setting="deep_space"
        onSave={async () => {}}
      />,
    );

    const bpInput = screen.getByLabelText(/Blood pressure, systolic/i);
    fireEvent.change(bpInput, { target: { value: '185' } });

    expect(
      screen.getByText(
        'One reading is in the urgent range. Repeat it once, and if it is confirmed, follow your emergency medical procedures and contact the crew medical officer now.',
      ),
    ).toBeInTheDocument();
  });
});

describe('U10: CheckInForm & CheckInPage', () => {
  it('submits checkin and triggers urgent callback on "I need help now"', () => {
    let submitted = false;
    let urgentClicked = false;

    render(
      <CheckInForm
        crewId="crew-1"
        day={120}
        onSubmit={async () => {
          submitted = true;
          return { level: 'none', message: 'Thanks for checking in.', suggestions: [], escalation: null };
        }}
        onNeedHelpNow={() => {
          urgentClicked = true;
        }}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: 'Save check-in' });
    fireEvent.click(submitBtn);
    expect(submitted).toBe(true);

    const urgentBtn = screen.getByRole('button', { name: /I need help now/i });
    fireEvent.click(urgentBtn);
    expect(urgentClicked).toBe(true);
  });
});

describe('U11: MissionPicker & SupplyChecklist', () => {
  it('changes mission setting', () => {
    let currentSetting = 'deep_space';
    const { rerender } = render(
      <MissionPicker
        value={currentSetting as any}
        onChange={(m) => {
          currentSetting = m;
        }}
      />,
    );

    const stationRadio = screen.getByRole('radio', { name: /Space station/i });
    fireEvent.click(stationRadio);
    expect(currentSetting).toBe('station');

    rerender(<MissionPicker value={currentSetting as any} onChange={() => {}} />);
    expect(stationRadio).toBeChecked();
  });

  it('toggles supply items', () => {
    let supplies = { bp_cuff: true, thermometer: true, glucometer: true, wrist_hr_monitor: true, exercise_equipment: true, sleep_mask: true };
    render(
      <SupplyChecklist
        supplies={supplies}
        onChange={(s) => {
          supplies = s as any;
        }}
      />,
    );

    const cuffCheckbox = screen.getAllByRole('checkbox')[0]!;
    fireEvent.click(cuffCheckbox);
    expect(supplies.bp_cuff).toBe(false);
  });
});
