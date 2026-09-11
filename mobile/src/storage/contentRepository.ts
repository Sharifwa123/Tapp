// mobile/src/storage/contentRepository.ts
import { getDatabase } from "./database";
import type {
  Transcript,
  Translation,
  Summary,
  SummaryStyle,
  ProcessingStatus,
  ExportRecord,
} from "./types";
import type { TranscriptSegment } from "../providers/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- Transcripts ----------

export async function createTranscript(input: {
  mediaItemId: string;
  fullText: string;
  segments: TranscriptSegment[];
  languageCode: string;
  status: ProcessingStatus;
  errorMessage?: string | null;
}): Promise<Transcript> {
  const db = await getDatabase();
  const record: Transcript = {
    id: generateId(),
    mediaItemId: input.mediaItemId,
    fullText: input.fullText,
    segmentsJson: JSON.stringify(input.segments),
    languageCode: input.languageCode,
    status: input.status,
    errorMessage: input.errorMessage ?? null,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO transcripts (id, mediaItemId, fullText, segmentsJson, languageCode, status, errorMessage, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    record.mediaItemId,
    record.fullText,
    record.segmentsJson,
    record.languageCode,
    record.status,
    record.errorMessage,
    record.createdAt
  );

  return record;
}

export async function getTranscriptForMediaItem(mediaItemId: string): Promise<Transcript | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Transcript>(
    "SELECT * FROM transcripts WHERE mediaItemId = ? ORDER BY createdAt DESC LIMIT 1",
    mediaItemId
  );
  return row ?? null;
}

export async function updateTranscriptText(id: string, fullText: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE transcripts SET fullText = ? WHERE id = ?", fullText, id);
}

// ---------- Translations ----------

export async function createTranslation(input: {
  transcriptId: string;
  targetLanguage: string;
  translatedText: string;
  status: ProcessingStatus;
  errorMessage?: string | null;
}): Promise<Translation> {
  const db = await getDatabase();
  const record: Translation = {
    id: generateId(),
    transcriptId: input.transcriptId,
    targetLanguage: input.targetLanguage,
    translatedText: input.translatedText,
    status: input.status,
    errorMessage: input.errorMessage ?? null,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO translations (id, transcriptId, targetLanguage, translatedText, status, errorMessage, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    record.transcriptId,
    record.targetLanguage,
    record.translatedText,
    record.status,
    record.errorMessage,
    record.createdAt
  );

  return record;
}

export async function getTranslationsForTranscript(transcriptId: string): Promise<Translation[]> {
  const db = await getDatabase();
  return db.getAllAsync<Translation>(
    "SELECT * FROM translations WHERE transcriptId = ? ORDER BY createdAt DESC",
    transcriptId
  );
}

// ---------- Summaries ----------

export async function createSummary(input: {
  transcriptId: string;
  style: SummaryStyle;
  content: string;
  status: ProcessingStatus;
  errorMessage?: string | null;
}): Promise<Summary> {
  const db = await getDatabase();
  const record: Summary = {
    id: generateId(),
    transcriptId: input.transcriptId,
    style: input.style,
    content: input.content,
    status: input.status,
    errorMessage: input.errorMessage ?? null,
    createdAt: Date.now(),
  };

  await db.runAsync(
    `INSERT INTO summaries (id, transcriptId, style, content, status, errorMessage, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    record.transcriptId,
    record.style,
    record.content,
    record.status,
    record.errorMessage,
    record.createdAt
  );

  return record;
}

export async function getSummariesForTranscript(transcriptId: string): Promise<Summary[]> {
  const db = await getDatabase();
  return db.getAllAsync<Summary>(
    "SELECT * FROM summaries WHERE transcriptId = ? ORDER BY createdAt DESC",
    transcriptId
  );
}

// ---------- Exports ----------

export async function createExportRecord(input: {
  projectId: string;
  format: string;
  fileUri: string;
}): Promise<ExportRecord> {
  const db = await getDatabase();
  const record: ExportRecord = {
    id: generateId(),
    projectId: input.projectId,
    format: input.format,
    fileUri: input.fileUri,
    createdAt: Date.now(),
  };

  await db.runAsync(
    "INSERT INTO exports (id, projectId, format, fileUri, createdAt) VALUES (?, ?, ?, ?, ?)",
    record.id,
    record.projectId,
    record.format,
    record.fileUri,
    record.createdAt
  );

  return record;
}

export async function getExportsForProject(projectId: string): Promise<ExportRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<ExportRecord>(
    "SELECT * FROM exports WHERE projectId = ? ORDER BY createdAt DESC",
    projectId
  );
}
