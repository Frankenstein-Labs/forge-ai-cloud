import { Link } from "@tanstack/react-router";

// Identifiants réellement acceptés par POST /api/v1/chat/completions.
const models = [
  { id: "google/gemini-2.5-pro", type: "LLM", route: "Gateway" },
  { id: "google/gemini-2.5-flash", type: "LLM", route: "Gateway" },
  { id: "openai/gpt-5", type: "LLM", route: "Gateway" },
  { id: "openai/gpt-5-mini", type: "LLM", route: "Gateway" },
  { id: "hf/<owner>/<repo>", type: "Hugging Face", route: "Votre clé HF" },
];

export function Models() {
  return (
    <section id="models" className="py-32 relative bg-surface/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] text-secondary mb-4">
              Modèles disponibles
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
              Les identifiants <span className="text-gradient">acceptés par l'API</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tout dépôt Hugging Face compatible chat est appelable avec le préfixe{" "}
              <code className="font-mono text-foreground">hf/</code>, en utilisant la clé Hugging
              Face enregistrée dans votre compte.
            </p>
          </div>
          <Link
            to="/docs"
            className="text-sm text-primary hover:text-foreground transition-colors font-mono"
          >
            Documentation API →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m) => (
            <div
              key={m.id}
              className="relative border-gradient rounded-2xl p-6 bg-gradient-card"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-2 py-1 rounded-md bg-background/40">
                  {m.type}
                </span>
                <span className="text-xs text-muted-foreground">{m.route}</span>
              </div>
              <h3 className="font-mono text-base font-medium text-foreground break-all">{m.id}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
