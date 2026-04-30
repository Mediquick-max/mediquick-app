import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, careRequestsTable } from "@workspace/db";
import {
  CreateConsultationBody,
  CreateLabBookingBody,
  CreateMedicineOrderBody,
  GetCareActivityResponse,
  GetCareOptionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseUserId(req: any): number | null {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token) return null;
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id] = decoded.split(":");
    const userId = Number(id);
    return isNaN(userId) ? null : userId;
  } catch { return null; }
}

const doctors = [
  {
    id: "doc-general-asha",
    name: "Dr. Asha Mehta",
    speciality: "General Physician",
    experienceYears: 12,
    rating: 4.8,
    fee: 399,
    nextSlot: "Today, 7:30 PM",
    mode: "video",
  },
  {
    id: "doc-cardio-rahul",
    name: "Dr. Rahul Nair",
    speciality: "Cardiologist",
    experienceYears: 16,
    rating: 4.9,
    fee: 699,
    nextSlot: "Tomorrow, 10:00 AM",
    mode: "clinic",
  },
  {
    id: "doc-derma-neha",
    name: "Dr. Neha Kapoor",
    speciality: "Dermatologist",
    experienceYears: 9,
    rating: 4.7,
    fee: 499,
    nextSlot: "Today, 9:00 PM",
    mode: "video",
  },
];

const labTests = [
  { id: "full-body", name: "Full Body Checkup", includes: "CBC, liver, kidney, thyroid, sugar, lipid profile", price: 899, reportTime: "24 hours" },
  { id: "diabetes", name: "Diabetes Care Package", includes: "HbA1c, fasting sugar, kidney markers", price: 499, reportTime: "12 hours" },
  { id: "fever", name: "Fever & Infection Panel", includes: "CBC, CRP, malaria antigen, dengue screen", price: 699, reportTime: "Same day" },
  { id: "cardiac", name: "Heart Health Package", includes: "Lipid profile, ECG, Troponin, CRP, HbA1c", price: 799, reportTime: "24 hours" },
  { id: "thyroid", name: "Thyroid Profile", includes: "TSH, T3, T4, Free T3, Free T4", price: 299, reportTime: "12 hours" },
  { id: "vitamins", name: "Vitamin & Mineral Check", includes: "Vitamin D3, B12, Iron, Calcium, Magnesium, Zinc", price: 599, reportTime: "24 hours" },
  { id: "womens-health", name: "Women's Health Package", includes: "CBC, Thyroid, Vitamin D3 & B12, Hormones, PCOD Screen", price: 999, reportTime: "24 hours" },
  { id: "kidney", name: "Kidney Function Test", includes: "Creatinine, BUN, Uric Acid, eGFR, Electrolytes", price: 349, reportTime: "12 hours" },
];

const medicines = [
  {
    id: "med-dolo",
    name: "Dolo 650",
    price: 34,
    deliveryEta: "45-60 min",
    prescriptionRequired: false,
  },
  {
    id: "med-cetirizine",
    name: "Cetirizine 10mg",
    price: 22,
    deliveryEta: "45-60 min",
    prescriptionRequired: false,
  },
  {
    id: "med-metformin",
    name: "Metformin 500mg",
    price: 68,
    deliveryEta: "Today",
    prescriptionRequired: true,
  },
];

router.get("/care/options", (_req, res): void => {
  res.json(GetCareOptionsResponse.parse({ doctors, labTests, medicines }));
});

router.get("/care/activity", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(careRequestsTable)
    .orderBy(desc(careRequestsTable.createdAt));

  res.json(
    GetCareActivityResponse.parse({
      consultations: rows.filter((row) => row.type === "consultation"),
      labBookings: rows.filter((row) => row.type === "lab"),
      medicineOrders: rows.filter((row) => row.type === "medicine"),
    }),
  );
});

