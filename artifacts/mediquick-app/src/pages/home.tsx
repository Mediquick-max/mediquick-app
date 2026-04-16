import { useGetReminderSummary } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RemindersList } from "@/components/reminders-list";
import { CreateReminderDialog } from "@/components/create-reminder-dialog";
import { PharmacySearch } from "@/components/pharmacy-search";
import { CareServices } from "@/components/care-services";
import { MedicalAiAssistant } from "@/components/medical-ai-assistant";
import { Bot, CheckCircle2, HeartPulse, ShieldCheck } from "lucide-react";

export default function Home() {
  const { data: summary } = useGetReminderSummary();

  const progress = summary && summary.dueToday > 0 
    ? Math.round((summary.takenToday / summary.dueToday) * 100) 
    : 100;

  return (
    <Layout>
      <div className="space-y-10 pb-12">
        <section className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mb-2">
            <ShieldCheck className="w-4 h-4" />
            One app for daily healthcare
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Book doctors, tests, medicines and reminders.
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Medi Quick helps you manage care quickly from one simple dashboard.
          </p>
        </section>

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

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              AI Health Chat
            </h2>
            <p className="text-muted-foreground font-medium mt-1">Ask health questions, check symptoms, and get emergency guidance.</p>
          </div>
          <MedicalAiAssistant />
        </section>

        <hr className="border-border/60" />

        <section className="space-y-6">
          <div id="care-services" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-primary" />
              Healthcare Services
            </h2>
            <p className="text-muted-foreground font-medium mt-1">Book doctor consults, lab tests, and medicine delivery requests.</p>
          </div>
          <CareServices />
        </section>

        <hr className="border-border/60" />

        <section id="schedule" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Your Schedule</h2>
            <CreateReminderDialog />
          </div>
          <RemindersList />
        </section>

        <hr className="border-border/60" />

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
