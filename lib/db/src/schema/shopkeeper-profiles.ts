import { boolean, doublePrecision, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const shopkeeperProfilesTable = pgTable("shopkeeper_profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shopkeeperId: integer("shopkeeper_id").notNull().unique(),
  shopName: text("shop_name").notNull().default(""),
  shopAddress: text("shop_address").notNull().default(""),
  shopPhone: text("shop_phone").notNull().default(""),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  city: text("city").notNull().default(""),
  pincode: text("pincode").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShopkeeperProfile = typeof shopkeeperProfilesTable.$inferSelect;
