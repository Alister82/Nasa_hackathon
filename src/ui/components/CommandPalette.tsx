import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight, Activity, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { INDICATORS } from '@/contracts/indicators';
import type { IndicatorId } from '@/contracts/types';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Indicator' | 'Action';
  title: string;
  subtitle?: string;
  action: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Dashboard / Today',
        subtitle: 'Main health situation and flight deck summary',
        action: () => {
          navigate('/');
          onClose();
        },
      },
      {
        id: 'nav-check',
        category: 'Navigation',
        title: 'Daily Check',
        subtitle: 'Guided morning health & wellbeing routine',
        action: () => {
          navigate('/check');
          onClose();
        },
      },
      {
        id: 'nav-monitor',
        category: 'Navigation',
        title: 'Health Monitor',
        subtitle: 'Detailed telemetry vitals, trends, and reports',
        action: () => {
          navigate('/monitor');
          onClose();
        },
      },
      {
        id: 'nav-lab',
        category: 'Navigation',
        title: 'Scenario Lab',
        subtitle: 'Compare detection algorithms across simulated crew scenarios',
        action: () => {
          navigate('/lab');
          onClose();
        },
      },
      {
        id: 'nav-verification',
        category: 'Navigation',
        title: 'Statistical Verification',
        subtitle: '600-crew benchmark results, false alarm rates, and detection delays',
        action: () => {
          navigate('/verification');
          onClose();
        },
      },
      {
        id: 'nav-reports',
        category: 'Navigation',
        title: 'Flight-Surgeon Handover Reports',
        subtitle: 'Generate structured store-and-forward telemetry packages',
        action: () => {
          navigate('/reports');
          onClose();
        },
      },
      {
        id: 'nav-ground',
        category: 'Navigation',
        title: 'Ground Console (Simulated)',
        subtitle: 'Crew-wide medical telemetry overview for flight surgeons',
        action: () => {
          navigate('/ground');
          onClose();
        },
      },
      {
        id: 'nav-journal',
        category: 'Navigation',
        title: 'Investigation Journal',
        subtitle: 'Track logged actions and follow-up evaluation results',
        action: () => {
          navigate('/journal');
          onClose();
        },
      },
      {
        id: 'nav-mission',
        category: 'Navigation',
        title: 'Mission Settings',
        subtitle: 'Configure communication delay setting and onboard supplies',
        action: () => {
          navigate('/mission');
          onClose();
        },
      },
      {
        id: 'nav-urgent',
        category: 'Navigation',
        title: 'Urgent Help Protocol',
        subtitle: 'Immediate medical emergency guidelines and mission escalation',
        action: () => {
          navigate('/urgent');
          onClose();
        },
      },
    ];

    // Add indicator items
    INDICATORS.forEach((meta) => {
      list.push({
        id: `ind-${meta.id}`,
        category: 'Indicator',
        title: meta.label,
        subtitle: `${meta.domain.replace('_', ' ')} · Reference: ${meta.unit}`,
        action: () => {
          navigate(`/domain/${meta.domain}`);
          onClose();
        },
      });
    });

    // Add common action queries
    list.push(
      {
        id: 'act-rest',
        category: 'Action',
        title: 'Procedure: 5-Minute Seated Rest Repeat',
        subtitle: 'Repeat cardiovascular vitals after seated relaxation',
        action: () => {
          navigate('/');
          onClose();
        },
      },
      {
        id: 'act-breathe',
        category: 'Action',
        title: 'Procedure: 4s/6s Guided Breathing Pacer',
        subtitle: 'Engage parasympathetic calming sequence (2 minutes)',
        action: () => {
          navigate('/check');
          onClose();
        },
      },
    );

    return list;
  }, [navigate, onClose]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8);
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)),
    );
  }, [items, query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) selected.action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="glass-surface-strong rounded-panel w-full max-w-xl border border-glass-border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
          <Search className="w-5 h-5 text-ink-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search metrics, procedures, or navigate..."
            className="flex-1 bg-transparent text-ink placeholder:text-ink-muted text-sm sm:text-base outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink rounded-input min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-line/20">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-muted">
              No matching commands or telemetry items found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-sheet flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-instrument/15 text-instrument' : 'text-ink hover:bg-line/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.category === 'Navigation' && <ArrowRight className="w-4 h-4 text-ink-muted flex-shrink-0" />}
                    {item.category === 'Indicator' && <Activity className="w-4 h-4 text-instrument flex-shrink-0" />}
                    {item.category === 'Action' && <ShieldAlert className="w-4 h-4 text-status-review flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-ink-muted truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-muted flex-shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-line text-[11px] text-ink-muted flex items-center justify-between select-none">
          <span>Navigation: <kbd className="font-mono bg-line/30 px-1 py-0.5 rounded">↑</kbd> <kbd className="font-mono bg-line/30 px-1 py-0.5 rounded">↓</kbd></span>
          <span>Select: <kbd className="font-mono bg-line/30 px-1 py-0.5 rounded">Enter</kbd></span>
          <span>Close: <kbd className="font-mono bg-line/30 px-1 py-0.5 rounded">Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}
