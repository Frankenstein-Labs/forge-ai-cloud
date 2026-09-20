import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Upload, Star, Cpu, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { authJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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

type Model = {
  id: string;
  user_id: string;
  name: string;
  author: string;
  description: string;
  category: string;
  source: string;
  source_url: string | null;
  storage_path: string | null;
  size_bytes: number | null;
  price_eur: number;
  tags: string[];
  downloads: number;
  stars: number;
  created_at: string;
};

const CATEGORIES = ["Tous", "LLM", "Vision", "Audio", "Outil"] as const;

function fmtSize(bytes: number | null) {
  if (!bytes) return "—";
  const gb = bytes / 1e9;
  return gb >= 1 ? `${gb.toFixed(1)} Go` : `${(bytes / 1e6).toFixed(0)} Mo`;
}

function MarketplacePage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Tous");
  const [scope, setScope] = useState<"all" | "mine" | "hf">("all");
  const [open, setOpen] = useState(false);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (cat !== "Tous") p.set("category", cat);
    if (scope === "mine") p.set("mine", "1");
    return p.toString();
  }, [query, cat, scope]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["marketplace", params],
    queryFn: () => authJson<{ items: Model[] }>(`/api/marketplace?${params}`),
  });

  const download = useMutation({
    mutationFn: (id: string) =>
      authJson<{ url: string; cli: string; message: string }>("/api/marketplace/download", {
        method: "POST",
        body: JSON.stringify({ id }),
      }),
    onSuccess: (res) => {
      toast.success(res.message, {
        description: res.cli,
        action: { label: "Ouvrir", onClick: () => window.open(res.url, "_blank") },
      });
      qc.invalidateQueries({ queryKey: ["marketplace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      authJson(`/api/marketplace?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Modèle retiré du marketplace");
      qc.invalidateQueries({ queryKey: ["marketplace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Marketplace IA</h1>
          <p className="text-muted-foreground text-sm">
            Parcourez, publiez et téléchargez des modèles et outils d'IA.
          </p>
        </div>
        <PublishDialog open={open} onOpenChange={setOpen} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un modèle…"
            className="ps-9"
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
        <Tabs value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
          <TabsList>
            <TabsTrigger value="all">Public</TabsTrigger>
            <TabsTrigger value="mine">Mes publications</TabsTrigger>
            <TabsTrigger value="hf">Mes modèles Hugging Face</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {scope === "hf" ? (
        <HfRepoGrid />
      ) : (
        <>
          {error && (
            <p className="text-destructive text-sm">
              Impossible de charger le catalogue : {(error as Error).message}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}

            {!isLoading &&
              items.map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                        <Cpu className="text-primary size-5" />
                      </div>
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                    <CardTitle className="mt-3 text-base break-all">{item.name}</CardTitle>
                    <CardDescription>{item.author}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                    <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5" /> {item.stars}
                      </span>
                      <span className="font-mono">{fmtSize(item.size_bytes)}</span>
                      <span className="flex items-center gap-1">
                        <Download className="size-3.5" /> {item.downloads}
                      </span>
                      <span className="text-foreground font-medium">
                        {Number(item.price_eur) > 0 ? `${item.price_eur} €` : "Gratuit"}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={download.isPending}
                      onClick={() => download.mutate(item.id)}
                    >
                      {download.isPending && download.variables === item.id ? (
                        <Loader2 className="me-2 size-4 animate-spin" />
                      ) : (
                        <Download className="me-2 size-4" />
                      )}
                      Télécharger
                    </Button>
                    {scope === "mine" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => remove.mutate(item.id)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}

            {!isLoading && items.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Aucun modèle ne correspond à la recherche.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type HfItem = {
  name: string;
  pipeline_tag: string | null;
  category: string;
  downloads: number;
  likes: number;
  private: boolean;
  last_modified: string | null;
  url: string;
  published: boolean;
};

function HfRepoGrid() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["hf-models"],
    queryFn: () => authJson<{ account: string | null; items: HfItem[] }>("/api/hf-models"),
    retry: false,
  });

  const publish = useMutation({
    mutationFn: (item: HfItem) =>
      authJson<{ message: string }>("/api/hf-models", {
        method: "POST",
        body: JSON.stringify({ name: item.name, category: item.category }),
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["hf-models"] });
      qc.invalidateQueries({ queryKey: ["marketplace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-6 text-sm">
        <p className="text-destructive">{(error as Error).message}</p>
        <p className="text-muted-foreground mt-2">
          Ajoutez votre clé Hugging Face dans Paramètres pour afficher vos dépôts réels.
        </p>
      </div>
    );
  }

  const items = data?.items ?? [];
  if (!items.length) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun dépôt trouvé sur le compte Hugging Face {data?.account ?? ""}.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.name} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                <Cpu className="text-primary size-5" />
              </div>
              <div className="flex gap-1.5">
                {item.private && <Badge variant="outline">Privé</Badge>}
                <Badge variant="secondary">{item.pipeline_tag ?? item.category}</Badge>
              </div>
            </div>
            <CardTitle className="mt-3 text-base break-all">{item.name}</CardTitle>
            <CardDescription>
              {item.last_modified
                ? `Modifié le ${new Date(item.last_modified).toLocaleDateString("fr-FR")}`
                : "Hugging Face"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground flex-1 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Download className="size-3.5" /> {item.downloads}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-3.5" /> {item.likes}
              </span>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              size="sm"
              className="flex-1"
              variant={item.published ? "outline" : "default"}
              disabled={publish.isPending}
              onClick={() => publish.mutate(item)}
            >
              {publish.isPending && publish.variables?.name === item.name ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <Upload className="me-2 size-4" />
              )}
              {item.published ? "Republier" : "Publier"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.open(item.url, "_blank")}>
              <Download className="size-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function PublishDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("LLM");
  const [price, setPrice] = useState("0");

  const publish = useMutation({
    mutationFn: () =>
      authJson<{ message: string }>("/api/marketplace", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description,
          category,
          source: "huggingface",
          price_eur: Number(price) || 0,
        }),
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      onOpenChange(false);
      setName("");
      setDescription("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="me-2 size-4" /> Publier un modèle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publier un modèle</DialogTitle>
          <DialogDescription>Le dépôt HuggingFace est vérifié avant publication.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mp-name">Dépôt HuggingFace</Label>
            <Input
              id="mp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mistralai/Mistral-7B-Instruct-v0.3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mp-desc">Description</Label>
            <Textarea
              id="mp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="À quoi sert ce modèle ?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LLM", "Vision", "Audio", "Outil"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-price">Prix (€)</Label>
              <Input
                id="mp-price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => publish.mutate()} disabled={!name.trim() || publish.isPending}>
            {publish.isPending && <Loader2 className="me-2 size-4 animate-spin" />} Publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
