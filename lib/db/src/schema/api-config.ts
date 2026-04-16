import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const apiConfigTable = pgTable("api_config", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  provider: text("provider").notNull().unique(),
  label: text("label").notNull(),
  keyValue: text("key_value").notNull().default(""),
  isActive: text("is_active").notNull().default("true"),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ApiConfig = typeof apiConfigTable.$inferSelect;
export const insertApiConfigSchema = z.object({
  provider: z.string().min(1),
  label: z.string().min(1),
  keyValue: z.string().default(""),
  isActive: z.string().default("true"),
  notes: z.string().default(""),
});
export type InsertApiConfig = z.infer<typeof insertApiConfigSchema>;
