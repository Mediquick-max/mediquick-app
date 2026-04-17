import { integer, pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const doctorsTable = pgTable("doctors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  experienceYears: integer("experience_years").notNull().default(0),
  rating: doublePrecision("rating").notNull().default(4.5),
  totalReviews: integer("total_reviews").notNull().default(0),
  fee: integer("fee").notNull().default(499),
  consultationType: text("consultation_type").notNull().default("both"),
  bio: text("bio").notNull().default(""),
  qualifications: text("qualifications").notNull().default(""),
  languages: text("languages").notNull().default("Hindi, English"),
  city: text("city").notNull().default("Mumbai"),
  imageUrl: text("image_url").notNull().default(""),
  availableSlots: text("available_slots").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Doctor = typeof doctorsTable.$inferSelect;
