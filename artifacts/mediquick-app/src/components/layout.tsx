import { ReactNode, useState } from "react";
import { Link } from "wouter";
import { LogIn, UserPlus, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MediQuickLogo } from "@/components/logo";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
            <div className="text-primary-foreground shadow-sm group-hover:scale-105 group-active:scale-95 transition-all duration-300 ease-out">
              <MediQuickLogo className="w-9 h-9" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">Medi Quick</span>
          </Link>

          {!loading && (
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-2xl transition-colors text-sm font-semibold"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block max-w-24 truncate">{user.name.split(" ")[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-lg py-2 z-20">
                        <div className="px-4 py-2 border-b border-border mb-1">
                          <div className="font-semibold text-foreground text-sm truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              user.plan === "premium" ? "bg-amber-500/20 text-amber-600" :
                              user.plan === "basic" ? "bg-blue-500/20 text-blue-600" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {user.plan} plan
                            </span>
                          </div>
                        </div>
                        <div className="px-2">
                          <button
                            onClick={() => { logout(); setMenuOpen(false); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-2xl hover:bg-primary/10"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 px-4 py-1.5 rounded-2xl transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
