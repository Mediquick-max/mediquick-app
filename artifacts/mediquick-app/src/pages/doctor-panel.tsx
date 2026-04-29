import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Stethoscope, User, Lock, Mail, Phone, MapPin, Building, Award,
  Clock, Calendar, CheckCircle2, XCircle, Loader2, LogOut, Edit3,
  Save, Eye, EyeOff, ChevronRight, Star, TrendingUp, Users, 
  AlertCircle, RefreshCw, Video, Pill, IndianRupee, BadgeCheck,
  ClipboardList, X, Plus
} from "lucide-react";
import { MediQuickLogo } from "@/components/logo";

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "appointments">("dashboard");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const fetchProfile = useCallback(async (tok?: string) => {
    try {
      const res = await fetch(`${API}/api/doctor-panel/profile`, {
        headers: { Authorization: `Bearer ${tok ?? token}`, "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDoctor(data.doctor);
    } catch {}
  }, [token]);

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
    if (token) { fetchProfile(); fetchAppointments(); }
  }, [token]);

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
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Profile Photo URL (optional)</label>
                          <input value={regForm.imageUrl} onChange={e => setRegForm(f => ({ ...f, imageUrl: e.target.value }))}
                            placeholder="https://..."
                            className="w-full px-3 py-3 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
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
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-xl transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 flex gap-0.5 pb-0.5">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "profile", label: "My Profile", icon: User },
            { id: "appointments", label: `Appointments${pending > 0 ? ` (${pending})` : ""}`, icon: ClipboardList },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id ? "text-blue-600 border-blue-600" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
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
                    <Field label="Profile Photo URL" value={editForm.imageUrl} onChange={(v: string) => setEditForm((f: any) => ({ ...f, imageUrl: v }))} />
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
                          {a.amountPaid > 0 && <div className="text-xs text-emerald-600 font-semibold mt-1">₹{a.amountPaid} paid</div>}
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
