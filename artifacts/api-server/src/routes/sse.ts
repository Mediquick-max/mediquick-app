import { Router } from "express";

const router = Router();

interface SSEClient {
  userId: number;
  res: any;
}

const clients: SSEClient[] = [];

function parseAuth(token: string): number | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id] = decoded.split(":");
    const n = Number(id);
    return isNaN(n) ? null : n;
  } catch { return null; }
}

export function sendSSE(userId: number, event: string, data: object) {
  const targets = clients.filter(c => c.userId === userId);
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  targets.forEach(c => {
    try { c.res.write(payload); } catch {}
  });
}

export function broadcastSSE(event: string, data: object) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => {
    try { c.res.write(payload); } catch {}
  });
}

router.get("/stream", (req, res) => {
  const token = (req.query.token as string) ?? "";
  const userId = parseAuth(token);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const client: SSEClient = { userId, res };
  clients.push(client);

  res.write(`event: connected\ndata: ${JSON.stringify({ userId, time: new Date().toISOString() })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(`:heartbeat\n\n`); } catch {}
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const idx = clients.indexOf(client);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

export default router;
