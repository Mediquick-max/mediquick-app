import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Store, IndianRupee, Package, Users, Crown, Star, Zap, Infinity as InfinityIcon, RefreshCw } from "lucide-react";

interface ShopkeeperStats {
  totalMedicines: number;
  activeSubscriptions: number;
  totalRevenue: number;
  planDistribution: Record<string, number>;
}

interface SubRow {
  id: number;
  shopkeeperId: number;
  plan: string;
  medicineLimit: number;
  amountPaid: number;
  razorpayPaymentId: string;
  status: string;
  startDate: string;
  expiryDate: string;
}

const PLAN_COLORS: Record<string, string> = {
  basic: "bg-blue-100 text-blue-700",
  pro: "bg-primary/15 text-primary",
  unlimited: "bg-amber-100 text-amber-700",
  free: "bg-muted text-muted-foreground",
};

const PLAN_ICONS: Record<string, any> = {
  basic: Star,
  pro: Zap,
  unlimited: InfinityIcon,
  free: Users,
};

export default function ShopkeepersPage() {
  const [stats, setStats] = useState<ShopkeeperStats | null>(null);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [s, subsData] = await Promise.all([
        apiGet<ShopkeeperStats>("/shopkeeper/admin/stats"),
        apiGet<SubRow[]>("/shopkeeper/admin/subscriptions"),
      ]);
      setStats(s);
      setSubs(subsData);
    } catch {
      setError("Failed to load shopkeeper data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-5 animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-xl mb-3" />
              <div className="h-7 bg-muted rounded w-20 mb-2" />
              <div className="h-4 bg-muted rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-3">{error}</p>
          <button onClick={loadData} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium">Retry</button>
        </div>
      </div>
    );
  }

  const planDist = stats?.planDistribution ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" /> Shopkeepers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Medicine shopkeeper subscriptions and revenue</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-400 mb-3">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">₹{(stats?.totalRevenue ?? 0).toLocaleString()}</div>
          <div className="text-sm font-medium text-foreground mt-0.5">Shopkeeper Revenue</div>
          <div className="text-xs text-muted-foreground mt-1">From plan subscriptions</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20 text-blue-400 mb-3">
            <Crown className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.activeSubscriptions ?? 0}</div>
          <div className="text-sm font-medium text-foreground mt-0.5">Active Subscriptions</div>
          <div className="text-xs text-muted-foreground mt-1">Paid shopkeeper plans</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/20 text-violet-400 mb-3">
            <Package className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats?.totalMedicines ?? 0}</div>
          <div className="text-sm font-medium text-foreground mt-0.5">Total Medicines</div>
          <div className="text-xs text-muted-foreground mt-1">Across all shopkeepers</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400 mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{Object.values(planDist).reduce((a, b) => a + b, 0)}</div>
          <div className="text-sm font-medium text-foreground mt-0.5">Total Shopkeepers</div>
          <div className="text-xs text-muted-foreground mt-1">With active plans</div>
        </div>
      </div>

      {Object.keys(planDist).length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Plan Distribution</h2>
          <div className="grid grid-cols-3 gap-4">
            {["basic", "pro", "unlimited"].map(plan => {
              const PlanIcon = PLAN_ICONS[plan] ?? Star;
              const count = planDist[plan] ?? 0;
              const total = Object.values(planDist).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={plan} className="text-center space-y-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${PLAN_COLORS[plan] ?? ""}`}>
                    <PlanIcon className="w-4 h-4" />
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </div>
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground">{pct}% of subscribers</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border">
          <h2 className="text-base font-semibold text-foreground">Active Subscriptions</h2>
        </div>
        {subs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No active shopkeeper subscriptions yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-secondary/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">SHOPKEEPER ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">PLAN</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">LIMIT</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">AMOUNT PAID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">START DATE</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">EXPIRY DATE</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(sub => {
                  const PlanIcon = PLAN_ICONS[sub.plan] ?? Star;
                  const expired = new Date(sub.expiryDate) < new Date();
                  return (
                    <tr key={sub.id} className="border-b border-card-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3 text-foreground font-medium">#{sub.shopkeeperId}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${PLAN_COLORS[sub.plan] ?? ""}`}>
                          <PlanIcon className="w-3 h-3" />
                          {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{sub.medicineLimit === -1 ? "∞" : sub.medicineLimit}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-400">₹{sub.amountPaid}</td>
                      <td className="px-5 py-3 text-muted-foreground">{new Date(sub.startDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-3 text-muted-foreground">{new Date(sub.expiryDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expired ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                          {expired ? "Expired" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
