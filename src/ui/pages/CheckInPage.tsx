import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CheckInInput, CheckInRecord, CheckInResult } from '@/contracts/types';
import { CheckInForm } from '@/ui/components/CheckInForm';
import { CheckInTrend, type CheckInTrendPoint } from '@/ui/charts/CheckInTrend';
import { useAppState } from '@/app/AppState';
import { loadCheckIns } from '@/storage';

export function CheckInPage() {
  const navigate = useNavigate();
  const { crewId, viewDay, analysis, submitCheckIn } = useAppState();
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);

  const reload = useCallback(async () => {
    setCheckIns(await loadCheckIns(crewId));
  }, [crewId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const trendData = useMemo<CheckInTrendPoint[]>(() => {
    const start = Math.max(1, viewDay - 29);
    const byDay = new Map(checkIns.map((record) => [record.day, record]));
    const sleepPoints = new Map(
      (analysis?.indicators.sleep_hours.points ?? []).map((point) => [point.day, point.value]),
    );
    const data: CheckInTrendPoint[] = [];
    for (let day = start; day <= viewDay; day += 1) {
      const record = byDay.get(day);
      const sleep = sleepPoints.get(day);
      data.push({
        day,
        mood: record?.mood,
        stress: record?.stress,
        energy: record?.energy,
        sleep: typeof sleep === 'number' ? sleep : undefined,
      });
    }
    return data;
  }, [analysis, checkIns, viewDay]);

  const handleSubmit = async (input: CheckInInput): Promise<CheckInResult> => {
    const result = await submitCheckIn(input);
    await reload();
    return result;
  };

  const hasCheckIns = checkIns.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">Wellbeing check-in</h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          A short self-check for mission day {viewDay}. Notes stay on this device.
        </p>
      </div>

      <CheckInForm
        crewId={crewId}
        day={viewDay}
        onSubmit={handleSubmit}
        onNeedHelpNow={() => navigate('/urgent')}
      />

      <section
        aria-label="30-day wellbeing and sleep trend"
        className="bg-panel border border-line rounded-sheet p-5"
      >
        <h2 className="text-base font-bold text-ink mb-1">30-day trends</h2>
        <p className="text-xs text-ink-soft mb-4">
          Saved check-ins are shown next to sleep hours for the same days. Days without a
          check-in stay blank.
        </p>
        {hasCheckIns ? (
          <CheckInTrend data={trendData} />
        ) : (
          <p className="text-sm text-ink-soft">
            No check-ins saved yet. Save one to start the trend.
          </p>
        )}
      </section>
    </div>
  );
}
