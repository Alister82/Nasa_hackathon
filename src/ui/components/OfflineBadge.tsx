import React, { useState, useEffect } from 'react';

export interface OfflineBadgeProps {}

export function OfflineBadge(_props: OfflineBadgeProps) {
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-xs font-medium border ${
        isOnline
          ? 'bg-panel text-ink-soft border-line'
          : 'bg-status-watch-soft text-status-watch border-status-watch'
      }`}
      aria-live="polite"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-status-ok' : 'bg-status-watch'
        }`}
        aria-hidden="true"
      />
      <span>{isOnline ? 'Online' : 'Offline: everything still works'}</span>
    </span>
  );
}

