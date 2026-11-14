import React, { useState } from 'react';
import type { DomainId, DomainAnalysis, IndicatorStatus } from '@/contracts/types';
import { DOMAIN_LABELS } from '@/contracts/indicators';
import { StatusChip } from './StatusChip';
import { MoonCrescentIcon, RadiationIcon } from './Icons';

export interface BodyMapProps {
  domains: Record<DomainId, DomainAnalysis>;
  summaries: Record<DomainId, string>;
  selected?: DomainId;
  onSelect: (d: DomainId) => void;
}

const STATUS_COLOR_TOKENS: Record<
  IndicatorStatus,
  { fill: string; stroke: string; word: string }
> = {
  ok: { fill: 'var(--status-ok-soft)', stroke: 'var(--status-ok)', word: 'Steady' },
  watch: { fill: 'var(--status-watch-soft)', stroke: 'var(--status-watch)', word: 'Watch' },
  flagged: { fill: 'var(--status-review-soft)', stroke: 'var(--status-review)', word: 'Review' },
};

function getColorsForStatus(status: IndicatorStatus) {
  return STATUS_COLOR_TOKENS[status] ?? STATUS_COLOR_TOKENS.ok;
}

export function BodyMap({ domains, summaries, selected, onSelect }: BodyMapProps) {
  const [hoveredDomain, setHoveredDomain] = useState<DomainId | null>(null);

  const getRegionProps = (domainId: DomainId, _regionLabel: string) => {
    const analysis = domains[domainId];
    const status = analysis?.status ?? 'ok';
    const colors = getColorsForStatus(status);
    const domainTitle = DOMAIN_LABELS[domainId];
    const isSelected = selected === domainId;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(domainId);
      }
    };

    return {
      role: 'button',
      tabIndex: 0,
      'aria-label': `${domainTitle}, ${colors.word}. Open details.`,
      onClick: () => onSelect(domainId),
      onKeyDown: handleKeyDown,
      onMouseEnter: () => setHoveredDomain(domainId),
      onMouseLeave: () => setHoveredDomain(null),
      onFocus: () => setHoveredDomain(domainId),
      onBlur: () => setHoveredDomain(null),
      className: `cursor-pointer transition-colors duration-200 outline-none ${
        status === 'flagged' ? 'animate-pulse-once' : ''
      }`,
      style: {
        fill: colors.fill,
        stroke: isSelected ? 'var(--instrument)' : colors.stroke,
        strokeWidth: isSelected ? 3 : 2,
      },
    };
  };

  const activeDomain = hoveredDomain ?? selected;
  const activeStatus = activeDomain ? domains[activeDomain]?.status ?? 'ok' : null;
  const activeColors = activeStatus ? getColorsForStatus(activeStatus) : null;

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Tooltip / Summary banner */}
      <div
        className="h-10 text-xs sm:text-sm text-center flex items-center justify-center font-medium px-2 py-1 mb-2 bg-panel rounded-chip border border-line w-full max-w-[280px]"
        aria-live="polite"
      >
        {activeDomain ? (
          <span>
            <strong>{DOMAIN_LABELS[activeDomain]}</strong> ({activeColors?.word}):{' '}
            {summaries[activeDomain] || 'No abnormal signals recorded.'}
          </span>
        ) : (
          <span className="text-ink-soft">Select or hover a body region</span>
        )}
      </div>

      {/* SVG Body Map (exact geometry per DESIGN.md section 5) */}
      <div className="relative w-full max-w-[240px] aspect-[200/420]">
        <svg
          viewBox="0 0 200 420"
          className="w-full h-full drop-shadow-sm"
          role="group"
          aria-label="Body map"
        >
          {/* Head -> behavioral */}
          <g {...getRegionProps('behavioral', 'Head')}>
            <circle cx="100" cy="38" r="26" />
          </g>

          {/* Chest -> cardiovascular */}
          <g {...getRegionProps('cardiovascular', 'Chest')}>
            <rect x="66" y="76" width="68" height="56" rx="20" />
          </g>

          {/* Abdomen -> metabolic_general */}
          <g {...getRegionProps('metabolic_general', 'Abdomen')}>
            <rect x="70" y="136" width="60" height="52" rx="18" />
          </g>

          {/* Left arm -> physical_performance */}
          <g {...getRegionProps('physical_performance', 'Left arm')}>
            <rect x="38" y="80" width="20" height="110" rx="10" />
          </g>

          {/* Right arm -> physical_performance */}
          <g {...getRegionProps('physical_performance', 'Right arm')}>
            <rect x="142" y="80" width="20" height="110" rx="10" />
          </g>

          {/* Left leg -> physical_performance */}
          <g {...getRegionProps('physical_performance', 'Left leg')}>
            <rect x="72" y="196" width="26" height="150" rx="12" />
          </g>

          {/* Right leg -> physical_performance */}
          <g {...getRegionProps('physical_performance', 'Right leg')}>
            <rect x="102" y="196" width="26" height="150" rx="12" />
          </g>

          {/* Sleep badge -> sleep_recovery */}
          <g {...getRegionProps('sleep_recovery', 'Sleep badge')}>
            <circle cx="160" cy="40" r="14" />
            <foreignObject x="150" y="30" width="20" height="20" className="pointer-events-none">
              <div className="w-full h-full flex items-center justify-center text-ink-soft">
                <MoonCrescentIcon className="w-3.5 h-3.5" />
              </div>
            </foreignObject>
          </g>

          {/* Radiation badge -> radiation */}
          <g {...getRegionProps('radiation', 'Radiation badge')}>
            <circle cx="40" cy="40" r="14" />
            <foreignObject x="30" y="30" width="20" height="20" className="pointer-events-none">
              <div className="w-full h-full flex items-center justify-center text-ink-soft">
                <RadiationIcon className="w-3.5 h-3.5" />
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      {/* Legend row of the 5 status chips under the figure */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3 pt-2 border-t border-line text-xs w-full">
        <StatusChip status="ok" />
        <StatusChip status="info" />
        <StatusChip status="watch" />
        <StatusChip status="review" />
        <StatusChip status="urgent" />
      </div>
    </div>
  );
}
