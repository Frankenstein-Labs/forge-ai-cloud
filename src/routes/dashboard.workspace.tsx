import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  Cpu,
  Download,
  Loader2,
  MemoryStick,
  Play,
  RotateCw,
  Square,
  HardDrive,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { AetherisTerminal } from "@/components/workspace/AetherisTerminal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatUptime, useEngines } from "@/hooks/useEngines";

export const Route = createFileRoute("/dashboard/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Terminal cloud Aetheris" },
      {
        name: "description",
        content:
          "Terminal web, moteur de dev cloud et monitoring CPU/RAM de vos conteneurs Aetheris.",
      },
      { property: "og:title", content: "Workspace — Terminal cloud Aetheris" },
      {
        property: "og:description",
        content: "Pilotez vos moteurs Docker et vos modèles IA depuis un terminal web.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkspacePage,
});

const STATUS_META: Record<
  string,
  { label: string; dot: string; variant: "default" | "secondary" | "destructive" }
> = {
  running: { label: "En cours", dot: "bg-primary", variant: "default" },
  stopped: { label: "Arrêté", dot: "bg-destructive", variant: "destructive" },
  restarting: { label: "Redémarrage…", dot: "bg-secondary", variant: "secondary" },
};

function WorkspacePage() {
  const { engines, events, loading, error, busy, runAction } = useEngines(4000);
  const engine = engines[0];
  const status = engine?.status ?? "stopped";
  const meta = STATUS_META[status] ?? STATUS_META.stopped;
  const metrics = engine?.metrics ?? { cpu: 0, ram: 0, disk: 0, uptime_seconds: 0 };
  const ramGb = engine?.ram_gb ?? 8;
  const diskGb = engine?.disk_gb ?? 50;

  const [pullOpen, setPullOpen] = useState(false);
  const [model, setModel] = useState("mistralai/Mistral-7B-Instruct-v0.3");

  const act = async (
    action: "start" | "stop" | "restart" | "vscode" | "pull-model",
    modelName?: string,
  ) => {
    try {
      const res = await runAction(action, engine?.id, modelName);
      if (res.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      }
      toast.success(res.message);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible");
      return false;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Espace de travail</h1>
          <p className="text-muted-foreground text-sm">
            Terminal cloud connecté à votre moteur de dev (Docker / Coder).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === "stopped" ? (
            <Button size="sm" onClick={() => act("start")} disabled={!!busy || loading}>
              {busy?.startsWith("start") ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <Play className="me-2 size-4" />
              )}
              Démarrer
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => act("restart")}
              disabled={!!busy || loading}
            >
              {busy?.startsWith("restart") ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <RotateCw className="me-2 size-4" />
              )}
              Redémarrer le moteur
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => act("stop")}
            disabled={!!busy || loading || status === "stopped"}
          >
            <Square className="me-2 size-4" /> Stop
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => act("vscode")}
            disabled={!!busy || loading}
          >
            <Code2 className="me-2 size-4" /> Ouvrir VS Code
          </Button>
          <Button size="sm" onClick={() => setPullOpen(true)} disabled={loading}>
            <Download className="me-2 size-4" /> Télécharger le modèle IA
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm">
          Impossible de joindre le service des moteurs : {error}
        </p>
      )}

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex min-h-[520px] flex-col overflow-hidden p-0">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex gap-1.5">
                <span className="size-3 rounded-full bg-destructive/70" />
                <span className="size-3 rounded-full bg-secondary/70" />
                <span className="size-3 rounded-full bg-primary/70" />
              </span>
              <CardTitle className="ms-2 font-mono text-sm">
                aetheris@{engine?.name ?? "workspace"}: ~
              </CardTitle>
            </div>
            <Badge variant={meta.variant} className="gap-1.5">
              <span className={`size-1.5 rounded-full ${meta.dot}`} />
              {loading ? "Connexion…" : meta.label}
            </Badge>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <AetherisTerminal />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Statut du moteur</CardTitle>
              <CardDescription>{engine?.name ?? "Aucun moteur"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Metric icon={Cpu} label="CPU" value={`${metrics.cpu} %`} pct={metrics.cpu} />
              <Metric
                icon={MemoryStick}
                label="RAM"
                value={`${((metrics.ram / 100) * ramGb).toFixed(1)} / ${ramGb} Go`}
                pct={metrics.ram}
              />
              <Metric
                icon={HardDrive}
                label="Disque"
                value={`${((metrics.disk / 100) * diskGb).toFixed(0)} / ${diskGb} Go`}
                pct={metrics.disk}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Statut" value={meta.label} />
              <Row label="Uptime" value={formatUptime(metrics.uptime_seconds)} mono />
              <Row label="Image" value={engine?.image ?? "—"} mono />
              <Row label="Région" value={engine?.region ?? "—"} />
              <Row
                label="Ressources"
                value={
                  engine
                    ? `${engine.cpu_cores} vCPU · ${engine.ram_gb} Go · ${engine.disk_gb} Go`
                    : "—"
                }
                mono
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4" /> Journal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {events.length === 0 ? (
                <p className="text-muted-foreground">
                  Aucune opération encore. Tapez{" "}
                  <code className="text-primary font-mono">help</code> dans le terminal.
                </p>
              ) : (
                events.slice(0, 6).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${ev.status === "ok" ? "bg-primary" : "bg-destructive"}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs">{ev.message}</p>
                      <p className="text-muted-foreground font-mono text-[10px]">
                        {new Date(ev.created_at).toLocaleTimeString()} · {ev.action}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={pullOpen} onOpenChange={setPullOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Télécharger un modèle IA</DialogTitle>
            <DialogDescription>
              Indiquez un dépôt HuggingFace (ex. <code>mistralai/Mistral-7B-Instruct-v0.3</code>).
              Le modèle est vérifié puis rattaché à votre moteur.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="org/nom-du-modele"
            className="font-mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPullOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={!model.trim() || !!busy}
              onClick={async () => {
                const ok = await act("pull-model", model.trim());
                if (ok) setPullOpen(false);
              }}
            >
              {busy?.startsWith("pull") && <Loader2 className="me-2 size-4 animate-spin" />}
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  pct,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          <Icon className="size-4" /> {label}
        </span>
        <span className="font-mono">{value}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
