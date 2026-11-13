# DESIGN: Vigil interface specification

Version 1.0 · 2026-11-13. Owner: P3 (interface). This file defines the look, layout, screens, components, and copy. Types come from `CONTRACTS.md`. Do not add screens, colors, or fonts that are not listed here.

## 1. Design direction

**Subject:** a health monitor used by an astronaut on a cabin tablet, often tired, often in a hurry, glancing for a few seconds at a time.
**Job of the interface:** answer three questions fast: "Is anything changing?", "What should I do?", "Do I need to call ground?"

**The one memorable element:** a body map whose regions are colored by status, paired with a **mission timeline scrubber** underneath. Dragging the scrubber rewinds or advances the mission day, and the body map and cards change with it, so the astronaut and a judge can literally watch a problem develop. Everything else stays quiet, plain, and disciplined.

**Tone:** calm, matter-of-fact, procedure-like. The alert card reads like a checklist sheet from a flight procedure book, not like a marketing card.

**Avoid (these read as generic):** near-black backgrounds with a single neon accent; cream backgrounds with serif headlines and terracotta accents; all-caps eyebrow labels over every heading; numbered markers on things that are not sequences; identical rounded cards with the same shadow everywhere; gradient washes; arrows appended to every link; entrance animations on every section.

## 2. Tokens

### 2.1 Color (CSS variables in `src/ui/styles/tokens.css`; mirror in `tailwind.config.js` as `colors`)

| Token | Hex | Use |
|---|---|---|
| `--ceramic` | `#E8EDF1` | Page background (cool ceramic, not cream) |
| `--panel` | `#F6F8FA` | Panels, sheets, inputs |
| `--ink` | `#0F1A2B` | Primary text |
| `--ink-soft` | `#46566B` | Secondary text |
| `--line` | `#C4CFDA` | Borders and dividers |
| `--instrument` | `#1D56B8` | Primary buttons, links, focus ring, selected day marker |
| `--instrument-soft` | `#D9E5F7` | Selected backgrounds |

Status colors (use both a strong and a soft value; the strong value is for text, borders, icons; the soft value is for fills):

| Status | Strong | Soft | Icon | Word shown with it |
|---|---|---|---|---|
| ok | `#1F6F52` | `#D5EFE4` | check circle | "Steady" |
| info | `#2B5D8A` | `#DCE9F5` | info circle | "Expected" |
| watch | `#8A5A00` | `#FCE9C0` | eye | "Watch" |
| review | `#B4380B` | `#FADBC9` | flag | "Review" |
| urgent | `#A61B1B` | `#F7D0D0` | alert triangle | "Urgent" |

Rules: color is never the only signal; always show the icon and the word. Text on soft fills uses the strong value of the same status or `--ink`. Minimum contrast 4.5:1 for text, 3:1 for UI graphics. Verify with a contrast checker once and record pairs that fail in `MEMORY.md`.

Chart colors: value line `--ink`, expected line `--instrument` dashed, baseline band `--line` at 40 percent opacity, change-start marker the status strong color of the finding.

No dark mode in v1. Do not add one.

### 2.2 Typography

One family: **Atkinson Hyperlegible** (bundled with `@fontsource/atkinson-hyperlegible`, import weights 400 and 700 in `main.tsx`), chosen for legibility of numbers and similar characters on small screens. Fallback stack: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. Use `font-variant-numeric: tabular-nums` for all numbers.

| Role | Size / line height | Weight |
|---|---|---|
| Screen title | 28 / 34 | 700 |
| Section title | 22 / 28 | 700 |
| Card title | 18 / 24 | 700 |
| Body | 16 / 24 | 400 |
| Secondary | 14 / 20 | 400 |
| Caption | 12 / 16 | 400 |
| Big reading (indicator value) | 36 / 40 | 700 |

Sentence case everywhere. No ALL CAPS. Line length under 70 characters in prose blocks (max-width `65ch`).

### 2.3 Spacing, shape, elevation

