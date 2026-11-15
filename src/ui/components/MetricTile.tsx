import React from 'react';
import {
  Activity,
  Brain,
  Droplets,
  Dumbbell,
  HeartPulse,
  MoonStar,
  Radiation,
  Smile,
  Sparkles,
  Thermometer,
  Zap,
} from '@/ui/components/icons';
import type { IconComponent } from '@/ui/components/icons';
import type { DomainId, IndicatorId } from '@/contracts/types';
import { DOMAIN_LABELS } from '@/contracts/indicators';
import { cn } from '@/ui/lib/format';
import type { MetricSnapshot } from '@/ui/lib/metrics';
import { statusTone } from '@/ui/lib/metrics';
import { Sparkline } from './Sparkline';
import { DeltaBadge } from './ui';

export const DOMAIN_VISUALS: Record<
  DomainId,
  { color: string; soft: string; Icon: IconComponent; short: string }
> = {
  cardiovascular: { color: '#ff3b30', soft: '#ffedec', Icon: HeartPulse, short: 'Cardiovascular' },
  sleep_recovery: { color: '#5856d6', soft: '#eeeefc', Icon: MoonStar, short: 'Sleep' },
  physical_performance: { color: '#1d8a3c', soft: '#e8f7ed', Icon: Dumbbell, short: 'Performance' },
  behavioral: { color: '#a259d4', soft: '#f8edfc', Icon: Brain, short: 'Mood & stress' },
  metabolic_general: { color: '#b25000', soft: '#fff4e5', Icon: Thermometer, short: 'Metabolic' },
  radiation: { color: '#0b7c8e', soft: '#e8f7fa', Icon: Radiation, short: 'Radiation' },
};

const INDICATOR_ICONS: Record<IndicatorId, IconComponent> = {
  heart_rate: HeartPulse,
  bp_sys: Activity,
  bp_dia: Activity,
  body_temp: Thermometer,
  glucose: Droplets,
  sleep_hours: MoonStar,
  exercise_minutes: Dumbbell,
  mood: Smile,
  stress: Brain,
  energy: Zap,
  radiation_dose: Radiation,
};

export function DomainIcon({ domain, className = 'h-4 w-4' }: { domain: DomainId; className?: string }) {
  const Icon = DOMAIN_VISUALS[domain].Icon;
  return <Icon className={className} weight="fill" />;
}

export function IndicatorIcon({ indicator, className = 'h-4 w-4' }: { indicator: IndicatorId; className?: string }) {
  const Icon = INDICATOR_ICONS[indicator] ?? Activity;
  return <Icon className={className} weight="regular" />;
}

export function domainLabel(domain: DomainId): string {
  return DOMAIN_LABELS[domain];
}

const TONE_DOT: Record<'ok' | 'watch' | 'review', string> = {
  ok: 'bg-status-ok',
  watch: 'bg-status-watch',
  review: 'bg-status-review',
};

export interface MetricTileProps {
  snapshot: MetricSnapshot;
  domain: DomainId;
  label: string;
  displayValue?: string;
  displayUnit?: string;
  secondaryValue?: string;
  sparkValues?: number[];
  footer?: React.ReactNode;
  onClick?: () => void;
}

export function MetricTile({
  snapshot,
  domain,
  label,
  displayValue,
  displayUnit,
  secondaryValue,
  sparkValues,
  footer,
  onClick,
}: MetricTileProps) {
  const visual = DOMAIN_VISUALS[domain];
  const Icon = visual.Icon;
  const tone = statusTone(snapshot.status);
  const value = displayValue ?? (snapshot.latest === null ? '—' : snapshot.latest.toFixed(snapshot.meta.decimals));
  const unit = displayUnit ?? (snapshot.meta.unit.startsWith('score') ? '' : snapshot.meta.unit);
  const inverse = snapshot.meta.concernDirection === 'down';

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[9px]"
            style={{ backgroundColor: visual.soft, color: visual.color }}
          >
            <Icon className="h-4 w-4" weight="fill" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.72rem] font-semibold text-ink-2">{label}</p>
            <p className="text-[0.6rem] font-medium uppercase tracking-[0.07em] text-ink-faint">
              {snapshot.lastDay !== null ? `Day ${snapshot.lastDay}` : 'No reading'}
            </p>
          </div>
        </div>
        <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])} title={tone} />
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
          <span className="metric-number text-[1.55rem] leading-none">{value}</span>
          {unit && <span className="pb-0.5 text-[0.68rem] font-semibold text-ink-soft">{unit}</span>}
          {secondaryValue && <span className="pb-0.5 text-[0.95rem] font-semibold text-ink-soft tabular-nums">/ {secondaryValue}</span>}
        </div>
      </div>

      <div className="mt-2 -mb-1">
        <Sparkline
          values={sparkValues ?? snapshot.recent}
          color={visual.color}
          height={38}
          ariaLabel={`${label} recent trend`}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line/70 pt-2">
        <DeltaBadge value={snapshot.deltaPercent} suffix="%" inverse={inverse} />
        <span className="min-w-0 flex-1 truncate text-[0.625rem] font-medium text-ink-soft">
          {footer ?? 'vs pre-flight baseline'}
        </span>
        <span className="hidden shrink-0 text-[0.625rem] font-semibold text-ink-faint tabular-nums sm:inline">
          {snapshot.baseline !== null ? `base ${snapshot.baseline.toFixed(snapshot.meta.decimals)}` : 'pending'}
        </span>
      </div>
    </>
  );

  const className = cn(
    'group relative flex min-w-0 flex-col rounded-[16px] border border-line bg-white p-3.5 text-left shadow-card transition-all duration-200',
    onClick && 'hover:-translate-y-px hover:shadow-float',
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-label={`Open ${label}`}>
        {content}
      </button>
    );
  }
  return <article className={className}>{content}</article>;
}

export function StableBadge({ stable }: { stable: boolean }) {
  return (
    <span className={cn('chip', stable ? 'chip-ok' : 'chip-watch')}>
      <Sparkles className="h-3 w-3" weight="bold" aria-hidden="true" />
      {stable ? 'Within expected range' : 'Needs review'}
    </span>
  );
}
