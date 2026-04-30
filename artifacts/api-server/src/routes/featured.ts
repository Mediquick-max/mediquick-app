import { Router } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, doctorsTable, labCentersTable, dailyFeaturedTable } from "@workspace/db";

const router = Router();

function getISTHour(): number {
  const now = new Date();
  return Math.floor((now.getTime() + 5.5 * 60 * 60 * 1000) / (60 * 60 * 1000)) % 24;
}

// Slot date = IST date when the current slot OPENED (at 7 AM IST).
// Before 7 AM → still in yesterday's slot.
// At/After 7 AM → today's slot.
function getSlotDate(): string {
  const now = new Date();
  const istMs = now.getTime() + 5.5 * 60 * 60 * 1000;
  const istHour = Math.floor(istMs / (60 * 60 * 1000)) % 24;
  if (istHour < 7) {
    // Before 7 AM: still showing yesterday's featured list
    const yesterday = new Date(istMs - 24 * 60 * 60 * 1000);
    return yesterday.toISOString().split("T")[0];
  }
  return new Date(istMs).toISOString().split("T")[0];
}

// Next slot opens at 7 AM IST on (slotDate + 1 day)
function getNextSlotTime(): string {
  const now = new Date();
  const istMs = now.getTime() + 5.5 * 60 * 60 * 1000;
  const istHour = Math.floor(istMs / (60 * 60 * 1000)) % 24;
  if (istHour < 7) {
    return "aaj subah 7 AM";
  }
  return "kal subah 7 AM";
}

function isRegistrationOpen(): boolean {
  const h = getISTHour();
  return h >= 7 && h < 9;
}

function parseDoctorId(req: any): number | null {
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

function parseLabId(req: any): number | null {
  return parseDoctorId(req);
}

router.get("/today", async (req, res) => {
  try {
    const today = getSlotDate();

    const docRows = await db
      .select()
      .from(dailyFeaturedTable)
      .where(and(eq(dailyFeaturedTable.type, "doctor"), eq(dailyFeaturedTable.featuredDate, today)));

    const labRows = await db
      .select()
      .from(dailyFeaturedTable)
      .where(and(eq(dailyFeaturedTable.type, "lab"), eq(dailyFeaturedTable.featuredDate, today)));

    const doctors: any[] = [];
    for (const row of docRows) {
      const [doc] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, row.entityId));
      if (doc) doctors.push({
        id: doc.id, name: doc.name, specialization: doc.specialization,
        city: doc.city, fee: doc.fee, rating: doc.rating,
        imageUrl: doc.imageUrl, qualifications: doc.qualifications,
        consultationType: doc.consultationType, languages: doc.languages,
        hospitalName: doc.hospitalName,
      });
    }

    const labs: any[] = [];
    for (const row of labRows) {
      const [lab] = await db.select().from(labCentersTable).where(eq(labCentersTable.id, row.entityId));
      if (lab) labs.push({
        id: lab.id, name: lab.name, centerType: lab.centerType,
        city: lab.city, accreditation: lab.accreditation, phone: lab.phone,
        address: lab.address,
      });
    }

    const spotsLeft = { doctors: 5 - doctors.length, labs: 5 - labs.length };
    const windowOpen = isRegistrationOpen();
    const istHour = getISTHour();
    const nextSlotTime = getNextSlotTime();

    res.json({ doctors, labs, spotsLeft, windowOpen, istHour, today, nextSlotTime });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch featured spots" });
  }
});

router.post("/doctor/join", async (req, res) => {
  const doctorId = parseDoctorId(req);
  if (!doctorId) return res.status(401).json({ error: "Doctor login required" });

  if (!isRegistrationOpen()) {
    const h = getISTHour();
    return res.status(400).json({
      error: `Registration window is 7 AM – 9 AM IST only. Current IST time: ${h}:00. Please try tomorrow morning.`
    });
  }

  const today = getSlotDate();

  try {
    const existing = await db.select().from(dailyFeaturedTable)
      .where(and(
        eq(dailyFeaturedTable.type, "doctor"),
        eq(dailyFeaturedTable.entityId, doctorId),
        eq(dailyFeaturedTable.featuredDate, today)
      ));

    if (existing.length > 0) {
      return res.status(400).json({ error: "Aap aaj ke liye pehle se featured hain!" });
    }

    const todayCount = await db.select({ c: count() }).from(dailyFeaturedTable)
      .where(and(eq(dailyFeaturedTable.type, "doctor"), eq(dailyFeaturedTable.featuredDate, today)));

    if ((todayCount[0]?.c ?? 0) >= 5) {
      return res.status(400).json({ error: "Aaj ke 5 featured spots bhar gaye hain. Kal subah 7-9 AM mein phir try karein." });
    }

    const [doc] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, doctorId));
    if (!doc) return res.status(404).json({ error: "Doctor not found" });

    await db.insert(dailyFeaturedTable).values({
      type: "doctor",
      entityId: doctorId,
      featuredDate: today,
      feeDeducted: 499,
    });

    res.json({
      success: true,
      message: "Aap aaj ke featured doctors mein shamil ho gaye! ₹499 aapki next earning se deduct hoga.",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Join failed" });
  }
});

