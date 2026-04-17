import { Router } from "express";
import { eq, and, count, desc } from "drizzle-orm";
import crypto from "crypto";
import { db, shopkeeperMedicinesTable, shopkeeperSubscriptionsTable, appUsersTable } from "@workspace/db";

const router = Router();

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 50,
  pro: 200,
  unlimited: -1,
};

const PLAN_PRICES: Record<string, number> = {
  basic: 199,
  pro: 499,
  unlimited: 999,
};

function parseAuth(req: any): number | null {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id] = decoded.split(":");
    const userId = Number(id);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

async function getActiveSubscription(shopkeeperId: number) {
  const now = new Date();
  const subs = await db
    .select()
    .from(shopkeeperSubscriptionsTable)
    .where(
      and(
        eq(shopkeeperSubscriptionsTable.shopkeeperId, shopkeeperId),
        eq(shopkeeperSubscriptionsTable.status, "active")
      )
    )
    .orderBy(desc(shopkeeperSubscriptionsTable.createdAt))
    .limit(1);

  const activeSub = subs.find((s) => new Date(s.expiryDate) > now);
  return activeSub ?? null;
}

async function getMedicineCount(shopkeeperId: number): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(shopkeeperMedicinesTable)
    .where(eq(shopkeeperMedicinesTable.shopkeeperId, shopkeeperId));
  return result[0]?.count ?? 0;
}

router.get("/status", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db.select().from(appUsersTable).where(eq(appUsersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const activeSub = await getActiveSubscription(userId);
  const plan = activeSub?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? 10;
  const used = await getMedicineCount(userId);

  res.json({ user: { id: user.id, name: user.name, email: user.email }, plan, limit, used, subscription: activeSub });
});

router.get("/medicines", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const medicines = await db
    .select()
    .from(shopkeeperMedicinesTable)
    .where(eq(shopkeeperMedicinesTable.shopkeeperId, userId))
    .orderBy(desc(shopkeeperMedicinesTable.createdAt));

  res.json(medicines);
});

router.post("/medicines", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const activeSub = await getActiveSubscription(userId);
  const plan = activeSub?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? 10;
  const used = await getMedicineCount(userId);

  if (limit !== -1 && used >= limit) {
    res.status(403).json({ error: "limit_reached", plan, limit, used, message: `Upgrade your plan to add more medicines. Current plan allows ${limit} medicines.` });
    return;
  }

  const { name, category, price, stock, unit, description, manufacturer } = req.body ?? {};
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Medicine name is required (min 2 chars)" });
    return;
  }

  const [medicine] = await db.insert(shopkeeperMedicinesTable).values({
    shopkeeperId: userId,
    name: name.trim(),
    category: category ?? "General",
    price: Number(price) || 0,
    stock: Number(stock) || 0,
    unit: unit ?? "strip",
    description: description ?? "",
    manufacturer: manufacturer ?? "",
  }).returning();

  res.status(201).json(medicine);
});

router.delete("/medicines/:id", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const medId = Number(req.params.id);
  if (isNaN(medId)) { res.status(400).json({ error: "Invalid medicine ID" }); return; }

  const [existing] = await db
    .select({ id: shopkeeperMedicinesTable.id })
    .from(shopkeeperMedicinesTable)
    .where(and(eq(shopkeeperMedicinesTable.id, medId), eq(shopkeeperMedicinesTable.shopkeeperId, userId)));

  if (!existing) { res.status(404).json({ error: "Medicine not found" }); return; }

  await db.delete(shopkeeperMedicinesTable).where(eq(shopkeeperMedicinesTable.id, medId));
  res.json({ success: true });
});

router.post("/payment/order", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { plan } = req.body ?? {};
  const price = PLAN_PRICES[plan];
  if (!price) { res.status(400).json({ error: "Invalid plan" }); return; }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    res.status(503).json({ error: "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." });
    return;
  }

  try {
    const Razorpay = (await import("razorpay")).default;
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await rzp.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: `shop_${userId}_${plan}_${Date.now()}`,
      notes: { userId: String(userId), plan },
    });
    res.json({ orderId: order.id, amount: price * 100, currency: "INR", keyId, plan });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/payment/verify", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body ?? {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    res.status(400).json({ error: "Missing payment details" });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) { res.status(503).json({ error: "Payment gateway not configured" }); return; }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

  if (expectedSig !== razorpay_signature) {
    res.status(400).json({ error: "Payment signature verification failed" });
    return;
  }

  const price = PLAN_PRICES[plan] ?? 0;
  const limit = PLAN_LIMITS[plan] ?? 10;
  const startDate = new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + 1);

  await db.update(shopkeeperSubscriptionsTable)
    .set({ status: "expired" })
    .where(and(eq(shopkeeperSubscriptionsTable.shopkeeperId, userId), eq(shopkeeperSubscriptionsTable.status, "active")));

  const [sub] = await db.insert(shopkeeperSubscriptionsTable).values({
    shopkeeperId: userId,
    plan,
    medicineLimit: limit,
    amountPaid: price,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    status: "active",
    startDate,
    expiryDate,
  }).returning();

  res.json({ success: true, subscription: sub });
});

router.get("/admin/stats", async (_req, res) => {
  const [totalMeds] = await db.select({ count: count() }).from(shopkeeperMedicinesTable);
  const [totalSubs] = await db.select({ count: count() }).from(shopkeeperSubscriptionsTable).where(eq(shopkeeperSubscriptionsTable.status, "active"));
  const allSubs = await db.select({ plan: shopkeeperSubscriptionsTable.plan, amount: shopkeeperSubscriptionsTable.amountPaid }).from(shopkeeperSubscriptionsTable).where(eq(shopkeeperSubscriptionsTable.status, "active"));
  const totalRevenue = allSubs.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const planDist = allSubs.reduce((acc: Record<string, number>, s) => { acc[s.plan] = (acc[s.plan] ?? 0) + 1; return acc; }, {});

  res.json({ totalMedicines: totalMeds.count, activeSubscriptions: totalSubs.count, totalRevenue, planDistribution: planDist });
});

router.get("/admin/subscriptions", async (_req, res) => {
  const subs = await db
    .select()
    .from(shopkeeperSubscriptionsTable)
    .where(eq(shopkeeperSubscriptionsTable.status, "active"))
    .orderBy(desc(shopkeeperSubscriptionsTable.createdAt));
  res.json(subs);
});

export default router;
