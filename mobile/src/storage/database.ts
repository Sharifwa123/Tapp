// mobile/src/storage/database.ts
import * as SQLite from "expo-sqlite";

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Opens (and caches) the single app-wide database connection. Call this
// once at app startup before any repository functions run.
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync("tapp.db");
  await runMigrations(dbInstance);
  return dbInstance;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      kind TEXT NOT NULL,
      fileName TEXT NOT NULL,
      fileUri TEXT NOT NULL,
      isOriginal INTEGER NOT NULL,
      derivedFromId TEXT,
      languageCode TEXT,
      durationMs INTEGER,
      sizeBytes INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY NOT NULL,
      mediaItemId TEXT NOT NULL,
      fullText TEXT NOT NULL,
      segmentsJson TEXT NOT NULL,
      languageCode TEXT NOT NULL,
      status TEXT NOT NULL,
      errorMessage TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (mediaItemId) REFERENCES media_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS translations (
      id TEXT PRIMARY KEY NOT NULL,
      transcriptId TEXT NOT NULL,
      targetLanguage TEXT NOT NULL,
      translatedText TEXT NOT NULL,
      status TEXT NOT NULL,
      errorMessage TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (transcriptId) REFERENCES transcripts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY NOT NULL,
      transcriptId TEXT NOT NULL,
      style TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL,
      errorMessage TEXT,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (transcriptId) REFERENCES transcripts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      format TEXT NOT NULL,
      fileUri TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_media_project ON media_items(projectId);
    CREATE INDEX IF NOT EXISTS idx_transcript_media ON transcripts(mediaItemId);
    CREATE INDEX IF NOT EXISTS idx_translation_transcript ON translations(transcriptId);
    CREATE INDEX IF NOT EXISTS idx_summary_transcript ON summaries(transcriptId);
    CREATE INDEX IF NOT EXISTS idx_export_project ON exports(projectId);
  `);
}
