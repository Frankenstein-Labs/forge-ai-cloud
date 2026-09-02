import { Link } from "@tanstack/react-router";
import { ArrowRight, Terminal } from "lucide-react";
import heroImage from "@/assets/hero-cloud.jpg";

export function Hero() {
  return (
    <section className="relative pt-40 pb-32 overflow-hidden bg-hero">
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      <div className="container relative mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-4 py-1.5 text-xs font-mono text-muted-foreground mb-8">
            <span>Bêta privée — plateforme en cours de construction</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] tracking-tight">
            Le <span className="text-gradient">cloud unifié</span>
            <br />
            de l'IA open source.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Une API compatible OpenAI pour appeler vos modèles Hugging Face et les modèles hébergés,
            avec vos propres clés. Un seul environnement, une seule facture.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              search={{ mode: "signup", redirect: "/dashboard" }}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-7 py-4 font-medium text-primary-foreground shadow-glow-cyan hover:shadow-glow-plasma transition-all"
            >
              Créer un compte
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 rounded-xl glass px-7 py-4 font-medium text-foreground hover:bg-surface-elevated/60 transition"
            >
              <Terminal className="h-4 w-4" />
              Voir la doc API
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative mt-20 max-w-5xl mx-auto">
          <div className="relative border-gradient rounded-3xl overflow-hidden shadow-elevated">
            <img
              src={heroImage}
              alt="Visualisation abstraite d'une infrastructure cloud dédiée à l'IA"
              width={1600}
              height={1200}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
