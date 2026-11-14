# REDESIGN PLAN: Vigil Flight-Deck Architecture (v2)

**Branch:** `redesign/premium`  
**Base:** `pre-redesign-v1` tag (`5785e40` on `main`)  
**Target:** NASA Space Apps Challenge 2026 — "Create Health Monitoring Software for Astronauts on Space Missions"  
**Design Paradigm:** Avionics Glassmorphism ("Aurora Glass" Light + "Night Cabin" Dark) with interactive clinical workflow tooling.

---

## 1. Visual & Design System Specification

### 1.1 Color Tokens & Gradients
| Token | Aurora Glass (Light Default) | Night Cabin (Dark Avionics) | Semantic Purpose |
|---|---|---|---|
| `--bg-base` | `#EAF1FF` to `#EEF0FB` (diagonal gradient) | `#0A1226` to `#101B3A` (diagonal gradient) | Root viewport background |
| `--blob-blue` | `#8FB4FF` (opacity 0.22, blur 80px) | `#2A4B9B` (opacity 0.28, blur 90px) | Ambient atmospheric glow 1 |
| `--blob-lavender` | `#C7B8FF` (opacity 0.18, blur 80px) | `#5A3EA0` (opacity 0.20, blur 90px) | Ambient atmospheric glow 2 |
| `--glass-bg` | `rgba(255, 255, 255, 0.70)` | `rgba(20, 32, 64, 0.68)` | Surface panels (backdrop blur 20px) |
| `--glass-bg-strong` | `rgba(255, 255, 255, 0.85)` | `rgba(26, 42, 82, 0.85)` | Modals, drawers, command palette |
| `--glass-border` | `rgba(255, 255, 255, 0.75)` | `rgba(255, 255, 255, 0.14)` | Surface highlight rim (1px) |
| `--glass-ring` | `rgba(120, 140, 190, 0.18)` | `rgba(10, 20, 50, 0.50)` | Subtle outer boundary ring (1px) |
| `--ink-primary` | `#0E1A33` | `#E8EEFF` | High-contrast headers and readings |
| `--ink-secondary` | `#475776` | `#A8B6D8` | Descriptive labels and subtext |
| `--ink-muted` | `#7888A6` | `#6A7B9F` | Tertiary units and inactive controls |
| `--primary-gradient` | `linear-gradient(135deg, #2F6BFF, #4D8DFF)` | `linear-gradient(135deg, #3A78FF, #5E9BFF)` | Primary CTA buttons and active nav items |
| `--hairline` | `rgba(40, 70, 140, 0.12)` | `rgba(255, 255, 255, 0.10)` | Dividers and table grid lines |

### 1.2 Status Color Tokens (Always Pair Icon + Text, WCAG AA Compliant)
| Status | Badge Background | Badge Text / Icon | Border | Semantic Word |
|---|---|---|---|---|
| **Steady (`ok`)** | `#DDF5EA` (Dark: `rgba(19, 122, 90, 0.25)`) | `#137A5A` (Dark: `#34D399`) | `rgba(19, 122, 90, 0.3)` | "Steady" |
| **Expected (`info`)** | `#E0ECF8` (Dark: `rgba(43, 93, 138, 0.30)`) | `#2B5D8A` (Dark: `#60A5FA`) | `rgba(43, 93, 138, 0.3)` | "Expected" |
| **Watch (`watch`)** | `#FDEFC9` (Dark: `rgba(138, 90, 0, 0.30)`) | `#8A5A00` (Dark: `#FBBF24`) | `rgba(138, 90, 0, 0.35)` | "Watch" |
| **Review (`review`)** | `#FCE0D2` (Dark: `rgba(180, 56, 11, 0.30)`) | `#B4380B` (Dark: `#FB923C`) | `rgba(180, 56, 11, 0.35)` | "Review" |
| **Urgent (`urgent`)** | `#FADADA` (Dark: `rgba(166, 27, 27, 0.35)`) | `#A61B1B` (Dark: `#F87171`) | `rgba(166, 27, 27, 0.4)` | "Urgent" |

