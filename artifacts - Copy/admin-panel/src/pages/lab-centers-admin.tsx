import { useEffect, useState } from "react";
import { apiGet, apiUrl } from "@/lib/api";
import {
  FlaskConical, RefreshCw, CheckCircle2, XCircle,
  Loader2, Trash2, Mail, Phone, MapPin, Building2,
  Crown, Shield, Star, Zap, BadgeCheck
} from "lucide-react";

interface LabCenter {
  id: number; name: string; email: string; phone: string;
  centerType: string; city: string; address: string;
  accreditation: string; registrationNumber: string;
  plan: string; planExpiresAt: string | null;
  isActive: number; createdAt: string;
}

const PLAN_STYLES: Record<string, { label: string; color: string; icon: any }> = {
  starter:    { label: "Starter",    color: "bg-gray-100 text-gray-700",     icon: Shield },
  growth:     { label: "Growth",     color: "bg-blue-100 text-blue-700",      icon: Star },
  enterprise: { label: "Enterprise", color: "bg-purple-100 text-purple-700",  icon: Crown },
};

function PlanBadge({ plan }: { plan: string }) {
  const cfg = PLAN_STYLES[plan] ?? { label: plan, color: "bg-gray-100 text-gray-600", icon: Shield };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

const adminToken = () => localStorage.getItem("mq_admin_token") ?? "";

export default function LabCentersAdminPage() {
  const [labs, setLabs] = useState<LabCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function load() {
    setLoading(true);
    try { setLabs(await apiGet<LabCenter[]>("/admin/lab-centers")); }
    catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(lab: LabCenter) {
    const newStatus = lab.isActive === 1 ? 0 : 1;
    await fetch(apiUrl(`/admin/lab-centers/${lab.id}/status`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken()}` },
      body: JSON.stringify({ isActive: newStatus === 1 }),
    });
    setLabs(prev => prev.map(l => l.id === lab.id ? { ...l, isActive: newStatus } : l));
    showToast(newStatus === 1 ? "Lab Center activated" : "Lab Center deactivated");
  }

  async function deleteLab(id: number) {
    await fetch(apiUrl(`/admin/lab-centers/${id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken()}` },
    });
    setLabs(prev => prev.filter(l => l.id !== id));
    setDeleteId(null);
    showToast("Lab Center deleted");
  }

  const filtered = labs.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" && l.isActive === 1) || (filter === "inactive" && l.isActive === 0);
    return matchSearch && matchFilter;
  });

  const activeCount = labs.filter(l => l.isActive === 1).length;
  const inactiveCount = labs.filter(l => l.isActive === 0).length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lab Centers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registered lab centers aur diagnostic centers manage karein</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-2 border border-border rounded-xl transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: labs.length, color: "text-foreground" },
          { label: "Active", value: activeCount, color: "text-emerald-600" },
          { label: "Inactive", value: inactiveCount, color: "text-red-500" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, city..."
          className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>
              {f === "all" ? "Sab" : f === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Koi lab center nahi mila</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lab => (
            <div key={lab.id} className={`bg-card border rounded-2xl p-4 transition-colors ${
              lab.isActive === 0 ? "border-border opacity-60" : "border-border"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FlaskConical className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground truncate">{lab.name}</span>
                      <PlanBadge plan={lab.plan} />
                      {lab.isActive === 1 ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                          <BadgeCheck className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="w-3 h-3" /> {lab.centerType}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {lab.city || "—"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" /> {lab.email}
                      </span>
                      {lab.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {lab.phone}
                        </span>
                      )}
                    </div>
                    {(lab.accreditation || lab.registrationNumber) && (
                      <div className="flex flex-wrap gap-x-4 mt-1">
                        {lab.accreditation && (
                          <span className="text-xs text-muted-foreground">Accreditation: <span className="font-medium">{lab.accreditation}</span></span>
                        )}
                        {lab.registrationNumber && (
                          <span className="text-xs text-muted-foreground">Reg#: <span className="font-medium">{lab.registrationNumber}</span></span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Registered: {new Date(lab.createdAt).toLocaleDateString("en-IN")}
                      {lab.planExpiresAt && ` • Plan expires: ${new Date(lab.planExpiresAt).toLocaleDateString("en-IN")}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleStatus(lab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      lab.isActive === 1
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}>
                    {lab.isActive === 1 ? <><XCircle className="w-3.5 h-3.5" /> Deactivate</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Activate</>}
                  </button>
                  <button onClick={() => setDeleteId(lab.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg text-foreground mb-2">Lab Center Delete karein?</h3>
            <p className="text-sm text-muted-foreground mb-5">Ye action undo nahi ho sakta. Lab center ka sara data hamesha ke liye delete ho jayega.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-secondary/40 transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteLab(deleteId)}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
