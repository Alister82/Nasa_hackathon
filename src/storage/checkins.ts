/**
 * G7: checkins.ts
 * Persistence for CheckInRecord records.
 * Key = `${crewId}:${day}` (per ARCHITECTURE.md section 9).
 * saveCheckIn overwrites the existing record for the same key (one per day).
 * All functions return safe defaults on failure and never throw.
 */
import type { CheckInRecord } from '@/contracts/types';
import { getDb } from './db';

function checkinKey(crewId: string, day: number): string {
  return `${crewId}:${day}`;
}

export async function saveCheckIn(record: CheckInRecord): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const key = checkinKey(record.crewId, record.day);
    // Cast to include the keyPath field required by IndexedDB.
    await db.put('checkins', { ...record, key });
  } catch {
    // Safe default on failure.
  }
}

export async function loadCheckIns(crewId: string): Promise<CheckInRecord[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const all: (CheckInRecord & { key: string })[] = await db.getAll('checkins');
    return all
      .filter((r) => r.crewId === crewId)
      .map(({ key: _key, ...rest }) => rest as CheckInRecord);
  } catch {
    return [];
  }
}

