// backend/src/routes/transcribe.ts
import { Router } from "express";
import fs from "fs";
import { upload } from "../middleware/upload";
import { requireCredentials } from "../middleware/credentials";
import { getTranscriptionProvider } from "../providers/registry";

export const transcribeRouter = Router();

// POST /api/transcribe
// multipart/form-data with field "file", plus x-ai-provider / x-ai-key headers.
// Optional form field "languageHint" (e.g. "en") if the user manually
// overrides auto-detection.
transcribeRouter.post("/", requireCredentials, upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded — expected multipart field 'file'." });
    return;
  }

  const { provider, apiKey } = req.credentials!;
  const languageHint = typeof req.body.languageHint === "string" ? req.body.languageHint : undefined;

  try {
    const transcriptionProvider = getTranscriptionProvider(provider);
    const result = await transcriptionProvider.transcribe(req.file.path, apiKey, languageHint);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Transcription failed." });
  } finally {
    // Always clean up the temp upload, success or failure — we never
    // retain the user's original media on the server.
    fs.unlink(req.file.path, () => {});
  }
});
