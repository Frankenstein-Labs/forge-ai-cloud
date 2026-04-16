import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section id="signup" className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative border-gradient rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-plasma/10 to-transparent" />
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-plasma/30 blur-[120px]" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-[120px]" />
          <div className="absolute inset-0 bg-grid opacity-30" />

          <div className="relative px-8 py-20 md:px-16 md:py-28 text-center">
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight max-w-3xl mx-auto leading-tight">
              Ton prochain modèle IA <br />
              tourne déjà sur{" "}
              <span className="text-gradient">Aetheris</span>.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
              Rejoins 4 200 développeurs qui construisent l'avenir de l'IA souveraine.
            </p>

            <form className="mt-10 max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="ton@email.com"
                className="flex-1 rounded-xl glass px-5 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-4 font-medium text-primary-foreground shadow-glow-cyan hover:shadow-glow-plasma transition-all"
              >
                Accès anticipé
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <p className="mt-5 text-xs font-mono text-muted-foreground">
              $300 de crédits offerts · sans carte · annule en 1 clic
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
