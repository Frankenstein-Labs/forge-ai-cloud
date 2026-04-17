import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Loader2, Link as LinkIcon, Upload } from "lucide-react";

export const Route = createFileRoute("/dashboard/models")({
  head: () => ({
    meta: [{ title: "Modèles — Aetheris" }],
  }),
  component: ModelsPage,
});

interface Deployment {
  id: string;
  deployment_name: string;
  catalog_model_id: string | null;
  status: "pending" | "deploying" | "active" | "stopped" | "failed";
  endpoint_url: string | null;
  tokens_consumed: number;
  region: string;
  created_at: string;
}

interface CatalogModel {
  id: string;
  name: string;
  provider: string;
  context: string;
  price: string;
  type: "open" | "proprietary";
  description: string;
}

const CATALOG: CatalogModel[] = [
  {
    id: "llama-3.1-70b",
    name: "Llama 3.1 70B",
    provider: "Meta",
    context: "128k tokens",
    price: "$0.80 / M tokens",
    type: "open",
    description: "Modèle multilingue performant pour génération et raisonnement.",
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "Mistral AI",
    context: "32k tokens",
    price: "$2.00 / M tokens",
    type: "open",
    description: "Excellence européenne, optimisé pour le français et le code.",
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    context: "64k tokens",
    price: "$0.27 / M tokens",
    type: "open",
    description: "Performance state-of-the-art à coût réduit.",
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    context: "128k tokens",
    price: "$2.50 / M tokens",
    type: "proprietary",
    description: "Le modèle référence, accessible via notre proxy.",
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    context: "200k tokens",
    price: "$3.00 / M tokens",
    type: "proprietary",
    description: "Raisonnement long contexte et appels d'outils.",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    context: "1M tokens",
    price: "$1.25 / M tokens",
    type: "proprietary",
    description: "Multimodal natif avec contexte d'1 million de tokens.",
  },
];

