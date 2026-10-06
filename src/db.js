// SQLite storage for the diary, using Node's built-in `node:sqlite` module.
//
// Two tables:
//   days    – one row per marked day: an icon, a color and a short label
//   journal – one row per day that has a journal entry (title + markdown body)

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = process.env.DB_PATH || path.resolve('data', 'dot-diary.sqlite');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS days (
    date       TEXT PRIMARY KEY,           -- YYYY-MM-DD
    icon       TEXT NOT NULL,              -- Material Symbols icon name
    color      TEXT NOT NULL DEFAULT 'black',
    label      TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS journal (
    date       TEXT PRIMARY KEY,           -- YYYY-MM-DD
    title      TEXT NOT NULL DEFAULT '',
    body       TEXT NOT NULL DEFAULT '',   -- markdown
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const sql = {
  listDays: db.prepare('SELECT date, icon, color, label FROM days ORDER BY date'),
  upsertDay: db.prepare(`
    INSERT INTO days (date, icon, color, label) VALUES (?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      icon = excluded.icon, color = excluded.color, label = excluded.label,
      updated_at = datetime('now')
  `),
  deleteDay: db.prepare('DELETE FROM days WHERE date = ?'),
  recentIcons: db.prepare(`
    SELECT icon FROM days GROUP BY icon ORDER BY MAX(updated_at) DESC, MAX(date) DESC LIMIT ?
  `),

  journalDates: db.prepare("SELECT date FROM journal WHERE title <> '' OR body <> '' ORDER BY date"),
  getJournal: db.prepare('SELECT date, title, body, updated_at AS updatedAt FROM journal WHERE date = ?'),
  upsertJournal: db.prepare(`
    INSERT INTO journal (date, title, body) VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      title = excluded.title, body = excluded.body, updated_at = datetime('now')
  `),
  deleteJournal: db.prepare('DELETE FROM journal WHERE date = ?'),
};

// ---- Days ----------------------------------------------------------------

export function listDays() {
  return sql.listDays.all();
}

export function saveDay(date, { icon, color, label }) {
  sql.upsertDay.run(date, icon, color, label);
}

export function deleteDay(date) {
  sql.deleteDay.run(date);
}

export function recentIcons(limit = 7) {
  return sql.recentIcons.all(limit).map(row => row.icon);
}

// ---- Journal -------------------------------------------------------------

export function listJournalDates() {
  return sql.journalDates.all().map(row => row.date);
}

export function getJournal(date) {
  return sql.getJournal.get(date) || { date, title: '', body: '', updatedAt: null };
}

/** Saves a journal entry. An entry with no title and no body is removed. */
export function saveJournal(date, { title, body }) {
  if (!title.trim() && !body.trim()) sql.deleteJournal.run(date);
  else sql.upsertJournal.run(date, title, body);
  return getJournal(date);
}
