import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [{ title: "Paramètres — Aetheris" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, refreshProfile, signOut } = useAuth();
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
    if (
      !confirm(
        "Cette action est irréversible. Toutes vos données, clés API et déploiements seront effacés. Continuer ?",
      )
    )
      return;
    toast.info("Suppression de compte — fonctionnalité à activer côté backend");
  };

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h1 className="font-display text-4xl font-light tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Gérez votre profil, votre sécurité et votre équipe.
        </p>
      </div>

      {/* Profil */}
      <form onSubmit={saveProfile} className="glass rounded-3xl p-6 lg:p-8 space-y-5">
        <h2 className="font-display text-xl font-medium">Profil</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Nom complet
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              className="mt-2 w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={profile?.email ?? ""}
              disabled
              className="mt-2 w-full rounded-xl bg-surface-elevated/30 border border-border px-4 py-3 text-sm opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Entreprise
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={200}
              placeholder="Optionnel"
              className="mt-2 w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium text-sm shadow-glow-cyan disabled:opacity-60 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Mettre à jour
        </button>
      </form>

      {/* Sécurité */}
      <form onSubmit={changePassword} className="glass rounded-3xl p-6 lg:p-8 space-y-5">
        <h2 className="font-display text-xl font-medium">Sécurité</h2>
        <div>
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            placeholder="••••••••"
            className="mt-2 w-full max-w-md rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          type="submit"
          disabled={!newPassword}
          className="px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-white/5 transition disabled:opacity-50"
        >
          Changer le mot de passe
        </button>
      </form>

      {/* Danger zone */}
      <div className="glass rounded-3xl p-6 lg:p-8 border border-destructive/20">
        <h2 className="font-display text-xl font-medium text-destructive">Zone dangereuse</h2>
        <p className="text-sm text-muted-foreground mt-2">
          La suppression du compte est irréversible. Toutes vos données, clés API et déploiements
          seront effacés.
        </p>
        <button
          onClick={deleteAccount}
          className="mt-5 px-5 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/20 transition inline-flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
