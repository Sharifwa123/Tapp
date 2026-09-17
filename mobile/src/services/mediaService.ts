// mobile/src/services/mediaService.ts
import { Directory, File, Paths } from "expo-file-system";
import { createProject } from "../storage/projectRepository";
import { createMediaItem } from "../storage/mediaRepository";
import type { MediaItem, MediaKind } from "../storage/types";

const mediaDir = new Directory(Paths.document, "tapp-media");

function ensureMediaDir(): void {
  if (!mediaDir.exists) {
    mediaDir.create({ intermediates: true });
  }
}

function inferKindFromMime(mimeType: string | null | undefined, fileName: string): MediaKind {
  if (mimeType?.startsWith("audio/")) return "audio";
  if (mimeType?.startsWith("video/")) return "video";
  const lower = fileName.toLowerCase();
  if (/\.(mp3|m4a|wav|aac|ogg|flac)$/.test(lower)) return "audio";
  if (/\.(mp4|mov|mkv|avi|webm)$/.test(lower)) return "video";
  return "document";
}

export interface ImportedMedia {
  project: Awaited<ReturnType<typeof createProject>>;
  mediaItem: MediaItem;
}

// Copies a picked/recorded file into the app's own sandboxed storage
// (so it survives even if the user deletes it from wherever they
// originally picked it from), creates a new project for it, and
// registers the media item in the database as the "original" — never
// overwritten by anything generated later.
export async function importMediaAsNewProject(params: {
  sourceUri: string;
  fileName: string;
  mimeType?: string | null;
  projectName?: string;
  durationMs?: number | null;
}): Promise<ImportedMedia> {
  ensureMediaDir();

  const kind = inferKindFromMime(params.mimeType, params.fileName);
  const sourceFile = new File(params.sourceUri);
  const destFile = new File(mediaDir, `${Date.now()}-${params.fileName}`);

  await sourceFile.copy(destFile);

  const sizeBytes = destFile.exists ? destFile.size : 0;

  const project = await createProject(params.projectName || params.fileName);

  const mediaItem = await createMediaItem({
    projectId: project.id,
    kind,
    fileName: params.fileName,
    fileUri: destFile.uri,
    isOriginal: true,
    durationMs: params.durationMs ?? null,
    sizeBytes,
  });

  return { project, mediaItem };
}

// Registers a piece of generated content (e.g. a translated audio file)
// as a derived media item linked back to its source — used later by the
// translation/export pipeline, not by the import flow itself.
export async function registerDerivedMedia(params: {
  projectId: string;
  derivedFromId: string;
  kind: MediaKind;
  fileName: string;
  fileUri: string;
  languageCode?: string | null;
  durationMs?: number | null;
}): Promise<MediaItem> {
  const file = new File(params.fileUri);
  const sizeBytes = file.exists ? file.size : 0;

  return createMediaItem({
    projectId: params.projectId,
    kind: params.kind,
    fileName: params.fileName,
    fileUri: params.fileUri,
    isOriginal: false,
    derivedFromId: params.derivedFromId,
    languageCode: params.languageCode ?? null,
    durationMs: params.durationMs ?? null,
    sizeBytes,
  });
}
