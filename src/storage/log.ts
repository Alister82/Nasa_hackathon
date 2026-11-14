import type { LogEntry } from '@/contracts/types';
import { getDB } from './db';

// Investigation log store per ARCHITECTURE.md 9.
// Key: autoIncrement id. listLogEntries returns newest first.

export async function addLogEntry(entry: Omit<LogEntry, 'id'>): Promise<number | null> {
  try {
    const db = await getDB();
    const id = await db.add('log', {
      crewId: entry.crewId,
      day: entry.day,
      createdAt: entry.createdAt,
      cardId: entry.cardId,
      observation: entry.observation,
      actionTaken: entry.actionTaken,
      reviewedBy: entry.reviewedBy,
      note: entry.note,
    });
    return id as number;
  } catch {
    return null;
  }
}

export async function listLogEntries(crewId: string): Promise<LogEntry[]> {
  try {
    const db = await getDB();
    const all = await db.getAll('log');
    return all
      .filter((r) => r.crewId === crewId)
      .sort((a, b) => {
        // Newest first: compare by id (autoIncrement reflects insertion order).
        return (b.id ?? 0) - (a.id ?? 0);
      })
      .map((r) => ({
        id: r.id,
        crewId: r.crewId,
        day: r.day,
        createdAt: r.createdAt,
        cardId: r.cardId,
        observation: r.observation,
        actionTaken: r.actionTaken,
        reviewedBy: r.reviewedBy,
        note: r.note,
      }));
  } catch {
    return [];
  }
}

