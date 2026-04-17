import { useEffect, useState } from "react";
import { CalendarCheck, Video, Building2, Loader2, RefreshCw } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface AptRow {
  appointment: {
    id: number; patientName: string; phone: string; date: string; timeSlot: string;
    consultationType: string; status: string; amountPaid: number; meetingLink: string;
    healthIssue: string; createdAt: string;
  };
  doctor: { id: number; name: string; specialization: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function AppointmentsAdminPage() {
  const [apts, setApts] = useState<AptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function loadApts() {
    setLoading(true);
    try {
      const token = localStorage.getItem("mq_admin_token") ?? "";
      const r = await fetch(apiUrl("/doctors/admin/appointments"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setApts(await r.json());
    } catch { }
    setLoading(false);
  }

  useEffect(() => { loadApts(); }, []);

  const filtered = filter === "all" ? apts : apts.filter(a => a.appointment.status === filter);
  const revenue = apts.filter(a => a.appointment.status === "confirmed").reduce((s, a) => s + a.appointment.amountPaid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-primary" /> Appointments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">View and manage all doctor appointments</p>
        </div>
        <button onClick={loadApts} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm hover:bg-secondary/80">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: apts.length, color: "text-primary" },
          { label: "Confirmed", value: apts.filter(a => a.appointment.status === "confirmed").length, color: "text-emerald-500" },
          { label: "Pending", value: apts.filter(a => a.appointment.status === "pending").length, color: "text-amber-500" },
          { label: "Revenue", value: `₹${revenue.toLocaleString()}`, color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "confirmed", "pending", "completed", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck className="w-12 h-12 text-primary/20 mx-auto mb-3" />
          <p className="text-muted-foreground">No appointments found</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-secondary/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">PATIENT</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">DOCTOR</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">DATE & TIME</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">TYPE</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">AMOUNT</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ appointment: apt, doctor }) => (
                  <tr key={apt.id} className="border-b border-card-border/40 hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">#{apt.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{apt.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{doctor?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{doctor?.specialization ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{apt.date}</p>
                      <p className="text-xs text-muted-foreground">{apt.timeSlot}</p>
                    </td>
                    <td className="px-4 py-3">
                      {apt.consultationType === "video" ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          <Video className="w-3 h-3" /> Video
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          <Building2 className="w-3 h-3" /> Clinic
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">₹{apt.amountPaid}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[apt.status] ?? ""}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
