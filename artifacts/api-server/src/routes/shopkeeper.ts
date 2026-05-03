import { Router } from "express";
import { eq, and, count, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import {
  db,
  shopkeeperMedicinesTable,
  shopkeeperSubscriptionsTable,
  shopkeeperProfilesTable,
  localMedicineOrdersTable,
  appUsersTable,
} from "@workspace/db";

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

const DELIVERY_RATE_PER_100M = 10;
const PLATFORM_RATE_PER_100M = 1;
const MAX_DELIVERY_KM = 5;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcCharges(distanceMeters: number) {
  const units = Math.ceil(distanceMeters / 100);
  const deliveryCharge = units * DELIVERY_RATE_PER_100M;
  const platformFee = units * PLATFORM_RATE_PER_100M;
  return { units, deliveryCharge, platformFee };
}

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
  return subs.find((s) => new Date(s.expiryDate) > now) ?? null;
}

async function getMedicineCount(shopkeeperId: number): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(shopkeeperMedicinesTable)
    .where(eq(shopkeeperMedicinesTable.shopkeeperId, shopkeeperId));
  return result[0]?.count ?? 0;
}

// ─── Shopkeeper Status ─────────────────────────────────────────────────────────
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

// ─── Shopkeeper Profile ────────────────────────────────────────────────────────
router.get("/profile", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [profile] = await db
    .select()
    .from(shopkeeperProfilesTable)
    .where(eq(shopkeeperProfilesTable.shopkeeperId, userId))
    .limit(1);

  res.json(profile ?? null);
});

router.put("/profile", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { shopName, shopAddress, shopPhone, lat, lng, city, pincode } = req.body ?? {};

  const [existing] = await db
    .select({ id: shopkeeperProfilesTable.id })
    .from(shopkeeperProfilesTable)
    .where(eq(shopkeeperProfilesTable.shopkeeperId, userId))
    .limit(1);

  const values = {
    shopName: shopName ?? "",
    shopAddress: shopAddress ?? "",
    shopPhone: shopPhone ?? "",
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    city: city ?? "",
    pincode: pincode ?? "",
    updatedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db
      .update(shopkeeperProfilesTable)
      .set(values)
      .where(eq(shopkeeperProfilesTable.shopkeeperId, userId))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(shopkeeperProfilesTable)
      .values({ shopkeeperId: userId, ...values })
      .returning();
    res.json(created);
  }
});

// ─── Shopkeeper Medicines (my own) ────────────────────────────────────────────
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
    res.status(403).json({
      error: "limit_reached", plan, limit, used,
      message: `Upgrade your plan to add more medicines. Current plan allows ${limit} medicines.`,
    });
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

router.put("/medicines/:id", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const medId = Number(req.params.id);
  if (isNaN(medId)) { res.status(400).json({ error: "Invalid medicine ID" }); return; }

  const [existing] = await db
    .select()
    .from(shopkeeperMedicinesTable)
    .where(and(eq(shopkeeperMedicinesTable.id, medId), eq(shopkeeperMedicinesTable.shopkeeperId, userId)));

  if (!existing) { res.status(404).json({ error: "Medicine not found" }); return; }

  const { name, category, price, stock, unit, description, manufacturer } = req.body ?? {};

  const [updated] = await db
    .update(shopkeeperMedicinesTable)
    .set({
      name: name?.trim() ?? existing.name,
      category: category ?? existing.category,
      price: price != null ? Number(price) : existing.price,
      stock: stock != null ? Number(stock) : existing.stock,
      unit: unit ?? existing.unit,
      description: description ?? existing.description,
      manufacturer: manufacturer ?? existing.manufacturer,
    })
    .where(eq(shopkeeperMedicinesTable.id, medId))
    .returning();

  res.json(updated);
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

// ─── Public: Nearby shopkeeper medicines ──────────────────────────────────────
router.get("/nearby", async (req, res) => {
  const userLat = req.query.lat ? Number(req.query.lat) : null;
  const userLng = req.query.lng ? Number(req.query.lng) : null;
  const search = (req.query.search as string | undefined)?.toLowerCase() ?? "";
  const category = (req.query.category as string | undefined) ?? "";

  const profiles = await db
    .select()
    .from(shopkeeperProfilesTable)
    .where(eq(shopkeeperProfilesTable.isActive, true));

  const nearbyProfiles = profiles.filter((p) => {
    if (!p.lat || !p.lng) return false;
    if (!userLat || !userLng) return true;
    const dist = haversineMeters(userLat, userLng, p.lat, p.lng);
    return dist <= MAX_DELIVERY_KM * 1000;
  });

  if (nearbyProfiles.length === 0) { res.json([]); return; }

  const shopkeeperIds = nearbyProfiles.map((p) => p.shopkeeperId);

  let meds = await db
    .select()
    .from(shopkeeperMedicinesTable)
    .where(sql`${shopkeeperMedicinesTable.shopkeeperId} = ANY(${shopkeeperIds})`)
    .orderBy(desc(shopkeeperMedicinesTable.createdAt));

  if (search) {
    meds = meds.filter(
      (m) => m.name.toLowerCase().includes(search) || m.category.toLowerCase().includes(search)
    );
  }
  if (category && category !== "All") {
    meds = meds.filter((m) => m.category === category);
  }

  const profileMap = Object.fromEntries(nearbyProfiles.map((p) => [p.shopkeeperId, p]));

  const result = meds.map((m) => {
    const prof = profileMap[m.shopkeeperId];
    const distMeters =
      userLat && userLng && prof?.lat && prof?.lng
        ? Math.round(haversineMeters(userLat, userLng, prof.lat, prof.lng))
        : null;
    const charges = distMeters != null ? calcCharges(distMeters) : null;
    return {
      ...m,
      shop: {
        id: prof?.shopkeeperId,
        name: prof?.shopName ?? "Medical Store",
        address: prof?.shopAddress ?? "",
        phone: prof?.shopPhone ?? "",
        lat: prof?.lat,
        lng: prof?.lng,
        city: prof?.city ?? "",
      },
      distanceMeters,
      deliveryCharge: charges?.deliveryCharge ?? null,
      platformFee: charges?.platformFee ?? null,
    };
  });

  res.json(result);
});

// ─── Distance calculation (utility endpoint) ──────────────────────────────────
router.post("/calc-distance", (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.body ?? {};
  if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
    res.status(400).json({ error: "lat/lng required" });
    return;
  }
  const distanceMeters = Math.round(haversineMeters(Number(fromLat), Number(fromLng), Number(toLat), Number(toLng)));
  const { deliveryCharge, platformFee, units } = calcCharges(distanceMeters);
  const withinRange = distanceMeters <= MAX_DELIVERY_KM * 1000;
  res.json({ distanceMeters, units, deliveryCharge, platformFee, withinRange });
});

