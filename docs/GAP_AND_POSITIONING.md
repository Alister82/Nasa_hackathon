# GAP ANALYSIS, POSITIONING & AEROSPACE MEDICINE GROUNDING

**Project:** Vigil (NASA Space Apps Challenge 2026)  
**Challenge:** "Create Health Monitoring Software for Astronauts on Space Missions"  
**Target Operational Profile:** Deep Space Exploration (Transit to Mars, Lunar Gateway, Surface Habitats) — Earth-Independent Medical Operations (EIMO).

---

## 1. Executive Summary

Most hackathon entries addressing astronaut health succumb to one of two failure modes:
1. **The "AI Doctor" Fallacy:** Proposing black-box generative AI chatbots or unvalidated diagnostic models that claim to diagnose complex pathologies from limited wearable streams, ignoring aerospace safety standards, hallucinations, and non-deterministic behavior.
2. **The "Wikipedia Dashboard" Fallacy:** Building flat, generic web forms that regurgitate static text without interactive clinical utility, ignoring communication latencies, consumable limitations, and alert fatigue.

**Vigil** takes an unapologetically rigorous, flight-qualified approach grounded in NASA Exploration Medical Capability (ExMC) architecture. Vigil is an **offline-first, client-side decision support system** powered by deterministic Two-Sided CUSUM statistics, pre-flight personalized baselines, supply-aware procedures, and traceable clinical citations.

---

## 2. Competitive Matrix: Typical Hackathon Projects vs. Vigil

| Dimension | Typical Hackathon Entry | Vigil Flight Deck | Defensible Advantage |
|:---|:---|:---|:---|
| **Core Architecture** | Cloud API / LLM Backend (OpenAI, Anthropic, Gemini API) | 100% Client-Side PWA (Web Worker + IndexedDB) | Operates seamlessly during multi-week solar blackout or 24-minute latency transit with zero network access. |
| **Medical Claims** | Diagnostic assertions ("You have Stage 2 Hypertension / Cardiovascular Disease") | Baseline variance & neutral evidence ("Resting heart rate has shifted +14 bpm from your pre-flight baseline") | Strict adherence to NASA-STD-3001: decision support without unvalidated automated diagnosis. |
| **Statistical Engine** | Generic ML classifier trained on synthetic data, claiming fake "98.7% accuracy" | Deterministic Two-Sided CUSUM ($K=1.25, H=8.0$) with 5-day persistence filter | Evaluated across 600 simulated missions: achieves **0.69 false alarms/100 days** compared to 6.62 for rolling z-scores. |
| **Clinical Interventions** | Static text advice ("Go see a doctor", "Rest more") | Embedded clinical procedure widgets (5-min seated rest timer, 4s/6s vagal breathing pacer, follow-up loop) | Astronauts execute the clinical protocol directly on the card and verify physiological response. |
| **Resource Awareness** | Ignores spacecraft medical inventory | Consumable & supply-aware (automatic fallback if cuff, glucometer, or sleep mask is unavailable) | Prevents recommending diagnostics that cannot be executed with onboard inventory. |
| **Ground Integration** | Assumes instantaneous real-time sync | Store-and-forward telemetry packages (JSON & printable handover sheets) | Modeled for 12–24 min light delays with expected reply timelines. |

---

## 3. NASA ExMC & EIMO Alignment

### 3.1 Levels of Care IV & V (NASA-STD-3001)
NASA Human Exploration standards define Level of Care IV (Lunar surface) and Level of Care V (Mars transit/surface). Under Level of Care V:
- Immediate ground physician intervention is physically impossible due to speed-of-light delay (up to 24 minutes one-way) and solar conjunction blackouts (up to 2 weeks).
- The crew must operate autonomously to detect early physiological drift before acute medical crises develop.
- Vigil fulfills the **Exploration Medical System (ExMS) Decision Support Module** specification defined in the NASA ExMC IMPACT project (Informing Mission Planning via Analysis of Complex Trades).

### 3.2 Mitigation of Alert Fatigue
In aerospace operations, alert fatigue is a primary safety hazard. A detector that flags weekly false alarms will be silenced or disregarded by crew.
- Vigil tunes the reference slack ($K=1.25$) and decision threshold ($H=8.0$) to suppress short-lived spikes (e.g. from post-exercise reading, acute stress, or transient sensor noise).
- Only multi-day physiological shifts persist to cross the threshold, ensuring that when an astronaut receives an alert, it represents genuine adaptation or drift.

---

## 4. NASA Open Science Data Repository (OSDR) & Literature Grounding

Vigil's indicator domains and reference bounds are anchored in aerospace medicine literature and NASA open research:

