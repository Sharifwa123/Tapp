// backend/src/providers/openaiTranscription.ts
import fs from "fs";
import type { ITranscriptionProvider } from "../types/providers";

export const openaiTranscriptionProvider: ITranscriptionProvider = {
  name: "openai",

  async transcribe(filePath, apiKey, languageHint) {
    const form = new FormData();
    form.append("file", new Blob([fs.readFileSync(filePath)]), "audio.mp3");
    form.append("model", "whisper-1");
    form.append("response_format", "verbose_json");
    if (languageHint) form.append("language", languageHint);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI transcription failed (${response.status}): ${errText}`);
    }

    const data: any = await response.json();

    const segments = (data.segments || []).map((s: any) => ({
      startMs: Math.round(s.start * 1000),
      endMs: Math.round(s.end * 1000),
      text: String(s.text || "").trim(),
    }));

    return {
      fullText: data.text || "",
      segments,
      detectedLanguage: {
        languageCode: data.language || "unknown",
        confidence: "high" as const,
      },
    };
  },
};
