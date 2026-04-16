import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { LogoCloud } from "@/components/site/LogoCloud";
import { Features } from "@/components/site/Features";
import { Models } from "@/components/site/Models";
import { Partners } from "@/components/site/Partners";
import { Pricing } from "@/components/site/Pricing";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import heroImage from "@/assets/hero-cloud.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetheris Cloud — Le cloud unifié de l'IA open source" },
      {
        name: "description",
        content:
          "Déployez Llama, Mistral, DeepSeek aux côtés d'OpenAI, Anthropic et Google. Workspace, hub de modèles et facturation à l'usage — un seul environnement.",
      },
      { property: "og:title", content: "Aetheris Cloud — Le cloud unifié de l'IA open source" },
      {
        property: "og:description",
        content:
          "Déployez, orchestrez et facturez vos modèles IA open source et propriétaires depuis un seul cloud souverain.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: heroImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: heroImage },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <Models />
        <Partners />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
