// mobile/src/storage/mediaRepository.ts
import * as FileSystem from "expo-file-system";
import { getDatabase } from "./database";
import type { MediaItem, MediaKind } from "./types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreateMediaItemInput {
  projectId: string;
  kind: MediaKind;
  fileName: string;
  fileUri: string;
  isOriginal: boolean;
  derivedFromId?: string | null;
  languageCode?: string | null;
  durationMs?: number | null;
  sizeBytes: number;
}

export async function createMediaItem(input: CreateMediaItemInput): Promise<MediaItem> {
  const db = await getDatabase();
  const item: MediaItem = {
    id: generateId(),
    projectId: input.projectId,
    kind: input.kind,
    fileName: input.fileName,
    fileUri: input.fileUri,
    isOriginal: input.isOriginal,
    derivedFromId: input.derivedFromId ?? null,
    languageCode: input.languageCode ?? null,
    durationMs: input.durationMs ?? null,
    sizeBytes: input.sizeBytes,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO media_items
      (id, projectId, kind, fileName, fileUri, isOriginal, derivedFromId, languageCode, durationMs, sizeBytes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id,
    item.projectId,
    item.kind,
    item.fileName,
    item.fileUri,
    item.isOriginal ? 1 : 0,
    item.derivedFromId,
    item.languageCode,
    item.durationMs,
    item.sizeBytes,
    item.createdAt
  );

  return item;
}

function rowToMediaItem(row: any): MediaItem {
  return { ...row, isOriginal: !!row.isOriginal };
}

export async function getMediaItemsForProject(projectId: string): Promise<MediaItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM media_items WHERE projectId = ? ORDER BY createdAt ASC",
    projectId
  );
  return rows.map(rowToMediaItem);
}

export async function getMediaItem(id: string): Promise<MediaItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>("SELECT * FROM media_items WHERE id = ?", id);
  return row ? rowToMediaItem(row) : null;
}

// Returns everything derived from a given media item (transcripts,
// translations exported as media, etc.) — used to build the
// "Original -> Transcript -> Translation -> ..." relationship view.
export async function getDerivedMediaItems(mediaItemId: string): Promise<MediaItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM media_items WHERE derivedFromId = ? ORDER BY createdAt ASC",
    mediaItemId
  );
  return rows.map(rowToMediaItem);
}

export async function getAllMediaItemsByKind(kind: MediaKind): Promise<MediaItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM media_items WHERE kind = ? ORDER BY createdAt DESC",
    kind
  );
  return rows.map(rowToMediaItem);
}

// Deletes the on-disk file for a media item. Call this BEFORE removing
// the DB row (or before deleting a project) — SQLite cascade deletes
// only clean up rows, never the actual files they reference.
export async function deleteMediaFile(item: MediaItem): Promise<void> {
  const info = await FileSystem.getInfoAsync(item.fileUri);
  if (info.exists) {
    await FileSystem.deleteAsync(item.fileUri, { idempotent: true });
  }
}
