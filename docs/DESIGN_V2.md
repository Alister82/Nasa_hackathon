# DESIGN V2: Flight-Deck Avionics & Aurora Glass Design System

**Status:** Active Design Specification (supersedes `DESIGN.md` for `redesign/premium` branch)  
**Target:** NASA Space Apps Challenge 2026 — Autonomous Astronaut Health Monitoring  
**Visual Style:** Soft "Aurora Glass" (Day/Nominal) + "Night Cabin" (Low-glare dark cockpit)

---

## 1. Design Philosophy

Astronauts on exploration-class missions (Moon, Mars transit, deep-space habitats) work under extreme operational stressors: high cognitive load, microgravity-induced cephalad fluid shifts, confined quarters, variable cabin lighting, and high communication latency (12–22 minutes one-way). 

Vigil V2 adopts a **flight-deck avionics aesthetic**:
1. **Glanceable in 3 seconds:** The dashboard immediately communicates whether any physiological drift is occurring, what immediate step to take, and whether ground contact is required.
2. **Tactile & glove-friendly:** All interactive controls maintain minimum 44px (with optional 48px+ "Large Controls" mode) hit targets with tactile increment steppers (`-5`, `-1`, `+1`, `+5`) alongside numeric typing.
3. **Calm & Non-Alarmist:** Subtle translucent surfaces and soft ambient hues prevent visual fatigue. High-severity indicators are distinct and unambiguous, yet never scream with flashing banners or clinical panic words.
4. **Active Procedure Tools:** Procedures are not static paragraphs; they embed functional, interactive tools (live 5-minute seated rest timer, 4s/6s guided breathing pacer, checkable steps).
5. **Circadian Adaptability:** One-click transition between high-clarity **Aurora Glass** (daytime work cycles) and low-blue **Night Cabin** (darkened cockpit / sleep cycles).

---

## 2. Color System & Contrast Ratios

### 2.1 Surfaces & Backgrounds
- **Aurora Glass (Light Theme):**
  - Viewport Background: `linear-gradient(135deg, #EAF1FF 0%, #DDE8FB 50%, #EEF0FB 100%)`
  - Atmospheric Glow Blobs: `#8FB4FF` at 22% opacity (top-left, 80px blur) and `#C7B8FF` at 18% opacity (bottom-right, 90px blur) in a fixed background layer (zero repaint during scroll).
  - Glass Surface: `rgba(255, 255, 255, 0.70)` with `backdrop-filter: blur(20px) saturate(1.4)`.
  - Glass Border: `1px solid rgba(255, 255, 255, 0.75)` with outer hairline `1px solid rgba(120, 140, 190, 0.18)`.
  - Shadow: `0 8px 32px 0 rgba(40, 70, 140, 0.08), 0 1px 3px 0 rgba(40, 70, 140, 0.04)`.
- **Night Cabin (Dark Avionics Theme):**
  - Viewport Background: `linear-gradient(135deg, #0A1226 0%, #0F1A34 50%, #101B3A 100%)`
  - Atmospheric Glow Blobs: `#1E3A8A` at 20% opacity and `#3B1E78` at 18% opacity.
  - Glass Surface: `rgba(20, 32, 64, 0.68)` with `backdrop-filter: blur(20px) saturate(1.3)`.
  - Glass Border: `1px solid rgba(255, 255, 255, 0.12)`.
  - Shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.36), 0 1px 3px 0 rgba(0, 0, 0, 0.24)`.

### 2.2 Typography Colors
- **Light Theme:**
  - Ink Primary: `#0E1A33` (Contrast ratio > 11:1 against glass surface)
  - Ink Secondary: `#475776` (Contrast ratio > 5.5:1 against glass surface)
  - Ink Muted: `#7888A6` (Contrast ratio > 4.5:1 for auxiliary notes)
- **Dark Theme:**
  - Ink Primary: `#E8EEFF` (Contrast ratio > 12:1 against dark glass)
  - Ink Secondary: `#A8B6D8` (Contrast ratio > 6.2:1 against dark glass)
  - Ink Muted: `#6A7B9F` (Contrast ratio > 4.5:1 for auxiliary notes)

