import React from 'react';
import {
  HelpCircle,
  WifiOff,
  Activity,
  Wind,
  Clock,
  Radio,
  FileText,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FAQS: FaqItem[] = [
  {
    icon: WifiOff,
    question: 'How does Vigil work without an internet connection?',
    answer:
      'Vigil is an offline-first Progressive Web App (PWA). All detection algorithms (CUSUM, rolling baselines, persistence tracking), clinical guidance tables, and IndexedDB storage run entirely client-side inside your browser sandbox. No server or cloud calls are made during operations.',
  },
  {
    icon: Activity,
    question: 'Why doesn\'t Vigil alert immediately on a single high reading?',
    answer:
      'In deep space exploration, false alarms cause alert fatigue and erode crew trust. Vigil uses an adaptive Two-Sided CUSUM with an accumulator threshold (H=8.0) and a 5-day persistence requirement. Transient 1-day spikes (e.g. from post-exercise reading) are logged but do not trigger review alerts unless sustained.',
  },
  {
    icon: Clock,
    question: 'How should I perform the 5-minute seated rest procedure?',
    answer:
      'When an elevated heart rate or blood pressure is flagged, sit quietly with your back supported, feet uncrossed and flat against the deck. Avoid talking, eating, or using personal devices. Use the embedded 5-minute rest timer on the alert card, then repeat the measurement.',
  },
  {
    icon: Wind,
    question: 'How does the 4-second in / 6-second out breathing pacer help?',
    answer:
      'A 0.1 Hz breathing rate (4 seconds inhale, 6 seconds exhale) stimulates parasympathetic vagal tone and heart rate variability (HRV), helping lower acute sympathetic arousal and microgravity-induced autonomic stress without pharmaceutical intervention.',
  },
  {
    icon: Radio,
    question: 'How do communications work during deep space blackout?',
    answer:
      'During communication blackouts or delays (e.g., Mars transit with 12-minute one-way light time), Vigil provides autonomous decision support and escalates only to onboard Crew Medical Officers. Telemetry handover packages are queued for store-and-forward transmission once radio contact resumes.',
  },
  {
    icon: FileText,
    question: 'What is included in the Flight-Surgeon Handover Report?',
    answer:
      'The report aggregates all active findings, 7-day vitals averages compared against pre-flight baselines, astronaut subjective wellbeing notes, and completed countermeasure steps in standard ExMC/EIMO telemetry format.',
  },
];

export function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
            Astronaut Operating Manual
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1 flex items-center gap-2.5">
          <HelpCircle className="w-7 h-7 text-accent-primary" />
          <span>Flight Deck Help & Clinical FAQ</span>
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
          Standard operating procedures and algorithmic guidance for crew medical officers and astronauts.
        </p>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const Icon = faq.icon;
          return (
            <details
              key={idx}
              className="glass-panel rounded-2xl border border-line p-4 sm:p-5 shadow-card group transition-all"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none select-none min-h-[44px]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-ink group-hover:text-accent-primary transition-colors">
                    {faq.question}
                  </h2>
                </div>
                <ChevronDown className="w-4 h-4 text-ink-soft transition-transform group-open:rotate-180 flex-shrink-0" />
              </summary>
              <div className="pt-3 mt-2 border-t border-line/60 text-xs sm:text-sm text-ink-soft leading-relaxed pl-11">
                {faq.answer}
              </div>
            </details>
          );
        })}
      </div>

      {/* ExMC Guidelines Note */}
      <div className="glass-panel p-5 rounded-2xl border border-line shadow-card text-xs text-ink-soft flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-accent-teal flex-shrink-0" />
        <div>
          <strong className="font-bold text-ink">NASA ExMC Grounding: </strong>
          Grounded in NASA Exploration Medical Capability (ExMC) Level of Care 4/5 autonomous guidelines. Developed for the NASA Space Apps Challenge 2026.
        </div>
      </div>
    </div>
  );
}
