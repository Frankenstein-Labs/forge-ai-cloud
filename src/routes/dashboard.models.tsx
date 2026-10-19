import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Loader2, Link as LinkIcon, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { authJson } from "@/lib/api-client";

export const Route = createFileRoute("/dashboard/models")({
  head: () => ({
    meta: [{ title: "Modèles — Aetheris" }, { name: "description", content: "Modèles de votre compte Aetheris Cloud." }, { property: "og:title", content: "Modèles — Aetheris" }, { property: "og:description", content: "Modèles de votre compte Aetheris Cloud." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
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

interface HfRepoItem {
  name: string;
  pipeline_tag: string | null;
  category: string;
  downloads: number;
  likes: number;
  private: boolean;
  last_modified: string | null;
  url: string;
  published: boolean;
}

function ModelsPage() {
  const [tab, setTab] = useState<"deployments" | "catalog" | "import">("deployments");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-2">
        <div>
          <h1 className="font-display text-4xl font-light ">Modèles</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Catalogue, déploiements et import depuis Hugging Face.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass rounded-lg p-1.5 inline-flex w-full sm:w-auto">
        {[
          { id: "deployments", label: "Mes déploiements" },
          { id: "catalog", label: "Mes modèles HF" },
          { id: "import", label: "Importer" },
        ].map((t) => (
          <Button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Button>
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
      <div className="glass rounded-lg p-12 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin me-2" /> Chargement...
      </div>
    );
  }

  if (deps.length === 0) {
    return (
      <div className="glass rounded-lg p-16 text-center">
        <h3 className="font-display text-xl font-medium">Aucun déploiement</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Choisissez un modèle dans le catalogue pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                Nom
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                Modèle
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                Statut
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase ">
                Endpoint
              </th>
              <th className="px-4 py-4 text-[11px] font-semibold text-muted-foreground uppercase  text-right">
                Tokens
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deps.map((d) => (
              <tr key={d.id} className="hover:bg-muted/50 transition-colors">
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
                  <code className="text-xs font-mono text-primary">{d.endpoint_url ?? "—"}</code>
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
  const [deploying, setDeploying] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["hf-models"],
    queryFn: () => authJson<{ account: string | null; items: HfRepoItem[] }>("/api/hf-models"),
    retry: false,
  });

  const items = (data?.items ?? []).filter(
    (m) => search === "" || m.name.toLowerCase().includes(search.toLowerCase()),
  );

  const deploy = async (model: HfRepoItem) => {
    const short = model.name.split("/").pop() ?? model.name;
    const name = prompt(`Nom du déploiement pour ${model.name} ?`, `${short}-prod`);
    if (!name) return;
    setDeploying(model.name);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Non authentifié");
      setDeploying(null);
      return;
    }
    const { error: dbError } = await supabase.from("deployments").insert({
      user_id: user.id,
      catalog_model_id: `hf/${model.name}`,
      deployment_name: name.trim(),
      status: "deploying",
    });
    setDeploying(null);
    if (dbError) toast.error(dbError.message);
    else toast.success(`Déploiement de ${model.name} lancé`);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher parmi vos modèles Hugging Face..."
          className="bg-surface-elevated/50 border-border focus:ring-primary/50 w-full rounded-lg border px-4 py-3 ps-11 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement de vos dépôts Hugging Face…
        </div>
      )}

      {error && (
        <div className="glass rounded-lg p-6 text-sm">
          <p className="text-destructive">{(error as Error).message}</p>
          <p className="text-muted-foreground mt-2">
            Enregistrez votre clé Hugging Face dans Paramètres pour afficher vos vrais modèles.
          </p>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Aucun dépôt sur le compte Hugging Face {data?.account ?? ""}.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((m) => (
          <div key={m.name} className="glass flex flex-col rounded-lg p-6">
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-[10px] font-bold  uppercase">
                {m.private ? "Privé" : "Public"}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {m.pipeline_tag ?? m.category}
              </span>
            </div>
            <h3 className="font-display text-lg font-medium break-all">{m.name}</h3>
            <p className="text-muted-foreground mt-3 flex-1 text-xs">
              {m.downloads} téléchargements · {m.likes} likes
              {m.last_modified
                ? ` · maj ${new Date(m.last_modified).toLocaleDateString("fr-FR")}`
                : ""}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground font-mono text-xs"
              >
                huggingface.co
              </a>
              <Button
                onClick={() => deploy(m)}
                disabled={deploying === m.name}
                className="bg-foreground text-background flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition hover:opacity-90 disabled:opacity-60"
              >
                {deploying === m.name && <Loader2 className="h-3 w-3 animate-spin" />}
                Déployer
              </Button>
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      <div className="glass rounded-lg p-6 lg:p-8">
        <h2 className="font-display text-xl font-medium">Importer un modèle</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Téléversez vos modèles fine‑tunés ou fusionnés, nous les hébergeons pour vous.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Hugging Face */}
          <div className="bg-muted rounded-lg p-5 border border-border">
            <div className="size-10 rounded-md bg-muted flex items-center justify-center mb-3">
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
              className="mt-3 w-full rounded-md bg-background/50 border border-border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={importHF}
              className="mt-3 w-full rounded-md bg-primary text-primary-foreground font-medium px-4 py-2 text-xs"
            >
              Importer depuis HF
            </Button>
          </div>

          {/* Upload */}
          <div className="bg-muted rounded-lg p-5 border border-border">
            <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center mb-3">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">Téléverser un fichier</h3>
            <p className="text-xs text-muted-foreground mt-1">
              .gguf, .safetensors, .bin (jusqu'à 50 GB)
            </p>
            <div className="mt-3 border-2 border-dashed border-border rounded-md p-4 text-center text-xs text-muted-foreground">
              Glisser-déposer
              <br />
              <span className="text-[10px]">(disponible bientôt)</span>
            </div>
            <Button
              disabled
              className="mt-3 w-full rounded-md bg-muted text-muted-foreground font-medium px-4 py-2 text-xs cursor-not-allowed"
            >
              Bientôt
            </Button>
          </div>

          {/* Public URL */}
          <div className="bg-muted rounded-lg p-5 border border-border">
            <div className="size-10 rounded-md bg-secondary/10 flex items-center justify-center mb-3">
              <LinkIcon className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="font-medium">Lien public</h3>
            <p className="text-xs text-muted-foreground mt-1">URL directe (S3, GCS, Dropbox)</p>
            <input
              type="url"
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder="https://..."
              className="mt-3 w-full rounded-md bg-background/50 border border-border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={importURL}
              className="mt-3 w-full rounded-md bg-primary text-primary-foreground font-medium px-4 py-2 text-xs"
            >
              Importer depuis l'URL
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
