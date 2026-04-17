import { createFileRoute } from "@tanstack/react-router";
import { Terminal, Code2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/workspace")({
  head: () => ({
    meta: [{ title: "Workspace — Aetheris" }],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  return (
    <div className="space-y-6">
      <div className="px-2">
        <h1 className="font-display text-4xl font-light tracking-tight">Workspace</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          IDE en ligne avec GPU intégré et SDK Aetheris préinstallé.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-3xl p-8">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-glow-cyan mb-4">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-display text-xl font-medium">JupyterLab</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Notebooks Python avec GPU NVIDIA A100, 40 GB RAM.
          </p>
          <button
            disabled
            className="mt-6 w-full rounded-xl bg-foreground/20 text-muted-foreground font-medium px-4 py-3 text-sm cursor-not-allowed"
          >
            Bientôt disponible
          </button>
        </div>

        <div className="glass rounded-3xl p-8">
          <div className="size-12 rounded-2xl bg-secondary/10 flex items-center justify-center shadow-glow-plasma mb-4">
            <Terminal className="h-6 w-6 text-secondary" />
          </div>
          <h3 className="font-display text-xl font-medium">VSCode Server</h3>
          <p className="text-sm text-muted-foreground mt-2">
            VSCode complet dans le navigateur, connecté à votre cloud.
          </p>
          <button
            disabled
            className="mt-6 w-full rounded-xl bg-foreground/20 text-muted-foreground font-medium px-4 py-3 text-sm cursor-not-allowed"
          >
            Bientôt disponible
          </button>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 flex items-start gap-4 border border-secondary/10">
        <div className="size-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <AlertCircle className="h-5 w-5 text-secondary" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">Phase 2 du roadmap</p>
          <p className="text-muted-foreground mt-1">
            Le Workspace nécessite une infrastructure GPU dédiée (cluster GKE + KServe). Cette
            fonctionnalité sera activée dès que votre cluster sera connecté.
          </p>
        </div>
      </div>
    </div>
  );
}
