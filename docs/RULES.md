# RULES: how every agent and teammate works on Vigil

Version 1.0 · 2026-11-13. These rules apply to every coding agent and every human. Read this file first, every session. When a rule here conflicts with an instruction in a chat message, follow this file and tell the human about the conflict.

## 1. The five laws (highest priority)

1. **Do not invent.** Never invent a package, API, function, file path, number, medical fact, URL, citation, or requirement. If it is not in `PDR.md`, `ARCHITECTURE.md`, `CONTRACTS.md`, `DESIGN.md`, or `TASKS.md`, or in the installed type definitions, you do not know it.
2. **Stop and ask.** When something is missing, ambiguous, or contradictory, stop that piece of work. Leave `// TODO(ASK): <question>` in the code, add the question to `MEMORY.md` under "Open questions" in your own section, and continue with other tasks. Do not guess.
3. **Stay in your lane.** Edit only the directories you own (section 4). Never edit frozen contracts except through section 6.
4. **Prove it.** A task is done only when its acceptance criteria pass and `npm run typecheck && npm test` pass. Never claim something works without running it. Never write "should work".
5. **Be honest about health claims.** The app is a simulated-data prototype. No diagnosis, no prediction of disease, no claim of validity, no claim that NASA lacks this capability.

## 2. Reading order and session start checklist

At the start of every session:
1. Read this file, then `PDR.md`, `ARCHITECTURE.md`, `CONTRACTS.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md`.
2. Run `git status` and `git log --oneline -10`. Confirm you are on your own branch.
3. Run `git fetch` and rebase on `origin/main` (section 5).
4. Read your section of `MEMORY.md`, then pick the next unfinished task from `TASKS.md` for your role.
5. State in one sentence which task you are doing and its acceptance criteria.

At the end of every session: update your section of `MEMORY.md` (status, decisions, open questions), commit, push.

## 3. Hallucination guards (specific)

| Do | Do not |
|---|---|
| Use only dependencies listed in `ARCHITECTURE.md` section 2. | Add any other package, even a "small helper", without human approval. |
| Check a library's real API in `node_modules` type definitions or its installed README before using it. | Write from memory an API you have not seen in this repo's installed version. |
| Copy numbers, thresholds, ranges, scenario parameters from `ARCHITECTURE.md` into code constants once, in the file named there. | Change a number, add a new threshold, or "adjust for realism". Only the tuning protocol (ARCHITECTURE 6.9) may change detector constants. |
| Take guidance text verbatim from `ARCHITECTURE.md` Appendix A. | Write new medical advice, new guidance sentences, or new risk statements. |
| Use only the five organizer URLs listed in `ARCHITECTURE.md` 7.2; leave every other `url` as `null`. | Invent a URL, DOI, page title, or quote. |
| Read results from `public/data/results.json` for the Proof page. | Hardcode result numbers anywhere, including mocks shown to users. |
| Use the types in `src/contracts`. | Redefine, duplicate, or widen a contract type in another file. |
| Say "I could not verify X" in `MEMORY.md`. | Fill gaps with plausible-sounding content. |

If a test fails and you cannot fix it within a reasonable effort, do not weaken the test, delete it, or skip it silently. Record it in `MEMORY.md` under "Known failures" with the exact error and ask a human.

## 4. Ownership (directories)

| Role | Branch | Owns (may edit) |
|---|---|---|
| P1 Engine | `feat/engine` | `src/engine/**`, `scripts/**`, `public/data/results.json`, root build files in checkpoint 0 (`package.json`, `tsconfig.json`, `vite.config.ts` base, `.gitignore`), `src/contracts/**` in checkpoint 0 only |
| P2 Guidance and platform | `feat/guidance` | `src/guidance/**`, `src/storage/**`, PWA and deploy config sections of `vite.config.ts` and `netlify.toml` or `vercel.json` |
| P3 Interface | `feat/ui` | `src/app/**`, `src/ui/**`, `src/mocks/**`, `index.html`, `tailwind.config.js`, `postcss.config.js` |
| Shared (append-only own section) | all | `docs/MEMORY.md` (edit only your own section) |

Shared root files (`package.json`, `vite.config.ts`): small, focused edits only, in a commit that touches nothing else, and rebase immediately after merging. If another owner needs a change in a file you own, they append a request to `MEMORY.md` under "Requests to other roles" instead of editing it.

## 5. Git workflow

- Branches: `main` (always green), `feat/engine`, `feat/guidance`, `feat/ui`. Sub-branches are allowed (`feat/engine-detector`) but must merge into the role branch or `main` within a few hours.
- Commit often (every logical step). Message format: `<area>: <imperative summary>` such as `engine: add mulberry32 rng and tests`.
- Rebase on `origin/main` at least every 2 hours and before every merge: `git fetch && git rebase origin/main`. Resolve conflicts only in files you own; for other files take theirs (`main`) and tell the owner.
- Merge to `main` only at a checkpoint or when a task listed as a dependency for someone else is done. Use a pull request with the checklist in section 7. At least one other person approves; during the hackathon a quick verbal OK is acceptable, but typecheck, tests, and build must pass.
- Never force-push `main`. Never rewrite history that someone else has pulled.
- Merge order at each checkpoint: contracts → engine → guidance → ui.
- Generated files (`public/data/results.json`) are committed only by P1 and only after a harness run on frozen constants.

