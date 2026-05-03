import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { useGeolocation } from "@/lib/use-geolocation";
import {
  FlaskConical, Search, CheckCircle2, Clock, Home as HomeIcon,
  ChevronRight, Loader2, X, User, MapPin, Calendar,
  Shield, FileText, Package, RefreshCw, Microscope,
  Heart, Droplets, Brain, Bone, Baby, Activity, CreditCard, Banknote, Tag,
  Store, ShoppingCart, Plus, Minus, ShoppingBag, Filter, Pill
} from "lucide-react";

const LAB_PLAN_DISCOUNTS: Record<string, number> = {
  free: 0, gold: 0.02, platinum: 0.05, yearly: 0.10,
};
const LAB_PLAN_LABELS: Record<string, string> = {
  gold: "2% off (Gold Plan)", platinum: "5% off (Platinum Plan)", yearly: "10% off (Yearly Plan)",
};

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const LAB_PACKAGES = [
  {
    id: "full-body", name: "Full Body Checkup", icon: Activity, color: "bg-orange-50 text-orange-600 border-orange-200",
    price: 899, originalPrice: 1499, discount: 40,
    includes: ["CBC (Blood Count)", "Liver Function", "Kidney Function", "Thyroid (TSH)", "Blood Sugar (Fasting)", "Lipid Profile", "Urine Routine"],
    reportTime: "24 hours", tests: 7, popular: true, tag: "Most Popular",
    description: "Complete health overview. Ideal for annual checkup.",
  },
  {
    id: "diabetes", name: "Diabetes Care Package", icon: Droplets, color: "bg-blue-50 text-blue-600 border-blue-200",
    price: 499, originalPrice: 799, discount: 38,
    includes: ["HbA1c (3-month avg sugar)", "Fasting Blood Sugar", "PP Blood Sugar", "Kidney Function", "Urine Microalbumin"],
    reportTime: "12 hours", tests: 5, popular: false, tag: "Best for Diabetics",
    description: "Comprehensive diabetes monitoring and risk assessment.",
  },
  {
    id: "fever", name: "Fever & Infection Panel", icon: Brain, color: "bg-red-50 text-red-600 border-red-200",
    price: 699, originalPrice: 1099, discount: 36,
    includes: ["CBC with Differential", "CRP (Inflammation)", "Malaria Antigen", "Dengue NS1 + IgG/IgM", "Typhoid (Widal)", "ESR"],
    reportTime: "Same day", tests: 6, popular: true, tag: "Urgent Available",
    description: "Detect infections, dengue, malaria and typhoid quickly.",
  },
  {
    id: "cardiac", name: "Heart Health Package", icon: Heart, color: "bg-pink-50 text-pink-600 border-pink-200",
    price: 799, originalPrice: 1299, discount: 38,
    includes: ["Lipid Profile", "ECG", "Troponin I", "CRP (hs)", "HbA1c", "Homocysteine"],
    reportTime: "24 hours", tests: 6, popular: false, tag: "Heart Care",
    description: "Assess cardiovascular risk and heart health.",
  },
  {
    id: "thyroid", name: "Thyroid Profile", icon: Activity, color: "bg-purple-50 text-purple-600 border-purple-200",
    price: 299, originalPrice: 499, discount: 40,
    includes: ["TSH (Thyroid Stimulating Hormone)", "T3 (Triiodothyronine)", "T4 (Thyroxine)", "Free T3", "Free T4"],
    reportTime: "12 hours", tests: 5, popular: false, tag: "Women Special",
    description: "Detect thyroid disorders, hypothyroid and hyperthyroid.",
  },
  {
    id: "vitamins", name: "Vitamin & Mineral Check", icon: Bone, color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    price: 599, originalPrice: 999, discount: 40,
    includes: ["Vitamin D3", "Vitamin B12", "Iron Studies", "Calcium", "Magnesium", "Zinc"],
    reportTime: "24 hours", tests: 6, popular: false, tag: "Deficiency Check",
    description: "Check for common vitamin and mineral deficiencies.",
  },
  {
    id: "womens-health", name: "Women's Health Package", icon: Baby, color: "bg-rose-50 text-rose-600 border-rose-200",
    price: 999, originalPrice: 1699, discount: 41,
    includes: ["CBC", "Thyroid Profile", "Vitamin D3 & B12", "Iron Studies", "Hormones (FSH/LH)", "PCOD Screen", "CA-125"],
    reportTime: "24 hours", tests: 7, popular: true, tag: "Women Special",
    description: "Complete hormonal and health assessment for women.",
  },
  {
    id: "kidney", name: "Kidney Function Test", icon: Droplets, color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    price: 349, originalPrice: 549, discount: 36,
    includes: ["Serum Creatinine", "BUN (Blood Urea Nitrogen)", "Uric Acid", "eGFR", "Electrolytes", "Urine Routine"],
    reportTime: "12 hours", tests: 6, popular: false, tag: "Kidney Care",
    description: "Monitor kidney function and detect early kidney disease.",
  },
];

