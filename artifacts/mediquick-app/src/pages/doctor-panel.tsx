import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import {
  Stethoscope, User, Lock, Mail, Phone, MapPin, Building, Award,
  Clock, Calendar, CheckCircle2, XCircle, Loader2, LogOut, Edit3,
  Save, Eye, EyeOff, ChevronRight, Star, TrendingUp, Users, 
  AlertCircle, RefreshCw, Video, Pill, IndianRupee, BadgeCheck,
  ClipboardList, X, Plus, Wallet, CreditCard, Landmark, ShieldCheck,
  Crown, Sparkles, Shield, Zap, ArrowRight, Bell, BellRing,
  ToggleLeft, ToggleRight, Camera, Tag
} from "lucide-react";
import { MediQuickLogo } from "@/components/logo";

// ── Gallery Photo Uploader ──────────────────────────────────────────
function compressImage(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
        else if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PhotoUploader({
  value, onChange, size = "lg"
}: { value: string; onChange: (v: string) => void; size?: "sm" | "lg" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const dim = size === "lg" ? "w-24 h-24" : "w-16 h-16";
  const iconDim = size === "lg" ? "w-5 h-5" : "w-4 h-4";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch { /* ignore */ }
    finally { setUploading(false); }
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${dim} shrink-0 cursor-pointer group`}
        onClick={() => inputRef.current?.click()}>
        <img
          src={value || `https://api.dicebear.com/7.x/avataaars/svg?seed=doctor`}
          alt="Profile"
          className={`${dim} rounded-3xl object-cover bg-blue-100 border-2 border-blue-200`}
          onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=doctor`; }}
        />
        <div className="absolute inset-0 rounded-3xl bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
          {uploading
            ? <Loader2 className={`${iconDim} text-white animate-spin`} />
            : <Camera className={`${iconDim} text-white`} />}
          <span className="text-white text-[10px] font-bold mt-0.5">
            {uploading ? "..." : "Gallery"}
          </span>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors border border-blue-200 active:scale-95">
        <Camera className="w-3.5 h-3.5" />
        {value ? "Change Photo" : "Upload Photo from Gallery"}
      </button>
    </div>
  );
}

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const SPECIALIZATIONS = [
  "General Physician", "Cardiologist", "Dermatologist", "Pediatrician",
  "Orthopedic Surgeon", "Gynecologist", "Neurologist", "Psychiatrist",
  "ENT Specialist", "Ophthalmologist", "Diabetologist", "Pulmonologist",
  "Gastroenterologist", "Nephrologist", "Urologist", "Oncologist",
  "Dentist", "Physiotherapist", "Other"
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  no_show: "bg-gray-100 text-gray-600",
};

interface DoctorProfile {
  id: number; name: string; email: string; phone: string;
  specialization: string; qualifications: string; experienceYears: number;
  city: string; hospitalName: string; address: string; fee: number;
  consultationType: string; bio: string; languages: string;
  availableDays: string; availableSlots: string; imageUrl: string;
  registrationStatus: string; status: string; rating: number; totalReviews: number;
  paymentMethod: string; upiId: string;
  bankAccountHolder: string; bankAccountNumber: string; bankIfscCode: string; bankName: string;
}

interface Appointment {
  id: number; patientName: string; phone: string; date: string;
  timeSlot: string; healthIssue: string; consultationType: string;
  status: string; meetingLink: string; amountPaid: number; createdAt: string;
}

export default function DoctorPanelPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mq_doc_token"));
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "appointments" | "payments" | "plans">("dashboard");
  const [docPlans, setDocPlans] = useState<any[]>([]);
  const [docPlansLoading, setDocPlansLoading] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [featuredStatus, setFeaturedStatus] = useState<{ isFeatured: boolean; spotsLeft: number; windowOpen: boolean; istHour: number; nextSlotTime: string } | null>(null);
  const [featuredJoining, setFeaturedJoining] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);

  const INIT_REG = {
    name: "", email: "", password: "", phone: "",
    specialization: "General Physician", qualifications: "", experienceYears: "",
    city: "", hospitalName: "", address: "", fee: "499",
    consultationType: "both", bio: "", languages: "Hindi, English",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as string[],
    availableSlots: [...TIME_SLOTS] as string[],
    imageUrl: "",
  };
  const [regForm, setRegForm] = useState(INIT_REG);
  const [regStep, setRegStep] = useState(1);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [apptLoading, setApptLoading] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: "upi",
    upiId: "",
    bankAccountHolder: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankName: "",
  });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/notifications/doctor`, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      if (res.ok) { const d = await res.json(); setNotifications(d.notifications ?? []); setUnreadCount(d.unread ?? 0); }
    } catch {}
  }, [token]);

  const markAllRead = async () => {
    try {
      await fetch(`${API}/api/notifications/doctor/read-all`, { method: "PUT", headers: authHeaders() });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch {}
  };

  const fetchFeaturedStatus = useCallback(async (tok?: string) => {
    try {
      const res = await fetch(`${API}/api/featured/doctor/status`, {
        headers: { Authorization: `Bearer ${tok ?? token}`, "Content-Type": "application/json" }
      });
      if (res.ok) { const d = await res.json(); setFeaturedStatus(d); }
    } catch {}
  }, [token]);

  const handleJoinFeatured = async () => {
    setFeaturedJoining(true);
    try {
      const res = await fetch(`${API}/api/featured/doctor/join`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Join failed"); }
      else { alert(data.message); fetchFeaturedStatus(); }
    } catch { alert("Network error. Please try again."); }
    finally { setFeaturedJoining(false); }
  };

  const fetchProfile = useCallback(async (tok?: string) => {
    try {
      const res = await fetch(`${API}/api/doctor-panel/profile`, {
        headers: { Authorization: `Bearer ${tok ?? token}`, "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDoctor(data.doctor);
      setPaymentForm({
        paymentMethod: data.doctor.paymentMethod || "upi",
        upiId: data.doctor.upiId || "",
        bankAccountHolder: data.doctor.bankAccountHolder || "",
        bankAccountNumber: data.doctor.bankAccountNumber || "",
        bankIfscCode: data.doctor.bankIfscCode || "",
        bankName: data.doctor.bankName || "",
      });
    } catch {}
  }, [token]);

  const handlePaymentSave = async () => {
    setPaymentSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/doctor-panel/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(paymentForm),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      const data = await res.json();
      setDoctor(data.doctor);
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || "Could not save payment details");
    } finally { setPaymentSaving(false); }
  };

  const fetchAppointments = useCallback(async () => {
    setApptLoading(true);
    try {
      const res = await fetch(`${API}/api/doctor-panel/appointments`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAppointments(data.appointments);
    } catch {} finally { setApptLoading(false); }
  }, [authHeaders]);

  useEffect(() => {
    if (token) { fetchProfile(); fetchAppointments(); fetchFeaturedStatus(); fetchNotifications(); }
  }, [token]);

  useEffect(() => {
    if (activeTab === "plans" && docPlans.length === 0) {
      setDocPlansLoading(true);
      fetch(`${API}/api/doctor-panel/plans`)
        .then(r => r.json())
        .then(d => setDocPlans(d.plans ?? []))
        .catch(() => {})
        .finally(() => setDocPlansLoading(false));
    }
  }, [activeTab]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/doctor-panel/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      localStorage.setItem("mq_doc_token", data.token);
      setToken(data.token);
      setDoctor(data.doctor);
      fetchAppointments();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regStep < 3) { setRegStep(s => s + 1); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/doctor-panel/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...regForm, experienceYears: Number(regForm.experienceYears), fee: Number(regForm.fee) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      localStorage.setItem("mq_doc_token", data.token);
      setToken(data.token);
      setDoctor(data.doctor);
      fetchAppointments();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("mq_doc_token");
    setToken(null); setDoctor(null); setAppointments([]);
    setLoginForm({ email: "", password: "" });
  };

  const handleSaveProfile = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${API}/api/doctor-panel/profile`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setDoctor(data.doctor);
      setEditMode(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleApptStatus = async (id: number, status: string) => {
    await fetch(`${API}/api/doctor-panel/appointments/${id}/status`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify({ status })
    });
    fetchAppointments();
  };

  const toggleDay = (day: string) => {
    setRegForm(f => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter(d => d !== day)
        : [...f.availableDays, day]
    }));
  };
  const toggleSlot = (slot: string) => {
    setRegForm(f => ({
      ...f,
      availableSlots: f.availableSlots.includes(slot)
        ? f.availableSlots.filter(s => s !== slot)
        : [...f.availableSlots, slot]
    }));
  };

  if (!token || !doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans flex flex-col">
        <header className="bg-white border-b border-border/40 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <MediQuickLogo className="w-8 h-8" />
            <div>
              <div className="font-bold text-base">Medi Quick</div>
              <div className="text-xs text-blue-600 font-semibold">Doctor Portal</div>
            </div>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to app</Link>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Doctor Registration Portal</h1>
              <p className="text-muted-foreground mt-2">
                {authTab === "login" ? "Sign in to manage your profile and appointments" : "Register to start seeing patients on Medi Quick"}
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-border/50 overflow-hidden">
              <div className="flex border-b border-border/40">
                <button onClick={() => { setAuthTab("login"); setError(""); setRegStep(1); }}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${authTab === "login" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-muted-foreground"}`}>
                  Sign In
                </button>
                <button onClick={() => { setAuthTab("register"); setError(""); setRegStep(1); }}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${authTab === "register" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-muted-foreground"}`}>
                  Register as Doctor
                </button>
              </div>

              <div className="p-6">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-2xl px-4 py-3 mb-4 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                {authTab === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required type="email"
                          placeholder="doctor@example.com"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required
                          type={showPw ? "text" : "password"} placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      {loading ? "Signing in..." : "Sign In"}
                    </button>
                  </form>
                )}

                {authTab === "register" && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3].map(s => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= regStep ? "bg-blue-600" : "bg-secondary"}`} />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-blue-600 mb-2">
                      Step {regStep} of 3 — {regStep === 1 ? "Account Details" : regStep === 2 ? "Professional Info" : "Availability & Schedule"}
                    </p>

                    {regStep === 1 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name *</label>
                          <input value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} required
                            placeholder="Dr. Rohit Sharma"
                            className="w-full px-3 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} required type="email"
                              placeholder="doctor@example.com"
                              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} required
                              type={showPw ? "text" : "password"} minLength={6} placeholder="At least 6 characters"
                              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            <button type="button" onClick={() => setShowPw(!showPw)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                              type="tel" placeholder="10-digit mobile number"
                              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                          </div>
                        </div>
                      </div>
                    )}

                    {regStep === 2 && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Specialization *</label>
                          <select value={regForm.specialization} onChange={e => setRegForm(f => ({ ...f, specialization: e.target.value }))} required
                            className="w-full px-3 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                            {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Qualifications</label>
                          <input value={regForm.qualifications} onChange={e => setRegForm(f => ({ ...f, qualifications: e.target.value }))}
                            placeholder="MBBS, MD, DNB..."
                            className="w-full px-3 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Experience (years)</label>
                            <input value={regForm.experienceYears} onChange={e => setRegForm(f => ({ ...f, experienceYears: e.target.value }))}
                              type="number" min="0" max="60" placeholder="5"
                              className="w-full px-3 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Fee (₹)</label>
                            <input value={regForm.fee} onChange={e => setRegForm(f => ({ ...f, fee: e.target.value }))}
                              type="number" min="0" placeholder="499"
                              className="w-full px-3 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">City</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={regForm.city} onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))}
                              placeholder="Mumbai"
                              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hospital / Clinic Name</label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={regForm.hospitalName} onChange={e => setRegForm(f => ({ ...f, hospitalName: e.target.value }))}
                              placeholder="City Hospital, Apollo..."
                              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Consultation Type</label>
                          <div className="flex gap-2">
                            {["video", "clinic", "both"].map(t => (
                              <button key={t} type="button"
                                onClick={() => setRegForm(f => ({ ...f, consultationType: t }))}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all capitalize ${regForm.consultationType === t ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground hover:border-blue-300"}`}>
                                {t === "both" ? "Video + Clinic" : t}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">About Yourself</label>
                          <textarea value={regForm.bio} onChange={e => setRegForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                            placeholder="Brief description of your experience, expertise..."
                            className="w-full px-3 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                        </div>
                      </div>
                    )}

                    {regStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-2">Available Days</label>
                          <div className="flex flex-wrap gap-2">
                            {DAYS.map(d => (
                              <button key={d} type="button" onClick={() => toggleDay(d)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${regForm.availableDays.includes(d) ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground"}`}>
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-2">Available Time Slots</label>
                          <div className="flex flex-wrap gap-2">
                            {TIME_SLOTS.map(s => (
                              <button key={s} type="button" onClick={() => toggleSlot(s)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${regForm.availableSlots.includes(s) ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground"}`}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Languages Spoken</label>
                          <input value={regForm.languages} onChange={e => setRegForm(f => ({ ...f, languages: e.target.value }))}
                            placeholder="Hindi, English, Marathi"
                            className="w-full px-3 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-2">Profile Photo</label>
                          <PhotoUploader
                            value={regForm.imageUrl}
                            onChange={v => setRegForm(f => ({ ...f, imageUrl: v }))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 mt-4">
                      {regStep > 1 && (
                        <button type="button" onClick={() => setRegStep(s => s - 1)}
                          className="flex-1 bg-secondary text-foreground py-3 rounded-2xl font-bold text-sm hover:bg-secondary/70 transition-all">
                          ← Back
                        </button>
                      )}
                      <button type="submit" disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {loading ? "Registering..." : regStep < 3 ? "Next →" : "Complete Registration"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Your profile will be reviewed by our team before being listed to patients.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const slots = (() => { try { return JSON.parse(doctor.availableSlots); } catch { return []; } })();
  const days = doctor.availableDays ? doctor.availableDays.split(",") : [];
  const pending = appointments.filter(a => a.status === "pending").length;
  const confirmed = appointments.filter(a => a.status === "confirmed").length;
  const completed = appointments.filter(a => a.status === "completed").length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.date === todayStr);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-border/40 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MediQuickLogo className="w-7 h-7" />
            <div>
              <div className="font-bold text-sm leading-none">Medi Quick</div>
              <div className="text-xs text-blue-600 font-semibold">Doctor Portal</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src={doctor.imageUrl} alt={doctor.name}
                className="w-8 h-8 rounded-full object-cover bg-blue-100"
                onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.name}`; }} />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold leading-none">{doctor.name}</div>
                <div className={`text-xs font-semibold mt-0.5 ${doctor.registrationStatus === "approved" ? "text-emerald-600" : doctor.registrationStatus === "pending" ? "text-amber-600" : "text-red-600"}`}>
                  {doctor.registrationStatus === "approved" ? "✓ Verified" : doctor.registrationStatus === "pending" ? "⏳ Pending Review" : "✗ Rejected"}
                </div>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => { setShowNotifs(p => !p); if (!showNotifs && unreadCount > 0) markAllRead(); }}
                className="relative p-2 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                {unreadCount > 0 ? <BellRing className="w-4 h-4 text-amber-500 animate-[wiggle_1s_ease-in-out_infinite]" /> : <Bell className="w-4 h-4 text-muted-foreground" />}
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
            { id: "profile", label: "My Profile", icon: User },
            { id: "appointments", label: `Appointments${pending > 0 ? ` (${pending})` : ""}`, icon: ClipboardList },
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

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl px-4 py-3 text-sm">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-2xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {doctor.registrationStatus === "pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-800 text-sm">Profile Under Review</div>
              <div className="text-amber-700 text-xs mt-1">Our team is verifying your credentials. You'll be listed to patients once approved (typically 24-48 hours).</div>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
                <IndianRupee className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-blue-900 text-sm">Platform Fee — 2% per Booking</div>
                <div className="text-blue-700 text-xs mt-1">
                  Medi Quick platform 2% service charge leti hai har confirmed consultation par. Baaki <strong>98% aapko milta hai</strong> — chahe patient koi bhi membership plan le.
                </div>
                <div className="text-blue-600 text-xs mt-1.5 bg-blue-50 rounded-xl px-3 py-2">
                  💡 Agar patient Gold/Platinum/Yearly plan mein discount le raha hai, toh woh discount <strong>platform apni membership revenue se deta hai</strong>. Aapki earnings par koi asar nahi — aapko hamesha apni poori fee ka 98% milega.
                </div>
                <div className="flex gap-4 mt-2.5">
                  <div className="text-xs">
                    <div className="text-blue-500 font-medium">Example: ₹{doctor.fee} consult</div>
                    <div className="text-blue-900 font-bold">Aapko milega: ₹{Math.round(doctor.fee * 0.98)}</div>
                    <div className="text-blue-500">Platform: ₹{Math.round(doctor.fee * 0.02)}</div>
                  </div>
                </div>
              </div>
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
                  Home page par 5 doctors ko daily featured kiya jata hai — <strong>₹499/din</strong>. Fee aapki next earning se deduct hogi.
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
                    🎉 Aap aaj home page par featured hain! ₹499 next payout se deduct hoga.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Pending", value: pending, color: "amber", icon: Clock },
                { label: "Confirmed", value: confirmed, color: "blue", icon: CheckCircle2 },
                { label: "Completed", value: completed, color: "emerald", icon: Star },
                { label: "Total", value: appointments.length, color: "violet", icon: Users },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-3xl p-4 border border-border/50 shadow-sm">
                  <div className={`w-9 h-9 rounded-2xl bg-${stat.color}-100 flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Today's Appointments
                <span className="ml-auto text-xs text-muted-foreground font-normal">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</span>
              </h2>
              {todayAppts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No appointments today</div>
              ) : (
                <div className="space-y-3">
                  {todayAppts.map(a => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                        {a.patientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{a.patientName}</div>
                        <div className="text-xs text-muted-foreground">{a.timeSlot} • {a.consultationType}</div>
                        {a.healthIssue && <div className="text-xs text-muted-foreground truncate">{a.healthIssue}</div>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                        {a.meetingLink && a.status === "confirmed" && (
                          <a href={a.meetingLink} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <Video className="w-3 h-3" /> Join
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Profile Summary
              </h2>
              <div className="flex items-start gap-4">
                <img src={doctor.imageUrl} alt={doctor.name}
                  className="w-20 h-20 rounded-3xl object-cover bg-blue-100 shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.name}`; }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg">{doctor.name}</div>
                  <div className="text-blue-600 font-semibold text-sm">{doctor.specialization}</div>
                  <div className="text-muted-foreground text-xs mt-1">{doctor.qualifications}</div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{doctor.city}</span>
                    <span className="flex items-center gap-1"><Award className="w-3 h-3" />{doctor.experienceYears} yrs exp</span>
                    <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{doctor.fee}/consult</span>
                    {doctor.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{doctor.rating} ({doctor.totalReviews})</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setActiveTab("profile")}
                      className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                      <Edit3 className="w-3 h-3" /> Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> My Profile</h2>
              {!editMode ? (
                <button onClick={() => { setEditMode(true); setEditForm({ ...doctor, availableSlots: slots, availableDays: days }); }}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditMode(false)}
                    className="flex items-center gap-1.5 text-sm border border-border px-4 py-2 rounded-xl font-semibold hover:bg-secondary transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 space-y-6">
              {!editMode ? (
                <>
                  <div className="flex items-start gap-4">
                    <img src={doctor.imageUrl} alt={doctor.name}
                      className="w-24 h-24 rounded-3xl object-cover bg-blue-100 shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.name}`; }} />
                    <div>
                      <h3 className="font-bold text-xl">{doctor.name}</h3>
                      <div className="text-blue-600 font-semibold">{doctor.specialization}</div>
                      <div className="text-muted-foreground text-sm">{doctor.qualifications}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{doctor.email}</span>
                      </div>
                      {doctor.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{doctor.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoBox icon={MapPin} label="City" value={doctor.city} />
                    <InfoBox icon={Building} label="Hospital" value={doctor.hospitalName || "Not set"} />
                    <InfoBox icon={Award} label="Experience" value={`${doctor.experienceYears} years`} />
                    <InfoBox icon={IndianRupee} label="Consultation Fee" value={`₹${doctor.fee}`} />
                    <InfoBox icon={Video} label="Consultation Type" value={doctor.consultationType} />
                    <InfoBox icon={Users} label="Languages" value={doctor.languages} />
                  </div>
                  {doctor.bio && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">About</div>
                      <p className="text-sm text-foreground leading-relaxed">{doctor.bio}</p>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Available Days</div>
                    <div className="flex flex-wrap gap-2">
                      {days.map(d => <span key={d} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{d}</span>)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">Available Slots</div>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s: string) => <span key={s} className="px-3 py-1 bg-secondary text-foreground rounded-full text-xs font-medium">{s}</span>)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name" value={editForm.name} onChange={(v: string) => setEditForm((f: any) => ({ ...f, name: v }))} />
                    <Field label="Phone" value={editForm.phone} onChange={(v: string) => setEditForm((f: any) => ({ ...f, phone: v }))} type="tel" />
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Specialization</label>
                      <select value={editForm.specialization} onChange={e => setEditForm((f: any) => ({ ...f, specialization: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <Field label="Qualifications" value={editForm.qualifications} onChange={(v: string) => setEditForm((f: any) => ({ ...f, qualifications: v }))} />
                    <Field label="Experience (years)" value={editForm.experienceYears} onChange={(v: string) => setEditForm((f: any) => ({ ...f, experienceYears: Number(v) }))} type="number" />
                    <Field label="Fee (₹)" value={editForm.fee} onChange={(v: string) => setEditForm((f: any) => ({ ...f, fee: Number(v) }))} type="number" />
                    <Field label="City" value={editForm.city} onChange={(v: string) => setEditForm((f: any) => ({ ...f, city: v }))} />
                    <Field label="Hospital/Clinic Name" value={editForm.hospitalName} onChange={(v: string) => setEditForm((f: any) => ({ ...f, hospitalName: v }))} />
                    <Field label="Languages" value={editForm.languages} onChange={(v: string) => setEditForm((f: any) => ({ ...f, languages: v }))} />
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2">Profile Photo</label>
                      <PhotoUploader
                        value={editForm.imageUrl}
                        onChange={(v: string) => setEditForm((f: any) => ({ ...f, imageUrl: v }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Consultation Type</label>
                    <div className="flex gap-2">
                      {["video", "clinic", "both"].map(t => (
                        <button key={t} type="button"
                          onClick={() => setEditForm((f: any) => ({ ...f, consultationType: t }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all capitalize ${editForm.consultationType === t ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground"}`}>
                          {t === "both" ? "Video + Clinic" : t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">About</label>
                    <textarea value={editForm.bio} onChange={e => setEditForm((f: any) => ({ ...f, bio: e.target.value }))} rows={3}
                      className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2">Available Days</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(d => (
                        <button key={d} type="button"
                          onClick={() => setEditForm((f: any) => ({ ...f, availableDays: f.availableDays?.includes(d) ? f.availableDays.filter((x: string) => x !== d) : [...(f.availableDays ?? []), d] }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${editForm.availableDays?.includes(d) ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-2">Available Time Slots</label>
                    <div className="flex flex-wrap gap-2">
                      {TIME_SLOTS.map(s => (
                        <button key={s} type="button"
                          onClick={() => setEditForm((f: any) => ({ ...f, availableSlots: f.availableSlots?.includes(s) ? f.availableSlots.filter((x: string) => x !== s) : [...(f.availableSlots ?? []), s] }))}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${editForm.availableSlots?.includes(s) ? "bg-blue-600 text-white border-blue-600" : "border-border text-muted-foreground"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" /> All Appointments
              </h2>
              <button onClick={fetchAppointments} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            {apptLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No appointments yet</div>
            ) : (
              <div className="divide-y divide-border/40">
                {appointments.map(a => (
                  <div key={a.id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0">
                          {a.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{a.patientName}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {a.phone}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {a.date} at {a.timeSlot}
                          </div>
                          {a.healthIssue && <div className="text-xs text-foreground mt-1 max-w-xs">{a.healthIssue}</div>}
                          {a.amountPaid > 0 && (
                            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-2.5 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Patient paid</span>
                                <span className="font-bold text-foreground">₹{a.amountPaid}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-orange-600 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                                  Platform fee (2%)
                                </span>
                                <span className="text-orange-600 font-semibold">− ₹{Math.round(a.amountPaid * 0.02)}</span>
                              </div>
                              <div className="border-t border-gray-200 pt-1 flex items-center justify-between text-xs">
                                <span className="text-emerald-700 font-bold">Your earnings (98%)</span>
                                <span className="text-emerald-700 font-bold">₹{Math.round(a.amountPaid * 0.98)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                        {a.meetingLink && (
                          <a href={a.meetingLink} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                            <Video className="w-3 h-3" /> Video Call
                          </a>
                        )}
                      </div>
                    </div>
                    {a.status === "pending" && (
                      <div className="flex gap-2 mt-3 ml-13">
                        <button onClick={() => handleApptStatus(a.id, "confirmed")}
                          className="flex-1 text-xs bg-emerald-600 text-white py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                        </button>
                        <button onClick={() => handleApptStatus(a.id, "cancelled")}
                          className="flex-1 text-xs bg-red-50 text-red-600 py-2 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-1 border border-red-200">
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    )}
                    {a.status === "confirmed" && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleApptStatus(a.id, "completed")}
                          className="text-xs bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                        </button>
                        <button onClick={() => handleApptStatus(a.id, "no_show")}
                          className="text-xs border border-border text-muted-foreground px-4 py-2 rounded-xl font-semibold hover:bg-secondary transition-colors">
                          No Show
                        </button>
                      </div>
                    )}
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
                  Aapki earnings (98%) is account mein transfer ki jaayegi. Please sahi bank/UPI details bharein.
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
                  <button key={opt.id} onClick={() => setPaymentForm(f => ({ ...f, paymentMethod: opt.id }))}
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
                      onChange={e => setPaymentForm(f => ({ ...f, upiId: e.target.value }))}
                      placeholder="yourname@upi / 9876543210@ybl"
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
                      onChange={e => setPaymentForm(f => ({ ...f, bankAccountHolder: e.target.value }))}
                      placeholder="Jaise aapka naam bank mein hai"
                      className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">Account Number *</label>
                    <input
                      value={paymentForm.bankAccountNumber}
                      onChange={e => setPaymentForm(f => ({ ...f, bankAccountNumber: e.target.value.replace(/\D/g, "") }))}
                      placeholder="Enter your account number"
                      className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono tracking-wider"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">IFSC Code *</label>
                      <input
                        value={paymentForm.bankIfscCode}
                        onChange={e => setPaymentForm(f => ({ ...f, bankIfscCode: e.target.value.toUpperCase() }))}
                        placeholder="e.g. SBIN0001234"
                        maxLength={11}
                        className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">Bank Name</label>
                      <input
                        value={paymentForm.bankName}
                        onChange={e => setPaymentForm(f => ({ ...f, bankName: e.target.value }))}
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

              <button onClick={handlePaymentSave} disabled={paymentSaving}
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
                  { label: "Your consultation fee", value: `₹${doctor.fee}` },
                  { label: "Platform fee (2%)", value: `₹${Math.round(doctor.fee * 0.02)}`, color: "text-orange-600" },
                  { label: "Your payout per consultation", value: `₹${Math.round(doctor.fee * 0.98)}`, color: "text-emerald-700", bold: true },
                ].map(row => (
                  <div key={row.label} className={`flex items-center justify-between text-sm ${row.bold ? "border-t border-border/50 pt-2 font-bold" : ""}`}>
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={row.color || "font-medium"}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Cash Payment Policy
                </div>
                <p className="text-xs text-orange-700">
                  Chahe patient <strong>online</strong> ya <strong>cash</strong> mein payment kare — MediQuick ka <strong>2% platform fee hamesha lagega</strong>. Agar payment cash mein li hai, toh yeh fee aapke <strong>agle online payout se automatically deduct</strong> ho jaayegi.
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
            {/* Shopkeeper Discount Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-emerald-800 text-sm">🎉 Shopkeeper Special Discount — 5% Extra Off!</div>
                <div className="text-emerald-700 text-xs mt-1">
                  Agar aap MediQuick ke Shopkeeper Panel mein register hain, toh har subscription plan mein <strong>5% additional discount</strong> milega. Shopkeeper panel mein login karein aur discount activate karein.
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                <Crown className="w-4 h-4" /> Doctor Subscription Plans
              </div>
              <h2 className="text-2xl font-bold text-foreground">Apna Plan Chuno</h2>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Apni practice grow karo — zyada patients, kam platform fee, aur premium features ke saath.
              </p>
            </div>

            {docPlansLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {docPlans.map(plan => {
                  const GRAD: Record<string, string> = {
                    basic:  "linear-gradient(135deg, #9ca3af, #4b5563)",
                    pro:    "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    clinic: "linear-gradient(135deg, #a855f7, #7c3aed)",
                  };
                  const ICON: Record<string, any> = { basic: Shield, pro: Star, clinic: Sparkles };
                  const Icon = ICON[plan.id] ?? Shield;
                  const isCurrent = plan.id === "basic";
                  return (
                    <div key={plan.id}
                      className={`bg-white rounded-3xl border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col ${plan.id === "pro" ? "border-blue-300 scale-[1.02]" : "border-border/50"}`}>
                      {plan.id === "pro" && (
                        <div className="bg-blue-100 text-blue-700 text-xs font-bold text-center py-1.5">
                          ⭐ Most Popular
                        </div>
                      )}
                      <div style={{ background: GRAD[plan.id] ?? GRAD.basic }} className="p-5 text-white">
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
                        <div className="mt-2 inline-flex items-center gap-1 bg-emerald-400/30 border border-emerald-300/40 rounded-xl px-2.5 py-1 text-xs font-bold text-white">
                          <Tag className="w-3 h-3" /> +5% Shopkeeper Discount
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <ul className="space-y-2.5 flex-1">
                          {plan.benefits.map((b: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-foreground">{b}</span>
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
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span> Basic: 2% per consultation</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Pro: 1.5% per consultation (save 0.5%)</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Clinic: 1% per consultation (save 1%)</div>
                  </div>
                  <p className="text-blue-600 text-xs mt-2">
                    💡 Pro plan par ₹500 fee ke saath: har consultation par ₹2.50 extra bachta hai. 50 consultations/month = ₹125 bachega!
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

function InfoBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-secondary/30 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-sm font-medium capitalize">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <input value={value ?? ""} onChange={e => onChange(e.target.value)} type={type}
        className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
    </div>
  );
}
