import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import {
  Search, Pill, Loader2, ExternalLink, Truck, Shield, Clock, Tag, ArrowRight, Zap
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Medicine {
  id: number; name: string; category: string; price: number;
  stock: number; unit: string; description: string; manufacturer: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "All": "💊", "Fever & Pain": "🌡️", "Antibiotics": "🦠", "Gastric & Acidity": "🫃",
  "Diabetes": "🩸", "Cardiac & BP": "❤️", "Allergy & Cold": "🤧", "Vitamins & Nutrition": "🌿",
};

const QUICK_SEARCHES = [
  "Paracetamol", "Vitamin D3", "Metformin", "Azithromycin",
  "Cetirizine", "Omeprazole", "Aspirin", "Insulin",
];

function open1mg(query: string) {
  window.open(`https://www.1mg.com/search/all?name=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
}

export default function MedicinePage() {
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
    if (search.trim()) open1mg(search.trim());
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Pill className="w-4 h-4" /> Order Medicines
          </div>
          <h1 className="text-3xl font-bold">Order Medicines Online</h1>
          <p className="text-muted-foreground text-sm">Search any medicine and order directly on Tata 1mg — 100% genuine, fast delivery</p>
        </div>

        <div className="bg-gradient-to-r from-[#E40046]/5 to-[#E40046]/10 border border-[#E40046]/20 rounded-3xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#E40046] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-black text-sm">1mg</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-foreground text-sm">Powered by Tata 1mg</div>
            <div className="text-xs text-muted-foreground mt-0.5">India's most trusted online pharmacy. Orders fulfilled and delivered by 1mg.</div>
          </div>
          <a href="https://www.1mg.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-[#E40046] hover:underline flex-shrink-0">
            Visit <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search any medicine, brand or health condition..."
            className="w-full bg-card border border-border rounded-2xl pl-11 pr-32 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5">
            Search on 1mg <ExternalLink className="w-3 h-3" />
          </button>
        </form>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Quick search</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map(q => (
              <button key={q} onClick={() => open1mg(q)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                <Pill className="w-3 h-3" /> {q} <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Truck, label: "Free Delivery", sub: "On orders ₹299+", color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Clock, label: "4-6 Hr Delivery", sub: "Same day available", color: "text-violet-600", bg: "bg-violet-50" },
            { icon: Shield, label: "100% Genuine", sub: "Verified medicines", color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: Tag, label: "Up to 25% off", sub: "On select medicines", color: "text-orange-600", bg: "bg-orange-50" },
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
            <button onClick={() => open1mg(search || "medicine")}
              className="mt-4 flex items-center gap-2 bg-[#E40046] text-white px-5 py-2.5 rounded-xl text-sm font-bold mx-auto hover:bg-[#E40046]/90 transition-colors">
              Search on 1mg <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">{medicines.length} medicines found</p>
              <button onClick={() => open1mg(search || activeCategory)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#E40046] hover:underline">
                See all on 1mg <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {medicines.map(med => {
                const discount = Math.floor(Math.random() * 15) + 5;
                const mrp = Math.round(med.price * (1 + discount / 100));
                return (
                  <div key={med.id} className="bg-card border border-border rounded-3xl p-4 hover:border-primary/30 hover:shadow-md transition-all flex flex-col group">
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
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-foreground text-base">₹{med.price}</span>
                        <span className="text-xs text-muted-foreground line-through">₹{mrp}</span>
                      </div>
                      <button
                        onClick={() => open1mg(med.name)}
                        className="flex items-center gap-1.5 bg-[#E40046] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#E40046]/90 active:scale-95 transition-all">
                        Order on 1mg <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 bg-gradient-to-r from-[#E40046]/5 to-transparent border border-[#E40046]/20 rounded-3xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm">Can't find your medicine?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Search Tata 1mg's full catalogue of 1 lakh+ medicines</p>
              </div>
              <a href="https://www.1mg.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#E40046] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#E40046]/90 transition-colors flex-shrink-0">
                Open 1mg <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
