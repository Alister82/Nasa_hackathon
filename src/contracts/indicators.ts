import type { IndicatorMeta, IndicatorId, DomainId } from './types';

export const INDICATORS: IndicatorMeta[] = [
  { id: 'heart_rate', label: 'Resting heart rate', unit: 'bpm', domain: 'cardiovascular', decimals: 0, concernDirection: 'up', minSigma: 1.5, method: 'cusum', plausibleMin: 30, plausibleMax: 220 },
  { id: 'bp_sys', label: 'Blood pressure, systolic', unit: 'mmHg', domain: 'cardiovascular', decimals: 0, concernDirection: 'up', minSigma: 2.5, method: 'cusum', plausibleMin: 60, plausibleMax: 260 },
  { id: 'bp_dia', label: 'Blood pressure, diastolic', unit: 'mmHg', domain: 'cardiovascular', decimals: 0, concernDirection: 'up', minSigma: 2.0, method: 'cusum', plausibleMin: 30, plausibleMax: 150 },
  { id: 'body_temp', label: 'Body temperature', unit: '°C', domain: 'metabolic_general', decimals: 1, concernDirection: 'up', minSigma: 0.1, method: 'cusum', plausibleMin: 33, plausibleMax: 42 },
  { id: 'glucose', label: 'Blood glucose (fasting)', unit: 'mg/dL', domain: 'metabolic_general', decimals: 0, concernDirection: 'both', minSigma: 3.0, method: 'cusum', plausibleMin: 30, plausibleMax: 600 },
  { id: 'sleep_hours', label: 'Sleep', unit: 'hours', domain: 'sleep_recovery', decimals: 1, concernDirection: 'down', minSigma: 0.3, method: 'cusum', plausibleMin: 0, plausibleMax: 16 },
  { id: 'exercise_minutes', label: 'Exercise', unit: 'minutes', domain: 'physical_performance', decimals: 0, concernDirection: 'down', minSigma: 8.0, method: 'cusum', plausibleMin: 0, plausibleMax: 600 },
  { id: 'mood', label: 'Mood', unit: 'score 1 to 5', domain: 'behavioral', decimals: 1, concernDirection: 'down', minSigma: 0.25, method: 'cusum', plausibleMin: 1, plausibleMax: 5 },
  { id: 'stress', label: 'Stress', unit: 'score 1 to 5', domain: 'behavioral', decimals: 1, concernDirection: 'up', minSigma: 0.25, method: 'cusum', plausibleMin: 1, plausibleMax: 5 },
  { id: 'energy', label: 'Energy', unit: 'score 1 to 5', domain: 'behavioral', decimals: 1, concernDirection: 'down', minSigma: 0.25, method: 'cusum', plausibleMin: 1, plausibleMax: 5 },
  { id: 'radiation_dose', label: 'Radiation dose', unit: 'mSv/day', domain: 'radiation', decimals: 3, concernDirection: 'up', minSigma: 0, method: 'rule', plausibleMin: 0, plausibleMax: 50 },
];

export const INDICATOR_IDS: IndicatorId[] = INDICATORS.map((i) => i.id);

export const DOMAIN_LABELS: Record<DomainId, string> = {
  cardiovascular: 'Heart and blood pressure',
  sleep_recovery: 'Sleep and recovery',
  physical_performance: 'Exercise and strength',
  behavioral: 'Mood and stress',
  metabolic_general: 'Temperature and blood sugar',
  radiation: 'Radiation',
};

export const DOMAIN_ORDER: DomainId[] = [
  'cardiovascular', 'sleep_recovery', 'physical_performance',
  'behavioral', 'metabolic_general', 'radiation',
];

export function getIndicator(id: IndicatorId): IndicatorMeta {
  const found = INDICATORS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown indicator: ${id}`);
  return found;
}