Spacing scale (px): 4, 8, 12, 16, 24, 32, 48. Radius: 6 for inputs and chips, 12 for sheets, 999 for pills. Borders: 1 px `--line`. No drop shadows except a single `0 1px 2px rgba(15,26,43,.08)` on the card sheet that is being read (alert card). Surfaces are separated by borders and spacing, not shadows.

### 2.4 Motion

- Respect `prefers-reduced-motion: reduce`: disable all animation.
- Allowed motion (only these): (1) body map regions with status `review` or `urgent` pulse once when the viewed day changes to a day where they become flagged (single 600 ms outline pulse, no loop); (2) region color cross-fade 200 ms when status changes; (3) alert card expand/collapse 150 ms; (4) the scrubber thumb follows pointer with no easing.
- No page-load entrance animations. No hover animations other than color change.

## 3. Layout

Breakpoints: `lg` ≥ 1024 px (tablet landscape and up), below that mobile.

**Top bar (all screens, 56 px):** left: app name `APP_NAME`; center: crew picker (Crew 1, 2, 3) and mission setting pill (opens `/mission`); right: offline badge, "Urgent help" button (always visible, status urgent colors, icon + words "Urgent help").
**Disclaimer banner (all screens, under the top bar, 32 px, `--instrument-soft`):** text from `DISCLAIMER_BANNER`.

**Today screen, `lg`:** two columns. Left column 360 px: body map (about 420 px tall) with the day scrubber beneath it. Right column: domain list (six rows), then "What needs attention" (alert cards for the viewed day), then "Log today" shortcuts.
**Today screen, mobile:** single column in this order: scrubber, body map (height 320 px), domain list, alert cards. Bottom navigation (5 items): Today, Log, Check-in, Lab, More. "More" opens a sheet with Proof, Journal, Mission, About, Reset demo data.
**Other screens:** single column, max width 880 px, centered on `lg`.

Alignment: left aligned text everywhere; numbers right-aligned inside tables.

## 4. Routes and screens (`HashRouter`)

| Route | Screen | Priority | Owner notes |
|---|---|---|---|
| `/` | Today | P0 | Body map, scrubber, domain list, cards |
| `/domain/:domainId` | Domain detail | P0 | Charts per indicator, cards, timeline notes |
| `/log` | Log measurements | P0 | Guided entry, saves via storage |
| `/checkin` | Wellbeing check-in | P0 | 3 sliders, note, result, "I need help now" |
| `/urgent` | Urgent help | P0 | Fixed copy (section 7) |
| `/lab` | Scenario Lab | P0 | Scenario, seed, setting, scrubber, three systems |
| `/proof` | Proof results | P0 | Reads results.json |
| `/mission` | Mission setting and supplies | P0 (setting), P1 (supplies) | |
| `/journal` | Investigation log | P1 | |
| `/about` | About and limits | P0 | Limits, sources, disclaimers |

### 4.1 Today

1. **Scrubber** (`TimelineScrubber`): range input from day 1 to 180 with large thumb (44 px), tick marks every 30 days labeled "Day 30" and so on, the viewed day shown as "Day 120 of 180". Markers on the track for the first day any finding became flagged (flag icon, status color). Keyboard: arrow keys ±1 day, PageUp/PageDown ±10. Buttons "Today" (jumps to default view day 120) and "Play demo story" (calls `demo.playDemoStory()` which sets crew-1, `slow_drift`, seed 42, deep_space, day 120).
2. **Body map** (`BodyMap`): see section 5.
3. **Domain list** (`DomainRow`, six rows, ordered by `DOMAIN_ORDER`): left status bar (6 px, status strong color), domain label, one line summarizing the main indicator ("Resting heart rate 71 bpm, up from 64"), status chip with icon and word. Tap opens `/domain/:id`. Rows are list items separated by 1 px lines, not individual cards.
4. **What needs attention**: `AlertCardView` for each card with severity ≥ watch; info cards collapsed under "Expected changes".
5. **Empty state** (no cards): "Nothing needs attention on day {n}. Keep logging your measurements." plus button "Log today's measurements".

