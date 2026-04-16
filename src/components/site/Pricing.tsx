import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "0",
    tag: "Pour découvrir",
    features: [
      "1 modèle déployé",
      "100 requêtes/jour",
      "Workspace cloud partagé",
      "Communauté Discord",
    ],
    cta: "Commencer",
    featured: false,
  },
  {
    name: "Pro",
    price: "29",
    tag: "Pour les devs",
    features: [
      "10 modèles déployés",
      "Requêtes illimitées",
      "Pay-as-you-go GPU à la seconde",
      "Mobile + CLI",
      "Support prioritaire",
    ],
    cta: "Lancer mon Pro",
    featured: true,
  },
  {
    name: "Business",
    price: "99",
    tag: "Pour les équipes",
    features: [
      "Modèles privés illimités",
      "Team & RBAC",
      "Endpoints custom (VPC)",
      "Data residency UE",
      "SLA 99.99% & support 24/7",
    ],
    cta: "Contacter les ventes",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
            Tarifs transparents
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Démarre gratuitement. <br />
            <span className="text-gradient">Paye à l'usage.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Aucun engagement. Facturation Stripe à la seconde GPU. Annule à tout moment.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 ${
                p.featured
                  ? "border-gradient bg-gradient-card shadow-glow-cyan scale-[1.02]"
                  : "border border-border bg-surface/40"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-xs font-mono font-semibold text-primary-foreground uppercase tracking-wider">
                  Populaire
                </div>
              )}
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {p.tag}
              </div>
              <h3 className="font-display text-2xl font-semibold mt-2">{p.name}</h3>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold">€{p.price}</span>
                <span className="text-sm text-muted-foreground">/mois</span>
              </div>

              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#signup"
                className={`mt-10 inline-flex items-center justify-center w-full rounded-xl px-5 py-3 text-sm font-medium transition-all ${
                  p.featured
                    ? "bg-gradient-primary text-primary-foreground shadow-glow-cyan hover:shadow-glow-plasma"
                    : "glass text-foreground hover:bg-surface-elevated/60"
                }`}
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs font-mono text-muted-foreground mt-10">
          + paiement à l'usage GPU à partir de €0,0008/sec · facturation Stripe
        </p>
      </div>
    </section>
  );
}
