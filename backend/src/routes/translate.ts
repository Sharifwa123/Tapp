// backend/src/routes/translate.ts
import { Router } from "express";
import { requireCredentials } from "../middleware/credentials";
import { getTranslationProvider } from "../providers/registry";

export const translateRouter = Router();

// POST /api/translate
// JSON body: { text: string, targetLanguage: string, sourceLanguage?: string }
translateRouter.post("/", requireCredentials, async (req, res) => {
  const { text, targetLanguage, sourceLanguage } = req.body || {};

  if (typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "Missing 'text' in request body." });
    return;
  }
  if (typeof targetLanguage !== "string" || targetLanguage.trim().length === 0) {
    res.status(400).json({ error: "Missing 'targetLanguage' in request body." });
    return;
  }

  const { provider, apiKey } = req.credentials!;

  try {
    const translationProvider = getTranslationProvider(provider);
    const result = await translationProvider.translate(text, targetLanguage, apiKey, sourceLanguage);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Translation failed." });
  }
});
