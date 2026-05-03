import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import {
  Store, Plus, Trash2, Package, CreditCard, Crown, CheckCircle2,
  AlertTriangle, Loader2, X, ChevronRight, Pill, Star, Zap, Infinity,
  ShoppingBag, BadgeCheck, RefreshCw
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const PLANS = [
  {
    key: "basic",
    name: "Basic",
    icon: Star,
    price: 199,
    limit: 50,
    color: "border-blue-400 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    btnColor: "bg-blue-600 hover:bg-blue-700 text-white",
    features: ["Add up to 50 medicines", "Medicine inventory management", "Stock tracking", "Category wise listing"],
  },
  {
    key: "pro",
    name: "Pro",
    icon: Zap,
    price: 499,
    limit: 200,
    color: "border-primary bg-primary/5",
    badge: "bg-primary/15 text-primary",
    btnColor: "bg-primary hover:bg-primary/90 text-white",
    popular: true,
    features: ["Add up to 200 medicines", "Everything in Basic", "Priority listing", "Sales analytics (coming soon)"],
  },
  {
    key: "unlimited",
    name: "Unlimited",
    icon: Infinity,
    price: 999,
    limit: -1,
    color: "border-amber-400 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    btnColor: "bg-amber-500 hover:bg-amber-600 text-white",
    features: ["Unlimited medicine uploads", "Everything in Pro", "Dedicated support", "Custom store profile"],
  },
];

const CATEGORIES = ["General", "Pain Relief", "Antibiotics", "Vitamins", "Diabetes", "Heart", "Skin Care", "Eye Care", "Ayurvedic", "Homeopathic", "Other"];
const UNITS = ["strip", "bottle", "box", "tablet", "capsule", "injection", "syrup", "cream", "gel", "drops"];

interface Medicine {
  id: number; name: string; category: string; price: number;
  stock: number; unit: string; description: string; manufacturer: string;
}
interface Status { plan: string; limit: number; used: number; subscription?: { expiryDate: string } | null; }

export default function ShopkeeperPage() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<"medicines" | "plans">("medicines");
  const [status, setStatus] = useState<Status | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", category: "General", price: "", stock: "", unit: "strip", description: "", manufacturer: "" });
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

  const fetchMedicines = useCallback(async () => {
    const r = await fetch(`${API}/api/shopkeeper/medicines`, { headers });
    if (r.ok) setMedicines(await r.json());
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (user) { fetchStatus(); fetchMedicines(); }
  }, [user, fetchStatus, fetchMedicines]);

  async function handleAddMedicine(e: React.FormEvent) {
    e.preventDefault();
    setFormError(""); setFormLoading(true);
    try {
      const r = await fetch(`${API}/api/shopkeeper/medicines`, {
        method: "POST", headers,
        body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.error === "limit_reached") { setShowUpgradeModal(true); setShowAddForm(false); }
        else setFormError(data.error ?? "Failed to add medicine");
        return;
      }
      setMedicines(prev => [data, ...prev]);
      setStatus(prev => prev ? { ...prev, used: prev.used + 1 } : prev);
      setForm({ name: "", category: "General", price: "", stock: "", unit: "strip", description: "", manufacturer: "" });
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
        key: keyId, amount, currency,
        order_id: orderId,
        name: "Medi Quick",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan — 1 Month`,
        theme: { color: "#d95f2b" },
        prefill: { name: user?.name ?? "", email: user?.email ?? "" },
        method: { upi: true, card: true, netbanking: true, wallet: true, emi: false, paylater: false },
        ...(autopay ? { recurring: 1 } : {}),
        handler: async function (response: any) {
          const verifyRes = await fetch(`${API}/api/shopkeeper/payment/verify`, {
            method: "POST", headers,
            body: JSON.stringify({ ...response, plan: planKey }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            await fetchStatus();
            setTab("medicines");
            alert("🎉 Subscription activated successfully!");
          } else {
            alert("Payment verification failed. Contact support.");
          }
        },
      });
      rzp.open();
    } finally { setPaymentLoading(null); }
  }

  const planInfo = PLANS.find(p => p.key === status?.plan);
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
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Shopkeeper Panel</h1>
            </div>
            <p className="text-muted-foreground text-sm">Manage your medicine inventory and subscription</p>
          </div>
          {status && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm capitalize">{status.plan} Plan</span>
              {status.subscription?.expiryDate && (
                <span className="text-xs text-muted-foreground">· expires {new Date(status.subscription.expiryDate).toLocaleDateString("en-IN")}</span>
              )}
            </div>
          )}
        </div>

        {status && (
          <div className="bg-card border border-border rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Medicine Slots</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {status.used} / {status.limit === -1 ? "∞" : status.limit} used
              </span>
            </div>
            {status.limit !== -1 && (
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${usedPct}%` }} />
              </div>
            )}
            {status.limit !== -1 && usedPct >= 80 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Running low on slots
                </p>
                <button onClick={() => setTab("plans")} className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                  Upgrade <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex rounded-2xl bg-secondary/40 p-1 gap-1">
          {[{ key: "medicines", label: "My Medicines", icon: Pill }, { key: "plans", label: "Subscription Plans", icon: CreditCard }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "medicines" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{medicines.length} Medicines</h2>
              <button
                onClick={() => {
                  if (status && status.limit !== -1 && status.used >= status.limit) { setShowUpgradeModal(true); return; }
                  setShowAddForm(true);
                }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
            </div>

            {showAddForm && (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg">Add New Medicine</h3>
                  <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleAddMedicine} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Medicine Name *</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required minLength={2} placeholder="e.g. Paracetamol 500mg"
                        className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Manufacturer</label>
                      <input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. Sun Pharma"
                        className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Category</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Unit</label>
                      <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                        className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Price (₹)</label>
                      <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00"
                        className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Stock Quantity</label>
                      <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0"
                        className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional notes..."
                      className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
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
                <p className="font-semibold text-foreground">No medicines added yet</p>
                <p className="text-sm text-muted-foreground">Click "Add Medicine" to start building your inventory</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medicines.map(med => (
                  <div key={med.id} className="bg-card border border-border rounded-2xl p-4 flex items-start justify-between gap-3 hover:border-primary/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{med.name}</span>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{med.category}</span>
                      </div>
                      {med.manufacturer && <p className="text-xs text-muted-foreground mt-0.5">{med.manufacturer}</p>}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-bold text-primary">₹{med.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">{med.stock} {med.unit}(s) in stock</span>
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

        {tab === "plans" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Subscription Plans</h2>
              <p className="text-muted-foreground text-sm mt-1">Upgrade to add more medicines to your inventory</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-emerald-800">Autopay / Auto-renew</div>
                  <div className="text-xs text-emerald-600">Subscription expire hone par automatic renew ho jayegi</div>
                </div>
              </div>
              <button
                onClick={() => setAutopay(p => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${autopay ? "bg-emerald-500" : "bg-gray-300"}`}
              >
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

            <div className="grid sm:grid-cols-3 gap-4">
              {PLANS.map(plan => {
                const PlanIcon = plan.icon;
                const isActive = status?.plan === plan.key;
                const buying = paymentLoading === plan.key;
                return (
                  <div key={plan.key} className={`relative rounded-3xl border-2 p-5 space-y-4 transition-all ${plan.color} ${isActive ? "ring-2 ring-primary shadow-lg" : ""}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute -top-3 right-4">
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${plan.badge}`}>
                        <PlanIcon className="w-3.5 h-3.5 inline mr-1" />{plan.name}
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">₹{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                      <div className="text-sm text-muted-foreground mt-0.5">{plan.limit === -1 ? "Unlimited medicines" : `Up to ${plan.limit} medicines`}</div>
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => !isActive && handleBuyPlan(plan.key)}
                      disabled={isActive || buying}
                      className={`w-full py-2.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${isActive ? "bg-green-100 text-green-700 cursor-default" : plan.btnColor} ${buying ? "opacity-70" : "active:scale-95"}`}
                    >
                      {buying && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isActive ? "Current Plan" : buying ? "Processing..." : "Buy Plan"}
                    </button>
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

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-xl border border-border text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold">Medicine Limit Reached!</h3>
            <p className="text-muted-foreground text-sm">
              You've used all <strong>{status?.limit}</strong> medicine slots on your <strong className="capitalize">{status?.plan}</strong> plan.
              Upgrade to add more medicines.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowUpgradeModal(false); setTab("plans"); }}
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
