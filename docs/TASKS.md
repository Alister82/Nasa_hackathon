# TASKS: work split for three people

Version 1.0 · 2026-11-13. Time is counted in hours from the start of coding (H0 = event start unless humans confirm earlier coding is allowed). Roles: **P1 Engine**, **P2 Guidance and platform**, **P3 Interface**. Each person works on their own branch and merges at checkpoints. See `RULES.md` for ownership and git workflow.

Status markers in this file are never edited by agents; track progress in `MEMORY.md`.

## 0. Hour 0 sync (all three, 30 minutes)

1. P1 creates the repo, branches, scaffold, and contracts (section 1, tasks `E0.*`) while P2 and P3 read all docs.
2. Everyone confirms they can run `npm install`, `npm run typecheck`, `npm test`, `npm run build`.
3. Agree on a chat channel and the checkpoint times in section 5.

## 1. Checkpoint 0: scaffold and contracts (target H0 to H1.5, P1; P2 and P3 start reading and planning meanwhile)

| ID | Task | Acceptance |
|---|---|---|
| E0.1 | `git init`, create `main`, `feat/engine`, `feat/guidance`, `feat/ui`; add `.gitignore` (node_modules, dist, coverage) | Branches exist on the shared remote |
| E0.2 | Vite + React + TypeScript project with the dependencies and scripts in `ARCHITECTURE.md` section 2; path alias `@/*`; Tailwind 3 configured; Vitest configured with jsdom; `src/app/main.tsx` renders "Vigil" | `npm run dev` shows the page; typecheck, test (one trivial test), build pass |
| E0.3 | Copy `docs/*.md` into the repo `docs/` | Files present |
| E0.4 | Create `src/contracts/types.ts`, `indicators.ts`, `constants.ts` verbatim from `CONTRACTS.md` | Typecheck passes; a test asserts 11 indicators and 6 domains in `DOMAIN_ORDER` |
| E0.5 | Create empty module stubs: `src/engine/index.ts`, `src/guidance/index.ts`, `src/storage/index.ts` that export the exact signatures from `CONTRACTS.md` section 4, with bodies `throw new Error('not implemented')`, and `src/app/services.ts` stub; `docs/MEMORY.md` | Typecheck passes |
| E0.6 | Merge to `main`, tag `checkpoint-0`; P2 and P3 rebase their branches | `main` green |

## 2. P1: Engine (branch `feat/engine`, owns `src/engine/**`, `scripts/**`)

Order of work. Each task includes tests.

| ID | Task | Depends | Acceptance |
|---|---|---|---|
| E1 | `rng.ts`: `mulberry32`, `fnv1a`, `gaussian(rng)` exactly as in `ARCHITECTURE.md` 6.3 | E0 | Same seed gives identical first 5 outputs across runs; gaussian mean within 0.05 and SD within 0.05 of 0 and 1 over 20,000 draws |
| E2 | `simulator.ts`: crew base, AR(1) noise, phase offsets, clip, round, missingness, radiation per 6.2 and 6.4 for the `normal_adaptation` scenario; export used by `generateScenario` | E1 | Records span day −29 to 180 with no gaps; same inputs give identical dataset; values within clip ranges; about 2 percent null (between 1 and 3 percent over 100 seeds); phase offset visible: mean heart_rate on days 1–3 exceeds preflight mean by about 2 to 4 over 50 seeds |
| E3 | `scenarios.ts`: all six scenarios, effects with ramp and recover, ground truth events, per 6.5 | E2 | Each scenario has the correct ground truth; for `slow_drift` the mean of heart_rate over days 110–120 exceeds that of `normal_adaptation` (same seed) by about 8 to 10; `sensor_fault` has the day-90 spike and nulls on 91–92; `blackout_drift` has all-null days 100–107; `solar_event` radiation about 6 × rate on days 80–83; `acute_fever` temperature up about 1.5 on days 121–123 |
| E4 | `degradation.ts` (if separate), `merge.ts` (`mergeEntries`, `truncateDataset`) | E2 | Merge overwrites only provided values; ignores out-of-range days; truncation keeps day ≤ upToDay |
| E5 | `detectorConfig.ts` and `detector.ts`: `analyze` per 6.6 (baseline, z, CUSUM, persistence, status, spike, data quality, radiation rule, adaptation note, domains, findings, points) | E2, E3 | Unit tests on crafted series: flat series → all `ok`; +1.5σ step for 20 days → `flagged` within about 12 days; single +8σ day → `isolatedSpike` and not flagged; 3 of 7 days missing → `dataQuality: 'poor'`; no-future-leak test passes; pattern finding appears when two indicators from different domains drift together |
| E6 | `systems/radiationRule.ts`, `systems/vigil.ts`, `systems/threshold.ts`, `systems/zscore.ts`; export `SYSTEMS` | E5 | Each returns 180 `DailyFlag`s; threshold flags a day with heart_rate 101; zscore needs 7 values in window; vigil flag days match `analyze` findings |
| E7 | `metrics.ts`: event windows, detection delay, false episodes with 2-day merge, per-100-days rate, `evaluateScenario`, `buildResultsFile` per 6.8 | E6 | Hand-built flag arrays give expected delay and episode counts (at least 5 cases); non-medical event window counts as false |
| E8 | **Tuning run** per 6.9 on seeds 1000–1099 (script `scripts/tune.ts`, prints false alarm rate and detection rate for combinations of `H_WATCH`, `H_FLAG`) | E7 | Chosen constants recorded in `MEMORY.md`; commit `engine: freeze detector config` |
| E9 | `scripts/run-harness.ts` writes `public/data/results.json` per 6.10; commit the file | E8 | `npm run harness` finishes in under 5 minutes; file validates against `ResultsFile`; a test loads the file and checks schema |
| E10 | Performance check: one `analyze(ds, 180)` under 200 ms | E5 | Test with generous bound (500 ms) to avoid flakiness; note timing in `MEMORY.md` |
| E11 | Support integration: fix engine bugs reported by P2/P3, add `demoDefaults` helper if requested (via contract process) | all | |
| E12 (P2 stretch if time) | `systems/isolationForest.ts` per 6.7, add as optional system in a separate results file only if the contract is extended | E9 | Only with team approval |

