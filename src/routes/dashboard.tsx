import { createFileRoute, Outlet, redirect, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  KeyRound,
  Boxes,
  Terminal,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({
        to: "/auth",
        search: { mode: "signin", redirect: location.href },
      });
    }
  },
  component: DashboardLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/api-keys", label: "Clés API", icon: KeyRound },
  { to: "/dashboard/models", label: "Modèles", icon: Boxes },
  { to: "/dashboard/workspace", label: "Workspace", icon: Terminal },
  { to: "/dashboard/billing", label: "Facturation", icon: CreditCard },
  { to: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);

  const initials = (profile?.full_name || profile?.email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const tierLabel = {
    free: "Free",
    pro: "Pro",
    business: "Business",
  }[profile?.subscription_tier ?? "free"];

  const tokensUsedPct = profile
    ? Math.min(100, Math.round(((100000 - Number(profile.credits_balance)) / 100000) * 100))
    : 0;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const Sidebar = (
    <aside className="lg:w-72 w-full shrink-0 flex flex-col glass rounded-3xl p-3 lg:p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
      <Link to="/" className="px-4 py-5 flex items-center gap-3 group">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-90" />
          <div className="absolute inset-0 rounded-xl shadow-glow-cyan opacity-50" />
          <div className="relative h-full w-full rounded-xl flex items-center justify-center font-display text-background font-bold text-xl">
            Æ
          </div>
        </div>
        <span className="font-display text-xl font-semibold tracking-tight italic">Aetheris</span>
      </Link>

      <nav className="flex-1 flex flex-col gap-1 mt-2 px-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all ${
                active
                  ? "bg-white/10 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
              <span className="font-medium">{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-glow-cyan" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Forfait {tierLabel}
          </p>
          <Link
            to="/dashboard/billing"
            className="text-[10px] text-primary uppercase tracking-widest hover:text-primary/80"
          >
            Upgrader
          </Link>
        </div>
        <p className="text-sm text-foreground mt-1 font-mono">
          {((100000 - (profile?.credits_balance ?? 100000)) / 1000).toFixed(1)}k / 100k
        </p>
        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-primary shadow-glow-cyan transition-all"
            style={{ width: `${tokensUsedPct}%` }}
          />
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="font-medium">Déconnexion</span>
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-foreground antialiased relative overflow-x-hidden">
      {/* Atmospheric background */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 10% 20%, oklch(0.65 0.24 295 / 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, oklch(0.78 0.18 220 / 0.10) 0%, transparent 40%)",
          backgroundAttachment: "fixed",
        }}
      />

      <div className="relative flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-6 min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden glass rounded-2xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center font-display text-background font-bold">
              Æ
            </div>
            <span className="font-display font-semibold italic">Aetheris</span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-foreground"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Sidebar — desktop always, mobile when open */}
        <div className={`${mobileOpen ? "block" : "hidden"} lg:block`}>{Sidebar}</div>

        {/* Main */}
        <main className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Desktop topbar */}
          <header className="hidden lg:flex h-20 items-center justify-between px-8 glass rounded-3xl">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-medium">
                {NAV.find((n) => isActive(n.to, n.exact))?.label ?? "Console"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold">{profile?.full_name ?? profile?.email}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {tierLabel} · Développeur
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-surface-elevated border border-border overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="font-display font-semibold text-sm">{initials}</span>
                )}
              </div>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
