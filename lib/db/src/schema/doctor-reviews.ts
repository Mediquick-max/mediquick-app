import { integer, pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const doctorReviewsTable = pgTable("doctor_reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  doctorId: integer("doctor_id").notNull(),
  userId: integer("user_id"),
  reviewerName: text("reviewer_name").notNull(),
  rating: doublePrecision("rating").notNull().default(5),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DoctorReview = typeof doctorReviewsTable.$inferSelect;