Merge points for P1: E0 → checkpoint 0; E1–E5 → checkpoint 1; E6–E9 → checkpoint 2 (results.json needed by P3's Proof page).

## 3. P2: Guidance and platform (branch `feat/guidance`, owns `src/guidance/**`, `src/storage/**`, PWA/deploy config)

| ID | Task | Depends | Acceptance |
|---|---|---|---|
| G1 | `sources.ts` (9 entries from `ARCHITECTURE.md` 7.2: the 5 organizer sources with the exact URLs listed there and `status: 'verified'`, the other 4 with `url: null` and `status: 'unverified'`), `missionSettings.ts` (7.3), `supplies.ts` (labels: Blood pressure cuff, Thermometer, Glucose meter, Wrist heart-rate monitor, Exercise equipment, Sleep mask) | E0 | Exports match `CONTRACTS.md`; test: all 3 settings present, delays 0, 0.02, 12 |
| G2 | `referenceRanges.ts`: `REFERENCE_RANGES` displayText for all 11 indicators and `classifyValue` per 7.1 including boundaries | G1 | Table-driven tests for every row including boundary values (e.g. heart_rate 100 → normal, 101 → borderline, 110 → borderline, 111 → out_of_range; bp_sys 179 → out_of_range, 180 → urgent; glucose 53 → urgent, 54 → out_of_range, 69 → out_of_range, 70 → normal) |
| G3 | `measurementHelp.ts`: `MEASUREMENT_HELP` for all 11 indicators (1–3 short sentences how to measure, 1 sentence why it matters, hazards from the five HRP hazards). Write general, non-prescriptive text; mark nothing as verified | G1 | All 11 present; no forbidden words (RULES 10); every `hazards` entry is one of the five names |
| G4 | `library.ts`: transcribe Appendix A exactly (keys, actions, questions, nextMeasurements, sources) | G1 | Test that every key in Appendix A exists and action texts match the file verbatim; every referenced source id exists in `SOURCES` |
| G5 | `alertCards.ts`: `buildAlertCards` per 7.4 and 7.5 (all kinds, severity, escalation matrix, supply fallback, sorting, ids, `early_signal` cards from indicators with status `watch`) | G2, G4, E5 (use a hand-made `AnalysisResult` fixture until E5 merges) | Tests: all severity × setting combinations produce the exact escalation text; `{N}` filled with `2 × delay + 10` for deep_space; missing supply shows alternative; pattern cards merge and cap at 5 actions; contract invariants 3–5 hold; card order is deterministic |
| G6 | `wellbeing.ts`: `evaluateCheckIn` per 7.6, `supportActions` | G4 | Tests for every branch (urgent flag; mood ≤ 2 and stress ≥ 4; each single trigger; none) |
| G7 | `storage/*`: `db.ts` (idb, version 1, four stores), `entries.ts`, `checkins.ts`, `log.ts`, `settings.ts`, `index.ts` per ARCHITECTURE 9 | E0 | Tests with `fake-indexeddb/auto`: round trips, merge on same key, newest-first log, safe defaults when DB fails, `clearAll` |
| G8 | PWA: `vite-plugin-pwa` config (autoUpdate, precache including `data/results.json`, manifest from `APP_NAME`), simple SVG icons, `netlify.toml` (build `npm run build`, publish `dist`) | E0 | `npm run build` passes; offline test per ARCHITECTURE 10 passes (manual) |
| G9 | `sources` verification sheet: file `docs/SOURCES_TODO.md` listing each source id with an empty URL line for humans; no URLs invented | G1 | File exists |
| G10 | Integration: run `buildAlertCards` on real `analyze` output for the demo story and `normal_adaptation`; fix mismatches; report engine issues to P1 | E5 merged | Demo story yields a `review` card with a pattern; no diagnosis words |
| G11 | Deploy: connect repo to Netlify or Vercel (human may do the account step), confirm the live URL loads and works offline | G8, checkpoint 2 | Live link recorded in `MEMORY.md` |
| G12 (stretch) | Gamification state helper for P3 ("checks complete today", streak) as a pure function in `guidance` | G7 | Tests; requires contract extension via RULES 6 |

Merge points for P2: G1–G4, G7 → checkpoint 1; G5, G6, G8 → checkpoint 2; G9–G11 → checkpoint 3.

## 4. P3: Interface (branch `feat/ui`, owns `src/app/**`, `src/ui/**`, `src/mocks/**`)

P3 builds against mocks first, then switches `USE_MOCKS` to `false` after checkpoint 2.

| ID | Task | Depends | Acceptance |
|---|---|---|---|
| U1 | Tokens and base styles: `tokens.css`, Tailwind config colors, font import, global focus ring, reduced-motion rules; `StatusChip`, icons (hand-written SVG), `DisclaimerBanner`, `OfflineBadge` | E0 | Visual check against `DESIGN.md` section 2; contrast pairs recorded |
| U2 | Mocks per `CONTRACTS.md` section 5; `services.ts` with `USE_MOCKS` | E0 | Typecheck passes; mocks satisfy types |
| U3 | App shell: `App.tsx`, `routes.tsx` (`HashRouter`), top bar, crew picker, mission pill, urgent button, bottom navigation, error boundaries | U1 | All routes render placeholder screens; keyboard navigation works |
| U4 | `BodyMap` per section 5 geometry, legend, tooltip, keyboard; `DomainRow` | U1, U2 | All 9 shapes present; statuses color correctly from mock; keyboard activation; screenshot attached |
| U5 | `TimelineScrubber` with markers, keyboard, Today and Play demo buttons; `demo.ts` | U3 | Arrow and Page keys work; day change updates Today screen from mock |
| U6 | `AlertCardView` per 6.1 (all sections, collapsed state, evidence day toggle, supply tag, sources) | U2 | Renders both mock cards; screenshot attached |
| U7 | Today screen assembly (section 4.1) | U4, U5, U6 | Matches layout for `lg` and mobile |
| U8 | `IndicatorChart` (Recharts) and Domain detail screen | U2 | Shows values, expected dashed, baseline band, onset marker, gaps for null |
| U9 | Log screen with `MeasurementForm`, validation, `classifyValue` chips, saving via storage (use a thin adapter until G7 merges), urgent callout | U3 | Invalid input blocked with message; saved entry reloads |
| U10 | Check-in screen, `CheckInForm`, result display, trend charts, urgent screen `/urgent` with exact copy | U3 | "I need help now" opens urgent screen; deep-space line shown only in deep_space |
| U11 | Mission screen: setting picker, supply checklist; persists via settings | U3 | Changing setting changes escalation text on cards (after integration) |
| U12 | Integration (checkpoint 2): set `USE_MOCKS = false`, wire `services.ts` to real engine, guidance, storage; remove console noise; fix type errors | checkpoint 2 | Demo story renders real data end to end |
| U13 | Scenario Lab screen with `SystemsComparison` | U12, E6 | Switching scenario and seed updates the three-row table; onset line shown |
| U14 | Proof screen with `ProofChart` reading `results.json` | E9 | Shows 6 scenarios; handles missing file message |
| U15 | Journal screen (P1 priority), About screen (P0) | U12 | Entries add and list newest first; About lists sources with "(source link pending)" where applicable and shows the NASA risk coverage map from `ARCHITECTURE.md` 7.7 (what is covered, partly covered, and not covered) |
| U16 | Polish pass: spacing, empty states, loading skeletons, a11y checklist (`DESIGN.md` 9), responsive check at 390 px and 1024 × 768 | all | Checklist ticked in `MEMORY.md` |
| U17 | UI tests with Testing Library: body map keyboard, scrubber, card rendering, urgent screen routing, mission setting changes escalation text | U12 | `npm test` passes |
| U18 (stretch) | Gamification ring and streak using P2's helper | G12 | Only after all P0 and P1 are done |

Merge points for P3: U1–U7 → checkpoint 1 (UI on mocks); U8–U12 → checkpoint 2; U13–U15 → checkpoint 3; U16–U17 → checkpoint 4.

## 5. Checkpoints (merge to `main`, everyone rebases)

| CP | Target hour | Contents | Gate |
|---|---|---|---|
| 0 | H1.5 | Scaffold, contracts, stubs | typecheck, test, build green |
| 1 | H8 | Engine E1–E5, Guidance G1–G4 + G7, UI U1–U7 on mocks | green; `analyze` works on a generated dataset; Today screen works on mocks |
| 2 | H16 | Engine E6–E9 (frozen constants, `results.json`), Guidance G5–G8, UI U8–U12 integrated with real modules | **Demo story works end to end with real code**, offline test passes |
| 3 | H26 | U13–U15, G9–G11, E10 | Scenario Lab and Proof pages work; live URL up |
| 4 | H36 | **Feature freeze.** U16–U17, bug fixes only | All P0 requirements verified (section 7) |
| 5 | H44 | Release candidate | Offline run-through, video recorded, project page text final, submission prepared |

At each checkpoint: run the full manual checklist subset (section 8), update `MEMORY.md` status board, tag `checkpoint-N`.

## 6. Git cheat sheet

```
git checkout feat/engine            # your branch
git fetch origin && git rebase origin/main
npm run typecheck && npm test && npm run build
git push -u origin feat/engine
# merge: open a PR into main with the checklist from RULES.md section 7; after approval:
git checkout main && git pull && git merge --no-ff feat/engine && git push
git checkout feat/engine && git rebase main
```

## 7. Requirement verification map

| Requirement | Verified by | Task |
|---|---|---|
| FR-1 | Log screen test + demo | U9, G2, G3 |
| FR-2 | Engine tests | E2, E3 |
| FR-3 | Body map demo | U4, U7 |
| FR-4 | Chart demo | U8 |
| FR-5 | Card tests and demo | G5, U6 |
| FR-6 | Escalation matrix test, UI test | G5, U11, U17 |
| FR-7 | Supply fallback test | G5, U11 |
| FR-8 | Wellbeing tests, check-in demo | G6, U10 |
| FR-9 | Lab demo | U13 |
| FR-10 | Schema test, Proof demo | E9, U14 |
| FR-11 | Manual offline test | G8 |
| FR-12 | Storage test, Journal demo | G7, U15 |
| FR-13 | Banner on every route | U3, U15 |
| FR-14 | Demo button | U5 |
| FR-15 | Scrubber keyboard test | U5, U17 |

## 8. Manual checklist (run at checkpoints 2, 4, 5)

1. `npm run build && npm run preview`; open once online; switch the browser to offline; reload; all routes load.
2. Today at day 120 for Crew 1 shows at least one `review` card with a pattern; Crew 2 shows no review card; Crew 3 shows a spike card, not a review card.
3. Switch mission setting from station to deep space: the escalation text changes and the reply-time line appears.
4. Turn off "Blood pressure cuff" supply: the first blood pressure action shows its alternative text.
5. Check-in with mood 1, stress 5: support message shows. "I need help now": urgent screen shows.
6. Log blood pressure 185 / 95: urgent callout shows.
7. Scenario Lab: pick `sensor_fault`, Vigil shows no review flag; threshold system may flag.
8. Proof page numbers match `public/data/results.json`.
9. Reset demo data clears entries.
10. 390 px width and 1024 × 768: no horizontal scroll.
11. Search the built UI text for forbidden words (RULES 10): none.

## 9. Non-code tasks for the rest of the team (not for coding agents)

- Verify sources and fill URLs in `docs/SOURCES_TODO.md`; hand them to P2 for `sources.ts` (humans paste URLs; agents never invent).
- Confirm 2026 judging criteria, award categories, submission requirements, video length limit, and event rules on pre-written code.
- Review the wellbeing copy and guidance text; mark verified or edit via PR to Appendix A.
- Write the project page, record the video per the `PDR.md` storyboard, rehearse the demo twice.
- Prepare the backup video and a screenshot set.

## 10. If we are behind schedule (cut order)

1. Isolation forest, gamification, Journal polish (already stretch).
2. Supply checklist UI (keep logic).
3. Lab "inject" shortcut buttons.
4. Domain detail charts for non-demo indicators (keep heart rate, bp, sleep, mood).
5. Never cut: body map, scrubber, alert cards, mission setting, check-in and urgent screen, Proof page, offline.
