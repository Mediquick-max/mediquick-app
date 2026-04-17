import { integer, pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const appointmentsTable = pgTable("appointments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id"),
  doctorId: integer("doctor_id").notNull(),
  patientName: text("patient_name").notNull(),
  phone: text("phone").notNull(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  healthIssue: text("health_issue").notNull().default(""),
  consultationType: text("consultation_type").notNull().default("video"),
  status: text("status").notNull().default("pending"),
  meetingLink: text("meeting_link").notNull().default(""),
  razorpayOrderId: text("razorpay_order_id").notNull().default(""),
  razorpayPaymentId: text("razorpay_payment_id").notNull().default(""),
  amountPaid: doublePrecision("amount_paid").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Appointment = typeof appointmentsTable.$inferSelect;
