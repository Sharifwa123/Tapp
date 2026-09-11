// mobile/src/services/apiClient.ts
import { getCredentials } from "./credentialsService";
import type { TranscriptionResult, TranslationResult, SummarizationResult, SummaryStyle } from "../providers/types";

// Points at your backend. In development this is your machine's LAN/tunnel
// address; change this one constant when you deploy the backend somewhere
// permanent (Railway/Render/Fly.io/etc) — nothing else in the app needs
// to change since every call goes through this module.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

class MissingCredentialsError extends Error {
  constructor() {
    super("No AI provider configured. Add your API key in Settings first.");
    this.name = "MissingCredentialsError";
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const creds = await getCredentials();
  if (!creds) throw new MissingCredentialsError();
  return {
    "x-ai-provider": creds.provider,
    "x-ai-key": creds.apiKey,
  };
}

export async function transcribeAudio(
  fileUri: string,
  fileName: string,
  languageHint?: string
): Promise<TranscriptionResult> {
  const headers = await authHeaders();

  const form = new FormData();
  form.append("file", {
    uri: fileUri,
    name: fileName,
    type: "audio/m4a",
  } as any);
  if (languageHint) form.append("languageHint", languageHint);

  const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Transcription request failed (${response.status})`);
  }

  return response.json();
}

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> {
  const headers = await authHeaders();

  const response = await fetch(`${API_BASE_URL}/api/translate`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLanguage, sourceLanguage }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Translation request failed (${response.status})`);
  }

  return response.json();
}

export async function summarizeText(text: string, style: SummaryStyle): Promise<SummarizationResult> {
  const headers = await authHeaders();

  const response = await fetch(`${API_BASE_URL}/api/summarize`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ text, style }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Summarization request failed (${response.status})`);
  }

  return response.json();
}

export { MissingCredentialsError };
