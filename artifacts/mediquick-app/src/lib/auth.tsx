import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${BASE}/api${path}`;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  plan: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string, city?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe(savedToken: string) {
    const r = await fetch(apiUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${savedToken}` },
    });
    if (r.ok) {
      const u = await r.json();
      setUser(u);
      return true;
    }
    return false;
  }

  useEffect(() => {
    const saved = localStorage.getItem("mq_user_token");
    if (saved) {
      setToken(saved);
      fetchMe(saved)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    if (supabase) {
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const email = session.user.email ?? "";
          const name = session.user.user_metadata?.full_name ?? session.user.email ?? "User";
          try {
            const r = await fetch(apiUrl("/auth/google-login"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, name, googleId: session.user.id }),
            });
            if (r.ok) {
              const data = await r.json();
              localStorage.setItem("mq_user_token", data.token);
              setToken(data.token);
              setUser(data.user);
            }
          } catch {}
        }
      });
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Login failed");
    localStorage.setItem("mq_user_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function signup(name: string, email: string, password: string, phone = "", city = "") {
    const res = await fetch(apiUrl("/auth/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, city }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Signup failed");
    localStorage.setItem("mq_user_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function loginWithGoogle() {
    if (!supabase) throw new Error("Google login not configured");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + BASE + "/",
      },
    });
    if (error) throw new Error(error.message);
  }

  async function refreshUser() {
    const saved = localStorage.getItem("mq_user_token");
    if (saved) await fetchMe(saved);
  }

  function logout() {
    localStorage.removeItem("mq_user_token");
    setToken(null);
    setUser(null);
    supabase?.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
