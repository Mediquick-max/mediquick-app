import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import {
  Users, TrendingUp, CreditCard, Activity,
  UserCheck, IndianRupee, Stethoscope, FlaskConical,
  Package, Star, RefreshCw
} from "lucide-react";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  activeSubscriptions: number;
  totalConsultations: number;
  totalLabBookings: number;
  totalMedicineOrders: number;
  newUsersThisMonth: number;
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

interface CardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, sub, color }: CardProps) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");
    try {
      const s = await apiGet<Stats>("/admin/stats");
      setStats(s);
    } catch {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Platform overview and key metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
          <button onClick={loadStats} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Platform overview and key metrics</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Revenue row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={fmt(stats.totalRevenue)}
          sub="All successful payments"
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly Revenue"
          value={fmt(stats.monthlyRevenue)}
          sub="This month"
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          icon={CreditCard}
          label="Total Payments"
          value={stats.totalPayments}
          sub={`${stats.successfulPayments} successful`}
          color="bg-violet-500/20 text-violet-400"
        />
        <StatCard
          icon={Star}
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          sub="Premium + Basic"
          color="bg-amber-500/20 text-amber-400"
        />
      </div>

      {/* Users row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          sub={`+${stats.newUsersThisMonth} this month`}
          color="bg-primary/20 text-primary"
        />
        <StatCard
          icon={UserCheck}
          label="Active Users"
          value={stats.activeUsers}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          icon={Activity}
          label="Premium Users"
          value={stats.premiumUsers}
          color="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          icon={Users}
          label="Free Users"
          value={stats.freeUsers}
          color="bg-slate-500/20 text-slate-400"
        />
      </div>

      {/* Care activity row */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Care Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Stethoscope}
            label="Consultations Booked"
            value={stats.totalConsultations}
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard
            icon={FlaskConical}
            label="Lab Tests Booked"
            value={stats.totalLabBookings}
            color="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard
            icon={Package}
            label="Medicine Orders"
            value={stats.totalMedicineOrders}
            color="bg-violet-500/20 text-violet-400"
          />
        </div>
      </div>

      {/* Quick summary */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Platform Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{Math.round((stats.premiumUsers / Math.max(stats.totalUsers, 1)) * 100)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Premium Conversion</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Active Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">{Math.round((stats.successfulPayments / Math.max(stats.totalPayments, 1)) * 100)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Payment Success Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-violet-400">{stats.totalConsultations + stats.totalLabBookings + stats.totalMedicineOrders}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Care Requests</div>
          </div>
        </div>
      </div>
    </div>
  );
}
