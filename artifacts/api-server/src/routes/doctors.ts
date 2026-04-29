import { Router } from "express";
import { eq, ilike, or, desc, and } from "drizzle-orm";
import crypto from "crypto";
import { db, doctorsTable, appointmentsTable, doctorReviewsTable } from "@workspace/db";

const router = Router();

const DEFAULT_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "06:00 PM", "07:00 PM"
];

function parseAuth(req: any): number | null {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [id] = decoded.split(":");
    const userId = Number(id);
    return isNaN(userId) ? null : userId;
  } catch { return null; }
}

async function ensureDoctorsSeeded() {
  const existing = await db.select({ id: doctorsTable.id }).from(doctorsTable).limit(1);
  if (existing.length > 0) return;

  const sampleSlots = JSON.stringify(DEFAULT_SLOTS);
  await db.insert(doctorsTable).values([
    {
      name: "Dr. Asha Mehta", specialization: "General Physician", experienceYears: 12,
      rating: 4.8, totalReviews: 234, fee: 399, consultationType: "video",
      bio: "Dr. Asha Mehta is a highly experienced general physician with over 12 years in primary care. She specializes in preventive medicine and chronic disease management.",
      qualifications: "MBBS (AIIMS Delhi), MD (General Medicine), Fellow - Royal College of Physicians",
      languages: "Hindi, English, Marathi", city: "Mumbai",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=asha&backgroundColor=b6e3f4",
      availableSlots: sampleSlots, status: "active",
    },
    {
      name: "Dr. Rahul Nair", specialization: "Cardiologist", experienceYears: 16,
      rating: 4.9, totalReviews: 312, fee: 799, consultationType: "clinic",
      bio: "Dr. Rahul Nair is a leading cardiologist with 16 years of expertise in interventional cardiology and heart failure management. He has performed over 2000 cardiac procedures.",
      qualifications: "MBBS, MD (Cardiology), DM Cardiology (PGI Chandigarh), FACC",
      languages: "Hindi, English, Malayalam", city: "Kochi",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul&backgroundColor=c0aede",
      availableSlots: sampleSlots, status: "active",
    },
    {
      name: "Dr. Neha Kapoor", specialization: "Dermatologist", experienceYears: 9,
      rating: 4.7, totalReviews: 189, fee: 499, consultationType: "both",
      bio: "Dr. Neha Kapoor is a board-certified dermatologist specializing in acne, skin allergies, and cosmetic dermatology. She is known for her patient-centric approach.",
      qualifications: "MBBS (KEM Mumbai), MD (Dermatology), Fellowship in Cosmetic Dermatology",
      languages: "Hindi, English, Punjabi", city: "Delhi",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=neha&backgroundColor=d1f4e0",
      availableSlots: sampleSlots, status: "active",
    },
    {
      name: "Dr. Vijay Sharma", specialization: "Pediatrician", experienceYears: 14,
      rating: 4.9, totalReviews: 428, fee: 449, consultationType: "both",
      bio: "Dr. Vijay Sharma is a compassionate pediatrician with 14 years of experience in child health, newborn care, and pediatric emergencies. Parents trust him for his gentle approach.",
      qualifications: "MBBS, MD (Pediatrics), Fellowship in Neonatology (NIMHANS)",
      languages: "Hindi, English, Gujarati", city: "Ahmedabad",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=vijay&backgroundColor=ffd5dc",
      availableSlots: sampleSlots, status: "active",
    },
    {
      name: "Dr. Priya Iyer", specialization: "Gynaecologist", experienceYears: 11,
      rating: 4.8, totalReviews: 267, fee: 599, consultationType: "both",
      bio: "Dr. Priya Iyer is a senior gynaecologist and obstetrician specializing in high-risk pregnancies, PCOS, and minimally invasive surgeries. She has delivered over 3000 babies.",
      qualifications: "MBBS, MS (OBG), Laparoscopy Fellowship (AIIMS), FOGSI Member",
      languages: "Hindi, English, Tamil", city: "Chennai",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=ffdfbf",
      availableSlots: sampleSlots, status: "active",
    },
    {
      name: "Dr. Arjun Reddy", specialization: "Orthopedic Surgeon", experienceYears: 18,
      rating: 4.7, totalReviews: 356, fee: 699, consultationType: "clinic",
      bio: "Dr. Arjun Reddy is a renowned orthopedic surgeon with specialization in joint replacement, sports injuries, and spine surgery. He has successfully performed 1500+ surgeries.",
      qualifications: "MBBS, MS (Orthopaedics), DNB, Fellowship in Joint Replacement (Germany)",
      languages: "Hindi, English, Telugu", city: "Hyderabad",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun&backgroundColor=b6e3f4",
      availableSlots: sampleSlots, status: "active",
    },
    {
      name: "Dr. Sunita Patel", specialization: "Psychiatrist", experienceYears: 10,
      rating: 4.6, totalReviews: 143, fee: 599, consultationType: "video",
      bio: "Dr. Sunita Patel is a mental health specialist with expertise in depression, anxiety disorders, and stress management. She provides compassionate care using evidence-based therapies.",
      qualifications: "MBBS, MD (Psychiatry), CBT Certified, Mindfulness-Based Therapy",
      languages: "Hindi, English, Gujarati", city: "Pune",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sunita&backgroundColor=d1f4e0",
      availableSlots: sampleSlots, status: "active",
    },
    {
      name: "Dr. Manish Gupta", specialization: "Diabetologist", experienceYears: 13,
      rating: 4.8, totalReviews: 198, fee: 499, consultationType: "both",
      bio: "Dr. Manish Gupta is India's top diabetologist focusing on diabetes management, insulin therapy, and lifestyle modification. He has helped 10,000+ patients control their sugar levels.",
      qualifications: "MBBS, MD (Internal Medicine), FRCP (Edinburgh), FACE",
      languages: "Hindi, English", city: "Lucknow",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=manish&backgroundColor=c0aede",
      availableSlots: sampleSlots, status: "active",
    },
  ]);

  await db.insert(doctorReviewsTable).values([
    { doctorId: 1, reviewerName: "Ravi Kumar", rating: 5, comment: "Dr. Asha is amazing! She listened carefully and diagnosed my problem quickly. Highly recommended." },
    { doctorId: 1, reviewerName: "Meera Singh", rating: 5, comment: "Very professional and caring doctor. The online consultation was smooth and effective." },
    { doctorId: 1, reviewerName: "Ajay Patel", rating: 4, comment: "Good consultation. She explained everything in simple Hindi which was very helpful." },
    { doctorId: 2, reviewerName: "Suresh Nambiar", rating: 5, comment: "Dr. Rahul saved my father's life! Outstanding cardiologist with exceptional skills." },
    { doctorId: 2, reviewerName: "Kavita Sharma", rating: 5, comment: "Best cardiologist in the city. Very thorough in his examination and treatment." },
    { doctorId: 3, reviewerName: "Pooja Verma", rating: 5, comment: "My acne problem is finally under control thanks to Dr. Neha! Her treatment plan was perfect." },
    { doctorId: 4, reviewerName: "Rahul Dad", rating: 5, comment: "Dr. Vijay is so gentle with kids. My daughter stopped crying as soon as she saw him!" },
    { doctorId: 5, reviewerName: "Ananya Roy", rating: 5, comment: "Dr. Priya made my pregnancy journey so comfortable. She is absolutely wonderful." },
  ]);
}