router.post("/care/consultations", async (req, res): Promise<void> => {
  const parsed = CreateConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const doctor = doctors.find((item) => item.id === parsed.data.doctorId);
  if (!doctor) {
    res.status(400).json({ error: "Doctor not found" });
    return;
  }

  const [created] = await db
    .insert(careRequestsTable)
    .values({
      type: "consultation",
      itemId: doctor.id,
      title: `${doctor.speciality} with ${doctor.name}`,
      patientName: parsed.data.patientName.trim(),
      phone: parsed.data.phone.trim(),
      notes: parsed.data.concern.trim(),
      mode: parsed.data.mode,
      dateSlot: parsed.data.dateSlot.trim(),
      status: parsed.data.mode === "video" ? "Video consult booked" : "Clinic visit booked",
      amount: doctor.fee,
      platformFee: Math.round(doctor.fee * 0.02),
      providerPayout: Math.round(doctor.fee * 0.98),
    })
    .returning();

  res.status(201).json(created);
});

// Lab plan discount rates (online payment only)
const LAB_PLAN_DISCOUNTS: Record<string, number> = {
  free: 0, gold: 0.02, platinum: 0.05, yearly: 0.10,
};

router.post("/care/lab-bookings", async (req, res): Promise<void> => {
  const bodyWithPayment = { ...req.body };
  const paymentMethod: "online" | "cash" = bodyWithPayment.paymentMethod === "cash" ? "cash" : "online";
  delete bodyWithPayment.paymentMethod;

  const parsed = CreateLabBookingBody.safeParse(bodyWithPayment);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const test = labTests.find((item) => item.id === parsed.data.testId);
  if (!test) {
    res.status(400).json({ error: "Lab test not found" });
    return;
  }

  const userId = parseUserId(req);

  // Get user's active plan for discount
  let userPlan = "free";
  if (userId) {
    const { appUsersTable } = await import("@workspace/db");
    const { eq } = await import("drizzle-orm");
    const [u] = await db.select({ plan: appUsersTable.plan, membershipExpiresAt: appUsersTable.membershipExpiresAt })
      .from(appUsersTable).where(eq(appUsersTable.id, userId)).limit(1);
    if (u && u.plan !== "free" && u.membershipExpiresAt && new Date(u.membershipExpiresAt) > new Date()) {
      userPlan = u.plan;
    }
  }

  const discountRate = paymentMethod === "online" ? (LAB_PLAN_DISCOUNTS[userPlan] ?? 0) : 0;
  const discountAmount = Math.round(test.price * discountRate);
  const finalAmount = test.price - discountAmount;
  const platformFee = Math.round(finalAmount * 0.02);
  const providerPayout = finalAmount - platformFee;

  const statusMsg = paymentMethod === "cash"
    ? "Cash payment - Home sample collection booked"
    : "Home sample collection booked";

  const [created] = await db
    .insert(careRequestsTable)
    .values({
      type: "lab",
      itemId: test.id,
      title: test.name,
      patientName: parsed.data.patientName.trim(),
      phone: parsed.data.phone.trim(),
      address: parsed.data.address.trim(),
      dateSlot: parsed.data.dateSlot.trim(),
      status: statusMsg,
      amount: finalAmount,
      platformFee,
      providerPayout,
      discountAmount,
      paymentMethod,
      notes: `Reports in ${test.reportTime}`,
      userId: userId ?? undefined,
    })
    .returning();

  res.status(201).json({ ...created, originalPrice: test.price, discountAmount, finalAmount, paymentMethod });
});

router.post("/care/medicine-orders", async (req, res): Promise<void> => {
  const parsed = CreateMedicineOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const medicine = medicines.find((item) => item.id === parsed.data.medicineId);
  if (!medicine) {
    res.status(400).json({ error: "Medicine not found" });
    return;
  }

  const [created] = await db
    .insert(careRequestsTable)
    .values({
      type: "medicine",
      itemId: medicine.id,
      title: `${medicine.name} x ${parsed.data.quantity}`,
      patientName: parsed.data.patientName.trim(),
      phone: parsed.data.phone.trim(),
      address: parsed.data.address.trim(),
      dateSlot: medicine.deliveryEta,
      status: medicine.prescriptionRequired ? "Prescription verification needed" : "Order confirmed",
      amount: medicine.price * parsed.data.quantity,
      notes: medicine.prescriptionRequired ? "Prescription required before dispatch" : "No prescription required",
    })
    .returning();

  res.status(201).json(created);
});

export default router;