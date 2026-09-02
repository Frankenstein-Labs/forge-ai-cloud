const providers = ["Hugging Face", "Mistral AI", "Meta Llama", "DeepSeek", "Google", "OpenAI"];

export function LogoCloud() {
  return (
    <section className="py-16 border-y border-border bg-background/50">
      <div className="container mx-auto px-6">
        <p className="text-center text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-10">
          Fournisseurs de modèles pris en charge par l'API
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {providers.map((name) => (
            <div
              key={name}
              className="font-display text-xl md:text-2xl font-semibold text-muted-foreground"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
