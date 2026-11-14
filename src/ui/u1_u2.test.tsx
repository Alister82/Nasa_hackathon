import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusChip } from '@/ui/components/StatusChip';
import { DisclaimerBanner } from '@/ui/components/DisclaimerBanner';
import { OfflineBadge } from '@/ui/components/OfflineBadge';
import { DISCLAIMER_BANNER } from '@/contracts/constants';
import { INDICATORS } from '@/contracts/indicators';
import { mockDataset } from '@/mocks/mockDataset';
import { mockAnalysis } from '@/mocks/mockAnalysis';
import { mockCards } from '@/mocks/mockCards';
import { getDataset, getAnalysis, getCards, USE_MOCKS } from '@/app/services';

describe('U1: StatusChip component', () => {
  it('renders status chip with default labels and icons', () => {
    const { rerender } = render(<StatusChip status="ok" />);
    expect(screen.getByText('Steady')).toBeInTheDocument();

    rerender(<StatusChip status="info" />);
    expect(screen.getByText('Expected')).toBeInTheDocument();

    rerender(<StatusChip status="watch" />);
    expect(screen.getByText('Watch')).toBeInTheDocument();

    rerender(<StatusChip status="review" />);
    expect(screen.getByText('Review')).toBeInTheDocument();

    rerender(<StatusChip status="urgent" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<StatusChip status="review" label="Custom Review" />);
    expect(screen.getByText('Custom Review')).toBeInTheDocument();
  });
});

describe('U1: DisclaimerBanner', () => {
  it('renders exact DISCLAIMER_BANNER string', () => {
    render(<DisclaimerBanner />);
    expect(screen.getByText(DISCLAIMER_BANNER)).toBeInTheDocument();
  });
});

describe('U1: OfflineBadge', () => {
  it('renders online text when navigator.onLine is true', () => {
    render(<OfflineBadge />);
    expect(screen.getByText(/Online/i)).toBeInTheDocument();
  });
});

describe('U2: Mock contract invariants', () => {
  it('mockDataset has 210 records with no gaps from -29 to 180 (invariant 2)', () => {
    expect(mockDataset.records).toHaveLength(210);
    for (let i = 0; i < 210; i++) {
      expect(mockDataset.records[i]!.day).toBe(-29 + i);
    }
  });

  it('mockAnalysis contains all 11 indicators (invariant 1)', () => {
    const indicatorKeys = Object.keys(mockAnalysis.indicators);
    expect(indicatorKeys).toHaveLength(11);
    for (const meta of INDICATORS) {
      expect(mockAnalysis.indicators[meta.id]).toBeDefined();
    }
  });

  it('mockAnalysis matches expected domain statuses', () => {
    expect(mockAnalysis.domains.cardiovascular.status).toBe('flagged');
    expect(mockAnalysis.domains.behavioral.status).toBe('flagged');
    expect(mockAnalysis.domains.sleep_recovery.status).toBe('watch');
    expect(mockAnalysis.domains.physical_performance.status).toBe('ok');
    expect(mockAnalysis.domains.metabolic_general.status).toBe('ok');
    expect(mockAnalysis.domains.radiation.status).toBe('ok');
  });

  it('mockCards satisfy invariant 3 & 4 & 5', () => {
    expect(mockCards).toHaveLength(2);
    for (const card of mockCards) {
      expect(card.observation.length).toBeGreaterThan(0);
      expect(card.uncertainty.statement.length).toBeGreaterThan(0);
      expect(card.escalation.text.length).toBeGreaterThan(0);
      expect(card.sourceIds.length).toBeGreaterThan(0);

      for (const action of card.recommendedActions) {
        if (!action.supplyAvailable) {
          expect(action.alternativeText).toBeDefined();
        }
      }

      const allText = [
        card.observation,
        card.uncertainty.statement,
        card.escalation.text,
        card.title,
      ].join(' ').toLowerCase();

      const FORBIDDEN = ['diagnose', 'you have', 'disease', 'cancer', 'depression'];
      for (const word of FORBIDDEN) {
        expect(allText).not.toContain(word);
      }
    }
  });

  it('services facade returns valid dataset and analysis', async () => {
    const ds = await getDataset('crew-1');
    expect(ds.records.length).toBe(210);

    const analysis = getAnalysis(ds, 120);
    expect(analysis.upToDay).toBe(120);

    const cards = getCards(analysis, { setting: 'deep_space', supplies: { bp_cuff: true, thermometer: true, glucometer: true, wrist_hr_monitor: true, exercise_equipment: true, sleep_mask: true } });
    expect(cards.length).toBeGreaterThan(0);
  });
});