1. **Cardiovascular Adaptation (Microgravity Fluid Shift):**
   - Headward fluid shift causes initial central hypervolemia followed by diuresis, 15–20% plasma volume reduction, and altered baroreceptor sensitivity (*NASA HRP Evidence Report: Risk of Cardiovascular Adaptations*).
   - Vigil tracks resting heart rate and blood pressure against the astronaut's own pre-flight baseline rather than rigid Earth population percentiles.

2. **Autonomic Stress & Vagal Resonance:**
   - Controlled 0.1 Hz slow respiration (4s inhalation / 6s exhalation) stimulates parasympathetic vagal tone and enhances baroreflex sensitivity without medication (*NASA-STD-3001 Vol 1*). Embedded directly into Vigil's `BreathingPacerWidget`.

3. **Spaceflight Radiation Monitoring:**
   - CSA/NASA operational thresholds for Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE). Vigil tracks daily cumulative rate (mSv/day) against mission orbital profiles (Station: 0.5 mSv/d; Deep Space: 1.5 mSv/d).

---

## 5. Eight Questions & Answers for NASA Flight Surgeons & Mentors

### Q1: Why did you not use an LLM or generative AI agent to diagnose crew symptoms?
**A:** In mission-critical aerospace medicine, determinism, auditability, and offline reliability are non-negotiable. Large language models are non-deterministic, prone to hallucination, cannot run locally within low-power flight avionics constraints, and make diagnostic claims without verifiable epidemiological ground truth. Vigil uses a fully auditable decision library mapped directly to peer-reviewed clinical guidelines (AHA/ACC, ADA, AASM, NASA-STD-3001).

### Q2: Why is your median detection delay 16 days for slow drift when a rolling z-score detects it in 5.5 days?
**A:** Because detecting slow drift in 5.5 days with a rolling z-score generates **6.62 false episodes every 100 days**—more than one false alarm every two weeks. In a 3-year Mars mission, that represents ~70 false medical alarms, destroying astronaut trust. Vigil sacrifices ~10 days on gradual drift to achieve **0.69 false alarms per 100 days** (a 90% reduction), while still detecting 100% of drift events before critical thresholds are reached.

### Q3: How does Vigil handle communication blackouts during solar conjunction?
**A:** Vigil is built as an offline-first PWA with an IndexedDB storage engine. It does not make a single network request at runtime. During blackouts, the astronaut has full access to the guided daily check, in-card procedure timers, longitudinal trend charts, and autonomous escalation protocols. Handover packages are queued locally in store-and-forward format until telemetry acquisition resumes.

### Q4: How does Vigil prevent alert walls when multiple signals drift together?
**A:** In Contract v2, Vigil implements cluster consolidation (`multi_signal_pattern`). When co-occurring cardiovascular, behavioral, and metabolic signals drift within a 15-day window, Vigil consolidates them into a single primary cluster card with expandable `supportingSignals` and deduplicated actions, eliminating the exhaustion of reading 9 redundant cards.

### Q5: What makes your guided daily check usable under microgravity conditions?
**A:** Astronauts in gloves or microgravity struggle with tiny mouse clicks and fiddly sliders. Vigil provides 1-tap simulated wearable stream pre-fill, large tactile steppers (`-5`, `-1`, `+1`, `+5`) with 44px touch targets, visual range gauges with normal bands, and distinct high-contrast status pills for quick glanceability.

### Q6: What happens if an onboard diagnostic tool (like a blood pressure cuff) breaks or is lost?
**A:** Vigil is inventory-aware. Astronauts can toggle supply status (e.g., `bp_cuff: false`). Alert cards and daily checks instantly substitute validated alternative procedures (e.g. resting heart rate observation, manual radial pulse palpation, and symptom checks) instead of blocking the crew.

### Q7: Why do you not compute a single "Overall Health Score" (e.g., 92%)?
**A:** A single composite health score is scientifically undefensible and clinically dangerous. An astronaut with perfect sleep, energy, and exercise who develops acute ventricular tachycardia or severe radiation toxicity must not be shown "88% Healthy — Stable". Vigil maintains independent surveillance across all 6 physiological domains.

### Q8: Where do your benchmark numbers come from, and can they be independently reproduced?
**A:** Every single number shown on Vigil's Verification page comes from `public/data/results.json`, generated by running `npm run harness` over 600 simulated missions (seeds 1–100 across 6 scenarios). The detector constants were tuned on separate seeds (1000–1099) and permanently frozen. Any evaluator can run `npx tsx scripts/run-harness.ts` to reproduce the exact results.
