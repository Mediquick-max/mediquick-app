import { integer, pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const medicineOrdersTable = pgTable("medicine_orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  patientName: text("patient_name").notNull(),
  phone: text("phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  city: text("city").notNull().default(""),
  pincode: text("pincode").notNull().default(""),
  items: text("items").notNull(),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  status: text("status").notNull().default("placed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MedicineOrder = typeof medicineOrdersTable.$inferSelect;
