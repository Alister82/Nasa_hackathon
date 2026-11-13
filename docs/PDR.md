# PDR: Vigil — Astronaut Health Monitor (NASA Space Apps 2026)

Status: APPROVED FOR BUILD v1.0 · Date: 2026-11-13 · Event: 2026-11-14 to 2026-11-15
Challenge: "Create Health Monitoring Software for Astronauts on Space Missions" (NASA Space Apps Challenge 2026)
Working name: **Vigil** (rename in ONE place: `src/contracts/constants.ts` → `APP_NAME`). Do not use the name "AURORA" (another team uses it).

Read order for every agent: `RULES.md` → `PDR.md` → `ARCHITECTURE.md` → `CONTRACTS.md` → `DESIGN.md` → `TASKS.md` → `MEMORY.md`.

---

## 1. Purpose

Build an offline-first web app that lets an astronaut (1) log health indicators, (2) understand how they are changing compared with their own baseline and the expected adaptation to spaceflight, and (3) act on the result with sourced guidance and clear escalation advice that depends on the mission setting.

The app ships with a built-in test harness that proves it flags developing problems earlier and with fewer false alarms than two standard approaches (fixed thresholds and a rolling z-score alerter).

## 2. What the challenge asks for (paraphrased from the challenge page)

- Software that gathers health indicators and enables astronauts to evaluate and act on their health status.
- A visual tool that helps astronauts assess their health and gives guidance on treatments and health improvements.
- Any input is allowed (typed, clicked, camera) if it represents a health indicator. Named indicators: blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, mood.
- Interface ideas given: clickable human body figure with function and status per part, dynamic charts over time, color coding at a glance, simple instructions on how to measure and what risks mean, prompts to take measurements, optional gamification.
- Possible settings: spacecraft, station, rover, base on another planet or moon.
- NASA Human Research Program (HRP) five hazards: radiation, isolation and confinement, distance from Earth, altered gravity, hostile closed environments.
- Questions to answer in the tool: which measurements are possible in space, when a result warrants crew or flight-surgeon attention, which actions prevent a critical condition.

## 3. Product summary

| Item | Decision |
|---|---|
| Primary user | Astronaut (self-assessment). Secondary: flight surgeon reading the same evidence. |
| Platform | Static web app (PWA), works fully offline after first load. Target 1024×768 tablet landscape and 390 px phone. |
| Data | 100% simulated crew data, clearly labeled. Manual entry of measurements and wellbeing check-ins stored on device. |
| Intelligence | Deterministic, explainable code: personal baseline, expected-trajectory offsets, CUSUM change detection, persistence filter, cross-domain pattern rule, evidence-strength tiers. No LLM at runtime. |
| Guidance | Fixed library of sourced guidance text. Never generated freely. |
| Proof | Node script runs 6 scenarios × 100 seeds against 3 systems and writes `public/data/results.json`. The app displays it. |

## 4. Goals and non-goals

Goals (in priority order):
1. A polished astronaut-facing interface that matches the challenge text (body map, color coding, charts, instructions).
2. Evidence-linked alert cards: what changed, evidence, what is not known, what to do now, when to escalate.
3. Visible proof: Scenario Lab (live comparison) and Proof page (aggregate results).
4. Offline operation and mission-setting-aware escalation.
5. Mental wellbeing module (check-in, trends, support prompt, urgent screen).

Non-goals (never build, never claim):
- No diagnosis, no overall health score, no disease prediction, no treatment prescriptions beyond the guidance library.
- No AI chatbot, no AI counseling or therapy.
- No real astronaut data, no claim of medical validity, no claim that NASA lacks this capability.
- No backend server, accounts, or login.
- No hardware, no camera processing (camera input is out of scope).

## 5. Users and scenarios

| Persona | Need | Key screens |
|---|---|---|
| Astronaut (primary) | Know quickly if something is changing, what to do, whether to call ground | Today, Domain detail, Log, Check-in |
| Flight surgeon (secondary) | See evidence and timeline behind a flag | Domain detail, Investigation log |
| Hackathon judge | See relevance, proof, polish in 2 minutes | Today, Scenario Lab, Proof, video |

