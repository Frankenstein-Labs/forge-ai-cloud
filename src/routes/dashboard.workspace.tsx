import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, Github, ExternalLink, TerminalSquare, Sparkles } from "lucide-react";
import { AetherisTerminal } from "@/components/workspace/AetherisTerminal";

export const Route = createFileRoute("/dashboard/workspace")({
  head: () => ({
    meta: [{ title: "Workspace — Aetheris" }],
  }),
  component: WorkspacePage,
});

type Tab = "terminal" | "vscode";

function WorkspacePage() {
  const [tab, setTab] = useState<Tab>("terminal");
  const [repo, setRepo] = useState("");

  const cleanRepo = repo
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/^\/+|\/+$/g, "");

  const githubDevUrl = cleanRepo ? `https://github.dev/${cleanRepo}` : "https://github.dev";
  const vscodeDevUrl = cleanRepo
    ? `https://vscode.dev/github/${cleanRepo}`
    : "https://vscode.dev";

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h1 className="font-display text-4xl font-light tracking-tight">Workspace</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Terminal interactif Aetheris + éditeurs de code dans le navigateur.
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex gap-1 rounded-xl bg-surface-elevated/50 border border-border p-1">
        <button
          onClick={() => setTab("terminal")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
            tab === "terminal"
              ? "bg-gradient-primary text-primary-foreground shadow-glow-cyan"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TerminalSquare className="h-4 w-4" />
          Terminal
        </button>
        <button
          onClick={() => setTab("vscode")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
            tab === "vscode"
              ? "bg-gradient-primary text-primary-foreground shadow-glow-cyan"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 className="h-4 w-4" />
          Éditeurs Web
        </button>
      </div>

      {tab === "terminal" ? (
        <div className="space-y-4">
          <AetherisTerminal />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5 flex items-start gap-4 border border-primary/10">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Premiers pas</p>
                <p className="text-muted-foreground mt-1">
                  1) Crée une clé sur <code className="text-primary">Clés API</code>.{" "}
                  2) <code className="text-primary">login sk-aeth-…</code> →{" "}
                  <code className="text-primary">whoami</code> →{" "}
                  <code className="text-primary">run google/gemini-2.5-flash "Bonjour"</code>.
                </p>
              </div>
            </div>
            <div className="glass rounded-2xl p-5 flex items-start gap-4 border border-secondary/20">
              <TerminalSquare className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">API publique (OpenAI-compatible)</p>
                <p className="text-muted-foreground mt-1">
                  Endpoint : <code className="text-secondary">POST /api/v1/chat/completions</code>.{" "}
                  Tape <code className="text-secondary">export-key</code> pour générer un snippet
                  Python prêt pour Google Colab / Postman.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Github className="h-4 w-4 text-primary" />
              Dépôt GitHub (optionnel)
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Format : <code className="text-primary">owner/repo</code> ou URL complète.
            </p>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="aetheris-ai/exemple-projet"
              className="mt-4 w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href={vscodeDevUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-3xl p-8 hover:shadow-glow-cyan transition-all group"
            >
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-glow-cyan mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-medium flex items-center gap-2">
                vscode.dev
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                VSCode complet dans le navigateur, hébergé par Microsoft.
              </p>
              <div className="mt-6 w-full rounded-xl bg-gradient-primary text-primary-foreground font-medium px-4 py-3 text-sm text-center shadow-glow-cyan">
                {cleanRepo ? `Ouvrir ${cleanRepo}` : "Ouvrir vscode.dev"}
              </div>
            </a>

            <a
              href={githubDevUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-3xl p-8 hover:shadow-glow-plasma transition-all group"
            >
              <div className="size-12 rounded-2xl bg-secondary/10 flex items-center justify-center shadow-glow-plasma mb-4">
                <Github className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-display text-xl font-medium flex items-center gap-2">
                github.dev
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition" />
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Édition directe sur GitHub avec authentification intégrée.
              </p>
              <div className="mt-6 w-full rounded-xl bg-secondary/20 text-foreground font-medium px-4 py-3 text-sm text-center border border-secondary/30">
                {cleanRepo ? `Ouvrir ${cleanRepo} sur github.dev` : "Ouvrir github.dev"}
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
