import React, { useState } from 'react';
import type { DomainId, IndicatorStatus, DomainAnalysis } from '@/contracts/types';
import { DOMAIN_LABELS } from '@/contracts/indicators';
import { Moon, Radio, Heart, Brain, Activity, Thermometer } from 'lucide-react';

export type BodyHotspotStatus = IndicatorStatus | 'review' | 'urgent';

export interface BodyFigureProps {
  domains: Record<DomainId, DomainAnalysis>;
  summaries: Record<DomainId, string>;
  selected?: DomainId | null;
  onSelect: (domainId: DomainId) => void;
  className?: string;
}

const DOMAIN_ICONS: Record<DomainId, React.ComponentType<{ className?: string }>> = {
  cardiovascular: Heart,
  sleep_recovery: Moon,
  physical_performance: Activity,
  behavioral: Brain,
  metabolic_general: Thermometer,
  radiation: Radio,
};

const STATUS_COLOR_CONFIG: Record<
  'ok' | 'watch' | 'flagged' | 'review' | 'urgent',
  { word: string; ringColor: string; glowColor: string }
> = {
  ok: { word: 'Steady', ringColor: 'var(--status-ok)', glowColor: 'rgba(19, 122, 90, 0.4)' },
  watch: { word: 'Watch', ringColor: 'var(--status-watch)', glowColor: 'rgba(138, 90, 0, 0.5)' },
  flagged: { word: 'Review', ringColor: 'var(--status-review)', glowColor: 'rgba(180, 56, 11, 0.6)' },
  review: { word: 'Review', ringColor: 'var(--status-review)', glowColor: 'rgba(180, 56, 11, 0.6)' },
  urgent: { word: 'Urgent', ringColor: 'var(--status-urgent)', glowColor: 'rgba(166, 27, 27, 0.7)' },
};

