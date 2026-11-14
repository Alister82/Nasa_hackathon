import React from 'react';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SegmentedTabsProps<T extends string> {
  tabs: TabOption<T>[];
  selected: T;
  onChange: (id: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string>({
  tabs,
  selected,
  onChange,
  className = '',
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex p-1 bg-line/20 backdrop-blur-md rounded-pill border border-line select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isSelected = selected === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-pill transition-all duration-200 min-h-[40px] ${
              isSelected
                ? 'bg-panel-solid text-instrument shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-instrument/15 text-instrument' : 'bg-line/40 text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
