import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => ({
    mode: (search.mode as "signin" | "signup" | undefined) ?? "signin",
    redirect: (search.redirect as string | undefined) ?? "/dashboard",
  }),
  head: () => ({
    meta: [
      { title: "Connexion — Aetheris Cloud" },
      { name: "description", content: "Connectez-vous à votre console Aetheris Cloud." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  fullName: z.string().min(2).max(100).optional(),
});

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: redirect });
    }
  }, [user, authLoading, navigate, redirect]);

  useEffect(() => {
    setIsSignup(mode === "signup");
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      email,
      password,
      fullName: isSignup ? fullName : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Champs invalides");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Bienvenue !");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté");
        navigate({ to: redirect });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      if (msg.toLowerCase().includes("invalid login")) {
        toast.error("Email ou mot de passe incorrect");
      } else if (msg.toLowerCase().includes("already registered")) {
        toast.error("Cet email est déjà utilisé");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur Google");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Atmospheric background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 20%, oklch(0.65 0.24 295 / 0.25), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.78 0.18 220 / 0.2), transparent 60%)",
        }}
      />
      <div className="bg-grid absolute inset-0 pointer-events-none opacity-40" aria-hidden />

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-8 group">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-90" />
            <div className="absolute inset-0 rounded-xl shadow-glow-cyan opacity-50" />
            <div className="relative h-full w-full rounded-xl flex items-center justify-center font-display text-background font-bold text-xl">
              Æ
            </div>
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight">
            Aetheris<span className="text-primary">.</span>
          </span>
        </Link>

        <div className="glass rounded-3xl p-8 shadow-elevated border-gradient">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {isSignup ? "Créer un compte" : "Se connecter"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignup
              ? "Démarrez avec 100k tokens gratuits"
              : "Accédez à votre console développeur"}
          </p>

          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-surface-elevated/50 hover:bg-surface-elevated transition-colors px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignup}
                  placeholder="Jean Dupont"
                  className="mt-2 w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@entreprise.com"
                className="mt-2 w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Mot de passe
                </label>
                {!isSignup && (
                  <Link to="/reset-password" className="text-xs text-primary hover:text-primary/80">
                    Oublié ?
                  </Link>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl bg-surface-elevated/50 border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-primary text-primary-foreground font-medium px-4 py-3 text-sm shadow-glow-cyan hover:shadow-glow-plasma transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {isSignup ? "Se connecter" : "S'inscrire"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </div>
    </div>
  );
}
