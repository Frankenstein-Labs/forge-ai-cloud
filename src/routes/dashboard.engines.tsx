import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Loader2,
  Play,
  RotateCw,
  Server,
  Square,
  Terminal as TerminalIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUptime, useEngines, type EngineAction } from "@/hooks/useEngines";

export const Route = createFileRoute("/dashboard/engines")({
  head: () => ({
    meta: [
      { title: "Mes Moteurs Cloud — Aetheris" },
      {
        name: "description",
        content: "Gérez vos conteneurs de développement cloud loués : Docker, Coder et envbuilder.",
      },
      { property: "og:title", content: "Mes Moteurs Cloud — Aetheris" },
      {
        property: "og:description",
        content: "Louez, démarrez et surveillez vos moteurs de dev cloud Aetheris.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EnginesPage,
});

function EnginesPage() {
  const { engines, events, loading, error, busy, runAction } = useEngines(4000);
  const running = engines.filter((e) => e.status === "running").length;
  const monthlyCost = engines
    .filter((e) => e.status === "running")
    .reduce((sum, e) => sum + e.price_per_hour * 24 * 30, 0);

  const act = async (action: EngineAction, engineId: string, label: string) => {
    try {
      const res = await runAction(action, engineId);
      toast.success(res.message);
    } catch (e) {
      toast.error(`${label} : ${e instanceof Error ? e.message : "action impossible"}`);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold ">Mes Moteurs Cloud</h1>
          <p className="text-muted-foreground text-sm">
            Moteurs de développement connectés à Aetheris.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/settings"><Server className="me-2 size-4" /> Connecter Dokploy</Link>
        </Button>
      </div>

      {error && (
        <p className="text-destructive text-sm">
          Impossible de joindre le service des moteurs : {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Moteurs actifs" value={`${running}`} desc="En cours d'exécution" />
        <Stat title="Moteurs loués" value={`${engines.length}`} desc="Toutes régions" />
        <Stat
          title="Coût estimé"
          value={engines.length ? `${monthlyCost.toFixed(2).replace(".", ",")} €` : "—"}
          desc="Projection mensuelle (moteurs actifs)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteneurs</CardTitle>
          <CardDescription>
            État réel de vos environnements, rafraîchi toutes les 4 secondes.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden md:table-cell">Image</TableHead>
                <TableHead className="hidden lg:table-cell">Région</TableHead>
                <TableHead className="hidden lg:table-cell">Ressources</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden md:table-cell">Uptime</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && engines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                    <Loader2 className="me-2 inline size-4 animate-spin" />
                    Connexion au service des moteurs…
                  </TableCell>
                </TableRow>
              ) : engines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                    Aucun fournisseur de conteneurs réel connecté. Aucun moteur simulé n’est affiché.
                  </TableCell>
                </TableRow>
              ) : (
                engines.map((e) => {
                  const isRunning = e.status === "running";
                  const isBusy = busy?.endsWith(`:${e.id}`);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <Server className="text-muted-foreground size-4" />
                          {e.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {e.price_per_hour.toFixed(2).replace(".", ",")} €/h
                        </span>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs md:table-cell">
                        {e.image}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{e.region}</TableCell>
                      <TableCell className="hidden font-mono text-xs lg:table-cell">
                        {e.cpu_cores} vCPU · {e.ram_gb} Go · {e.disk_gb} Go
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isRunning ? "default" : "secondary"}
                          className="gap-1.5"
                        >
                          <span
                            className={`size-1.5 rounded-full ${isRunning ? "bg-primary" : "bg-muted-foreground"}`}
                          />
                          {isRunning
                            ? "En cours"
                            : e.status === "restarting"
                              ? "Redémarrage…"
                              : "Arrêté"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs md:table-cell">
                        {formatUptime(e.metrics.uptime_seconds)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() =>
                              act(isRunning ? "stop" : "start", e.id, e.name)
                            }
                            aria-label={isRunning ? "Arrêter" : "Démarrer"}
                          >
                            {isBusy ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : isRunning ? (
                              <Square className="size-4" />
                            ) : (
                              <Play className="size-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isBusy || !isRunning}
                            onClick={() => act("restart", e.id, e.name)}
                            aria-label="Redémarrer"
                          >
                            <RotateCw className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                            aria-label="Ouvrir le terminal"
                          >
                            <Link to="/dashboard/workspace">
                              <TerminalIcon className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Journal des opérations</CardTitle>
            <CardDescription>Dernières actions exécutées sur vos moteurs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.slice(0, 10).map((ev) => (
              <div key={ev.id} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${ev.status === "ok" ? "bg-primary" : "bg-destructive"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{ev.message}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {new Date(ev.created_at).toLocaleString()} · {ev.action}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-display text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">{desc}</p>
      </CardContent>
    </Card>
  );
}
