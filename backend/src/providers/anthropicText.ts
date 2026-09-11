// backend/src/providers/anthropicText.ts
import type {
  ITranslationProvider,
  ISummarizationProvider,
  TranslationResult,
  SummarizationResult,
  SummaryStyle,
} from "../types/providers";

async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${errText}`);
  }

  const data: any = await response.json();
  return (data.content || []).map((b: any) => b.text || "").join("\n");
}

export const anthropicTranslationProvider: ITranslationProvider = {
  name: "anthropic",

  async translate(text, targetLanguage, apiKey, sourceLanguage): Promise<TranslationResult> {
    const prompt = `Translate the following text into ${targetLanguage}. Respond with ONLY the translated text, no preamble, no explanation.\n\nText:\n${text}`;
    const translatedText = await callClaude(apiKey, prompt);
    return {
      translatedText: translatedText.trim(),
      sourceLanguage: sourceLanguage || "auto-detected",
      targetLanguage,
    };
  },
};

const STYLE_INSTRUCTIONS: Record<SummaryStyle, string> = {
  quick: "Write a short 2-3 sentence overview.",
  detailed: "Write a comprehensive, well-structured summary covering all major points.",
  key_points: "Extract the key points as a bulleted list.",
  action_items:
    "Extract only concrete tasks, decisions, and action items as a bulleted list. If none exist, say so plainly.",
  meeting_notes:
    "Structure the content into sections: Participants, Topics Discussed, Decisions Made, Action Items, Important Dates. Omit any section with no relevant content.",
};

export const anthropicSummarizationProvider: ISummarizationProvider = {
  name: "anthropic",

  async summarize(text, style, apiKey): Promise<SummarizationResult> {
    const instruction = STYLE_INSTRUCTIONS[style];
    const prompt = `${instruction}\n\nDo not add a preamble like "Here is the summary". Just give the content directly.\n\nContent:\n${text}`;
    const content = await callClaude(apiKey, prompt);
    return { style, content: content.trim() };
  },
};
