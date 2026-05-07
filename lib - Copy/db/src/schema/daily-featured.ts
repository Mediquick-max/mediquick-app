import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const dailyFeaturedTable = pgTable("daily_featured", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(),
  entityId: integer("entity_id").notNull(),
  featuredDate: text("featured_date").notNull(),
  feeDeducted: integer("fee_deducted").notNull().default(499),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
