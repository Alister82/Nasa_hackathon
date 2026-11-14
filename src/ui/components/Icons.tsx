import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  'aria-hidden'?: boolean;
}

export function CheckCircleIcon({ className = 'w-4 h-4', size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M5.5 8l2 2 3.5-3.5" />
    </svg>
  );
}

export function InfoCircleIcon({ className = 'w-4 h-4', size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      <circle cx="8" cy="8" r="6" />
      <line x1="8" y1="7" x2="8" y2="11" />
      <circle cx="8" cy="4.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function EyeIcon({ className = 'w-4 h-4', size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d="M1.5 8s2.5-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5-6.5-4.5-6.5-4.5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

export function FlagIcon({ className = 'w-4 h-4', size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d="M3 2v12M3 3h8l-1.5 3.5L11 10H3" />
    </svg>
  );
}

export function AlertTriangleIcon({ className = 'w-4 h-4', size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d="M8 2.5L1.5 13.5h13L8 2.5z" />
      <line x1="8" y1="6.5" x2="8" y2="9.5" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function MoonCrescentIcon({ className = 'w-4 h-4', size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="none"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d="M13.5 10.2A6 6 0 015.8 2.5 6.5 6.5 0 1013.5 10.2z" />
    </svg>
  );
}

export function RadiationIcon({ className = 'w-4 h-4', size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="none"
      className={className}
      aria-hidden={ariaHidden}
    >
      <circle cx="8" cy="8" r="1.75" />
      <path d="M8 1a7 7 0 00-3.5 1l2 3.46A3 3 0 018 5.25V1z" />
      <path d="M1.93 11.5a7 7 0 003.5 6.06l2-3.46A3 3 0 016.18 12.5l-4.25-1z" />
      <path d="M14.07 11.5l-4.25 1a3 3 0 01-1.25 1.6l2 3.46a7 7 0 003.5-6.06z" />
    </svg>
  );
}
