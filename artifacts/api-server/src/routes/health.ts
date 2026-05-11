import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/db-test", async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const safeUrl = dbUrl.replace(/:([^:@]+)@/, ":***@");
  try {
    const result = await pool.query("SELECT NOW() as time");
    res.json({ status: "db_ok", time: result.rows[0].time, using: safeUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: "db_error", error: message, using: safeUrl });
  }
});

export default router;
