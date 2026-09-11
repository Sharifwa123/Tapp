// mobile/src/storage/types.ts

export type MediaKind = "audio" | "video" | "document" | "recording";

export type ProcessingStatus = "idle" | "queued" | "processing" | "done" | "error";

export interface Project {
  id: string;
  name: string;
  createdAt: number; // epoch ms
  updatedAt: number;
}

// A single piece of content that belongs to a project — could be the
// original import/recording, or something generated from it (a
// translation, a transcript export, etc). The spec requires the app to
// always distinguish original vs generated, so `isOriginal` and
// `derivedFromId` carry that relationship explicitly.
export interface MediaItem {
  id: string;
  projectId: string;
  kind: MediaKind;
  fileName: string;
  fileUri: string; // local file path
  isOriginal: boolean;
  derivedFromId: string | null; // id of the MediaItem this was generated from, if any
  languageCode: string | null;
  durationMs: number | null; // null for documents
  sizeBytes: number;
  createdAt: number;
}

export interface Transcript {
  id: string;
  mediaItemId: string;
  fullText: string;
  segmentsJson: string; // JSON-serialized TranscriptSegment[]
  languageCode: string;
  status: ProcessingStatus;
  errorMessage: string | null;
  createdAt: number;
}

export interface Translation {
  id: string;
  transcriptId: string;
  targetLanguage: string;
  translatedText: string;
  status: ProcessingStatus;
  errorMessage: string | null;
  createdAt: number;
}

export type SummaryStyle = "quick" | "detailed" | "key_points" | "action_items" | "meeting_notes";

export interface Summary {
  id: string;
  transcriptId: string;
  style: SummaryStyle;
  content: string;
  status: ProcessingStatus;
  errorMessage: string | null;
  createdAt: number;
}

export interface ExportRecord {
  id: string;
  projectId: string;
  format: string; // "txt" | "pdf" | "docx" | "srt" | "vtt" | "json" | "csv"
  fileUri: string;
  createdAt: number;
}
