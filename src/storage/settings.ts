import { getDB } from './db';

// Settings store per ARCHITECTURE.md 9.
// Keys: missionSetting, supplies, selectedCrewId, viewDay, shareWithGround.

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const db = await getDB();
    const record = await db.get('settings', key);
    if (record === undefined) return fallback;
    return record.value as T;
  } catch {
    return fallback;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    await db.put('settings', { key, value });
  } catch {
    // Safe default.
  }
}

export async function clearAll(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('entries');
    await db.clear('checkins');
    await db.clear('log');
    await db.clear('settings');
  } catch {
    // Safe default.
  }
}

