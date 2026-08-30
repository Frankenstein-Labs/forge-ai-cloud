// Résolution du token HuggingFace : clé personnelle de l'utilisateur, sinon HF_TOKEN serveur.
import { getServerSupabase } from "@/lib/api-auth";

export function serverHfToken(): string | undefined {
  return process.env.HF_TOKEN?.trim() || undefined;
}

/** Retourne la clé HF de l'utilisateur si enregistrée, sinon celle du serveur. */
export async function getHfTokenForUser(userId?: string | null): Promise<string | undefined> {
  if (userId) {
    try {
      const supabase = getServerSupabase();
      const { data } = await supabase
        .from("user_hf_config")
        .select("token")
        .eq("user_id", userId)
        .maybeSingle();
      const token = (data as { token?: string } | null)?.token?.trim();
      if (token) return token;
    } catch {
      // fallback env
    }
  }
  return serverHfToken();
}
