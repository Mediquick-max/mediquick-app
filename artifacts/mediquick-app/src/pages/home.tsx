import { useGetReminderSummary } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RemindersList } from "@/components/reminders-list";
import { CreateReminderDialog } from "@/components/create-reminder-dialog";
import { PharmacySearch } from "@/components/pharmacy-search";
import { CheckCircle2, Clock } from "lucide-react";

export default function Home() {
  const { data: summary } = useGetReminderSummary();

  const progress = summary && summary.dueToday > 0 
    ? Math.round((summary.takenToday / summary.dueToday) * 100) 
    : 100;

  return (
    <Layout>
      <div className="space-y-10 pb-12">
        {/* Header Section */}
        <section className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Good day.
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Here is your medicine schedule for today.
          </p>
        </section>

        {/* Summary Card */}
        {summary && summary.dueToday > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Today's Progress
                </h2>
                <span className="font-bold text-primary">{progress}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-3 text-sm text-muted-foreground font-medium">
                <span>{summary.takenToday} taken</span>
                <span>{summary.dueToday - summary.takenToday} remaining</span>
              </div>
            </div>
          </section>
        )}

        {/* Reminders Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Your Schedule</h2>
            <CreateReminderDialog />
          </div>
          <RemindersList />
        </section>

        <hr className="border-border/60" />

        {/* Pharmacy Search Section */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Find Medicine Nearby</h2>
            <p className="text-muted-foreground font-medium">Search for pharmacies near you that carry what you need.</p>
          </div>
          <PharmacySearch />
        </section>
      </div>
    </Layout>
  );
}
