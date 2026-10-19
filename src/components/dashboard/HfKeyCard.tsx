// Formulaire « Clé Hugging Face » branché sur /api/hf-config.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { authJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Status = {
  configured: boolean;
  masked: string | null;
  label: string | null;
  updated_at: string | null;
  server_fallback: boolean;
};

export function HfKeyCard({ className }: { className?: string }) {
  const qc = useQueryClient();
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["hf-config"],
    queryFn: () => authJson<Status>("/api/hf-config"),
  });

  const save = useMutation({
    mutationFn: () =>
      authJson<{ ok: boolean; account?: string }>("/api/hf-config", {
        method: "POST",
        body: JSON.stringify({ token: token.trim(), label: label.trim() || null }),
      }),
    onSuccess: (res) => {
      toast.success(
        res.account ? `Clé validée (compte ${res.account})` : "Clé Hugging Face enregistrée",
      );
      setToken("");
      setLabel("");
      qc.invalidateQueries({ queryKey: ["hf-config"] });
      qc.invalidateQueries({ queryKey: ["hf-models"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => authJson("/api/hf-config", { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Clé supprimée");
      qc.invalidateQueries({ queryKey: ["hf-config"] });
      qc.invalidateQueries({ queryKey: ["hf-models"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" /> Clé Hugging Face
            </CardTitle>
            <CardDescription>
              Utilisée pour exécuter vos modèles <code>hf/&lt;owner&gt;/&lt;repo&gt;</code>,
              importer et publier vos dépôts. Elle reste chiffrée côté serveur.
            </CardDescription>
          </div>
          {isLoading ? null : data?.configured ? (
            <Badge className="gap-1 bg-success/15 text-success">
              <CheckCircle2 className="size-3" /> Active
            </Badge>
          ) : (
            <Badge variant="outline">Non configurée</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.configured && (
          <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div>
              <div className="font-mono">{data.masked}</div>
              <div className="text-muted-foreground text-xs">
                {data.label ? `${data.label} · ` : ""}
                {data.updated_at ? new Date(data.updated_at).toLocaleString("fr-FR") : ""}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              {remove.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Supprimer
            </Button>
          </div>
        )}

        <form
          className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!token.trim()) {
              toast.error("Collez votre jeton hf_…");
              return;
            }
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="hf-token">Jeton d'accès</Label>
            <Input
              id="hf-token"
              type="password"
              autoComplete="off"
              placeholder="hf_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hf-label">Libellé (option.)</Label>
            <Input
              id="hf-label"
              placeholder="Compte perso"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {data?.configured ? "Remplacer" : "Enregistrer"}
          </Button>
        </form>

        <p className="text-muted-foreground text-xs">
          Créez un jeton « Read » sur huggingface.co/settings/tokens. La clé est vérifiée auprès de
          Hugging Face avant enregistrement.
        </p>
      </CardContent>
    </Card>
  );
}
