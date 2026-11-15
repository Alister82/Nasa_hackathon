/**
 * Vigil Premium — Reusable UI Primitives
 * Phase 1 design system components
 */
import React from 'react';
import { ArrowUpRight, TrendingDown, TrendingUp, Minus } from '@/ui/components/icons';
import { Link } from 'react-router-dom';
import { cn } from '@/ui/lib/format';

/* ==========================================================================
   Brand mark — white V monogram on a graphite squircle
   ========================================================================== */
export function VigilMark({ className = 'w-10 h-10' }: { className?: string }) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Vigil">
      <defs>
        <linearGradient id={`vigil-base-${uid}`} x1="10" y1="2" x2="38" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A4A4D" />
          <stop offset="0.55" stopColor="#2C2C2E" />
          <stop offset="1" stopColor="#1C1C1E" />
        </linearGradient>
        <linearGradient id={`vigil-sheen-${uid}`} x1="24" y1="1" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="11.5" fill={`url(#vigil-base-${uid})`} />
      <rect x="1" y="1" width="46" height="25" rx="11.5" fill={`url(#vigil-sheen-${uid})`} />
      <rect x="1.5" y="1.5" width="45" height="45" rx="11" fill="none" stroke="#FFFFFF" strokeOpacity="0.12" />
      <path
        d="M15.7 16.4 24 32.2l8.3-15.8"
        stroke="#FFFFFF"
        strokeWidth="3.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ==========================================================================
   Card
   ========================================================================== */
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-surface border border-line rounded-md shadow-sm',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ==========================================================================
   SectionCard — Card with optional header slot
   ========================================================================== */
export interface SectionCardProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({ header, children, className, bodyClassName }: SectionCardProps) {
  return (
    <div className={cn('bg-surface border border-line rounded-md shadow-sm overflow-hidden', className)}>
      {header && (
        <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
          {header}
        </div>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </div>
  );
}

/* ==========================================================================
   Badge — colored pill
   ========================================================================== */
export type BadgeVariant = 'ok' | 'watch' | 'review' | 'urgent' | 'blue' | 'neutral';

const BADGE_STYLES: Record<BadgeVariant, string> = {
  ok:      'bg-[var(--status-ok-soft)] text-[var(--status-ok)]',
  watch:   'bg-[var(--status-watch-soft)] text-[var(--status-watch)]',
  review:  'bg-[var(--status-review-soft)] text-[var(--status-review)]',
  urgent:  'bg-[var(--status-urgent-soft)] text-[var(--status-urgent)]',
  blue:    'bg-[var(--instrument-soft)] text-[#0066cc]',
  neutral: 'bg-[var(--surface-3)] text-[var(--ink-soft)]',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold',
        BADGE_STYLES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ==========================================================================
   StatusDot — colored circle, pulsing for urgent
   ========================================================================== */
export interface StatusDotProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const DOT_COLOR: Record<BadgeVariant, string> = {
  ok:      'bg-[var(--status-ok)]',
  watch:   'bg-[var(--status-watch)]',
  review:  'bg-[var(--status-review)]',
  urgent:  'bg-[var(--status-urgent)]',
  blue:    'bg-[var(--instrument)]',
  neutral: 'bg-[var(--ink-faint)]',
};

export function StatusDot({ variant = 'neutral', size = 'md', className }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  return (
    <span
      className={cn(
        'rounded-full shrink-0 inline-block',
        sizeClass,
        DOT_COLOR[variant],
        variant === 'urgent' && 'animate-pulse',
        className,
      )}
    />
  );
}

/* ==========================================================================
   PageHeader
   ========================================================================== */
export interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ kicker, title, description, meta, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between', className)}>
      <div className="min-w-0">
        {kicker && <p className="section-kicker mb-1.5">{kicker}</p>}
        <h1 className="font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-[1.9rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-soft">{description}</p>
        )}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">{meta}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
      )}
    </header>
  );
}

/* ==========================================================================
   Button — primary / secondary / ghost / danger
   ========================================================================== */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--instrument)] text-white hover:bg-[#0077ed] border border-[var(--instrument)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
  secondary:
    'bg-white text-[var(--ink)] border border-[var(--line-strong)] hover:bg-[var(--surface-3)] shadow-xs',
  ghost:
    'bg-transparent text-[var(--ink-soft)] hover:bg-black/[0.045] hover:text-[var(--ink)] border border-transparent',
  danger:
    'bg-[var(--status-urgent-soft)] text-[var(--status-urgent)] border border-[var(--status-urgent)]/15 hover:bg-[var(--status-urgent)] hover:text-white',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...rest
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs min-h-[36px]' : 'px-4 py-2 text-sm min-h-[44px]';
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors select-none',
        sizeClass,
        BUTTON_STYLES[variant],
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ==========================================================================
   IconButton — square button with just an icon
   ========================================================================== */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, ...rest }: IconButtonProps) {
  const sizeClass = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-colors select-none',
        sizeClass,
        BUTTON_STYLES[variant],
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}

