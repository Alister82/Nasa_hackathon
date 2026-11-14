import type { MeasurementEntry, CheckInRecord, LogEntry } from '@/contracts/types';

/* Checkpoint 0 stub. P2 replaces these bodies in G7. */

const NOT_IMPLEMENTED = 'not implemented';

export async function saveEntry(_entry: MeasurementEntry): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function loadEntries(_crewId: string): Promise<MeasurementEntry[]> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function saveCheckIn(_record: CheckInRecord): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function loadCheckIns(_crewId: string): Promise<CheckInRecord[]> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function addLogEntry(_entry: Omit<LogEntry, 'id'>): Promise<number | null> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function listLogEntries(_crewId: string): Promise<LogEntry[]> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function getSetting<T>(_key: string, _fallback: T): Promise<T> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function setSetting<T>(_key: string, _value: T): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function clearAll(): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}