### 4.2 Domain detail

Header: domain label, status chip, short plain-language explanation of what the domain covers (from `MEASUREMENT_HELP.whyItMatters` of its indicators, joined). Then for each indicator in the domain: `IndicatorChart` (height 220 px on mobile, 260 px on `lg`) with title, latest value (big reading), reference range text with "illustrative" tag, and a link "How to measure" that expands `MEASUREMENT_HELP.howToMeasure`. Below: the alert cards for that domain. For `behavioral`, also show the check-in trend (mood, stress, energy lines) and an "Open check-in" button.

### 4.3 Log measurements

Form with one row per indicator (all except radiation_dose and the three behavioral scores, which come from the check-in): label, numeric input with unit, "How to measure" expandable text, validation against plausible range, after blur a `StatusChip` using `classifyValue` (normal → "In range", borderline → "Borderline", out_of_range → "Outside range", urgent → "Urgent"). Primary button "Save measurements" saves via `storage.saveEntry` for the viewed day. After saving show "Saved for day {n}" and refresh analysis. If `classifyValue` returns `urgent` for any value, show the urgent callout (section 7) above the form.
Prompt strip at the top: "Measurements due today: {list of indicators not yet logged for the viewed day}".

### 4.4 Check-in

Three sliders (1 to 5) for mood ("Low" to "Good"), stress ("Calm" to "High"), energy ("Low" to "High"), each with a number readout and large touch target. Optional note (max 500 characters, helper text: "Stays on this device."). Buttons: "Save check-in" (primary), "I need help now" (urgent colors). On save, show the `CheckInResult` message and suggestions (`ActionItem` list). Below, a 30-day trend chart with mood next to sleep hours (two small charts stacked, same x axis).

### 4.5 Scenario Lab

Controls: scenario select (labels from `SCENARIO_LABELS`), seed number input (default 42), mission setting select, scrubber. Panel "Who flags first" with a three-row table (Vigil, Fixed thresholds, Rolling z-score): columns "First flag day", "Days after onset", "Flags before onset". Show the ground-truth onset as a marker on a shared timeline (three horizontal rows, a dot per flagged day, a vertical line at onset). Under it, the alert cards Vigil would show for the scrubber day. Buttons "Inject: slow drift", "Inject: sensor fault", "Inject: fever" are shortcuts that set the scenario select.

### 4.6 Proof

Reads `loadResults()`. If null: "Results file not found. Run the harness (`npm run harness`) and rebuild." Otherwise: one section per scenario with a bar chart (Recharts) of median detection delay by system (null shown as "Not detected") and a second small bar chart for false alarms per 100 days; a table below with exact numbers (`detectedCount / eventCount`, median delay, false alarms). A line of method text: "{seedCount} simulated crews per scenario, seeds {start} to {end}. Detector settings were tuned on separate seeds ({tuning start} to {tuning end}). Results are on simulated data and do not show medical validity." Do not write any claim about who wins; let the numbers speak.

### 4.7 Mission, Journal, About

- **Mission:** radio group of three settings (label, description, one-way delay), then supply checklist (switches) from `SUPPLIES`, with helper "Actions only name equipment marked as aboard."
- **Journal:** list from `listLogEntries` (newest first), form to add an entry from an alert card ("Log what I did": observation prefilled, action taken text, reviewed by select, note).
- **About:** what the app is, what it is not, list of sources from `SOURCES` (title, link if present else "(source link pending)"), note that numbers are illustrative, note that data is simulated.

## 5. Body map (exact geometry)

SVG, `viewBox="0 0 200 420"`, scales to container width, role `group` with `aria-label="Body map"`. Each region is a `<g role="button" tabIndex={0}>` with an `aria-label` like "Heart and blood pressure, Review. Open details." Enter and Space activate. Regions are plain shapes (no anatomical illustration):

