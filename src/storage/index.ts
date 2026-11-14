// Storage module index — re-exports all public API per CONTRACTS.md section 4.3.
// All functions are async, return safe defaults on failure, and never throw into the UI.

export { saveEntry, loadEntries } from './entries';
export { saveCheckIn, loadCheckIns } from './checkins';
export { addLogEntry, listLogEntries } from './log';
export { getSetting, setSetting, clearAll } from './settings';
