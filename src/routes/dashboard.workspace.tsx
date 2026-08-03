import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  Cpu,
  Download,
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

type EngineState = "running" | "stopped" | "restarting";

function WorkspacePage() {
  const [engine, setEngine] = useState<EngineState>("running");
  const [cpu, setCpu] = useState(18);
  const [ram, setRam] = useState(42);
  const [disk] = useState(31);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (engine === "running") {
        setCpu((v) => Math.max(4, Math.min(96, v + (Math.random() * 18 - 9))));
        setRam((v) => Math.max(10, Math.min(94, v + (Math.random() * 8 - 4))));
        setUptime((v) => v + 2);
      } else {
        setCpu(0);
        setRam(0);
      }
    }, 2000);
    return () => clearInterval(id);
  }, [engine]);

  const statusMeta: Record<
    EngineState,
    { label: string; dot: string; variant: "default" | "secondary" | "destructive" }
  > = {
    running: { label: "En cours", dot: "bg-primary", variant: "default" },
    stopped: { label: "Arrêté", dot: "bg-destructive", variant: "destructive" },
    restarting: { label: "Redémarrage…", dot: "bg-secondary", variant: "secondary" },
  };

  const restart = () => {
    setEngine("restarting");
    toast.info("Redémarrage du moteur…");
    setTimeout(() => {
      setEngine("running");
      setUptime(0);
      toast.success("Moteur redémarré");
    }, 1800);
  };

  const stop = () => {
    setEngine("stopped");
    setUptime(0);
    toast.warning("Moteur arrêté");
  };

  const start = () => {
    setEngine("running");
    toast.success("Moteur démarré");
  };

  const fmtUptime = () => {
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = uptime % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header + action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Espace de travail</h1>
          <p className="text-muted-foreground text-sm">
            Terminal cloud connecté à votre moteur de dev (Docker / Coder).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {engine === "stopped" ? (
            <Button size="sm" onClick={start}>
              <Play className="mr-2 size-4" /> Démarrer
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={restart}>
              <RotateCw className="mr-2 size-4" /> Redémarrer le moteur
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={stop} disabled={engine === "stopped"}>
            <Square className="mr-2 size-4" /> Stop
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              engine === "running"
                ? toast.info("Ouverture de VS Code Web (code-server)…")
                : toast.error("Démarrez le moteur avant d'ouvrir VS Code")
            }
          >
            <Code2 className="mr-2 size-4" /> Ouvrir VS Code
          </Button>
          <Button
            size="sm"
            onClick={() =>
              toast.info(
                "Utilisez « pull <modèle> » dans le terminal pour télécharger un modèle IA.",
              )
            }
          >
            <Download className="mr-2 size-4" /> Télécharger le modèle IA
          </Button>
        </div>
      </div>

      {/* Terminal + engine panel */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="flex min-h-[520px] flex-col overflow-hidden p-0">
          <CardHeader className="flex-row items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex gap-1.5">
                <span className="size-3 rounded-full bg-destructive/70" />
                <span className="size-3 rounded-full bg-secondary/70" />
                <span className="size-3 rounded-full bg-primary/70" />
              </span>
              <CardTitle className="ml-2 font-mono text-sm">aetheris@workspace: ~</CardTitle>
            </div>
            <Badge variant={statusMeta[engine].variant} className="gap-1.5">
              <span className={`size-1.5 rounded-full ${statusMeta[engine].dot}`} />
              {statusMeta[engine].label}
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
              <CardDescription>Conteneur aetheris-dev-eu-1</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Metric icon={Cpu} label="CPU" value={`${cpu.toFixed(0)} %`} pct={cpu} />
              <Metric
                icon={MemoryStick}
                label="RAM"
                value={`${((ram / 100) * 8).toFixed(1)} / 8 Go`}
                pct={ram}
              />
              <Metric
                icon={HardDrive}
                label="Disque"
                value={`${((disk / 100) * 50).toFixed(0)} / 50 Go`}
                pct={disk}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Statut" value={statusMeta[engine].label} />
              <Row label="Uptime" value={fmtUptime()} mono />
              <Row label="Image" value="ghcr.io/aetheris/dev:latest" mono />
              <Row label="Région" value="EU · Paris" />
              <Row label="Runtime" value="Docker · envbuilder" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4" /> Astuce
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Tapez <code className="text-primary font-mono">help</code> puis{" "}
              <code className="text-primary font-mono">login sk-aeth-…</code> pour authentifier
              votre session, et <code className="text-primary font-mono">export-key</code> pour un
              snippet Python prêt à l'emploi.
            </CardContent>
          </Card>
        </div>
      </div>
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
