import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  FlaskConical, User, Lock, Mail, Phone, MapPin, Building,
  CheckCircle2, Loader2, LogOut, Edit3, Save, Eye, EyeOff,
  TrendingUp, AlertCircle, RefreshCw, IndianRupee, BadgeCheck,
  ClipboardList, X, Wallet, ShieldCheck, Crown, Star, Sparkles,
  Shield, ArrowRight, Calendar, Activity, Zap, Bell, BellRing,
  Landmark, CreditCard,
} from "lucide-react";
import { MediQuickLogo } from "@/components/logo";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const CENTER_TYPES = ["Diagnostic Center", "Pathology Lab", "Radiology Center", "Multi-Specialty Lab", "Other"];

const GRAD: Record<string, string> = {
  starter:    "linear-gradient(135deg, #9ca3af, #4b5563)",
  growth:     "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  enterprise: "linear-gradient(135deg, #a855f7, #7c3aed)",
};
const PLAN_ICON: Record<string, any> = { starter: Shield, growth: Star, enterprise: Sparkles };

const STATUS_COLORS: Record<string, string> = {
  Confirmed:  "bg-amber-100 text-amber-700",
  Processing: "bg-blue-100 text-blue-700",
  Completed:  "bg-emerald-100 text-emerald-700",
  Cancelled:  "bg-red-100 text-red-600",
};

interface LabProfile {
  id: number; name: string; email: string; phone: string;
  centerType: string; city: string; address: string;
  accreditation: string; registrationNumber: string;
  plan: string; planExpiresAt: string | null;
  paymentMethod: string; upiId: string;
  bankAccountHolder: string; bankAccountNumber: string;
  bankIfscCode: string; bankName: string;
}
interface Booking {
  id: number; title: string; patientName: string; phone: string;
  mode: string; dateSlot: string; status: string; amount: number;
  address: string; notes: string; createdAt: string;
}

export default function LabCenterPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mq_lab_token"));
  const [lab, setLab] = useState<LabProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "bookings" | "payments" | "plans">("dashboard");
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [dashLoading, setDashLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, revenue: 0 });
  const [featuredStatus, setFeaturedStatus] = useState<{ isFeatured: boolean; spotsLeft: number; windowOpen: boolean; istHour: number; nextSlotTime: string } | null>(null);
  const [featuredJoining, setFeaturedJoining] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<LabProfile>>({});

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    name: "", email: "", password: "", phone: "",
    centerType: "Diagnostic Center", city: "", address: "",
    accreditation: "", registrationNumber: "",
  });

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`, "Content-Type": "application/json",
  }), [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/notifications/lab`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setNotifications(d.notifications ?? []); setUnreadCount(d.unread ?? 0); }
    } catch {}
  }, [token, authHeaders]);

  const markAllRead = async () => {
    try {
      await fetch(`${API}/api/notifications/lab/read-all`, { method: "PUT", headers: authHeaders() });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch {}
  };

  const fetchFeaturedStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/featured/lab/status`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setFeaturedStatus(d); }
    } catch {}
  }, [token, authHeaders]);

  const handleJoinFeatured = async () => {
    setFeaturedJoining(true);
    try {
      const res = await fetch(`${API}/api/featured/lab/join`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Join failed"); }
      else { alert(data.message); fetchFeaturedStatus(); }
    } catch { alert("Network error. Please try again."); }
    finally { setFeaturedJoining(false); }
  };

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setDashLoading(true);
    try {
      const res = await fetch(`${API}/api/lab-center/dashboard`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) { setLab(data.lab); setStats(data.stats); }
    } catch {} finally { setDashLoading(false); }
  }, [token, authHeaders]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setBookingsLoading(true);
    try {
      const res = await fetch(`${API}/api/lab-center/bookings`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setBookings(data.bookings ?? []);
    } catch {} finally { setBookingsLoading(false); }
  }, [token, authHeaders]);

  useEffect(() => {
    if (token) { fetchDashboard(); fetchBookings(); fetchFeaturedStatus(); fetchNotifications(); }
  }, [token]);

  useEffect(() => {
    if (activeTab === "plans" && plans.length === 0) {
      setPlansLoading(true);
      fetch(`${API}/api/lab-center/plans`)
        .then(r => r.json())
        .then(d => setPlans(d.plans ?? []))
        .catch(() => {})
        .finally(() => setPlansLoading(false));
    }
    if (activeTab === "bookings") fetchBookings();
  }, [activeTab]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/lab-center/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      localStorage.setItem("mq_lab_token", data.token);
      setToken(data.token); setLab(data.lab); fetchBookings();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/lab-center/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      localStorage.setItem("mq_lab_token", data.token);
      setToken(data.token); setLab(data.lab); fetchBookings();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("mq_lab_token");
    setToken(null); setLab(null); setBookings([]);
  };

  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: lab?.paymentMethod ?? "upi",
    upiId: lab?.upiId ?? "",
    bankAccountHolder: lab?.bankAccountHolder ?? "",
    bankAccountNumber: lab?.bankAccountNumber ?? "",
    bankIfscCode: lab?.bankIfscCode ?? "",
    bankName: lab?.bankName ?? "",
  });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  const handleSavePayment = async () => {
    setPaymentSaving(true);
    try {
      const res = await fetch(`${API}/api/lab-center/profile`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(paymentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setLab(prev => prev ? { ...prev, ...paymentForm } : prev);
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setPaymentSaving(false); }
  };

  const handleSaveProfile = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${API}/api/lab-center/profile`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setLab(data.lab); setEditMode(false); setSuccess("Profile updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (bookingId: number, status: string) => {
    try {
      const res = await fetch(`${API}/api/lab-center/bookings/${bookingId}/status`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
        fetchDashboard();
      }
    } catch {}
  };

  if (!token || !lab) {
    return (
      <div className="min-h-screen bg-blue-50/40">
        <header className="bg-white border-b border-border/40 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MediQuickLogo className="w-7 h-7" />
              <div>
                <div className="font-bold text-sm leading-none">Medi Quick</div>
                <div className="text-xs text-blue-600 font-semibold">Lab Center Portal</div>
              </div>
            </div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to app</Link>
          </div>
        </header>

        <div className="max-w-md mx-auto px-4 pt-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Lab Center Portal</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {authTab === "login" ? "Apne lab center account mein sign in karein" : "Naya lab center register karein"}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border/50 overflow-hidden shadow-sm">
            <div className="flex border-b border-border/40">
              <button onClick={() => { setAuthTab("login"); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${authTab === "login" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-muted-foreground"}`}>
                Sign In
              </button>
              <button onClick={() => { setAuthTab("register"); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${authTab === "register" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-muted-foreground"}`}>
                Register Lab Center
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-2xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {authTab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input type="email" placeholder="Email address" required value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input type={showPw ? "text" : "password"} placeholder="Password" required value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-3 text-muted-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  {[
                    { key: "name", label: "Lab Center Name", icon: Building, type: "text" },
                    { key: "email", label: "Email", icon: Mail, type: "email" },
                    { key: "password", label: "Password", icon: Lock, type: "password" },
                    { key: "phone", label: "Phone", icon: Phone, type: "tel" },
                    { key: "city", label: "City", icon: MapPin, type: "text" },
                  ].map(f => (
                    <div key={f.key} className="relative">
                      <f.icon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input type={f.type} placeholder={f.label} value={(regForm as any)[f.key]}
                        onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))}
                        required={["name","email","password"].includes(f.key)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  ))}
                  <select value={regForm.centerType} onChange={e => setRegForm(p => ({ ...p, centerType: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    {CENTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="text" placeholder="NABL/ISO Accreditation (optional)" value={regForm.accreditation}
                    onChange={e => setRegForm(p => ({ ...p, accreditation: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register Lab Center"}
                  </button>
                </form>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Your lab center will be reviewed before listing to patients.
          </p>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === lab.plan);

  return (
    <div className="min-h-screen bg-blue-50/30">
      <header className="bg-white border-b border-border/40 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MediQuickLogo className="w-7 h-7 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-sm leading-none truncate">{lab.name}</div>
              <div className="text-xs text-blue-600 font-semibold">{lab.centerType}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">{lab.plan}</span>
            <div className="relative">
              <button onClick={() => { setShowNotifs(p => !p); if (!showNotifs && unreadCount > 0) markAllRead(); }}
                className="relative p-2 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                {unreadCount > 0 ? <BellRing className="w-4 h-4 text-amber-500" /> : <Bell className="w-4 h-4 text-muted-foreground" />}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-3xl border border-border shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <div className="font-bold text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</div>
                    <button onClick={() => setShowNotifs(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">Koi notification nahi</div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b border-border/30 ${n.isRead === 0 ? "bg-amber-50" : ""}`}>
                        <div className="font-semibold text-xs text-amber-700">{n.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</div>
                        <div className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-xl transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 flex gap-0.5 pb-0.5 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "profile", label: "Profile", icon: User },
            { id: "bookings", label: `Bookings${stats.pending > 0 ? ` (${stats.pending})` : ""}`, icon: ClipboardList },
            { id: "payments", label: "Payment Details", icon: Wallet },
            { id: "plans", label: "Subscription Plans", icon: Crown },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? "text-blue-600 border-blue-600" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm rounded-2xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-2xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Welcome, {lab.name}!</h2>
                <p className="text-sm text-muted-foreground">{lab.city || "Location not set"} · {lab.centerType}</p>
              </div>
              <button onClick={fetchDashboard} className="p-2 rounded-2xl border border-border hover:bg-secondary/50 transition-colors">
                <RefreshCw className={`w-4 h-4 ${dashLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Bookings", value: stats.total, color: "blue", icon: ClipboardList },
                { label: "Pending", value: stats.pending, color: "amber", icon: Calendar },
                { label: "Completed", value: stats.completed, color: "emerald", icon: CheckCircle2 },
                { label: "Revenue (₹)", value: `₹${stats.revenue.toLocaleString()}`, color: "purple", icon: IndianRupee },
              ].map(s => (
                <div key={s.label} className={`bg-white rounded-3xl border border-border/50 p-4 shadow-sm`}>
                  <div className={`w-8 h-8 rounded-2xl bg-${s.color}-100 flex items-center justify-center mb-2`}>
                    <s.icon className={`w-4 h-4 text-${s.color}-600`} />
                  </div>
                  <div className="text-xl font-black text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  Aaj Ka Featured Spot
                  {featuredStatus?.isFeatured && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✅ Featured!</span>
                  )}
                </div>
                <div className="text-amber-700 text-xs mt-1">
                  Home page par 5 lab centers ko daily featured kiya jata hai — <strong>₹499/din</strong>. Fee aapki next earning se deduct hogi.
                </div>
                <div className="text-amber-600 text-xs mt-1">
                  🕐 Registration window: <strong>7 AM – 9 AM IST</strong> har roz · Spots: <strong>{featuredStatus ? featuredStatus.spotsLeft : "?"}/5 bache hain</strong>
                </div>
                {featuredStatus && !featuredStatus.isFeatured && (
                  <div className="mt-2.5">
                    {featuredStatus.windowOpen ? (
                      <button onClick={handleJoinFeatured} disabled={featuredJoining || featuredStatus.spotsLeft === 0}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                        {featuredJoining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {featuredStatus.spotsLeft === 0 ? "Sab spots bhar gaye" : "Featured Mein Join Karo — ₹499"}
                      </button>
                    ) : (
                      <div className="text-xs text-amber-600 bg-amber-100 rounded-xl px-3 py-1.5 inline-block">
                        ⏰ Agla slot {featuredStatus.nextSlotTime} se shuru hoga
                      </div>
                    )}
                  </div>
                )}
                {featuredStatus?.isFeatured && (
                  <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-1.5 inline-block">
                    🎉 Aapka lab center aaj home page par featured hai! ₹499 next payout se deduct hoga.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border/50 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee className="w-4 h-4 text-blue-600" />
                <div className="font-bold text-sm">Platform Fee — {lab.plan === "starter" ? "3%" : lab.plan === "growth" ? "2%" : "1%"} per Booking</div>
              </div>
              <div className="text-muted-foreground text-xs">
                Medi Quick platform fee leti hai har confirmed booking par. Baaki payout aapko milta hai.
              </div>
              <div className="mt-2 text-xs bg-blue-50 rounded-xl px-3 py-2 text-blue-600">
                💡 Growth ya Enterprise plan upgrade karke platform fee kam karo aur zyada earn karo.
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border/50 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">Recent Bookings</h3>
                <button onClick={() => setActiveTab("bookings")} className="text-xs text-blue-600 font-semibold hover:underline">View all</button>
              </div>
              {bookings.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Koi booking nahi abhi tak</div>
              ) : (
                <div className="space-y-2">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30">
                      <div className="w-8 h-8 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                        <FlaskConical className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{b.title}</div>
                        <div className="text-xs text-muted-foreground">{b.patientName} · {b.dateSlot}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Lab Center Profile</h2>
              {!editMode ? (
                <button onClick={() => { setEditMode(true); setEditForm(lab); }}
                  className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-300 px-3 py-1.5 rounded-2xl hover:bg-blue-50 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditMode(false); setError(""); }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground border border-border px-3 py-1.5 rounded-2xl hover:bg-secondary/50">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={loading}
                    className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-2xl transition-colors">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-border/50 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Basic Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Lab Center Name" },
                  { key: "phone", label: "Phone Number" },
                  { key: "city", label: "City" },
                  { key: "registrationNumber", label: "Registration Number" },
                  { key: "accreditation", label: "NABL/ISO Accreditation" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{f.label}</label>
                    {editMode ? (
                      <input value={(editForm as any)[f.key] ?? ""} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    ) : (
                      <div className="text-sm font-medium px-3 py-2.5 bg-secondary/20 rounded-2xl">{(lab as any)[f.key] || "—"}</div>
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Center Type</label>
                  {editMode ? (
                    <select value={editForm.centerType ?? lab.centerType} onChange={e => setEditForm(p => ({ ...p, centerType: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                      {CENTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <div className="text-sm font-medium px-3 py-2.5 bg-secondary/20 rounded-2xl">{lab.centerType}</div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Address</label>
                {editMode ? (
                  <textarea value={editForm.address ?? ""} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} rows={2}
                    className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                ) : (
                  <div className="text-sm font-medium px-3 py-2.5 bg-secondary/20 rounded-2xl">{lab.address || "—"}</div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Lab Test Bookings</h2>
              <button onClick={fetchBookings} className="p-2 rounded-2xl border border-border hover:bg-secondary/50 transition-colors">
                <RefreshCw className={`w-4 h-4 ${bookingsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {bookingsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-border/50 p-12 text-center shadow-sm">
                <FlaskConical className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <div className="font-semibold text-sm">Koi booking nahi</div>
                <div className="text-xs text-muted-foreground mt-1">Jab patients lab tests book karenge, yahan dikhega</div>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="bg-white rounded-3xl border border-border/50 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                        <FlaskConical className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-sm truncate">{b.title}</div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {b.patientName} · {b.phone} · {b.dateSlot}
                        </div>
                        {b.mode && <div className="text-xs text-muted-foreground">{b.mode === "home" ? "🏠 Home Collection" : "🏥 Center Visit"}</div>}
                        {b.address && <div className="text-xs text-muted-foreground truncate">📍 {b.address}</div>}
                        {b.notes && <div className="text-xs text-muted-foreground mt-1 italic">"{b.notes}"</div>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {["Confirmed", "Processing", "Completed", "Cancelled"].map(s => (
                        <button key={s} onClick={() => handleStatusChange(b.id, s)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${b.status === s ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground hover:bg-secondary/50"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-5">
            {paymentSaved && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl px-4 py-3 text-sm">
                <ShieldCheck className="w-4 h-4" /> Payment details saved successfully!
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3">
              <Landmark className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-800 text-sm">Payout Information</div>
                <div className="text-amber-700 text-xs mt-1">
                  Aapki lab bookings ki earnings (98%) is account mein transfer ki jaayegi. Please sahi bank/UPI details bharein.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5 space-y-5">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600" /> Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "upi", label: "UPI / GPay / PhonePe", icon: CreditCard },
                  { id: "bank", label: "Bank Account (NEFT/IMPS)", icon: Landmark },
                ].map(opt => (
                  <button key={opt.id} onClick={() => setPaymentForm(p => ({ ...p, paymentMethod: opt.id }))}
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-sm font-semibold transition-all text-left ${paymentForm.paymentMethod === opt.id ? "border-blue-500 bg-blue-50 text-blue-800" : "border-border bg-secondary/30 text-foreground hover:border-blue-300"}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${paymentForm.paymentMethod === opt.id ? "bg-blue-500" : "bg-muted"}`}>
                      <opt.icon className={`w-4 h-4 ${paymentForm.paymentMethod === opt.id ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>

              {paymentForm.paymentMethod === "upi" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">UPI ID *</label>
                    <input
                      value={paymentForm.upiId}
                      onChange={e => setPaymentForm(p => ({ ...p, upiId: e.target.value }))}
                      placeholder="yourlab@upi / 9876543210@ybl"
                      className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Google Pay, PhonePe, Paytm, BHIM — koi bhi UPI ID chal sakta hai
                    </p>
                  </div>
                  {paymentForm.upiId && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="text-xs">
                        <div className="font-semibold text-emerald-800">UPI ID: {paymentForm.upiId}</div>
                        <div className="text-emerald-600">Earnings is ID pe direct transfer honge</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Account Holder Name *</label>
                    <input
                      value={paymentForm.bankAccountHolder}
                      onChange={e => setPaymentForm(p => ({ ...p, bankAccountHolder: e.target.value }))}
                      placeholder="Jaise aapka naam bank mein hai"
                      className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Account Number *</label>
                    <input
                      value={paymentForm.bankAccountNumber}
                      onChange={e => setPaymentForm(p => ({ ...p, bankAccountNumber: e.target.value.replace(/\D/g, "") }))}
                      placeholder="Enter your account number"
                      className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono tracking-wider"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">IFSC Code *</label>
                      <input
                        value={paymentForm.bankIfscCode}
                        onChange={e => setPaymentForm(p => ({ ...p, bankIfscCode: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SBIN0001234"
                        maxLength={11}
                        className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">Bank Name</label>
                      <input
                        value={paymentForm.bankName}
                        onChange={e => setPaymentForm(p => ({ ...p, bankName: e.target.value }))}
                        placeholder="e.g. SBI, HDFC, ICICI"
                        className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  {paymentForm.bankAccountNumber && paymentForm.bankIfscCode && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Bank Details Summary
                      </div>
                      <div className="text-xs text-emerald-700 space-y-0.5">
                        {paymentForm.bankAccountHolder && <div>Name: {paymentForm.bankAccountHolder}</div>}
                        <div>A/C: •••• {paymentForm.bankAccountNumber.slice(-4)}</div>
                        <div>IFSC: {paymentForm.bankIfscCode}{paymentForm.bankName ? ` (${paymentForm.bankName})` : ""}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleSavePayment} disabled={paymentSaving}
                className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {paymentSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><ShieldCheck className="w-4 h-4" /> Save Payment Details</>}
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" /> Payout Summary
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Total bookings revenue", value: `₹${stats.revenue.toLocaleString()}` },
                  { label: "Platform fee (2%)", value: `₹${Math.round(stats.revenue * 0.02).toLocaleString()}`, color: "text-orange-600" },
                  { label: "Your payout (estimated)", value: `₹${Math.round(stats.revenue * 0.98).toLocaleString()}`, color: "text-emerald-700", bold: true },
                ].map(row => (
                  <div key={row.label} className={`flex items-center justify-between text-sm ${row.bold ? "border-t border-border/50 pt-2 font-bold" : ""}`}>
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={row.color ?? "font-medium"}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Cash Payment Policy
                </div>
                <p className="text-xs text-orange-700">
                  Chahe patient <strong>online</strong> ya <strong>cash</strong> mein payment kare — MediQuick ka <strong>platform fee hamesha lagega</strong>. Agar payment cash mein li hai, toh yeh fee aapke <strong>agle online payout se automatically deduct</strong> ho jaayegi.
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Payouts are processed every week to your registered account
              </p>
            </div>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                <Crown className="w-4 h-4" /> Lab Center Subscription Plans
              </div>
              <h2 className="text-2xl font-bold">Apna Plan Chuno</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Zyada tests list karo, platform fee kam karo, aur zyada patients tak pahuncho.
              </p>
            </div>

            {plansLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {plans.map(plan => {
                  const Icon = PLAN_ICON[plan.id] ?? Shield;
                  const isCurrent = plan.id === lab.plan;
                  return (
                    <div key={plan.id}
                      className={`bg-white rounded-3xl border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col ${plan.id === "growth" ? "border-blue-300 scale-[1.02]" : isCurrent ? "border-primary" : "border-border/50"}`}>
                      {plan.id === "growth" && (
                        <div className="bg-blue-100 text-blue-700 text-xs font-bold text-center py-1.5">⭐ Most Popular</div>
                      )}
                      <div style={{ background: GRAD[plan.id] ?? GRAD.starter }} className="p-5 text-white">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="font-bold text-xl">{plan.name}</div>
                        <div className="mt-2">
                          {plan.price === 0 ? (
                            <div className="text-2xl font-black">Free</div>
                          ) : (
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black">₹{plan.price}</span>
                              <span className="text-white/70 text-sm">/ month</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1 bg-white/20 rounded-xl px-2.5 py-1 text-xs font-semibold">
                          <IndianRupee className="w-3 h-3" /> Platform fee: {plan.platformFee}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <ul className="space-y-2.5 flex-1">
                          {plan.benefits.map((b: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-5">
                          {isCurrent ? (
                            <div className="w-full py-2.5 rounded-2xl text-sm font-bold text-center bg-gray-100 text-gray-500">
                              Current Plan
                            </div>
                          ) : (
                            <button
                              onClick={() => alert("Razorpay payment integration se upgrade hoga. Keys add karein settings mein.")}
                              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                              style={{ background: GRAD[plan.id] }}>
                              Upgrade to {plan.name} <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-blue-900 text-sm">Platform Fee Comparison</div>
                  <div className="text-blue-700 text-xs mt-1.5 space-y-1">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span> Starter: 3% per booking</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Growth: 2% per booking (save 1%)</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Enterprise: 1% per booking (save 2%)</div>
                  </div>
                  <p className="text-blue-600 text-xs mt-2">
                    💡 ₹1000 booking par: Starter pays ₹30, Growth pays ₹20, Enterprise pays ₹10.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
