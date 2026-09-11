// backend/src/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { healthRouter } from "./routes/health";
import { transcribeRouter } from "./routes/transcribe";
import { translateRouter } from "./routes/translate";
import { summarizeRouter } from "./routes/summarize";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // generous for long transcripts being summarized/translated

app.use("/api/health", healthRouter);
app.use("/api/transcribe", transcribeRouter);
app.use("/api/translate", translateRouter);
app.use("/api/summarize", summarizeRouter);

// Centralized error handler — catches anything that slipped past a route's
// own try/catch (e.g. malformed JSON body) instead of leaking a stack trace.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`TApp backend listening on port ${PORT}`);
});
