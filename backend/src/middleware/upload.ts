// backend/src/middleware/upload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

// Files land in the OS temp dir, not inside the repo — keeps uploaded
// media out of source control and out of any accidental git add.
const uploadDir = path.join(os.tmpdir(), "tapp-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || "";
    cb(null, `${unique}${ext}`);
  },
});

// 500MB cap — generous for long recordings, but bounded so a single
// upload can't exhaust disk. Adjust here if real usage needs differ.
export const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
});
