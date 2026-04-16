import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api";
import { Key, RefreshCw, Eye, EyeOff, Save, CheckCircle } from "lucide-react";

interface ApiConfigItem {
  id: number;
  provider: string;
  label: string;
  keyValue: string;
  isActive: string;
  notes: string;
  updatedAt: string;
}

export default function ApiKeysPage() {
  const [configs, setConfigs] = useState<ApiConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<number, { keyValue: string; isActive: string; notes: string }>>({});
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<ApiConfigItem[]>("/admin/api-config");
      setConfigs(data);
      const initial: typeof editing = {};
      data.forEach(c => {
        initial[c.id] = { keyValue: c.keyValue, isActive: c.isActive, notes: c.notes };
      });
      setEditing(initial);
    } catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveConfig(id: number) {
    setSaving(id);
    try {
      const updated = await apiPatch<ApiConfigItem>(`/admin/api-config/${id}`, editing[id]);
      setConfigs(prev => prev.map(c => c.id === id ? updated : c));
      setSaved(id);
      setTimeout(() => setSaved(null), 2000);
    } catch { }
    setSaving(null);
  }

  const PROVIDER_ICONS: Record<string, string> = {
    openai: "🤖",
    gemini: "✨",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" /> API Configuration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage API providers and keys for AI features</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-primary/10 border border-primary/30 rounded-xl px-5 py-4 text-sm text-primary">
        <strong>Note:</strong> The OpenAI key is auto-managed by Replit AI Integrations — no manual key entry needed for it. Only add a custom key if you want to override with your own account.
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-muted rounded w-40 mb-4" />
              <div className="h-10 bg-muted rounded mb-3" />
              <div className="h-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map(config => {
            const edit = editing[config.id] ?? { keyValue: config.keyValue, isActive: config.isActive, notes: config.notes };
            const isReplit = config.provider === "openai";

            return (
              <div key={config.id} className="bg-card border border-card-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{PROVIDER_ICONS[config.provider] ?? "🔑"}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{config.label}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{config.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      edit.isActive === "true"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {edit.isActive === "true" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">API Key</label>
                    <div className="relative">
                      <input
                        type={showKey[config.id] ? "text" : "password"}
                        value={edit.keyValue}
                        onChange={e => setEditing(prev => ({ ...prev, [config.id]: { ...prev[config.id], keyValue: e.target.value } }))}
                        placeholder={isReplit ? "Auto-managed by Replit (leave blank to use default)" : "Enter API key..."}
                        className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12 text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(prev => ({ ...prev, [config.id]: !prev[config.id] }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey[config.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                    <select
                      value={edit.isActive}
                      onChange={e => setEditing(prev => ({ ...prev, [config.id]: { ...prev[config.id], isActive: e.target.value } }))}
                      className="bg-input border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                    <textarea
                      value={edit.notes}
                      onChange={e => setEditing(prev => ({ ...prev, [config.id]: { ...prev[config.id], notes: e.target.value } }))}
                      rows={2}
                      className="w-full bg-input border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      Last updated: {new Date(config.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <button
                      onClick={() => saveConfig(config.id)}
                      disabled={saving === config.id}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {saved === config.id ? (
                        <><CheckCircle className="w-4 h-4" /> Saved!</>
                      ) : (
                        <><Save className="w-4 h-4" /> Save Changes</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
