import { createFileRoute, Link } from "@tanstack/react-router";
import { Terminal, Code2, Sparkles, Cloud, ArrowRight, Copy } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation API — Aetheris" },
      {
        name: "description",
        content:
          "Documentation publique de l'API Aetheris : endpoint OpenAI-compatible, exemples Python/Colab/curl, liste des modèles supportés (Gemini, GPT-5, Mistral, LLaMA via HuggingFace).",
      },
      { property: "og:title", content: "Aetheris API — OpenAI-compatible AI Gateway" },
      {
        property: "og:description",
        content:
          "Une seule clé API pour appeler Gemini, GPT-5 et n'importe quel modèle HuggingFace (Mistral, LLaMA, Qwen).",
      },
    ],
  }),
  component: DocsPage,
});

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group">
      <button
        onClick={onCopy}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition rounded-lg bg-surface-elevated/80 backdrop-blur px-2.5 py-1.5 text-xs flex items-center gap-1.5 border border-border hover:border-primary"
      >
        <Copy className="h-3 w-3" />
        {copied ? "Copié !" : "Copier"}
      </button>
      <pre className="rounded-2xl bg-[#0a0e1a] border border-border p-5 overflow-x-auto text-sm">
        <code className={`language-${lang} text-foreground/90`}>{code}</code>
      </pre>
    </div>
  );
}

