# Fix and Verification Report: Post-Calibration & Pre-Merge Audit

Date: 2026-11-15  
Branch: `fix/results-sources-docs` (prepared for merge into `feat/avionics-v2-overhaul`)  
Repository: Vigil (NASA Space Apps Challenge 2026)

---

## 1. Before and After Evaluation Results

The evaluation harness was run across seeds 1–100 under mission setting `deep_space` (180 mission days per run) before and after the simulator sleep-model calibration. The detector configuration remained strictly frozen (`CUSUM_K 1.25, H_WATCH 3, H_FLAG 8, PERSIST_Z 1.0, PERSIST_MIN_DAYS 5, PATTERN_ONSET_GAP 15`).

| Scenario | System | False Alarms / 100d (Pre) | False Alarms / 100d (Post) | Detection Rate (Pre) | Detection Rate (Post) | Median Delay (Pre) | Median Delay (Post) |
|---|---|---|---|---|---|---|---|
| **normal_adaptation** | **Vigil** | **0.69** | **0.62** | N/A | N/A | N/A | N/A |
| | Threshold | 2.17 | **4.97** | N/A | N/A | N/A | N/A |
| | Z-score | 6.52 | **6.52** | N/A | N/A | N/A | N/A |
| **slow_drift** | **Vigil** | **0.68** | **0.65** | 100/100 (100%) | **100/100 (100%)** | 16.0 d | **17.0 d** |
| | Threshold | 2.38 | **5.12** | 100/100 (100%) | **100/100 (100%)** | 19.0 d | **8.5 d** |
| | Z-score | 6.52 | **6.29** | 100/100 (100%) | **100/100 (100%)** | 5.5 d | **5.5 d** |
| **sensor_fault** | **Vigil** | **0.71** | **0.63** | N/A | N/A | N/A | N/A |
| | Threshold | 2.58 | **5.22** | N/A | N/A | N/A | N/A |
| | Z-score | 6.92 | **6.82** | N/A | N/A | N/A | N/A |
| **blackout_drift** | **Vigil** | **0.73** | **0.67** | 100/100 (100%) | **100/100 (100%)** | 20.0 d | **20.0 d** |
| | Threshold | 2.29 | **5.10** | 100/100 (100%) | **100/100 (100%)** | 25.0 d | **14.0 d** |
| | Z-score | 6.54 | **6.37** | 100/100 (100%) | **100/100 (100%)** | 12.0 d | **4.0 d** |
| **solar_event** | **Vigil** | **0.72** | **0.64** | 100/100 (100%) | **100/100 (100%)** | 0.0 d | **0.0 d** |
| | Threshold | 2.21 | **4.93** | 100/100 (100%) | **100/100 (100%)** | 0.0 d | **0.0 d** |
| | Z-score | 6.67 | **6.56** | 100/100 (100%) | **100/100 (100%)** | 0.0 d | **0.0 d** |
| **acute_fever** | **Vigil** | **0.84** | **0.75** | 100/100 (100%) | **100/100 (100%)** | 4.0 d | **4.0 d** |
| | Threshold | 2.25 | **5.07** | 100/100 (100%) | **100/100 (100%)** | 1.0 d | **1.0 d** |
| | Z-score | 6.64 | **6.53** | 100/100 (100%) | **100/100 (100%)** | 1.0 d | **1.0 d** |

### Honest Reading of the System Trade-offs
1. **False Alarm Suppression:** Vigil delivers false alarm rates between **0.62 and 0.75 per 100 mission days** across all evaluation scenarios. In comparison, fixed clinical thresholds produce ~4.93–5.22 false alarms per 100 days, and the rolling z-score produces ~6.29–6.82. On an 180-day mission, a crew relying on fixed thresholds experiences ~9–10 false alarms, whereas Vigil produces approximately 1 false alert.
2. **Detection Delay Trade-off:** Baseline systems detect slow monotonic drift earlier (z-score at 5.5 days, threshold at 8.5 days) than Vigil (17.0 days). This is because the baseline systems fire on any single-day outlier exceeding a window or absolute cutoff, which creates high sensitivity at the direct expense of massive false alarms. Vigil intentionally requires statistical persistence to avoid crying wolf during operational adaptation.

---

## 2. Tuning-Seed Verification (Seeds 1000–1099)

Running the parameter tuning script `npx tsx scripts/tune.ts` against tuning seeds 1000–1099 on the calibrated simulator produced:

