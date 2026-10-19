import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, Search, ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { createDokployProject, listDokployProjects } from "@/lib/dokploy.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function DokployProjects() {
  const list = useServerFn(listDokployProjects); const create = useServerFn(createDokployProject);
  const qc = useQueryClient();
  const [search, setSearch] = useState(""); const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const { data, error, isLoading, refetch, isFetching } = useQuery({ queryKey: ["dokploy-projects"], queryFn: () => list(), retry: false });
  const save = useMutation({ mutationFn: () => create({ data: { name, description } }), onSuccess: () => { setOpen(false); setName(""); setDescription(""); void qc.invalidateQueries({ queryKey: ["dokploy-projects"] }); toast.success("Projet créé sur Dokploy"); }, onError: (e: Error) => toast.error(e.message) });
  const items = (data?.items ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1>Projets</h1><div className="flex gap-2"><Button variant="outline" size="icon" title="Actualiser" aria-label="Actualiser les projets" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={isFetching ? "animate-spin" : ""} /></Button><Button onClick={() => setOpen(true)} disabled={!data?.configured}><Plus />Créer un projet</Button></div></div><div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Rechercher un projet…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    {isLoading ? <p className="flex gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Chargement…</p> : error ? <p role="alert" className="text-sm text-destructive">{error.message}</p> : !data?.configured ? <div className="flex min-h-64 flex-col items-center justify-center gap-4 border-y py-10 text-center"><FolderKanban className="size-10 text-muted-foreground" /><h2 className="text-lg font-semibold">Aucune instance Dokploy connectée</h2><Button asChild variant="outline"><Link to="/dashboard/settings">Connecter Dokploy<ArrowUpRight /></Link></Button></div> : items.length === 0 ? <p className="border-y py-12 text-center text-sm text-muted-foreground">{search ? "Aucun projet correspondant." : "Aucun projet sur votre compte Dokploy."}</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((p) => <Card key={p.projectId}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderKanban className="size-4" />{p.name}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{p.description || "—"}</p><div className="text-xs text-muted-foreground">{p.environments?.length ?? 0} environnement(s)</div><Button asChild variant="outline" size="sm"><Link to="/dashboard/projects/$projectId" params={{ projectId: p.projectId }}>Ouvrir<ArrowUpRight /></Link></Button></CardContent></Card>)}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Créer un projet</DialogTitle><DialogDescription>Dokploy</DialogDescription></DialogHeader><form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4"><div className="space-y-2"><Label htmlFor="project-name">Nom</Label><Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required /></div><div className="space-y-2"><Label htmlFor="project-description">Description</Label><Input id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />}Créer</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}