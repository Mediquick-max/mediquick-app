import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, appUsersTable, appointmentsTable, careRequestsTable } from "@workspace/db";
import crypto from "crypto";

const router = Router();

function parseToken(token: string): { userId: number; email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id, email] = decoded.split(":");
    const userId = Number(id);
    if (isNaN(userId) || !email) return null;
    return { userId, email };
  } catch { return null; }
}

function parseAuth(req: any): number | null {
  const auth = req.headers.authorization ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  const parsed = parseToken(token);
  return parsed?.userId ?? null;
}

const MEMBERSHIP_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    duration: 0,
    color: "gray",
    tag: "",
    benefits: [
      "Sirf 5 doctor consultations",
      "Sirf 5 lab tests book kar sakte ho",
      "AI health assistant",
      "Medicine reminders",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 99,
    duration: 30,
    color: "yellow",
    tag: "Monthly",
    benefits: [
      "Unlimited doctor consultations",
      "Unlimited lab tests",
      "5% discount on all lab tests",
      "Priority doctor booking",
      "1 free consultation per month",
      "Health report storage",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 199,
    duration: 30,
    color: "purple",
    tag: "Monthly",
    benefits: [
      "Unlimited doctor consultations",
      "Unlimited lab tests",
      "10% discount on all lab tests",
      "Unlimited free consultations",
      "Dedicated health manager",
      "Home sample collection priority",
      "Family health tracking (up to 4 members)",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 999,
    duration: 36500,
    color: "emerald",
    tag: "One-time • Forever",
    benefits: [
      "Ek baar pay karo, hamesha ke liye",
      "Unlimited doctor consultations",
      "10% discount on all doctor consultations",
      "Unlimited lab tests",
      "10% discount on all lab tests",
      "Priority booking always",
      "Health report storage lifetime",
      "Family health tracking (up to 6 members)",
    ],
  },
];

router.get("/membership/plans", (_req, res) => {
  res.json({ plans: MEMBERSHIP_PLANS });
});

router.get("/dashboard", async (req, res): Promise<void> => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [user] = await db.select().from(appUsersTable).where(eq(appUsersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const consultations = await db.select().from(appointmentsTable)
      .where(eq(appointmentsTable.userId, userId))
      .orderBy(desc(appointmentsTable.createdAt));

    const labBookings = await db.select().from(careRequestsTable)
      .where(eq(careRequestsTable.userId, userId))
      .orderBy(desc(careRequestsTable.createdAt));

    const now = new Date();
    const isActiveMember = user.plan !== "free" &&
      user.membershipExpiresAt != null &&
      new Date(user.membershipExpiresAt) > now;

    const currentPlan = isActiveMember ? user.plan : "free";
    const membershipExpiresAt = user.membershipExpiresAt;

    const { passwordHash: _ph, ...safeUser } = user as any;

    res.json({
      user: { ...safeUser, currentPlan, membershipExpiresAt, isActiveMember },
      consultations,
      labBookings: labBookings.filter(r => r.type === "lab"),
      stats: {
        totalConsultations: consultations.length,
        totalLabTests: labBookings.filter(r => r.type === "lab").length,
        upcomingAppointments: consultations.filter(a => a.status === "confirmed" || a.status === "pending").length,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard fetch failed");
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

router.put("/profile", async (req, res): Promise<void> => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const allowed = ["name", "phone", "city", "gender", "dateOfBirth", "bloodGroup", "allergies"];
  const updateData: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }

  try {
    const [updated] = await db.update(appUsersTable).set(updateData).where(eq(appUsersTable.id, userId)).returning();
    const { passwordHash: _ph, ...safe } = updated as any;
    res.json({ user: safe });
  } catch (err) {
    req.log.error({ err }, "Profile update failed");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/membership/upgrade", async (req, res): Promise<void> => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { plan } = req.body;
  const selectedPlan = MEMBERSHIP_PLANS.find(p => p.id === plan && p.price > 0);
  if (!selectedPlan) { res.status(400).json({ error: "Invalid plan" }); return; }

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpayKeySecret) {
    res.status(503).json({ error: "Payment gateway not configured", code: "NO_RAZORPAY" });
    return;
  }

  try {
    const Razorpay = (await import("razorpay")).default;
    const rzp = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
    const order = await rzp.orders.create({
      amount: selectedPlan.price * 100,
      currency: "INR",
      receipt: `membership_${userId}_${Date.now()}`,
      notes: { userId: String(userId), plan: selectedPlan.id },
    });
    res.json({ order, plan: selectedPlan, key: razorpayKeyId });
  } catch (err) {
    req.log.error({ err }, "Razorpay order creation failed");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/membership/verify", async (req, res): Promise<void> => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeySecret) { res.status(503).json({ error: "Payment gateway not configured" }); return; }

  const selectedPlan = MEMBERSHIP_PLANS.find(p => p.id === plan && p.price > 0);
  if (!selectedPlan) { res.status(400).json({ error: "Invalid plan" }); return; }

  const hmac = crypto.createHmac("sha256", razorpayKeySecret);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const expectedSignature = hmac.digest("hex");

  if (expectedSignature !== razorpay_signature) {
    res.status(400).json({ error: "Payment verification failed" });
    return;
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + selectedPlan.duration);

    const [updated] = await db.update(appUsersTable)
      .set({ plan: selectedPlan.id, membershipExpiresAt: expiresAt })
      .where(eq(appUsersTable.id, userId))
      .returning();

    const { passwordHash: _ph, ...safe } = updated as any;
    res.json({ success: true, user: safe, message: `${selectedPlan.name} plan activated!` });
  } catch (err) {
    req.log.error({ err }, "Membership activation failed");
    res.status(500).json({ error: "Failed to activate membership" });
  }
});

export default router;