Demo story (the single story used everywhere): **Crew 1, day 120 of a deep-space transit.** Heart rate and blood pressure drift up slowly, sleep shortens, exercise drops, mood and energy decline. No single reading crosses a fixed threshold. Vigil flags the combined pattern around day 85 to 95, explains the evidence, states what is unknown, lists steps the crew can take now, and says to send a report because a reply will take time.

## 6. Challenge-to-feature traceability

| Challenge element | Feature | Requirement IDs |
|---|---|---|
| Gather indicators | Guided manual entry + simulated crew | FR-1, FR-2 |
| Evaluate health | Detector + domain status + charts | FR-3, FR-4, FR-5 |
| Act | Alert cards with actions and escalation | FR-5, FR-6, FR-7 |
| Clickable body figure | Body map | FR-3 |
| Dynamic charts, color coding | Indicator charts, status chips | FR-4 |
| Simple instructions | Measurement help | FR-1 |
| Isolation hazard, mood | Wellbeing module | FR-8 |
| Radiation hazard | Radiation indicator, solar event scenario | FR-2, FR-9 |
| Distance from Earth | Mission settings, offline mode | FR-6, FR-11 |
| Different environments | Station, lunar base, deep space | FR-6 |

## 7. Functional requirements

Priority: P0 must ship, P1 should ship, P2 stretch. Verification: T = automated test, D = demo check, M = manual review.

| ID | Requirement | Pri | Verify |
|---|---|---|---|
| FR-1 | Log measurements for heart rate, blood pressure (sys/dia), body temperature, blood glucose, sleep hours, exercise minutes. Each field shows how-to-measure text, valid range check, and a color class after entry. | P0 | T, D |
| FR-2 | Three simulated crew members, 30 preflight days + 180 mission days, 11 indicators, deterministic by seed. Default crew and scenarios in `CONTRACTS.md`. | P0 | T |
| FR-3 | Today screen with body map. Five regions or badges map to six domains. Region color = domain status on the viewed day. Tap opens domain detail. | P0 | D |
| FR-4 | Indicator chart: values, expected trajectory, baseline band, change-start marker, missing-data gaps. | P0 | D |
| FR-5 | Alert cards (see `CONTRACTS.md` AlertCard) built only from analysis results and the guidance library. | P0 | T, D |
| FR-6 | Mission setting selector (station, lunar base, deep space) changes escalation text and expected reply delay. | P0 | T, D |
| FR-7 | Supply checklist changes which actions are shown; missing supply shows alternative text. | P1 | T |
| FR-8 | Wellbeing check-in (mood, stress, energy, optional note), trend next to sleep and exercise, support prompt rule, urgent-help screen. Notes stay on device. | P0 | T, D |
| FR-9 | Scenario Lab: choose scenario, seed, setting; scrub days; see when Vigil, threshold system, and z-score system first flag versus known onset. | P0 | D |
| FR-10 | Proof page renders `public/data/results.json` (detection delay, detected count, false alarms per 100 days) for 6 scenarios × 3 systems. No hardcoded numbers. | P0 | T, D |
| FR-11 | Works offline after first load (service worker precache, IndexedDB storage). Offline badge shown. | P0 | D |
| FR-12 | Investigation log: record observation, action taken, who reviewed, note; list and filter. | P1 | T |
| FR-13 | About and limits page, persistent banner "Simulated crew data. Decision support only, not a medical device." | P0 | D |
| FR-14 | "Play demo story" button sets Crew 1, deep space, `slow_drift`, day 120. | P0 | D |
| FR-15 | Timeline scrubber on Today screen: change the viewed day; body map and cards update. | P0 | D |
| FR-16 | Gamification: daily streak and "measurements complete today" ring. | P2 | D |
| FR-17 | Isolation forest as optional fourth system in harness. | P2 | T |

## 8. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | No network request at runtime. No CDN, no remote fonts, no analytics. |
| NFR-2 | Same input and seed always give identical output (tests assert this). |
| NFR-3 | `analyze(dataset, d)` uses only data with day ≤ d (no future leakage; tested). |
| NFR-4 | Full 180-day analysis for one crew under 200 ms in a modern browser; harness for all 600 runs under 5 minutes in Node. |
| NFR-5 | Accessibility: WCAG AA contrast, visible focus, color never the only signal, touch targets ≥ 44 px, reduced motion respected. |
| NFR-6 | `npm run typecheck`, `npm test`, `npm run build` all pass on `main` at every checkpoint. |
| NFR-7 | Initial JS bundle under 1.5 MB gzipped is not required; keep reasonable. First load under 3 s on broadband. |
| NFR-8 | Every medical number and guidance sentence traces to a source id in `src/guidance/sources.ts`. |

