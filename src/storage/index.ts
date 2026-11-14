/**
 * G7: storage/index.ts
 * Public API for the storage module per CONTRACTS.md section 4.3.
 * All functions are async, wrapped in try/catch, and return safe defaults on failure.
 * Uses IndexedDB via the idb library (ARCHITECTURE.md section 2).
 */
import type { MeasurementEntry, CheckInRecord, LogEntry } from '@/contracts/types';

export { saveEntry, loadEntries } from './entries';
export { saveCheckIn, loadCheckIns } from './checkins';
export { addLogEntry, listLogEntries } from './log';
export { getSetting, setSetting } from './settings';

/** Clear all four stores. Used by "Reset demo data". */
export async function clearAll(): Promise<void> {
  // Import lazily to keep the module tree clean.
  const { getDb } = await import('./db');
  try {
    const db = await getDb();
    if (!db) return;
    const tx = db.transaction(['entries', 'checkins', 'log', 'settings'], 'readwrite');
    await Promise.all([
      tx.objectStore('entries').clear(),
      tx.objectStore('checkins').clear(),
      tx.objectStore('log').clear(),
      tx.objectStore('settings').clear(),
    ]);
    await tx.done;
  } catch {
    // Safe default on failure.
  }
}

// Re-export types for convenience.
export type { MeasurementEntry, CheckInRecord, LogEntry };
