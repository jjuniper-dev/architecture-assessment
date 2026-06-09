import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface AppDb { db: SqliteDatabase; migrate: () => void }

export function openDb(filename = process.env.DB_PATH ?? path.resolve('data/assessment.sqlite')): AppDb {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  return { db, migrate: () => migrate(db) };
}

export function migrate(db: SqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const name = '001_initial_assessment_schema.sql';
  const applied = db.prepare('SELECT 1 FROM migrations WHERE name = ?').get(name);
  if (!applied) {
    db.exec(`
      CREATE TABLE assessment_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE respondents (
        id TEXT PRIMARY KEY,
        org TEXT NOT NULL,
        role TEXT NOT NULL,
        include_track2 INTEGER NOT NULL DEFAULT 0,
        submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        respondent_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (respondent_id) REFERENCES respondents(id) ON DELETE CASCADE,
        UNIQUE(respondent_id, question_id)
      );
      CREATE INDEX idx_answers_question ON answers(question_id);
      CREATE INDEX idx_respondents_org_role ON respondents(org, role);
    `);
    db.prepare('INSERT INTO assessment_settings (key, value) VALUES (?, ?)').run('survey_closed', 'false');
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
  }
}

export function setSurveyClosed(db: SqliteDatabase, closed: boolean): void {
  db.prepare(`INSERT INTO assessment_settings (key, value, updated_at) VALUES ('survey_closed', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run(String(closed));
}

export function isSurveyClosed(db: SqliteDatabase): boolean {
  const row = db.prepare("SELECT value FROM assessment_settings WHERE key = 'survey_closed'").get() as { value: string } | undefined;
  return row?.value === 'true';
}
