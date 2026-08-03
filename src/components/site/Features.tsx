import { motion } from "framer-motion";
import { Cpu, Code2, GitBranch, Shield, Zap, Network } from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Hub de modèles",
    desc: "Llama, Mistral, DeepSeek, Stable Diffusion — déployés en un clic. Scaling GPU automatique, jusqu'à l'A100.",
  },
  {
    icon: Code2,
    title: "Workspace en ligne",
    desc: "Un IDE complet dans le navigateur. Code, debug, versionne et déploie sans toucher à l'infra.",
  },
  {
    icon: Network,
    title: "Pipelines multi-modèles",
    desc: "Chaîne Claude → Llama → Mistral. Crée des intelligences composites en quelques lignes.",
  },
  {
    icon: GitBranch,
    title: "Sync GitHub & HuggingFace",
    desc: "Importe tes configs depuis GitHub, tire des modèles directement depuis le Hub HuggingFace.",
  },
  {
    icon: Shield,
    title: "Souveraineté & sécurité",
    desc: "Data residency Europe, chiffrement bout en bout, déploiement privé pour les enterprises.",
  },
  {
    icon: Zap,
    title: "Pay-as-you-go",
    desc: "Facturation à la seconde GPU. Tu ne payes que ce que tu consommes, transparence Stripe totale.",
  },
];

export function Features() {
  return (
    <section id="platform" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <span className="inline-block text-xs font-mono uppercase tracking-[0.2em] text-primary mb-4">
            La plateforme
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight">
            Tout ce qu'il faut pour <span className="text-gradient">construire</span>, rien de
            superflu.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Aetheris regroupe ton hub de modèles, ton IDE et ta facturation IA dans un seul
            environnement cohérent — pensé par des devs, pour des devs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-3xl overflow-hidden">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative bg-surface/60 backdrop-blur-sm p-8 hover:bg-surface-elevated/80 transition-colors"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-primary/10 border border-primary/20 mb-5 group-hover:shadow-glow-cyan transition-all">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
