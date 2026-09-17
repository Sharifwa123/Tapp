// mobile/src/providers/types.ts
// Mirrors backend/src/types/providers.ts — only the shapes the client
// consumes from API responses, not the server-side provider interfaces.

export interface LanguageDetectionResult {
  languageCode: string;
  confidence: "low" | "medium" | "high";
}

export interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  detectedLanguage: LanguageDetectionResult;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export type SummaryStyle = "quick" | "detailed" | "key_points" | "action_items" | "meeting_notes";

export interface SummarizationResult {
  style: SummaryStyle;
  content: string;
}
