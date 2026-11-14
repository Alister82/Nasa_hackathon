import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BodyMap } from '@/ui/components/BodyMap';
import { DomainRow } from '@/ui/components/DomainRow';
import { TimelineScrubber } from '@/ui/components/TimelineScrubber';
import { AlertCardView } from '@/ui/components/AlertCardView';
import { TodayPage } from '@/ui/pages/TodayPage';
import { mockAnalysis } from '@/mocks/mockAnalysis';
import { mockCards } from '@/mocks/mockCards';
import { mockSources } from '@/mocks/mockSources';
import type { DomainId } from '@/contracts/types';

describe('U4: BodyMap', () => {
  const summaries: Record<DomainId, string> = {
    cardiovascular: 'Heart rate 73 bpm',
    sleep_recovery: 'Sleep 5.6 hrs',
    physical_performance: 'Exercise steady',
    behavioral: 'Mood 2.9',
    metabolic_general: 'Temp 36.6',
    radiation: 'Dose 1.8 mSv',
  };

  it('renders all body map region buttons with aria labels and legend chips', () => {
    const handleSelect = vi.fn();
    render(
      <BodyMap
        domains={mockAnalysis.domains}
        summaries={summaries}
        onSelect={handleSelect}
      />,
    );

    const group = screen.getByRole('group', { name: 'Body map' });
    expect(group).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    // 9 body parts + 5 legend status chips
    expect(buttons.length).toBeGreaterThanOrEqual(9);

    // Verify cardiovascular button
    const chest = screen.getByRole('button', { name: /Heart and blood pressure/i });
    expect(chest).toBeInTheDocument();

    // Click triggers onSelect
    fireEvent.click(chest);
    expect(handleSelect).toHaveBeenCalledWith('cardiovascular');

    // Keyboard Enter triggers onSelect
    fireEvent.keyDown(chest, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith('cardiovascular');

    // Keyboard Space triggers onSelect
    fireEvent.keyDown(chest, { key: ' ' });
    expect(handleSelect).toHaveBeenCalledWith('cardiovascular');
  });
});

describe('U4: DomainRow', () => {
  it('renders domain label, status chip, and calls onOpen on click/keypress', () => {
    const handleOpen = vi.fn();
    render(
      <DomainRow
        domain="cardiovascular"
        analysis={mockAnalysis.domains.cardiovascular}
        summary="Heart rate 73 bpm, systolic BP 124 mmHg"
        onOpen={handleOpen}
      />,
    );

    expect(screen.getByText('Heart and blood pressure')).toBeInTheDocument();
    expect(screen.getByText('Heart rate 73 bpm, systolic BP 124 mmHg')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();

    const row = screen.getByRole('button');
    fireEvent.click(row);
    expect(handleOpen).toHaveBeenCalledWith('cardiovascular');

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(handleOpen).toHaveBeenCalledWith('cardiovascular');
  });
});

describe('U5: TimelineScrubber', () => {
  it('renders day counter, tick marks, and responds to keyboard navigation', () => {
    const handleChange = vi.fn();
    const handleToday = vi.fn();
    const handleDemo = vi.fn();

    render(
      <TimelineScrubber
        day={120}
        maxDay={180}
        markers={[{ day: 95, status: 'review', label: 'pattern' }]}
        onChange={handleChange}
        onToday={handleToday}
        onPlayDemo={handleDemo}
      />,
    );

    expect(screen.getByText('Day 120 of 180')).toBeInTheDocument();
    expect(screen.getByText('Day 30')).toBeInTheDocument();
    expect(screen.getByText('Day 180')).toBeInTheDocument();

    const slider = screen.getByRole('slider', { name: /Scrub mission day/i });
    expect(slider).toBeInTheDocument();

    // Keyboard arrows
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(121);

    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith(119);

    fireEvent.keyDown(slider, { key: 'PageUp' });
    expect(handleChange).toHaveBeenCalledWith(130);

    fireEvent.keyDown(slider, { key: 'PageDown' });
    expect(handleChange).toHaveBeenCalledWith(110);

    // Buttons
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(handleToday).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Play demo story' }));
    expect(handleDemo).toHaveBeenCalled();
  });
});

describe('U6: AlertCardView', () => {
  it('renders procedure sheet layout with numbered actions, sources, and evidence day toggle', () => {
    const card = mockCards[0]!;
    const handleLog = vi.fn();

    render(
      <AlertCardView
        card={card}
        sources={mockSources}
        onLog={handleLog}
      />,
    );

    // Header & observation
    expect(screen.getByText(card.title)).toBeInTheDocument();
    expect(screen.getByText('What changed')).toBeInTheDocument();
    expect(screen.getByText(card.observation)).toBeInTheDocument();

    // Sections
    expect(screen.getByText('Evidence')).toBeInTheDocument();
    expect(screen.getByText('What we do not know')).toBeInTheDocument();
    expect(screen.getByText('Do now')).toBeInTheDocument();
    expect(screen.getByText('Measure next')).toBeInTheDocument();
    expect(screen.getByText('Who to contact')).toBeInTheDocument();
    expect(screen.getByText(/Reply expected in at least 34 minutes/i)).toBeInTheDocument();

    // Evidence "Show days" toggle
    const showDaysBtn = screen.getAllByRole('button', { name: 'Show days' })[0]!;
    fireEvent.click(showDaysBtn);
    expect(screen.getByText(/Observed days: 114, 115/i)).toBeInTheDocument();

    // Sources rendered
    expect(screen.getByText(/NASA Human Research Program: 5 Hazards/i)).toBeInTheDocument();

    // "Log what I did" button
    const logBtn = screen.getByRole('button', { name: 'Log what I did' });
    fireEvent.click(logBtn);
    expect(handleLog).toHaveBeenCalledWith(card);
  });
});

describe('U7: TodayPage Assembly', () => {
  it('renders Today screen layout with scrubber, body map, domains, and alert cards', () => {
    render(
      <MemoryRouter>
        <TodayPage initialDay={120} />
      </MemoryRouter>,
    );

    // Scrubber
    expect(screen.getByText('Day 120 of 180')).toBeInTheDocument();

    // Body Map
    expect(screen.getByRole('group', { name: 'Body map' })).toBeInTheDocument();

    // Domains
    expect(screen.getByText('Body systems and domains')).toBeInTheDocument();
    expect(screen.getByText('Heart and blood pressure')).toBeInTheDocument();

    // Cards
    expect(screen.getByText('What needs attention')).toBeInTheDocument();
    expect(screen.getAllByText(/Resting heart rate|Multiple measures/i).length).toBeGreaterThan(0);
  });
});
