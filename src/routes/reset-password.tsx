import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Réinitialiser le mot de passe — Aetheris Cloud" }, { name: "description", content: "Réinitialiser le mot de passe de votre compte Aetheris Cloud." }, { property: "og:title", content: "Réinitialiser le mot de passe — Aetheris Cloud" }, { property: "og:description", content: "Réinitialiser le mot de passe de votre compte Aetheris Cloud." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Detect recovery flow via URL hash
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email envoyé. Vérifiez votre boîte de réception.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("8 caractères minimum");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 20%, oklch(0.65 0.24 295 / 0.25), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.78 0.18 220 / 0.2), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-elevated border-gradient">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "request" ? "Réinitialiser le mot de passe" : "Nouveau mot de passe"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "request"
              ? "Recevez un lien par email"
              : "Choisissez un nouveau mot de passe"}
          </p>

          {mode === "request" ? (
            <form onSubmit={sendReset} className="mt-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@entreprise.com"
                className="w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-primary text-primary-foreground font-medium px-4 py-3 text-sm shadow-glow-cyan disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Envoyer le lien
              </button>
            </form>
          ) : (
            <form onSubmit={updatePassword} className="mt-6 space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Nouveau mot de passe"
                className="w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-primary text-primary-foreground font-medium px-4 py-3 text-sm shadow-glow-cyan disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Mettre à jour
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm">
            <Link
              to="/auth"
              search={{ mode: "signin", redirect: "/dashboard" }}
              className="text-primary hover:text-primary/80"
            >
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
