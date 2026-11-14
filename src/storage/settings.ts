/**
 * G7: settings.ts
 * Key-value settings store.
 * Keys: missionSetting, supplies, selectedCrewId, viewDay, shareWithGround.
 * All functions return safe defaults on failure and never throw.
 */
import { getDb } from './db';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await getDb();
    if (!db) return fallback;
    const record: { key: string; value: unknown } | undefined = await db.get('settings', key);
    if (record === undefined) return fallback;
    return record.value as T;
  } catch {
    return fallback;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.put('settings', { key, value });
  } catch {
    // Safe default on failure.
  }
}

