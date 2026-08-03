import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Plus, Server, Play, Square, Terminal as TerminalIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/dashboard/engines")({
  head: () => ({
    meta: [
      { title: "Mes Moteurs Cloud — Aetheris" },
      {
        name: "description",
        content:
          "Gérez vos conteneurs de développement cloud loués : Docker, Coder et envbuilder.",
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

const ENGINES = [
  { name: "aetheris-dev-eu-1", image: "ghcr.io/aetheris/dev:latest", region: "EU · Paris", specs: "4 vCPU · 8 Go · 50 Go", status: "running", price: "0,08 €/h" },
  { name: "gpu-a100-train", image: "nvidia/cuda:12.4-runtime", region: "EU · Frankfurt", specs: "12 vCPU · 64 Go · A100", status: "stopped", price: "1,90 €/h" },
  { name: "coder-node20", image: "codercom/enterprise-node:20", region: "US · Ashburn", specs: "2 vCPU · 4 Go · 20 Go", status: "running", price: "0,04 €/h" },
];

function EnginesPage() {
  const running = ENGINES.filter((e) => e.status === "running").length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Mes Moteurs Cloud</h1>
          <p className="text-muted-foreground text-sm">
            Conteneurs Docker / Coder loués sur l'infrastructure Aetheris.
          </p>
        </div>
        <Button onClick={() => toast.info("Sélection d'un gabarit de moteur à venir.")}>
          <Plus className="mr-2 size-4" /> Louer un moteur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Moteurs actifs" value={`${running}`} desc="En cours d'exécution" />
        <Stat title="Moteurs loués" value={`${ENGINES.length}`} desc="Toutes régions" />
        <Stat title="Coût estimé" value="42,60 €" desc="Ce mois-ci" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteneurs</CardTitle>
          <CardDescription>Liste de vos environnements de développement.</CardDescription>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ENGINES.map((e) => (
                <TableRow key={e.name}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <Server className="text-muted-foreground size-4" />
                      {e.name}
                    </span>
                    <span className="text-muted-foreground text-xs">{e.price}</span>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">{e.image}</TableCell>
                  <TableCell className="hidden lg:table-cell">{e.region}</TableCell>
                  <TableCell className="hidden font-mono text-xs lg:table-cell">{e.specs}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "running" ? "default" : "secondary"} className="gap-1.5">
                      <span
                        className={`size-1.5 rounded-full ${e.status === "running" ? "bg-primary" : "bg-muted-foreground"}`}
                      />
                      {e.status === "running" ? "En cours" : "Arrêté"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          toast.success(
                            e.status === "running" ? `${e.name} arrêté` : `${e.name} démarré`,
                          )
                        }
                        aria-label={e.status === "running" ? "Arrêter" : "Démarrer"}
                      >
                        {e.status === "running" ? (
                          <Square className="size-4" />
                        ) : (
                          <Play className="size-4" />
                        )}
                      </Button>
                      <Button size="icon" variant="ghost" asChild aria-label="Ouvrir le terminal">
                        <Link to="/dashboard/workspace">
                          <TerminalIcon className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