router.get("/", async (req, res) => {
  await ensureDoctorsSeeded();
  const { search, specialization, type } = req.query as Record<string, string>;

  let query = db.select().from(doctorsTable).where(eq(doctorsTable.status, "active"));

  const results = await db.select().from(doctorsTable).where(
    and(
      eq(doctorsTable.status, "active"),
      specialization ? eq(doctorsTable.specialization, specialization) : undefined,
      type && type !== "all" ? eq(doctorsTable.consultationType, type) : undefined,
      search ? or(
        ilike(doctorsTable.name, `%${search}%`),
        ilike(doctorsTable.specialization, `%${search}%`)
      ) : undefined,
    )
  ).orderBy(desc(doctorsTable.rating));

  res.json(results);
});

router.get("/specializations", async (_req, res) => {
  await ensureDoctorsSeeded();
  const docs = await db.select({ spec: doctorsTable.specialization }).from(doctorsTable).where(eq(doctorsTable.status, "active"));
  const unique = [...new Set(docs.map(d => d.spec))];
  res.json(unique);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid doctor ID" }); return; }

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
  if (!doctor) { res.status(404).json({ error: "Doctor not found" }); return; }

  const reviews = await db.select().from(doctorReviewsTable)
    .where(eq(doctorReviewsTable.doctorId, id))
    .orderBy(desc(doctorReviewsTable.createdAt))
    .limit(10);

  res.json({ ...doctor, reviews });
});

