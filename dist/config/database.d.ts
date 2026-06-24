import Database, { type Database as DatabaseType } from 'better-sqlite3';
import * as schema from '../models/schema';
export declare const sqlite: DatabaseType;
export declare const db: import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {
    $client: Database.Database;
};
export type DB = typeof db;
//# sourceMappingURL=database.d.ts.map