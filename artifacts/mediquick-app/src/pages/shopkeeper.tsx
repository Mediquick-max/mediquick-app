import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import {
  Store, Plus, Trash2, Package, Crown, CheckCircle2,
  AlertTriangle, Loader2, X, Pill, Star, Zap, Infinity,
  ShoppingBag, BadgeCheck, RefreshCw, TrendingUp, MapPin,
  Phone, Navigation, Save, Edit3, Wallet, CreditCard,
  Landmark, ShieldCheck, IndianRupee, AlertCircle, Tag
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const PLANS = [
  {
    key: "basic", name: "Basic", icon: Star, price: 199, limit: 50,
    grad: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    features: ["Add up to 50 medicines", "Medicine inventory management", "Stock tracking", "Category wise listing"],
  },
  {
    key: "pro", name: "Pro", icon: Zap, price: 499, limit: 200, popular: true,
    grad: "linear-gradient(135deg, #d95f2b, #b84c1e)",
    features: ["Add up to 200 medicines", "Everything in Basic", "Priority listing", "Sales analytics (coming soon)"],
  },
  {
    key: "unlimited", name: "Unlimited", icon: Infinity, price: 999, limit: -1,
    grad: "linear-gradient(135deg, #a855f7, #7c3aed)",
    features: ["Unlimited medicine uploads", "Everything in Pro", "Dedicated support", "Custom store profile"],
  },
];

const CATEGORIES = ["General", "Pain Relief", "Antibiotics", "Vitamins", "Diabetes", "Heart", "Skin Care", "Eye Care", "Ayurvedic", "Homeopathic", "Other"];
const UNITS = ["strip", "bottle", "box", "tablet", "capsule", "injection", "syrup", "cream", "gel", "drops"];

interface Medicine {
  id: number; name: string; category: string; price: number;
  stock: number; unit: string; description: string; manufacturer: string;
}
interface ShopProfile {
  id: number; shopName: string; shopAddress: string; shopPhone: string;
  lat: number | null; lng: number | null; city: string; pincode: string;
  paymentMethod: string; upiId: string;
  bankAccountHolder: string; bankAccountNumber: string; bankIfscCode: string; bankName: string;
}
interface Status {
  plan: string; limit: number; used: number;
  subscription?: { expiryDate: string } | null;
  user: { id: number; name: string; email: string };
}

export default function ShopkeeperPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "medicines" | "payments" | "plans">("dashboard");

  const [status, setStatus] = useState<Status | null>(null);
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({ shopName: "", shopAddress: "", shopPhone: "", city: "", pincode: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);

  const [paymentForm, setPaymentForm] = useState({ paymentMethod: "upi", upiId: "", bankAccountHolder: "", bankAccountNumber: "", bankIfscCode: "", bankName: "" });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [medForm, setMedForm] = useState({ name: "", category: "General", price: "", stock: "", unit: "strip", description: "", manufacturer: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [autopay, setAutopay] = useState(true);

  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    const existing = document.getElementById("razorpay-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    const r = await fetch(`${API}/api/shopkeeper/status`, { headers });
    if (r.ok) setStatus(await r.json());
  }, [token]);

  const fetchProfile = useCallback(async () => {
    const r = await fetch(`${API}/api/shopkeeper/profile`, { headers });
    if (r.ok) {
      const p = await r.json();
      if (p) {
        setProfile(p);
        setProfileForm({ shopName: p.shopName ?? "", shopAddress: p.shopAddress ?? "", shopPhone: p.shopPhone ?? "", city: p.city ?? "", pincode: p.pincode ?? "" });
        setGeoLat(p.lat); setGeoLng(p.lng);
        setPaymentForm({ paymentMethod: p.paymentMethod ?? "upi", upiId: p.upiId ?? "", bankAccountHolder: p.bankAccountHolder ?? "", bankAccountNumber: p.bankAccountNumber ?? "", bankIfscCode: p.bankIfscCode ?? "", bankName: p.bankName ?? "" });
      } else {
        setProfileEditMode(true);
      }
    }
  }, [token]);

  const fetchMedicines = useCallback(async () => {
    const r = await fetch(`${API}/api/shopkeeper/medicines`, { headers });
    if (r.ok) setMedicines(await r.json());
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (user) { fetchStatus(); fetchProfile(); fetchMedicines(); }
  }, [user, fetchStatus, fetchProfile, fetchMedicines]);

  async function handleSaveProfile() {
    setProfileSaving(true);
    try {
      const r = await fetch(`${API}/api/shopkeeper/profile`, {
        method: "PUT", headers,
        body: JSON.stringify({ ...profileForm, lat: geoLat, lng: geoLng }),
      });
      if (r.ok) {
        const p = await r.json();
        setProfile(p);
        setProfileEditMode(false);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } finally { setProfileSaving(false); }
  }

  async function handleSavePayment() {
    setPaymentSaving(true);
    try {
      const r = await fetch(`${API}/api/shopkeeper/profile`, {
        method: "PUT", headers,
        body: JSON.stringify(paymentForm),
      });
      if (r.ok) {
        const p = await r.json();
        setProfile(p);
        setPaymentSaved(true);
        setTimeout(() => setPaymentSaved(false), 3000);
      }
    } finally { setPaymentSaving(false); }
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setGeoLat(lat); setGeoLng(lng);
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, { headers: { "Accept-Language": "en" } });
        const d = await r.json();
        const a = d.address ?? {};
        const city = a.city ?? a.town ?? a.village ?? "";
        const pincode = a.postcode ?? "";
        const road = a.road ?? a.suburb ?? "";
        setProfileForm(f => ({ ...f, city, pincode, shopAddress: `${road}, ${city}`.replace(/^,\s*/, "") }));
      } catch {}
      setGeoLoading(false);
    }, () => setGeoLoading(false));
  }

  async function handleAddMedicine(e: React.FormEvent) {
    e.preventDefault();
    setFormError(""); setFormLoading(true);
    try {
      const r = await fetch(`${API}/api/shopkeeper/medicines`, {
        method: "POST", headers,
        body: JSON.stringify({ ...medForm, price: Number(medForm.price), stock: Number(medForm.stock) }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.error === "limit_reached") { setShowUpgradeModal(true); setShowAddForm(false); }
        else setFormError(data.error ?? "Failed to add medicine");
        return;
      }
      setMedicines(prev => [data, ...prev]);
      setStatus(prev => prev ? { ...prev, used: prev.used + 1 } : prev);
      setMedForm({ name: "", category: "General", price: "", stock: "", unit: "strip", description: "", manufacturer: "" });
      setShowAddForm(false);
    } finally { setFormLoading(false); }
  }

  async function handleDelete(id: number) {
    setDeleteId(id);
    const r = await fetch(`${API}/api/shopkeeper/medicines/${id}`, { method: "DELETE", headers });
    if (r.ok) {
      setMedicines(prev => prev.filter(m => m.id !== id));
      setStatus(prev => prev ? { ...prev, used: Math.max(0, prev.used - 1) } : prev);
    }
    setDeleteId(null);
  }

  async function handleBuyPlan(planKey: string) {
    setPaymentLoading(planKey);
    try {
      const r = await fetch(`${API}/api/shopkeeper/payment/order`, {
        method: "POST", headers, body: JSON.stringify({ plan: planKey, autopay }),
      });
      const data = await r.json();
      if (!r.ok) { alert(data.error ?? "Failed to create order"); return; }
      const { orderId, amount, currency, keyId } = data;
      const win: any = window;
      if (!win.Razorpay) { alert("Payment gateway loading failed. Please refresh and try again."); return; }
      const rzp = new win.Razorpay({
        key: keyId, amount, currency, order_id: orderId,
        name: "Medi Quick",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan — 1 Month`,
        theme: { color: "#d95f2b" },
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        method: { upi: true, card: true, netbanking: true, wallet: true, emi: false, paylater: false },
        handler: async function (response: any) {
          const verifyRes = await fetch(`${API}/api/shopkeeper/payment/verify`, {
            method: "POST", headers, body: JSON.stringify({ ...response, plan: planKey }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            await fetchStatus();
            setActiveTab("dashboard");
            alert("Subscription activated successfully!");
          } else {
            alert("Payment verification failed. Contact support.");
          }
        },
      });
      rzp.open();
    } finally { setPaymentLoading(null); }
  }

  const usedPct = status ? (status.limit === -1 ? 100 : Math.min(100, (status.used / status.limit) * 100)) : 0;
  const barColor = usedPct >= 90 ? "bg-red-500" : usedPct >= 70 ? "bg-amber-500" : "bg-primary";

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <Store className="w-16 h-16 text-primary/40" />
          <h2 className="text-2xl font-bold">Shopkeeper Panel</h2>
          <p className="text-muted-foreground">Please log in to access the Shopkeeper Panel</p>
          <Link href="/login" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-2xl font-semibold hover:bg-primary/90 transition-colors">
            Login to Continue
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-16">

        {/* Header */}
        <div className="bg-white border-b border-border/50 sticky top-0 z-10">
          <div className="px-4 pt-4 pb-0">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">Shopkeeper Panel</h1>
                  <p className="text-xs text-muted-foreground">{profile?.shopName || user?.name || "My Store"}</p>
                </div>
              </div>
              {status && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold text-xs text-amber-700 capitalize">{status.plan} Plan</span>
                </div>
              )}
            </div>

            <div className="flex overflow-x-auto scrollbar-hide gap-0 -mx-4 px-4">
              {[
                { id: "dashboard", label: "Dashboard", icon: TrendingUp },
                { id: "profile", label: "My Profile", icon: Store },
                { id: "medicines", label: `Medicines${status ? ` (${status.used})` : ""}`, icon: Pill },
                { id: "payments", label: "Payment Details", icon: Wallet },
                { id: "plans", label: "Subscription Plans", icon: Crown },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-5">

          {/* ── DASHBOARD ── */}
          {activeTab === "dashboard" && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Medicines Listed", value: status?.used ?? 0, icon: Pill, color: "blue" },
                  { label: "Slots Remaining", value: status ? (status.limit === -1 ? "∞" : Math.max(0, status.limit - status.used)) : "—", icon: Package, color: "emerald" },
                  { label: "Active Plan", value: <span className="capitalize">{status?.plan ?? "Free"}</span>, icon: Crown, color: "amber" },
                  { label: "Plan Expires", value: status?.subscription?.expiryDate ? new Date(status.subscription.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—", icon: BadgeCheck, color: "purple" },
                ].map((s, i) => {
                  const colorMap: Record<string, string> = {
                    blue: "bg-blue-50 text-blue-600",
                    emerald: "bg-emerald-50 text-emerald-600",
                    amber: "bg-amber-50 text-amber-600",
                    purple: "bg-purple-50 text-purple-600",
                  };
                  return (
                    <div key={i} className="bg-white rounded-3xl border border-border/50 shadow-sm p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${colorMap[s.color]}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-black">{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Medicine Slots Progress */}
              {status && status.limit !== -1 && (
                <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm">Medicine Slots</span>
                    <span className="text-sm font-bold">{status.used} / {status.limit} used</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${usedPct}%` }} />
                  </div>
                  {usedPct >= 80 && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Running low on slots
                      </p>
                      <button onClick={() => setActiveTab("plans")} className="text-xs font-semibold text-primary hover:underline">
                        Upgrade Plan
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Shop Profile Card */}
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Shop Details</h3>
                  <button onClick={() => setActiveTab("profile")} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                {profile ? (
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-start gap-2.5">
                      <Store className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="font-medium">{profile.shopName || "—"}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{profile.shopAddress || "—"}{profile.city ? `, ${profile.city}` : ""}{profile.pincode ? ` — ${profile.pincode}` : ""}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{profile.shopPhone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {profile.lat ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-2.5 py-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Location set — visible to patients
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-xl px-2.5 py-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" /> Location not set
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Shop profile not set up yet.</p>
                    <button onClick={() => setActiveTab("profile")} className="mt-2 text-sm font-semibold text-primary hover:underline">
                      Setup Now
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Status */}
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-600" /> Payment Details</h3>
                  <button onClick={() => setActiveTab("payments")} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                {profile && (profile.upiId || profile.bankAccountNumber) ? (
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method</span>
                      <span className="font-semibold capitalize">{profile.paymentMethod === "upi" ? "UPI" : "Bank Account"}</span>
                    </div>
                    {profile.paymentMethod === "upi" && profile.upiId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UPI ID</span>
                        <span className="font-semibold">{profile.upiId}</span>
                      </div>
                    )}
                    {profile.paymentMethod === "bank" && profile.bankAccountNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">A/C</span>
                        <span className="font-semibold">••••{profile.bankAccountNumber.slice(-4)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-2xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Payment details not set. Add them to receive payouts.
                  </div>
                )}
              </div>

              {/* Shopkeeper Discount Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-start gap-3">
                <Tag className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-800 text-sm">5% Doctor Plan Discount Active!</div>
                  <div className="text-emerald-700 text-xs mt-1">
                    Aap Shopkeeper Panel ke member hain. Doctor Consultation subscription plans mein aapko 5% extra discount milega.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MY PROFILE ── */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              {profileSaved && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl px-4 py-3 text-sm">
                  <ShieldCheck className="w-4 h-4" /> Profile saved successfully!
                </div>
              )}

              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" /> Shop Information
                  </h2>
                  {profile && !profileEditMode && (
                    <button onClick={() => setProfileEditMode(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 text-xs text-muted-foreground">
                  Apni shop ka profile setup karein. Patients aapki location ke 5km andar apki medicines order kar sakte hain.
                </div>

                {profileEditMode || !profile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Shop Name *</label>
                        <input value={profileForm.shopName} onChange={e => setProfileForm(f => ({ ...f, shopName: e.target.value }))}
                          placeholder="e.g. Sharma Medical Store"
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Contact Phone *</label>
                        <input value={profileForm.shopPhone} onChange={e => setProfileForm(f => ({ ...f, shopPhone: e.target.value }))} type="tel"
                          placeholder="10-digit mobile number"
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Shop Address</label>
                        <input value={profileForm.shopAddress} onChange={e => setProfileForm(f => ({ ...f, shopAddress: e.target.value }))}
                          placeholder="Street address"
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">City</label>
                        <input value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="City name"
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Pincode</label>
                        <input value={profileForm.pincode} onChange={e => setProfileForm(f => ({ ...f, pincode: e.target.value }))}
                          placeholder="6-digit pincode"
                          className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      </div>
                    </div>

                    <button onClick={detectLocation} disabled={geoLoading}
                      className="flex items-center gap-2 text-sm font-semibold text-blue-600 px-4 py-2.5 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors w-full justify-center">
                      {geoLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Detecting location...</> : <><Navigation className="w-4 h-4" /> Detect My Shop Location (for delivery range)</>}
                    </button>

                    {geoLat && geoLng && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 rounded-xl p-2.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Location set: {geoLat.toFixed(4)}, {geoLng.toFixed(4)} — patients within 5km will see your store
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={handleSaveProfile} disabled={profileSaving || !profileForm.shopName}
                        className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-2xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {profileSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Profile</>}
                      </button>
                      {profile && (
                        <button onClick={() => setProfileEditMode(false)}
                          className="px-4 py-2.5 rounded-2xl border border-border text-sm font-semibold hover:bg-secondary/40 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Shop Name", value: profile.shopName },
                      { label: "Phone", value: profile.shopPhone },
                      { label: "Address", value: profile.shopAddress },
                      { label: "City", value: profile.city },
                      { label: "Pincode", value: profile.pincode },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-start gap-3">
                        <span className="text-muted-foreground shrink-0">{row.label}</span>
                        <span className="font-semibold text-right">{row.value || "—"}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      {profile.lat ? (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 rounded-xl px-2.5 py-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Location set — visible to patients within 5km
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-700 bg-amber-50 rounded-xl px-2.5 py-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" /> Location not set — click Edit to add location
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MY MEDICINES ── */}
          {activeTab === "medicines" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">{medicines.length} Medicines Listed</h2>
                <button
                  onClick={() => {
                    if (status && status.limit !== -1 && status.used >= status.limit) { setShowUpgradeModal(true); return; }
                    setShowAddForm(true);
                  }}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Add Medicine
                </button>
              </div>

              {status && (
                <div className="bg-secondary/40 rounded-2xl p-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Slots used: <strong className="text-foreground">{status.used} / {status.limit === -1 ? "∞" : status.limit}</strong></span>
                  {status.limit !== -1 && status.used >= status.limit && (
                    <button onClick={() => setActiveTab("plans")} className="text-xs font-bold text-primary hover:underline">Upgrade Plan</button>
                  )}
                </div>
              )}

              {showAddForm && (
                <div className="bg-white border border-border rounded-3xl p-5 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base">Add New Medicine</h3>
                    <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleAddMedicine} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Medicine Name *</label>
                        <input value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))} required minLength={2} placeholder="e.g. Paracetamol 500mg"
                          className="w-full bg-secondary/30 border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Manufacturer</label>
                        <input value={medForm.manufacturer} onChange={e => setMedForm(f => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. Sun Pharma"
                          className="w-full bg-secondary/30 border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Category</label>
                        <select value={medForm.category} onChange={e => setMedForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full bg-secondary/30 border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Unit</label>
                        <select value={medForm.unit} onChange={e => setMedForm(f => ({ ...f, unit: e.target.value }))}
                          className="w-full bg-secondary/30 border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Price (₹) *</label>
                        <input type="number" min="0" step="0.01" value={medForm.price} onChange={e => setMedForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00"
                          className="w-full bg-secondary/30 border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">Stock Quantity</label>
                        <input type="number" min="0" value={medForm.stock} onChange={e => setMedForm(f => ({ ...f, stock: e.target.value }))} placeholder="0"
                          className="w-full bg-secondary/30 border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">Description</label>
                      <textarea value={medForm.description} onChange={e => setMedForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional notes..."
                        className="w-full bg-secondary/30 border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                    </div>
                    {formError && <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 text-destructive text-sm">{formError}</div>}
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 border border-border py-2.5 rounded-2xl text-sm font-semibold hover:bg-secondary/50 transition-colors">Cancel</button>
                      <button type="submit" disabled={formLoading} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-2xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                        {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {formLoading ? "Adding..." : "Add Medicine"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
              ) : medicines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <ShoppingBag className="w-14 h-14 text-primary/20" />
                  <p className="font-semibold">No medicines added yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add Medicine" to start building your inventory</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {medicines.map(med => (
                    <div key={med.id} className="bg-white border border-border/50 rounded-2xl p-4 flex items-start justify-between gap-3 hover:border-primary/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{med.name}</span>
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{med.category}</span>
                        </div>
                        {med.manufacturer && <p className="text-xs text-muted-foreground mt-0.5">{med.manufacturer}</p>}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="font-bold text-primary">₹{med.price.toFixed(2)}</span>
                          <span className="text-muted-foreground">{med.stock} {med.unit}(s)</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(med.id)} disabled={deleteId === med.id}
                        className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 p-2 rounded-xl transition-colors disabled:opacity-50">
                        {deleteId === med.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENT DETAILS ── */}
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
                    Medicine order ki earnings is account mein transfer ki jaayegi. Sahi bank/UPI details bharein taaki payout seamlessly ho.
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
                        placeholder="yourshop@upi / 9876543210@ybl"
                        className="w-full px-3 py-2.5 rounded-2xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">Google Pay, PhonePe, Paytm, BHIM — koi bhi UPI ID chal sakta hai</p>
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
                    { label: "Delivery charge per order", value: "₹5 per 100m" },
                    { label: "Platform fee", value: "₹1 per 100m", color: "text-orange-600" },
                    { label: "Your payout per 100m", value: "₹4", color: "text-emerald-700", bold: true },
                  ].map(row => (
                    <div key={row.label} className={`flex items-center justify-between text-sm ${row.bold ? "border-t border-border/50 pt-2 font-bold" : ""}`}>
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={row.color ?? "font-medium"}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * Payouts are processed every week to your registered account
                </p>
              </div>
            </div>
          )}

          {/* ── SUBSCRIPTION PLANS ── */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold">
                  <Crown className="w-4 h-4" /> Shopkeeper Subscription Plans
                </div>
                <h2 className="text-2xl font-bold">Apna Plan Chuno</h2>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                  Zyada medicines list karo aur zyada patients tak pahuncho.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-emerald-800">Autopay / Auto-renew</div>
                    <div className="text-xs text-emerald-600">Subscription expire hone par automatic renew ho jayegi</div>
                  </div>
                </div>
                <button onClick={() => setAutopay(p => !p)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${autopay ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${autopay ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="bg-secondary/40 rounded-2xl p-4 flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Current Plan: <span className="text-primary capitalize">{status?.plan ?? "Free"}</span></p>
                  <p className="text-xs text-muted-foreground">{status?.used ?? 0} / {status?.limit === -1 ? "∞" : status?.limit ?? 10} medicines used</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PLANS.map(plan => {
                  const PlanIcon = plan.icon;
                  const isActive = status?.plan === plan.key;
                  const buying = paymentLoading === plan.key;
                  return (
                    <div key={plan.key} className={`rounded-3xl border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col ${isActive ? "border-primary scale-[1.02]" : "border-border/50"}`}>
                      {plan.popular && (
                        <div className="bg-primary/10 text-primary text-xs font-bold text-center py-1.5">
                          Most Popular
                        </div>
                      )}
                      <div style={{ background: plan.grad }} className="p-5 text-white">
                        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                          <PlanIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="font-bold text-xl">{plan.name}</div>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-2xl font-black">₹{plan.price}</span>
                          <span className="text-white/70 text-sm">/ month</span>
                        </div>
                        <div className="mt-1.5 text-xs text-white/80">
                          {plan.limit === -1 ? "Unlimited medicines" : `Up to ${plan.limit} medicines`}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col bg-white">
                        <ul className="space-y-2.5 flex-1">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4">
                          {isActive ? (
                            <div className="w-full py-2.5 rounded-2xl text-sm font-bold text-center bg-emerald-50 text-emerald-700 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Current Plan
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBuyPlan(plan.key)}
                              disabled={!!buying}
                              className="w-full py-2.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                              style={{ background: plan.grad }}>
                              {buying && <Loader2 className="w-4 h-4 animate-spin" />}
                              {buying ? "Processing..." : `Buy ${plan.name}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-secondary/30 rounded-2xl p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Important notes:</p>
                <p>• All plans are billed monthly and auto-expire after 30 days</p>
                <p>• Payments are processed securely via Razorpay</p>
                <p>• Free plan allows up to 10 medicines permanently</p>
                <p>• Contact support if you face any payment issues</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-xl border border-border text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold">Medicine Limit Reached!</h3>
            <p className="text-muted-foreground text-sm">
              You've used all <strong>{status?.limit}</strong> medicine slots on your <strong className="capitalize">{status?.plan}</strong> plan. Upgrade to add more medicines.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowUpgradeModal(false); setActiveTab("plans"); }}
                className="bg-primary text-primary-foreground py-3 rounded-2xl font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" /> Upgrade Plan
              </button>
              <button onClick={() => setShowUpgradeModal(false)} className="py-3 rounded-2xl text-muted-foreground hover:text-foreground text-sm transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
