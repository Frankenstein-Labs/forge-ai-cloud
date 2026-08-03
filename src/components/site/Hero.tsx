import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";
import heroImage from "@/assets/hero-cloud.jpg";

export function Hero() {
  return (
    <section className="relative pt-40 pb-32 overflow-hidden bg-hero">
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Floating ambient blobs */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-plasma/20 blur-[120px] animate-pulse-glow" />
      <div
        className="absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-pulse-glow"
        style={{ animationDelay: "2s" }}
      />

      <div className="container relative mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border glass px-4 py-1.5 text-xs font-mono text-muted-foreground mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>v1.0 — Bêta privée ouverte aux développeurs</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] tracking-tight"
          >
            Le <span className="text-gradient">cloud unifié</span>
            <br />
            de l'IA open source.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Découvre, déploie et orchestre les meilleurs modèles —{" "}
            <span className="text-foreground">Llama, Mistral, DeepSeek</span> — aux côtés d'OpenAI,
            Anthropic & Google. Un seul environnement. Une seule facture.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-7 py-4 font-medium text-primary-foreground shadow-glow-cyan hover:shadow-glow-plasma transition-all"
            >
              Lancer mon workspace
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#docs"
              className="inline-flex items-center gap-2 rounded-xl glass px-7 py-4 font-medium text-foreground hover:bg-surface-elevated/60 transition"
            >
              <Terminal className="h-4 w-4" />
              Voir la doc API
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-xs font-mono text-muted-foreground"
          >
            Sans carte • $300 de crédits offerts • Ferme ton compte en 1 clic
          </motion.p>
        </div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative mt-20 max-w-5xl mx-auto"
        >
          <div className="absolute -inset-8 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
          <div className="relative border-gradient rounded-3xl overflow-hidden shadow-elevated">
            <div className="bg-surface/80 backdrop-blur-sm">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-background/40">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-secondary/60" />
                  <div className="h-3 w-3 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 text-center text-xs font-mono text-muted-foreground">
                  aetheris ~ workspace
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-6 font-mono text-sm space-y-3 border-b md:border-b-0 md:border-r border-border">
                  <div>
                    <span className="text-muted-foreground">$</span>{" "}
                    <span className="text-primary">aetheris</span> deploy mistral-7b
                  </div>
                  <div className="text-muted-foreground">↳ pulling from huggingface...</div>
                  <div className="text-muted-foreground">↳ allocating GPU (A100)...</div>
                  <div className="text-secondary">✓ endpoint ready</div>
                  <div className="text-muted-foreground text-xs pt-2 break-all">
                    https://api.aetheris.cloud/v1/m/mistral-7b
                  </div>
                  <div className="pt-3">
                    <span className="text-muted-foreground">$</span>{" "}
                    <span className="text-primary">aetheris</span> chain claude → llama-3
                  </div>
                  <div className="text-secondary">✓ pipeline créé · 2 modèles</div>
                </div>
                <div className="relative aspect-square md:aspect-auto">
                  <img
                    src={heroImage}
                    alt="Visualisation 3D d'un cloud neuronal Aetheris"
                    width={1600}
                    height={1200}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden glass max-w-4xl mx-auto"
        >
          {[
            { v: "120+", l: "modèles open source" },
            { v: "<80ms", l: "latence p95" },
            { v: "99.99%", l: "SLA uptime" },
            { v: "4.2k", l: "devs en bêta" },
          ].map((s) => (
            <div key={s.l} className="bg-surface/60 p-6 text-center">
              <div className="font-display text-3xl font-semibold text-gradient">{s.v}</div>
              <div className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