router.post("/:id/book", async (req, res) => {
  const doctorId = Number(req.params.id);
  if (isNaN(doctorId)) { res.status(400).json({ error: "Invalid doctor ID" }); return; }

  const userId = parseAuth(req);
  const { patientName, phone, date, timeSlot, healthIssue, consultationType } = req.body ?? {};

  if (!patientName || !phone || !date || !timeSlot) {
    res.status(400).json({ error: "Patient name, phone, date, and time slot are required" });
    return;
  }

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, doctorId));
  if (!doctor) { res.status(404).json({ error: "Doctor not found" }); return; }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const meetingLink = consultationType === "video" || consultationType === "both"
      ? `https://meet.jit.si/mediquick-${Date.now()}`
      : "";

    const [apt] = await db.insert(appointmentsTable).values({
      userId: userId ?? undefined,
      doctorId,
      patientName,
      phone,
      date,
      timeSlot,
      healthIssue: healthIssue ?? "",
      consultationType: consultationType ?? "video",
      status: "confirmed",
      meetingLink,
      amountPaid: doctor.fee,
    }).returning();

    res.status(201).json({ appointment: apt, paymentRequired: false, message: "Appointment confirmed (payment gateway not configured)" });
    return;
  }

  try {
    const Razorpay = (await import("razorpay")).default;
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await rzp.orders.create({
      amount: doctor.fee * 100,
      currency: "INR",
      receipt: `apt_${doctorId}_${Date.now()}`,
      notes: { doctorId: String(doctorId), userId: String(userId ?? "guest") },
    });

    const [apt] = await db.insert(appointmentsTable).values({
      userId: userId ?? undefined,
      doctorId,
      patientName,
      phone,
      date,
      timeSlot,
      healthIssue: healthIssue ?? "",
      consultationType: consultationType ?? "video",
      status: "pending",
      razorpayOrderId: order.id,
      amountPaid: doctor.fee,
    }).returning();

    res.status(201).json({ appointment: apt, paymentRequired: true, orderId: order.id, amount: doctor.fee * 100, currency: "INR", keyId });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/appointments/:id/verify", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid appointment ID" }); return; }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keySecret) {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
    if (expected !== razorpay_signature) {
      res.status(400).json({ error: "Payment signature verification failed" }); return;
    }
  }

  const meetingLink = `https://meet.jit.si/mediquick-${id}-${Date.now()}`;

  const [apt] = await db.update(appointmentsTable)
    .set({ status: "confirmed", razorpayPaymentId: razorpay_payment_id ?? "", meetingLink })
    .where(eq(appointmentsTable.id, id))
    .returning();

  res.json({ success: true, appointment: apt });
});

router.get("/my/appointments", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const apts = await db.select({
    appointment: appointmentsTable,
    doctor: doctorsTable,
  })
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(eq(appointmentsTable.userId, userId))
    .orderBy(desc(appointmentsTable.createdAt));

  res.json(apts);
});

router.get("/admin/all", async (_req, res) => {
  const docs = await db.select().from(doctorsTable).orderBy(desc(doctorsTable.createdAt));
  res.json(docs);
});

router.get("/admin/pending", async (_req, res) => {
  const docs = await db.select().from(doctorsTable)
    .where(eq(doctorsTable.registrationStatus, "pending"))
    .orderBy(desc(doctorsTable.createdAt));
  res.json(docs);
});

router.put("/admin/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [doc] = await db.update(doctorsTable)
    .set({ registrationStatus: "approved", status: "active" })
    .where(eq(doctorsTable.id, id)).returning();
  res.json(doc);
});

router.put("/admin/:id/reject", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [doc] = await db.update(doctorsTable)
    .set({ registrationStatus: "rejected", status: "inactive" })
    .where(eq(doctorsTable.id, id)).returning();
  res.json(doc);
});

router.post("/admin/create", async (req, res) => {
  const { name, specialization, experienceYears, fee, consultationType, bio, qualifications, languages, city, availableSlots } = req.body ?? {};
  if (!name || !specialization) { res.status(400).json({ error: "Name and specialization required" }); return; }

  const [doc] = await db.insert(doctorsTable).values({
    name, specialization, experienceYears: Number(experienceYears) || 0,
    fee: Number(fee) || 499, consultationType: consultationType ?? "both",
    bio: bio ?? "", qualifications: qualifications ?? "",
    languages: languages ?? "Hindi, English", city: city ?? "Mumbai",
    availableSlots: availableSlots ? JSON.stringify(availableSlots) : JSON.stringify(DEFAULT_SLOTS),
  }).returning();

  res.status(201).json(doc);
});

router.put("/admin/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { name, specialization, experienceYears, fee, consultationType, bio, qualifications, languages, city, status } = req.body ?? {};
  const [doc] = await db.update(doctorsTable).set({
    ...(name && { name }),
    ...(specialization && { specialization }),
    ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) }),
    ...(fee !== undefined && { fee: Number(fee) }),
    ...(consultationType && { consultationType }),
    ...(bio !== undefined && { bio }),
    ...(qualifications !== undefined && { qualifications }),
    ...(languages !== undefined && { languages }),
    ...(city !== undefined && { city }),
    ...(status !== undefined && { status }),
  }).where(eq(doctorsTable.id, id)).returning();

  res.json(doc);
});

router.delete("/admin/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.update(doctorsTable).set({ status: "inactive" }).where(eq(doctorsTable.id, id));
  res.json({ success: true });
});

router.get("/admin/appointments", async (_req, res) => {
  const apts = await db.select({
    appointment: appointmentsTable,
    doctor: { id: doctorsTable.id, name: doctorsTable.name, specialization: doctorsTable.specialization },
  })
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .orderBy(desc(appointmentsTable.createdAt));

  res.json(apts);
});

export default router;
