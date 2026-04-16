import { useEffect, useState } from "react";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { Users, Search, RefreshCw, Edit2, Trash2, Check, X } from "lucide-react";

interface AppUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  city: string;
  deviceType: string;
  joinedAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  premium: "bg-amber-500/20 text-amber-400",
  basic: "bg-blue-500/20 text-blue-400",
  free: "bg-slate-500/20 text-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  inactive: "bg-destructive/20 text-destructive",
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ plan: string; status: string }>({ plan: "", status: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<AppUser[]>("/admin/users");
      setUsers(data);
    } catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.city.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(u: AppUser) {
    setEditId(u.id);
    setEditValues({ plan: u.plan, status: u.status });
  }

  async function saveEdit(id: number) {
    setSaving(true);
    try {
      const updated = await apiPatch<AppUser>(`/admin/users/${id}`, editValues);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
      setEditId(null);
    } catch { }
    setSaving(false);
  }

  async function deleteUser(id: number) {
    try {
      await apiDelete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { }
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Users
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} registered users</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, city..."
          className="w-full bg-card border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">City</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground hidden md:table-cell">{user.phone || "—"}</td>
                    <td className="px-4 py-3 text-foreground hidden sm:table-cell">{user.city || "—"}</td>
                    <td className="px-4 py-3">
                      {editId === user.id ? (
                        <select
                          value={editValues.plan}
                          onChange={e => setEditValues(v => ({ ...v, plan: e.target.value }))}
                          className="bg-input border border-border rounded-lg px-2 py-1 text-sm text-foreground"
                        >
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="premium">Premium</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PLAN_COLORS[user.plan] ?? "bg-muted text-muted-foreground"}`}>
                          {user.plan}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editId === user.id ? (
                        <select
                          value={editValues.status}
                          onChange={e => setEditValues(v => ({ ...v, status: e.target.value }))}
                          className="bg-input border border-border rounded-lg px-2 py-1 text-sm text-foreground"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[user.status] ?? "bg-muted text-muted-foreground"}`}>
                          {user.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {new Date(user.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      {editId === user.id ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => saveEdit(user.id)} disabled={saving} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : deleteConfirm === user.id ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <button onClick={() => startEdit(user)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
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