/* ==========================================================================
   Tooltip — simple hover tooltip
   ========================================================================== */
export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn('relative group inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-[var(--ink)] text-white text-[0.65rem] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50"
      >
        {content}
      </span>
    </span>
  );
}

/* ==========================================================================
   Metric — value + unit + label + optional delta
   ========================================================================== */
export interface MetricProps {
  value: number | null;
  unit?: string;
  label: string;
  delta?: number | null;
  deltaInverse?: boolean;
  decimals?: number;
  className?: string;
}

export function Metric({ value, unit, label, delta, deltaInverse = false, decimals = 0, className }: MetricProps) {
  const hasValue = value !== null && Number.isFinite(value ?? NaN);

  let deltaEl: React.ReactNode = null;
  if (delta !== undefined && delta !== null && Number.isFinite(delta)) {
    const rounded = Number(delta.toFixed(1));
    const up = rounded > 0;
    const flat = rounded === 0;
    const good = deltaInverse ? !up : up;
    const cls = flat
      ? 'chip chip-neutral'
      : good
      ? 'chip chip-ok'
      : 'chip chip-review';
    const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
    deltaEl = (
      <span className={cn(cls, 'tabular-nums')}>
        <Icon className="w-3 h-3" />
        {`${up && !flat ? '+' : ''}${rounded}`}
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <p className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-faint">{label}</p>
      <div className="flex items-baseline gap-1.5">
        {hasValue ? (
          <>
            <span className="font-display text-2xl font-semibold tabular-nums text-ink">
              {(value as number).toFixed(decimals)}
            </span>
            {unit && (
              <span className="text-[0.75rem] font-medium text-ink-soft">{unit}</span>
            )}
          </>
        ) : (
          <span className="text-sm text-ink-faint">—</span>
        )}
        {deltaEl}
      </div>
    </div>
  );
}

/* ==========================================================================
   Section heading
   ========================================================================== */
export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, subtitle, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-ink-soft">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   MetaItem
   ========================================================================== */
export function MetaItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-ink-faint">{icon}</span>}
      <span className="text-[0.625rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">{label}</span>
      <span className="text-[0.75rem] font-semibold text-ink">{value}</span>
    </div>
  );
}

/* ==========================================================================
   DeltaBadge
   ========================================================================== */
export function DeltaBadge({
  value,
  suffix = '',
  inverse = false,
  className,
}: {
  value: number | null;
  suffix?: string;
  inverse?: boolean;
  className?: string;
}) {
  if (value === null || !Number.isFinite(value)) {
    return <span className={cn('chip chip-neutral', className)}>No baseline</span>;
  }
  const rounded = Number(value.toFixed(1));
  const up = rounded > 0;
  const flat = rounded === 0;
  const good = inverse ? !up : up;
  const tone = flat ? 'chip-neutral' : good ? 'chip-ok' : 'chip-review';
  return (
    <span className={cn('chip', tone, 'tabular-nums', className)}>
      {!flat && (
        <ArrowUpRight
          className={cn('h-3 w-3', up ? 'rotate-0' : 'rotate-90')}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      )}
      {`${up ? '+' : ''}${rounded}${suffix}`}
    </span>
  );
}

/* ==========================================================================
   EmptyState
   ========================================================================== */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface/55 px-6 py-10 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[12px] bg-instrument-soft text-instrument">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-soft">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ==========================================================================
   SegmentedControl
   ========================================================================== */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-1 rounded-[10px] border border-line bg-surface2 p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex min-h-[44px] items-center gap-1.5 rounded-[8px] px-3 text-[0.75rem] font-semibold transition-all',
              active
                ? 'bg-white text-ink shadow-sm ring-1 ring-black/[0.04]'
                : 'text-ink-soft hover:bg-white/70 hover:text-ink',
            )}
          >
            {option.label}
            {typeof option.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[0.625rem] tabular-nums',
                  active ? 'bg-blue-soft text-blue-deep' : 'bg-s3 text-ink-soft',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   TextLink
   ========================================================================== */
export function TextLink({
  to,
  children,
  className,
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex min-h-[44px] items-center gap-1 text-[0.75rem] font-semibold text-blue transition-colors hover:text-blue-deep',
        className,
      )}
    >
      {children}
      <ArrowUpRight
        className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}
