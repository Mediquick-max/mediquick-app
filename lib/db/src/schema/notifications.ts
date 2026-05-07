import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const notificationsTable = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(),
  entityId: integer("entity_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read").notNull().default(0),
  slotDate: text("slot_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