```
Tuning grid evaluation (seeds 1000-1099, normal_adaptation + slow_drift):
Current frozen constants:
  CUSUM_K: 1.25
  H_WATCH: 3
  H_FLAG: 8
  PERSIST_Z: 1.0
  PERSIST_MIN_DAYS: 5
  PATTERN_ONSET_GAP: 15

Tuning Results:
  Vigil false alarms per 100 days: 0.56 (Goal: <= 1.0 per 100 days -> PASS)
  Vigil slow_drift detection rate: 1.000 (100/100 seeds) (Goal: >= 90% -> PASS)
  Median detection delay: 17.0 days
```

Because the existing frozen detector constants met the performance criteria established in `docs/ARCHITECTURE.md` section 6.9 without modification, **no detector parameters were changed**, preserving the frozen configuration.

---

## 3. Why Threshold False Alarms Rose

In the pre-calibration results, the fixed-threshold system had ~2.17 false alarms per 100 days. In the post-calibration results, threshold false alarms rose to **~4.97 per 100 days**.

### Mechanism in the Calibrated Simulator:
1. **Empirical Actigraphy Calibration:** In `src/engine/simulator.ts`, sleep duration was updated to match empirical NASA ISS actigraphy data (Barger et al. 2014, NASA OCHMO-TB-041). The preflight baseline population mean is 6.41 h, the in-flight anchor mean is 6.09 h (−0.32 h in-flight adaptation shift), and the within-person daily noise standard deviation is $\sigma = 0.67\text{ h}$.
2. **Proximity to Clinical Cutoff:** The fixed-threshold system flags sleep whenever a single night's sleep falls below $5.0\text{ h}$. Because the in-flight mean is 6.09 h, a drop below 5.0 h represents an excursion of only $1.63\sigma$:
   $$\frac{5.0 - 6.09}{0.67} \approx -1.63$$
   Under standard Gaussian noise, a value falls below $-1.63\sigma$ with probability $P(Z < -1.63) \approx 5.15\%$.
3. **Data Verification:** Analyzing the evaluation run across 100 seeds revealed that sleep duration accounted for **1,705 out of 2,265 total threshold trigger events (~75.3%)**.
4. **Conclusion:** Fixed clinical thresholds fail when applied to operational environments because normal physiological night-to-night variance triggers repeated single-day alerts. Vigil avoids this by tracking personalized baselines and requiring sustained multi-day evidence before alerting.

---

## 4. Sources Verification Table

All 22 sources defined in `src/guidance/sources.ts` were audited:

