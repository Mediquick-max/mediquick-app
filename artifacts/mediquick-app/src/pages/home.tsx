import { useGetReminderSummary } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RemindersList } from "@/components/reminders-list";
import { CreateReminderDialog } from "@/components/create-reminder-dialog";
import { PharmacySearch } from "@/components/pharmacy-search";
import { CareServices } from "@/components/care-services";
import { MedicalAiAssistant } from "@/components/medical-ai-assistant";
import { Bot, CheckCircle2, HeartPulse, ShieldCheck, Stethoscope, ChevronRight, Pill, MapPin, LocateFixed, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useGeolocation } from "@/lib/use-geolocation";

export default function Home() {
  const { data: summary } = useGetReminderSummary();
  const geo = useGeolocation();

  const progress = summary && summary.dueToday > 0 
    ? Math.round((summary.takenToday / summary.dueToday) * 100) 
    : 100;

  return (
    <Layout>
      <div className="space-y-10 pb-12">
        <section className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {geo.location ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              Delivering to {geo.location.displayName}
            </div>
          ) : geo.loading ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-muted-foreground mb-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Detecting your location...
            </div>
          ) : (
            <button onClick={geo.detectLocation}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary mb-2 hover:bg-primary/20 transition-colors">
              <LocateFixed className="w-3.5 h-3.5" />
              {geo.permissionDenied ? "One app for daily healthcare" : "Tap to detect your location"}
            </button>
          )}
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

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Quick Access</h2>
            <p className="text-muted-foreground font-medium mt-1">All healthcare services in one place</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/consult" className="block group">
              <div className="bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-5 text-white flex flex-col gap-3 hover:shadow-xl transition-all hover:scale-[1.02] h-full">
                <div className="flex items-center justify-between">
                  <div className="bg-white/20 rounded-2xl p-2.5">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-snug">Consult a Doctor</p>
                  <p className="text-sm text-white/80 mt-0.5">Video & clinic · ₹399 onwards</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {["⭐ 4.9 rated", "8 Specialists", "Video + Clinic"].map(t => (
                    <span key={t} className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
            <Link href="/medicine" className="block group">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white flex flex-col gap-3 hover:shadow-xl transition-all hover:scale-[1.02] h-full">
                <div className="flex items-center justify-between">
                  <div className="bg-white/20 rounded-2xl p-2.5">
                    <Pill className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-snug">Order Medicines</p>
                  <p className="text-sm text-white/80 mt-0.5">Delivered in 4-6 hours</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {["🚚 Free Delivery", "20+ Categories", "Cash on Delivery"].map(t => (
                    <span key={t} className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          </div>
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