### 1.3 Typography & Sizing
- **Font:** `@fontsource-variable/inter` (bundled locally; no external font networks).
- **Numerals:** `tabular-nums` for all telemetry, timestamps, offsets, timers, and tables.
- **Sizes:**
  - Micro / Units: `12px` (uppercase tracking +0.05em, font-medium)
  - Small / Hints: `13px` / `14px`
  - Body: `15px` / `16px` (line-height 1.5)
  - Subhead: `18px` / `20px` (font-semibold)
  - Section Title: `24px` (font-bold)
  - Telemetry Value Display: `32px` – `40px` (font-extrabold tabular)

---

## 2. Component Kit Inventory (`/dev/kit`)

1. **`GlassCard`**: Foundation container with frosted blur, subtle inset glow, adaptive borders, and optional hover lift.
2. **`MetricTile`**: Displays current reading, unit, delta vs personal baseline chip, 7-day SVG sparkline, and status pill.
3. **`BodyFigure`**: Hand-built anatomical vector SVG with subtle coordinate overlay, glowing status hotspots for all 6 domains, interactive tooltips, and keyboard activation (`Tab`, `Enter`, `Space`).
4. **`RestTimerWidget`**: Live 5-minute seated rest countdown with circular progress indicator, Play/Pause/Reset, audio chime (Web Audio API synthesized beep, no external audio files), and quick-demo fast-forward button.
5. **`BreathingPacerWidget`**: Visual 2-minute paced breathing tool (4s inhale expansion, 6s exhale contraction ring) with synchronized countdown timer.
6. **`DailyCheckWizard`**: 3-step structured routine:
   - Step 1: Vitals (one-click "Pre-fill from simulated wearable stream", tactile `-5/-1/+1/+5` steppers, expandable measurement hints, inline range gauges).
   - Step 2: Wellbeing (sliders with solid tracks, filled progress, thumb bubbles, optional note, breathing pacer link, urgent help button).
   - Step 3: Shift Summary & Immediate Next Action.
7. **`RangeGauge`**: Horizontal SVG indicator showing pre-flight baseline range, plausible range bounds, and current value position without evaluating a fake "health percentage".
8. **`Sparkline`**: Compact 7-day sparkline with missing data gaps, baseline reference line, and subtle gradient area fill.
9. **`StatusPill`**: Unified semantic badge (icon + word + contrast-certified palette).
10. **`CommandPalette`**: Quick navigator (`Ctrl+K` / `Cmd+K`) searching indicators, alert procedures, journal entries, and routes.
11. **`Drawer` & `Toast`**: Animated flyouts (`framer-motion`) with accessibility focus trapping and `prefers-reduced-motion` compliance.

---

## 3. Navigation & Route Architecture

```
/                       -> Dashboard (Situation summary, Metric tiles, BodyFigure, Playback scrubber, Grouped Alert cards)
/monitor                -> Health Monitor (Vitals, Trends, Reports tabs; Indicator detail drawer)
/check                  -> Guided Daily Check Wizard (redirects legacy /log and /checkin)
/lab                    -> Scenario Lab (3-system comparison timeline, CUSUM Accumulator & Persistence Inspector)
/verification           -> Statistical Verification (redirects legacy /proof; 600-crew harness, TP/FP/FN/TN metrics)
/reports                -> Flight-Surgeon Handover Report (Store-and-forward telemetry package generator, PDF/Print, JSON export)
/ground                 -> Ground Console (Simulated multi-crew telemetry overview for ground medical support)
/journal                -> Investigation Journal with Empirical Follow-Up Loop ("Did it help?" tracking)
/mission                -> Settings (Mission setting, onboard supplies toggles, Night cabin theme, Large controls mode, Reset)
/help                   -> Help, Mission FAQ, and 4-step Onboarding Tour
/about                  -> Clinical Limits, verified citations list, and NASA HRP Risk Coverage Map
/urgent                 -> Urgent Protocol Screen (Immediate single-tap access from global top bar, high contrast)
/dev/kit                -> Component Kit Sandbox & Visual Token Verification
```

---

## 4. Contract v2 Diff (`CONTRACT_VERSION = 2`)

