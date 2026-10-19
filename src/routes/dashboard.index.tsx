import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Activity, Boxes, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [{ title: "Tableau de bord — Aetheris" }, { name: "description", content: "Tableau de bord de votre compte Aetheris Cloud." }, { property: "og:title", content: "Tableau de bord — Aetheris" }, { property: "og:description", content: "Tableau de bord de votre compte Aetheris Cloud." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
  }),
  component: DashboardHome,
});

interface UsageDay {
  day: string;
  tokens: number;
}

interface RecentEvent {
  id: string;
  created_at: string;
  model_name: string | null;
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

      const { data: last } = await supabase
        .from("usage_events")
        .select("id, created_at, model_name, tokens_input, tokens_output")
        .order("created_at", { ascending: false })
        .limit(10);
      setRecent(
        (last ?? []).map((e) => ({
          id: String(e.id),
          created_at: e.created_at ?? "",
          model_name: e.model_name ?? null,
          tokens: (e.tokens_input ?? 0) + (e.tokens_output ?? 0),
        })),
      );
    };
    void load();
  }, []);

  const credits = Number(profile?.credits_balance ?? 0);
  const max = Math.max(...usage.map((d) => d.tokens), 1);

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h1 className="font-display text-4xl font-light ">
          Accueil
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
      <div className="border-t py-6">
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
            <div key={d.day} className="flex-1 h-full flex flex-col justify-end items-center group relative">
              <div
                className="w-full rounded-t-md bg-primary transition-all hover:opacity-100 opacity-80"
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
      <div className="border-t py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-medium">Inférences récentes</h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune inférence enregistrée pour le moment. Les appels à{" "}
            <code className="font-mono">/api/v1/chat/completions</code> apparaîtront ici.
          </p>
        ) : (
          <div className="space-y-1">
            {recent.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-3 px-4 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="size-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">Inférence</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {a.model_name ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {a.created_at ? new Date(a.created_at).toLocaleString("fr-FR") : "—"}
                  </p>
                  <p className="text-xs font-mono">{a.tokens.toLocaleString("fr-FR")} tokens</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
  const glowClass = accent === "cyan" ? "" : "";

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="size-4 text-muted-foreground" /></div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{unit}</p>
      {cta && <Link to={cta.to} className="mt-4 inline-flex items-center gap-1 text-sm font-medium">{cta.label}<ArrowUpRight className="size-3" /></Link>}
    </div>
  );
}
