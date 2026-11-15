import React, { useId } from 'react';
import { cn } from '@/ui/lib/format';

export interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
  fill?: boolean;
  ariaLabel?: string;
  strokeWidth?: number;
}

function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  const smoothing = 0.18;
  const line = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    length: Math.hypot(b.x - a.x, b.y - a.y),
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  });
  const controlPoint = (
    current: { x: number; y: number },
    previous: { x: number; y: number } | undefined,
    next: { x: number; y: number } | undefined,
    reverse?: boolean,
  ) => {
    const p = previous ?? current;
    const n = next ?? current;
    const o = line(p, n);
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;
    return { x: current.x + Math.cos(angle) * length, y: current.y + Math.sin(angle) * length };
  };

  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i]!;
    const next = points[i + 1]!;
    const cps = controlPoint(current, points[i - 1], next);
    const cpe = controlPoint(next, current, points[i + 2], true);
    d += ` C ${cps.x} ${cps.y}, ${cpe.x} ${cpe.y}, ${next.x} ${next.y}`;
  }
  return d;
}

/** Crisp, dependency-free sparkline used across metric tiles. */
export function Sparkline({
  values,
  color = 'var(--instrument)',
  height = 40,
  className,
  fill = true,
  ariaLabel,
  strokeWidth = 1.9,
}: SparklineProps) {
  const gradientId = useId().replace(/:/g, '');
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length < 2) {
    return <div className={cn('h-10 w-full rounded-lg bg-surface3/70', className)} aria-hidden="true" />;
  }

  const width = 160;
  const pad = 3;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const points = clean.map((value, index) => ({
    x: pad + (index / (clean.length - 1)) * (width - pad * 2),
    y: pad + (1 - (value - min) / range) * (height - pad * 2),
  }));
  const path = smoothPath(points);
  const area = `${path} L ${points[points.length - 1]!.x} ${height} L ${points[0]!.x} ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('block w-full', className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel ?? 'Recent trend'}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export interface RingGaugeProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function RingGauge({
  value,
  max = 100,
  size = 66,
  stroke = 5,
  color = 'var(--instrument)',
  trackColor = 'rgba(220,230,242,0.85)',
  label,
  sublabel,
  className,
  ariaLabel,
}: RingGaugeProps) {
  const clamped = Math.max(0, Math.min(max, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / max);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="img"
      aria-label={ariaLabel ?? `${Math.round((clamped / max) * 100)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,0.85,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {label && <span className="font-display text-[0.9rem] font-extrabold tabular-nums text-ink">{label}</span>}
        {sublabel && <span className="mt-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">{sublabel}</span>}
      </div>
    </div>
  );
}