const FEATURES = [
  { icon: HomeIcon, title: "Home Sample Collection", desc: "Phlebotomist aapke ghar aayega", color: "text-primary" },
  { icon: Clock, title: "Reports in 12-24 Hours", desc: "Same day results available", color: "text-blue-600" },
  { icon: Shield, title: "NABL Certified Labs", desc: "Government accredited labs", color: "text-emerald-600" },
  { icon: FileText, title: "Digital Reports", desc: "WhatsApp & email par milenge", color: "text-violet-600" },
];

interface Booking {
  id: number; title: string; patientName: string; dateSlot: string;
  status: string; amount: number; notes: string; createdAt: string;
}

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const defaultDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}T08:00`;

interface Medicine {
  id: number; name: string; category: string; price: number;
  stock: number; unit: string; description: string; manufacturer: string;
}
interface CartItem { medicine: Medicine; qty: number; }

export default function LabTestsPage() {
  const { user, token } = useAuth();
  const geo = useGeolocation();
  const [search, setSearch] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<typeof LAB_PACKAGES[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"tests" | "bookings" | "store">("tests");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [form, setForm] = useState({
    patientName: user?.name ?? "",
    phone: "",
    address: geo.location ? `${geo.location.city}, ${geo.location.pincode}` : "",
    dateSlot: defaultDate,
    paymentMethod: "online" as "online" | "cash",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Medical Store state
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medCategories, setMedCategories] = useState<string[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [activeMedCat, setActiveMedCat] = useState("All");
  const [medSearch, setMedSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderForm, setOrderForm] = useState({ patientName: user?.name ?? "", phone: "", deliveryAddress: "", paymentMethod: "cash" as "cash" | "online" });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    if (activeTab === "store" && medicines.length === 0) fetchMedicines();
  }, [activeTab]);

  async function fetchMedicines() {
    setMedLoading(true);
    const [catRes, medRes] = await Promise.all([
      fetch(`${API}/api/medicine-store/categories`),
      fetch(`${API}/api/medicine-store/catalog`),
    ]);
    if (catRes.ok) setMedCategories(await catRes.json());
    if (medRes.ok) setMedicines(await medRes.json());
    setMedLoading(false);
  }

  function addToCart(med: Medicine) {
    setCart(prev => {
      const existing = prev.find(i => i.medicine.id === med.id);
      if (existing) return prev.map(i => i.medicine.id === med.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { medicine: med, qty: 1 }];
    });
  }
  function removeFromCart(medId: number) {
    setCart(prev => {
      const existing = prev.find(i => i.medicine.id === medId);
      if (existing && existing.qty > 1) return prev.map(i => i.medicine.id === medId ? { ...i, qty: i.qty - 1 } : i);
      return prev.filter(i => i.medicine.id !== medId);
    });
  }
  const cartTotal = cart.reduce((s, i) => s + i.medicine.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const filteredMeds = medicines.filter(m =>
    (activeMedCat === "All" || m.category === activeMedCat) &&
    (!medSearch || m.name.toLowerCase().includes(medSearch.toLowerCase()) || m.category.toLowerCase().includes(medSearch.toLowerCase()))
  );

  async function handleMedOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setOrderSubmitting(true);
    try {
      const items = cart.map(i => ({ medicineId: i.medicine.id, quantity: i.qty }));
      const r = await fetch(`${API}/api/medicine-store/order`, {
        method: "POST", headers,
        body: JSON.stringify({
          patientName: orderForm.patientName,
          phone: orderForm.phone,
          deliveryAddress: orderForm.deliveryAddress,
          paymentMethod: orderForm.paymentMethod,
          items,
        }),
      });
      if (r.ok) {
        setOrderSuccess(true);
        setCart([]);
        setShowCart(false);
      } else {
        const d = await r.json();
        alert(d.error ?? "Order failed, please try again");
      }
    } finally { setOrderSubmitting(false); }
  }

  const filtered = LAB_PACKAGES.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.includes.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  async function fetchBookings() {
    setBookingsLoading(true);
    const r = await fetch(`${API}/api/care/activity`, { headers });
    if (r.ok) {
      const data = await r.json();
      setBookings(data.labBookings ?? []);
    }
    setBookingsLoading(false);
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPkg) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/care/lab-bookings`, {
        method: "POST", headers,
        body: JSON.stringify({
          testId: selectedPkg.id,
          patientName: form.patientName,
          phone: form.phone,
          address: form.address,
          dateSlot: form.dateSlot,
          paymentMethod: form.paymentMethod,
        }),
      });
      if (r.ok) {
        setSuccess(true);
        setSelectedPkg(null);
      } else {
        const d = await r.json();
        alert(d.error ?? "Booking failed");
      }
    } finally { setSubmitting(false); }
  }

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <FlaskConical className="w-4 h-4" /> Lab Tests
          </div>
          <h1 className="text-3xl font-bold">Book Lab Tests at Home</h1>
          <p className="text-muted-foreground text-sm">
            NABL certified labs · Home sample collection · Reports in 12-24 hours
          </p>
        </div>

        {/* Lab Center Portal CTA */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground text-sm">Kya aapka Lab Center hai?</div>
              <div className="text-xs text-muted-foreground">Register karein aur lakho patients tak pahunchein — daily bookings aur Featured Spot bhi milega.</div>
            </div>
            <a href="/lab-center"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-2xl font-semibold text-sm transition-all flex-shrink-0 whitespace-nowrap">
              Lab Center Portal <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-emerald-800">Lab Test Booked!</p>
              <p className="text-sm text-emerald-700 mt-0.5">Hamare team se call aayega collection time confirm karne ke liye.</p>
            </div>
            <button onClick={() => setSuccess(false)} className="ml-auto text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex rounded-2xl bg-secondary/40 p-1 gap-1">
          {[
            { k: "tests", l: "Test Packages", i: FlaskConical },
            { k: "bookings", l: "My Bookings", i: Package },
            { k: "store", l: "Medical Store", i: Store },
          ].map(t => (
            <button key={t.k} onClick={() => { setActiveTab(t.k as any); if (t.k === "bookings") fetchBookings(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === t.k ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <t.i className="w-3.5 h-3.5" /> {t.l}
            </button>
          ))}
        </div>

        {activeTab === "tests" && (
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search test names (e.g. thyroid, diabetes, CBC...)"
                className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FEATURES.map(f => (
                <div key={f.title} className="bg-card border border-border/50 rounded-2xl p-3 flex flex-col gap-1.5">
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                  <p className="text-xs font-bold text-foreground leading-snug">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <FlaskConical className="w-14 h-14 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">No tests found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filtered.map(pkg => {
                  const Icon = pkg.icon;
                  return (
                    <div key={pkg.id}
                      className={`bg-card border-2 rounded-3xl p-4 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer ${pkg.popular ? "border-primary/30" : "border-border"}`}
                      onClick={() => { setSelectedPkg(pkg); setSuccess(false); }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 ${pkg.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {pkg.popular && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{pkg.tag}</span>
                          )}
                          {!pkg.popular && (
                            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">{pkg.tag}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-foreground text-sm leading-snug">{pkg.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                      </div>

                      <div className="space-y-1">
                        {pkg.includes.slice(0, 3).map(item => (
                          <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                        {pkg.includes.length > 3 && (
                          <p className="text-xs text-primary font-medium pl-4.5">+{pkg.includes.length - 3} more tests</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground text-lg">₹{pkg.price}</span>
                            <span className="text-xs text-muted-foreground line-through">₹{pkg.originalPrice}</span>
                            <span className="text-xs text-emerald-600 font-bold">{pkg.discount}% off</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" /> Reports in {pkg.reportTime} · {pkg.tests} tests
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedPkg(pkg); setSuccess(false); }}
                          className="flex items-center gap-1 bg-primary text-primary-foreground px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all">
                          Book <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "store" && (
          <div className="space-y-4">
            {/* Header + Cart Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Medical Store</h2>
                <p className="text-xs text-muted-foreground">Lab test ke saath medicines bhi order karein</p>
              </div>
              {cartCount > 0 && (
                <button onClick={() => setShowCart(true)}
                  className="relative flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl font-semibold text-sm active:scale-95 transition-all shadow-md">
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">{cartCount}</span>
                </button>
              )}
            </div>

            {orderSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800">Order Placed!</p>
                  <p className="text-sm text-emerald-700">Aapka order confirm ho gaya. Jald delivery hogi.</p>
                </div>
                <button onClick={() => setOrderSuccess(false)} className="ml-auto text-emerald-600"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={medSearch} onChange={e => setMedSearch(e.target.value)}
                placeholder="Medicine search karein..."
                className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {/* Category Filter */}
            {medCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {medCategories.map(cat => (
                  <button key={cat} onClick={() => setActiveMedCat(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      activeMedCat === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {medLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
            ) : filteredMeds.length === 0 ? (
              <div className="text-center py-16">
                <Pill className="w-14 h-14 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">No medicines found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredMeds.map(med => {
                  const cartItem = cart.find(i => i.medicine.id === med.id);
                  return (
                    <div key={med.id} className="bg-card border border-border rounded-3xl p-3 flex flex-col gap-2 hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Pill className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm leading-snug line-clamp-2">{med.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{med.unit}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{med.manufacturer}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                        <span className="font-bold text-primary text-sm">₹{med.price}</span>
                        {cartItem ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => removeFromCart(med.id)}
                              className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-all">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold w-4 text-center">{cartItem.qty}</span>
                            <button onClick={() => addToCart(med)}
                              className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(med)}
                            className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-xl text-xs font-bold hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all">
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sticky Cart Bar */}
            {cartCount > 0 && (
              <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
                <button onClick={() => setShowCart(true)}
                  className="w-full max-w-lg mx-auto flex items-center justify-between bg-primary text-primary-foreground px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm active:scale-95 transition-all">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>{cartCount} item{cartCount > 1 ? "s" : ""} in cart</span>
                  </div>
                  <span className="font-bold">₹{cartTotal} →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">My Lab Bookings</h2>
              <button onClick={fetchBookings} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {!user ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">Please login to view bookings</p>
              </div>
            ) : bookingsLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16">
                <FlaskConical className="w-14 h-14 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">No bookings yet</p>
                <p className="text-sm text-muted-foreground mt-1">Book a lab test from our packages</p>
                <button onClick={() => setActiveTab("tests")} className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90">
                  Browse Tests
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b: Booking) => (
                  <div key={b.id} className="bg-card border border-border rounded-3xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm">{b.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.patientName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{b.status}</span>
                        <p className="font-bold text-primary text-sm mt-1">₹{b.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.dateSlot).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {b.notes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart / Order Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-border">
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" /> Your Cart</h2>
                <p className="text-xs text-muted-foreground">{cartCount} items · ₹{cartTotal} total</p>
              </div>
              <button onClick={() => setShowCart(false)} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Cart Items */}
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.medicine.id} className="flex items-center gap-3 bg-secondary/30 rounded-2xl p-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.medicine.name}</p>
                      <p className="text-xs text-muted-foreground">{item.medicine.unit}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => removeFromCart(item.medicine.id)} className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                      <button onClick={() => addToCart(item.medicine)} className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="font-bold text-primary text-sm flex-shrink-0">₹{item.medicine.price * item.qty}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3">
                <span className="font-semibold text-sm">Total Amount</span>
                <span className="font-bold text-primary text-xl">₹{cartTotal}</span>
              </div>

              {/* Order Form */}
              <form onSubmit={handleMedOrder} className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> Delivery Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name *</label>
                    <input value={orderForm.patientName} onChange={e => setOrderForm(f => ({ ...f, patientName: e.target.value }))} required
                      placeholder="Aapka naam"
                      className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mobile *</label>
                    <input value={orderForm.phone} onChange={e => setOrderForm(f => ({ ...f, phone: e.target.value }))} required type="tel"
                      placeholder="10-digit number"
                      className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5"><MapPin className="w-3 h-3 inline mr-0.5" /> Delivery Address *</label>
                  <textarea value={orderForm.deliveryAddress} onChange={e => setOrderForm(f => ({ ...f, deliveryAddress: e.target.value }))} required rows={2}
                    placeholder="Ghar ka pura address"
                    className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["cash", "online"] as const).map(pm => (
                      <button key={pm} type="button" onClick={() => setOrderForm(f => ({ ...f, paymentMethod: pm }))}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                          orderForm.paymentMethod === pm
                            ? pm === "cash" ? "bg-emerald-600 text-white border-emerald-600" : "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/60 text-muted-foreground border-border"
                        }`}>
                        {pm === "cash" ? <><Banknote className="w-4 h-4" /> Cash</> : <><CreditCard className="w-4 h-4" /> Online</>}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={orderSubmitting}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-primary hover:bg-primary/90 text-primary-foreground">
                  {orderSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
                    : <><ShoppingBag className="w-4 h-4" /> Place Order · ₹{cartTotal}</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-border">
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="font-bold text-lg">Book Test</h2>
                <p className="text-xs text-muted-foreground">{selectedPkg.name} · ₹{selectedPkg.price}</p>
              </div>
              <button onClick={() => setSelectedPkg(null)} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-2">
                <p className="font-bold text-sm">{selectedPkg.name}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPkg.includes.map(item => (
                    <span key={item} className="text-xs bg-card border border-border px-2 py-0.5 rounded-full text-muted-foreground">{item}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Reports in {selectedPkg.reportTime}</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> NABL Certified</span>
                  <span className="flex items-center gap-1"><HomeIcon className="w-3 h-3" /> Home Collection</span>
                </div>
              </div>

              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> Patient Details</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name *</label>
                      <input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} required
                        placeholder="Patient's full name"
                        className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mobile Number *</label>
                      <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required type="tel"
                        placeholder="10-digit number"
                        className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Collection Address</h3>
                  <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required rows={2}
                    placeholder="Full address for home sample collection"
                    className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> Preferred Date & Time</h3>
                  <input type="datetime-local" value={form.dateSlot}
                    min={defaultDate}
                    onChange={e => setForm(f => ({ ...f, dateSlot: e.target.value }))} required
                    className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1"><HomeIcon className="w-3 h-3" /> Phlebotomist aapke ghar aayega sample lene</p>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-primary" /> Payment Method</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setForm(f => ({ ...f, paymentMethod: "online" }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        form.paymentMethod === "online"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/60 text-muted-foreground border-border hover:text-foreground"
                      }`}>
                      <CreditCard className="w-4 h-4" /> Online Pay
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, paymentMethod: "cash" }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        form.paymentMethod === "cash"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-secondary/60 text-muted-foreground border-border hover:text-foreground"
                      }`}>
                      <Banknote className="w-4 h-4" /> Cash
                    </button>
                  </div>
                </div>

                {/* Fee Display */}
                {(() => {
                  const plan = user?.plan ?? "free";
                  const rate = form.paymentMethod === "online" ? (LAB_PLAN_DISCOUNTS[plan] ?? 0) : 0;
                  const planDiscount = Math.round(selectedPkg.price * rate);
                  const finalAmt = selectedPkg.price - planDiscount;
                  return (
                    <div className={`rounded-2xl p-3 border ${form.paymentMethod === "cash" ? "bg-amber-50 border-amber-200" : "bg-secondary/40 border-secondary"}`}>
                      {form.paymentMethod === "cash" ? (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Amount (Cash)</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-muted-foreground line-through">₹{selectedPkg.originalPrice}</span>
                              <span className="font-bold text-foreground text-lg">₹{selectedPkg.price}</span>
                            </div>
                          </div>
                          <p className="text-xs text-amber-700 mt-1.5 flex items-start gap-1">
                            <Banknote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            Lab center ko seedha cash dein. Subscription discount cash par apply nahi hoga.
                          </p>
                        </>
                      ) : planDiscount > 0 ? (
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Amount</span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              <span className="line-through">₹{selectedPkg.originalPrice}</span> (package discount)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary text-lg">₹{finalAmt}</div>
                            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
                              <Tag className="w-3 h-3" /> Save ₹{selectedPkg.price - finalAmt} ({LAB_PLAN_LABELS[plan] ?? `${Math.round(rate * 100)}% plan`})
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Amount</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-muted-foreground line-through">₹{selectedPkg.originalPrice}</span>
                            <span className="font-bold text-primary text-lg">₹{selectedPkg.price}</span>
                            <span className="text-xs text-emerald-600 font-bold">Save ₹{selectedPkg.originalPrice - selectedPkg.price}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button type="submit" disabled={submitting}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                    form.paymentMethod === "cash"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}>
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                    : form.paymentMethod === "cash"
                      ? <><Banknote className="w-4 h-4" /> Confirm (Cash Payment)</>
                      : <><CheckCircle2 className="w-4 h-4" /> Confirm Booking</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
