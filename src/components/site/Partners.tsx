import { motion } from "framer-motion";
import { Briefcase, TrendingUp, Users } from "lucide-react";

export function Partners() {
  return (
    <section id="partners" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-plasma/10 blur-[120px]" />

      <div className="container relative mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
              Programme partenaires
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Devenez le <span className="text-gradient">moteur IA</span> de vos clients.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Agences web, intégrateurs, cabinets de conseil — rejoignez la place de
              marché Aetheris. Vendez des solutions IA clés en main, gardez 80-90% des
              revenus, et accédez à un pipeline de clients qualifiés.
            </p>

            <div className="mt-10 space-y-5">
              {[
                {
                  icon: Briefcase,
                  title: "Marketplace de missions",
                  desc: "Recevez des leads qualifiés directement depuis notre portail.",
                },
                {
                  icon: TrendingUp,
                  title: "Revenus récurrents",
                  desc: "Touchez une commission sur chaque déploiement de vos clients, à vie.",
                },
                {
                  icon: Users,
                  title: "Certification & visibilité",
                  desc: "Accédez à des formations exclusives et un badge officiel Aetheris.",
                },
              ].map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg glass flex items-center justify-center">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#partners"
              className="mt-10 inline-flex items-center gap-2 rounded-xl glass px-6 py-3 font-medium text-foreground hover:bg-surface-elevated/60 transition"
            >
              Rejoindre le programme →
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="border-gradient rounded-3xl p-8 glass shadow-elevated">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Tableau partenaire
                  </div>
                  <div className="font-display text-2xl font-semibold mt-1">
                    Q4 · 2025
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary">
                  ● ACTIVE
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Revenus du mois</span>
                    <span className="font-mono font-semibold text-foreground">
                      €24,380
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-primary rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Clients actifs</span>
                    <span className="font-mono font-semibold text-foreground">42</span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-primary rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Commission moyenne</span>
                    <span className="font-mono font-semibold text-primary">85%</span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-primary rounded-full" />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-4 text-center">
                {[
                  { v: "€2.1M", l: "revenus 2025" },
                  { v: "180+", l: "agences" },
                  { v: "12 pays", l: "couverts" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="font-display text-lg font-semibold text-gradient">
                      {s.v}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
