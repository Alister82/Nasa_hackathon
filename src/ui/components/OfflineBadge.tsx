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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
        isOnline
          ? 'bg-status-ok/10 text-status-ok ring-status-ok/20'
          : 'bg-status-watch/10 text-status-watch ring-status-watch/20'
      }`}
      aria-live="polite"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-status-ok' : 'bg-status-watch animate-pulse'
        }`}
        aria-hidden="true"
      />
      <span>{isOnline ? 'Online' : 'Offline: everything still works'}</span>
    </span>
  );
}
