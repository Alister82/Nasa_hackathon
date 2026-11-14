/**
 * G7: entries.ts
 * Persistence for MeasurementEntry records.
 * Key = `${crewId}:${day}` (per ARCHITECTURE.md section 9).
 * saveEntry merges values into an existing entry for the same key.
 * All functions return safe defaults on failure and never throw.
 */
import type { MeasurementEntry, IndicatorId } from '@/contracts/types';
import { getDb } from './db';

function entryKey(crewId: string, day: number): string {
  return `${crewId}:${day}`;
}

export async function saveEntry(entry: MeasurementEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const key = entryKey(entry.crewId, entry.day);
    // Merge: read existing, overwrite provided values.
    const existing: (MeasurementEntry & { key: string }) | undefined =
      await db.get('entries', key);
    const merged: MeasurementEntry & { key: string } = {
      key,
      crewId: entry.crewId,
      day: entry.day,
      createdAt: entry.createdAt,
      values: {
        ...(existing?.values ?? {}),
        ...(entry.values as Partial<Record<IndicatorId, number>>),
      },
    };
    await db.put('entries', merged);
  } catch {
    // Safe default: do nothing on failure (ARCHITECTURE.md section 9).
  }
}

export async function loadEntries(crewId: string): Promise<MeasurementEntry[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const all: (MeasurementEntry & { key: string })[] = await db.getAll('entries');
    return all
      .filter((e) => e.crewId === crewId)
      .map(({ key: _key, ...rest }) => rest as MeasurementEntry);
  } catch {
    return [];
  }
}

