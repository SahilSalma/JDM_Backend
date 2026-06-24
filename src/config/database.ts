import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from './env';
import * as schema from '../models/schema';

const dbPath = path.resolve(env.DATABASE_PATH);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite: DatabaseType = new Database(dbPath);

// Use DELETE journal mode to avoid .db-wal / .db-shm files that
// cause git merge conflicts and corruption on deploy.
sqlite.pragma('journal_mode = DELETE');

// Enforce foreign key constraints
sqlite.pragma('foreign_keys = ON');

// Enable busy timeout to avoid SQLITE_BUSY errors
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
