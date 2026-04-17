import { integer, pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const shopkeeperMedicinesTable = pgTable("shopkeeper_medicines", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shopkeeperId: integer("shopkeeper_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  price: doublePrecision("price").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  unit: text("unit").notNull().default("strip"),
  description: text("description").notNull().default(""),
  manufacturer: text("manufacturer").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShopkeeperMedicine = typeof shopkeeperMedicinesTable.$inferSelect;
