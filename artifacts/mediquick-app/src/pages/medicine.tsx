import { useState, useEffect, useCallback, useRef } from "react";
import { Layout } from "@/components/layout";
import { useGeolocation } from "@/lib/use-geolocation";
import { useAuth } from "@/lib/auth";
import {
  Search, Pill, Loader2, ExternalLink, Truck, Shield, Clock, Tag, ArrowRight,
  MapPin, ShoppingCart, Plus, Minus, Trash2, Store, CheckCircle2, Phone,
  Navigation, Package, X, ChevronRight, Zap, Info,
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Medicine {
  id: number; name: string; category: string; price: number;
  stock: number; unit: string; description: string; manufacturer: string;
}

interface NearbyMed {
  id: number; name: string; category: string; price: number;
  stock: number; unit: string; description: string; manufacturer: string;
  shopkeeperId: number;
  shop: { id: number; name: string; address: string; phone: string; lat: number | null; lng: number | null; city: string };
  distanceMeters: number | null;
  deliveryCharge: number | null;
  platformFee: number | null;
}

interface CartItem { med: NearbyMed; qty: number }

interface LocalOrder {
  id: number; shopkeeperId: number; customerName: string; customerPhone: string;
  deliveryAddress: string; distanceMeters: number; deliveryCharge: number;
  platformFee: number; subtotal: number; totalAmount: number;
  medicinesJson: string; status: string; createdAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "All": "💊", "Fever & Pain": "🌡️", "Antibiotics": "🦠", "Gastric & Acidity": "🫃",
  "Diabetes": "🩸", "Cardiac & BP": "❤️", "Allergy & Cold": "🤧", "Vitamins & Nutrition": "🌿",
  "General": "💊",
};

const QUICK_SEARCHES = ["Paracetamol", "Vitamin D3", "Metformin", "Azithromycin", "Cetirizine", "Omeprazole", "Aspirin", "Insulin"];

const AFFILIATE = "https://inr.deals/axPR6g";

function openPharmaEasy(query?: string) {
  const url = query
    ? `https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`
    : AFFILIATE;
  window.open(url, "_blank", "noopener,noreferrer");
}

// kept for backward compat
function open1mg(query?: string) { openPharmaEasy(query); }

function fmtDist(m: number | null) {
  if (m == null) return "—";
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function statusColor(s: string) {
  if (s === "delivered") return "text-emerald-700 bg-emerald-50";
  if (s === "cancelled") return "text-red-600 bg-red-50";
  if (s === "out_for_delivery") return "text-blue-700 bg-blue-50";
  if (s === "confirmed") return "text-violet-700 bg-violet-50";
  return "text-amber-700 bg-amber-50";
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending: "Pending", confirmed: "Confirmed",
    out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled",
  };
  return m[s] ?? s;
}

const PE = "#00A650"; // PharmaEasy green

// ─── Tab 1: PharmaEasy ────────────────────────────────────────────────────────
function TabPharmaEasy() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeCategory !== "All") params.set("category", activeCategory);
    const r = await fetch(`${API}/api/medicine-store/catalog?${params}`);
    if (r.ok) setMedicines(await r.json());
    setLoading(false);
  }, [search, activeCategory]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);
  useEffect(() => {
    fetch(`${API}/api/medicine-store/categories`)
      .then(r => r.ok ? r.json() : ["All"])
      .then(setCategories);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    openPharmaEasy(search.trim() || undefined);
  };

  return (
    <div className="space-y-5">
      {/* PharmaEasy Banner */}
      <div className="bg-gradient-to-r from-[#00A650]/5 to-[#00A650]/10 border border-[#00A650]/25 rounded-3xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#00A650] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
          <Pill className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-foreground text-sm">Powered by PharmaEasy</div>
          <div className="text-xs text-muted-foreground mt-0.5">India's trusted online pharmacy. Order medicines, health products & more.</div>
        </div>
        <a href="https://inr.deals/axPR6g" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold hover:underline flex-shrink-0" style={{ color: PE }}>
          Visit <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search any medicine, brand or health condition..."
          className="w-full bg-card border border-border rounded-2xl pl-11 pr-44 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A650]/40" />
        <button type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          style={{ backgroundColor: PE }}>
          Search on PharmaEasy <ExternalLink className="w-3 h-3" />
        </button>
      </form>

      {/* Quick searches */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Quick search</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SEARCHES.map(q => (
            <button key={q} onClick={() => openPharmaEasy(q)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:border-[#00A650]/40 hover:text-[#00A650] transition-all">
              <Pill className="w-3 h-3" /> {q} <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </button>
          ))}
        </div>
      </div>

      {/* Feature pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Truck, label: "Free Delivery", sub: "On orders ₹199+", color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Clock, label: "Express Delivery", sub: "2-4 hr available", color: "text-violet-600", bg: "bg-violet-50" },
          { icon: Shield, label: "100% Genuine", sub: "Verified medicines", color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Tag, label: "Up to 20% off", sub: "On select medicines", color: "text-orange-600", bg: "bg-orange-50" },
        ].map(o => (
          <div key={o.label} className={`${o.bg} border border-border/30 rounded-2xl p-3 flex items-center gap-2`}>
            <o.icon className={`w-4 h-4 ${o.color} flex-shrink-0`} />
            <div>
              <p className="text-xs font-bold text-foreground">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${activeCategory === cat ? "text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-[#00A650]/30"}`}
            style={activeCategory === cat ? { backgroundColor: PE } : {}}>
            <span>{CATEGORY_ICONS[cat] ?? "💊"}</span> {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#00A650]/40" /></div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-16">
          <Pill className="w-14 h-14 text-[#00A650]/20 mx-auto mb-3" />
          <p className="font-semibold">No medicines found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          <button onClick={() => openPharmaEasy(search.trim() || "medicine")}
            className="mt-4 flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold mx-auto transition-colors" style={{ backgroundColor: PE }}>
            Search on PharmaEasy <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground font-medium">{medicines.length} medicines found</p>
            <button onClick={() => openPharmaEasy(search || activeCategory)} className="flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: PE }}>
              See all on PharmaEasy <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {medicines.map(med => {
              const discount = Math.floor(Math.random() * 15) + 5;
              const mrp = Math.round(med.price * (1 + discount / 100));
              return (
                <div key={med.id} className="bg-card border border-border rounded-3xl p-4 hover:border-[#00A650]/30 hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#00A650]/10 flex items-center justify-center flex-shrink-0 text-xl">
                      {CATEGORY_ICONS[med.category] ?? "💊"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground text-sm leading-snug">{med.name}</h3>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">{discount}% off</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{med.manufacturer}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{med.description}</p>
                      <p className="text-xs font-medium mt-1" style={{ color: PE }}>{med.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-foreground text-base">₹{med.price}</span>
                      <span className="text-xs text-muted-foreground line-through">₹{mrp}</span>
                    </div>
                    <button onClick={() => openPharmaEasy(med.name)}
                      className="flex items-center gap-1.5 text-white px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all" style={{ backgroundColor: PE }}>
                      Order on PharmaEasy <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 bg-gradient-to-r from-[#00A650]/5 to-transparent border border-[#00A650]/20 rounded-3xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm">Can't find your medicine?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Browse PharmaEasy's full catalogue of 1 lakh+ medicines</p>
            </div>
            <a href="https://inr.deals/axPR6g" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex-shrink-0" style={{ backgroundColor: PE }}>
              Open PharmaEasy <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Local Shopkeeper ───────────────────────────────────────────────────
function TabLocal() {
  const geo = useGeolocation();
  const { user, token } = useAuth();
  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const [localTab, setLocalTab] = useState<"browse" | "orders">("browse");
  const [search, setSearch] = useState("");
  const [meds, setMeds] = useState<NearbyMed[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: user?.name ?? "",
    customerPhone: "",
    deliveryAddress: "",
    deliveryLat: null as number | null,
    deliveryLng: null as number | null,
  });
  const [chargeInfo, setChargeInfo] = useState<{ distanceMeters: number; deliveryCharge: number; platformFee: number; withinRange: boolean } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: number; shopPhone: string; total: number } | null>(null);
  const [myOrders, setMyOrders] = useState<LocalOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNearby = useCallback(async (q: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (geo.location?.lat) params.set("lat", String(geo.location.lat));
    if (geo.location?.lng) params.set("lng", String(geo.location.lng));
    const r = await fetch(`${API}/api/shopkeeper/nearby?${params}`);
    if (r.ok) setMeds(await r.json());
    setLoading(false);
  }, [geo.location]);

  useEffect(() => {
    fetchNearby(search);
  }, [fetchNearby]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchNearby(q), 400);
  };

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    const r = await fetch(`${API}/api/shopkeeper/local-orders`, { headers });
    if (r.ok) setMyOrders(await r.json());
    setOrdersLoading(false);
  }, [token]);

  useEffect(() => { if (localTab === "orders") fetchOrders(); }, [localTab, fetchOrders]);

  // Cart helpers
  const cartTotal = cart.reduce((s, i) => s + i.med.price * i.qty, 0);
  const cartQty = cart.reduce((s, i) => s + i.qty, 0);
  const cartShopId = cart[0]?.med.shopkeeperId ?? null;

  function addToCart(med: NearbyMed) {
    if (cartShopId && med.shopkeeperId !== cartShopId) {
      if (!confirm("Cart has items from another shop. Clear cart and add this item?")) return;
      setCart([{ med, qty: 1 }]);
      return;
    }
    setCart(prev => {
      const ex = prev.find(i => i.med.id === med.id);
      if (ex) return prev.map(i => i.med.id === med.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { med, qty: 1 }];
    });
  }

  function removeOne(medId: number) {
    setCart(prev => prev
      .map(i => i.med.id === medId ? { ...i, qty: i.qty - 1 } : i)
      .filter(i => i.qty > 0)
    );
  }

  function removeItem(medId: number) {
    setCart(prev => prev.filter(i => i.med.id !== medId));
  }

  const cartItemQty = (medId: number) => cart.find(i => i.med.id === medId)?.qty ?? 0;

  // Use current location for checkout
  function useCurrentLocationForDelivery() {
    if (!geo.location) return;
    setCheckoutForm(f => ({
      ...f,
      deliveryAddress: geo.location!.displayName,
      deliveryLat: geo.location!.lat,
      deliveryLng: geo.location!.lng,
    }));
  }

  // Calculate delivery charges when form changes
  async function calcDeliveryCharges(lat: number, lng: number, shopId: number) {
    const shopMed = meds.find(m => m.shopkeeperId === shopId);
    if (!shopMed?.shop.lat || !shopMed?.shop.lng) return;
    setCalcLoading(true);
    const r = await fetch(`${API}/api/shopkeeper/calc-distance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromLat: lat, fromLng: lng, toLat: shopMed.shop.lat, toLng: shopMed.shop.lng }),
    });
    if (r.ok) setChargeInfo(await r.json());
    setCalcLoading(false);
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!cartShopId) return;
    setSubmitting(true);
    try {
      const items = cart.map(i => ({ id: i.med.id, name: i.med.name, price: i.med.price, qty: i.qty, unit: i.med.unit }));
      const r = await fetch(`${API}/api/shopkeeper/local-orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          shopkeeperId: cartShopId,
          customerName: checkoutForm.customerName,
          customerPhone: checkoutForm.customerPhone,
          deliveryAddress: checkoutForm.deliveryAddress,
          deliveryLat: checkoutForm.deliveryLat,
          deliveryLng: checkoutForm.deliveryLng,
          items,
        }),
      });
      const data = await r.json();
      if (r.ok) {
        setOrderSuccess({ orderId: data.order.id, shopPhone: data.shopPhone, total: data.order.totalAmount });
        setCart([]);
        setShowCheckout(false);
        setShowCart(false);
        setChargeInfo(null);
      } else {
        alert(data.message ?? data.error ?? "Order failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const shopName = meds.find(m => m.shopkeeperId === cartShopId)?.shop.name ?? "Medical Store";

  return (
    <div className="space-y-4 pb-24">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm">Order from Local Medical Stores</p>
            <p className="text-xs text-muted-foreground mt-0.5">Medicines delivered by the shopkeeper. ₹10 per 100m delivery charge. Max 5 km range.</p>
          </div>
        </div>
      </div>

      {/* Location Bar */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl p-3">
        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
        {geo.location ? (
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Showing stores near</p>
            <p className="text-sm font-semibold truncate">{geo.location.displayName}</p>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Location not detected</p>
            <p className="text-xs text-muted-foreground">Showing all available stores</p>
          </div>
        )}
        <button onClick={geo.detectLocation} disabled={geo.loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-1.5 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
          {geo.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
          {geo.location ? "Update" : "Detect"}
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button onClick={() => setLocalTab("browse")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${localTab === "browse" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
          Browse Medicines
        </button>
        <button onClick={() => setLocalTab("orders")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${localTab === "orders" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
          My Orders
        </button>
      </div>

      {localTab === "browse" && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={handleSearch}
              placeholder="Search medicine name or category..."
              className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
          ) : meds.length === 0 ? (
            <div className="text-center py-16">
              <Store className="w-14 h-14 text-primary/20 mx-auto mb-3" />
              <p className="font-semibold">No nearby stores found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {geo.location ? "No registered medical stores within 5 km" : "Detect location to find stores near you"}
              </p>
              {!geo.location && (
                <button onClick={geo.detectLocation}
                  className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold mx-auto hover:bg-primary/90 transition-colors">
                  <Navigation className="w-4 h-4" /> Detect Location
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">{meds.length} medicines from nearby stores</p>
              {meds.map(med => {
                const qty = cartItemQty(med.id);
                return (
                  <div key={med.id} className="bg-card border border-border rounded-3xl p-4 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                        {CATEGORY_ICONS[med.category] ?? "💊"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-foreground text-sm leading-snug">{med.name}</h3>
                          {med.stock > 0
                            ? <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">In Stock</span>
                            : <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Out of Stock</span>
                          }
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{med.manufacturer} · {med.unit}</p>
                        {med.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{med.description}</p>}

                        {/* Shop + Distance */}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Store className="w-3 h-3" /> {med.shop.name}
                          </div>
                          {med.distanceMeters != null && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" /> {fmtDist(med.distanceMeters)}
                            </div>
                          )}
                          {med.deliveryCharge != null && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                              <Truck className="w-3 h-3" /> ₹{med.deliveryCharge} delivery
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <span className="font-bold text-foreground text-base">₹{med.price}</span>
                      {med.stock > 0 ? (
                        qty > 0 ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeOne(med.id)}
                              className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-sm w-6 text-center">{qty}</span>
                            <button onClick={() => addToCart(med)}
                              className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(med)}
                            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all">
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {localTab === "orders" && (
        <div className="space-y-3">
          {!token ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-primary/20 mx-auto mb-3" />
              <p className="font-semibold">Login to view your orders</p>
            </div>
          ) : ordersLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
          ) : myOrders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-primary/20 mx-auto mb-3" />
              <p className="font-semibold">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Order medicines from local shops</p>
            </div>
          ) : (
            myOrders.map(order => {
              const items = (() => { try { return JSON.parse(order.medicinesJson); } catch { return []; } })();
              return (
                <div key={order.id} className="bg-card border border-border rounded-3xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Order #{order.id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-xl ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{it.name} × {it.qty}</span>
                        <span className="font-semibold">₹{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border/50 pt-2 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Delivery ({fmtDist(order.distanceMeters)})</span>
                      <span>₹{order.deliveryCharge}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total</span>
                      <span className="text-primary">₹{order.totalAmount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {order.deliveryAddress}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Cart Button */}
      {cartQty > 0 && !showCart && !showCheckout && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button onClick={() => setShowCart(true)}
            className="flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl shadow-xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-primary text-xs font-black rounded-full flex items-center justify-center">{cartQty}</span>
            </div>
            {cartQty} items · ₹{cartTotal}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full bg-background rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Your Cart</h3>
                  <p className="text-xs text-muted-foreground">{shopName}</p>
                </div>
                <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.med.id} className="flex items-center gap-3 bg-secondary/40 rounded-2xl p-3">
                    <div className="text-2xl">{CATEGORY_ICONS[item.med.category] ?? "💊"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.med.name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.med.price} × {item.qty} = ₹{item.med.price * item.qty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeOne(item.med.id)} className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                      <button onClick={() => addToCart(item.med)} className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeItem(item.med.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-secondary/40 rounded-2xl p-3 flex justify-between items-center">
                <span className="font-semibold text-sm">Subtotal ({cartQty} items)</span>
                <span className="font-bold text-base">₹{cartTotal}</span>
              </div>

              <div className="text-xs text-muted-foreground flex items-start gap-1.5 bg-blue-50 rounded-xl p-2.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
                Delivery charge will be calculated at checkout based on your location (₹10 per 100m).
              </div>

              <button onClick={() => { setShowCart(false); setShowCheckout(true); setCheckoutForm(f => ({ ...f, customerName: user?.name ?? "" })); useCurrentLocationForDelivery(); }}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative w-full bg-background rounded-t-3xl max-h-[92vh] overflow-y-auto">
            <form onSubmit={handlePlaceOrder}>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Checkout</h3>
                  <button type="button" onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Delivery Details</h4>
                  <input value={checkoutForm.customerName} required
                    onChange={e => setCheckoutForm(f => ({ ...f, customerName: e.target.value }))}
                    placeholder="Full Name *"
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input value={checkoutForm.customerPhone} required
                    onChange={e => setCheckoutForm(f => ({ ...f, customerPhone: e.target.value }))}
                    placeholder="Phone Number *" type="tel"
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />

                  {/* Delivery Address */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground">Delivery Address *</label>
                      {geo.location && (
                        <button type="button" onClick={() => {
                          setCheckoutForm(f => ({ ...f, deliveryAddress: geo.location!.displayName, deliveryLat: geo.location!.lat, deliveryLng: geo.location!.lng }));
                          if (cartShopId && geo.location?.lat && geo.location?.lng) calcDeliveryCharges(geo.location.lat, geo.location.lng, cartShopId);
                        }}
                          className="text-xs font-semibold text-primary flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> Use my location
                        </button>
                      )}
                    </div>
                    <textarea value={checkoutForm.deliveryAddress} required rows={2}
                      onChange={e => {
                        setCheckoutForm(f => ({ ...f, deliveryAddress: e.target.value, deliveryLat: null, deliveryLng: null }));
                        setChargeInfo(null);
                      }}
                      placeholder="Enter full delivery address..."
                      className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                    {!checkoutForm.deliveryLat && geo.location && (
                      <p className="text-xs text-amber-700 flex items-start gap-1">
                        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        Use "my location" button for automatic distance calculation
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Charges */}
                {calcLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Calculating delivery charges...
                  </div>
                ) : chargeInfo ? (
                  <div className={`rounded-2xl p-4 space-y-2 border ${chargeInfo.withinRange ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                    {!chargeInfo.withinRange ? (
                      <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                        <Info className="w-4 h-4" /> Address is outside 5 km delivery range
                      </p>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Distance</span>
                          <span className="font-semibold">{fmtDist(chargeInfo.distanceMeters)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-semibold">₹{cartTotal}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery Charge</span>
                          <span className="font-semibold text-blue-700">₹{chargeInfo.deliveryCharge}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Platform Fee (included)</span>
                          <span>₹{chargeInfo.platformFee}</span>
                        </div>
                        <div className="border-t border-blue-200 pt-2 flex justify-between font-bold">
                          <span>Total Payable</span>
                          <span className="text-primary">₹{cartTotal + chargeInfo.deliveryCharge}</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-secondary/40 rounded-2xl p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span>₹10 per 100m</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      Use your location to auto-calculate delivery charges
                    </p>
                  </div>
                )}

                <button type="submit" disabled={submitting || (chargeInfo != null && !chargeInfo.withinRange)}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</> : <><Package className="w-4 h-4" /> Place Order (Cash on Delivery)</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Success */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-background rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Order Placed!</h3>
              <p className="text-sm text-muted-foreground mt-1">Order #{orderSuccess.orderId} confirmed</p>
            </div>
            <div className="bg-secondary/40 rounded-2xl p-4 space-y-2 text-sm text-left">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Amount</span><span className="font-bold text-primary">₹{orderSuccess.total}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-semibold">Cash on Delivery</span></div>
              {orderSuccess.shopPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Shop Contact</span>
                  <a href={`tel:${orderSuccess.shopPhone}`} className="flex items-center gap-1 font-semibold text-primary text-xs">
                    <Phone className="w-3 h-3" /> {orderSuccess.shopPhone}
                  </a>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">The shopkeeper will contact you shortly to confirm delivery.</p>
            <button onClick={() => { setOrderSuccess(null); setLocalTab("orders"); }}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
              View My Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MedicinePage() {
  const [tab, setTab] = useState<"1mg" | "local">("1mg");

  return (
    <Layout>
      <div className="space-y-5 pb-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Pill className="w-4 h-4" /> Order Medicines
          </div>
          <h1 className="text-3xl font-bold">Order Medicines Online</h1>
          <p className="text-muted-foreground text-sm">Choose from PharmaEasy or order from your nearest local medical store</p>
        </div>

        {/* Main Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-secondary/40 p-1.5 rounded-2xl">
          <button onClick={() => setTab("1mg")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${tab === "1mg" ? "text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
            style={tab === "1mg" ? { backgroundColor: "#00A650" } : {}}>
            <span className="text-base">💊</span> PharmaEasy
          </button>
          <button onClick={() => setTab("local")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${tab === "local" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}>
            <Store className="w-4 h-4" /> Local Store
          </button>
        </div>

        {tab === "1mg" ? <TabPharmaEasy /> : <TabLocal />}
      </div>
    </Layout>
  );
}
