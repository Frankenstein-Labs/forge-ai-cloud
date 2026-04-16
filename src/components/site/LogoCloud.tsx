const logos = [
  "OpenAI",
  "Anthropic",
  "Google",
  "HuggingFace",
  "Mistral AI",
  "Meta",
  "Stability",
  "DeepSeek",
  "Cohere",
  "GitHub",
];

export function LogoCloud() {
  return (
    <section className="py-16 border-y border-border bg-background/50">
      <div className="container mx-auto px-6">
        <p className="text-center text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-10">
          Compatible avec l'écosystème IA mondial
        </p>
        <div className="relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex gap-16 animate-marquee whitespace-nowrap">
            {[...logos, ...logos].map((name, i) => (
              <div
                key={i}
                className="font-display text-2xl md:text-3xl font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
