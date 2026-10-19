import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDokploy, listDokployProjects } from "@/lib/dokploy.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, Layers } from "lucide-react";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/projects/$projectId")({ head: () => pageMeta("Environnements du projet — Aetheris", "Environnements et services de votre projet Dokploy."), component: Project });
function Project() {
 const { projectId } = Route.useParams(); const list = useServerFn(listDokployProjects); const get = useServerFn(getDokploy);
 const { data, error, isLoading } = useQuery({ queryKey: ["dokploy-projects"], queryFn: () => list(), retry: false });
 const { data: connection } = useQuery({ queryKey: ["dokploy-connection"], queryFn: () => get(), retry: false });
 const project = data?.items.find((p) => p.projectId === projectId);
 return <div className="space-y-6"><Button asChild variant="ghost" size="sm"><Link to="/dashboard/projects"><ArrowLeft />Projets</Link></Button><h1>{project?.name ?? "Projet"}</h1>{isLoading ? <p>Chargement…</p> : error ? <p role="alert" className="text-destructive">{error.message}</p> : !project ? <p className="text-muted-foreground">Projet inaccessible sur votre compte Dokploy.</p> : <><p className="text-sm text-muted-foreground">{project.description}</p><h2 className="text-lg font-semibold">Environnements</h2><div className="divide-y border-y">{project.environments?.map((env) => <div key={env.environmentId} className="flex flex-wrap items-center justify-between gap-3 py-4"><span className="flex items-center gap-2"><Layers className="size-4" />{env.name}</span>{connection?.endpoint && <Button asChild variant="outline" size="sm"><a href={`${connection.endpoint}/dashboard/project/${encodeURIComponent(projectId)}/environment/${encodeURIComponent(env.environmentId)}`} target="_blank" rel="noopener noreferrer">Services dans Dokploy<ArrowUpRight /></a></Button>}</div>)}</div>{!project.environments?.length && <p className="text-sm text-muted-foreground">Aucun environnement renvoyé par Dokploy.</p>}</>}</div>;
}
