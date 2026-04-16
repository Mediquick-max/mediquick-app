import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${BASE}/api${path}`;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  plan: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string, city?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("mq_user_token");
    if (saved) {
      setToken(saved);
      fetch(apiUrl("/auth/me"), {
        headers: { Authorization: `Bearer ${saved}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(u => { if (u) setUser(u); else localStorage.removeItem("mq_user_token"); })
        .catch(() => localStorage.removeItem("mq_user_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
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

  function logout() {
    localStorage.removeItem("mq_user_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
