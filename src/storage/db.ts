import { openDB, type IDBPDatabase } from 'idb';

// IndexedDB schema per ARCHITECTURE.md section 9.
// Database name: vigil-db, version 1.
// Stores: entries, checkins, log, settings.

export interface VIGILDBSchema {
  entries: {
    key: string;         // `${crewId}:${day}`
    value: {
      key: string;
      crewId: string;
      day: number;
      values: Record<string, number>;
      createdAt: string;
    };
  };
  checkins: {
    key: string;         // `${crewId}:${day}`
    value: {
      key: string;
      crewId: string;
      day: number;
      mood: number;
      stress: number;
      energy: number;
      note?: string;
      urgentHelpRequested: boolean;
      createdAt: string;
      sharedWithGround: boolean;
    };
  };
  log: {
    key: number;         // autoIncrement
    value: {
      id?: number;
      crewId: string;
      day: number;
      createdAt: string;
      cardId: string | null;
      observation: string;
      actionTaken: string;
      reviewedBy: 'astronaut' | 'flight_surgeon' | 'unspecified';
      note: string;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VIGILDBSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<VIGILDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<VIGILDBSchema>('vigil-db', 1, {
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
  }
  return dbPromise;
}

/** Reset the cached DB promise (used by tests with fake-indexeddb). */
export function resetDBForTest(): void {
  dbPromise = null;
}

