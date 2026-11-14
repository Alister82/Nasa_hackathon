import React from 'react';

/* ─── NASA "meatball" logo (inline SVG) ─── */
export function NasaLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="NASA" role="img">
      <circle cx="50" cy="50" r="50" fill="#0B3D91" />
      <text
        x="50" y="58"
        textAnchor="middle"
        fontSize="28"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fill="white"
        letterSpacing="1"
      >NASA</text>
    </svg>
  );
}

/* ─── Sidebar icons (inline SVG, 20px nominal) ─── */
function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const DashboardIcon = () => <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />;
export const HealthIcon    = () => <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />;
export const LabIcon       = () => <Icon d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />;
export const JournalIcon   = () => <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />;
export const MissionIcon   = () => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
export const ProofIcon     = () => <Icon d="M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 0-2-2V5a2 2 0 0 1 2-2h11" />;
export const AboutIcon     = () => <Icon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8h.01 M12 12v4" />;
export const CheckInIcon   = () => <Icon d="M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />;
export const UrgentIcon    = () => <Icon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />;
export const ChevronRight  = () => <Icon d="M9 18l6-6-6-6" size={16} />;
export const OfflineIcon   = () => <Icon d="M1 1l22 22 M16.72 11.06A10.94 10.94 0 0 1 19 12.55 M5 12.55a10.94 10.94 0 0 1 5.17-2.39 M10.71 5.05A16 16 0 0 1 22.56 9 M1.42 9a15.91 15.91 0 0 1 4.7-2.88 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01" size={16} />;
export const OnlineIcon    = () => <Icon d="M5 12.55a11 11 0 0 1 14.08 0 M1.42 9a16 16 0 0 1 21.16 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01" size={16} />;

/* ─── Status indicator dot ─── */
export function StatusDot({ status, size = 8 }: { status: 'ok' | 'watch' | 'review' | 'urgent'; size?: number }) {
  const colors = {
    ok:     'bg-status-ok',
    watch:  'bg-status-watch',
    review: 'bg-status-review',
    urgent: 'bg-status-urgent',
  };
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${colors[status]}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/* ─── Status chip — pill badge ─── */
export function StatusPill({ status, label }: { status: 'ok' | 'watch' | 'review' | 'urgent' | 'info'; label?: string }) {
  const configs = {
    ok:     { text: label ?? 'Normal',   cls: 'text-status-ok bg-status-ok/10 ring-status-ok/20' },
    watch:  { text: label ?? 'Watch',    cls: 'text-status-watch bg-status-watch/10 ring-status-watch/20' },
    review: { text: label ?? 'Review',   cls: 'text-status-review bg-status-review/10 ring-status-review/20' },
    urgent: { text: label ?? 'Urgent',   cls: 'text-status-urgent bg-status-urgent/10 ring-status-urgent/20' },
    info:   { text: label ?? 'Info',     cls: 'text-status-info bg-status-info/10 ring-status-info/20' },
  };
  const cfg = configs[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-xs font-semibold ring-1 ring-inset ${cfg.cls}`}>
      <StatusDot status={status === 'info' ? 'ok' : status} size={6} />
      {cfg.text}
    </span>
  );
}

/* ─── Offline / Online badge ─── */
export function OfflineBadge() {
  const [offline, setOffline] = React.useState(!navigator.onLine);
  React.useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!offline) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-ok">
      <span className="inline-block w-2 h-2 rounded-full bg-status-ok" aria-hidden="true" />
      Online
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-watch">
      <span className="inline-block w-2 h-2 rounded-full bg-status-watch animate-pulse" aria-hidden="true" />
      Offline
    </span>
  );
}

/* ─── Disclaimer banner ─── */
export function DisclaimerBanner() {
  return (
    <div
      role="banner"
      className="w-full bg-accent-soft border-b border-accent-soft-2 px-4 py-2 text-center text-xs font-medium text-accent"
      aria-label="Simulated data disclaimer"
    >
      Simulated crew data — Decision support only, not a medical device
    </div>
  );
}

