import { schedule } from "node-cron";
import { db, doctorsTable, labCentersTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./lib/logger";

function getISTDateString(): string {
  const now = new Date();
  const istMs = now.getTime() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split("T")[0];
}

export async function sendFeaturedNotifications(): Promise<void> {
  const slotDate = getISTDateString();
  logger.info({ slotDate }, "Sending daily featured slot notifications");

  try {
    const existing = await db
      .select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.slotDate, slotDate),
          eq(notificationsTable.type, "doctor")
        )
      );

    if (existing.length > 0) {
      logger.info({ slotDate }, "Notifications already sent for today, skipping");
      return;
    }

    const doctors = await db.select().from(doctorsTable);
    const labs = await db.select().from(labCentersTable);

    const docNotifs = doctors.map((doc) => ({
      type: "doctor" as const,
      entityId: doc.id,
      title: "⭐ Aaj Ka Featured Spot Available!",
      message: `Dr. ${doc.name}, aaj home page par featured hone ka mauka hai! Sirf 5 spots hain — abhi join karo (₹499). Slot 9 AM tak band ho jayega.`,
      slotDate,
    }));

    const labNotifs = labs.map((lab) => ({
      type: "lab" as const,
      entityId: lab.id,
      title: "⭐ Aaj Ka Featured Spot Available!",
      message: `${lab.name}, aaj home page par featured hone ka mauka hai! Sirf 5 lab spots hain — abhi join karo (₹499). Slot 9 AM tak band ho jayega.`,
      slotDate,
    }));

    const allNotifs = [...docNotifs, ...labNotifs];

    if (allNotifs.length > 0) {
      await db.insert(notificationsTable).values(allNotifs);
      logger.info(
        { doctors: docNotifs.length, labs: labNotifs.length },
        "Daily featured notifications sent"
      );
    }
  } catch (err) {
    logger.error({ err }, "Failed to send featured notifications");
  }
}

export function startScheduler(): void {
  // Cron: 1:30 AM UTC = 7:00 AM IST, every day
  schedule("30 1 * * *", async () => {
    logger.info("Cron triggered: sending featured slot notifications (7 AM IST)");
    await sendFeaturedNotifications();
  });

  // On startup: if it's already past 7 AM IST and notifications haven't been sent yet
  const now = new Date();
  const istHour = Math.floor((now.getTime() + 5.5 * 60 * 60 * 1000) / (60 * 60 * 1000)) % 24;

  if (istHour >= 7) {
    sendFeaturedNotifications().catch((err) =>
      logger.error({ err }, "Startup notification check failed")
    );
  }

  logger.info("Scheduler started — daily featured notifications at 7 AM IST");
}