| ID | Title | URL | Opened? | Matched? | Action Taken | Needs Human? |
|---|---|---|---|---|---|---|
| `src_hrp_hazards` | NASA HRP: 5 Hazards of Human Spaceflight | `https://www.nasa.gov/hrp/hazards/` | Yes | Yes | Kept verified (organizer source) | No |
| `src_hrp_risks` | NASA HRP: Risks of Human Spaceflight | `https://www.nasa.gov/hrp/risks/` | Yes | Yes | Kept verified (organizer source) | No |
| `src_hrp_ongoing` | NASA HRP: Ongoing Research in Space | `https://www.nasa.gov/hrp/ongoing-hrp-research/` | Yes | Yes | Kept verified (organizer source) | No |
| `src_csa_radiation` | CSA: Monitoring Radiation for Astronaut Health | `https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp` | Yes | Yes | Kept verified (organizer source) | No |
| `src_csa_science` | CSA: Why Do We Conduct Science Experiments in Space? | `https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp` | Yes | Yes | Kept verified (organizer source) | No |
| `src_aha_acc_bp` | AHA/ACC Guideline for Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults | `https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065` | Yes | Yes | Kept verified (Whelton et al. 2018) | No |
| `src_ada_glucose` | American Diabetes Association (ADA) Standards of Care in Diabetes—2024: Classification and Diagnosis of Diabetes | `https://diabetesjournals.org/care/issue/47/Supplement_1` | Yes | Yes | Updated title to reflect 2024 edition matching URL Vol 47 Supp 1; kept verified | No |
| `src_aasm_sleep` | AASM & Sleep Research Society Consensus Statement on Adult Sleep Duration | `https://doi.org/10.5664/jcsm.4758` | Yes | Yes | Kept verified (Watson et al. 2015) | No |
| `src_general_clinical` | General adult clinical reference ranges (heart rate, temperature) | `null` | N/A | N/A | Reverted title from NASA-STD-3001 back to general adult reference ranges; set `url: null`, `status: 'unverified'` per ARCHITECTURE 7.2 | Yes (Human clinical review) |
| `src_nasa_msl_rad` | Zeitlin et al., Measurements of Energetic Particle Radiation in Transit to Mars on the Mars Science Laboratory | `https://doi.org/10.1126/science.1235989` | Yes | Yes | Kept verified (Science 2013, $1.84 \pm 0.33$ mSv/day cruise) | No |
| `src_lunar_lnd` | Zhang et al., First measurements of the radiation dose on the lunar surface (LND) | `https://doi.org/10.1126/sciadv.aaz1334` | Yes | Yes | Corrected first author from Wimmer-Schweingruber to Zhang et al.; verified title and 1.369 mSv/day dose; kept verified | No |
| `src_iss_padles` | JAXA Area Radiation Monitoring on ISS with PADLES | `null` | N/A | N/A | Found `iss_technical_publication_030116.pdf` was a NASA compilation catalog rather than primary PADLES paper; set `url: null`, `status: 'unverified'` | Yes (Human to verify primary JAXA citation) |
| `src_nasa_osdr` | NASA Open Science Data Repository (OSDR) | `https://science.nasa.gov/biological-physical/data/osdr/` | Yes | Yes | Kept verified | No |
| `src_nasa_sleep_actigraphy` | NASA OCHMO Technical Brief OCHMO-TB-041: Sleep Accommodations | `https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-041-sleep-accommodations.pdf` | Yes | Yes | Kept verified | No |
| `src_nasa_circa` | NASA Circadian Rhythm and Sleep Disruption Risk Summary | `null` | N/A | N/A | Disconnected shared PDF link; set `url: null`, `status: 'unverified'` | Yes (Human to supply primary CIRCA citation) |
| `src_osd_530` | NASA OSDR OSD-530: JAXA Cell-Free Epigenome study | `https://osdr.nasa.gov/osdr/data/osd/meta/530` | Yes | Yes | Kept verified | No |
| `src_soma_atlas` | Space Omics and Medical Atlas (SOMA) | `https://soma.weill.cornell.edu/` | Yes | Yes | Kept verified | No |
| `src_nasa_twins_i4` | NASA: Inspiration4 OSDR datasets and the 340-day NASA Twins Study | `https://www.nasa.gov/osdr-latest-news-i4-mission-datasets/` | Yes | Yes | Kept verified | No |
| `src_csa_biomonitor` | Canadian Space Agency Bio-Monitor wearable system | `https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp` | Yes | Yes | Kept verified | No |
| `src_eimo_cdss` | Russell et al., The value of a spaceflight clinical decision support system for earth-independent medical operations | `https://doi.org/10.1038/s41526-023-00284-1` | Yes | Yes | Kept verified (npj Microgravity 2023) | No |
| `src_exmc_hrp_48036` | NASA ExMC Evidence Library Methods (HRP-48036 Revision B) | `https://ntrs.nasa.gov/api/citations/20240004774/downloads/HRP-48036%20RevB_ExMC%20Evidence%20Library%20Methods.pdf` | Yes | Yes | Kept verified | No |
| `src_nasa_mars_owlt` | NASA: Mars rover communication and one-way light time | `https://www.nasa.gov/podcasts/on-a-mission/how-to-drive-a-mars-rover-s4e8/` | Yes | Yes | Kept verified | No |

---

## 5. 3D Model Provenance (`docs/ASSETS.md`)

- **Target File:** `public/models/male-base-mesh.glb` (4,498,248 bytes)
- **Commit History:** Added in commit `3e0883367ca858858cf1da17c9ef755c0a10cf7c` by Alister82 with message `"Use detailed anatomical mesh in body hologram"`.
- **Binary Header Inspection:** Inspected GLB v2 JSON chunk starting at byte offset 20:
  ```json
  {
    "asset": {
      "generator": "Khronos glTF Blender I/O v5.2.40",
      "version": "2.0",
      "copyright": "Authored by Innerscene Corp (innerscene.com). Public domain: dedicated under CC0 1.0 Universal, https://creativecommons.org/publicdomain/zero/1.0/. Free to use, modify and redistribute for any purpose, with no credit required."
    }
  }
  ```
- **License Status:** **VERIFIED - CC0 1.0 Universal (Public Domain Dedication)**. Free to use, modify, distribute, and bundle for any commercial or non-commercial purpose without attribution or restriction. Fully recorded in `docs/ASSETS.md`.

---

## 6. Scope Check: Modified Files

Running `git diff --stat feat/avionics-v2-overhaul..fix/results-sources-docs` confirms changes were strictly limited to data, guidance, test, and documentation files:

