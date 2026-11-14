import React from 'react';

// ── SectionCard ────────────────────────────────────────────────
export interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}
export function SectionCard({ children, className = '', noPad = false }: SectionCardProps) {
  return (
    <div className={`bg-bg-surface border border-border rounded-2xl ${noPad ? '' : 'p-5'} shadow-xs ${className}`}>
      {children}
    </div>
  );
}

// ── CardHeader ─────────────────────────────────────────────────
export interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
}
export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-base font-bold text-text-primary">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── PageHeader ─────────────────────────────────────────────────
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary font-heading leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// ── MetricCard ─────────────────────────────────────────────────
export interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  status?: 'ok' | 'watch' | 'review' | 'urgent' | 'info';
  trend?: string;
  baseline?: string;
  onClick?: () => void;
}

const STATUS_STRIP: Record<string, string> = {
  ok: 'bg-status-ok',
  watch: 'bg-status-watch',
  review: 'bg-status-review',
  urgent: 'bg-status-urgent',
  info: 'bg-status-info',
};

export function MetricCard({ label, value, unit, status = 'ok', trend, baseline, onClick }: MetricCardProps) {
  const strip = STATUS_STRIP[status] ?? 'bg-status-ok';
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`bg-bg-surface border border-border rounded-2xl p-4 relative overflow-hidden shadow-xs ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${strip}`} aria-hidden="true" />
      <div className="text-xs font-semibold text-text-secondary mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text-primary tabular-nums">{value ?? '—'}</span>
        {unit && <span className="text-sm text-text-secondary">{unit}</span>}
      </div>
      {(trend || baseline) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
          {trend && <span>{trend}</span>}
          {baseline && <span className="text-text-secondary/60">{baseline}</span>}
        </div>
      )}
    </div>
  );
}

// ── SeverityBadge ──────────────────────────────────────────────
export interface SeverityBadgeProps {
  severity: 'info' | 'review' | 'urgent' | 'watch';
}
const SEVERITY_BADGE: Record<string, string> = {
  info: 'bg-status-info/10 text-status-info ring-status-info/20',
  watch: 'bg-status-watch/10 text-status-watch ring-status-watch/20',
  review: 'bg-status-review/10 text-status-review ring-status-review/20',
  urgent: 'bg-status-urgent/10 text-status-urgent ring-status-urgent/20',
};
const SEVERITY_LABEL: Record<string, string> = {
  info: 'Info',
  watch: 'Watch',
  review: 'Review',
  urgent: 'Urgent',
};
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.info}`}>
      {SEVERITY_LABEL[severity] ?? severity}
    </span>
  );
}

// ── EmptyState ─────────────────────────────────────────────────
export interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  title?: string;
  body?: string;
  action?: React.ReactNode;
}
export function EmptyState({ message, icon, title, body, action }: EmptyStateProps) {
  if (title || body || icon || action) {
    return (
      <div className="bg-bg-surface border border-border rounded-2xl p-8 text-center flex flex-col items-center gap-2">
        {icon && <div className="text-3xl mb-1">{icon}</div>}
        {title && <h3 className="text-base font-bold text-text-primary">{title}</h3>}
        {body && <p className="text-xs sm:text-sm text-text-secondary max-w-sm">{body}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-8 text-center text-text-secondary text-sm">
      {message}
    </div>
  );
}

// ── LoadingState ───────────────────────────────────────────────
export interface LoadingStateProps {
  message?: string;
  label?: string;
}
export function LoadingState({ message, label }: LoadingStateProps) {
  return (
    <div className="p-8 text-center text-text-secondary text-sm">
      {label ?? message ?? 'Loading...'}
    </div>
  );
}

// ── PrimaryButton ──────────────────────────────────────────────
export interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}
export function PrimaryButton({ onClick, children, disabled, type = 'button', className = '' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity min-h-[44px] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

// ── OutlineButton ──────────────────────────────────────────────
export interface OutlineButtonProps extends ButtonProps {
  danger?: boolean;
}
export function OutlineButton({ onClick, children, disabled, type = 'button', className = '', danger = false }: OutlineButtonProps) {
  const colorCls = danger
    ? 'border-status-urgent text-status-urgent hover:bg-status-urgent/10'
    : 'border-border text-text-primary hover:bg-bg-app';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 border font-bold text-sm rounded-xl transition-colors min-h-[44px] disabled:opacity-50 ${colorCls} ${className}`}
    >
      {children}
    </button>
  );
}

// ── FormField ──────────────────────────────────────────────────
export function inputCls(error?: boolean) {
  return `w-full bg-bg-surface border ${error ? 'border-status-urgent' : 'border-border'} rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors min-h-[44px]`;
}

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
export function FormField({ id, label, required, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-text-secondary">
        {label}{required && <span className="text-status-urgent ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-status-urgent">{error}</p>}
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────
export function Divider() {
  return <hr className="border-border my-2" />;
}
