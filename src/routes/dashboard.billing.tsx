import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Sparkles, Zap, Crown, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/billing")({
  head: () => ({
    meta: [{ title: "Facturation — Aetheris" }],
  }),
  component: BillingPage,
});

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "0 €",
    period: "à vie",
    icon: Sparkles,
    features: ["100k tokens/mois", "1 modèle déployé", "Communauté"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "29 €",
    period: "/mois",
    icon: Zap,
    features: ["10M tokens/mois", "10 modèles déployés", "Support prioritaire", "Workspace GPU"],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "99 €",
    period: "/mois",
    icon: Crown,
    features: ["Illimité", "Équipe (5 sièges)", "SLA 99.9%", "Endpoints dédiés"],
  },
];

function BillingPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h1 className="font-display text-4xl font-light tracking-tight">Facturation et crédits</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Gérez votre forfait et votre solde de tokens.
        </p>
      </div>

      {/* Solde */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Solde actuel
          </p>
          <p className="font-display text-5xl font-light mt-3 tabular-nums">
            {Number(profile?.credits_balance ?? 0).toLocaleString("fr-FR")}
            <span className="text-muted-foreground text-2xl ml-2">tokens</span>
          </p>
          <button
            onClick={() => toast.info("Paiements Stripe — disponible à l'itération 2")}
            className="mt-6 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-glow-cyan inline-flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Ajouter du crédit
          </button>
        </div>

        <div className="glass rounded-3xl p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Forfait actuel
          </p>
          <p className="font-display text-2xl font-medium mt-3 capitalize">
            {profile?.subscription_tier ?? "free"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {profile?.subscription_tier === "free"
              ? "Renouvellement gratuit"
              : "Renouvellement mensuel"}
          </p>
        </div>
      </div>

      {/* Tiers */}
      <div className="glass rounded-3xl p-6 lg:p-8">
        <h2 className="font-display text-xl font-medium">Forfaits disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {TIERS.map((t) => {
            const Icon = t.icon;
            const isCurrent = profile?.subscription_tier === t.id;
            return (
              <div
                key={t.id}
                className={`rounded-2xl p-6 border ${
                  t.highlighted
                    ? "bg-primary/5 border-primary/30 shadow-glow-cyan"
                    : "bg-white/5 border-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center ${
                      t.highlighted ? "bg-primary/20" : "bg-white/5"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${t.highlighted ? "text-primary" : ""}`} />
                  </div>
                  <h3 className="font-display text-lg font-medium">{t.name}</h3>
                </div>
                <p className="font-display text-3xl font-light mt-4">
                  {t.price}
                  <span className="text-sm text-muted-foreground ml-1">{t.period}</span>
                </p>
                <ul className="mt-5 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  onClick={() => toast.info("Paiements Stripe — disponible à l'itération 2")}
                  className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isCurrent
                      ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                      : t.highlighted
                        ? "bg-gradient-primary text-primary-foreground shadow-glow-cyan"
                        : "border border-border hover:bg-white/5"
                  }`}
                >
                  {isCurrent ? "Forfait actuel" : "Choisir"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-3xl p-6 flex items-start gap-4 border border-secondary/10">
        <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <AlertCircle className="h-5 w-5 text-secondary" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">Paiements Stripe — itération 2</p>
          <p className="text-muted-foreground mt-1">
            L'intégration Stripe (Checkout, abonnements, webhook crédits) sera activée à la
            prochaine étape. Le solde, les forfaits et l'historique des transactions sont déjà en
            place côté base de données.
          </p>
        </div>
      </div>
    </div>
  );
}
