import { ReactNode } from "react";
import { Link } from "wouter";
import { HeartPulse } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" data-testid="link-home">
            <div className="bg-primary text-primary-foreground p-2 rounded-2xl shadow-sm group-hover:scale-105 group-active:scale-95 transition-all duration-300 ease-out">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">MediQuick</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
