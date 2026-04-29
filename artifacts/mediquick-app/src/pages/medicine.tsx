import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { useGeolocation } from "@/lib/use-geolocation";
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X, Package,
  MapPin, Phone, User, Loader2, CheckCircle2, Pill,
  ChevronRight, Star, Truck, Shield, Clock, RefreshCw,
  Tag, Zap, AlertCircle, Building, Filter
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Medicine {
  id: number; name: string; category: string; price: number;
  stock: number; unit: string; description: string; manufacturer: string;
}

interface CartItem extends Medicine { qty: number; }

interface Order {
  id: number; patientName: string; phone: string; deliveryAddress: string;
  city: string; totalAmount: number; status: string; items: string; createdAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "All": "💊", "Fever & Pain": "🌡️", "Antibiotics": "🦠", "Gastric & Acidity": "🫃",
  "Diabetes": "🩸", "Cardiac & BP": "❤️", "Allergy & Cold": "🤧", "Vitamins & Nutrition": "🌿",
};

const OFFERS = [
  { icon: Truck, label: "Free Delivery", sub: "On orders above ₹299" },
  { icon: Clock, label: "4-6 Hour Delivery", sub: "Same day delivery" },
  { icon: Shield, label: "100% Genuine", sub: "Verified medicines" },
  { icon: Tag, label: "Up to 25% off", sub: "On select medicines" },
];

