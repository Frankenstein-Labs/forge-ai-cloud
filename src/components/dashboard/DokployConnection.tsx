import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plug, Unplug } from "lucide-react";
import { toast } from "sonner";
import { getDokploy, removeDokploy, saveDokploy } from "@/lib/dokploy.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function DokployConnection() {
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const qc = useQueryClient();
  const get = useServerFn(getDokploy);
  const save = useServerFn(saveDokploy);
  const remove = useServerFn(removeDokploy);
  const { data, error } = useQuery({
    queryKey: ["dokploy-connection"],
    queryFn: () => get(),
    retry: false,
  });
  const update = useMutation({
    mutationFn: () => save({ data: { endpoint, apiKey } }),
    onSuccess: () => {
      setApiKey("");
      toast.success("Connexion Dokploy vérifiée et enregistrée");
      void qc.invalidateQueries({ queryKey: ["dokploy-connection"] });
      void qc.invalidateQueries({ queryKey: ["dokploy-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const disconnect = useMutation({
    mutationFn: () => remove(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dokploy-connection"] });
      void qc.invalidateQueries({ queryKey: ["dokploy-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <section className="space-y-4 border-b pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Plug className="size-4" />
          Instance Dokploy
        </h2>
        <Badge variant="outline">{data?.configured ? "Connexion vérifiée" : "Non connectée"}</Badge>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
      {data?.configured && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="break-all font-mono">{data.endpoint}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate()}
          >
            <Unplug />
            Déconnecter
          </Button>
        </div>
      )}
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="dokploy-url">Domaine de votre instance</Label>
          <Input
            id="dokploy-url"
            type="url"
            placeholder="https://dokploy.votre-domaine.com"
            required
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dokploy-key">Clé API de votre compte Dokploy</Label>
          <Input
            id="dokploy-key"
            type="password"
            autoComplete="off"
            required
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Button disabled={update.isPending} type="submit">
            {update.isPending ? <Loader2 className="animate-spin" /> : <Plug />}Vérifier et
            enregistrer
          </Button>
        </div>
      </form>
    </section>
  );
}