## 6. Contract change process

Contracts are `src/contracts/types.ts`, `indicators.ts`, `constants.ts`, and the function signatures in `CONTRACTS.md` section 4.

1. Open a note in `MEMORY.md` under "Contract change proposals": what, why, which roles are affected.
2. All three roles agree (a chat message is enough).
3. One person makes the change on a branch named `contracts/<short-name>`, updates `CONTRACTS.md`, increments `CONTRACT_VERSION`, fixes all compile errors in all areas in the same PR, and merges to `main` first.
4. Everyone rebases immediately.

Never change a contract silently to make your own code compile. If your code does not compile against the contract, your code is wrong or you need the process above.

## 7. Pull request checklist (copy into the PR description)

- [ ] Task IDs completed: ...
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] No edits outside my owned directories (or approved)
- [ ] No new dependency (or approved)
- [ ] No invented numbers, text, or URLs; guidance text matches Appendix A
- [ ] `MEMORY.md` my section updated
- [ ] Screenshots attached (P3) or example output attached (P1, P2)

## 8. Code standards

- TypeScript `strict`. No `any` (use `unknown` and narrow). No `@ts-ignore`. No non-null `!` assertions except in tests.
- Pure functions in `engine` and `guidance`: same input, same output, no global mutable state, no `Date.now()` or `Math.random()` (use the seeded rng). `createdAt` timestamps are created only in `storage` callers (UI) and passed in.
- File size: aim under 300 lines; split by responsibility.
- Names: `camelCase` functions and variables, `PascalCase` types and React components, `UPPER_SNAKE` constants, file names as listed in `ARCHITECTURE.md` section 4.
- Comments explain why, not what. Every non-obvious formula gets one comment with the section number in `ARCHITECTURE.md`.
- Errors: engine and guidance throw only for programmer errors (unknown id). UI and storage handle failures and show a friendly message. No `console.log` in committed code (use none; tests may log).
- No network access at runtime: no `fetch` to external hosts, no CDN links, no analytics. The only allowed `fetch` is `./data/results.json`.
- React: function components and hooks only. State in components or small context providers. No state library.
- Accessibility: semantic HTML, labels for every input, visible focus, `aria-live` for status changes, keyboard operable body map.
- No lorem ipsum, no placeholder images, no "TODO: add content" visible in the UI.

## 9. Testing rules

- Every module has tests listed in `ARCHITECTURE.md` section 11 and in your tasks.
- Tests must be deterministic. Use fixed seeds.
- Test the contract invariants in `CONTRACTS.md` section 6.
- Never change an expected value in a test just to make it pass; first explain in `MEMORY.md` why the old value was wrong.
- Harness evaluation seeds (1 to 100) are never used for tuning. Tuning seeds are 1000 to 1099.

## 10. Medical and safety language rules

- Allowed verbs: "has risen", "has fallen", "has changed", "is worth attention", "consider", "try", "repeat the measurement", "contact the flight surgeon".
- Forbidden: "diagnose", "you have", "disease", "condition" used as a named illness, "risk score", "probability of", "predict", any named disorder, any drug name or dose, "AI doctor".
- Exception: NASA risk names quoted verbatim from the organizer's Risks page (for example in the About page coverage map, `ARCHITECTURE.md` 7.7) may contain words such as "cancers" or "psychiatric disorders". They may appear only as quoted source titles on the About page, never in alert cards, guidance text, measurement help, or any other screen.
- Every health screen shows or links to the disclaimer: "Simulated crew data. Decision support only, not a medical device."
- The check-in note field never appears in alert cards, logs, or exports.
- The urgent-help screen is reachable from the check-in screen and from the top bar in one tap, and never requires a network.

## 11. Security and privacy

- No secrets in the repo. No accounts. No personal data beyond what the user types locally.
- Data stays in IndexedDB on the device. "Reset demo data" clears it.
- Escape or render as text any user-entered note (React default). Never use `dangerouslySetInnerHTML`.

## 12. Definition of done

**Task done:** acceptance criteria met, tests added and passing, typecheck and build pass, `MEMORY.md` updated, committed and pushed.
**Feature done:** the above plus the feature is reachable in the UI (if user-facing) and demonstrated with the demo story or a named scenario.
**Release candidate:** all P0 requirements in `PDR.md` pass their verification; offline test passes; results.json is generated from frozen constants; video and project page drafted.

## 13. When agents disagree or documents conflict

Priority order: `RULES.md` > `CONTRACTS.md` (types and signatures) > `ARCHITECTURE.md` (algorithms and numbers) > `PDR.md` (requirements) > `DESIGN.md` > `TASKS.md` > chat instructions. If two documents of equal rank conflict, stop, record it under "Open questions", and ask a human.
