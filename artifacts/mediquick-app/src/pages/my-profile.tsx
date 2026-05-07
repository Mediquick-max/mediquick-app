import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { User, Camera, Loader2, CheckCircle2, Bell, BellOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { sseManager } from "@/lib/sse";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export default function MyProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [liveNotifs, setLiveNotifs] = useState<Notification[]>([]);
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    sseManager.connect(token);
    setSseConnected(true);

    const handler = (data: any) => {
      const notif: Notification = {
        id: Date.now().toString(),
        title: data.title ?? "MediQuick",
        body: data.body ?? "",
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        read: false,
      };
      setLiveNotifs(prev => [notif, ...prev].slice(0, 10));
      if (notifPermission === "granted") {
        new window.Notification(notif.title, { body: notif.body, icon: "/favicon.ico" });
      }
    };

    sseManager.on("notification", handler);
    sseManager.on("order_update", handler);
    sseManager.on("appointment_update", handler);

    return () => {
      sseManager.off("notification", handler);
      sseManager.off("order_update", handler);
      sseManager.off("appointment_update", handler);
    };
  }, [token, notifPermission]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setUploadError("File size must be under 5MB"); return; }

    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const r = await fetch(`${API}/api/upload/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await r.json();
      if (!r.ok) { setUploadError(data.error ?? "Upload failed"); return; }
      await refreshUser();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <User className="w-16 h-16 text-primary/40" />
          <h2 className="text-2xl font-bold">My Profile</h2>
          <p className="text-muted-foreground">Please log in to view your profile</p>
          <Link href="/login" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-2xl font-semibold hover:bg-primary/90 transition-colors">
            Login
          </Link>
        </div>
      </Layout>
    );
  }

  const avatarSrc = user.avatarUrl || null;

  return (
    <Layout>
      <div className="max-w-lg mx-auto pb-16 space-y-5">
        <div className="flex items-center gap-3 pt-2">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">My Profile</h1>
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-primary">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>

          <div className="text-center">
            <div className="font-bold text-lg">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold capitalize">
              {user.plan} Plan
            </div>
          </div>

          {uploadSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-2xl px-4 py-2 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Profile photo updated!
            </div>
          )}
          {uploadError && (
            <div className="text-destructive text-sm bg-destructive/10 rounded-2xl px-4 py-2">{uploadError}</div>
          )}

          <p className="text-xs text-muted-foreground">Tap the camera icon to update your photo (max 5MB, JPEG/PNG/WebP)</p>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Account Details
          </h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Name", value: user.name },
              { label: "Email", value: user.email },
              { label: "Plan", value: user.plan, className: "capitalize" },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`font-semibold ${row.className ?? ""}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Notifications */}
        <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" /> Live Notifications
              {sseConnected && (
                <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                </span>
              )}
            </h2>
            {notifPermission !== "granted" ? (
              <button onClick={requestNotifPermission}
                className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Enable Push
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Push enabled
              </span>
            )}
          </div>

          {notifPermission === "denied" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-800">
              <BellOff className="w-4 h-4 shrink-0 mt-0.5" />
              Browser ne notifications block kar diya hai. Browser settings mein jaake allow karein.
            </div>
          )}

          {liveNotifs.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              Koi nayi notification nahi. Orders aur appointments ki updates yahaan dikhegi.
            </div>
          ) : (
            <div className="space-y-2">
              {liveNotifs.map(n => (
                <div key={n.id} className={`rounded-2xl p-3 text-sm border ${n.read ? "bg-secondary/20 border-border/30" : "bg-blue-50 border-blue-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-foreground">{n.title}</div>
                    <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
                  </div>
                  {n.body && <div className="text-muted-foreground mt-0.5">{n.body}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
