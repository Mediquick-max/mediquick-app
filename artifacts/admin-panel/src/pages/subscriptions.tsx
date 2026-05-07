import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Bell, RefreshCw } from "lucide-react";

interface Subscription {
  id: number;
  userId: number;
  plan: string;
  status: string;
  amount: number;
  billingCycle: string;
  startedAt: string;
  expiresAt: string | null;
}

const PLAN_COLORS: Record<string, string> = {
  premium: "bg-amber-500/20 text-amber-400",
  basic: "bg-blue-500/20 text-blue-400",
  free: "bg-slate-500/20 text-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Subscription[]>("/admin/subscriptions");
      setSubs(data);
    } catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Subscriptions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{subs.length} subscriptions total</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["premium", "basic", "active", "expired"].map(key => {
          const count = subs.filter(s => s.plan === key || s.status === key).length;
          return (
            <div key={key} className="bg-card border border-card-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{count}</div>
              <div className="text-xs text-muted-foreground capitalize mt-1">{key}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading subscriptions...</div>
        ) : subs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No subscriptions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">User ID</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Billing</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Started</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">#{s.id}</td>
                    <td className="px-4 py-3 text-foreground">User #{s.userId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PLAN_COLORS[s.plan] ?? "bg-muted text-muted-foreground"}`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">₹{s.amount}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{s.billingCycle}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(s.startedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {s.expiresAt
                        ? new Date(s.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
