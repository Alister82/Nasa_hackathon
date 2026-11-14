/**
 * G7: db.ts
 * Opens the IndexedDB database "vigil-db" version 1.
 * Four object stores per ARCHITECTURE.md section 9:
 *   entries   – keyPath 'key'  (${crewId}:${day})
 *   checkins  – keyPath 'key'  (${crewId}:${day})
 *   log       – keyPath 'id', autoIncrement
 *   settings  – keyPath 'key'
 *
 * Returns null on failure; callers must handle null safely.
 * Library: idb (ARCHITECTURE.md section 2).
 */
import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

export const DB_NAME = 'vigil-db';
export const DB_VERSION = 1;

export type VDb = IDBPDatabase;

let _db: VDb | null = null;

export async function getDb(): Promise<VDb | null> {
  if (_db) return _db;
  try {
    _db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('checkins')) {
          db.createObjectStore('checkins', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('log')) {
          db.createObjectStore('log', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
    return _db;
  } catch {
    return null;
  }
}

/** Reset the cached DB handle (used in tests to allow fake-indexeddb to take effect). */
export function resetDbCache(): void {
  _db = null;
}

