import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Sparkles, Stethoscope, FlaskConical, RefreshCw, Loader2, IndianRupee, Calendar, TrendingUp } from "lucide-react";

interface FeaturedSpot {
  id: number; type: string; entityId: number; featuredDate: string;
  feeDeducted: number; createdAt: string;
  entityName: string; entityDetail: string;
}

interface DateGroup {
  date: string; doctorCount: number; labCount: number; revenue: number;
  spots: FeaturedSpot[];
}

interface FeaturedData {
  spots: FeaturedSpot[];
  byDate: DateGroup[];
}

export default function FeaturedAdminPage() {
  const [data, setData] = useState<FeaturedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setData(await apiGet<FeaturedData>("/admin/featured")); }
    catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const totalRevenue = data?.byDate.reduce((sum, d) => sum + d.revenue, 0) ?? 0;
  const totalSpots = data?.spots.length ?? 0;
  const totalDays = data?.byDate.length ?? 0;

  function fmt(n: number) {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  }

  function fmtDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Featured Spots</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Daily featured spots — doctors aur labs ka revenue track karein</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-2 border border-border rounded-xl transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: IndianRupee, label: "Total Revenue", value: fmt(totalRevenue), color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Sparkles,    label: "Total Spots",   value: totalSpots,         color: "text-amber-600",  bg: "bg-amber-50" },
          { icon: Calendar,    label: "Days Active",   value: totalDays,          color: "text-blue-600",   bg: "bg-blue-50" },
          { icon: TrendingUp,  label: "Avg/Day",       value: totalDays > 0 ? fmt(Math.round(totalRevenue / totalDays)) : "₹0", color: "text-violet-600", bg: "bg-violet-50" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !data || data.byDate.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Koi featured spots nahi hain abhi tak</p>
          <p className="text-sm mt-1">Jab doctors ya lab centers featured spot lein, woh yahan dikhega</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.byDate.map(group => (
            <div key={group.date} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedDate(expandedDate === group.date ? null : group.date)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{fmtDate(group.date)}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                        <Stethoscope className="w-3 h-3" /> {group.doctorCount} doctors
                      </span>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <FlaskConical className="w-3 h-3" /> {group.labCount} labs
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-emerald-600 text-lg">₹{group.revenue}</div>
                  <div className="text-xs text-muted-foreground">{group.spots.length} spots</div>
                </div>
              </button>

              {expandedDate === group.date && (
                <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                  {group.spots.map(spot => (
                    <div key={spot.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${spot.type === "doctor" ? "bg-blue-100" : "bg-emerald-100"}`}>
                          {spot.type === "doctor"
                            ? <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                            : <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{spot.entityName}</div>
                          <div className="text-xs text-muted-foreground">{spot.entityDetail} • {spot.type === "doctor" ? "Doctor" : "Lab Center"}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-emerald-600">₹{spot.feeDeducted}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(spot.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
