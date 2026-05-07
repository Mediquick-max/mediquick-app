import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
  amount: integer("amount").notNull().default(0),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export type Subscription = typeof subscriptionsTable.$inferSelect;
export const insertSubscriptionSchema = z.object({
  userId: z.number().int(),
  plan: z.string().min(1),
  status: z.string().default("active"),
  amount: z.number().int().default(0),
  billingCycle: z.string().default("monthly"),
});
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
