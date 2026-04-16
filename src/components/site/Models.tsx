import { motion } from "framer-motion";
import { Download, Star } from "lucide-react";

const models = [
  {
    name: "llama-3.1-70b",
    org: "Meta",
    type: "LLM",
    pulls: "2.4M",
    stars: "48k",
    color: "from-primary/20 to-transparent",
  },
  {
    name: "mistral-large-2",
    org: "Mistral AI",
    type: "LLM",
    pulls: "1.1M",
    stars: "32k",
    color: "from-plasma/20 to-transparent",
  },
  {
    name: "deepseek-coder-v2",
    org: "DeepSeek",
    type: "Code",
    pulls: "890k",
    stars: "21k",
    color: "from-primary/20 to-transparent",
  },
  {
    name: "sdxl-turbo",
    org: "Stability AI",
    type: "Diffusion",
    pulls: "3.7M",
    stars: "67k",
    color: "from-plasma/20 to-transparent",
  },
  {
    name: "whisper-large-v3",
    org: "OpenAI",
    type: "Audio",
    pulls: "1.8M",
    stars: "29k",
    color: "from-primary/20 to-transparent",
  },
  {
    name: "qwen2.5-72b",
    org: "Alibaba",
    type: "LLM",
    pulls: "640k",
    stars: "18k",
    color: "from-plasma/20 to-transparent",
  },
];

export function Models() {
  return (
    <section id="models" className="py-32 relative bg-surface/30">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] text-secondary mb-4">
              Hub de modèles
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
              120+ modèles. <span className="text-gradient">Une commande.</span>
            </h2>
          </div>
          <a
            href="#models"
            className="text-sm text-primary hover:text-foreground transition-colors font-mono"
          >
            Explorer le catalogue →
          </a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative border-gradient rounded-2xl p-6 bg-gradient-card hover:shadow-glow-cyan transition-all cursor-pointer"
            >
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-2 py-1 rounded-md bg-background/40">
                    {m.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{m.org}</span>
                </div>
                <h3 className="font-mono text-lg font-medium text-foreground mb-1">
                  {m.name}
                </h3>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    {m.pulls}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    {m.stars}
                  </span>
                </div>
                <div className="mt-5 pt-4 border-t border-border/50 font-mono text-xs text-muted-foreground">
                  $ aetheris pull{" "}
                  <span className="text-primary">{m.name}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
