import type { SupplyId, SupplyMeta } from '@/contracts/types';

// Supply metadata per ARCHITECTURE.md 7.5 and CONTRACTS.md section 4.2.
// Labels exactly as specified in TASKS.md G1.

export const SUPPLIES: SupplyMeta[] = [
  { id: 'bp_cuff', label: 'Blood pressure cuff' },
  { id: 'thermometer', label: 'Thermometer' },
  { id: 'glucometer', label: 'Glucose meter' },
  { id: 'wrist_hr_monitor', label: 'Wrist heart-rate monitor' },
  { id: 'exercise_equipment', label: 'Exercise equipment' },
  { id: 'sleep_mask', label: 'Sleep mask' },
];

// All supplies available by default (can be toggled off in mission settings).
export const DEFAULT_SUPPLIES: Record<SupplyId, boolean> = {
  bp_cuff: true,
  thermometer: true,
  glucometer: true,
  wrist_hr_monitor: true,
  exercise_equipment: true,
  sleep_mask: true,
};

