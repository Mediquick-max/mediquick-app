import { Router } from "express";
import { eq, desc, count } from "drizzle-orm";
import crypto from "crypto";
import { db, labCentersTable, careRequestsTable } from "@workspace/db";

const router = Router();

function hashPw(pw: string) {
  return crypto.createHash("sha256").update(pw + "mq_lab_salt").digest("hex");
}

function makeToken(id: number, email: string) {
  return Buffer.from(`${id}:${email}:${Date.now()}`, "utf-8").toString("base64url");
}

function parseAuth(req: any): number | null {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id] = decoded.split(":");
    const labId = Number(id);
    return isNaN(labId) ? null : labId;
  } catch { return null; }
}

const CENTER_TYPES = ["Diagnostic Center", "Pathology Lab", "Radiology Center", "Multi-Specialty Lab", "Other"];

const LAB_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    tag: "Free Forever",
    platformFee: "3%",
    color: "gray",
    benefits: [
      "Up to 5 lab tests listed",
      "Standard listing on platform",
      "Basic patient matching",
      "3% platform fee per booking",
      "Standard support",
      "Basic booking management",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 399,
    tag: "Monthly",
    platformFee: "2%",
    color: "blue",
    benefits: [
      "Up to 50 lab tests listed",
      "Featured listing (2x visibility)",
      "Home sample collection support",
      "2% platform fee (reduced)",
      "Priority patient matching",
      "Booking analytics",
      "Dedicated support",
      "NABL/ISO badge display",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 799,
    tag: "Monthly",
    platformFee: "1%",
    color: "purple",
    benefits: [
      "Unlimited lab tests listed",
      "Top featured listing",
      "Maximum patient visibility",
      "1% platform fee (lowest)",
      "Advanced analytics & reports",
      "Multi-branch support",
      "Priority 24/7 support",
      "Custom lab center badge",
      "Home collection — all pincodes",
    ],
  },
];

router.get("/plans", (_req, res) => {
  res.json({ plans: LAB_PLANS });
});

router.get("/center-types", (_req, res) => {
  res.json({ types: CENTER_TYPES });
});

router.post("/register", async (req, res): Promise<void> => {
  const { name, email, password, phone, centerType, city, address, accreditation, registrationNumber } = req.body;
  if (!name || !email || !password) { res.status(400).json({ error: "Name, email and password required" }); return; }

  const existing = await db.select().from(labCentersTable).where(eq(labCentersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) { res.status(409).json({ error: "Email already registered" }); return; }

  const [lab] = await db.insert(labCentersTable).values({
    name, email: email.toLowerCase(),
    passwordHash: hashPw(password),
    phone: phone ?? "", centerType: centerType ?? "Diagnostic Center",
    city: city ?? "", address: address ?? "",
    accreditation: accreditation ?? "", registrationNumber: registrationNumber ?? "",
  }).returning();

  const token = makeToken(lab.id, lab.email);
  res.json({ token, lab: { ...lab, passwordHash: undefined } });
});

router.post("/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }

  const [lab] = await db.select().from(labCentersTable).where(eq(labCentersTable.email, email.toLowerCase())).limit(1);
  if (!lab || lab.passwordHash !== hashPw(password)) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const token = makeToken(lab.id, lab.email);
  res.json({ token, lab: { ...lab, passwordHash: undefined } });
});

router.get("/profile", async (req, res): Promise<void> => {
  const labId = parseAuth(req);
  if (!labId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [lab] = await db.select().from(labCentersTable).where(eq(labCentersTable.id, labId)).limit(1);
  if (!lab) { res.status(404).json({ error: "Lab center not found" }); return; }

  res.json({ lab: { ...lab, passwordHash: undefined } });
});

router.put("/profile", async (req, res): Promise<void> => {
  const labId = parseAuth(req);
  if (!labId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { name, phone, centerType, city, address, accreditation, registrationNumber,
    paymentMethod, upiId, bankAccountHolder, bankAccountNumber, bankIfscCode, bankName } = req.body;

  const [updated] = await db.update(labCentersTable).set({
    ...(name && { name }),
    ...(phone && { phone }),
    ...(centerType && { centerType }),
    ...(city && { city }),
    ...(address && { address }),
    ...(accreditation !== undefined && { accreditation }),
    ...(registrationNumber !== undefined && { registrationNumber }),
    ...(paymentMethod && { paymentMethod }),
    ...(upiId !== undefined && { upiId }),
    ...(bankAccountHolder !== undefined && { bankAccountHolder }),
    ...(bankAccountNumber !== undefined && { bankAccountNumber }),
    ...(bankIfscCode !== undefined && { bankIfscCode }),
    ...(bankName !== undefined && { bankName }),
  }).where(eq(labCentersTable.id, labId)).returning();

  res.json({ lab: { ...updated, passwordHash: undefined } });
});

router.get("/bookings", async (req, res): Promise<void> => {
  const labId = parseAuth(req);
  if (!labId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const bookings = await db.select().from(careRequestsTable)
    .orderBy(desc(careRequestsTable.createdAt))
    .limit(100);

  res.json({ bookings });
});

router.put("/bookings/:id/status", async (req, res): Promise<void> => {
  const labId = parseAuth(req);
  if (!labId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const bookingId = Number(req.params.id);
  const { status } = req.body;
  const validStatuses = ["Confirmed", "Processing", "Completed", "Cancelled"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  const [updated] = await db.update(careRequestsTable)
    .set({ status }).where(eq(careRequestsTable.id, bookingId)).returning();
  res.json({ booking: updated });
});

router.get("/dashboard", async (req, res): Promise<void> => {
  const labId = parseAuth(req);
  if (!labId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [lab] = await db.select().from(labCentersTable).where(eq(labCentersTable.id, labId)).limit(1);
  if (!lab) { res.status(404).json({ error: "Not found" }); return; }

  const bookings = await db.select().from(careRequestsTable).orderBy(desc(careRequestsTable.createdAt)).limit(100);

  const total = bookings.length;
  const pending = bookings.filter(b => b.status === "Confirmed").length;
  const completed = bookings.filter(b => b.status === "Completed").length;
  const revenue = bookings.filter(b => b.status === "Completed").reduce((s, b) => s + (b.providerPayout ?? 0), 0);

  res.json({
    lab: { ...lab, passwordHash: undefined },
    stats: { total, pending, completed, revenue },
    recentBookings: bookings.slice(0, 5),
  });
});

export default router;
