import { Router, type IRouter } from "express";
import { asc, count, eq } from "drizzle-orm";
import { db, remindersTable } from "@workspace/db";
import {
  CreateReminderBody,
  DeleteReminderParams,
  GetReminderSummaryResponse,
  ListRemindersResponse,
  ListTodayRemindersResponse,
  MarkReminderTakenBody,
  MarkReminderTakenParams,
  MarkReminderTakenResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reminders", async (_req, res): Promise<void> => {
  const reminders = await db.select().from(remindersTable).orderBy(asc(remindersTable.time));
  res.json(ListRemindersResponse.parse(reminders));
});

router.post("/reminders", async (req, res): Promise<void> => {
  const parsed = CreateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid reminder create body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reminder] = await db
    .insert(remindersTable)
    .values({
      medicineName: parsed.data.medicineName.trim(),
      time: parsed.data.time,
    })
    .returning();

  res.status(201).json(MarkReminderTakenResponse.parse(reminder));
});

router.get("/reminders/today", async (_req, res): Promise<void> => {
  const reminders = await db.select().from(remindersTable).orderBy(asc(remindersTable.time));
  res.json(ListTodayRemindersResponse.parse(reminders));
});

router.get("/reminders/summary", async (_req, res): Promise<void> => {
  const [totalRow] = await db.select({ value: count() }).from(remindersTable);
  const [takenRow] = await db
    .select({ value: count() })
    .from(remindersTable)
    .where(eq(remindersTable.taken, true));
  const reminders = await db.select().from(remindersTable).orderBy(asc(remindersTable.time));
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const nextReminder = reminders.find((reminder) => !reminder.taken && reminder.time >= currentTime) ?? reminders.find((reminder) => !reminder.taken) ?? null;

  res.json(
    GetReminderSummaryResponse.parse({
      total: totalRow?.value ?? 0,
      dueToday: reminders.length,
      takenToday: takenRow?.value ?? 0,
      nextReminder,
    }),
  );
});

router.patch("/reminders/:id/taken", async (req, res): Promise<void> => {
  const params = MarkReminderTakenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = MarkReminderTakenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reminder] = await db
    .update(remindersTable)
    .set({ taken: parsed.data.taken, updatedAt: new Date() })
    .where(eq(remindersTable.id, params.data.id))
    .returning();

  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }

  res.json(MarkReminderTakenResponse.parse(reminder));
});

router.delete("/reminders/:id", async (req, res): Promise<void> => {
  const params = DeleteReminderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reminder] = await db.delete(remindersTable).where(eq(remindersTable.id, params.data.id)).returning();
  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;