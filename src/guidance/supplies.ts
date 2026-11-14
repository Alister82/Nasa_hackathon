/**
 * G1: supplies.ts
 * Six supply items per CONTRACTS.md SupplyId.
 * Labels from TASKS.md G1 acceptance criteria.
 */
import type { SupplyMeta, SupplyId } from '@/contracts/types';

export const SUPPLIES: SupplyMeta[] = [
  { id: 'bp_cuff',           label: 'Blood pressure cuff' },
  { id: 'thermometer',       label: 'Thermometer' },
  { id: 'glucometer',        label: 'Glucose meter' },
  { id: 'wrist_hr_monitor',  label: 'Wrist heart-rate monitor' },
  { id: 'exercise_equipment',label: 'Exercise equipment' },
  { id: 'sleep_mask',        label: 'Sleep mask' },
];

/** All supplies available by default (true). */
export const DEFAULT_SUPPLIES: Record<SupplyId, boolean> = {
  bp_cuff: true,
  thermometer: true,
  glucometer: true,
  wrist_hr_monitor: true,
  exercise_equipment: true,
  sleep_mask: true,
};

