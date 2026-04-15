import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const remindersTable = pgTable("reminders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  medicineName: text("medicine_name").notNull(),
  time: text("time").notNull(),
  taken: boolean("taken").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReminderSchema = z.object({
  medicineName: z.string().min(1),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  taken: z.boolean().optional(),
});

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof remindersTable.$inferSelect;