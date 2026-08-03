import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search, Upload, Star, Cpu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace IA — Aetheris" },
      {
        name: "description",
        content:
          "Parcourez, publiez et téléchargez des modèles et outils d'intelligence artificielle sur Aetheris.",
      },
      { property: "og:title", content: "Marketplace IA — Aetheris" },
      {
        property: "og:description",
        content: "Modèles LLM, vision et outils IA prêts à déployer sur vos moteurs cloud.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketplacePage,
});

type Item = {
  name: string;
  author: string;
  desc: string;
  category: "LLM" | "Vision" | "Audio" | "Outil";
  size: string;
  price: string;
  stars: number;
};

const ITEMS: Item[] = [
  { name: "Mistral-119B-Aetheris", author: "@patron", desc: "LLM massif fine-tuné, contexte 128k.", category: "LLM", size: "238 Go", price: "Gratuit", stars: 412 },
  { name: "Llama-3.1-8B-Instruct", author: "@meta", desc: "Modèle instruct léger et rapide.", category: "LLM", size: "16 Go", price: "Gratuit", stars: 1280 },
  { name: "Whisper-Large-v3", author: "@openai", desc: "Transcription audio multilingue.", category: "Audio", size: "3.1 Go", price: "Gratuit", stars: 890 },
  { name: "SDXL-Turbo-Aeth", author: "@studio", desc: "Génération d'images temps réel.", category: "Vision", size: "6.9 Go", price: "19 €", stars: 305 },
  { name: "Embed-Multilingual-v2", author: "@aetheris", desc: "Embeddings 1024d pour RAG.", category: "Outil", size: "1.2 Go", price: "Gratuit", stars: 233 },
  { name: "CodeReviewer-7B", author: "@devlab", desc: "Revue de code automatisée.", category: "LLM", size: "14 Go", price: "9 €", stars: 176 },
];

const CATEGORIES = ["Tous", "LLM", "Vision", "Audio", "Outil"] as const;

function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Tous");

  const filtered = useMemo(
    () =>
      ITEMS.filter(
        (i) =>
          (cat === "Tous" || i.category === cat) &&
          (i.name.toLowerCase().includes(query.toLowerCase()) ||
            i.desc.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, cat],
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Marketplace IA</h1>
          <p className="text-muted-foreground text-sm">
            Parcourez, publiez et téléchargez des modèles et outils d'IA.
          </p>
        </div>
        <Button onClick={() => toast.info("Publiez via « import hf <repo> » ou « push » dans le terminal.")}>
          <Upload className="mr-2 size-4" /> Publier un modèle
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un modèle…"
            className="pl-9"
          />
        </div>
        <Tabs value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
          <TabsList>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.name} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                  <Cpu className="text-primary size-5" />
                </div>
                <Badge variant="secondary">{item.category}</Badge>
              </div>
              <CardTitle className="mt-3 text-base">{item.name}</CardTitle>
              <CardDescription>{item.author}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground text-sm">{item.desc}</p>
              <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <Star className="size-3.5" /> {item.stars}
                </span>
                <span className="font-mono">{item.size}</span>
                <span className="text-foreground font-medium">{item.price}</span>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => toast.success(`Téléchargement de ${item.name} lancé`)}
              >
                <Download className="mr-2 size-4" /> Télécharger
              </Button>
            </CardFooter>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm">Aucun modèle ne correspond à la recherche.</p>
        )}
      </div>
    </div>
  );
}
