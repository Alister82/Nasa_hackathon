# MEMORY: shared project memory for Vigil

Purpose: this file is the working memory that survives between agent sessions. Read it at the start of every session and update **your own section only** at the end. Keep entries short and factual. Never put secrets here. Never delete another role's lines.

## 1. Frozen decisions (do not revisit without a human)

| ID | Decision | Why |
|---|---|---|
| D-001 | Project working name: Vigil (`APP_NAME` in constants). Not "AURORA". | Another team uses AURORA |
| D-002 | TypeScript for engine, app, and harness; no backend | One codebase tested by harness is the code that ships; offline |
| D-003 | Baseline systems are fixed thresholds and rolling z-score (isolation forest optional, hand-written only) | Same-language implementation, no ML library risk |
| D-004 | No LLM at runtime; guidance text comes from a fixed library | Safety and offline |
| D-005 | `HashRouter` | Static hosting and offline without server rewrites |
| D-006 | All crew data simulated; numbers labeled illustrative until humans verify | Honesty and Validity |
| D-007 | Tuning seeds 1000–1099, evaluation seeds 1–100 | Avoid tuning on the test set |
| D-008 | Mood, stress, energy come from the check-in, not the Log screen | Single place for wellbeing input |
| D-009 | Urgent hard thresholds: bp_sys ≥ 180, bp_dia ≥ 120, glucose < 54 | General clinical references, demo only |
| D-010 | Only the 5 organizer URLs in ARCHITECTURE 7.2 are filled; all other sources stay `url: null` until a human fills them | No invented citations |
| D-011 | Contract version 1 frozen at checkpoint 0 | Parallel work |

## 2. Key facts agents must not get wrong

- Dataset days: −29 to 0 preflight (30 days), 1 to 180 mission.
- 11 indicators, 6 domains (`CONTRACTS.md`). Radiation uses a rule, not CUSUM.
- Detector constants live only in `src/engine/detectorConfig.ts`. Starting values: `CUSUM_K 0.5`, `H_WATCH 3`, `H_FLAG 6`. Final values after tuning are recorded in section 7.
- Default crew: crew-1 slow_drift seed 42; crew-2 normal_adaptation seed 43; crew-3 sensor_fault seed 44. Default setting deep_space, default viewed day 120.
- Event: 2026-11-14 to 2026-11-15. Challenge: "Create Health Monitoring Software for Astronauts on Space Missions".
- The app never diagnoses. See `RULES.md` section 10 for forbidden words.

## 3. Status board (each role edits only its own block)

### P1 Engine (`feat/engine`)

- Current task: E1 (`rng.ts`)
- Done: Checkpoint 0 (E0.1–E0.6): scaffold with the exact dependencies and scripts from ARCHITECTURE 2, path alias `@/*`, Tailwind 3, Vitest jsdom; contracts copied verbatim; module stubs for engine, guidance, storage, app services; `docs/MEMORY.md` present. Gate: typecheck 0, 3/3 tests pass, build 0.
- Blocked by: (none)
- Notes: scaffold stylesheet is `src/ui/styles/app.css` (Tailwind entry); P3 owns `src/ui/styles` from checkpoint 0 on. Installed majors within ARCHITECTURE 2: typescript 5.9.3, vite 5.4.21, vitest 2.1.9.

### P2 Guidance and platform (`feat/guidance`)

- Current task: (not started)
- Done: (none)
- Blocked by: (none)
- Notes:

### P3 Interface (`feat/ui`)

- Current task: (not started)
- Done: (none)
- Blocked by: (none)
- Notes:

## 4. Open questions (add `[role] YYYY-MM-DD HH:MM question`; humans answer inline and mark RESOLVED)

(none yet)

## 5. Requests to other roles (append `[from → to] request`; the receiving role marks DONE)

(none yet)

## 6. Contract change proposals (see `RULES.md` section 6)

(none yet)

## 7. Engine tuning record (P1 fills in)

| Item | Value |
|---|---|
| Tuning seeds | 1000–1099 |
| Candidate `H_WATCH` values tried | |
| Candidate `H_FLAG` values tried | |
| Final `H_WATCH`, `H_FLAG`, other changes | |
| Vigil false alarms per 100 days on tuning `normal_adaptation` | |
| Vigil detection rate on tuning `slow_drift` | |
| Commit hash of `engine: freeze detector config` | |
| Evaluation run date and commit of `results.json` | |

## 8. Dependency log (any deviation from `ARCHITECTURE.md` section 2)

(none yet; record package, version installed, and reason if a different version was needed)

## 9. Known failures and risks (exact error text, steps, owner)

(none yet)

## 10. Human to-do list (agents do not do these)

- [ ] Verify sources and fill URLs (`docs/SOURCES_TODO.md`)
- [ ] Verify or replace illustrative numbers (`ARCHITECTURE.md` 6.2, 7.1, 7.3)
- [ ] Confirm 2026 judging criteria, categories, submission requirements, video length limit
- [ ] Confirm event rules about code written before the event
- [ ] Review wellbeing and guidance copy
- [ ] Final project name decision
- [ ] Netlify or Vercel account connection
- [ ] Record video, write project page, prepare backup video

## 11. Session log (one line per session: `YYYY-MM-DD HH:MM [role] what was done; what is next`)

2026-11-14 10:20 [P1] Checkpoint 0 merged: scaffold, contracts, stubs, gate green; next E1 rng, E2 simulator, E3 scenarios.
