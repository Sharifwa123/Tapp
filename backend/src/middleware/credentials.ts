// backend/src/middleware/credentials.ts
import type { Request, Response, NextFunction } from "express";
import type { ProviderName, RequestCredentials } from "../types/providers";

const VALID_PROVIDERS: ProviderName[] = ["openai", "anthropic"];

// Extends Express's Request type so downstream route handlers get
// typed access to req.credentials without casting.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      credentials?: RequestCredentials;
    }
  }
}

// Reads the caller's own AI provider + API key from request headers.
// Nothing is hardcoded server-side — the mobile app supplies whichever
// provider/key the user configured in Settings.
//
// Expected headers:
//   x-ai-provider: "openai" | "anthropic"
//   x-ai-key: "<the user's own API key>"
export function requireCredentials(req: Request, res: Response, next: NextFunction) {
  const provider = req.header("x-ai-provider");
  const apiKey = req.header("x-ai-key");

  if (!provider || !VALID_PROVIDERS.includes(provider as ProviderName)) {
    res.status(400).json({
      error: `Missing or invalid x-ai-provider header. Expected one of: ${VALID_PROVIDERS.join(", ")}`,
    });
    return;
  }

  if (!apiKey || apiKey.trim().length === 0) {
    res.status(401).json({ error: "Missing x-ai-key header — provide your own API key for the selected provider." });
    return;
  }

  req.credentials = { provider: provider as ProviderName, apiKey };
  next();
}
