import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CornerDownLeft,
  FlaskConical,
  LayoutDashboard,
  LifeBuoy,
  MoonStar,
  NotebookPen,
  Search,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DomainId, IndicatorId } from '@/contracts/types';
import { DOMAIN_LABELS, INDICATORS } from '@/contracts/indicators';
import { cn } from '@/ui/lib/format';

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  group: 'Pages' | 'Health domains' | 'Measurements' | 'Actions';
  icon: LucideIcon;
  path: string;
  keywords: string;
}

const PAGE_ITEMS: PaletteItem[] = [
  { id: 'page-dashboard', label: 'Dashboard', hint: 'Mission health overview', group: 'Pages', icon: LayoutDashboard, path: '/', keywords: 'today home overview body' },
  { id: 'page-monitor', label: 'Health Monitor', hint: 'Log measurements and trends', group: 'Pages', icon: Activity, path: '/log', keywords: 'vitals log measure trends report' },
  { id: 'page-lab', label: 'Scenario Lab', hint: 'Run detection experiments', group: 'Pages', icon: FlaskConical, path: '/lab', keywords: 'simulation scenario seed algorithm detect' },
  { id: 'page-proof', label: 'Verification', hint: 'Algorithm performance evidence', group: 'Pages', icon: ShieldCheck, path: '/proof', keywords: 'proof validation results harness metrics' },
  { id: 'page-journal', label: 'Investigation Journal', hint: 'Observations and actions', group: 'Pages', icon: NotebookPen, path: '/journal', keywords: 'log note review flight surgeon' },
  { id: 'page-mission', label: 'Mission Settings', hint: 'Setting, delay, supplies', group: 'Pages', icon: Settings2, path: '/mission', keywords: 'mission configuration supplies equipment' },
  { id: 'page-help', label: 'Help & Support', hint: 'FAQ and emergency routes', group: 'Pages', icon: LifeBuoy, path: '/help', keywords: 'support faq emergency help' },
];

const ACTION_ITEMS: PaletteItem[] = [
  { id: 'action-log', label: 'Log measurements', hint: 'Enter today’s readings', group: 'Actions', icon: Activity, path: '/log', keywords: 'record entry vitals' },
  { id: 'action-checkin', label: 'Start wellbeing check-in', hint: 'Mood, stress, energy', group: 'Actions', icon: MoonStar, path: '/checkin', keywords: 'check in wellbeing mood stress energy' },
  { id: 'action-urgent', label: 'Emergency support', hint: 'Get help now', group: 'Actions', icon: TriangleAlert, path: '/urgent', keywords: 'urgent emergency medical help' },
  { id: 'action-about', label: 'About Vigil', hint: 'Scope, limits, risk coverage', group: 'Pages', icon: LifeBuoy, path: '/about', keywords: 'about limits sources nasa risk' },
];

const DOMAIN_ITEMS: PaletteItem[] = (Object.keys(DOMAIN_LABELS) as DomainId[]).map((domain) => ({
  id: `domain-${domain}`,
  label: DOMAIN_LABELS[domain],
  hint: 'Open domain evidence and charts',
  group: 'Health domains',
  icon: Activity,
  path: `/domain/${domain}`,
  keywords: `domain ${domain.replace('_', ' ')}`,
}));

const INDICATOR_ITEMS: PaletteItem[] = INDICATORS.map((indicator) => ({
  id: `indicator-${indicator.id}`,
  label: indicator.label,
  hint: `${indicator.unit} · open ${DOMAIN_LABELS[indicator.domain]}`,
  group: 'Measurements',
  icon: Activity,
  path: `/domain/${indicator.domain}`,
  keywords: `${indicator.id} ${indicator.label} ${indicator.unit}`,
}));

const ALL_ITEMS = [...PAGE_ITEMS, ...ACTION_ITEMS, ...DOMAIN_ITEMS, ...INDICATOR_ITEMS];

function matches(item: PaletteItem, query: string): boolean {
  if (!query) return true;
  const haystack = `${item.label} ${item.hint} ${item.keywords}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => ALL_ITEMS.filter((item) => matches(item, query)).slice(0, 18), [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const select = (item: PaletteItem | undefined) => {
    if (!item) return;
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(results.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(results[active]);
    }
  };

  const grouped = results.reduce<Record<string, PaletteItem[]>>((groups, item) => {
    const list = groups[item.group] ?? [];
    list.push(item);
    groups[item.group] = list;
    return groups;
  }, {});

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[#0a1a31]/35 px-4 pt-[10vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Vigil"
        className="w-full max-w-[620px] overflow-hidden rounded-[22px] border border-white/80 bg-white/95 shadow-[0_40px_120px_-30px_rgba(10,32,62,0.55)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-[18px] w-[18px] text-ink-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search metrics, alerts, or procedures…"
            className="min-w-0 flex-1 bg-transparent py-1 text-[0.9rem] font-medium text-ink placeholder:text-ink-faint focus:outline-none"
            aria-label="Search metrics, alerts, or procedures"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-faint hover:bg-surface3 hover:text-ink"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scroll-thin max-h-[56vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No matching screens or measures</p>
              <p className="mt-1 text-xs text-ink-soft">Try “blood pressure”, “sleep”, “journal”, or “scenario”.</p>
            </div>
          )}

          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1.5">
              <p className="px-3 pb-1 pt-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-faint">{group}</p>
              {items.map((item) => {
                runningIndex += 1;
                const index = runningIndex;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                      index === active ? 'bg-instrument-soft text-ink' : 'text-ink-2 hover:bg-surface2',
                    )}
                    aria-current={index === active ? 'true' : undefined}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border',
                        index === active
                          ? 'border-instrument/20 bg-white text-instrument'
                          : 'border-line bg-white/70 text-ink-soft',
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8rem] font-semibold">{item.label}</span>
                      <span className="block truncate text-[0.66rem] text-ink-soft">{item.hint}</span>
                    </span>
                    {index === active ? (
                      <CornerDownLeft className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-transparent" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-surface2/70 px-4 py-2 text-[0.62rem] text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold">↑</kbd>
            <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold">↓</kbd>
            navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold">↵</kbd>
            open
            <span className="mx-1 text-line-strong">·</span>
            <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