export default function MedicinePage() {
  const { user, token } = useAuth();
  const geo = useGeolocation();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"store" | "orders">("store");

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    patientName: user?.name ?? "", phone: "", deliveryAddress: "", city: "", pincode: ""
  });
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  useEffect(() => {
    if (geo.location) {
      setCheckoutForm(f => ({
        ...f,
        city: f.city || geo.location!.city,
        pincode: f.pincode || geo.location!.pincode,
      }));
    }
  }, [geo.location]);

  const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

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

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    const r = await fetch(`${API}/api/medicine-store/my-orders`, { headers });
    if (r.ok) setOrders(await r.json());
    setOrdersLoading(false);
  }, [user, token]);

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
  }, [activeTab, fetchOrders]);

  function addToCart(med: Medicine) {
    setCart(c => {
      const existing = c.find(i => i.id === med.id);
      if (existing) return c.map(i => i.id === med.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...med, qty: 1 }];
    });
  }

  function updateQty(id: number, delta: number) {
    setCart(c => {
      const updated = c.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0);
      return updated;
    });
  }

  function removeFromCart(id: number) {
    setCart(c => c.filter(i => i.id !== id));
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartItemForMed = (id: number) => cart.find(i => i.id === id);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const r = await fetch(`${API}/api/medicine-store/order`, {
        method: "POST", headers,
        body: JSON.stringify({
          ...checkoutForm,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, unit: i.unit })),
        }),
      });
      const data = await r.json();
      if (!r.ok) { alert(data.error ?? "Order failed"); return; }
      setOrderSuccess(data);
      setCart([]);
      setCartOpen(false);
      setShowCheckout(false);
    } finally { setPlacing(false); }
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Pill className="w-4 h-4" /> Online Pharmacy
          </div>
          <h1 className="text-3xl font-bold">Order Medicines</h1>
          <p className="text-muted-foreground">Genuine medicines delivered in 4-6 hours at your doorstep</p>
        </div>

        <div className="flex rounded-2xl bg-secondary/40 p-1 gap-1">
          {[{ k: "store", l: "Medicine Store", i: Pill }, { k: "orders", l: "My Orders", i: Package }].map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.k ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <t.i className="w-4 h-4" /> {t.l}
            </button>
          ))}
        </div>

        {activeTab === "store" && (
          <div className="space-y-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search medicines, brands, categories..."
                className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {OFFERS.map(o => (
                <div key={o.label} className="bg-primary/5 border border-primary/10 rounded-2xl p-3 flex items-center gap-2">
                  <o.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">{o.label}</p>
                    <p className="text-xs text-muted-foreground">{o.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}>
                  <span>{CATEGORY_ICONS[cat] ?? "💊"}</span> {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
            ) : medicines.length === 0 ? (
              <div className="text-center py-16">
                <Pill className="w-14 h-14 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">No medicines found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-3">{medicines.length} medicines found</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {medicines.map(med => {
                    const inCart = cartItemForMed(med.id);
                    const discount = Math.floor(Math.random() * 15) + 5;
                    const mrp = Math.round(med.price * (1 + discount / 100));
                    return (
                      <div key={med.id} className="bg-card border border-border rounded-3xl p-4 hover:border-primary/30 transition-all flex flex-col">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                            {CATEGORY_ICONS[med.category] ?? "💊"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-foreground text-sm leading-snug">{med.name}</h3>
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">{discount}% off</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{med.manufacturer}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{med.description}</p>
                            <p className="text-xs text-primary/70 font-medium mt-1">{med.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-foreground text-base">₹{med.price}</span>
                              <span className="text-xs text-muted-foreground line-through">₹{mrp}</span>
                            </div>
                          </div>
                          {inCart ? (
                            <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-1 py-1">
                              <button onClick={() => updateQty(med.id, -1)} className="w-7 h-7 bg-primary/20 hover:bg-primary/30 rounded-lg flex items-center justify-center text-primary transition-colors">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-primary text-sm w-5 text-center">{inCart.qty}</span>
                              <button onClick={() => updateQty(med.id, 1)} className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(med)} disabled={med.stock === 0}
                              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40">
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">My Medicine Orders</h2>
              <button onClick={fetchOrders} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {!user ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">Please login to view orders</p>
              </div>
            ) : ordersLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-14 h-14 text-primary/20 mx-auto mb-3" />
                <p className="font-semibold">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-1">Order medicines from our store</p>
                <button onClick={() => setActiveTab("store")} className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90">
                  Browse Medicines
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  let items: any[] = [];
                  try { items = JSON.parse(order.items); } catch {}
                  return (
                    <div key={order.id} className="bg-card border border-border rounded-3xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-foreground">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${order.status === "placed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                            {order.status}
                          </span>
                          <p className="font-bold text-primary text-sm mt-1">₹{order.totalAmount}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {items.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{item.name} × {item.qty}</span>
                            <span className="font-medium">₹{item.price * item.qty}</span>
                          </div>
                        ))}
                        {items.length > 3 && <p className="text-xs text-muted-foreground">+{items.length - 3} more items</p>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{order.deliveryAddress}, {order.city}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 bg-amber-50 border border-amber-100 rounded-xl p-2">
                        <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-700 font-medium">Estimated delivery in 4-6 hours</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {cartCount > 0 && activeTab === "store" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-sm w-full px-4">
          <button onClick={() => setCartOpen(true)}
            className="w-full bg-primary text-primary-foreground rounded-2xl px-5 py-4 flex items-center justify-between shadow-2xl hover:bg-primary/95 active:scale-98 transition-all">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
              </div>
              <span className="font-semibold text-sm">{cartCount} item{cartCount > 1 ? "s" : ""} in cart</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">₹{cartTotal}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <div className="bg-card w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Your Cart</h2>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
              </div>
              <button onClick={() => setCartOpen(false)}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-secondary/30 rounded-2xl p-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                    {CATEGORY_ICONS[item.category] ?? "💊"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground leading-snug">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                    <p className="text-sm font-bold text-primary">₹{item.price * item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-border hover:bg-border/80 rounded-lg flex items-center justify-center transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-sm w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 ml-1 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg flex items-center justify-center transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-card border-t border-border p-4 space-y-3">
              <div className="bg-secondary/40 rounded-2xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{cartTotal}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className={cartTotal >= 299 ? "text-emerald-600 font-semibold" : ""}>{cartTotal >= 299 ? "FREE" : "₹49"}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-1.5"><span>Total</span><span className="text-primary">₹{cartTotal >= 299 ? cartTotal : cartTotal + 49}</span></div>
              </div>
              {cartTotal < 299 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Add ₹{299 - cartTotal} more for free delivery
                </div>
              )}
              <button onClick={() => { setCartOpen(false); setShowCheckout(true); setCheckoutForm(f => ({ ...f, patientName: user?.name ?? "" })); }}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                Proceed to Checkout <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && !orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-border">
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-3.5 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="font-bold text-lg">Checkout</h2>
                <p className="text-xs text-muted-foreground">{cartCount} items · ₹{cartTotal >= 299 ? cartTotal : cartTotal + 49} total</p>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePlaceOrder} className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> Patient Details</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name *</label>
                    <input value={checkoutForm.patientName} onChange={e => setCheckoutForm(f => ({ ...f, patientName: e.target.value }))} required
                      placeholder="Your full name"
                      className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mobile Number *</label>
                    <input value={checkoutForm.phone} onChange={e => setCheckoutForm(f => ({ ...f, phone: e.target.value }))} required type="tel"
                      placeholder="10-digit number"
                      className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> Delivery Address</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Street Address *</label>
                    <textarea value={checkoutForm.deliveryAddress} onChange={e => setCheckoutForm(f => ({ ...f, deliveryAddress: e.target.value }))} required rows={2}
                      placeholder="House no., Street, Area, Landmark..."
                      className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                        City *
                        {geo.location && checkoutForm.city === geo.location.city && (
                          <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> Auto-detected
                          </span>
                        )}
                      </label>
                      <input value={checkoutForm.city} onChange={e => setCheckoutForm(f => ({ ...f, city: e.target.value }))} required
                        placeholder="Mumbai"
                        className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">PIN Code *</label>
                      <input value={checkoutForm.pincode} onChange={e => setCheckoutForm(f => ({ ...f, pincode: e.target.value }))} required type="text" pattern="[0-9]{6}"
                        placeholder="400001"
                        className="w-full bg-background border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/40 rounded-2xl p-3 space-y-2 text-sm">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Order Summary</h3>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">{item.name} × {item.qty}</span>
                    <span className="font-medium">₹{item.price * item.qty}</span>
                  </div>
                ))}
                <div className="border-t border-border/50 pt-2 flex justify-between font-bold">
                  <span>Total Payable</span>
                  <span className="text-primary">₹{cartTotal >= 299 ? cartTotal : cartTotal + 49}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-xl p-3">
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                Payment will be collected at the time of delivery (Cash on Delivery)
              </div>

              <button type="submit" disabled={placing}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {placing && <Loader2 className="w-5 h-5 animate-spin" />}
                {placing ? "Placing Order..." : "Place Order — Cash on Delivery"}
              </button>
            </form>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-border text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold">Order Placed!</h3>
            <p className="text-sm text-muted-foreground">Your medicines will be delivered in <span className="font-bold text-foreground">4-6 hours</span></p>
            <div className="bg-secondary/40 rounded-2xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Order ID</span><span className="font-semibold">#{orderSuccess.order?.id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-primary">₹{orderSuccess.order?.totalAmount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-semibold text-amber-600">Cash on Delivery</span></div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
              <Truck className="w-4 h-4 flex-shrink-0" />
              Estimated delivery: 4-6 hours
            </div>
            <button onClick={() => { setOrderSuccess(null); setActiveTab("orders"); }}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              View My Orders
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