function ModelsPage() {
  const [tab, setTab] = useState<"deployments" | "catalog" | "import">("deployments");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-2">
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight">Modèles</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Catalogue, déploiements et import depuis Hugging Face.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl p-1.5 inline-flex w-full sm:w-auto">
        {[
          { id: "deployments", label: "Mes déploiements" },
          { id: "catalog", label: "Catalogue" },
          { id: "import", label: "Importer" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white/10 text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "deployments" && <DeploymentsList />}
      {tab === "catalog" && <Catalog />}
      {tab === "import" && <ImportPanel />}
    </div>
  );
}

function DeploymentsList() {
  const [deps, setDeps] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("deployments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setDeps((data ?? []) as Deployment[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-3xl p-12 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement...
      </div>
    );
  }

  if (deps.length === 0) {
    return (
      <div className="glass rounded-3xl p-16 text-center">
        <h3 className="font-display text-xl font-medium">Aucun déploiement</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Choisissez un modèle dans le catalogue pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Nom
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Modèle
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Statut
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Endpoint
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest text-right">
                Tokens
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {deps.map((d) => (
              <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5 font-medium">{d.deployment_name}</td>
                <td className="px-4 py-5 font-mono text-xs text-muted-foreground">
                  {d.catalog_model_id}
                </td>
                <td className="px-4 py-5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-5">
                  <code className="text-xs font-mono text-primary">
                    {d.endpoint_url ?? "—"}
                  </code>
                </td>
                <td className="px-4 py-5 text-right font-mono text-sm">
                  {d.tokens_consumed.toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Catalog() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "proprietary">("all");
  const [deploying, setDeploying] = useState<string | null>(null);

  const filtered = CATALOG.filter(
    (m) =>
      (filter === "all" || m.type === filter) &&
      (search === "" ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.provider.toLowerCase().includes(search.toLowerCase())),
  );

  const deploy = async (model: CatalogModel) => {
    const name = prompt(`Nom du déploiement pour ${model.name} ?`, `${model.id}-prod`);
    if (!name) return;
    setDeploying(model.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Non authentifié");
      setDeploying(null);
      return;
    }
    const { error } = await supabase.from("deployments").insert({
      user_id: user.id,
      catalog_model_id: model.id,
      deployment_name: name.trim(),
      status: "deploying",
      endpoint_url: `https://api.aetheris.cloud/v1/models/${name.trim().toLowerCase().replace(/\s+/g, "-")}`,
    });
    setDeploying(null);
    if (error) toast.error(error.message);
    else toast.success(`Déploiement de ${model.name} lancé`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un modèle..."
            className="w-full pl-11 rounded-2xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="glass rounded-2xl p-1 inline-flex">
          {[
            { id: "all", label: "Tous" },
            { id: "open", label: "Open source" },
            { id: "proprietary", label: "Propriétaires" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={`px-4 py-2 rounded-xl text-xs font-medium ${
                filter === f.id ? "bg-white/10 text-foreground" : "text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <div key={m.id} className="glass rounded-3xl p-6 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                  m.type === "open" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                }`}
              >
                {m.type === "open" ? "Open Source" : "Propriétaire"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{m.context}</span>
            </div>
            <h3 className="font-display text-xl font-medium">{m.name}</h3>
            <p className="text-xs text-muted-foreground">{m.provider}</p>
            <p className="text-sm text-muted-foreground mt-3 flex-1">{m.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs font-mono">{m.price}</span>
              <button
                onClick={() => deploy(m)}
                disabled={deploying === m.id}
                className="px-4 py-2 rounded-xl bg-foreground text-background font-semibold text-xs hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2"
              >
                {deploying === m.id && <Loader2 className="h-3 w-3 animate-spin" />}
                Déployer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportPanel() {
  const [hfUrl, setHfUrl] = useState("");
  const [publicUrl, setPublicUrl] = useState("");

  const importHF = async () => {
    if (!hfUrl.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_models").insert({
      user_id: user.id,
      name: hfUrl.split("/").pop() ?? hfUrl,
      source: "huggingface",
      source_url: hfUrl.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Import lancé. Le modèle sera disponible une fois validé.");
      setHfUrl("");
    }
  };

  const importURL = async () => {
    if (!publicUrl.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("user_models").insert({
      user_id: user.id,
      name: publicUrl.split("/").pop() ?? "modèle-importé",
      source: "url",
      source_url: publicUrl.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Import lancé.");
      setPublicUrl("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-6 lg:p-8">
        <h2 className="font-display text-xl font-medium">Importer un modèle</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Téléversez vos modèles fine‑tunés ou fusionnés, nous les hébergeons pour vous.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Hugging Face */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="size-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-3">
              🤗
            </div>
            <h3 className="font-medium">Hugging Face</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Collez l'URL du modèle (ex: meta-llama/Llama-3.1-70B)
            </p>
            <input
              type="text"
              value={hfUrl}
              onChange={(e) => setHfUrl(e.target.value)}
              placeholder="meta-llama/Llama-3.1-70B"
              className="mt-3 w-full rounded-xl bg-background/50 border border-border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={importHF}
              className="mt-3 w-full rounded-xl bg-gradient-primary text-primary-foreground font-medium px-4 py-2 text-xs"
            >
              Importer depuis HF
            </button>
          </div>

          {/* Upload */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">Téléverser un fichier</h3>
            <p className="text-xs text-muted-foreground mt-1">
              .gguf, .safetensors, .bin (jusqu'à 50 GB)
            </p>
            <div className="mt-3 border-2 border-dashed border-white/10 rounded-xl p-4 text-center text-xs text-muted-foreground">
              Glisser-déposer
              <br />
              <span className="text-[10px]">(disponible bientôt)</span>
            </div>
            <button
              disabled
              className="mt-3 w-full rounded-xl bg-white/5 text-muted-foreground font-medium px-4 py-2 text-xs cursor-not-allowed"
            >
              Bientôt
            </button>
          </div>

          {/* Public URL */}
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
              <LinkIcon className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="font-medium">Lien public</h3>
            <p className="text-xs text-muted-foreground mt-1">URL directe (S3, GCS, Dropbox)</p>
            <input
              type="url"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder="https://..."
              className="mt-3 w-full rounded-xl bg-background/50 border border-border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={importURL}
              className="mt-3 w-full rounded-xl bg-gradient-primary text-primary-foreground font-medium px-4 py-2 text-xs"
            >
              Importer depuis l'URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
