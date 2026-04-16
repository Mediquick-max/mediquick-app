import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, appUsersTable } from "@workspace/db";

const router = Router();

const SALT_ROUNDS = 10;

function makeToken(userId: number, email: string): string {
  const payload = `${userId}:${email}:${Date.now()}`;
  return Buffer.from(payload).toString("base64url");
}

function parseToken(token: string): { userId: number; email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id, email] = decoded.split(":");
    const userId = Number(id);
    if (isNaN(userId) || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

router.post("/signup", async (req, res) => {
  const { name, email, password, phone, city } = req.body ?? {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Name must be at least 2 characters" });
    return;
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: appUsersTable.id })
      .from(appUsersTable)
      .where(eq(appUsersTable.email, email.toLowerCase().trim()));

    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db
      .insert(appUsersTable)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ?? "",
        city: city ?? "",
        passwordHash,
        plan: "free",
        status: "active",
        deviceType: "web",
      })
      .returning();

    const token = makeToken(user.id, user.email);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Signup failed");
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(appUsersTable)
      .where(eq(appUsersTable.email, email.toLowerCase().trim()));

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (user.status === "inactive") {
      res.status(403).json({ error: "Your account has been deactivated. Please contact support." });
      return;
    }

    let passwordValid = false;
    if (user.passwordHash) {
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!passwordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = makeToken(user.id, user.email);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization ?? "";
  const token = auth.replace("Bearer ", "").trim();

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = parseToken(token);
  if (!parsed) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(appUsersTable)
      .where(eq(appUsersTable.id, parsed.userId));

    if (!user || user.email !== parsed.email) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      phone: user.phone,
      city: user.city,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
