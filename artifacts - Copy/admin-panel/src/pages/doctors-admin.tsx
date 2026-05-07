import { useEffect, useState } from "react";
import { apiGet, apiUrl } from "@/lib/api";
import {
  Stethoscope, Plus, Edit2, Trash2, Loader2, X, Star,
  Video, Building2, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, XCircle, BadgeCheck, Mail, Phone, MapPin
} from "lucide-react";

interface Doctor {
  id: number; name: string; specialization: string; experienceYears: number;
  rating: number; totalReviews: number; fee: number; consultationType: string;
  city: string; status: string; languages: string; bio: string; qualifications: string;
  email?: string; phone?: string; hospitalName?: string; registrationStatus?: string;
}

const SPECS = [
  "General Physician", "Cardiologist", "Dermatologist", "Pediatrician",
  "Gynaecologist", "Orthopedic Surgeon", "Psychiatrist", "Diabetologist",
  "ENT Specialist", "Neurologist", "Ophthalmologist"
];

function TypeBadge({ type }: { type: string }) {
  if (type === "video") return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Video</span>;
  if (type === "clinic") return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Clinic</span>;
  return <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Both</span>;
}

const EMPTY_FORM = { name: "", specialization: "General Physician", experienceYears: "0", fee: "499", consultationType: "both", bio: "", qualifications: "", languages: "Hindi, English", city: "Mumbai" };

export default function DoctorsAdminPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending">("pending");

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function loadDoctors() {
    setLoading(true);
    try {
      const [all, pending] = await Promise.all([
        apiGet<Doctor[]>("/doctors/admin/all"),
        apiGet<Doctor[]>("/doctors/admin/pending"),
      ]);
      setDoctors(all);
      setPendingDoctors(pending);
      if (pending.length > 0) setActiveTab("pending");
      else setActiveTab("all");
    } catch { }
    setLoading(false);
  }

  useEffect(() => { loadDoctors(); }, []);

  async function handleApprove(id: number) {
    const token = localStorage.getItem("mq_admin_token") ?? "";
    await fetch(apiUrl(`/doctors/admin/${id}/approve`), {
      method: "PUT", headers: { Authorization: `Bearer ${token}` }
    });
    showToast("Doctor approved and listed!");
    loadDoctors();
  }

  async function handleReject(id: number) {
    if (!confirm("Reject this doctor registration?")) return;
    const token = localStorage.getItem("mq_admin_token") ?? "";
    await fetch(apiUrl(`/doctors/admin/${id}/reject`), {
      method: "PUT", headers: { Authorization: `Bearer ${token}` }
    });
    showToast("Doctor registration rejected");
    loadDoctors();
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(doc: Doctor) {
    setForm({
      name: doc.name, specialization: doc.specialization,
      experienceYears: String(doc.experienceYears), fee: String(doc.fee),
      consultationType: doc.consultationType, bio: doc.bio,
      qualifications: doc.qualifications, languages: doc.languages, city: doc.city,
    });
    setEditId(doc.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("mq_admin_token") ?? "";
      const body = { ...form, experienceYears: Number(form.experienceYears), fee: Number(form.fee) };
      if (editId) {
        await fetch(apiUrl(`/doctors/admin/${editId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        showToast("Doctor updated successfully");
      } else {
        await fetch(apiUrl("/doctors/admin/create"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        showToast("Doctor added successfully");
      }
      setShowForm(false);
      loadDoctors();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to deactivate this doctor?")) return;
    setDeleteId(id);
    const token = localStorage.getItem("mq_admin_token") ?? "";
    await fetch(apiUrl(`/doctors/admin/${id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteId(null);
    showToast("Doctor deactivated");
    loadDoctors();
  }

  const activeDoctors = doctors.filter(d => d.status === "active");

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" /> Doctor Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage doctor profiles and approve registrations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadDoctors} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-sm hover:bg-secondary/80">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Doctor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{activeDoctors.length}</p>
          <p className="text-sm text-muted-foreground">Active Doctors</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingDoctors.length}</p>
          <p className="text-sm text-muted-foreground">Pending Approval</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{activeDoctors.filter(d => d.consultationType !== "clinic").length}</p>
          <p className="text-sm text-muted-foreground">Video Doctors</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{activeDoctors.length > 0 ? (activeDoctors.reduce((s, d) => s + d.rating, 0) / activeDoctors.length).toFixed(1) : "—"}</p>
          <p className="text-sm text-muted-foreground">Avg Rating</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === "pending" ? "text-amber-600 border-amber-500" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
          <Clock className="w-3.5 h-3.5" /> Pending Approvals
          {pendingDoctors.length > 0 && <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingDoctors.length}</span>}
        </button>
        <button onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === "all" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
          <Stethoscope className="w-3.5 h-3.5" /> All Doctors ({doctors.length})
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingDoctors.length === 0 ? (
            <div className="bg-card border border-card-border rounded-xl p-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
              <p className="font-semibold">All caught up! No pending approvals.</p>
            </div>
          ) : (
            pendingDoctors.map(doc => (
              <div key={doc.id} className="bg-card border-2 border-amber-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base">{doc.name}</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    </div>
                    <div className="text-primary font-semibold text-sm">{doc.specialization}</div>
                    <div className="text-muted-foreground text-xs mt-1">{doc.qualifications}</div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {doc.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{doc.email}</span>}
                      {doc.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{doc.phone}</span>}
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{doc.city}</span>
                      {doc.hospitalName && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{doc.hospitalName}</span>}
                      <span>₹{doc.fee}/consult • {doc.experienceYears} yrs exp</span>
                    </div>
                    {doc.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{doc.bio}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleApprove(doc.id)}
                      className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                      <BadgeCheck className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleReject(doc.id)}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 border border-red-200 transition-colors">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "all" && (loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary/40" /></div>
      ) : (
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">DOCTOR</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">SPECIALIZATION</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">TYPE</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">FEE</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">RATING</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">STATUS</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(doc => (
                <tr key={doc.id} className="border-b border-card-border/50 hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.city} · {doc.experienceYears} yrs</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{doc.specialization}</td>
                  <td className="px-4 py-3"><TypeBadge type={doc.consultationType} /></td>
                  <td className="px-4 py-3 font-semibold text-primary">₹{doc.fee}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-amber-500 text-sm font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {doc.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(doc)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/60">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} disabled={deleteId === doc.id} className="text-destructive/60 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 disabled:opacity-50">
                        {deleteId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-card-border">
            <div className="sticky top-0 bg-card border-b border-card-border px-5 py-3 flex items-center justify-between">
              <h2 className="font-bold text-foreground">{editId ? "Edit Doctor" : "Add New Doctor"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Dr. Asha Mehta"
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Specialization *</label>
                  <select value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    {SPECS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Consultation Type</label>
                  <select value={form.consultationType} onChange={e => setForm(f => ({ ...f, consultationType: e.target.value }))}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="video">Video Only</option>
                    <option value="clinic">Clinic Only</option>
                    <option value="both">Video + Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Experience (years)</label>
                  <input type="number" min="0" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Consultation Fee (₹)</label>
                  <input type="number" min="0" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Languages</label>
                  <input value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} placeholder="Hindi, English"
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Qualifications</label>
                  <input value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} placeholder="MBBS, MD..."
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                    className="w-full bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-card-border py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary/30">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving..." : editId ? "Update Doctor" : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
