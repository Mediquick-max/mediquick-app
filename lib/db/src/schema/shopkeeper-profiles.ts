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
  paymentMethod: text("payment_method").notNull().default("upi"),
  upiId: text("upi_id").notNull().default(""),
  bankAccountHolder: text("bank_account_holder").notNull().default(""),
  bankAccountNumber: text("bank_account_number").notNull().default(""),
  bankIfscCode: text("bank_ifsc_code").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShopkeeperProfile = typeof shopkeeperProfilesTable.$inferSelect;