### 2.3 Semantic Status Palette (Icon + Word Mandatory)
| Status | Semantic Word | Light Fill / Text / Border | Night Fill / Text / Border |
|---|---|---|---|
| **`ok`** | Steady | `#DDF5EA` / `#137A5A` / `#22C55E` | `rgba(19, 122, 90, 0.28)` / `#34D399` / `#10B981` |
| **`info`** | Expected | `#E0ECF8` / `#2B5D8A` / `#3B82F6` | `rgba(43, 93, 138, 0.32)` / `#60A5FA` / `#3B82F6` |
| **`watch`** | Watch | `#FDEFC9` / `#8A5A00` / `#F59E0B` | `rgba(138, 90, 0, 0.32)` / `#FBBF24` / `#F59E0B` |
| **`review`** | Review | `#FCE0D2` / `#B4380B` / `#F97316` | `rgba(180, 56, 11, 0.32)` / `#FB923C` / `#EA580C` |
| **`urgent`** | Urgent | `#FADADA` / `#A61B1B` / `#EF4444` | `rgba(166, 27, 27, 0.38)` / `#F87171` / `#DC2626` |

---

## 3. Typography & Numerals

- **Primary Typeface:** `@fontsource-variable/inter` (bundled locally; no runtime network requests).
- **Fallback Stack:** `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- **Telemetry Numerals:** `font-variant-numeric: tabular-nums` applied globally to all physiological readings, timestamps, coordinates, and table data.
- **Hierarchy:**
  - Heading 1 (Hero Title): `28px` – `32px`, font-bold, tracking tight (`-0.02em`).
  - Heading 2 (Section): `20px` – `22px`, font-semibold.
  - Heading 3 (Card Subhead): `16px` – `17px`, font-medium.
  - Body Text: `14px` – `15px`, line-height `1.55`.
  - Microcopy / Metadata: `12px` – `13px`, font-medium.

---

## 4. App Shell & Layout Structure

### 4.1 Responsive Breakpoints
- **Desktop (≥ 1280px):** Fixed 264px left navigation sidebar, top flight bar, 12-column fluid grid (24px gutter, max-width 1440px).
- **Compact Desktop (1024px – 1279px):** Collapsible 72px left icon rail with expandable tooltip labels, fluid main container.
- **Tablet (768px – 1023px):** Collapsed rail or bottom bar with top flight bar.
- **Mobile (390px – 767px):** Fixed bottom navigation bar (5 primary items + "More" drawer), compact top bar, single-column stacked layout.

### 4.2 Top Bar Features
- Vector Vigil brandmark and version pill.
- Global Command Palette trigger (`Ctrl+K` / `Cmd+K` or search input).
- Mission setting badge (with communication roundtrip delay indicator).
- Crew member selector.
- Theme toggle: Light ("Aurora") / Night ("Cabin") / Auto.
- Persistent high-visibility **"Urgent Help"** emergency button.

---

## 5. Anatomical Body Figure

- Hand-built inline vector SVG silhouette (clean cyan-to-blue gradient in Light theme; deep cyan glow in Dark theme).
- 6 Interactive Domain Hotspots:
  1. **Head:** Mood and stress (`behavioral`)
  2. **Chest:** Heart and blood pressure (`cardiovascular`)
  3. **Abdomen:** Temperature and blood sugar (`metabolic_general`)
  4. **Extremities:** Exercise and strength (`physical_performance`)
  5. **Sleep Badge:** Sleep and recovery (`sleep_recovery`)
  6. **Radiation Badge:** Radiation exposure (`radiation`)
- Keyboard accessible (`Tab` to focus, `Enter`/`Space` to open domain drawer).
- Highlighting pulse animation applied only when status is `review` or `urgent`.

---

## 6. Interactive Procedure Tools

### 6.1 5-Minute Seated Rest Timer (`RestTimerWidget`)
- Embedded directly inside any alert card recommending seated rest before repeating vitals.
- Visual circular progress indicator (countdown 5:00 → 0:00).
- Controls: Start, Pause, Reset, and a Demo Fast-Forward button.
- Sound: Web Audio API sine oscillator beep on completion (no external audio assets).

### 6.2 4s/6s Guided Breathing Pacer (`BreathingPacerWidget`)
- Embedded in wellbeing check-in feedback and stress/anxiety relief alert procedures.
- Visual expanding/contracting soft ring: Inhale (4 seconds) → Exhale (6 seconds).
- 2-minute total countdown session counter with gentle pace cues.

---

## 7. Motion & Accessibility Standards

- **Motion Library:** `framer-motion` for smooth modal transitions, drawer slide-ins, and chart line reveals.
- **Reduced Motion:** When `prefers-reduced-motion: reduce` is detected, animations are locked to subtle 120ms opacity fades. The Urgent screen never contains motion.
- **Touch Target Rule:** Minimum 44px × 44px on all interactive elements (buttons, links, form inputs, toggles, steppers).
- **Color Independence:** No status is communicated solely by color; an icon and text label are always present.
