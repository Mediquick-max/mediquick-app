import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LogIn, UserPlus, LogOut, ChevronDown, Store, Stethoscope, Pill,
  Home, X, MapPin, LocateFixed, Loader2, FlaskConical, LayoutDashboard,
  Crown,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MediQuickLogo } from "@/components/logo";
import { useGeolocation } from "@/lib/use-geolocation";
import { usePermissions } from "@/lib/use-permissions";

const NAV_LINKS = [
  { href: "/", label: "Home", shortLabel: "Home", icon: Home },
  { href: "/consult", label: "Consult Doctor", shortLabel: "Consult", icon: Stethoscope },
  { href: "/lab-tests", label: "Lab Tests", shortLabel: "Lab Tests", icon: FlaskConical },
  { href: "/medicine", label: "Order Medicine", shortLabel: "Medicine", icon: Pill },
  { href: "/plans", label: "Plans", shortLabel: "Plans", icon: Crown },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const geo = useGeolocation();
  usePermissions();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">

      {/* ── Desktop / Tablet Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group" data-testid="link-home">
              <div className="group-hover:scale-105 group-active:scale-95 transition-all duration-300 ease-out">
                <MediQuickLogo className="w-8 h-8" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-foreground block leading-none">Medi Quick</span>
                {geo.location ? (
                  <span className="flex items-center gap-0.5 text-xs text-primary font-medium leading-none mt-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {geo.location.city}
                  </span>
                ) : geo.loading ? (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground leading-none mt-0.5">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Detecting...
                  </span>
                ) : null}
              </div>
            </Link>
          </div>

          {/* Desktop Nav (hidden on mobile — bottom nav handles it) */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_LINKS.map(n => (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  location === n.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}>
                <n.icon className="w-3.5 h-3.5" /> {n.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!geo.location && !geo.loading && !geo.permissionDenied && (
              <button onClick={geo.detectLocation}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary border border-border hover:border-primary/40 px-2.5 py-1.5 rounded-xl transition-all">
                <LocateFixed className="w-3.5 h-3.5" /> Detect Location
              </button>
            )}
            {!loading && (
              user ? (
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-2xl transition-colors text-sm font-semibold">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block max-w-20 truncate">{user.name.split(" ")[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-lg py-2 z-20">
                        <div className="px-4 py-2 border-b border-border mb-1">
                          <div className="font-semibold text-foreground text-sm truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          {geo.location && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary font-medium">
                              <MapPin className="w-3 h-3" /> {geo.location.displayName}
                            </div>
                          )}
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              user.plan === "premium" ? "bg-amber-500/20 text-amber-600" :
                              user.plan === "basic" ? "bg-blue-500/20 text-blue-600" :
                              "bg-muted text-muted-foreground"
                            }`}>{user.plan} plan</span>
                          </div>
                        </div>
                        <div className="px-2 space-y-0.5">
                          <Link href="/my-dashboard" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-foreground hover:bg-secondary/60 transition-colors font-medium">
                            <LayoutDashboard className="w-4 h-4 text-blue-600" /> My Dashboard
                          </Link>
                          <Link href="/shopkeeper" onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-foreground hover:bg-secondary/60 transition-colors font-medium">
                            <Store className="w-4 h-4 text-primary" /> Shopkeeper Panel
                          </Link>
                          <button onClick={() => { logout(); setMenuOpen(false); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login"
                    className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-2xl hover:bg-primary/10">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                  <Link href="/signup"
                    className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 px-4 py-1.5 rounded-2xl transition-all">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* ── Desktop Footer ── */}
      <footer className="hidden sm:block border-t border-border/40 bg-background/60 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 Medi Quick</span>
          <div className="flex items-center gap-4">
            <Link href="/doctor-panel"
              className="flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              <Stethoscope className="w-3.5 h-3.5" /> Doctor hain? Register karein
            </Link>
            <Link href="/lab-center"
              className="flex items-center gap-1.5 font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              <FlaskConical className="w-3.5 h-3.5" /> Lab Center? Register karein
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-16 safe-area-inset-bottom">
          {NAV_LINKS.map(n => {
            const isActive = location === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 px-1 transition-all active:scale-95 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/10" : ""}`}>
                  <n.icon className={`w-5 h-5 transition-all ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                </div>
                <span className={`text-[10px] font-medium leading-none transition-all ${isActive ? "font-bold" : ""}`}>
                  {n.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