// ─── Local Medicine Orders ─────────────────────────────────────────────────────
router.post("/local-orders", async (req, res) => {
  const userId = parseAuth(req);

  const {
    shopkeeperId,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    items,
    notes,
  } = req.body ?? {};

  if (!shopkeeperId || !customerName || !customerPhone || !deliveryAddress || !items?.length) {
    res.status(400).json({ error: "shopkeeperId, customerName, customerPhone, deliveryAddress, items required" });
    return;
  }

  const [prof] = await db
    .select()
    .from(shopkeeperProfilesTable)
    .where(eq(shopkeeperProfilesTable.shopkeeperId, Number(shopkeeperId)))
    .limit(1);

  if (!prof) { res.status(404).json({ error: "Shopkeeper not found" }); return; }

  let distanceMeters = 0;
  if (deliveryLat && deliveryLng && prof.lat && prof.lng) {
    distanceMeters = Math.round(haversineMeters(Number(deliveryLat), Number(deliveryLng), prof.lat, prof.lng));
  }

  if (distanceMeters > MAX_DELIVERY_KM * 1000) {
    res.status(400).json({ error: "out_of_range", message: `Delivery only available within ${MAX_DELIVERY_KM} km` });
    return;
  }

  const { deliveryCharge, platformFee } = calcCharges(distanceMeters);
  const subtotal = (items as { price: number; qty: number }[]).reduce((s, i) => s + i.price * i.qty, 0);
  const totalAmount = subtotal + deliveryCharge;

  const [order] = await db.insert(localMedicineOrdersTable).values({
    shopkeeperId: Number(shopkeeperId),
    customerId: userId ?? null,
    customerName: String(customerName),
    customerPhone: String(customerPhone),
    deliveryAddress: String(deliveryAddress),
    deliveryLat: deliveryLat ? Number(deliveryLat) : null,
    deliveryLng: deliveryLng ? Number(deliveryLng) : null,
    distanceMeters,
    deliveryCharge,
    platformFee,
    subtotal,
    totalAmount,
    medicinesJson: JSON.stringify(items),
    notes: notes ?? "",
    status: "pending",
  }).returning();

  res.status(201).json({ order, shopPhone: prof.shopPhone });
});

router.get("/local-orders", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const asShopkeeper = req.query.role === "shopkeeper";

  if (asShopkeeper) {
    const orders = await db
      .select()
      .from(localMedicineOrdersTable)
      .where(eq(localMedicineOrdersTable.shopkeeperId, userId))
      .orderBy(desc(localMedicineOrdersTable.createdAt));
    res.json(orders);
  } else {
    const orders = await db
      .select()
      .from(localMedicineOrdersTable)
      .where(eq(localMedicineOrdersTable.customerId, userId))
      .orderBy(desc(localMedicineOrdersTable.createdAt));
    res.json(orders);
  }
});

router.put("/local-orders/:id/status", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orderId = Number(req.params.id);
  const { status } = req.body ?? {};

  const validStatuses = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [order] = await db
    .select()
    .from(localMedicineOrdersTable)
    .where(
      and(
        eq(localMedicineOrdersTable.id, orderId),
        eq(localMedicineOrdersTable.shopkeeperId, userId)
      )
    )
    .limit(1);

  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const [updated] = await db
    .update(localMedicineOrdersTable)
    .set({ status })
    .where(eq(localMedicineOrdersTable.id, orderId))
    .returning();

  res.json(updated);
});

// ─── Shopkeeper Payment ────────────────────────────────────────────────────────
router.post("/payment/order", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { plan, autopay } = req.body ?? {};
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
    const orderPayload: any = {
      amount: price * 100,
      currency: "INR",
      receipt: `shop_${userId}_${plan}_${Date.now()}`,
      notes: { userId: String(userId), plan, autopay: autopay ? "true" : "false" },
    };
    if (autopay) orderPayload.recurring = 1;
    const order = await rzp.orders.create(orderPayload);
    res.json({ orderId: order.id, amount: price * 100, currency: "INR", keyId, plan, autopay: !!autopay });
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

// ─── Admin Stats ───────────────────────────────────────────────────────────────
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
