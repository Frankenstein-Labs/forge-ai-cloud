import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, LockKeyhole, Plug } from "lucide-react";
import { getDokploy } from "@/lib/dokploy.functions";
import { findScreen } from "@/lib/dokploy-screens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DokployScreen({ screen }: { screen: string }) {
  const definition = findScreen(screen); const get = useServerFn(getDokploy);
  const { data, error } = useQuery({ queryKey: ["dokploy-connection"], queryFn: () => get(), retry: false });
  if (!definition) return null;
  const Icon = definition.icon;
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1>{definition.label}</h1><Badge variant="outline">{definition.licensed ? "Licence requise" : "Dokploy"}</Badge></div>{error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}<div className="flex min-h-72 flex-col items-center justify-center gap-4 border-y py-12 text-center"><Icon className="size-10 text-muted-foreground" /><h2 className="text-lg font-semibold">{definition.licensed ? "Fonction Enterprise" : data?.configured ? "Disponible dans votre instance Dokploy" : "Instance non connectée"}</h2>{definition.licensed ? <p className="max-w-md text-sm text-muted-foreground">Cette fonction nécessite une licence et n’est pas activée dans Aetheris.</p> : data?.configured && data.endpoint ? <Button asChild variant="outline"><a href={`${data.endpoint}${definition.path}`} target="_blank" rel="noopener noreferrer">Ouvrir dans Dokploy<ArrowUpRight /></a></Button> : <Button asChild variant="outline"><Link to="/dashboard/settings"><Plug />Connecter Dokploy</Link></Button>}</div></div>;
}