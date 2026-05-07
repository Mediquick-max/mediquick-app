import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const labCentersTable = pgTable("lab_centers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull().default(""),
  centerType: text("center_type").notNull().default("diagnostic"),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  accreditation: text("accreditation").notNull().default(""),
  registrationNumber: text("registration_number").notNull().default(""),
  plan: text("plan").notNull().default("starter"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  paymentMethod: text("payment_method").notNull().default("upi"),
  upiId: text("upi_id").notNull().default(""),
  bankAccountHolder: text("bank_account_holder").notNull().default(""),
  bankAccountNumber: text("bank_account_number").notNull().default(""),
  bankIfscCode: text("bank_ifsc_code").notNull().default(""),
  bankName: text("bank_name").notNull().default(""),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
