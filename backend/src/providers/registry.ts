// backend/src/providers/registry.ts
import { openaiTranscriptionProvider } from "./openaiTranscription";
import { anthropicTranslationProvider, anthropicSummarizationProvider } from "./anthropicText";
import type {
  ProviderName,
  ITranscriptionProvider,
  ITranslationProvider,
  ISummarizationProvider,
} from "../types/providers";

// Only OpenAI currently implements transcription (Whisper). Adding another
// vendor's transcription provider later means adding one entry here —
// no route or calling code needs to change.
const transcriptionProviders: Partial<Record<ProviderName, ITranscriptionProvider>> = {
  openai: openaiTranscriptionProvider,
};

const translationProviders: Partial<Record<ProviderName, ITranslationProvider>> = {
  anthropic: anthropicTranslationProvider,
};

const summarizationProviders: Partial<Record<ProviderName, ISummarizationProvider>> = {
  anthropic: anthropicSummarizationProvider,
};

export function getTranscriptionProvider(name: ProviderName): ITranscriptionProvider {
  const provider = transcriptionProviders[name];
  if (!provider) throw new Error(`No transcription provider registered for "${name}"`);
  return provider;
}

export function getTranslationProvider(name: ProviderName): ITranslationProvider {
  const provider = translationProviders[name];
  if (!provider) throw new Error(`No translation provider registered for "${name}"`);
  return provider;
}

export function getSummarizationProvider(name: ProviderName): ISummarizationProvider {
  const provider = summarizationProviders[name];
  if (!provider) throw new Error(`No summarization provider registered for "${name}"`);
  return provider;
}
