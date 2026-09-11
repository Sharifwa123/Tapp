// backend/src/types/providers.ts

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

export interface ITranscriptionProvider {
  name: string;
  transcribe(filePath: string, apiKey: string, languageHint?: string): Promise<TranscriptionResult>;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface ITranslationProvider {
  name: string;
  translate(text: string, targetLanguage: string, apiKey: string, sourceLanguage?: string): Promise<TranslationResult>;
}

export type SummaryStyle = "quick" | "detailed" | "key_points" | "action_items" | "meeting_notes";

export interface SummarizationResult {
  style: SummaryStyle;
  content: string;
}

export interface ISummarizationProvider {
  name: string;
  summarize(text: string, style: SummaryStyle, apiKey: string): Promise<SummarizationResult>;
}

// Which named provider implementation to use for a given request.
// The user supplies their own key for whichever provider they pick —
// nothing is hardcoded to one vendor.
export type ProviderName = "openai" | "anthropic";

export interface RequestCredentials {
  provider: ProviderName;
  apiKey: string;
}
