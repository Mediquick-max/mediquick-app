import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import {
  Search, Star, Video, Building2, Clock, IndianRupee, X, ChevronRight,
  Stethoscope, Filter, Loader2, CalendarCheck, Phone, FileText,
  CheckCircle2, VideoIcon, ExternalLink, User, Calendar, MessageSquare,
  Award, Languages, MapPin, Heart, RefreshCw
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const SPECIALIZATIONS = [
  "All", "General Physician", "Cardiologist", "Dermatologist",
  "Pediatrician", "Gynaecologist", "Orthopedic Surgeon", "Psychiatrist",
  "Diabetologist", "ENT Specialist", "Neurologist", "Ophthalmologist"
];

const TYPE_OPTIONS = [
  { key: "all", label: "All Types", icon: Stethoscope },
  { key: "video", label: "Video", icon: VideoIcon },
  { key: "clinic", label: "Clinic", icon: Building2 },
];

interface Doctor {
  id: number; name: string; specialization: string; experienceYears: number;
  rating: number; totalReviews: number; fee: number; consultationType: string;
  bio: string; qualifications: string; languages: string; city: string;
  imageUrl: string; availableSlots: string; reviews?: Review[];
}

interface Review {
  id: number; reviewerName: string; rating: number; comment: string; createdAt: string;
}

interface Appointment {
  appointment: {
    id: number; patientName: string; date: string; timeSlot: string;
    consultationType: string; status: string; meetingLink: string; amountPaid: number;
  };
  doctor: Doctor | null;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${cls} ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  if (type === "video") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
      <VideoIcon className="w-3 h-3" /> Video
    </span>
  );
  if (type === "clinic") return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
      <Building2 className="w-3 h-3" /> Clinic
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
      <Stethoscope className="w-3 h-3" /> Video + Clinic
    </span>
  );
}