### 4.1 Alert Card Grouping & Supporting Signals
```typescript
export interface SupportingSignal {
  indicatorId: IndicatorId;
  status: IndicatorStatus;
  firstFlaggedDay: number;
  evidence: IndicatorPoint[];
}

export interface AlertCard {
  // Existing fields preserved
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  headline: string;
  summary: string;
  domains: DomainId[];
  indicators: IndicatorId[];
  evidenceDayRange: [number, number];
  evidence: Record<IndicatorId, IndicatorPoint[]>;
  actions: string[];
  sources: string[];
  escalation: string;
  // v2 Additions:
  supportingSignals?: SupportingSignal[];
  hasRestTimer?: boolean;
  hasBreathingPacer?: boolean;
}
```

### 4.2 Empirical Follow-Up Loop Engine Interface
```typescript
export type FollowUpResult = 'improving' | 'worsening' | 'unchanged' | 'insufficient_data';

export interface FollowUpEvaluation {
  result: FollowUpResult;
  indicatorId: IndicatorId;
  actionDay: number;
  evaluatedDay: number;
  baselineMean: number;
  postActionMean: number;
  deltaSigma: number;
  disclaimer: string; // "This does not prove that the action caused the change."
}

export function evaluateFollowUp(
  dataset: CrewDataset,
  indicatorIds: IndicatorId[],
  actionDay: number,
  viewDay: number
): Record<IndicatorId, FollowUpEvaluation>;
```

### 4.3 Harness Statistical Precision & Recall Extension
```typescript
export interface SystemMetrics {
  // Existing fields preserved:
  detectedCount: number;
  eventCount: number;
  medianDelayDays: number | null;
  falseEpisodes: number;
  falseAlarmsPer100Days: number;
  // v2 Additions:
  truePositiveDays: number;
  falsePositiveDays: number;
  falseNegativeDays: number;
  trueNegativeDays: number;
  precision: number | null;
  recall: number | null;
  specificity: number | null;
}
```

---

## 5. Implementation Roadmap & Phase Gate Checklist

- [x] **Phase 0 (Setup & Architecture):**
  - [x] Branch `redesign/premium` created from `pre-redesign-v1`.
  - [x] Dependencies installed: `lucide-react`, `framer-motion`, `@fontsource-variable/inter`.
  - [x] Redesign plan documented in `docs/REDESIGN_PLAN.md`.
  - [x] Baseline gate verified: typecheck 0, 294 tests pass, build clean.
- [ ] **Phase 1 (Design System, Tokens & Component Kit):**
  - Create `src/ui/styles/tokens.css` with Aurora Glass and Night Cabin variables.
  - Implement reusable components in `src/ui/components/` and interactive widgets (`RestTimerWidget`, `BreathingPacerWidget`).
  - Wire `/dev/kit` component showcase.
  - Update top bar with search trigger, theme toggle, and 1-tap urgent button.
- [ ] **Phase 2 (Dashboard, Contract v2 & Grouped Procedures):**
  - Bump `CONTRACT_VERSION = 2`.
  - Implement cluster grouping in `buildAlertCards` (single primary card with supporting signals).
  - Verify the 4 external clinical citations in `src/guidance/sources.ts`.
  - Assemble Dashboard hero, vector `BodyFigure`, metric tiles, and interactive procedure sheets.
- [ ] **Phase 3 (Daily Check Wizard & Health Monitor):**
  - Implement `/check` with simulated wearable pre-fill and tactile steppers.
  - Build `/monitor` with indicator detail side drawer.
  - Configure redirects for legacy `/log` and `/checkin`.
- [ ] **Phase 4 (Scenario Lab, Verification, Reports & Ground):**
  - Fix empty flag timeline in Scenario Lab; add CUSUM Accumulator Inspector.
  - Extend harness with day-level TP/FP/FN/TN statistics and update `results.json`.
  - Build store-and-forward Handover Report generator (`/reports`) with print stylesheet.
  - Implement Ground Console (`/ground`) and Journal follow-up evaluation.
- [ ] **Phase 5 (Onboarding, Search, Settings & Positioning):**
  - Command palette (`Ctrl+K`), onboarding tour, and Settings.
  - Author comprehensive `docs/GAP_AND_POSITIONING.md`.
- [ ] **Phase 6 (Hardening & Delivery):**
  - Measure contrast ratios, run accessibility audits, offline verification.
  - Update `scripts/qa-browser.mjs` and produce full `docs/REDESIGN_REPORT.md`.
