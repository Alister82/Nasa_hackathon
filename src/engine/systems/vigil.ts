import type { CrewDataset, DailyFlag } from '@/contracts/types';
import { computeSeriousFlagDays } from '../detector';

/** Vigil flags a day when analyze has a persistent change, pattern, radiation, or urgent threshold finding. */
export function vigilFlagDays(dataset: CrewDataset): DailyFlag[] {
  return computeSeriousFlagDays(dataset).map((flagged, index) => ({ day: index + 1, flagged }));
}
