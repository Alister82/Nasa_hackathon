import React from 'react';
import type { DisplayStatus } from './StatusPill';

export interface SparklineProps {
  values: (number | null)[];
  width?: number;
  height?: number;
  baseline?: number;
  status?: DisplayStatus;
  className?: string;
}

export function Sparkline({
  values,
  width = 110,
  height = 34,
  baseline,
  status = 'ok',
  className = '',
}: SparklineProps) {
  const validValues = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (validValues.length === 0) {
    return (
      <div
        className={`inline-flex items-center justify-center text-[10px] text-ink-muted italic ${className}`}
        style={{ width, height }}
      >
        No recent data
      </div>
    );
  }

  const allNumbers = baseline !== undefined ? [...validValues, baseline] : validValues;
  const min = Math.min(...allNumbers);
  const max = Math.max(...allNumbers);
  const range = max - min || 1;
  const paddingY = 4;
  const paddingX = 2;
  const drawHeight = height - paddingY * 2;
  const drawWidth = width - paddingX * 2;

  const getY = (val: number) => height - paddingY - ((val - min) / range) * drawHeight;
  const getX = (index: number) =>
    paddingX + (index / Math.max(1, values.length - 1)) * drawWidth;

  // Build segments separating on nulls
  const segments: { x: number; y: number }[][] = [];
  let currentSegment: { x: number; y: number }[] = [];

  values.forEach((v, idx) => {
    if (v !== null && Number.isFinite(v)) {
      currentSegment.push({ x: getX(idx), y: getY(v) });
    } else {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
  });
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  const strokeColorByStatus: Record<string, string> = {
    ok: 'var(--status-ok)',
    info: 'var(--status-info)',
    watch: 'var(--status-watch)',
    review: 'var(--status-review)',
    flagged: 'var(--status-review)',
    urgent: 'var(--status-urgent)',
  };

  const strokeColor = strokeColorByStatus[status] ?? 'var(--instrument)';
  const uniqueId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Baseline reference line */}
      {baseline !== undefined && (
        <line
          x1={paddingX}
          y1={getY(baseline)}
          x2={width - paddingX}
          y2={getY(baseline)}
          stroke="var(--line)"
          strokeDasharray="2 3"
          strokeWidth="1"
        />
      )}

      {/* Gradient area under segments */}
      {segments.map((seg, sIdx) => {
        if (seg.length < 2) return null;
        const first = seg[0]!;
        const last = seg[seg.length - 1]!;
        const linePath = seg.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
        const areaPath = `${linePath} L ${last.x.toFixed(1)} ${height - paddingY} L ${first.x.toFixed(1)} ${height - paddingY} Z`;
        return <path key={`area-${sIdx}`} d={areaPath} fill={`url(#${uniqueId})`} />;
      })}

      {/* Main line segments */}
      {segments.map((seg, sIdx) => {
        const linePath = seg.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
        return (
          <path
            key={`line-${sIdx}`}
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {/* End point dot */}
      {segments.length > 0 && segments[segments.length - 1]!.length > 0 && (
        (() => {
          const lastPt = segments[segments.length - 1]!.slice(-1)[0]!;
          return (
            <circle
              cx={lastPt.x}
              cy={lastPt.y}
              r="2.5"
              fill={strokeColor}
              stroke="var(--panel-solid)"
              strokeWidth="1.5"
            />
          );
        })()
      )}
    </svg>
  );
}
