import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Stethoscope, FlaskConical, Package, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface CareRequest {
  id: number;
  type: string;
  itemId: string;
  title: string;
  patientName: string;
  phone: string;
  notes: string;
  address: string;
  mode: string;
  dateSlot: string;
  status: string;
  amount: number;
  platformFee: number;
  providerPayout: number;
  createdAt: string;
}

interface CareActivity {
  consultations: CareRequest[];
  labBookings: CareRequest[];
  medicineOrders: CareRequest[];
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-amber-500/20 text-amber-400",
  cancelled: "bg-destructive/20 text-destructive",
  completed: "bg-blue-500/20 text-blue-400",
};

function CareTable({ items, emptyMsg, showCommission }: { items: CareRequest[]; emptyMsg: string; showCommission?: boolean }) {
  if (items.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">{emptyMsg}</div>;
  }
  const totalAmount = items.reduce((s, r) => s + r.amount, 0);
  const totalPlatform = items.reduce((s, r) => s + (r.platformFee ?? 0), 0);
  const totalProvider = items.reduce((s, r) => s + (r.providerPayout ?? 0), 0);

  return (
    <div>
      {showCommission && items.length > 0 && (
        <div className="flex gap-4 flex-wrap px-4 py-3 bg-muted/20 border-b border-border text-xs">
          <span className="text-muted-foreground">Total GMV: <strong className="text-foreground">₹{totalAmount.toLocaleString("en-IN")}</strong></span>
          <span className="flex items-center gap-1 text-emerald-400"><ArrowUpRight className="w-3 h-3" /> Platform (2%): <strong>₹{totalPlatform.toLocaleString("en-IN")}</strong></span>
          <span className="flex items-center gap-1 text-muted-foreground"><ArrowDownRight className="w-3 h-3" /> Provider (98%): <strong className="text-foreground">₹{totalProvider.toLocaleString("en-IN")}</strong></span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Patient</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Service</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Date / Slot</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Total</th>
              {showCommission && <th className="text-left px-4 py-3 text-emerald-400 font-medium hidden lg:table-cell">Platform 2%</th>}
              {showCommission && <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Provider 98%</th>}
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{r.patientName}</div>
                  <div className="text-xs text-muted-foreground">{r.phone}</div>
                </td>
                <td className="px-4 py-3 text-foreground hidden sm:table-cell">{r.title}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{r.dateSlot}</td>
                <td className="px-4 py-3 font-medium text-foreground">₹{r.amount}</td>
                {showCommission && (
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-emerald-400 font-semibold">₹{r.platformFee ?? Math.round(r.amount * 0.02)}</span>
                  </td>
                )}
                {showCommission && (
                  <td className="px-4 py-3 text-foreground hidden lg:table-cell">₹{r.providerPayout ?? Math.round(r.amount * 0.98)}</td>
                )}
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CareActivityPage() {
  const [data, setData] = useState<CareActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"consultations" | "lab" | "medicine">("consultations");

  async function load() {
    setLoading(true);
    try {
      const d = await apiGet<CareActivity>("/admin/care-activity");
      setData(d);
    } catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const totalConsultations = data?.consultations.length ?? 0;
  const totalLabs = data?.labBookings.length ?? 0;
  const totalMeds = data?.medicineOrders.length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" /> Care Activity
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            All consultations, lab bookings, and medicine orders
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div
          onClick={() => setTab("consultations")}
          className={`bg-card border rounded-xl p-4 cursor-pointer transition-all ${tab === "consultations" ? "border-primary/50 bg-primary/5" : "border-card-border hover:border-primary/30"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">Consultations</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalConsultations}</div>
        </div>
        <div
          onClick={() => setTab("lab")}
          className={`bg-card border rounded-xl p-4 cursor-pointer transition-all ${tab === "lab" ? "border-primary/50 bg-primary/5" : "border-card-border hover:border-primary/30"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Lab Tests</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalLabs}</div>
        </div>
        <div
          onClick={() => setTab("medicine")}
          className={`bg-card border rounded-xl p-4 cursor-pointer transition-all ${tab === "medicine" ? "border-primary/50 bg-primary/5" : "border-card-border hover:border-primary/30"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-muted-foreground">Medicine Orders</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalMeds}</div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading care activity...</div>
        ) : (
          <>
            {tab === "consultations" && <CareTable items={data?.consultations ?? []} emptyMsg="No consultations booked yet" showCommission />}
            {tab === "lab" && <CareTable items={data?.labBookings ?? []} emptyMsg="No lab tests booked yet" showCommission />}
            {tab === "medicine" && <CareTable items={data?.medicineOrders ?? []} emptyMsg="No medicine orders placed yet" />}
          </>
        )}
      </div>
    </div>
  );
}