| Region | Shape (SVG attributes) | Domain |
|---|---|---|
| Head | `<circle cx="100" cy="38" r="26"/>` | behavioral |
| Chest | `<rect x="66" y="76" width="68" height="56" rx="20"/>` | cardiovascular |
| Abdomen | `<rect x="70" y="136" width="60" height="52" rx="18"/>` | metabolic_general |
| Left arm | `<rect x="38" y="80" width="20" height="110" rx="10"/>` | physical_performance |
| Right arm | `<rect x="142" y="80" width="20" height="110" rx="10"/>` | physical_performance |
| Left leg | `<rect x="72" y="196" width="26" height="150" rx="12"/>` | physical_performance |
| Right leg | `<rect x="102" y="196" width="26" height="150" rx="12"/>` | physical_performance |
| Sleep badge | `<circle cx="160" cy="40" r="14"/>` with a crescent icon | sleep_recovery |
| Radiation badge | `<circle cx="40" cy="40" r="14"/>` with a three-blade radiation-style icon | radiation |

Fill = status soft color; stroke = status strong color, 2 px; selected region adds a 3 px `--instrument` outer stroke. Under the figure, a legend row of the five status chips (icon + word). Hover or focus shows a tooltip with the domain label, status word, and one-line summary. The legend is also the key for the domain list.

Icons: use inline SVG paths you write yourself (check circle, info circle, eye, flag, alert triangle, moon crescent, radiation-style). Do not add an icon library.

## 6. Components (props are exact; all in `src/ui/components` unless noted)

```ts
interface StatusChipProps { status: 'ok' | 'info' | 'watch' | 'review' | 'urgent'; label?: string }
interface BodyMapProps { domains: Record<DomainId, DomainAnalysis>; summaries: Record<DomainId, string>; selected?: DomainId; onSelect: (d: DomainId) => void }
interface DomainRowProps { domain: DomainId; analysis: DomainAnalysis; summary: string; onOpen: (d: DomainId) => void }
interface TimelineScrubberProps { day: number; maxDay: number; markers: { day: number; status: 'review' | 'urgent' | 'watch'; label: string }[]; onChange: (d: number) => void; onToday: () => void; onPlayDemo: () => void }
interface IndicatorChartProps { analysis: IndicatorAnalysis; baseline?: Baseline; meta: IndicatorMeta; range: ReferenceRange; height?: number }   // src/ui/charts
interface AlertCardViewProps { card: AlertCard; sources: Record<string, SourceRef>; onLog?: (card: AlertCard) => void; defaultOpen?: boolean }
interface MeasurementFormProps { day: number; setting: MissionSettingId; existing?: Partial<Record<IndicatorId, number>>; onSave: (values: Partial<Record<IndicatorId, number>>) => Promise<void> }
interface CheckInFormProps { crewId: string; day: number; onSubmit: (input: CheckInInput) => Promise<CheckInResult> }
interface MissionPickerProps { value: MissionSettingId; onChange: (m: MissionSettingId) => void }
interface SupplyChecklistProps { supplies: Record<SupplyId, boolean>; onChange: (s: Record<SupplyId, boolean>) => void }
interface SystemsComparisonProps { dataset: CrewDataset; flags: Record<SystemId, DailyFlag[]> }
interface ProofChartProps { scenario: ScenarioResult; labels: Record<SystemId, string> }
interface DisclaimerBannerProps {}   // uses DISCLAIMER_BANNER
interface OfflineBadgeProps {}       // uses navigator.onLine
```

### 6.1 Alert card (`AlertCardView`) layout: "procedure sheet"

A single bordered sheet (12 px radius, the only element with the soft shadow), a 6 px left bar in the severity strong color. Fixed section order, each with a bold sentence-case heading and a hairline divider between sections:

