// Endpoint serveur pour le terminal Aetheris.
// Reçoit { command: string } + Authorization: Bearer <api-key>
// Retourne { output: string }.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

function getServerClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extractApiKey(request: Request): string | null {
  const xKey = request.headers.get("x-api-key");
  if (xKey) return xKey.trim();
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

async function authenticate(request: Request) {
  const key = extractApiKey(request);
  if (!key) return null;
  const hashed = await sha256Hex(key);
  const supabase = getServerClient();
  const { data, error } = await supabase.rpc("validate_api_key", {
    _hashed_key: hashed,
  });
  if (error || !data || data.length === 0) return null;
  return data[0];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCommand(
  command: string,
  authed: Awaited<ReturnType<typeof authenticate>>,
): Promise<string> {
  const trimmed = command.trim();
  if (!trimmed) return "";

  const [cmd, ...args] = trimmed.split(/\s+/);

  switch (cmd) {
    case "help":
      return [
        "Commandes disponibles :",
        "  help                — affiche cette aide",
        "  whoami              — infos sur la clé API courante",
        "  models              — liste les modèles déployés",
        "  run <model> <prompt>— exécute un modèle (simulation)",
        "  upload <name>       — enregistre un modèle (simulation)",
        "  clear               — efface l'écran",
      ].join("\n");

    case "whoami":
      if (!authed) return "❌ Non authentifié. Utilise: login <ta-clé-api>";
      return [
        `✅ Authentifié`,
        `  user_id     : ${authed.user_id}`,
        `  permissions : ${authed.permissions}`,
        `  budget      : ${authed.budget_limit_tokens ?? "illimité"} tokens`,
      ].join("\n");

    case "models": {
      if (!authed) return "❌ Non authentifié.";
      const supabase = getServerClient();
      const { data, error } = await supabase
        .from("deployments")
        .select("deployment_name, status, region")
        .eq("user_id", authed.user_id)
        .limit(20);
      if (error) return `Erreur DB : ${error.message}`;
      if (!data || data.length === 0) return "Aucun déploiement trouvé.";
      return data
        .map((d) => `  • ${d.deployment_name}  [${d.status}]  (${d.region})`)
        .join("\n");
    }

    case "run": {
      if (!authed) return "❌ Non authentifié.";
      const model = args[0];
      const prompt = args.slice(1).join(" ");
      if (!model) return "Usage : run <model> <prompt>";
      return `🚀 [${model}] → simulation\n   prompt: ${prompt || "(vide)"}\n   ↳ output: réponse simulée. Branche /api/ai/generate pour l'IA réelle.`;
    }

    case "upload": {
      if (!authed) return "❌ Non authentifié.";
      const name = args[0];
      if (!name) return "Usage : upload <nom-du-modèle>";
      return `📦 Upload simulé pour "${name}". Implémentation réelle via bucket configs-agents.`;
    }

    default:
      return `❓ Commande inconnue: "${cmd}". Tape "help".`;
  }
}

export const Route = createFileRoute("/api/terminal")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        let body: { command?: string };
        try {
          body = await request.json();
        } catch {
          return json({ output: "❌ Requête invalide (JSON attendu)" }, 400);
        }
        const command = (body.command ?? "").toString();
        if (command.length > 2000) {
          return json({ output: "❌ Commande trop longue" }, 400);
        }

        const authed = await authenticate(request);

        try {
          const output = await handleCommand(command, authed);
          return json({ output, authenticated: !!authed });
        } catch (e) {
          return json({ output: `Erreur serveur : ${(e as Error).message}` }, 500);
        }
      },
    },
  },
});