## 9. Success criteria

Build is successful when all P0 requirements pass verification, the demo story runs end to end offline, the Proof page shows real harness output, and the video and project page are submitted at least 3 hours before the deadline.

Honest-reporting rule: whatever the harness outputs is what we show, including cases where a baseline wins.

## 10. Judging strategy

Criteria used in 2025 (confirm 2026 on the official page): Impact, Creativity, Validity, Relevance, Presentation.

| Criterion | Our answer |
|---|---|
| Relevance | Every challenge element is visibly covered (section 6). |
| Validity | Seeded scenarios, baselines, tuning/evaluation seed split, tests, stated limits. |
| Creativity | Evidence cards with stated uncertainty, mission-aware escalation, Scenario Lab. |
| Impact | Autonomy for crews far from Earth; reduces review load for ground. |
| Presentation | One story, 60 to 90 second video, live link, offline moment. |

## 11. Video storyboard (60 to 90 seconds)

1. 0–10 s: Problem. "Far from Earth, the crew must spot health changes themselves."
2. 10–35 s: Today screen day 120. Body map, tap cardiovascular, show alert card (observation, evidence, not known, do now, escalate).
3. 35–50 s: Switch mission setting station → deep space; escalation text changes.
4. 50–65 s: Scenario Lab: three systems side by side, Vigil flags earliest with no false alarm.
5. 65–75 s: Wi-Fi off, app still works. Wellbeing check-in shown briefly.
6. 75–90 s: Limits and next steps. Simulated data, not a medical device.

## 12. Assumptions and claims policy

- All reference ranges, adaptation offsets, scenario magnitudes, and radiation rates are **illustrative** unless a source is verified by a human (see `ARCHITECTURE.md` section 6). The UI labels them "illustrative reference".
- We may say: "built from cited public sources", "tested on simulated crews", "explains its evidence".
- We may not say: "validated", "clinically accurate", "NASA lacks this", "diagnoses", "predicts disease".

## 13. Risks

| Risk | Mitigation |
|---|---|
| Three branches diverge | Contracts frozen at hour 1 (`CONTRACTS.md`), owned directories, checkpoints every ~6–8 hours. |
| Agent invents APIs, numbers, or URLs | `RULES.md` stop-and-ask rules; fixed dependency list; fixed numbers; URLs left null until a human fills them. |
| Detector over-flags or under-flags | Tuning-seed protocol (`ARCHITECTURE.md` 6.9); report results honestly. |
| UI looks like every dashboard | `DESIGN.md` body map and scrubber as the one memorable element; evidence cards as procedure sheets. |
| Offline fails at demo time | Build + `preview` offline test at every checkpoint; recorded backup video. |
| Event rules limit pre-written code | Humans confirm; coding starts at event start unless confirmed otherwise. |

## 14. Open items for humans (agents must not fill these in)

1. Verify the 4 non-organizer sources (AHA/ACC, ADA, AASM, general clinical) and paste their URLs into `src/guidance/sources.ts`. The 5 organizer URLs are already in `ARCHITECTURE.md` 7.2.
2. Confirm illustrative numbers or replace them with verified values (list in `ARCHITECTURE.md` 6.2).
3. Confirm 2026 judging criteria and submission requirements.
4. Confirm event rules about code written before the event.
5. Pick a final project name if not Vigil.
6. Get the wellbeing copy reviewed by someone with a health or psychology background if possible.

## 15. Glossary

- **Baseline**: median and robust spread of a person's 30 preflight days for an indicator.
- **Expected trajectory**: baseline plus the illustrative phase offset for the mission day.
- **z**: (value − expected) / baseline sigma.
- **CUSUM**: cumulative sum of z minus a slack, used to detect small persistent shifts.
- **Persistence**: at least 4 of the last 7 observed days shifted in the concern direction.
- **Evidence strength**: low, moderate, high by number of independent indicators involved. Not a probability.
- **Domain**: one of six groups of indicators shown on the body map.
- **Mission setting**: station, lunar base, deep space.
