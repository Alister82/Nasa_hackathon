import type { CheckInRecord } from '@/contracts/types';
import { getDB } from './db';

// Check-in store per ARCHITECTURE.md 9. Key: `${crewId}:${day}`.

export async function saveCheckIn(record: CheckInRecord): Promise<void> {
  try {
    const db = await getDB();
    const key = `${record.crewId}:${record.day}`;
    await db.put('checkins', {
      key,
      crewId: record.crewId,
      day: record.day,
      mood: record.mood,
      stress: record.stress,
      energy: record.energy,
      note: record.note,
      urgentHelpRequested: record.urgentHelpRequested,
      createdAt: record.createdAt,
      sharedWithGround: record.sharedWithGround,
    });
  } catch {
    // Safe default.
  }
}

export async function loadCheckIns(crewId: string): Promise<CheckInRecord[]> {
  try {
    const db = await getDB();
    const all = await db.getAll('checkins');
    return all
      .filter((r) => r.crewId === crewId)
      .map((r) => ({
        crewId: r.crewId,
        day: r.day,
        mood: r.mood as 1 | 2 | 3 | 4 | 5,
        stress: r.stress as 1 | 2 | 3 | 4 | 5,
        energy: r.energy as 1 | 2 | 3 | 4 | 5,
        note: r.note,
        urgentHelpRequested: r.urgentHelpRequested,
        createdAt: r.createdAt,
        sharedWithGround: r.sharedWithGround,
      }));
  } catch {
    return [];
  }
}

