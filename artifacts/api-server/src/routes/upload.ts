import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import { db, appUsersTable } from "@workspace/db";

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP images allowed"));
  },
});

function parseAuth(req: any): number | null {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id] = decoded.split(":");
    const n = Number(id);
    return isNaN(n) ? null : n;
  } catch { return null; }
}

router.post("/avatar", upload.single("avatar"), async (req: any, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

  const BASE_PATH = process.env.BASE_PATH ?? "/api";
  const avatarUrl = `${BASE_PATH}/upload/avatars/${req.file.filename}`;

  try {
    await db.update(appUsersTable)
      .set({ avatarUrl })
      .where(eq(appUsersTable.id, userId));

    res.json({ avatarUrl });
  } catch (err) {
    req.log.error({ err }, "Avatar upload failed");
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/avatars/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: "Not found" }); return; }
  res.sendFile(filePath);
});

export default router;
