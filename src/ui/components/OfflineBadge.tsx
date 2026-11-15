import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/ui/lib/format';

export interface OfflineBadgeProps {
  compact?: boolean;
  className?: string;
}

export function OfflineBadge({ compact = false, className }: OfflineBadgeProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold transition-colors',
        isOnline
          ? 'border-line bg-white/70 text-ink-soft'
          : 'border-status-watch/25 bg-status-watch-soft text-status-watch',
        className,
      )}
      aria-live="polite"
      title={isOnline ? 'Connected' : 'Offline — all local features remain available'}
    >
      <span
        className={cn(
          'relative flex h-1.5 w-1.5 rounded-full',
          isOnline ? 'bg-status-ok' : 'bg-status-watch',
        )}
        aria-hidden="true"
      >
        {isOnline && <span className="absolute inset-0 animate-ping rounded-full bg-status-ok/40" />}
      </span>
      {isOnline ? <Wifi className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> : <WifiOff className="h-3 w-3" strokeWidth={2} aria-hidden="true" />}
      <span>{compact ? (isOnline ? 'Online' : 'Offline') : isOnline ? 'Online' : 'Offline: everything still works'}</span>
    </span>
  );
}