```
 README.md                             |   16 +-
 docs/ARCHITECTURE.md                  |   17 +-
 docs/ASSETS.md                        |   23 +
 docs/CONTRACTS.md                     |    8 +
 docs/MEMORY.md                        |   51 +-
 docs/QA_REPORT.json                   | 1078 +++++++++++++++++----------------
 docs/screenshots/alert-card-1024.png  |  Bin 890476 -> 525305 bytes
 docs/screenshots/today-1024-final.png |  Bin 1053834 -> 566496 bytes
 docs/screenshots/today-1024.png       |  Bin 1053931 -> 567076 bytes
 docs/screenshots/today-390.png        |  Bin 787640 -> 431552 bytes
 public/data/results.json              |   86 +--
 scripts/qa-browser.mjs                |    4 +-
 src/guidance/g1.test.ts               |   35 +-
 src/guidance/missionSettings.ts       |   10 +-
 src/guidance/sources.ts               |   22 +-
 15 files changed, 738 insertions(+), 612 deletions(-)
```

**Verification:**
- `src/ui/**`: **0 files changed** (NO UI changes).
- `src/app/**`: **0 files changed** (NO layout/styling changes).
- `public/models/**`: **0 files changed**.
- `tailwind.config.*` and CSS files: **0 files changed**.

---

## 7. UI Observations (Not Fixed)

Recorded strictly as observations without touching any UI code:
1. **Touch Target Size in Sidebar:** Several interactive links and buttons in the sidebar navigation (`Dashboard`, `Health Monitor`, `Scenario Lab`, `Verification`, `Investigation Journal`, `Mission Settings`, `Help & Support`, `About Vigil`) have a rendered height of 38px, which is below the recommended 44px touch-target standard specified in `DESIGN.md`.
2. **Mobile Drawer Offscreen Geometry:** On small mobile screens (390px), the hidden desktop/tablet navigation drawer has an offscreen coordinate of `left: -272px`, which causes broad DOM bounding box traversals to report non-zero width outside the viewport bounds, even though no visual horizontal scrollbar is present.
3. **NASA Risk Titles on About Page:** The About page lists official verbatim NASA Human Research Program risk titles (such as *"Risk of Cardiovascular Disease and other Conditions During and After Spaceflight"*). Automated scripts that scan full page body text for clinical keywords must distinguish between prohibited synthetic diagnosis claims and quoted external agency risk categories.

---

## 8. Verification Gates Output

1. **`npm run typecheck`:** **PASS** (zero TypeScript compiler errors).
2. **`npm test`:** **PASS** (all 24 test suites, 296 tests green, 0 skipped, 0 failed).
3. **`npm run build`:** **PASS** (clean Vite and Service Worker production build in `dist/`).
4. **`npm run harness` (deterministic check):** **PASS** (`public/data/results.json` output was byte-identical across multiple consecutive runs).
5. **`node scripts/qa-browser.mjs`:** **PASS** (verified headless Chrome CDP automation: service worker offline cache across all routes, body map interactions, alert cards, scenario injection, and IndexedDB state reset).
6. **`git diff --stat feat/avionics-v2-overhaul..fix/results-sources-docs`:** **PASS** (strictly zero edits under `src/ui/**`, `src/app/**`, or CSS).
7. **Forbidden Word Scan (`diagnos|disease|cancer|depression|anxiety disorder|you have`):** **PASS** (only present in negative test assertions, specification policy rules, or verbatim quotes of NASA risk titles permitted under `RULES.md` 108).
8. **Forbidden Numbers Scan (`98.7|92%|Artemis|AI-powered`):** **PASS** (0 occurrences in code or prose).

---

## 9. Merge-Readiness Checklist for the Human

Before replying with `MERGE TO MAIN`, please complete the following human verification checks:

- [ ] **1. Review 3D Model Provenance:** Confirm `docs/ASSETS.md` and verify that Innerscene Corp's CC0 1.0 Universal public domain release is acceptable for your project submission.
- [ ] **2. Check Pending Unverified Sources:** Note that three sources have `status: 'unverified'` with `url: null` (`src_general_clinical`, `src_iss_padles`, `src_nasa_circa`) per design rules. Verify if your team wants to add specific external URLs or leave them for post-hackathon clinical validation.
- [ ] **3. Manual App Walkthrough:** Open `http://localhost:5173/` in your browser. Verify the Today dashboard, BodyMap 3D model, Scenario Lab, and Proof page.
- [ ] **4. Final Merge Approval:** Reply with the exact words:  
  **`MERGE TO MAIN`**

