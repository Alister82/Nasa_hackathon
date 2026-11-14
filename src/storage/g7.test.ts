// Use fake-indexeddb for all tests in this file.
import 'fake-indexeddb/auto';

import { describe, it, expect, beforeEach } from 'vitest';
import { saveEntry, loadEntries } from './entries';
import { saveCheckIn, loadCheckIns } from './checkins';
import { addLogEntry, listLogEntries } from './log';
import { getSetting, setSetting, clearAll } from './settings';
import { resetDBForTest } from './db';
import type { MeasurementEntry, CheckInRecord, LogEntry } from '@/contracts/types';

// G7 acceptance: round trips, merge on same key, newest-first log, safe defaults, clearAll.

beforeEach(() => {
  // Reset the DB module so each test gets a fresh IndexedDB (fake-indexeddb resets per module re-import).
  resetDBForTest();
});

// ── Entries ───────────────────────────────────────────────────────────────────

function makeEntry(day: number, overrides: Partial<MeasurementEntry> = {}): MeasurementEntry {
  return {
    crewId: 'crew-1',
    day,
    values: { heart_rate: 65 },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('G7: entries — round trip', () => {
  it('saves and loads back an entry', async () => {
    await saveEntry(makeEntry(10));
    const entries = await loadEntries('crew-1');
    expect(entries).toHaveLength(1);
    expect(entries[0]!.day).toBe(10);
    expect(entries[0]!.values['heart_rate']).toBe(65);
  });

  it('loadEntries for different crewId returns empty', async () => {
    await saveEntry(makeEntry(10));
    const entries = await loadEntries('crew-2');
    expect(entries).toHaveLength(0);
  });

  it('merges values on same day key (merge overwrites provided fields, keeps others)', async () => {
    await saveEntry(makeEntry(10, { values: { heart_rate: 65, bp_sys: 115 } }));
    // Second save for same day: only update bp_sys.
    await saveEntry(makeEntry(10, { values: { bp_sys: 120 } }));
    const entries = await loadEntries('crew-1');
    expect(entries).toHaveLength(1);
    expect(entries[0]!.values['heart_rate']).toBe(65);
    expect(entries[0]!.values['bp_sys']).toBe(120);
  });

  it('ignores entries for different crew when merging', async () => {
    await saveEntry(makeEntry(10, { crewId: 'crew-1' }));
    await saveEntry(makeEntry(10, { crewId: 'crew-2' }));
    const c1 = await loadEntries('crew-1');
    const c2 = await loadEntries('crew-2');
    expect(c1).toHaveLength(1);
    expect(c2).toHaveLength(1);
  });
});

// ── Check-ins ─────────────────────────────────────────────────────────────────

function makeCheckIn(day: number, overrides: Partial<CheckInRecord> = {}): CheckInRecord {
  return {
    crewId: 'crew-1',
    day,
    mood: 4,
    stress: 2,
    energy: 4,
    urgentHelpRequested: false,
    createdAt: new Date().toISOString(),
    sharedWithGround: false,
    ...overrides,
  };
}

describe('G7: checkins — round trip', () => {
  it('saves and loads back a check-in', async () => {
    await saveCheckIn(makeCheckIn(50));
    const checkins = await loadCheckIns('crew-1');
    expect(checkins).toHaveLength(1);
    expect(checkins[0]!.day).toBe(50);
    expect(checkins[0]!.mood).toBe(4);
  });

  it('overwrites same day check-in', async () => {
    await saveCheckIn(makeCheckIn(50, { mood: 3 }));
    await saveCheckIn(makeCheckIn(50, { mood: 2 }));
    const checkins = await loadCheckIns('crew-1');
    expect(checkins).toHaveLength(1);
    expect(checkins[0]!.mood).toBe(2);
  });

  it('note is preserved', async () => {
    await saveCheckIn(makeCheckIn(50, { note: 'feeling low today' }));
    const checkins = await loadCheckIns('crew-1');
    expect(checkins[0]!.note).toBe('feeling low today');
  });

  it('loadCheckIns filters by crewId', async () => {
    await saveCheckIn(makeCheckIn(50, { crewId: 'crew-1' }));
    await saveCheckIn(makeCheckIn(50, { crewId: 'crew-2' }));
    expect(await loadCheckIns('crew-2')).toHaveLength(1);
    expect(await loadCheckIns('crew-1')).toHaveLength(1);
  });
});

// ── Log entries ───────────────────────────────────────────────────────────────

function makeLogEntry(overrides: Partial<Omit<LogEntry, 'id'>> = {}): Omit<LogEntry, 'id'> {
  return {
    crewId: 'crew-1',
    day: 100,
    createdAt: new Date().toISOString(),
    cardId: null,
    observation: 'Heart rate rising',
    actionTaken: 'Sat quietly for 5 minutes',
    reviewedBy: 'astronaut',
    note: '',
    ...overrides,
  };
}

describe('G7: log — round trip and newest first', () => {
  it('adds and lists a log entry', async () => {
    await addLogEntry(makeLogEntry());
    const entries = await listLogEntries('crew-1');
    expect(entries).toHaveLength(1);
    expect(entries[0]!.observation).toBe('Heart rate rising');
  });

  it('returns id as a number', async () => {
    const id = await addLogEntry(makeLogEntry());
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('newest first order', async () => {
    await addLogEntry(makeLogEntry({ observation: 'first' }));
    await addLogEntry(makeLogEntry({ observation: 'second' }));
    await addLogEntry(makeLogEntry({ observation: 'third' }));
    const entries = await listLogEntries('crew-1');
    expect(entries[0]!.observation).toBe('third');
    expect(entries[1]!.observation).toBe('second');
    expect(entries[2]!.observation).toBe('first');
  });

  it('filters by crewId', async () => {
    await addLogEntry(makeLogEntry({ crewId: 'crew-1' }));
    await addLogEntry(makeLogEntry({ crewId: 'crew-2' }));
    expect(await listLogEntries('crew-2')).toHaveLength(1);
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────

describe('G7: settings — round trip', () => {
  it('returns fallback for missing key', async () => {
    const val = await getSetting('nonexistent', 'default');
    expect(val).toBe('default');
  });

  it('saves and retrieves a string setting', async () => {
    await setSetting('missionSetting', 'deep_space');
    const val = await getSetting('missionSetting', 'station');
    expect(val).toBe('deep_space');
  });

  it('saves and retrieves an object setting', async () => {
    const supplies = { bp_cuff: false, thermometer: true };
    await setSetting('supplies', supplies);
    const val = await getSetting('supplies', {});
    expect(val).toEqual(supplies);
  });

  it('overwrites an existing setting', async () => {
    await setSetting('viewDay', 50);
    await setSetting('viewDay', 100);
    const val = await getSetting('viewDay', 1);
    expect(val).toBe(100);
  });
});

// ── clearAll ──────────────────────────────────────────────────────────────────

describe('G7: clearAll', () => {
  it('clears entries, checkins, log, and settings', async () => {
    await saveEntry(makeEntry(10));
    await saveCheckIn(makeCheckIn(50));
    await addLogEntry(makeLogEntry());
    await setSetting('viewDay', 100);

    await clearAll();

    expect(await loadEntries('crew-1')).toHaveLength(0);
    expect(await loadCheckIns('crew-1')).toHaveLength(0);
    expect(await listLogEntries('crew-1')).toHaveLength(0);
    expect(await getSetting('viewDay', 999)).toBe(999);
  });
});

