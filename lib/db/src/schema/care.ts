import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const careRequestsTable = pgTable("care_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(),
  itemId: text("item_id").notNull(),
  title: text("title").notNull(),
  patientName: text("patient_name").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes").notNull().default(""),
  address: text("address").notNull().default(""),
  mode: text("mode").notNull().default(""),
  dateSlot: text("date_slot").notNull(),
  status: text("status").notNull().default("Confirmed"),
  amount: integer("amount").notNull().default(0),
  platformFee: integer("platform_fee").notNull().default(0),
  providerPayout: integer("provider_payout").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("online"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});