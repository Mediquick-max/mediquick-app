import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { CreditCard, RefreshCw, TrendingUp } from "lucide-react";

interface Payment {
  id: number;
  userId: number;
  userName: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  gateway: string;
  transactionId: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  success: "bg-emerald-500/20 text-emerald-400",
  failed: "bg-destructive/20 text-destructive",
  pending: "bg-amber-500/20 text-amber-400",
  refunded: "bg-muted text-muted-foreground",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Payment[]>("/admin/payments");
      setPayments(data);
    } catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);
  const totalRevenue = payments.filter(p => p.status === "success").reduce((a, b) => a + b.amount, 0);
  const successCount = payments.filter(p => p.status === "success").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Payments & Sales
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{payments.length} transactions</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Successful Payments</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{successCount}</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="text-sm text-muted-foreground mb-2">Average Transaction</div>
          <div className="text-2xl font-bold text-foreground">
            ₹{successCount > 0 ? Math.round(totalRevenue / successCount).toLocaleString("en-IN") : 0}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "success", "failed", "pending"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-card-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${payments.length})` : `${f} (${payments.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Transaction</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Gateway</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs text-muted-foreground font-mono">{p.transactionId || `#${p.id}`}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.userName || `User #${p.userId}`}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.description}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize hidden md:table-cell">{p.gateway}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
