import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull().default(""),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("success"),
  gateway: text("gateway").notNull().default("razorpay"),
  transactionId: text("transaction_id").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Payment = typeof paymentsTable.$inferSelect;
export const insertPaymentSchema = z.object({
  userId: z.number().int(),
  userName: z.string().default(""),
  description: z.string().min(1),
  amount: z.number().int(),
  currency: z.string().default("INR"),
  status: z.string().default("success"),
  gateway: z.string().default("razorpay"),
  transactionId: z.string().default(""),
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
