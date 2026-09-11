// backend/src/routes/summarize.ts
import { Router } from "express";
import { requireCredentials } from "../middleware/credentials";
import { getSummarizationProvider } from "../providers/registry";
import type { SummaryStyle } from "../types/providers";

export const summarizeRouter = Router();

const VALID_STYLES: SummaryStyle[] = [
  "quick",
  "detailed",
  "key_points",
  "action_items",
  "meeting_notes",
];

// POST /api/summarize
// JSON body: { text: string, style: SummaryStyle }
summarizeRouter.post("/", requireCredentials, async (req, res) => {
  const { text, style } = req.body || {};

  if (typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "Missing 'text' in request body." });
    return;
  }
  if (!VALID_STYLES.includes(style)) {
    res.status(400).json({ error: `Invalid 'style'. Expected one of: ${VALID_STYLES.join(", ")}` });
    return;
  }

  const { provider, apiKey } = req.credentials!;

  try {
    const summarizationProvider = getSummarizationProvider(provider);
    const result = await summarizationProvider.summarize(text, style, apiKey);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Summarization failed." });
  }
});
