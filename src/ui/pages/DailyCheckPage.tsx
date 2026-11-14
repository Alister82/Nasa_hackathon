import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { IndicatorId, Rating, CheckInResult } from '@/contracts/types';
import { INDICATORS, getIndicator } from '@/contracts/indicators';
import { Stepper } from '@/ui/components/Stepper';
import { RangeGauge } from '@/ui/components/RangeGauge';
import { BreathingPacerWidget } from '@/ui/components/BreathingPacerWidget';
import { StatusPill } from '@/ui/components/StatusPill';
import { useAppState } from '@/app/AppState';
import {
  ClipboardCheck,
  Heart,
  Brain,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Wind,
  ShieldAlert,
  Radio,
} from 'lucide-react';

export function DailyCheckPage() {
  const navigate = useNavigate();
  const {
    crewId,
    crewName,
    viewDay,
    analysis,
    missionSetting,
    supplies,
    setSupplies,
    saveMeasurements,
    submitCheckIn,
  } = useAppState();

  const setSupply = (id: any, val: boolean) => setSupplies({ ...supplies, [id]: val });

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Vitals State
  const [vitals, setVitals] = useState<Partial<Record<IndicatorId, number>>>(() => {
    // Initialize with today's telemetry from analysis if available
    const init: Partial<Record<IndicatorId, number>> = {};
    if (analysis) {
      for (const id of ['heart_rate', 'bp_sys', 'bp_dia', 'body_temp', 'glucose', 'exercise_minutes'] as IndicatorId[]) {
        const val = analysis.indicators[id]?.lastValue;
        if (val !== null && val !== undefined) init[id] = val;
      }
    }
    return init;
  });

  // Wellbeing State
  const [mood, setMood] = useState<Rating>(4);
  const [stress, setStress] = useState<Rating>(2);
  const [energy, setEnergy] = useState<Rating>(4);
  const [sleepHours, setSleepHours] = useState<number>(7.0);
  const [wellbeingNote, setWellbeingNote] = useState('');
  const [urgentHelpRequested, setUrgentHelpRequested] = useState(false);

  // UI helpers
  const [prefilled, setPrefilled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<CheckInResult | null>(null);
  const [showBreathingWidget, setShowBreathingWidget] = useState(false);

  // 1-Click Simulated Wearable Pre-fill
  const handleWearablePrefill = () => {
    if (!analysis) return;
    const filled: Partial<Record<IndicatorId, number>> = { ...vitals };
    for (const id of ['heart_rate', 'bp_sys', 'bp_dia', 'body_temp', 'glucose', 'exercise_minutes'] as IndicatorId[]) {
      const dayPoint = analysis.indicators[id]?.points.find((p) => p.day === viewDay);
      if (dayPoint && dayPoint.value !== null) {
        filled[id] = dayPoint.value;
      }
    }
    setVitals(filled);
    setPrefilled(true);
  };

  const updateVital = (id: IndicatorId, val: number) => {
    setVitals((prev) => ({ ...prev, [id]: val }));
  };

  // Final Submission to IndexedDB
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save Vitals
      await saveMeasurements(vitals);

      // 2. Submit Wellbeing Check-In
      const res = await submitCheckIn({
        crewId,
        day: viewDay,
        mood,
        stress,
        energy,
        note: wellbeingNote.trim() || undefined,
        urgentHelpRequested,
      });

      setSubmitResult(res);
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  const getBaselineMedian = (id: IndicatorId) => analysis?.baselines[id]?.median ?? 0;
  const getBaselineSigma = (id: IndicatorId) => analysis?.baselines[id]?.sigma ?? 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              Guided Protocol
            </span>
            <span className="text-xs text-ink-soft">
              Day {viewDay} • {crewName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1">
            Astronaut Daily Check
          </h1>
        </div>

        {/* Wizard Stepper Progress */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: 'Vitals' },
            { num: 2, label: 'Wellbeing' },
            { num: 3, label: 'Review' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-accent-primary text-panel border-accent-primary shadow-sm'
                  : step > s.num
                    ? 'bg-accent-teal/10 text-accent-teal border-accent-teal/30'
                    : 'bg-panel border-line text-ink-soft'
              }`}
            >
              <span>{s.num}.</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: PHYSICAL VITALS */}
      {step === 1 && (
        <section className="space-y-6">
          <div className="glass-panel p-5 rounded-3xl border border-line shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent-primary" />
                  Physical Telemetry & Vitals
                </h2>
                <p className="text-xs text-ink-soft">
                  Record today&apos;s routine vitals. Adjust tactile steppers or pull simulated telemetry.
                </p>
              </div>

              <button
                type="button"
                onClick={handleWearablePrefill}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/25 text-xs font-bold transition-all min-h-[44px]"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>{prefilled ? 'Re-sync Wearable Stream' : '1-Tap Wearable Stream'}</span>
              </button>
            </div>

            {prefilled && (
              <div className="p-3 bg-accent-teal/10 border border-accent-teal/20 rounded-xl text-xs text-accent-teal flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Wearable telemetry stream loaded for Day {viewDay}. Fine-tune any values below.</span>
              </div>
            )}

            {/* Vitals Steppers Grid */}
            <div className="space-y-4 pt-2">
              {/* Heart Rate */}
              <div className="p-4 rounded-2xl bg-panel/70 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">Resting Heart Rate</span>
                    <span className="text-xs text-ink-soft">(bpm)</span>
                  </div>
                  <RangeGauge
                    value={vitals.heart_rate ?? null}
                    baselineRange={[
                      getBaselineMedian('heart_rate') - getBaselineSigma('heart_rate'),
                      getBaselineMedian('heart_rate') + getBaselineSigma('heart_rate'),
                    ]}
                    min={40}
                    max={130}
                    unit="bpm"
                  />
                </div>
                <Stepper
                  value={vitals.heart_rate ?? 70}
                  onChange={(v) => updateVital('heart_rate', v)}
                  min={40}
                  max={140}
                  step={1}
                />
              </div>

              {/* Systolic BP */}
              <div className="p-4 rounded-2xl bg-panel/70 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">Systolic Blood Pressure</span>
                    <span className="text-xs text-ink-soft">(mmHg)</span>
                  </div>
                  <RangeGauge
                    value={vitals.bp_sys ?? null}
                    baselineRange={[
                      getBaselineMedian('bp_sys') - getBaselineSigma('bp_sys'),
                      getBaselineMedian('bp_sys') + getBaselineSigma('bp_sys'),
                    ]}
                    min={80}
                    max={190}
                    unit="mmHg"
                  />
                </div>
                <Stepper
                  value={vitals.bp_sys ?? 120}
                  onChange={(v) => updateVital('bp_sys', v)}
                  min={80}
                  max={200}
                  step={1}
                />
              </div>

              {/* Diastolic BP */}
              <div className="p-4 rounded-2xl bg-panel/70 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">Diastolic Blood Pressure</span>
                    <span className="text-xs text-ink-soft">(mmHg)</span>
                  </div>
                  <RangeGauge
                    value={vitals.bp_dia ?? null}
                    baselineRange={[
                      getBaselineMedian('bp_dia') - getBaselineSigma('bp_dia'),
                      getBaselineMedian('bp_dia') + getBaselineSigma('bp_dia'),
                    ]}
                    min={50}
                    max={120}
                    unit="mmHg"
                  />
                </div>
                <Stepper
                  value={vitals.bp_dia ?? 80}
                  onChange={(v) => updateVital('bp_dia', v)}
                  min={50}
                  max={130}
                  step={1}
                />
              </div>

              {/* Body Temperature */}
              <div className="p-4 rounded-2xl bg-panel/70 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">Core Temperature</span>
                    <span className="text-xs text-ink-soft">(°C)</span>
                  </div>
                  <RangeGauge
                    value={vitals.body_temp ?? null}
                    baselineRange={[
                      getBaselineMedian('body_temp') - getBaselineSigma('body_temp'),
                      getBaselineMedian('body_temp') + getBaselineSigma('body_temp'),
                    ]}
                    min={35.5}
                    max={39.5}
                    unit="°C"
                  />
                </div>
                <Stepper
                  value={vitals.body_temp ?? 36.7}
                  onChange={(v) => updateVital('body_temp', Math.round(v * 10) / 10)}
                  min={35.0}
                  max={40.5}
                  step={0.1}
                />
              </div>

              {/* Blood Glucose */}
              <div className="p-4 rounded-2xl bg-panel/70 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">Fasting Blood Glucose</span>
                    <span className="text-xs text-ink-soft">(mg/dL)</span>
                  </div>
                  <RangeGauge
                    value={vitals.glucose ?? null}
                    baselineRange={[
                      getBaselineMedian('glucose') - getBaselineSigma('glucose'),
                      getBaselineMedian('glucose') + getBaselineSigma('glucose'),
                    ]}
                    min={50}
                    max={180}
                    unit="mg/dL"
                  />
                </div>
                <Stepper
                  value={vitals.glucose ?? 95}
                  onChange={(v) => updateVital('glucose', v)}
                  min={50}
                  max={250}
                  step={1}
                />
              </div>
            </div>
          </div>

          {/* Equipment Status Bar */}
          <div className="p-4 rounded-2xl glass-panel border border-line flex items-center justify-between gap-3 text-xs flex-wrap">
            <span className="font-semibold text-ink-soft">Essential Diagnostic Supplies:</span>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={supplies.bp_cuff}
                  onChange={(e) => setSupply('bp_cuff', e.target.checked)}
                  className="rounded border-line text-accent-primary focus:ring-accent-primary"
                />
                <span className="font-medium text-ink">BP Cuff Ready</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={supplies.glucometer}
                  onChange={(e) => setSupply('glucometer', e.target.checked)}
                  className="rounded border-line text-accent-primary focus:ring-accent-primary"
                />
                <span className="font-medium text-ink">Glucometer Strips</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-panel font-bold text-sm shadow-md hover:opacity-95 transition-all min-h-[44px]"
            >
              <span>Continue to Wellbeing Check</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: WELLBEING & RECOVERY */}
      {step === 2 && (
        <section className="space-y-6">
          <div className="glass-panel p-5 rounded-3xl border border-line shadow-card space-y-5">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent-teal" />
                Cognitive & Mental Wellbeing
              </h2>
              <p className="text-xs text-ink-soft">
                Subjective wellbeing ratings evaluate psychological workload and recovery during exploration.
              </p>
            </div>

            {/* Mood Stepper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>Mood Rating</span>
                <span className="text-accent-primary font-extrabold">{mood} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMood(val as Rating)}
                    className={`p-3 rounded-xl border text-center transition-all min-h-[44px] ${
                      mood === val
                        ? 'bg-accent-primary text-panel border-accent-primary shadow-sm font-bold'
                        : 'bg-panel/70 border-line hover:bg-panel text-ink font-semibold'
                    }`}
                  >
                    <div className="text-base">{val === 1 ? '😔' : val === 2 ? '😕' : val === 3 ? '😐' : val === 4 ? '🙂' : '😊'}</div>
                    <div className="text-[11px] mt-1">{val}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stress Stepper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>Subjective Stress Level</span>
                <span className="text-accent-primary font-extrabold">{stress} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStress(val as Rating)}
                    className={`p-3 rounded-xl border text-center transition-all min-h-[44px] ${
                      stress === val
                        ? 'bg-accent-primary text-panel border-accent-primary shadow-sm font-bold'
                        : 'bg-panel/70 border-line hover:bg-panel text-ink font-semibold'
                    }`}
                  >
                    <div className="text-xs font-bold">{val}</div>
                    <div className="text-[10px] text-ink-soft mt-0.5">
                      {val === 1 ? 'Calm' : val === 3 ? 'Moderate' : val === 5 ? 'High' : ''}
                    </div>
                  </button>
                ))}
              </div>

              {stress >= 3 && (
                <div className="mt-2 p-3 bg-accent-teal/10 border border-accent-teal/20 rounded-xl flex items-center justify-between gap-3">
                  <div className="text-xs text-accent-teal">
                    Elevated workload detected. Take a 2-minute respiratory reset?
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBreathingWidget(!showBreathingWidget)}
                    className="px-3 py-1.5 rounded-lg bg-accent-teal text-panel text-xs font-bold shadow-sm inline-flex items-center gap-1 min-h-[44px]"
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>{showBreathingWidget ? 'Close Pacer' : 'Open Pacer'}</span>
                  </button>
                </div>
              )}

              {showBreathingWidget && (
                <div className="p-3 bg-panel/80 rounded-xl border border-line">
                  <BreathingPacerWidget />
                </div>
              )}
            </div>

            {/* Energy Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>Energy & Alertness</span>
                <span className="text-accent-primary font-extrabold">{energy} / 5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEnergy(val as Rating)}
                    className={`p-3 rounded-xl border text-center transition-all min-h-[44px] ${
                      energy === val
                        ? 'bg-accent-primary text-panel border-accent-primary shadow-sm font-bold'
                        : 'bg-panel/70 border-line hover:bg-panel text-ink font-semibold'
                    }`}
                  >
                    <div className="text-xs font-bold">{val}</div>
                    <div className="text-[10px] text-ink-soft mt-0.5">
                      {val === 1 ? 'Exhausted' : val === 3 ? 'Normal' : val === 5 ? 'Peak' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Confidential Astronaut Observation Note */}
            <div className="space-y-1.5">
              <label htmlFor="wellbeing-note" className="block text-xs font-bold text-ink">
                Astronaut Observation Note (Stored Locally)
              </label>
              <textarea
                id="wellbeing-note"
                rows={3}
                value={wellbeingNote}
                onChange={(e) => setWellbeingNote(e.target.value)}
                placeholder="Log sleep disruptions, workload stress, countermeasure changes..."
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-panel text-ink text-xs focus:ring-2 focus:ring-accent-primary outline-none"
              />
            </div>

            {/* Direct Urgent Assistance Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/urgent')}
                className="w-full py-2.5 px-4 rounded-xl border border-status-urgent/40 bg-status-urgent/10 hover:bg-status-urgent/20 text-status-urgent text-xs font-bold flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Request Urgent Medical Help from Flight Deck</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line bg-panel hover:bg-panel-hover text-ink font-semibold text-xs min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Vitals</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-panel font-bold text-sm shadow-md hover:opacity-95 transition-all min-h-[44px]"
            >
              <span>Review & Transmit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: REVIEW & TRANSMIT */}
      {step === 3 && (
        <section className="space-y-6">
          <div className="glass-panel p-5 rounded-3xl border border-line shadow-card space-y-4">
            <div>
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-accent-primary" />
                Pre-Flight Baseline Variance Check
              </h2>
              <p className="text-xs text-ink-soft">
                Automated check comparing today&apos;s check-in against your pre-flight baseline before saving.
              </p>
            </div>

            {/* Summary Telemetry Table */}
            <div className="divide-y divide-line/60 rounded-2xl bg-panel/60 border border-line/70 overflow-hidden text-xs">
              <div className="px-4 py-2.5 font-bold text-ink-soft bg-panel/80 flex items-center justify-between">
                <span>Indicator</span>
                <span>Logged Reading</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="font-medium text-ink">Heart Rate</span>
                <span className="font-bold text-ink tabular-nums">{vitals.heart_rate ?? '—'} bpm</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="font-medium text-ink">Blood Pressure</span>
                <span className="font-bold text-ink tabular-nums">{vitals.bp_sys ?? '—'} / {vitals.bp_dia ?? '—'} mmHg</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="font-medium text-ink">Body Temperature</span>
                <span className="font-bold text-ink tabular-nums">{vitals.body_temp ?? '—'} °C</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="font-medium text-ink">Blood Glucose</span>
                <span className="font-bold text-ink tabular-nums">{vitals.glucose ?? '—'} mg/dL</span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="font-medium text-ink">Wellbeing (Mood / Stress / Energy)</span>
                <span className="font-bold text-ink tabular-nums">{mood} / {stress} / {energy} (out of 5)</span>
              </div>
            </div>

            {submitResult && (
              <div className="p-4 rounded-2xl bg-accent-teal/10 border border-accent-teal/30 space-y-2">
                <div className="flex items-center gap-2 text-accent-teal font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Check-In Recorded to Flight Deck Telemetry</span>
                </div>
                <p className="text-xs text-ink leading-relaxed">
                  {submitResult.message}
                </p>
                <div className="pt-2">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-teal text-panel font-bold text-xs shadow-sm hover:opacity-95 min-h-[44px]"
                  >
                    <span>Return to Flight Deck (Today)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {!submitResult && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-line bg-panel hover:bg-panel-hover text-ink font-semibold text-xs min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Wellbeing</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-primary text-panel font-bold text-sm shadow-md hover:opacity-95 transition-all min-h-[44px] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Transmitting...' : 'Commit & Transmit to Flight Deck'}</span>
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