function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6"
          >
            ← Retour à l'accueil
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-cyan">
              <Cloud className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xs uppercase tracking-widest text-primary">
              Documentation API
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-light tracking-tight">
            Une clé. <span className="text-primary">Tous les modèles.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            L'API Aetheris est <strong className="text-foreground">100% compatible OpenAI</strong>.
            Tu peux utiliser le SDK <code className="text-primary">openai</code>, ou n'importe quel
            client HTTP, pour appeler Gemini, GPT-5, Mistral, LLaMA et tous les modèles HuggingFace.
          </p>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link
              to="/dashboard/api-keys"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-5 py-3 text-sm font-medium shadow-glow-cyan hover:opacity-95"
            >
              Créer une clé API <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard/workspace"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium hover:border-primary"
            >
              <Terminal className="h-4 w-4" />
              Ouvrir le terminal
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* 1. Quickstart */}
        <section>
          <h2 className="font-display text-3xl font-light mb-2 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            Quickstart
          </h2>
          <p className="text-muted-foreground mb-6">Trois étapes pour ton premier appel.</p>
          <ol className="space-y-3 mb-8 text-sm">
            <li className="flex gap-3">
              <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                1
              </span>
              <span>
                Va sur{" "}
                <Link to="/dashboard/api-keys" className="text-primary underline">
                  /dashboard/api-keys
                </Link>{" "}
                et crée une clé <code className="text-primary">sk-aeth-...</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                2
              </span>
              <span>Copie le snippet ci-dessous</span>
            </li>
            <li className="flex gap-3">
              <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                3
              </span>
              <span>
                Remplace <code className="text-primary">sk-aeth-...</code> par ta clé et lance
              </span>
            </li>
          </ol>
          <CodeBlock
            lang="bash"
            code={`curl https://aetheris.lovable.app/api/v1/chat/completions \\
  -H "Authorization: Bearer sk-aeth-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "google/gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Bonjour Aetheris !"}]
  }'`}
          />
        </section>

        {/* 2. Endpoint */}
        <section>
          <h2 className="font-display text-3xl font-light mb-2 flex items-center gap-3">
            <Code2 className="h-6 w-6 text-primary" />
            Endpoint
          </h2>
          <div className="rounded-2xl border border-border p-5 mb-6 bg-surface-elevated/30">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="rounded-lg bg-primary/20 text-primary px-2.5 py-1 text-xs font-semibold">
                POST
              </span>
              <code className="text-foreground">/api/v1/chat/completions</code>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Format strictement compatible{" "}
              <a
                href="https://platform.openai.com/docs/api-reference/chat"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                OpenAI Chat Completions
              </a>
              .
            </p>
          </div>

          <h3 className="font-medium text-lg mb-3">Authentification</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Ajoute ta clé via l'un de ces deux headers :
          </p>
          <CodeBlock
            lang="http"
            code={`Authorization: Bearer sk-aeth-...
# OU
X-API-Key: sk-aeth-...`}
          />
        </section>

        {/* 3. Python / Colab */}
        <section>
          <h2 className="font-display text-3xl font-light mb-2">Exemple Python (Google Colab)</h2>
          <p className="text-muted-foreground mb-6">
            Colle ce code dans une cellule Colab. Aucune dépendance exotique.
          </p>
          <CodeBlock
            lang="python"
            code={`import requests

AETHERIS_API_KEY = "sk-aeth-..."          # ← ta clé
BASE_URL = "https://aetheris.lovable.app"

def chat(prompt, model="google/gemini-2.5-flash"):
    r = requests.post(
        f"{BASE_URL}/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {AETHERIS_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

# Exemple : modèle Gemini
print(chat("Explique la mécanique quantique en 3 phrases."))

# Exemple : modèle HuggingFace (Mistral)
print(chat("Bonjour", model="hf/mistralai/Mistral-7B-Instruct-v0.3"))`}
          />
        </section>

        {/* 4. SDK OpenAI */}
        <section>
          <h2 className="font-display text-3xl font-light mb-2">Avec le SDK OpenAI officiel</h2>
          <p className="text-muted-foreground mb-6">
            Tu peux pointer le SDK <code className="text-primary">openai</code> vers Aetheris en
            changeant juste <code className="text-primary">base_url</code>.
          </p>
          <CodeBlock
            lang="python"
            code={`from openai import OpenAI

client = OpenAI(
    api_key="sk-aeth-...",
    base_url="https://aetheris.lovable.app/api/v1",
)

response = client.chat.completions.create(
    model="openai/gpt-5-mini",
    messages=[{"role": "user", "content": "Hello !"}],
)
print(response.choices[0].message.content)`}
          />
        </section>

        {/* 5. Modèles supportés */}
        <section>
          <h2 className="font-display text-3xl font-light mb-2">Modèles supportés</h2>
          <p className="text-muted-foreground mb-6">
            Deux familles de modèles, accessibles avec la même clé.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-6 bg-surface-elevated/30">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Modèles intégrés (instantané)</h3>
              </div>
              <ul className="space-y-2 text-sm font-mono">
                <li>google/gemini-2.5-flash</li>
                <li>google/gemini-2.5-pro</li>
                <li>google/gemini-2.5-flash-lite</li>
                <li>google/gemini-3-flash-preview</li>
                <li>openai/gpt-5</li>
                <li>openai/gpt-5-mini</li>
                <li>openai/gpt-5-nano</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-secondary/30 p-6 bg-surface-elevated/30">
              <div className="flex items-center gap-2 mb-4">
                <Cloud className="h-5 w-5 text-secondary" />
                <h3 className="font-medium">HuggingFace (préfixe hf/)</h3>
              </div>
              <ul className="space-y-2 text-sm font-mono">
                <li>hf/mistralai/Mistral-7B-Instruct-v0.3</li>
                <li>hf/meta-llama/Llama-3.1-8B-Instruct</li>
                <li>hf/Qwen/Qwen2.5-7B-Instruct</li>
                <li>hf/google/gemma-2-9b-it</li>
                <li className="text-muted-foreground">… ou n'importe quel repo chat HF</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Note : le premier appel à un modèle HF peu utilisé peut renvoyer 503 (cold start
                ~30s). Réessaie.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Terminal */}
        <section>
          <h2 className="font-display text-3xl font-light mb-2 flex items-center gap-3">
            <Terminal className="h-6 w-6 text-primary" />
            Terminal Aetheris
          </h2>
          <p className="text-muted-foreground mb-6">
            Le terminal web (
            <Link to="/dashboard/workspace" className="text-primary underline">
              /dashboard/workspace
            </Link>
            ) permet de tester sans écrire de code.
          </p>
          <CodeBlock
            lang="bash"
            code={`login sk-aeth-...
whoami
catalog
import hf mistralai/Mistral-7B-Instruct-v0.3
run hf/mistralai/Mistral-7B-Instruct-v0.3 "Bonjour"
upload mon-modele.gguf
export-key`}
          />
        </section>

        {/* 7. Codes erreur */}
        <section>
          <h2 className="font-display text-3xl font-light mb-2">Codes d'erreur</h2>
          <div className="rounded-2xl border border-border overflow-hidden mt-6">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Signification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-mono text-primary">401</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Clé API absente, invalide ou révoquée
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-primary">402</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Crédits épuisés (recharge sur /dashboard/billing)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-primary">429</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Rate limit — réessaie dans quelques secondes
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-primary">502</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Erreur en amont (HuggingFace ou Lovable AI)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-primary">503</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Modèle HF en cold start — réessaie dans 30s
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="storage" className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" /> Stockage de modèles (SeaweedFS)
          </h2>
          <p className="text-muted-foreground">
            Aetheris stocke tes modèles lourds (GGUF, safetensors, datasets) sur un cluster
            SeaweedFS exposé en S3. Depuis le terminal :
          </p>
          <CodeBlock
            lang="bash"
            code={`# 1. Récupère une URL d'upload pré-signée (1 commande dans le terminal Aetheris)
push mistral-119b.gguf

# 2. Upload depuis ta machine locale
curl -X PUT "<URL_PRESIGNEE>" \\
     -H "Content-Type: application/octet-stream" \\
     --data-binary @mistral-119b.gguf

# 3. Vérifie
ls

# 4. Re-télécharge plus tard (URL valide 1h)
pull mistral-119b.gguf`}
          />
          <p className="text-muted-foreground text-sm">
            Tu peux aussi télécharger directement via l'API publique :
          </p>
          <CodeBlock
            lang="bash"
            code={`curl -L -H "Authorization: Bearer sk-aeth-..." \\
     https://aetheris.lovable.app/api/v1/models/mistral-119b.gguf/download \\
     -o mistral-119b.gguf`}
          />
          <p className="text-xs text-muted-foreground">
            Les fichiers sont scopés à ton user_id : impossible d'accéder à ceux d'un autre
            utilisateur.
          </p>
        </section>

        <section className="text-center py-12 border-t border-border">
          <p className="text-muted-foreground text-sm">Une question ? Un modèle qui manque ?</p>
          <Link
            to="/dashboard/workspace"
            className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
          >
            Ouvre le terminal Aetheris <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
