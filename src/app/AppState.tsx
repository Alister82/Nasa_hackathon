import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  AlertCard,
  AnalysisResult,
  CheckInInput,
  CheckInResult,
  CrewDataset,
  MissionContext,
  MissionSettingId,
  SupplyId,
  IndicatorId,
} from '@/contracts/types';
import {
  DEFAULT_CREW,
  DEFAULT_MISSION_SETTING,
  DEFAULT_VIEW_DAY,
  DEMO_STORY,
  MISSION_DAYS,
} from '@/contracts/constants';
import { DEFAULT_SUPPLIES, evaluateCheckIn } from '@/guidance';
import {
  clearAll,
  getSetting,
  saveCheckIn,
  saveEntry,
  setSetting,
} from '@/storage';
import { generateScenario } from '@/engine';
import { getAnalysis, getCards, getDataset, notifyEntriesChanged } from './services';

export interface AppStateValue {
  crewId: string;
  crewName: string;
  missionSetting: MissionSettingId;
  supplies: Record<SupplyId, boolean>;
  viewDay: number;
  dataset: CrewDataset | null;
  analysis: AnalysisResult | null;
  cards: AlertCard[];
  missionContext: MissionContext;
  loading: boolean;
  loadFailed: boolean;
  setCrewId: (crewId: string) => void;
  setMissionSetting: (setting: MissionSettingId) => void;
  setSupplies: (supplies: Record<SupplyId, boolean>) => void;
  setViewDay: (day: number) => void;
  saveMeasurements: (values: Partial<Record<IndicatorId, number>>) => Promise<void>;
  submitCheckIn: (input: CheckInInput) => Promise<CheckInResult>;
  playDemoStory: () => void;
  resetDemoData: () => Promise<void>;
}

function clampDay(day: number): number {
  if (!Number.isFinite(day)) return DEFAULT_VIEW_DAY;
  return Math.max(1, Math.min(MISSION_DAYS, Math.round(day)));
}

function isMissionSetting(value: unknown): value is MissionSettingId {
  return value === 'station' || value === 'lunar_base' || value === 'deep_space';
}

function isSupplies(value: unknown): value is Record<SupplyId, boolean> {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (Object.keys(DEFAULT_SUPPLIES) as SupplyId[]).every(
    (id) => typeof record[id] === 'boolean',
  );
}

const fallbackCrew = DEFAULT_CREW[0]!;
const fallbackDataset = generateScenario({
  crewId: DEMO_STORY.crewId,
  crewName: fallbackCrew.crewName,
  scenarioId: DEMO_STORY.scenarioId,
  seed: DEMO_STORY.seed,
  missionSetting: DEMO_STORY.missionSetting,
});
const fallbackAnalysis = getAnalysis(fallbackDataset, DEFAULT_VIEW_DAY);
const fallbackContext: MissionContext = {
  setting: DEFAULT_MISSION_SETTING,
  supplies: DEFAULT_SUPPLIES,
};
const fallbackState: AppStateValue = {
  crewId: fallbackCrew.crewId,
  crewName: fallbackCrew.crewName,
  missionSetting: DEFAULT_MISSION_SETTING,
  supplies: DEFAULT_SUPPLIES,
  viewDay: DEFAULT_VIEW_DAY,
  dataset: fallbackDataset,
  analysis: fallbackAnalysis,
  cards: getCards(fallbackAnalysis, fallbackContext),
  missionContext: fallbackContext,
  loading: false,
  loadFailed: false,
  setCrewId: () => {},
  setMissionSetting: () => {},
  setSupplies: () => {},
  setViewDay: () => {},
  saveMeasurements: async () => {},
  submitCheckIn: async (input) => evaluateCheckIn(input),
  playDemoStory: () => {},
  resetDemoData: async () => {},
};

const AppStateContext = createContext<AppStateValue>(fallbackState);

