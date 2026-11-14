import type { MeasurementEntry, IndicatorId } from '@/contracts/types';
import { getDB } from './db';

// Measurement entries store per ARCHITECTURE.md 9.
// Key: `${crewId}:${day}`. saveEntry merges values into an existing entry for the same key.

export async function saveEntry(entry: MeasurementEntry): Promise<void> {
  try {
    const db = await getDB();
    const key = `${entry.crewId}:${entry.day}`;
    const existing = await db.get('entries', key);
    if (existing) {
      // Merge: new values overwrite, existing values kept.
      const merged = {
        ...existing,
        values: { ...existing.values, ...entry.values } as Record<IndicatorId, number>,
        createdAt: entry.createdAt,
      };
      await db.put('entries', merged);
    } else {
      await db.put('entries', {
        key,
        crewId: entry.crewId,
        day: entry.day,
        values: entry.values as Record<IndicatorId, number>,
        createdAt: entry.createdAt,
      });
    }
  } catch {
    // Safe default: swallow errors, do not throw into the UI (ARCHITECTURE.md 9).
  }
}

export async function loadEntries(crewId: string): Promise<MeasurementEntry[]> {
  try {
    const db = await getDB();
    const all = await db.getAll('entries');
    return all
      .filter((r) => r.crewId === crewId)
      .map((r) => ({
        crewId: r.crewId,
        day: r.day,
        values: r.values as Partial<Record<IndicatorId, number>>,
        createdAt: r.createdAt,
      }));
  } catch {
    return [];
  }
}

