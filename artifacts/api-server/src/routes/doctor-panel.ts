import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";
import { db, doctorsTable, appointmentsTable } from "@workspace/db";

const router = Router();

function hashPw(pw: string) {
  return crypto.createHash("sha256").update(pw + "mq_doc_salt").digest("hex");
}

function makeToken(id: number, email: string) {
  const payload = `${id}:${email}:${Date.now()}`;
  return Buffer.from(payload, "utf-8").toString("base64url");
}

function parseDoctorAuth(req: any): number | null {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id] = decoded.split(":");
    const doctorId = Number(id);
    return isNaN(doctorId) ? null : doctorId;
  } catch { return null; }
}

const SPECIALIZATIONS = [
  "General Physician", "Cardiologist", "Dermatologist", "Pediatrician",
  "Orthopedic Surgeon", "Gynecologist", "Neurologist", "Psychiatrist",
  "ENT Specialist", "Ophthalmologist", "Diabetologist", "Pulmonologist",
  "Gastroenterologist", "Nephrologist", "Urologist", "Oncologist",
  "Radiologist", "Anesthesiologist", "Dentist", "Physiotherapist", "Other"
];

const DEFAULT_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
  "06:00 PM", "07:00 PM"
];

router.get("/specializations", (_req, res) => {
  res.json({ specializations: SPECIALIZATIONS });
});

router.post("/register", async (req, res) => {
  const {
    name, email, password, phone,
    specialization, qualifications, experienceYears,
    city, hospitalName, address,
    fee, consultationType, bio,
    languages, availableDays, availableSlots, imageUrl
  } = req.body;

  if (!name || !email || !password || !specialization) {
    res.status(400).json({ error: "Name, email, password and specialization are required" }); return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" }); return;
  }

  const existing = await db.select({ id: doctorsTable.id })
    .from(doctorsTable).where(eq(doctorsTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" }); return;
  }

  const slots = availableSlots?.length ? JSON.stringify(availableSlots) : JSON.stringify(DEFAULT_SLOTS);
  const days = availableDays?.length ? availableDays.join(",") : "Mon,Tue,Wed,Thu,Fri";

  const [doctor] = await db.insert(doctorsTable).values({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: hashPw(password),
    phone: phone ?? "",
    specialization,
    qualifications: qualifications ?? "",
    experienceYears: Number(experienceYears) || 0,
    city: city ?? "Mumbai",
    hospitalName: hospitalName ?? "",
    address: address ?? "",
    fee: Number(fee) || 499,
    consultationType: consultationType ?? "both",
    bio: bio ?? "",
    languages: languages ?? "Hindi, English",
    availableDays: days,
    availableSlots: slots,
    imageUrl: imageUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    rating: 0,
    totalReviews: 0,
    registrationStatus: "pending",
    status: "inactive",
  }).returning();

  const token = makeToken(doctor.id, doctor.email!);
  const { passwordHash: _ph, ...safe } = doctor;
  res.status(201).json({ doctor: safe, token });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }

  const [doctor] = await db.select().from(doctorsTable)
    .where(eq(doctorsTable.email, email.toLowerCase())).limit(1);

  if (!doctor || !doctor.passwordHash) { res.status(401).json({ error: "Invalid credentials" }); return; }
  if (doctor.passwordHash !== hashPw(password)) { res.status(401).json({ error: "Invalid credentials" }); return; }

  const token = makeToken(doctor.id, doctor.email!);
  const { passwordHash: _ph, ...safe } = doctor;
  res.json({ doctor: safe, token });
});

router.get("/profile", async (req, res) => {
  const doctorId = parseDoctorAuth(req);
  if (!doctorId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [doctor] = await db.select().from(doctorsTable)
    .where(eq(doctorsTable.id, doctorId)).limit(1);
  if (!doctor) { res.status(404).json({ error: "Doctor not found" }); return; }

  const { passwordHash: _ph, ...safe } = doctor;
  res.json({ doctor: safe });
});

router.put("/profile", async (req, res) => {
  const doctorId = parseDoctorAuth(req);
  if (!doctorId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const allowed = [
    "name", "phone", "specialization", "qualifications", "experienceYears",
    "city", "hospitalName", "address", "fee", "consultationType", "bio",
    "languages", "availableDays", "imageUrl",
    "paymentMethod", "upiId", "bankAccountHolder", "bankAccountNumber", "bankIfscCode", "bankName"
  ];
  const updateData: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }
  if (req.body.availableSlots) {
    updateData.availableSlots = JSON.stringify(req.body.availableSlots);
  }
  if (req.body.availableDays && Array.isArray(req.body.availableDays)) {
    updateData.availableDays = req.body.availableDays.join(",");
  }
  if (req.body.newPassword) {
    if (req.body.newPassword.length < 6) { res.status(400).json({ error: "Password too short" }); return; }
    updateData.passwordHash = hashPw(req.body.newPassword);
  }

  const [updated] = await db.update(doctorsTable)
    .set(updateData).where(eq(doctorsTable.id, doctorId)).returning();

  const { passwordHash: _ph, ...safe } = updated;
  res.json({ doctor: safe });
});

router.get("/appointments", async (req, res) => {
  const doctorId = parseDoctorAuth(req);
  if (!doctorId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const appointments = await db.select().from(appointmentsTable)
    .where(eq(appointmentsTable.doctorId, doctorId))
    .orderBy(desc(appointmentsTable.createdAt));

  res.json({ appointments });
});

router.put("/appointments/:id/status", async (req, res) => {
  const doctorId = parseDoctorAuth(req);
  if (!doctorId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const apptId = Number(req.params.id);
  const { status } = req.body;
  const validStatuses = ["confirmed", "completed", "cancelled", "no_show"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  const [updated] = await db.update(appointmentsTable)
    .set({ status }).where(eq(appointmentsTable.id, apptId)).returning();
  res.json({ appointment: updated });
});

const DOCTOR_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 0,
    tag: "Free Forever",
    platformFee: "2%",
    color: "gray",
    benefits: [
      "Up to 10 consultations/month",
      "Standard profile listing",
      "Basic patient matching",
      "2% platform fee per booking",
      "AI health assistant access",
      "Standard support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 299,
    tag: "Monthly",
    platformFee: "1.5%",
    color: "blue",
    benefits: [
      "Up to 50 consultations/month",
      "Featured listing (2x visibility)",
      "Priority patient matching",
      "1.5% platform fee (reduced)",
      "Consultation analytics",
      "Dedicated support",
      "AI health assistant access",
      "Medicine reminders for patients",
    ],
  },
  {
    id: "clinic",
    name: "Clinic",
    price: 599,
    tag: "Monthly",
    platformFee: "1%",
    color: "purple",
    benefits: [
      "Unlimited consultations",
      "Top featured listing",
      "Maximum patient visibility",
      "1% platform fee (lowest)",
      "Advanced analytics & reports",
      "Priority 24/7 support",
      "Custom profile badge",
      "Multi-doctor clinic support",
      "AI health assistant access",
      "Medicine reminders for patients",
    ],
  },
];

router.get("/plans", (_req, res) => {
  res.json({ plans: DOCTOR_PLANS });
});

export default router;
