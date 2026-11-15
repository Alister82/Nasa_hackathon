/**
 * Vigil Premium — Reusable UI Primitives
 * Phase 1 design system components
 */
import React from 'react';
import { ArrowUpRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/ui/lib/format';

/* ==========================================================================
   Brand mark — V in a blue rounded square
   ========================================================================== */
export function VigilMark({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Vigil mark">
      <defs>
        <linearGradient id="vigil-bg" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4B8CF5" />
          <stop offset="0.55" stopColor="#2869D8" />
          <stop offset="1" stopColor="#123B86" />
        </linearGradient>
        <linearGradient id="vigil-ring" x1="4" y1="24" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DDEBFF" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="1" stopColor="#DDEBFF" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="url(#vigil-bg)" />
      <path d="M4 31.5c8.2-6.4 18.4-9.8 40-9.2" stroke="url(#vigil-ring)" strokeWidth="1.15" fill="none" opacity="0.9" />
      <ellipse cx="24" cy="24" rx="16.5" ry="6.7" transform="rotate(-27 24 24)" stroke="rgba(255,255,255,0.42)" strokeWidth="1.1" fill="none" />
      <circle cx="35.4" cy="16.2" r="2.1" fill="#FFFFFF" />
      <path d="M17.6 15.2 23.9 32l6.4-16.8" stroke="#FFFFFF" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="13.1" cy="32.4" r="1.35" fill="#BFD7FF" opacity="0.9" />
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
  ok:      'bg-[var(--ok-bg)] text-[var(--ok)]',
  watch:   'bg-[var(--watch-bg)] text-[var(--watch)]',
  review:  'bg-[var(--review-bg)] text-[var(--review)]',
  urgent:  'bg-[var(--urgent-bg)] text-[var(--urgent)]',
  blue:    'bg-[var(--blue-soft)] text-[var(--blue-deep)]',
  neutral: 'bg-[var(--bg-surface-3)] text-[var(--text-muted)]',
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
  ok:      'bg-[var(--ok)]',
  watch:   'bg-[var(--watch)]',
  review:  'bg-[var(--review)]',
  urgent:  'bg-[var(--urgent)]',
  blue:    'bg-[var(--blue)]',
  neutral: 'bg-[var(--text-faint)]',
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
        <h1 className="font-display text-[1.6rem] leading-tight font-extrabold tracking-[-0.035em] text-ink sm:text-[1.9rem]">
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
    'bg-[var(--blue)] text-white hover:bg-[var(--blue-deep)] border border-[var(--blue-deep)]',
  secondary:
    'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-surface-2)] hover:border-[var(--border-strong)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] border border-transparent',
  danger:
    'bg-[var(--urgent-bg)] text-[var(--urgent)] border border-[var(--urgent)]/30 hover:bg-[var(--urgent)] hover:text-white',
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
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-[var(--text-primary)] text-white text-[0.65rem] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50"
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
            <span className="font-display text-2xl font-extrabold tabular-nums text-ink">
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
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-soft text-blue">
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
      className={cn('inline-flex items-center gap-1 rounded-xl border border-line bg-surface/70 p-1 shadow-sm backdrop-blur', className)}
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
              'inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-[0.75rem] font-semibold transition-all',
              active
                ? 'bg-surface text-ink shadow-sm ring-1 ring-line'
                : 'text-ink-soft hover:text-ink hover:bg-surface/60',
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