router.post("/lab/join", async (req, res) => {
  const labId = parseLabId(req);
  if (!labId) return res.status(401).json({ error: "Lab center login required" });

  if (!isRegistrationOpen()) {
    const h = getISTHour();
    return res.status(400).json({
      error: `Registration window is 7 AM – 9 AM IST only. Current IST time: ${h}:00. Please try tomorrow morning.`
    });
  }

  const today = getSlotDate();

  try {
    const existing = await db.select().from(dailyFeaturedTable)
      .where(and(
        eq(dailyFeaturedTable.type, "lab"),
        eq(dailyFeaturedTable.entityId, labId),
        eq(dailyFeaturedTable.featuredDate, today)
      ));

    if (existing.length > 0) {
      return res.status(400).json({ error: "Aapka lab center aaj ke liye pehle se featured hai!" });
    }

    const todayCount = await db.select({ c: count() }).from(dailyFeaturedTable)
      .where(and(eq(dailyFeaturedTable.type, "lab"), eq(dailyFeaturedTable.featuredDate, today)));

    if ((todayCount[0]?.c ?? 0) >= 5) {
      return res.status(400).json({ error: "Aaj ke 5 lab featured spots bhar gaye hain. Kal subah 7-9 AM mein phir try karein." });
    }

    const [lab] = await db.select().from(labCentersTable).where(eq(labCentersTable.id, labId));
    if (!lab) return res.status(404).json({ error: "Lab center not found" });

    await db.insert(dailyFeaturedTable).values({
      type: "lab",
      entityId: labId,
      featuredDate: today,
      feeDeducted: 499,
    });

    res.json({
      success: true,
      message: "Aapka lab center aaj ke featured labs mein shamil ho gaya! ₹499 aapki next earning se deduct hoga.",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Join failed" });
  }
});

router.get("/doctor/status", async (req, res) => {
  const doctorId = parseDoctorId(req);
  if (!doctorId) return res.status(401).json({ error: "Login required" });
  const today = getSlotDate();
  try {
    const rows = await db.select().from(dailyFeaturedTable)
      .where(and(eq(dailyFeaturedTable.type, "doctor"), eq(dailyFeaturedTable.entityId, doctorId), eq(dailyFeaturedTable.featuredDate, today)));
    const countRows = await db.select({ c: count() }).from(dailyFeaturedTable)
      .where(and(eq(dailyFeaturedTable.type, "doctor"), eq(dailyFeaturedTable.featuredDate, today)));
    res.json({
      isFeatured: rows.length > 0,
      spotsLeft: Math.max(0, 5 - (countRows[0]?.c ?? 0)),
      windowOpen: isRegistrationOpen(),
      istHour: getISTHour(),
      nextSlotTime: getNextSlotTime(),
    });
  } catch { res.status(500).json({ error: "Status check failed" }); }
});

router.get("/lab/status", async (req, res) => {
  const labId = parseLabId(req);
  if (!labId) return res.status(401).json({ error: "Login required" });
  const today = getSlotDate();
  try {
    const rows = await db.select().from(dailyFeaturedTable)
      .where(and(eq(dailyFeaturedTable.type, "lab"), eq(dailyFeaturedTable.entityId, labId), eq(dailyFeaturedTable.featuredDate, today)));
    const countRows = await db.select({ c: count() }).from(dailyFeaturedTable)
      .where(and(eq(dailyFeaturedTable.type, "lab"), eq(dailyFeaturedTable.featuredDate, today)));
    res.json({
      isFeatured: rows.length > 0,
      spotsLeft: Math.max(0, 5 - (countRows[0]?.c ?? 0)),
      windowOpen: isRegistrationOpen(),
      istHour: getISTHour(),
      nextSlotTime: getNextSlotTime(),
    });
  } catch { res.status(500).json({ error: "Status check failed" }); }
});

export default router;
