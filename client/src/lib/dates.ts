/**
 * SQLite's `datetime('now')` (used for created_at columns) returns UTC time as
 * "YYYY-MM-DD HH:MM:SS" with no timezone marker. `new Date(...)` treats that
 * space-separated form as local time, not UTC, so it needs an explicit 'Z' to
 * parse correctly before converting to the viewer's local timezone for display.
 */
export function parseSqliteUtc(value: string): Date {
  return new Date(`${value.replace(' ', 'T')}Z`);
}
