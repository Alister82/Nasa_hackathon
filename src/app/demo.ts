import { DEMO_STORY } from '@/contracts/constants';
import type { ScenarioId, MissionSettingId } from '@/contracts/types';

export interface DemoConfig {
  crewId: string;
  scenarioId: ScenarioId;
  seed: number;
  missionSetting: MissionSettingId;
  viewDay: number;
}

export function getDemoStoryConfig(): DemoConfig {
  return DEMO_STORY;
}
