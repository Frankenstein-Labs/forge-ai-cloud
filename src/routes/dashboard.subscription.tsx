import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Sparkles, Zap, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/dashboard/subscription")({
  head: () => ({
    meta: [
      { title: "Abonnement & Facturation — Aetheris" },
      {
        name: "description",
        content:
          "Gérez votre abonnement développeur Aetheris, votre consommation de tokens et vos factures.",
      },
      { property: "og:title", content: "Abonnement & Facturation — Aetheris" },
      {
        property: "og:description",
        content: "Forfaits Free, Pro et Business pour vos moteurs cloud et modèles IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubscriptionPage,
});

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "0 €",
    period: "à vie",
    icon: Sparkles,
    features: ["100k tokens/mois", "1 modèle déployé", "1 Go DB Index", "Communauté"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "29 €",
    period: "/mois",
    icon: Zap,
    highlighted: true,
    features: [
      "10M tokens/mois",
      "10 modèles déployés",
      "Moteur GPU à la demande",
      "Support prioritaire",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "99 €",
    period: "/mois",
    icon: Crown,
    features: ["Tokens illimités", "Équipe (5 sièges)", "SLA 99.9 %", "Endpoints dédiés"],
  },
];

const INVOICES = [
  { id: "AET-2026-004", date: "01/02/2026", amount: "29,00 €", status: "Payée" },
  { id: "AET-2026-003", date: "01/01/2026", amount: "29,00 €", status: "Payée" },
  { id: "AET-2025-012", date: "01/12/2025", amount: "29,00 €", status: "Payée" },
];

function SubscriptionPage() {
  const { profile } = useAuth();
  const current = profile?.subscription_tier ?? "free";
  const used = 100000 - Number(profile?.credits_balance ?? 100000);
  const pct = Math.min(100, Math.round((used / 100000) * 100));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Abonnement & Facturation
        </h1>
        <p className="text-muted-foreground text-sm">
          Gérez votre forfait développeur, votre consommation et vos factures.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardDescription>Forfait actuel</CardDescription>
              <CardTitle className="font-display text-2xl capitalize">{current}</CardTitle>
            </div>
            <Badge variant="secondary">Renouvellement le 01/03/2026</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tokens consommés</span>
            <span className="font-mono">{(used / 1000).toFixed(1)}k / 100k</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const active = tier.id === current;
          return (
            <Card
              key={tier.id}
              className={tier.highlighted ? "border-primary/60 relative" : "relative"}
            >
              {tier.highlighted && <Badge className="absolute -top-2 right-4">Populaire</Badge>}
              <CardHeader>
                <Icon className="text-primary size-5" />
                <CardTitle className="mt-2 text-base">{tier.name}</CardTitle>
                <CardDescription>
                  <span className="font-display text-foreground text-3xl">{tier.price}</span>{" "}
                  {tier.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={active ? "outline" : tier.highlighted ? "default" : "secondary"}
                  disabled={active}
                  onClick={() => toast.info("Le paiement sera activé prochainement.")}
                >
                  {active ? "Forfait actuel" : `Passer à ${tier.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Factures</CardTitle>
          <CardDescription>Historique de vos paiements.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVOICES.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell>{inv.amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Télécharger la facture ${inv.id}`}
                      onClick={() => toast.info("Facture PDF bientôt disponible.")}
                    >
                      <Download className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
