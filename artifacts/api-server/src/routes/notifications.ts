import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { sendFeaturedNotifications } from "../scheduler";

const router = Router();

function parseEntityId(req: any): number | null {
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

router.get("/doctor", async (req, res) => {
  const doctorId = parseEntityId(req);
  if (!doctorId) return res.status(401).json({ error: "Login required" });
  try {
    const rows = await db.select().from(notificationsTable)
      .where(and(eq(notificationsTable.type, "doctor"), eq(notificationsTable.entityId, doctorId)))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(20);
    const unread = rows.filter(r => r.isRead === 0).length;
    res.json({ notifications: rows, unread });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.get("/lab", async (req, res) => {
  const labId = parseEntityId(req);
  if (!labId) return res.status(401).json({ error: "Login required" });
  try {
    const rows = await db.select().from(notificationsTable)
      .where(and(eq(notificationsTable.type, "lab"), eq(notificationsTable.entityId, labId)))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(20);
    const unread = rows.filter(r => r.isRead === 0).length;
    res.json({ notifications: rows, unread });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.put("/doctor/read-all", async (req, res) => {
  const doctorId = parseEntityId(req);
  if (!doctorId) return res.status(401).json({ error: "Login required" });
  try {
    await db.update(notificationsTable)
      .set({ isRead: 1 })
      .where(and(eq(notificationsTable.type, "doctor"), eq(notificationsTable.entityId, doctorId)));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.put("/lab/read-all", async (req, res) => {
  const labId = parseEntityId(req);
  if (!labId) return res.status(401).json({ error: "Login required" });
  try {
    await db.update(notificationsTable)
      .set({ isRead: 1 })
      .where(and(eq(notificationsTable.type, "lab"), eq(notificationsTable.entityId, labId)));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/trigger-test", async (req, res) => {
  try {
    await sendFeaturedNotifications();
    res.json({ success: true, message: "Notifications triggered" });
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
