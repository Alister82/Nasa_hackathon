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

- Current task: E11 (integration support; waiting for P2/G10 or P3/U12 merge or MEMORY.md request)
- Done: Checkpoint 0 (E0.1–E0.6). E1 `rng.ts`. E2 simulator. E3 six scenarios with ground truth. E4 degradation and merge/truncate. E5 detector with baseline, CUSUM, persistence, spike, data quality, radiation rule, adaptation note, domains, findings, no-future-leak test. E6 three systems plus shared radiation rule. E7 metrics. E8 tuning on seeds 1000–1099 and frozen constants (H_WATCH × H_FLAG grid in `scripts/tune.ts`). E9 harness and `public/data/results.json`. E10 performance: `analyze(180)` 6.1 ms on slow_drift seed 42, test bound 500 ms. Checkpoint 2 merged to `main`, tag `checkpoint-2`. E8 fix: restored `H_WATCH` leg to `scripts/tune.ts` so full H_WATCH × H_FLAG × PERSIST_Z × PERSIST_MIN_DAYS grid is printed reproducibly (H_WATCH [3,4] × H_FLAG [6,8,10,12]).
- Blocked by: (none; E12 isolation forest on hold until P2/G10 and P3/U12 P0/P1 tasks complete)
- Notes: tuning chose `CUSUM_K` 1.25, `H_FLAG` 8, `PERSIST_Z` 1.0, `PERSIST_MIN_DAYS` 5, with `H_WATCH` 3 unchanged (0.66 false per 100 days on tuning normal, 100 percent slow_drift detection, median delay 17 days); see section 7. Scaffold stylesheet is `src/ui/styles/app.css` (Tailwind entry); P3 owns `src/ui/styles` from checkpoint 0 on. Installed majors within ARCHITECTURE 2: typescript 5.9.3, vite 5.4.21, vitest 2.1.9. Checkpoint 1 was not tagged separately: E1–E9 were finished in one continuous session, so the engine landed on `main` in the checkpoint 2 merge (tag `checkpoint-2`).

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

- [P1 → P2, P3] checkpoint 2 merged to `main` (tag `checkpoint-2`): `analyze`, `generateScenario`, `mergeEntries`, `truncateDataset`, `SYSTEMS`, and `buildResultsFile` are live in `src/engine`, and `public/data/results.json` is committed. Rebase `feat/guidance` and `feat/ui` on `main`.

## 6. Contract change proposals (see `RULES.md` section 6)

(none yet)

## 7. Engine tuning record (P1 fills in)

| Item | Value |
|---|---|
| Tuning seeds | 1000–1099 |
| Candidate `H_WATCH` values tried | 3, 4 |
| Candidate `H_FLAG` values tried | 6, 8, 10, 12 |
| Final `H_WATCH`, `H_FLAG`, other changes | `H_WATCH` 3, `H_FLAG` 8, `CUSUM_K` 1.25 (from 0.5), `PERSIST_Z` 1.0 (from 0.75), `PERSIST_MIN_DAYS` 5 (from 4) |
| Vigil false alarms per 100 days on tuning `normal_adaptation` | 0.66 |
| Vigil detection rate on tuning `slow_drift` | 100 percent (100/100 seeds), median delay 17 days |
| Commit hash of `engine: freeze detector config` | `d2fbb30` |
| Evaluation run date and commit of `results.json` | 2026-11-14, this results commit on `feat/engine` |

Note: with the start constants (`CUSUM_K` 0.5, `H_FLAG` 6, `PERSIST_Z` 0.75, `PERSIST_MIN_DAYS` 4) the grid gave 4.42 false episodes per 100 days on normal crews. The 30-day MAD often lands below the simulated within-person SD (for example mood sigma 0.25 against a simulated 0.40), so z is inflated and the CUSUM drifts without a true change. The frozen row (`CUSUM_K` 1.25, `H_FLAG` 8, `PERSIST_Z` 1.0, `PERSIST_MIN_DAYS` 5) gave 0.66 false per 100 days, 100 percent slow_drift detection, median delay 17 days. Metric definitions were not changed.

Process note: an intermediate evaluation run was made with a mis-frozen config (`CUSUM_K` 0.5) and discarded; the constants above were selected only from tuning-seed grids, and the committed evaluation run is the one after this freeze.

Evaluation seeds 1–100 (`deep_space`), from `results.json`: Vigil false alarms per 100 days 0.69 normal, 0.68 slow_drift, 0.71 sensor_fault, 0.73 blackout_drift, 0.72 solar_event, 0.84 acute_fever. Detection 100/100 for slow_drift (median 16 days), blackout_drift (20), solar_event (0), acute_fever (4). Fixed thresholds: 2.17–2.58 false, 97–100 detected. Rolling z-score: 6.52–6.92 false, 100 detected, slow_drift median 5.5 days. Honest reading: Vigil has the fewest false alarms; the z-score detects slow_drift earlier at a much higher false-alarm cost.

## 8. Dependency log (any deviation from `ARCHITECTURE.md` section 2)

(none yet; record package, version installed, and reason if a different version was needed)

## 9. Known failures and risks (exact error text, steps, owner)

- [P1] Resolved tension, 2026-11-14: TASKS E5 expects a +1.5 sigma step to flag within about 12 days, but the ARCHITECTURE 6.9 tuning goal needs `CUSUM_K` 1.25 to reach 1.0 or fewer false alarms per 100 days on normal crews; at that slack a +1.5 sigma step takes about 32 days. Per the priority order in RULES 13, ARCHITECTURE wins: the frozen config follows 6.9, and the detector unit test exercises that mechanic with the ARCHITECTURE 6.6 start constants. The frozen config's own detection delay is reported from the harness, not hidden.

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
2026-11-14 10:45 [P1] E1–E9: engine, systems, metrics, tuned and frozen constants, harness written; next checkpoint 2 merge and E10 performance.
2026-11-14 10:55 [P1] Checkpoint 2 merged (tag `checkpoint-2`): frozen detector config `CUSUM_K` 1.25 / `H_FLAG` 8 / `PERSIST_Z` 1.0 / `PERSIST_MIN_DAYS` 5, evaluation results on seeds 1–100 committed; E10 measured 6.1 ms. Next: E11 support, no open requests.
2026-11-14 14:23 [P1] E8 fix: restored H_WATCH leg to scripts/tune.ts; grid is now H_WATCH [3,4] × H_FLAG [6,8,10,12] × PERSIST_Z × PERSIST_MIN_DAYS. typecheck 0, 294/294 tests pass. MEMORY.md updated. Pushing to feat/engine and main. E11 support mode: waiting on P2/G10 or P3/U12. E12 on hold.
