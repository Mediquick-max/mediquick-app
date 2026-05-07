import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Crown, Sparkles, Shield, Zap, CheckCircle2, Loader2,
  BadgeCheck, Star, ArrowRight, Stethoscope, FlaskConical
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MediQuickLogo } from "@/components/logo";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const PLAN_ICONS: Record<string, any> = {
  free: Shield, gold: Crown, platinum: Sparkles, yearly: Zap,
};

const GRADIENT: Record<string, string> = {
  free:     "linear-gradient(135deg, #9ca3af, #4b5563)",
  gold:     "linear-gradient(135deg, #f59e0b, #d97706)",
  platinum: "linear-gradient(135deg, #a855f7, #7c3aed)",
  yearly:   "linear-gradient(135deg, #10b981, #0d9488)",
};

const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  gold:     { label: "Popular",   bg: "bg-amber-100",   color: "text-amber-700"  },
  platinum: { label: "Best Value", bg: "bg-purple-100",  color: "text-purple-700" },
  yearly:   { label: "Yearly",    bg: "bg-emerald-100", color: "text-emerald-700"},
};

interface Plan {
  id: string; name: string; price: number; duration: number;
  color: string; tag: string; benefits: string[];
}

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/patient/membership/plans`)
      .then(r => r.json())
      .then(d => setPlans(d.plans ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf6ef]">
      <header className="bg-white border-b border-border/40 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MediQuickLogo className="w-7 h-7" />
            <div className="font-bold text-sm leading-none">Medi Quick</div>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/my-dashboard" className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                My Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-foreground hover:text-primary px-3 py-2">Login</Link>
                <Link href="/signup" className="bg-primary text-white px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-colors">Sign Up Free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
            <Star className="w-4 h-4" /> Medi Quick Membership Plans
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Apna Health Plan Chuno
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Doctor consultations, lab tests, aur premium health benefits — sab ek jagah. Upgrade karke unlimited access lo.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map(plan => {
              const Icon = PLAN_ICONS[plan.id] ?? Shield;
              const badge = BADGE[plan.id];
              return (
                <div key={plan.id}
                  className={`relative bg-white rounded-3xl border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col ${plan.id === "gold" ? "border-amber-300" : plan.id === "lifetime" ? "border-emerald-400 scale-[1.02]" : "border-border/50"}`}>
                  {badge && (
                    <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${badge.bg} ${badge.color}`}>
                      {badge.label}
                    </div>
                  )}
                  <div style={{ background: GRADIENT[plan.id] ?? GRADIENT.free }} className="p-5 text-white">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="font-bold text-xl">{plan.name}</div>
                    <div className="mt-2">
                      {plan.price === 0 ? (
                        <div className="text-2xl font-black">Free</div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black">₹{plan.price}</span>
                          <span className="text-white/70 text-sm">{plan.tag ? `· ${plan.tag}` : "/month"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <ul className="space-y-2.5 flex-1">
                      {plan.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-foreground">{b}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5">
                      {plan.price === 0 ? (
                        user ? (
                          <div className="w-full py-2.5 rounded-2xl text-sm font-bold text-center bg-gray-100 text-gray-500">
                            Current Plan
                          </div>
                        ) : (
                          <Link href="/signup"
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-2xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                            Get Started Free
                          </Link>
                        )
                      ) : (
                        <Link href={user ? "/my-dashboard" : "/signup"}
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                          style={{ background: GRADIENT[plan.id] }}>
                          {user ? "Upgrade Now" : "Sign Up & Upgrade"}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: Stethoscope, title: "Top Doctors", desc: "Verified & experienced specialists across 20+ specializations" },
            { icon: FlaskConical, title: "NABL Certified Labs", desc: "Home sample collection, reports in 12–24 hours" },
            { icon: BadgeCheck,   title: "Secure & Private", desc: "Your health data is encrypted and never shared" },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-3xl border border-border/50 p-5 flex items-start gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-sm">{f.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-primary to-orange-600 rounded-3xl p-8 text-white text-center space-y-4">
          <div className="text-2xl font-black">₹999 mein Poora Saal ka Access</div>
          <p className="text-white/80 text-sm max-w-md mx-auto">
            Ek baar pay karo aur poore saal ke liye unlimited consultations, lab discounts, aur premium benefits lo!
          </p>
          <Link href={user ? "/my-dashboard" : "/signup"}
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-2xl font-bold text-sm hover:bg-white/90 transition-all">
            <Zap className="w-4 h-4" /> Get Yearly Access
          </Link>
        </div>
      </div>
    </div>
  );
}