/** Screens rendered outside the provider (component tests) get the deterministic demo state. */
export function useAppState(): AppStateValue {
  return useContext(AppStateContext);
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [crewId, setCrewIdState] = useState<string>(fallbackCrew.crewId);
  const [missionSetting, setMissionSettingState] =
    useState<MissionSettingId>(DEFAULT_MISSION_SETTING);
  const [supplies, setSuppliesState] =
    useState<Record<SupplyId, boolean>>(DEFAULT_SUPPLIES);
  const [viewDay, setViewDayState] = useState<number>(DEFAULT_VIEW_DAY);
  const [dataset, setDataset] = useState<CrewDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [settingsVersion, setSettingsVersion] = useState<number>(0);
  const [entriesVersion, setEntriesVersion] = useState<number>(0);

  // Load persisted settings once, then generate the matching dataset.
  useEffect(() => {
    let active = true;
    void Promise.all([
      getSetting<string>('selectedCrewId', fallbackCrew.crewId),
      getSetting<MissionSettingId>('missionSetting', DEFAULT_MISSION_SETTING),
      getSetting<Record<SupplyId, boolean>>('supplies', DEFAULT_SUPPLIES),
      getSetting<number>('viewDay', DEFAULT_VIEW_DAY),
    ]).then(([storedCrew, storedSetting, storedSupplies, storedDay]) => {
      if (!active) return;
      setCrewIdState(
        DEFAULT_CREW.some((crew) => crew.crewId === storedCrew)
          ? storedCrew
          : fallbackCrew.crewId,
      );
      setMissionSettingState(
        isMissionSetting(storedSetting) ? storedSetting : DEFAULT_MISSION_SETTING,
      );
      setSuppliesState(isSupplies(storedSupplies) ? storedSupplies : DEFAULT_SUPPLIES);
      setViewDayState(clampDay(storedDay));
      setSettingsLoaded(true);
      setSettingsVersion((version) => version + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    let active = true;
    setLoading(true);
    setLoadFailed(false);
    void getDataset(crewId)
      .then((next) => {
        if (!active) return;
        setDataset(next);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setDataset(null);
        setLoadFailed(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [settingsLoaded, settingsVersion, entriesVersion, crewId]);

  const missionContext = useMemo<MissionContext>(
    () => ({ setting: missionSetting, supplies }),
    [missionSetting, supplies],
  );

  const analysis = useMemo<AnalysisResult | null>(
    () => (dataset ? getAnalysis(dataset, viewDay) : null),
    [dataset, viewDay],
  );

  const cards = useMemo<AlertCard[]>(
    () => (analysis ? getCards(analysis, missionContext) : []),
    [analysis, missionContext],
  );

  const setCrewId = useCallback((nextCrewId: string) => {
    if (!DEFAULT_CREW.some((crew) => crew.crewId === nextCrewId)) return;
    setCrewIdState(nextCrewId);
    void setSetting('selectedCrewId', nextCrewId);
  }, []);

  const setMissionSetting = useCallback((next: MissionSettingId) => {
    if (!isMissionSetting(next)) return;
    setMissionSettingState(next);
    void setSetting('missionSetting', next).then(() => {
      setSettingsVersion((version) => version + 1);
    });
  }, []);

  const setSupplies = useCallback((next: Record<SupplyId, boolean>) => {
    if (!isSupplies(next)) return;
    setSuppliesState(next);
    void setSetting('supplies', next);
  }, []);

  const setViewDay = useCallback((next: number) => {
    const clamped = clampDay(next);
    setViewDayState(clamped);
    void setSetting('viewDay', clamped);
  }, []);

  const saveMeasurements = useCallback(
    async (values: Partial<Record<IndicatorId, number>>) => {
      await saveEntry({
        crewId,
        day: viewDay,
        values,
        createdAt: new Date().toISOString(),
      });
      notifyEntriesChanged();
      setEntriesVersion((version) => version + 1);
    },
    [crewId, viewDay],
  );

  const submitCheckIn = useCallback(
    async (input: CheckInInput): Promise<CheckInResult> => {
      await saveCheckIn({
        ...input,
        crewId,
        createdAt: new Date().toISOString(),
        sharedWithGround: false,
      });
      return evaluateCheckIn(input);
    },
    [crewId],
  );

  const playDemoStory = useCallback(() => {
    setCrewIdState(DEMO_STORY.crewId);
    setMissionSettingState(DEMO_STORY.missionSetting);
    setViewDayState(DEMO_STORY.viewDay);
    void (async () => {
      await Promise.all([
        setSetting('selectedCrewId', DEMO_STORY.crewId),
        setSetting('missionSetting', DEMO_STORY.missionSetting),
        setSetting('viewDay', DEMO_STORY.viewDay),
      ]);
      setSettingsVersion((version) => version + 1);
    })();
  }, []);

  const resetDemoData = useCallback(async () => {
    await clearAll();
    setCrewIdState(fallbackCrew.crewId);
    setMissionSettingState(DEFAULT_MISSION_SETTING);
    setSuppliesState(DEFAULT_SUPPLIES);
    setViewDayState(DEFAULT_VIEW_DAY);
    notifyEntriesChanged();
    setEntriesVersion((version) => version + 1);
    setSettingsVersion((version) => version + 1);
    setLoadFailed(false);
  }, []);

  const crew = DEFAULT_CREW.find((candidate) => candidate.crewId === crewId) ?? fallbackCrew;
  const crewName = crew.crewName;

  const value = useMemo<AppStateValue>(
    () => ({
      crewId,
      crewName,
      missionSetting,
      supplies,
      viewDay,
      dataset,
      analysis,
      cards,
      missionContext,
      loading,
      loadFailed,
      setCrewId,
      setMissionSetting,
      setSupplies,
      setViewDay,
      saveMeasurements,
      submitCheckIn,
      playDemoStory,
      resetDemoData,
    }),
    [
      crewId,
      crewName,
      missionSetting,
      supplies,
      viewDay,
      dataset,
      analysis,
      cards,
      missionContext,
      loading,
      loadFailed,
      setCrewId,
      setMissionSetting,
      setSupplies,
      setViewDay,
      saveMeasurements,
      submitCheckIn,
      playDemoStory,
      resetDemoData,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
