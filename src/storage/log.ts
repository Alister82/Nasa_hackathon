/**
 * G7: log.ts
 * Investigation log entries, keyed by auto-increment id.
 * listLogEntries returns newest first (sorted by id descending).
 * All functions return safe defaults on failure and never throw.
 */
import type { LogEntry } from '@/contracts/types';
import { getDb } from './db';

export async function addLogEntry(entry: Omit<LogEntry, 'id'>): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const id = await db.add('log', entry);
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}

export async function listLogEntries(crewId: string): Promise<LogEntry[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    const all: LogEntry[] = await db.getAll('log');
    return all
      .filter((e) => e.crewId === crewId)
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0)); // newest first
  } catch {
    return [];
  }
}

