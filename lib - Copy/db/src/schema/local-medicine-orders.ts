import { doublePrecision, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const localMedicineOrdersTable = pgTable("local_medicine_orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shopkeeperId: integer("shopkeeper_id").notNull(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLat: doublePrecision("delivery_lat"),
  deliveryLng: doublePrecision("delivery_lng"),
  distanceMeters: integer("distance_meters").notNull().default(0),
  deliveryCharge: doublePrecision("delivery_charge").notNull().default(0),
  platformFee: doublePrecision("platform_fee").notNull().default(0),
  subtotal: doublePrecision("subtotal").notNull().default(0),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  medicinesJson: text("medicines_json").notNull().default("[]"),
  status: text("status").notNull().default("pending"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LocalMedicineOrder = typeof localMedicineOrdersTable.$inferSelect;
