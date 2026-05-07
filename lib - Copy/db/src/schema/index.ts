// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

export * from "./reminders";
export * from "./care";
export * from "./conversations";
export * from "./messages";
export * from "./app-users";
export * from "./subscriptions";
export * from "./payments";
export * from "./api-config";
export * from "./shopkeeper-medicines";
export * from "./shopkeeper-subscriptions";
export * from "./doctors";
export * from "./appointments";
export * from "./doctor-reviews";
export * from "./medicine-orders";
export * from "./lab-centers";
export * from "./daily-featured";
export * from "./notifications";
export * from "./shopkeeper-profiles";
export * from "./local-medicine-orders";