import { NavLink, Outlet } from "react-router-dom";
import { Home, Calendar, Brain, Trophy, LogOut, Sparkles, ListChecks } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/app", label: "Hoje", icon: Home, end: true },
  { to: "/app/cronograma", label: "Cronograma", icon: Calendar },
  { to: "/app/foco", label: "Foco", icon: Brain },
  { to: "/app/questoes", label: "Questões", icon: ListChecks },
  { to: "/app/conquistas", label: "Conquistas", icon: Trophy },
];

export const AppShell = () => {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <NavLink to="/app" className="font-display text-xl tracking-tight inline-flex items-center gap-2">
            <span className="size-7 rounded-lg bg-gradient-warm grid place-items-center text-accent-foreground">
              <Sparkles className="size-4" />
            </span>
            Foco Leve
          </NavLink>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">Nv. {profile.level}</span>
                <span className="text-muted-foreground">{profile.xp} XP</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 sm:py-10 pb-28 sm:pb-10">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border">
        <div className="grid grid-cols-5">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end as any}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-[11px] transition-smooth ${isActive ? "text-accent" : "text-muted-foreground"}`
              }>
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop side dock */}
      <aside className="hidden sm:flex fixed left-6 top-1/2 -translate-y-1/2 z-20 flex-col gap-1 p-2 rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-soft">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end as any} title={label}
            className={({ isActive }) =>
              `size-11 grid place-items-center rounded-xl transition-smooth ${isActive ? "bg-gradient-warm text-accent-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
            }>
            <Icon className="size-5" />
          </NavLink>
        ))}
      </aside>
    </div>
  );
};
