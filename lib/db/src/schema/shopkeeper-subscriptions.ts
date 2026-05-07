import { integer, pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const shopkeeperSubscriptionsTable = pgTable("shopkeeper_subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shopkeeperId: integer("shopkeeper_id").notNull(),
  plan: text("plan").notNull().default("free"),
  medicineLimit: integer("medicine_limit").notNull().default(10),
  amountPaid: doublePrecision("amount_paid").notNull().default(0),
  razorpayOrderId: text("razorpay_order_id").notNull().default(""),
  razorpayPaymentId: text("razorpay_payment_id").notNull().default(""),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShopkeeperSubscription = typeof shopkeeperSubscriptionsTable.$inferSelect;
