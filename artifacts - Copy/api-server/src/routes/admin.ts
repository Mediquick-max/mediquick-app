import { Router } from "express";
import { eq, desc, sql, gte } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  appUsersTable,
  subscriptionsTable,
  paymentsTable,
  apiConfigTable,
  careRequestsTable,
  labCentersTable,
  dailyFeaturedTable,
  doctorsTable,
} from "@workspace/db";
import {
  AdminLoginBody,
  UpdateAdminUserBody,
  UpdateAdminUserParams,
  DeleteAdminUserParams,
  UpdateApiConfigBody,
  UpdateApiConfigParams,
} from "@workspace/api-zod";

const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "mediquick@admin2024";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "mq-admin-secret-token-2024";

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.post("/login", async (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  res.json({ success: true, token: ADMIN_TOKEN });
});

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsersTable);

    const [activeUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsersTable)
      .where(eq(appUsersTable.status, "active"));

    const [premiumUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsersTable)
      .where(eq(appUsersTable.plan, "premium"));

    const [freeUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsersTable)
      .where(eq(appUsersTable.plan, "free"));

    const [totalRevenue] = await db
      .select({ sum: sql<number>`coalesce(sum(amount), 0)::int` })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "success"));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthlyRevenue] = await db
      .select({ sum: sql<number>`coalesce(sum(amount), 0)::int` })
      .from(paymentsTable)
      .where(
        sql`${paymentsTable.status} = 'success' AND ${paymentsTable.createdAt} >= ${startOfMonth.toISOString()}`
      );

    const [totalPayments] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentsTable);

    const [successfulPayments] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "success"));

    const [activeSubscriptions] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.status, "active"));

    const [consultations] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(careRequestsTable)
      .where(eq(careRequestsTable.type, "consultation"));

    const [labBookings] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(careRequestsTable)
      .where(eq(careRequestsTable.type, "lab"));

    const [medicineOrders] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(careRequestsTable)
      .where(eq(careRequestsTable.type, "medicine"));

    const [newUsersThisMonth] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsersTable)
      .where(gte(appUsersTable.joinedAt, startOfMonth));

    const [consultationCommission] = await db
      .select({
        platformFee: sql<number>`coalesce(sum(platform_fee), 0)::int`,
        providerPayout: sql<number>`coalesce(sum(provider_payout), 0)::int`,
        totalAmount: sql<number>`coalesce(sum(amount), 0)::int`,
      })
      .from(careRequestsTable)
      .where(eq(careRequestsTable.type, "consultation"));

    const [labCommission] = await db
      .select({
        platformFee: sql<number>`coalesce(sum(platform_fee), 0)::int`,
        providerPayout: sql<number>`coalesce(sum(provider_payout), 0)::int`,
        totalAmount: sql<number>`coalesce(sum(amount), 0)::int`,
      })
      .from(careRequestsTable)
      .where(eq(careRequestsTable.type, "lab"));

    res.json({
      totalUsers: totalUsers?.count ?? 0,
      activeUsers: activeUsers?.count ?? 0,
      premiumUsers: premiumUsers?.count ?? 0,
      freeUsers: freeUsers?.count ?? 0,
      totalRevenue: totalRevenue?.sum ?? 0,
      monthlyRevenue: monthlyRevenue?.sum ?? 0,
      totalPayments: totalPayments?.count ?? 0,
      successfulPayments: successfulPayments?.count ?? 0,
      activeSubscriptions: activeSubscriptions?.count ?? 0,
      totalConsultations: consultations?.count ?? 0,
      totalLabBookings: labBookings?.count ?? 0,
      totalMedicineOrders: medicineOrders?.count ?? 0,
      newUsersThisMonth: newUsersThisMonth?.count ?? 0,
      consultationPlatformFee: consultationCommission?.platformFee ?? 0,
      consultationProviderPayout: consultationCommission?.providerPayout ?? 0,
      consultationTotalAmount: consultationCommission?.totalAmount ?? 0,
      labPlatformFee: labCommission?.platformFee ?? 0,
      labProviderPayout: labCommission?.providerPayout ?? 0,
      labTotalAmount: labCommission?.totalAmount ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await db
      .select()
      .from(appUsersTable)
      .orderBy(desc(appUsersTable.joinedAt));
    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch users");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  const paramsResult = UpdateAdminUserParams.safeParse({ id: Number(req.params.id) });
  const bodyResult = UpdateAdminUserBody.safeParse(req.body);
  if (!paramsResult.success || !bodyResult.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (bodyResult.data.plan !== undefined) updates.plan = bodyResult.data.plan;
    if (bodyResult.data.status !== undefined) updates.status = bodyResult.data.status;
    if (bodyResult.data.name !== undefined) updates.name = bodyResult.data.name;
    if (bodyResult.data.phone !== undefined) updates.phone = bodyResult.data.phone;
    if (bodyResult.data.city !== undefined) updates.city = bodyResult.data.city;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(appUsersTable)
      .set(updates)
      .where(eq(appUsersTable.id, paramsResult.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  const paramsResult = DeleteAdminUserParams.safeParse({ id: Number(req.params.id) });
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(appUsersTable)
      .where(eq(appUsersTable.id, paramsResult.data.id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/subscriptions", requireAdmin, async (req, res) => {
  try {
    const subs = await db
      .select()
      .from(subscriptionsTable)
      .orderBy(desc(subscriptionsTable.startedAt));
    res.json(subs);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch subscriptions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/payments", requireAdmin, async (req, res) => {
  try {
    const payments = await db
      .select()
      .from(paymentsTable)
      .orderBy(desc(paymentsTable.createdAt));
    res.json(payments);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch payments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api-config", requireAdmin, async (req, res) => {
  try {
    const configs = await db.select().from(apiConfigTable);
    res.json(configs);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch api config");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/api-config/:id", requireAdmin, async (req, res) => {
  const paramsResult = UpdateApiConfigParams.safeParse({ id: Number(req.params.id) });
  const bodyResult = UpdateApiConfigBody.safeParse(req.body);
  if (!paramsResult.success || !bodyResult.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (bodyResult.data.keyValue !== undefined) updates.keyValue = bodyResult.data.keyValue;
    if (bodyResult.data.isActive !== undefined) updates.isActive = bodyResult.data.isActive;
    if (bodyResult.data.notes !== undefined) updates.notes = bodyResult.data.notes;
    if (bodyResult.data.label !== undefined) updates.label = bodyResult.data.label;

    const [updated] = await db
      .update(apiConfigTable)
      .set(updates)
      .where(eq(apiConfigTable.id, paramsResult.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Config not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update api config");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/care-activity", requireAdmin, async (req, res) => {
  try {
    const consultations = await db
      .select()
      .from(careRequestsTable)
      .where(eq(careRequestsTable.type, "consultation"))
      .orderBy(desc(careRequestsTable.createdAt));

    const labBookings = await db
      .select()
      .from(careRequestsTable)
      .where(eq(careRequestsTable.type, "lab"))
      .orderBy(desc(careRequestsTable.createdAt));

    const medicineOrders = await db
      .select()
      .from(careRequestsTable)
      .where(eq(careRequestsTable.type, "medicine"))
      .orderBy(desc(careRequestsTable.createdAt));

    res.json({ consultations, labBookings, medicineOrders });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch care activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Lab Centers Admin ────────────────────────────────────────────
router.get("/lab-centers", requireAdmin, async (req, res) => {
  try {
    const labs = await db
      .select({
        id: labCentersTable.id,
        name: labCentersTable.name,
        email: labCentersTable.email,
        phone: labCentersTable.phone,
        centerType: labCentersTable.centerType,
        city: labCentersTable.city,
        address: labCentersTable.address,
        accreditation: labCentersTable.accreditation,
        registrationNumber: labCentersTable.registrationNumber,
        plan: labCentersTable.plan,
        planExpiresAt: labCentersTable.planExpiresAt,
        isActive: labCentersTable.isActive,
        createdAt: labCentersTable.createdAt,
      })
      .from(labCentersTable)
      .orderBy(desc(labCentersTable.createdAt));
    res.json(labs);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch lab centers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/lab-centers/:id/status", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { isActive } = req.body;
  try {
    await db.update(labCentersTable).set({ isActive: isActive ? 1 : 0 }).where(eq(labCentersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update lab center status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/lab-centers/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    await db.delete(labCentersTable).where(eq(labCentersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete lab center");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Featured Spots Admin ─────────────────────────────────────────
router.get("/featured", requireAdmin, async (req, res) => {
  try {
    const spots = await db
      .select()
      .from(dailyFeaturedTable)
      .orderBy(desc(dailyFeaturedTable.featuredDate), desc(dailyFeaturedTable.createdAt));

    // Enrich with names
    const doctorIds = spots.filter(s => s.type === "doctor").map(s => s.entityId);
    const labIds = spots.filter(s => s.type === "lab").map(s => s.entityId);

    const doctors = doctorIds.length > 0
      ? await db.select({ id: doctorsTable.id, name: doctorsTable.name, specialization: doctorsTable.specialization })
          .from(doctorsTable)
      : [];
    const labs = labIds.length > 0
      ? await db.select({ id: labCentersTable.id, name: labCentersTable.name, centerType: labCentersTable.centerType })
          .from(labCentersTable)
      : [];

    const enriched = spots.map(s => {
      if (s.type === "doctor") {
        const doc = doctors.find(d => d.id === s.entityId);
        return { ...s, entityName: doc?.name ?? `Doctor #${s.entityId}`, entityDetail: doc?.specialization ?? "" };
      } else {
        const lab = labs.find(l => l.id === s.entityId);
        return { ...s, entityName: lab?.name ?? `Lab #${s.entityId}`, entityDetail: lab?.centerType ?? "" };
      }
    });

    // Group by date for summary
    const byDate: Record<string, { date: string; doctorCount: number; labCount: number; revenue: number; spots: typeof enriched }> = {};
    for (const s of enriched) {
      if (!byDate[s.featuredDate]) {
        byDate[s.featuredDate] = { date: s.featuredDate, doctorCount: 0, labCount: 0, revenue: 0, spots: [] };
      }
      byDate[s.featuredDate].spots.push(s);
      byDate[s.featuredDate].revenue += s.feeDeducted;
      if (s.type === "doctor") byDate[s.featuredDate].doctorCount++;
      else byDate[s.featuredDate].labCount++;
    }

    res.json({ spots: enriched, byDate: Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch featured spots");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
