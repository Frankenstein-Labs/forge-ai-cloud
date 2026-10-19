import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { DokployConnection } from "@/components/dashboard/DokployConnection";
import { HfKeyCard } from "@/components/dashboard/HfKeyCard";

export const Route = createFileRoute("/dashboard/settings/")({
  head: () => ({
    meta: [{ title: "Paramètres — Aetheris" }, { name: "description", content: "Paramètres de votre compte Aetheris Cloud." }, { property: "og:title", content: "Paramètres — Aetheris" }, { property: "og:description", content: "Paramètres de votre compte Aetheris Cloud." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCompany(profile.company ?? "");
    }
  }, [profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, company })
      .eq("id", profile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profil mis à jour");
      void refreshProfile();
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("8 caractères minimum");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Mot de passe mis à jour");
      setNewPassword("");
    }
  };

  const deleteAccount = async () => {
    toast.error(
      "La suppression de compte n'est pas encore disponible. Aucune donnée n'a été supprimée.",
    );
  };

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h1 className="font-display text-4xl font-light ">Paramètres</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Gérez votre profil, votre sécurité et votre équipe.
        </p>
      </div>

      <DokployConnection />
      {/* Profil */}
      <form onSubmit={saveProfile} className="border-b pb-6 space-y-5">
        <h2 className="font-display text-xl font-medium">Profil</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium uppercase  text-muted-foreground">
              Nom complet
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              className="mt-2 w-full rounded-md bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase  text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={profile?.email ?? ""}
              disabled
              className="mt-2 w-full rounded-md bg-surface-elevated/30 border border-border px-4 py-3 text-sm opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium uppercase  text-muted-foreground">
              Entreprise
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={200}
              placeholder="Optionnel"
              className="mt-2 w-full rounded-md bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm  disabled:opacity-60 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Mettre à jour
        </Button>
      </form>

      {/* Clé Hugging Face */}
      <HfKeyCard className="rounded-none border-x-0 border-t-0 shadow-none" />

      {/* Sécurité */}
      <form onSubmit={changePassword} className="border-b pb-6 space-y-5">
        <h2 className="font-display text-xl font-medium">Sécurité</h2>
        <div>
          <label className="text-xs font-medium uppercase  text-muted-foreground">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            placeholder="••••••••"
            className="mt-2 w-full max-w-md rounded-md bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <Button
          type="submit"
          disabled={!newPassword}
          className="px-5 py-3 rounded-md border border-border text-sm font-medium hover:bg-muted transition disabled:opacity-50"
        >
          Changer le mot de passe
        </Button>
      </form>

      {/* Danger zone */}
      <div className="glass rounded-lg p-6 lg:p-8 border border-destructive/20">
        <h2 className="font-display text-xl font-medium text-destructive">Zone dangereuse</h2>
        <p className="text-sm text-muted-foreground mt-2">
          La suppression automatique n'est pas encore disponible. Aucune donnée ne sera supprimée
          tant qu'un parcours serveur audité n'aura pas été mis en service.
        </p>
        <Button
          onClick={deleteAccount}
          disabled
          title="Un parcours serveur audité est requis avant de pouvoir supprimer un compte."
          className="mt-5 px-5 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium inline-flex items-center gap-2 cursor-not-allowed opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Suppression indisponible
        </Button>
      </div>
    </div>
  );
}