export function BodyFigure({
  domains,
  summaries,
  selected,
  onSelect,
  className = '',
}: BodyFigureProps) {
  const [hoveredDomain, setHoveredDomain] = useState<DomainId | null>(null);

  const activeDomain = hoveredDomain ?? selected;
  const activeStatus = activeDomain ? (domains[activeDomain]?.status ?? 'ok') : null;
  const activeConfig = activeStatus ? STATUS_COLOR_CONFIG[activeStatus] : null;

  const renderHotspot = (
    domainId: DomainId,
    cx: number,
    cy: number,
    r: number,
    label: string,
  ) => {
    const analysis = domains[domainId];
    const status: IndicatorStatus = analysis?.status ?? 'ok';
    const cfg = STATUS_COLOR_CONFIG[status] ?? STATUS_COLOR_CONFIG.ok;
    const isSelected = selected === domainId;
    const isHovered = hoveredDomain === domainId;
    const isElevated = status === 'flagged';
    const IconComponent = DOMAIN_ICONS[domainId];

    return (
      <g
        key={domainId}
        role="button"
        tabIndex={0}
        aria-label={`${label}, ${cfg.word}. ${summaries[domainId] || ''}`}
        onClick={() => onSelect(domainId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(domainId);
          }
        }}
        onMouseEnter={() => setHoveredDomain(domainId)}
        onMouseLeave={() => setHoveredDomain(null)}
        onFocus={() => setHoveredDomain(domainId)}
        onBlur={() => setHoveredDomain(null)}
        className="cursor-pointer outline-none group"
      >
        {/* Pulsing outer aura if review or urgent */}
        {isElevated && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 8}
            fill="none"
            stroke={cfg.ringColor}
            strokeWidth="2"
            opacity="0.6"
            className="animate-ping"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        )}

        {/* Glow halo */}
        <circle
          cx={cx}
          cy={cy}
          r={r + (isSelected || isHovered ? 6 : 3)}
          fill={cfg.glowColor}
          className="transition-all duration-300"
        />

        {/* Outer Ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="var(--panel-solid)"
          stroke={isSelected ? 'var(--instrument)' : cfg.ringColor}
          strokeWidth={isSelected ? '3' : '2'}
          className="transition-all duration-200"
        />

        {/* Center icon in foreignObject */}
        <foreignObject
          x={cx - 9}
          y={cy - 9}
          width="18"
          height="18"
          className="pointer-events-none"
        >
          <div className="w-full h-full flex items-center justify-center" style={{ color: cfg.ringColor }}>
            <IconComponent className="w-3.5 h-3.5" />
          </div>
        </foreignObject>

        {/* Invisible enlarged hit target (minimum 44px) */}
        <circle cx={cx} cy={cy} r="24" fill="transparent" />
      </g>
    );
  };

  return (
    <div className={`flex flex-col items-center select-none w-full ${className}`}>
      {/* Active Domain Tooltip / Feedback Bar */}
      <div
        className="h-11 text-xs sm:text-sm text-center flex items-center justify-center font-medium px-3 py-1.5 mb-3 glass-surface rounded-sheet border border-line w-full max-w-[320px] transition-all"
        aria-live="polite"
      >
        {activeDomain ? (
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-ink">{DOMAIN_LABELS[activeDomain]}</span>
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{
                backgroundColor: activeConfig?.glowColor,
                color: activeConfig?.ringColor,
              }}
            >
              {activeConfig?.word}
            </span>
            <span className="text-ink-soft truncate hidden sm:inline">
              — {summaries[activeDomain] || 'No active drift'}
            </span>
          </div>
        ) : (
          <span className="text-ink-muted">Select or hover a physiological region</span>
        )}
      </div>

      {/* Anatomical Silhouette SVG */}
      <div className="relative w-full max-w-[260px] aspect-[200/400]">
        <svg
          viewBox="0 0 200 400"
          className="w-full h-full drop-shadow-md overflow-visible"
          role="group"
          aria-label="Interactive anatomical body figure"
        >
          <defs>
            {/* Body silhouette gradient */}
            <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.30" />
              <stop offset="50%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.35" />
            </linearGradient>

            {/* Coordinate grid pattern */}
            <pattern id="techGrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="var(--line)" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Coordinate grid backdrop circle */}
          <circle cx="100" cy="190" r="140" fill="url(#techGrid)" opacity="0.3" />

          {/* Smooth anatomical human silhouette */}
          <g fill="url(#bodyGradient)" stroke="var(--instrument)" strokeWidth="1.2" strokeOpacity="0.5">
            {/* Head */}
            <ellipse cx="100" cy="46" rx="20" ry="24" />
            {/* Neck */}
            <path d="M 94 68 L 94 80 L 106 80 L 106 68 Z" />
            {/* Torso & Shoulders */}
            <path
              d="M 64 92 
                 C 74 84, 88 82, 100 82 
                 C 112 82, 126 84, 136 92
                 C 142 98, 140 120, 136 150
                 C 134 165, 126 182, 122 195
                 C 118 208, 114 212, 100 212
                 C 86 212, 82 208, 78 195
                 C 74 182, 66 165, 64 150
                 C 60 120, 58 98, 64 92 Z"
            />
            {/* Left Arm */}
            <path
              d="M 62 94 
                 C 54 105, 46 128, 44 155
                 C 42 175, 40 200, 42 215
                 C 43 220, 48 220, 50 215
                 C 52 198, 54 175, 56 155
                 C 58 135, 62 118, 66 102 Z"
            />
            {/* Right Arm */}
            <path
              d="M 138 94 
                 C 146 105, 154 128, 156 155
                 C 158 175, 160 200, 158 215
                 C 157 220, 152 220, 150 215
                 C 148 198, 146 175, 144 155
                 C 142 135, 138 118, 134 102 Z"
            />
            {/* Left Leg */}
            <path
              d="M 80 212 
                 C 78 230, 76 265, 75 295
                 C 74 320, 72 355, 70 375
                 C 69 380, 77 382, 82 380
                 C 86 360, 88 325, 90 295
                 C 92 265, 94 235, 96 212 Z"
            />
            {/* Right Leg */}
            <path
              d="M 120 212 
                 C 122 230, 124 265, 125 295
                 C 126 320, 128 355, 130 375
                 C 131 380, 123 382, 118 380
                 C 114 360, 112 325, 110 295
                 C 108 265, 106 235, 104 212 Z"
            />
          </g>

          {/* Technical alignment coordinate lines */}
          <line x1="30" y1="126" x2="170" y2="126" stroke="var(--line)" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.5" />
          <line x1="30" y1="172" x2="170" y2="172" stroke="var(--line)" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.5" />
          <line x1="100" y1="20" x2="100" y2="380" stroke="var(--line)" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.4" />

          {/* Interactive Domain Hotspots */}
          {/* 1. Head: Mood & stress */}
          {renderHotspot('behavioral', 100, 46, 14, 'Head: Mood and stress')}

          {/* 2. Chest: Heart & blood pressure */}
          {renderHotspot('cardiovascular', 100, 126, 15, 'Chest: Heart and blood pressure')}

          {/* 3. Abdomen: Temperature & blood sugar */}
          {renderHotspot('metabolic_general', 100, 172, 14, 'Abdomen: Temperature and blood sugar')}

          {/* 4. Extremities: Exercise & strength */}
          {renderHotspot('physical_performance', 100, 275, 14, 'Limbs: Exercise and strength')}

          {/* 5. Sleep & Recovery Badge (Top right) */}
          {renderHotspot('sleep_recovery', 162, 50, 14, 'Sleep and recovery')}

          {/* 6. Radiation Badge (Top left) */}
          {renderHotspot('radiation', 38, 50, 14, 'Radiation exposure')}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[11px] text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-status-ok" /> Steady
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-status-watch" /> Watch
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-status-review" /> Review
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-status-urgent" /> Urgent
        </span>
      </div>
    </div>
  );
}
