import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, appUsersTable } from "@workspace/db";

const router = Router();

function makeToken(userId: number, email: string): string {
  const payload = `${userId}:${email}:${Date.now()}`;
  return Buffer.from(payload).toString("base64url");
}

router.post("/google-login", async (req, res) => {
  const { email, name, googleId } = req.body ?? {};

  if (!email || !name) {
    res.status(400).json({ error: "Email and name required" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(appUsersTable)
      .where(eq(appUsersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing) {
      if (existing.status === "inactive") {
        res.status(403).json({ error: "Account deactivated" });
        return;
      }
      const token = makeToken(existing.id, existing.email);
      res.json({
        token,
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          plan: existing.plan,
          avatarUrl: existing.avatarUrl ?? "",
        },
      });
      return;
    }

    const [created] = await db
      .insert(appUsersTable)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: "",
        city: "",
        passwordHash: `google:${googleId ?? ""}`,
        plan: "free",
        status: "active",
        deviceType: "web",
      })
      .returning();

    const token = makeToken(created.id, created.email);
    res.status(201).json({
      token,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        plan: created.plan,
        avatarUrl: created.avatarUrl ?? "",
      },
    });
  } catch (err) {
    req.log.error({ err }, "Google login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