1. Header row: `StatusChip` + title (card title) + "Day {n}".
2. **What changed**: `observation`.
3. **Evidence**: bullet list of `evidence[].text`; each bullet has a "Show days" toggle that lists the day numbers used (this is the traceability feature).
4. **What we do not know**: `uncertainty.statement`, a line "Evidence strength: {tier}" with a 3-segment meter (1, 2, or 3 filled) plus the word, then `missingInfo` as a short list.
5. **Do now**: numbered list of `recommendedActions` (this is a real sequence, so numbers are appropriate). If `supplyAvailable` is false show `alternativeText` and a small "No {supply} aboard" tag.
6. **Measure next**: `nextMeasurements` list (omit section if empty).
7. **Who to contact**: `escalation.text`; if `expectedReplyMinutes` is not null add "Reply expected in at least {n} minutes."
8. Footer: "Sources:" list of source titles (link only if `url` non-null, else title plus "(source link pending)"), and a secondary button "Log what I did" (if `onLog`).

Collapsed state (used for `info` and `watch` cards when many): header + "What changed" only, with a "Show details" button. `review` and `urgent` cards default open.

## 7. Fixed copy (exact strings; do not rephrase)

| Where | Text |
|---|---|
| Disclaimer banner | Simulated crew data. Decision support only, not a medical device. |
| Urgent screen title | Get help now |
| Urgent screen body | Contact your crew medical officer and ground now. You do not have to handle this alone. Follow your emergency procedures. |
| Urgent screen deep-space line (shown only when setting is deep_space) | A reply from ground may take a while. Do not wait for a reply before starting emergency procedures. |
| Urgent screen button | Back to Today |
| Urgent callout on Log screen | One reading is in the urgent range. Repeat it once, and if it is confirmed, follow your emergency medical procedures and contact the crew medical officer now. |
| Check-in saved (level none) | Thanks for checking in. |
| Offline badge online | Online |
| Offline badge offline | Offline: everything still works |
| Reset demo data | Reset demo data |
| Reset confirm | This clears measurements, check-ins, and the journal on this device. Reset? |
| Proof empty | Results file not found. Run the harness and rebuild. |
| Illustrative tag | Illustrative reference |
| Source pending | (source link pending) |

All other microcopy: plain verbs, sentence case, no exclamation marks, no emojis, no "AI" branding, errors say what happened and what to do ("Could not save. Check that storage is available and try again.").

## 8. Interaction details

- **Viewed day state:** `viewDay` (1 to 180), default `DEFAULT_VIEW_DAY`, persisted as setting `viewDay`. The body map, domain list, and cards all derive from `analysis(dataset, viewDay)`.
- **Crew picker:** changes `selectedCrewId` and reloads dataset.
- **Mission setting change:** recomputes cards only (analysis radiation rule also depends on setting, so recompute analysis too).
- **Scenario Lab changes** are local to the Lab screen and do not overwrite stored entries.
- **Loading:** skeleton rows (plain `--line` bars, no shimmer animation) for up to 300 ms, then content. Analysis is synchronous; do not add artificial delays.
- **Errors:** an error boundary around each route shows "Something went wrong on this screen." and a "Back to Today" button.
- **Focus:** after route change, move focus to the screen title. After saving a form, move focus to the success message (`role="status"`).

## 9. Accessibility checklist (P3 verifies before each checkpoint)

- [ ] All controls reachable and operable by keyboard; visible focus ring (2 px `--instrument`, 2 px offset).
- [ ] Body map regions have labels including status words.
- [ ] Contrast pairs verified.
- [ ] Touch targets at least 44 × 44 px.
- [ ] No information conveyed by color alone.
- [ ] `prefers-reduced-motion` disables the pulse and fades.
- [ ] Sliders have labels, current value readout, and `aria-valuetext`.
- [ ] Page works at 390 px width and at 1024 × 768 without horizontal scroll.

## 10. Stretch (P2 priority; only after all P0 and P1 are done)

- Gamification: a "Today's checks" ring (measurements logged + check-in done) and a day streak count on Today. No points, no badges, no leaderboards.
- "Share with ground" toggle on the check-in screen (stores a flag only).
