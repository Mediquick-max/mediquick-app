import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MediQuickLogo } from "@/components/logo";

export default function SignupPage() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.phone, form.city);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const benefits = [
    "Book doctors, labs & medicine delivery",
    "Set medicine reminders",
    "AI health assistant in Hindi/Hinglish",
    "Track all your health activity",
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <MediQuickLogo className="w-8 h-8" />
            <span className="font-bold text-foreground">Medi Quick</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left: Benefits */}
          <div className="hidden md:block">
            <h1 className="text-3xl font-bold text-foreground mb-2">Join Medi Quick</h1>
            <p className="text-muted-foreground mb-8">Your complete healthcare companion. Free to get started.</p>
            <ul className="space-y-4">
              {benefits.map(b => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground text-sm font-medium">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Form */}
          <div>
            <div className="text-center mb-6 md:hidden">
              <h1 className="text-3xl font-bold text-foreground">Create account</h1>
              <p className="text-muted-foreground mt-2">Join Medi Quick — free to get started</p>
            </div>
            <div className="hidden md:block mb-6">
              <h2 className="text-xl font-bold text-foreground">Create your account</h2>
              <p className="text-muted-foreground text-sm mt-1">Takes less than a minute</p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-7 shadow-md">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update("name")}
                      placeholder="Rahul Sharma"
                      required
                      autoFocus
                      minLength={2}
                      className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update("phone")}
                      placeholder="9876543210"
                      className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={update("city")}
                    placeholder="Mumbai"
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Password *</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={update("password")}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Confirm Password *</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={update("confirmPassword")}
                    placeholder="Repeat your password"
                    required
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-2xl px-4 py-3 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-2xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
