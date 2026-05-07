import { Router } from "express";
import { eq, ilike, or, desc } from "drizzle-orm";
import { db, shopkeeperMedicinesTable, medicineOrdersTable } from "@workspace/db";

const router = Router();

const SAMPLE_MEDICINES = [
  { name: "Dolo 650", category: "Fever & Pain", price: 30, stock: 100, unit: "strip of 15", description: "Paracetamol 650mg — fast fever & pain relief", manufacturer: "Micro Labs" },
  { name: "Azithromycin 500mg", category: "Antibiotics", price: 85, stock: 60, unit: "strip of 5", description: "Broad-spectrum antibiotic for bacterial infections", manufacturer: "Cipla" },
  { name: "Pantoprazole 40mg", category: "Gastric & Acidity", price: 65, stock: 80, unit: "strip of 14", description: "Proton pump inhibitor for acidity and GERD", manufacturer: "Sun Pharma" },
  { name: "Metformin 500mg", category: "Diabetes", price: 45, stock: 120, unit: "strip of 20", description: "Controls blood sugar levels in Type 2 Diabetes", manufacturer: "USV Ltd" },
  { name: "Atorvastatin 10mg", category: "Cardiac & BP", price: 90, stock: 50, unit: "strip of 10", description: "Reduces cholesterol and heart disease risk", manufacturer: "Sun Pharma" },
  { name: "Cetrizine 10mg", category: "Allergy & Cold", price: 25, stock: 200, unit: "strip of 10", description: "Antihistamine for allergies, runny nose, sneezing", manufacturer: "Mankind Pharma" },
  { name: "Vitamin D3 60000 IU", category: "Vitamins & Nutrition", price: 120, stock: 40, unit: "strip of 4 capsules", description: "Weekly vitamin D supplement for bone health", manufacturer: "Abbott India" },
  { name: "Omeprazole 20mg", category: "Gastric & Acidity", price: 55, stock: 90, unit: "strip of 15", description: "Treats acid reflux, stomach ulcers, heartburn", manufacturer: "Dr. Reddy's" },
  { name: "Amoxicillin 500mg", category: "Antibiotics", price: 75, stock: 70, unit: "strip of 10", description: "Penicillin antibiotic for bacterial infections", manufacturer: "GSK India" },
  { name: "Aspirin 75mg", category: "Cardiac & BP", price: 35, stock: 150, unit: "strip of 14", description: "Blood thinner to prevent heart attacks & strokes", manufacturer: "Bayer India" },
  { name: "Multivitamin Supradyn", category: "Vitamins & Nutrition", price: 160, stock: 55, unit: "strip of 15", description: "Complete daily multivitamin for energy & immunity", manufacturer: "Bayer India" },
  { name: "Ibuprofen 400mg", category: "Fever & Pain", price: 40, stock: 110, unit: "strip of 15", description: "NSAID for pain, fever, and inflammation", manufacturer: "Abbott India" },
  { name: "Montelukast 10mg", category: "Allergy & Cold", price: 95, stock: 45, unit: "strip of 10", description: "Treats asthma and seasonal allergies", manufacturer: "Cipla" },
  { name: "Metoprolol 25mg", category: "Cardiac & BP", price: 70, stock: 65, unit: "strip of 14", description: "Beta-blocker for high blood pressure and angina", manufacturer: "Alkem Labs" },
  { name: "Glimepiride 1mg", category: "Diabetes", price: 55, stock: 80, unit: "strip of 30", description: "Sulfonylurea drug to control blood sugar", manufacturer: "Sanofi India" },
  { name: "B-Complex Neurobion", category: "Vitamins & Nutrition", price: 110, stock: 75, unit: "strip of 10", description: "B-vitamin complex for nerve health and energy", manufacturer: "Procter & Gamble" },
  { name: "Cough Syrup Benadryl", category: "Allergy & Cold", price: 85, stock: 90, unit: "100ml bottle", description: "Effective cough relief with antihistamine", manufacturer: "Johnson & Johnson" },
  { name: "Ranitidine 150mg", category: "Gastric & Acidity", price: 30, stock: 130, unit: "strip of 15", description: "H2 blocker for stomach acid and ulcers", manufacturer: "GSK India" },
  { name: "Calcium + D3 Shelcal", category: "Vitamins & Nutrition", price: 145, stock: 60, unit: "strip of 15", description: "Calcium supplement for strong bones and teeth", manufacturer: "Elder Pharma" },
  { name: "Telmisartan 40mg", category: "Cardiac & BP", price: 80, stock: 55, unit: "strip of 10", description: "ARB for hypertension and heart failure", manufacturer: "Macleods" },
];

async function ensureMedicinesSeeded() {
  const existing = await db.select({ id: shopkeeperMedicinesTable.id }).from(shopkeeperMedicinesTable).limit(1);
  if (existing.length > 0) return;

  await db.insert(shopkeeperMedicinesTable).values(
    SAMPLE_MEDICINES.map(m => ({ ...m, shopkeeperId: 1 }))
  );
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
  } catch { return null; }
}

router.get("/catalog", async (req, res) => {
  await ensureMedicinesSeeded();
  const { search, category } = req.query as Record<string, string>;

  const all = await db.select().from(shopkeeperMedicinesTable)
    .where(
      search
        ? or(
            ilike(shopkeeperMedicinesTable.name, `%${search}%`),
            ilike(shopkeeperMedicinesTable.category, `%${search}%`),
            ilike(shopkeeperMedicinesTable.manufacturer, `%${search}%`)
          )
        : undefined
    )
    .orderBy(shopkeeperMedicinesTable.name);

  const filtered = category && category !== "All"
    ? all.filter(m => m.category === category)
    : all;

  res.json(filtered);
});

router.get("/categories", async (_req, res) => {
  const meds = await db.select({ cat: shopkeeperMedicinesTable.category }).from(shopkeeperMedicinesTable);
  if (meds.length === 0) {
    const defaultCats = ["All", "Fever & Pain", "Antibiotics", "Gastric & Acidity", "Diabetes", "Cardiac & BP", "Allergy & Cold", "Vitamins & Nutrition"];
    res.json(defaultCats);
    return;
  }
  const unique = ["All", ...new Set(meds.map(m => m.cat))];
  res.json(unique);
});

router.post("/order", async (req, res) => {
  const { patientName, phone, deliveryAddress, city, pincode, items } = req.body ?? {};
  if (!patientName || !phone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Patient name, phone, address, and items are required" });
    return;
  }

  const userId = parseAuth(req);
  const totalAmount = items.reduce((s: number, item: any) => s + (item.price * item.qty), 0);

  const [order] = await db.insert(medicineOrdersTable).values({
    userId: userId ?? undefined,
    patientName,
    phone,
    deliveryAddress,
    city: city ?? "",
    pincode: pincode ?? "",
    items: JSON.stringify(items),
    totalAmount,
    status: "placed",
  }).returning();

  res.status(201).json({ success: true, order, estimatedDelivery: "4-6 hours" });
});

router.get("/my-orders", async (req, res) => {
  const userId = parseAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const orders = await db.select().from(medicineOrdersTable)
    .where(eq(medicineOrdersTable.userId, userId))
    .orderBy(desc(medicineOrdersTable.createdAt));

  res.json(orders);
});

router.get("/admin/orders", async (_req, res) => {
  const orders = await db.select().from(medicineOrdersTable).orderBy(desc(medicineOrdersTable.createdAt));
  res.json(orders);
});

export default router;
