import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  User, Calendar, FlaskConical, Heart, Crown, Star, ChevronRight,
  Loader2, AlertCircle, CheckCircle2, Clock, RefreshCw,
  Droplet, Baby, Shield, Pill, LogIn, IndianRupee, Sparkles,
  Activity, TrendingUp, Phone, MapPin, Edit3, Save, X,
  Video, BadgeCheck, Zap, Gift
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MediQuickLogo } from "@/components/logo";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  free:     { label: "Free",     color: "text-gray-600",   bg: "bg-gray-100",   border: "border-gray-200",   icon: Shield   },
  gold:     { label: "Gold",     color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-300",  icon: Crown    },
  platinum: { label: "Platinum", color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-300", icon: Sparkles },
  lifetime: { label: "Lifetime", color: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-400", icon: Zap     },
};

const STATUS_MAP: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  confirmed:  "bg-blue-100 text-blue-700",
  completed:  "bg-emerald-100 text-emerald-700",
  cancelled:  "bg-red-100 text-red-600",
  no_show:    "bg-gray-100 text-gray-500",
};

interface DashboardData {
  user: {
    id: number; name: string; email: string; phone: string; city: string;
    plan: string; currentPlan: string; isActiveMember: boolean;
    membershipExpiresAt: string | null;
    gender: string; dateOfBirth: string; bloodGroup: string; allergies: string;
  };
  consultations: any[];
  labBookings: any[];
  stats: { totalConsultations: number; totalLabTests: number; upcomingAppointments: number };
}

interface MembershipPlan {
  id: string; name: string; price: number; duration: number;
  color: string; benefits: string[];
}

export default function MyDashboardPage() {
  const { user, token } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "consultations" | "lab" | "health" | "plans">("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [healthEdit, setHealthEdit] = useState(false);
  const [healthForm, setHealthForm] = useState({ name: "", phone: "", city: "", gender: "", dateOfBirth: "", bloodGroup: "", allergies: "" });
  const [healthSaving, setHealthSaving] = useState(false);
  const [healthSaved, setHealthSaved] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dashRes, plansRes] = await Promise.all([
        fetch(`${API}/api/patient/dashboard`, { headers: authHeader(token) }),
        fetch(`${API}/api/patient/membership/plans`),
      ]);
      if (!dashRes.ok) throw new Error("Failed to load dashboard");
      const dashData = await dashRes.json();
      setData(dashData);
      setHealthForm({
        name: dashData.user.name || "",
        phone: dashData.user.phone || "",
        city: dashData.user.city || "",
        gender: dashData.user.gender || "",
        dateOfBirth: dashData.user.dateOfBirth || "",
        bloodGroup: dashData.user.bloodGroup || "",
        allergies: dashData.user.allergies || "",
      });
      if (plansRes.ok) {
        const pd = await plansRes.json();
        setPlans(pd.plans || []);
      }
    } catch (e: any) {
      setError(e.message || "Could not load dashboard");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (token) fetchData(); else setLoading(false); }, [token, fetchData]);

  const saveHealth = async () => {
    if (!token) return;
    setHealthSaving(true);
    try {
      const res = await fetch(`${API}/api/patient/profile`, {
        method: "PUT", headers: authHeader(token), body: JSON.stringify(healthForm),
      });
      if (!res.ok) throw new Error("Save failed");
      const d = await res.json();
      setData(prev => prev ? { ...prev, user: { ...prev.user, ...d.user } } : prev);
      setHealthEdit(false);
      setHealthSaved(true);
      setTimeout(() => setHealthSaved(false), 3000);
    } catch { setError("Could not save health profile"); }
    finally { setHealthSaving(false); }
  };

  const handleUpgrade = async (planId: string) => {
    if (!token) return;
    setUpgrading(planId);
    try {
      const res = await fetch(`${API}/api/patient/membership/upgrade`, {
        method: "POST", headers: authHeader(token), body: JSON.stringify({ plan: planId }),
      });
      const d = await res.json();
      if (d.code === "NO_RAZORPAY") {
        alert("Payment gateway abhi configure nahi hua. Admin se contact karein.");
        return;
      }
      if (!res.ok) throw new Error(d.error || "Failed");
      const options = {
        key: d.key, amount: d.order.amount, currency: "INR",
        name: "Medi Quick", description: `${d.plan.name} Membership`,
        order_id: d.order.id,
        handler: async (resp: any) => {
          const vRes = await fetch(`${API}/api/patient/membership/verify`, {
            method: "POST", headers: authHeader(token),
            body: JSON.stringify({ ...resp, plan: planId }),
          });
          const vd = await vRes.json();
          if (vRes.ok) { alert(vd.message || "Plan activated!"); fetchData(); }
          else alert(vd.error || "Verification failed");
        },
        theme: { color: "#d95f2b" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) { alert(e.message || "Upgrade failed"); }
    finally { setUpgrading(null); }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#fdf6ef] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-bold text-xl">Login karo</h2>
          <p className="text-muted-foreground text-sm">Dashboard dekhne ke liye pehle login karein</p>
          <Link href="/login" className="block w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold text-sm text-center">
            Login / Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const planCfg = PLAN_CONFIG[data?.user.currentPlan ?? "free"] ?? PLAN_CONFIG.free;

  const TABS = [
    { id: "overview",       label: "Overview",         icon: TrendingUp   },
    { id: "consultations",  label: "Consultations",    icon: Video        },
    { id: "lab",            label: "Lab Tests",        icon: FlaskConical },
    { id: "health",         label: "Health Profile",   icon: Heart        },
    { id: "plans",          label: "My Plan",          icon: Crown        },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-border/40 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MediQuickLogo className="w-7 h-7" />
            <div>
              <div className="font-bold text-sm leading-none">Medi Quick</div>
              <div className="text-xs text-primary font-semibold">My Dashboard</div>
            </div>
          </Link>
          {data && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold border ${planCfg.bg} ${planCfg.color} ${planCfg.border}`}>
                <planCfg.icon className="w-3 h-3" /> {planCfg.label}
              </div>
              <button onClick={fetchData} className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl border border-border">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="max-w-4xl mx-auto px-4 flex gap-0.5 pb-0.5 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
        {healthSaved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Health profile saved!
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : data ? (
          <>
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                      {data.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{data.user.name}</div>
                      <div className="text-white/80 text-xs">{data.user.email}</div>
                      {data.user.city && <div className="text-white/70 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{data.user.city}</div>}
                    </div>
                    <div className="ml-auto text-right">
                      <div className={`text-xs px-2.5 py-1 rounded-full font-bold bg-white/20 capitalize`}>
                        {data.user.currentPlan} plan
                      </div>
                      {data.user.membershipExpiresAt && data.user.isActiveMember && (
                        <div className="text-xs text-white/70 mt-1">
                          Expires {new Date(data.user.membershipExpiresAt).toLocaleDateString("en-IN")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Consultations", value: data.stats.totalConsultations, icon: Video, color: "blue" },
                    { label: "Lab Tests", value: data.stats.totalLabTests, icon: FlaskConical, color: "purple" },
                    { label: "Upcoming", value: data.stats.upcomingAppointments, icon: Clock, color: "amber" },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-3xl p-4 border border-border/50 shadow-sm text-center">
                      <div className={`w-9 h-9 rounded-2xl bg-${s.color}-100 flex items-center justify-center mx-auto mb-2`}>
                        <s.icon className={`w-4 h-4 text-${s.color}-600`} />
                      </div>
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>

                {data.consultations.filter(a => a.status === "confirmed" || a.status === "pending").length > 0 && (
                  <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> Upcoming Appointments
                    </h3>
                    <div className="space-y-2">
                      {data.consultations.filter(a => a.status === "confirmed" || a.status === "pending").slice(0, 3).map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(a.doctorName || "D").charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{a.doctorName || "Doctor"}</div>
                            <div className="text-xs text-muted-foreground">{a.date} at {a.timeSlot}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_MAP[a.status] ?? ""}`}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { href: "/consult", icon: Video, label: "Book Consultation", color: "blue" },
                    { href: "/lab-tests", icon: FlaskConical, label: "Book Lab Test", color: "purple" },
                    { href: "/medicine", icon: Pill, label: "Order Medicine", color: "emerald" },
                    { href: "/", icon: Activity, label: "Health Assistant", color: "rose" },
                  ].map(q => (
                    <Link key={q.href} href={q.href}
                      className={`flex items-center gap-2.5 bg-white border border-border/50 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all`}>
                      <div className={`w-9 h-9 rounded-2xl bg-${q.color}-100 flex items-center justify-center shrink-0`}>
                        <q.icon className={`w-4 h-4 text-${q.color}-600`} />
                      </div>
                      <span className="text-sm font-semibold">{q.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "consultations" && (
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border/40">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-600" /> Doctor Consultations
                    <span className="ml-auto text-xs font-normal text-muted-foreground">{data.consultations.length} total</span>
                  </h2>
                </div>
                {data.consultations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Koi consultation nahi hua abhi tak
                    <div className="mt-3">
                      <Link href="/consult" className="text-primary font-semibold text-sm">Doctor se consult karein →</Link>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {data.consultations.map(a => (
                      <div key={a.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                              {(a.doctorName || "D").charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{a.doctorName || "Doctor"}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {a.date} at {a.timeSlot}
                              </div>
                              <div className="text-xs text-muted-foreground">{a.consultationType} • {a.healthIssue || "General"}</div>
                              {a.amountPaid > 0 && <div className="text-xs text-emerald-600 font-semibold mt-1">₹{a.amountPaid} paid</div>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_MAP[a.status] ?? "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                            {a.meetingLink && a.status === "confirmed" && (
                              <a href={a.meetingLink} target="_blank" rel="noopener noreferrer"
                                className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                                <Video className="w-3 h-3" /> Join
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "lab" && (
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border/40">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-600" /> Lab Test Bookings
                    <span className="ml-auto text-xs font-normal text-muted-foreground">{data.labBookings.length} total</span>
                  </h2>
                </div>
                {data.labBookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Koi lab test book nahi hua
                    <div className="mt-3">
                      <Link href="/lab-tests" className="text-primary font-semibold text-sm">Lab test book karein →</Link>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {data.labBookings.map(b => (
                      <div key={b.id} className="p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <FlaskConical className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{b.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{b.dateSlot}</div>
                          {b.address && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{b.address}</div>}
                          {b.notes && <div className="text-xs text-muted-foreground">{b.notes}</div>}
                          {b.amount > 0 && <div className="text-xs text-emerald-600 font-semibold mt-1">₹{b.amount}</div>}
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold shrink-0">{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "health" && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" /> Health Profile
                    </h2>
                    {!healthEdit ? (
                      <button onClick={() => setHealthEdit(true)}
                        className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-xl font-semibold hover:bg-primary/5">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setHealthEdit(false)} className="text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-xl">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={saveHealth} disabled={healthSaving}
                          className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-xl font-semibold disabled:opacity-60">
                          {healthSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", key: "name", icon: User, placeholder: "Your name" },
                      { label: "Phone", key: "phone", icon: Phone, placeholder: "Mobile number" },
                      { label: "City", key: "city", icon: MapPin, placeholder: "Your city" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                          <f.icon className="w-3 h-3" /> {f.label}
                        </label>
                        {healthEdit ? (
                          <input value={(healthForm as any)[f.key]} onChange={e => setHealthForm(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        ) : (
                          <div className="px-3 py-2.5 rounded-2xl bg-secondary/30 text-sm font-medium">
                            {(data.user as any)[f.key] || <span className="text-muted-foreground">Not set</span>}
                          </div>
                        )}
                      </div>
                    ))}

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Baby className="w-3 h-3" /> Gender
                      </label>
                      {healthEdit ? (
                        <select value={healthForm.gender} onChange={e => setHealthForm(p => ({ ...p, gender: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <div className="px-3 py-2.5 rounded-2xl bg-secondary/30 text-sm font-medium capitalize">
                          {data.user.gender || <span className="text-muted-foreground">Not set</span>}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date of Birth
                      </label>
                      {healthEdit ? (
                        <input type="date" value={healthForm.dateOfBirth} onChange={e => setHealthForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      ) : (
                        <div className="px-3 py-2.5 rounded-2xl bg-secondary/30 text-sm font-medium">
                          {data.user.dateOfBirth || <span className="text-muted-foreground">Not set</span>}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Droplet className="w-3 h-3" /> Blood Group
                      </label>
                      {healthEdit ? (
                        <select value={healthForm.bloodGroup} onChange={e => setHealthForm(p => ({ ...p, bloodGroup: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="">Select</option>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-3 py-2.5 rounded-2xl bg-secondary/30 text-sm font-medium">
                          {data.user.bloodGroup ? (
                            <span className="text-red-600 font-bold">{data.user.bloodGroup}</span>
                          ) : <span className="text-muted-foreground">Not set</span>}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Allergies / Medical Conditions
                      </label>
                      {healthEdit ? (
                        <textarea value={healthForm.allergies} onChange={e => setHealthForm(p => ({ ...p, allergies: e.target.value }))}
                          placeholder="e.g. Penicillin allergy, Diabetes, Hypertension..."
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                      ) : (
                        <div className="px-3 py-2.5 rounded-2xl bg-secondary/30 text-sm font-medium">
                          {data.user.allergies || <span className="text-muted-foreground">None recorded</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "plans" && (
              <div className="space-y-4">
                <div className={`rounded-3xl p-5 border-2 ${planCfg.border} ${planCfg.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${planCfg.bg} border ${planCfg.border}`}>
                      <planCfg.icon className={`w-6 h-6 ${planCfg.color}`} />
                    </div>
                    <div>
                      <div className={`font-bold text-lg ${planCfg.color}`}>
                        {planCfg.label} Plan — Currently Active
                      </div>
                      {data.user.isActiveMember && data.user.membershipExpiresAt && (
                        <div className="text-xs text-muted-foreground">
                          Expires: {new Date(data.user.membershipExpiresAt).toLocaleDateString("en-IN")}
                        </div>
                      )}
                      {!data.user.isActiveMember && (
                        <div className="text-xs text-muted-foreground">Upgrade karke premium benefits lo</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {plans.map(plan => {
                    const isCurrent = data.user.currentPlan === plan.id;
                    const GRADIENT: Record<string, string> = {
                      free:     "linear-gradient(to right, #9ca3af, #4b5563)",
                      gold:     "linear-gradient(to right, #f59e0b, #ca8a04)",
                      platinum: "linear-gradient(to right, #a855f7, #7c3aed)",
                      lifetime: "linear-gradient(to right, #10b981, #0d9488)",
                    };
                    return (
                      <div key={plan.id} className={`bg-white rounded-3xl border-2 overflow-hidden shadow-sm ${isCurrent ? "border-primary" : "border-border/50"}`}>
                        <div style={{ background: GRADIENT[plan.id] ?? GRADIENT.free }} className="p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-lg flex items-center gap-2">
                                {plan.name}
                                {isCurrent && <BadgeCheck className="w-5 h-5" />}
                              </div>
                              <div className="text-white/80 text-sm">
                                {plan.price === 0 ? "Free forever" : `₹${plan.price}${(plan as any).tag ? " · " + (plan as any).tag : "/month"}`}
                              </div>
                            </div>
                            {isCurrent ? (
                              <span className={`text-xs px-3 py-1.5 rounded-full font-bold bg-white/20`}>Current Plan</span>
                            ) : plan.price > 0 ? (
                              <button onClick={() => handleUpgrade(plan.id)} disabled={upgrading === plan.id}
                                className="text-xs bg-white text-gray-800 px-4 py-2 rounded-2xl font-bold hover:bg-white/90 transition-all flex items-center gap-1.5 disabled:opacity-60">
                                {upgrading === plan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                Upgrade
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            {plan.benefits.map((b, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>{b}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-3xl p-4 flex items-start gap-3">
                  <Gift className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-orange-700">
                    <div className="font-bold text-sm mb-1">Razorpay Payment Gateway</div>
                    Payment gateway configure hone ke baad upgrade button kaam karega. Admin se contact karein setup ke liye.
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
