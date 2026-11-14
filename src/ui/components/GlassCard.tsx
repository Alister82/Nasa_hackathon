import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'interactive';
  glow?: boolean;
  children: React.ReactNode;
}

export function GlassCard({
  variant = 'default',
  glow = false,
  children,
  className = '',
  ...props
}: GlassCardProps) {
  const baseClasses =
    variant === 'strong'
      ? 'glass-surface-strong'
      : 'glass-surface';

  const interactiveClasses =
    variant === 'interactive'
      ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer'
      : '';

  const glowClasses = glow ? 'ring-1 ring-instrument/30 shadow-glow' : '';

  return (
    <div
      className={`rounded-card p-4 sm:p-5 text-ink relative ${baseClasses} ${interactiveClasses} ${glowClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
