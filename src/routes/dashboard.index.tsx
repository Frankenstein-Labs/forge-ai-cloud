import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Activity, Boxes, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [{ title: "Tableau de bord — Aetheris" }],
  }),
  component: DashboardHome,
});

interface UsageDay {
  day: string;
  tokens: number;
}

function DashboardHome() {
  const { profile } = useAuth();
  const [activeDeployments, setActiveDeployments] = useState(0);
  const [totalDeployments, setTotalDeployments] = useState(0);
  const [tokensThisMonth, setTokensThisMonth] = useState(0);
  const [usage, setUsage] = useState<UsageDay[]>([]);
  const [recent, setRecent] = useState<RecentEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: deploys } = await supabase.from("deployments").select("status");
      if (deploys) {
        setTotalDeployments(deploys.length);
        setActiveDeployments(deploys.filter((d) => d.status === "active").length);
      }

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: events } = await supabase
        .from("usage_events")
        .select("tokens_input, tokens_output, created_at")
        .gte("created_at", since.toISOString());

      const total = (events ?? []).reduce(
        (a, e) => a + (e.tokens_input ?? 0) + (e.tokens_output ?? 0),
        0,
      );
      setTokensThisMonth(total);

      // Série réelle sur 30 jours (0 quand il n'y a aucune consommation)
      const days: UsageDay[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const dayTotal = (events ?? [])
          .filter((e) => e.created_at?.slice(0, 10) === key)
          .reduce((a, e) => a + (e.tokens_input ?? 0) + (e.tokens_output ?? 0), 0);
        days.push({ day: key, tokens: dayTotal });
      }
      setUsage(days);
    };
    void load();
  }, []);

  const credits = Number(profile?.credits_balance ?? 0);
  const max = Math.max(...usage.map((d) => d.tokens), 1);

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h1 className="font-display text-4xl font-light tracking-tight">
          Bienvenue<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Vue d'ensemble de votre infrastructure IA en temps réel.
        </p>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Crédits restants"
          value={`${(credits / 1000).toFixed(1)}k`}
          unit="tokens"
          icon={TrendingUp}
          accent="cyan"
          cta={{ to: "/dashboard/billing", label: "Recharger" }}
        />
        <StatCard
          label="Tokens consommés"
          value={tokensThisMonth.toLocaleString("fr-FR")}
          unit="ce mois"
          icon={Activity}
          accent="plasma"
        />
        <StatCard
          label="Déploiements"
          value={`${activeDeployments}`}
          unit={`actifs / ${totalDeployments} total`}
          icon={Boxes}
          accent="cyan"
          cta={{ to: "/dashboard/models", label: "Gérer" }}
        />
      </div>

      {/* Usage chart */}
      <div className="glass rounded-3xl p-6 lg:p-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-medium">Consommation quotidienne</h2>
            <p className="text-sm text-muted-foreground mt-1">30 derniers jours · tokens</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-light tabular-nums">
              {usage.reduce((a, d) => a + d.tokens, 0).toLocaleString("fr-FR")}
            </p>
            <p className="text-xs text-muted-foreground">tokens cumulés</p>
          </div>
        </div>

        <div className="flex items-end gap-1 h-48">
          {usage.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center group relative">
              <div
                className="w-full rounded-t-md bg-gradient-primary transition-all hover:opacity-100 opacity-80"
                style={{ height: `${(d.tokens / max) * 100}%`, minHeight: "2px" }}
              />
              <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-elevated border border-border rounded-md px-2 py-1 text-[10px] font-mono whitespace-nowrap pointer-events-none z-10">
                {d.tokens.toLocaleString("fr-FR")}
              </div>
              {i % 5 === 0 && (
                <span className="text-[9px] text-muted-foreground mt-2 font-mono">
                  {d.day.slice(5)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent activities */}
      <div className="glass rounded-3xl p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-medium">Activités récentes</h2>
          <button className="text-xs text-primary hover:text-primary/80 uppercase tracking-widest font-semibold">
            Voir tout
          </button>
        </div>
        <div className="space-y-1">
          {[
            { date: "À l'instant", action: "Création de compte", model: "—", cost: "—" },
            { date: "Il y a 2 min", action: "Génération clé API", model: "—", cost: "—" },
            { date: "Il y a 1 h", action: "Inférence", model: "llama-3.1-70b", cost: "0,87 €" },
          ].map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="size-2 rounded-full bg-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.action}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.model}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">{a.date}</p>
                <p className="text-xs font-mono">{a.cost}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  accent,
  cta,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "cyan" | "plasma";
  cta?: { to: string; label: string };
}) {
  const accentClass = accent === "cyan" ? "text-primary" : "text-secondary";
  const glowClass = accent === "cyan" ? "shadow-glow-cyan" : "shadow-glow-plasma";

  return (
    <div className="glass rounded-3xl p-6 relative overflow-hidden group">
      <div
        className={`absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-10 blur-2xl ${
          accent === "cyan" ? "bg-primary" : "bg-secondary"
        }`}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            {label}
          </p>
          <div
            className={`size-8 rounded-xl bg-white/5 flex items-center justify-center ${glowClass}`}
          >
            <Icon className={`h-4 w-4 ${accentClass}`} />
          </div>
        </div>
        <p className="font-display text-3xl font-light mt-4 tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{unit}</p>
        {cta && (
          <Link
            to={cta.to}
            className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-semibold uppercase tracking-widest"
          >
            {cta.label} <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
