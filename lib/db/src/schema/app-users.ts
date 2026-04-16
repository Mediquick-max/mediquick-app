import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const appUsersTable = pgTable("app_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  city: text("city").notNull().default(""),
  deviceType: text("device_type").notNull().default("web"),
  passwordHash: text("password_hash").notNull().default(""),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AppUser = typeof appUsersTable.$inferSelect;
export const insertAppUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().default(""),
  plan: z.string().default("free"),
  status: z.string().default("active"),
  city: z.string().default(""),
  deviceType: z.string().default("web"),
});
export type InsertAppUser = z.infer<typeof insertAppUserSchema>;