export default function ConsultPage() {
  const { user, token } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [selectedType, setSelectedType] = useState("all");
  const [activeTab, setActiveTab] = useState<"doctors" | "appointments">("doctors");

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [aptLoading, setAptLoading] = useState(false);

  const [form, setForm] = useState({
    patientName: user?.name ?? "", phone: "", date: "", timeSlot: "",
    healthIssue: "", consultationType: "video"
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    const existing = document.getElementById("razorpay-script");
    if (!existing) {
      const s = document.createElement("script");
      s.id = "razorpay-script";
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedSpec !== "All") params.set("specialization", selectedSpec);
    if (selectedType !== "all") params.set("type", selectedType);
    const r = await fetch(`${API}/api/doctors?${params}`);
    if (r.ok) setDoctors(await r.json());
    setLoading(false);
  }, [search, selectedSpec, selectedType]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setAptLoading(true);
    const r = await fetch(`${API}/api/doctors/my/appointments`, { headers });
    if (r.ok) setAppointments(await r.json());
    setAptLoading(false);
  }, [user, token]);

  useEffect(() => {
    if (activeTab === "appointments") fetchAppointments();
  }, [activeTab, fetchAppointments]);

  async function openProfile(doc: Doctor) {
    setProfileLoading(true);
    setSelectedDoctor(doc);
    const r = await fetch(`${API}/api/doctors/${doc.id}`);
    if (r.ok) setSelectedDoctor(await r.json());
    setProfileLoading(false);
  }

  function openBooking(doc: Doctor) {
    setSelectedDoctor(doc);
    setShowBooking(true);
    setBookingSuccess(null);
    setForm(f => ({
      ...f,
      patientName: user?.name ?? "",
      consultationType: doc.consultationType === "clinic" ? "clinic" : "video",
    }));
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoctor) return;
    setBookingLoading(true);
    try {
      const r = await fetch(`${API}/api/doctors/${selectedDoctor.id}/book`, {
        method: "POST", headers,
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { alert(data.error ?? "Booking failed"); return; }

      if (!data.paymentRequired) {
        setBookingSuccess(data.appointment);
        return;
      }

      const { orderId, amount, currency, keyId, appointment } = data;
      const win: any = window;
      if (!win.Razorpay) { alert("Payment gateway loading. Please try again."); return; }

      const rzp = new win.Razorpay({
        key: keyId, amount, currency, order_id: orderId,
        name: "Medi Quick", description: `Consultation with ${selectedDoctor.name}`,
        theme: { color: "#d95f2b" },
        prefill: { name: form.patientName, contact: form.phone, email: user?.email ?? "" },
        handler: async (response: any) => {
          const verifyRes = await fetch(`${API}/api/doctors/appointments/${appointment.id}/verify`, {
            method: "POST", headers,
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setBookingSuccess(verifyData.appointment);
          } else {
            alert("Payment verification failed. Contact support.");
          }
        },
      });
      rzp.open();
    } finally {
      setBookingLoading(false);
    }
  }

  const slotOptions = selectedDoctor?.availableSlots
    ? (() => { try { return JSON.parse(selectedDoctor.availableSlots); } catch { return []; } })()
    : [];

  const topRated = [...doctors].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Stethoscope className="w-4 h-4" /> Doctor Consultation
          </div>
          <h1 className="text-3xl font-bold">Find & Book Doctors</h1>
          <p className="text-muted-foreground">Video & clinic consultations with verified specialists</p>
        </div>

        <div className="flex rounded-2xl bg-secondary/40 p-1 gap-1">
          {[{ k: "doctors", l: "Find Doctors", i: Stethoscope }, { k: "appointments", l: "My Appointments", i: CalendarCheck }].map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.k ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <t.i className="w-4 h-4" /> {t.l}
            </button>
          ))}
        </div>

        {activeTab === "doctors" && (
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctor name or specialization..."
                className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {TYPE_OPTIONS.map(t => (
                <button key={t.key} onClick={() => setSelectedType(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${selectedType === t.key ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {SPECIALIZATIONS.map(s => (
                <button key={s} onClick={() => setSelectedSpec(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${selectedSpec === s ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>

            {!loading && doctors.length > 0 && selectedSpec === "All" && !search && (
              <div>
                <h2 className="font-bold text-base flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-primary fill-primary" /> Top Rated Doctors
                </h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {topRated.map(doc => (
                    <button key={doc.id} onClick={() => openProfile(doc)}
                      className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-3 text-left hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-2 mb-1.5">
                        <img src={doc.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`} alt={doc.name} className="w-8 h-8 rounded-full bg-secondary" />
                        <div>
                          <p className="font-semibold text-xs text-foreground truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1"><StarRating rating={doc.rating} /><span className="text-xs font-bold text-amber-500">{doc.rating}</span></div>
                        <span className="text-xs font-bold text-primary">₹{doc.fee}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-16">
                <Stethoscope className="w-14 h-14 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">No doctors found</p>
                <p className="text-sm text-muted-foreground mt-1">Try changing your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-bold text-base text-muted-foreground text-sm">{doctors.length} Doctors available</h2>
                {doctors.map(doc => (
                  <div key={doc.id} className="bg-card border border-border rounded-3xl p-4 hover:border-primary/30 transition-all">
                    <div className="flex items-start gap-3">
                      <img src={doc.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.id}`} alt={doc.name}
                        className="w-14 h-14 rounded-2xl bg-secondary flex-shrink-0 object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <h3 className="font-bold text-foreground">{doc.name}</h3>
                            <p className="text-sm text-muted-foreground">{doc.specialization} · {doc.experienceYears} yrs exp</p>
                          </div>
                          <TypeBadge type={doc.consultationType} />
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <StarRating rating={doc.rating} />
                            <span className="text-xs font-bold text-amber-500">{doc.rating}</span>
                            <span className="text-xs text-muted-foreground">({doc.totalReviews})</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {doc.city}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <IndianRupee className="w-3.5 h-3.5 text-primary" />
                            <span className="font-bold text-primary text-lg">₹{doc.fee}</span>
                            <span className="text-xs text-muted-foreground">consultation fee</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openProfile(doc)}
                              className="text-xs font-semibold text-primary hover:underline px-2">
                              View Profile
                            </button>
                            <button onClick={() => openBooking(doc)}
                              className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1">
                              <CalendarCheck className="w-3.5 h-3.5" /> Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">My Appointments</h2>
              <button onClick={fetchAppointments} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {!user ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 text-primary/20" />
                <p className="font-semibold">Please login to view appointments</p>
              </div>
            ) : aptLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16">
                <CalendarCheck className="w-14 h-14 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">No appointments yet</p>
                <p className="text-sm text-muted-foreground mt-1">Book a consultation with a doctor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(({ appointment: apt, doctor }) => (
                  <div key={apt.id} className="bg-card border border-border rounded-3xl p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3">
                        {doctor && <img src={doctor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.id}`} className="w-11 h-11 rounded-2xl bg-secondary flex-shrink-0" />}
                        <div>
                          <p className="font-bold text-foreground">{doctor?.name ?? "Doctor"}</p>
                          <p className="text-sm text-muted-foreground">{doctor?.specialization}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.timeSlot}</span>
                            <TypeBadge type={apt.consultationType} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          apt.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                          apt.status === "completed" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span>
                        <p className="text-xs font-bold text-primary">₹{apt.amountPaid}</p>
                      </div>
                    </div>
                    {apt.meetingLink && apt.status === "confirmed" && apt.consultationType !== "clinic" && (
                      <a href={apt.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-2xl text-sm font-semibold transition-all">
                        <VideoIcon className="w-4 h-4" /> Join Video Call <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedDoctor && !showBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-bold text-lg">Doctor Profile</h2>
              <button onClick={() => setSelectedDoctor(null)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-start gap-4">
                <img src={selectedDoctor.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDoctor.id}`}
                  className="w-20 h-20 rounded-2xl bg-secondary flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-xl">{selectedDoctor.name}</h3>
                  <p className="text-primary font-semibold text-sm">{selectedDoctor.specialization}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StarRating rating={selectedDoctor.rating} />
                    <span className="text-sm font-bold text-amber-500">{selectedDoctor.rating}</span>
                    <span className="text-xs text-muted-foreground">({selectedDoctor.totalReviews} reviews)</span>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <TypeBadge type={selectedDoctor.consultationType} />
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{selectedDoctor.city}</span>
                  </div>
                </div>
              </div>

              {profileLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary/40" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Experience", value: `${selectedDoctor.experienceYears} yrs` },
                      { label: "Fee", value: `₹${selectedDoctor.fee}` },
                      { label: "Patients", value: `${selectedDoctor.totalReviews * 4}+` },
                    ].map(s => (
                      <div key={s.label} className="bg-secondary/40 rounded-2xl py-3">
                        <p className="font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {selectedDoctor.bio && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4 text-primary" />About</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedDoctor.bio}</p>
                    </div>
                  )}

                  {selectedDoctor.qualifications && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Award className="w-4 h-4 text-primary" />Qualifications</h4>
                      <p className="text-sm text-muted-foreground">{selectedDoctor.qualifications}</p>
                    </div>
                  )}

                  {selectedDoctor.languages && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Languages className="w-4 h-4 text-primary" />Languages</h4>
                      <div className="flex gap-2 flex-wrap">
                        {selectedDoctor.languages.split(",").map(l => (
                          <span key={l} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{l.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDoctor.reviews && selectedDoctor.reviews.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-primary" />Patient Reviews</h4>
                      <div className="space-y-3">
                        {selectedDoctor.reviews.slice(0, 4).map(r => (
                          <div key={r.id} className="bg-secondary/30 rounded-2xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-foreground">{r.reviewerName}</span>
                              <StarRating rating={r.rating} />
                            </div>
                            <p className="text-xs text-muted-foreground">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border p-4">
              <button onClick={() => openBooking(selectedDoctor)}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                <CalendarCheck className="w-5 h-5" /> Book Appointment — ₹{selectedDoctor.fee}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBooking && selectedDoctor && !bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="font-bold text-lg">Book Appointment</h2>
                <p className="text-xs text-muted-foreground">{selectedDoctor.name} · ₹{selectedDoctor.fee}</p>
              </div>
              <button onClick={() => { setShowBooking(false); setSelectedDoctor(null); }} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleBook} className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Patient Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} required
                      placeholder="Your full name" className="w-full bg-background border border-border rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required type="tel"
                      placeholder="10-digit number" className="w-full bg-background border border-border rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Select Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-background border border-border rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Select Time Slot *</label>
                <div className="grid grid-cols-4 gap-2">
                  {slotOptions.map((s: string) => (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, timeSlot: s }))}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${form.timeSlot === s ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedDoctor.consultationType === "both" || selectedDoctor.consultationType === "video" || selectedDoctor.consultationType === "clinic") && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Consultation Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedDoctor.consultationType !== "clinic" ? [{ k: "video", l: "Video Call", i: VideoIcon }] : [])
                      .concat(selectedDoctor.consultationType !== "video" ? [{ k: "clinic", l: "Clinic Visit", i: Building2 }] : [])
                      .concat(selectedDoctor.consultationType === "both" ? [] : [])
                      .map(opt => (
                        <button key={opt.k} type="button" onClick={() => setForm(f => ({ ...f, consultationType: opt.k }))}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.consultationType === opt.k ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>
                          <opt.i className="w-4 h-4" /> {opt.l}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Health Issue / Symptoms *</label>
                <textarea value={form.healthIssue} onChange={e => setForm(f => ({ ...f, healthIssue: e.target.value }))} required rows={3}
                  placeholder="Describe your health concern or symptoms..."
                  className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Consultation Fee</span>
                <span className="font-bold text-primary text-lg">₹{selectedDoctor.fee}</span>
              </div>

              <button type="submit" disabled={bookingLoading || !form.date || !form.timeSlot || !form.healthIssue}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {bookingLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {bookingLoading ? "Processing..." : "Confirm & Pay ₹" + selectedDoctor.fee}
              </button>
            </form>
          </div>
        </div>
      )}

      {bookingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-border text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold">Appointment Confirmed!</h3>
            <div className="bg-secondary/40 rounded-2xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">{bookingSuccess.date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-semibold">{bookingSuccess.timeSlot}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-semibold capitalize">{bookingSuccess.consultationType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary">₹{bookingSuccess.amountPaid}</span></div>
            </div>
            {bookingSuccess.meetingLink && (
              <a href={bookingSuccess.meetingLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold transition-all">
                <VideoIcon className="w-4 h-4" /> Join Video Call
              </a>
            )}
            <button onClick={() => { setBookingSuccess(null); setShowBooking(false); setSelectedDoctor(null); setActiveTab("appointments"); }}
              className="w-full py-3 rounded-2xl border border-border text-sm font-semibold hover:bg-secondary/40 transition-colors">
              View My Appointments
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
