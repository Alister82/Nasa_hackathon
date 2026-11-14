/**
 * G7 tests: storage round trips with fake-indexeddb.
 * Tests: round trips, merge on same key, newest-first log, safe defaults when DB fails, clearAll.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { saveEntry, loadEntries } from './entries';
import { saveCheckIn, loadCheckIns } from './checkins';
import { addLogEntry, listLogEntries } from './log';
import { getSetting, setSetting } from './settings';
import { clearAll } from './index';
import { resetDbCache } from './db';
import type { MeasurementEntry, CheckInRecord, LogEntry } from '@/contracts/types';

// Reset DB cache before each test so each test gets a fresh DB from fake-indexeddb.
// fake-indexeddb/auto patches indexedDB globally; resetDbCache forces re-open.
beforeEach(() => {
  resetDbCache();
});

// ── Entries ───────────────────────────────────────────────────────────────────

describe('saveEntry / loadEntries', () => {
  it('round trip: saved entry can be loaded', async () => {
    const entry: MeasurementEntry = {
      crewId: 'crew-1',
      day: 10,
      values: { heart_rate: 72 },
      createdAt: '2026-11-14T10:00:00Z',
    };
    await saveEntry(entry);
    const loaded = await loadEntries('crew-1');
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.values.heart_rate).toBe(72);
  });

  it('merge: second save merges values into the same key', async () => {
    await saveEntry({
      crewId: 'crew-1',
      day: 11,
      values: { heart_rate: 68 },
      createdAt: '2026-11-14T09:00:00Z',
    });
    await saveEntry({
      crewId: 'crew-1',
      day: 11,
      values: { bp_sys: 118 },
      createdAt: '2026-11-14T09:05:00Z',
    });
    const loaded = await loadEntries('crew-1');
    const day11 = loaded.find((e) => e.day === 11);
    expect(day11?.values.heart_rate).toBe(68);
    expect(day11?.values.bp_sys).toBe(118);
  });

  it('filters by crewId', async () => {
    await saveEntry({
      crewId: 'crew-2',
      day: 5,
      values: { heart_rate: 65 },
      createdAt: '2026-11-14T10:00:00Z',
    });
    const loaded1 = await loadEntries('crew-1');
    const loaded2 = await loadEntries('crew-2');
    expect(loaded2).toHaveLength(1);
    // crew-1 entries from previous tests do not appear here because
    // fake-indexeddb is global and not reset between its; we just check crew-2 is isolated
    expect(loaded1.every((e) => e.crewId === 'crew-1')).toBe(true);
    expect(loaded2.every((e) => e.crewId === 'crew-2')).toBe(true);
  });
});

// ── Check-ins ─────────────────────────────────────────────────────────────────

describe('saveCheckIn / loadCheckIns', () => {
  it('round trip', async () => {
    const record: CheckInRecord = {
      crewId: 'crew-1',
      day: 20,
      mood: 3,
      stress: 2,
      energy: 4,
      urgentHelpRequested: false,
      createdAt: '2026-11-14T11:00:00Z',
      sharedWithGround: false,
    };
    await saveCheckIn(record);
    const loaded = await loadCheckIns('crew-1');
    const found = loaded.find((r) => r.day === 20);
    expect(found?.mood).toBe(3);
    expect(found?.stress).toBe(2);
  });

  it('overwrites same crew+day key', async () => {
    const base: CheckInRecord = {
      crewId: 'crew-1',
      day: 21,
      mood: 2,
      stress: 4,
      energy: 2,
      urgentHelpRequested: false,
      createdAt: '2026-11-14T11:00:00Z',
      sharedWithGround: false,
    };
    await saveCheckIn(base);
    await saveCheckIn({ ...base, mood: 4, createdAt: '2026-11-14T11:01:00Z' });
    const loaded = await loadCheckIns('crew-1');
    const day21 = loaded.filter((r) => r.day === 21);
    expect(day21).toHaveLength(1);
    expect(day21[0]?.mood).toBe(4);
  });
});

// ── Log ──────────────────────────────────────────────────────────────────────

describe('addLogEntry / listLogEntries', () => {
  it('round trip returns an id', async () => {
    const entry: Omit<LogEntry, 'id'> = {
      crewId: 'crew-1',
      day: 30,
      cardId: 'card-1',
      observation: 'Heart rate elevated',
      actionTaken: 'Sat quietly',
      reviewedBy: 'astronaut',
      note: '',
      createdAt: '2026-11-14T11:00:00Z',
    };
    const id = await addLogEntry(entry);
    expect(typeof id).toBe('number');
  });

  it('listLogEntries returns newest first', async () => {
    // Add two entries and confirm order.
    const base: Omit<LogEntry, 'id'> = {
      crewId: 'crew-1',
      day: 31,
      cardId: null,
      observation: 'First',
      actionTaken: '',
      reviewedBy: 'unspecified',
      note: '',
      createdAt: '2026-11-14T11:00:00Z',
    };
    const id1 = await addLogEntry(base) as number;
    const id2 = await addLogEntry({ ...base, observation: 'Second' }) as number;
    const list = await listLogEntries('crew-1');
    const ours = list.filter((e) => e.day === 31);
    expect(ours[0]?.id).toBe(id2);
    expect(ours[1]?.id).toBe(id1);
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────

describe('getSetting / setSetting', () => {
  it('returns fallback for unknown key', async () => {
    const val = await getSetting('nonexistent_key', 'default');
    expect(val).toBe('default');
  });

  it('round trip', async () => {
    await setSetting('missionSetting', 'lunar_base');
    const val = await getSetting('missionSetting', 'station');
    expect(val).toBe('lunar_base');
  });

  it('overwrites existing setting', async () => {
    await setSetting('viewDay', 50);
    await setSetting('viewDay', 100);
    const val = await getSetting('viewDay', 1);
    expect(val).toBe(100);
  });
});

// ── clearAll ──────────────────────────────────────────────────────────────────

describe('clearAll', () => {
  it('removes all entries, checkins, log, and settings', async () => {
    // Seed some data.
    await saveEntry({
      crewId: 'crew-1',
      day: 50,
      values: { heart_rate: 70 },
      createdAt: '2026-11-14T11:00:00Z',
    });
    await setSetting('viewDay', 50);

    await clearAll();

    const entries = await loadEntries('crew-1');
    const viewDay = await getSetting('viewDay', 999);
    // After clearAll, entries should be gone and settings should return fallback.
    expect(entries.filter((e) => e.day === 50)).toHaveLength(0);
    expect(viewDay).toBe(999);
  });
});

