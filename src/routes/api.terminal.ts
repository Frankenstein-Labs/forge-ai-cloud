// Endpoint serveur pour le terminal Aetheris.
// Reçoit { command: string } + Authorization: Bearer <api-key> ou X-API-Key
import { createFileRoute } from "@tanstack/react-router";
import {
  authenticateApiKey,
  corsHeaders,
  getServerSupabase,
  jsonResponse,
  type AuthedKey,
} from "@/lib/api-auth";

async function handleCommand(
  command: string,
  authed: AuthedKey | null,
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
        "  run <model> <prompt>— exécute un modèle via /api/v1/chat/completions",
        "  upload <name>       — enregistre un modèle (simulation)",
        "  export-key          — génère un snippet Python pour Colab (local)",
        "  clear               — efface l'écran (local)",
        "  logout              — oublie la clé en mémoire (local)",
      ].join("\n");

    case "whoami":
      if (!authed) return "❌ Non authentifié. Utilise: login <ta-clé-api>";
      return [
        `✅ Authentifié`,
        `  user_id     : ${authed.user_id}`,
        `  permissions : ${authed.permissions}`,
        `  budget      : ${authed.budget_limit_tokens ?? "illimité"} tokens`,
        `  endpoint    : POST /api/v1/chat/completions (compatible OpenAI)`,
      ].join("\n");

    case "models": {
      if (!authed) return "❌ Non authentifié.";
      const supabase = getServerSupabase();
      const { data, error } = await supabase
        .from("deployments")
        .select("deployment_name, status, region")
        .eq("user_id", authed.user_id)
        .limit(20);
      if (error) return `Erreur DB : ${error.message}`;
      if (!data || data.length === 0)
        return [
          "Aucun déploiement personnel.",
          "",
          "Modèles Lovable AI disponibles immédiatement via /api/v1/chat/completions :",
          "  • google/gemini-2.5-flash      (rapide, équilibré)",
          "  • google/gemini-2.5-pro        (raisonnement)",
          "  • google/gemini-2.5-flash-lite (économique)",
          "  • openai/gpt-5-mini            (multimodal)",
        ].join("\n");
      return data
        .map((d) => `  • ${d.deployment_name}  [${d.status}]  (${d.region})`)
        .join("\n");
    }

    case "run": {
      if (!authed) return "❌ Non authentifié.";
      const model = args[0] || "google/gemini-2.5-flash";
      const prompt = args.slice(1).join(" ");
      if (!prompt) return "Usage : run <model> <prompt>";

      // Appel direct du gateway depuis le terminal (côté serveur)
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) return "❌ LOVABLE_API_KEY non configurée côté serveur.";

      try {
        const r = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }],
            }),
          },
        );
        if (r.status === 429) return "⏱️ Rate limit dépassé. Réessaie plus tard.";
        if (r.status === 402)
          return "💳 Crédits Lovable AI épuisés. Recharge le workspace.";
        if (!r.ok) return `❌ Gateway error ${r.status}: ${await r.text()}`;
        const j = (await r.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const content = j.choices?.[0]?.message?.content ?? "(réponse vide)";
        const usage = j.usage
          ? `\n\n\x1b[38;5;245m[tokens: in=${j.usage.prompt_tokens ?? 0} · out=${j.usage.completion_tokens ?? 0}]\x1b[0m`
          : "";
        return `🤖 [${model}]\n${content}${usage}`;
      } catch (e) {
        return `❌ Erreur d'appel : ${(e as Error).message}`;
      }
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
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        let body: { command?: string };
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ output: "❌ Requête invalide (JSON attendu)" }, 400);
        }
        const command = (body.command ?? "").toString();
        if (command.length > 2000) {
          return jsonResponse({ output: "❌ Commande trop longue" }, 400);
        }

        const authed = await authenticateApiKey(request);

        try {
          const output = await handleCommand(command, authed);
          return jsonResponse({ output, authenticated: !!authed });
        } catch (e) {
          return jsonResponse(
            { output: `Erreur serveur : ${(e as Error).message}` },
            500,
          );
        }
      },
    },
  },
});
