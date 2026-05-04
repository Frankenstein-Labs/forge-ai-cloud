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
import { callHuggingFace, checkHuggingFaceRepo } from "@/lib/hf-gateway";
import {
  getSeaweedConfig,
  presignGet,
  presignPut,
  s3Delete,
  s3Head,
  s3List,
  userObjectKey,
  userPrefix,
} from "@/lib/seaweed";

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
        "  help                       — affiche cette aide",
        "  whoami                     — infos sur la clé API courante",
        "  models                     — liste tes modèles importés",
        "  catalog                    — modèles dispo immédiatement",
        "  run <model> <prompt>       — exécute un modèle (Lovable ou hf/<repo>)",
        "  import hf <owner/repo>     — importe un modèle HuggingFace",
        "  upload <name>              — URL upload (bucket Supabase configs-agents)",
        "",
        "  ── Stockage Seaweed (VPS) ──",
        "  storage                    — état du stockage Seaweed (endpoint, quota)",
        "  ls [prefix]                — liste tes objets sur Seaweed",
        "  push <name>                — URL pré-signée PUT (curl/wget en local)",
        "  pull <name>                — URL pré-signée GET (1h)",
        "  rm <name>                  — supprime un objet Seaweed",
        "",
        "  export-key                 — snippet Python pour Colab (local)",
        "  clear                      — efface l'écran (local)",
        "  logout                     — oublie la clé en mémoire (local)",
      ].join("\n");

    case "whoami":
      if (!authed) return "❌ Non authentifié. Utilise : login <ta-clé-api>";
      return [
        `✅ Authentifié`,
        `  user_id     : ${authed.user_id}`,
        `  permissions : ${authed.permissions}`,
        `  budget      : ${authed.budget_limit_tokens ?? "illimité"} tokens`,
        `  endpoint    : POST /api/v1/chat/completions (compatible OpenAI)`,
      ].join("\n");

    case "catalog":
      return [
        "🌐 Modèles Lovable AI (instantanés, pas d'import nécessaire) :",
        "  • google/gemini-2.5-flash       (rapide, équilibré)",
        "  • google/gemini-2.5-pro         (raisonnement)",
        "  • google/gemini-2.5-flash-lite  (économique)",
        "  • google/gemini-3-flash-preview (next-gen rapide)",
        "  • openai/gpt-5                  (haut de gamme)",
        "  • openai/gpt-5-mini             (multimodal)",
        "",
        "🤗 Modèles HuggingFace (préfixe hf/) — exécute n'importe quel repo chat :",
        "  • hf/mistralai/Mistral-7B-Instruct-v0.3",
        "  • hf/meta-llama/Llama-3.1-8B-Instruct",
        "  • hf/Qwen/Qwen2.5-7B-Instruct",
        "  • hf/<ton-fine-tune>",
        "",
        "Exemples :",
        '  run google/gemini-2.5-flash "Explique la relativité"',
        '  run hf/mistralai/Mistral-7B-Instruct-v0.3 "Bonjour"',
      ].join("\n");

    case "models": {
      if (!authed) return "❌ Non authentifié.";
      const supabase = getServerSupabase();
      const { data, error } = await supabase
        .from("user_models")
        .select("name, source, source_url, size_bytes, created_at")
        .eq("user_id", authed.user_id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return `Erreur DB : ${error.message}`;
      if (!data || data.length === 0)
        return [
          "Aucun modèle personnel importé.",
          "",
          "Pour importer : import hf mistralai/Mistral-7B-Instruct-v0.3",
          "Pour les modèles dispo immédiatement : catalog",
        ].join("\n");
      return [
        `📦 ${data.length} modèle(s) importé(s) :`,
        ...data.map((m) => {
          const size = m.size_bytes
            ? ` · ${(m.size_bytes / 1e9).toFixed(2)} GB`
            : "";
          const src = m.source === "huggingface" ? `hf/${m.name}` : m.name;
          return `  • ${src}  [${m.source}]${size}`;
        }),
      ].join("\n");
    }

    case "import": {
      if (!authed) return "❌ Non authentifié.";
      const sub = args[0];
      const repo = args[1];
      if (sub !== "hf" || !repo) {
        return "Usage : import hf <owner>/<repo>   (ex: import hf mistralai/Mistral-7B-Instruct-v0.3)";
      }
      if (!repo.includes("/")) {
        return "❌ Format invalide. Attendu : <owner>/<repo>";
      }
      const check = await checkHuggingFaceRepo(repo);
      if (!check.exists) {
        return `❌ Repo introuvable sur HuggingFace : ${check.error ?? "inconnu"}`;
      }
      const supabase = getServerSupabase();
      const { error } = await supabase.from("user_models").insert({
        user_id: authed.user_id,
        name: repo,
        source: "huggingface",
        source_url: `https://huggingface.co/${repo}`,
      });
      if (error) return `❌ Erreur DB : ${error.message}`;
      return [
        `✅ Modèle importé : ${repo}`,
        `   pipeline_tag : ${check.pipeline_tag ?? "n/a"}`,
        `   utilisable via : run hf/${repo} "<prompt>"`,
      ].join("\n");
    }

    case "upload": {
      if (!authed) return "❌ Non authentifié.";
      const name = args[0];
      if (!name) return "Usage : upload <nom-du-fichier.gguf>";
      const supabase = getServerSupabase();
      const path = `${authed.user_id}/${Date.now()}-${name}`;
      const { data, error } = await supabase.storage
        .from("configs-agents")
        .createSignedUploadUrl(path);
      if (error || !data) {
        return `❌ Erreur upload : ${error?.message ?? "inconnue"}`;
      }
      // Enregistre le placeholder dans user_models
      await supabase.from("user_models").insert({
        user_id: authed.user_id,
        name,
        source: "upload",
        storage_path: path,
      });
      return [
        `📤 URL d'upload générée (valide ~2h) :`,
        ``,
        `  ${data.signedUrl}`,
        ``,
        `Dans un terminal local :`,
        `  curl -X PUT "${data.signedUrl}" \\`,
        `       -H "Content-Type: application/octet-stream" \\`,
        `       --data-binary @${name}`,
        ``,
        `Le fichier sera stocké dans : configs-agents/${path}`,
      ].join("\n");
    }

    case "run": {
      if (!authed) return "❌ Non authentifié.";
      const model = args[0] || "google/gemini-2.5-flash";
      // Reconstruit le prompt en gérant les guillemets simples
      const promptRaw = args.slice(1).join(" ").trim();
      const prompt = promptRaw.replace(/^["']|["']$/g, "");
      if (!prompt) return 'Usage : run <model> "<prompt>"';

      // Routing HuggingFace
      if (model.startsWith("hf/")) {
        const repo = model.slice(3);
        if (!repo.includes("/")) {
          return "❌ Format attendu : hf/<owner>/<repo>";
        }
        const hf = await callHuggingFace(repo, {
          model: repo,
          messages: [{ role: "user", content: prompt }],
        });
        if (!hf.ok) {
          if (hf.status === 401) return "❌ HF_TOKEN invalide côté serveur.";
          if (hf.status === 402) return "💳 Quota HuggingFace dépassé.";
          if (hf.status === 429) return "⏱️ Rate limit HuggingFace.";
          if (hf.status === 503)
            return "⏳ Modèle en cours de chargement sur HF (cold start). Réessaie dans 30s.";
          return `❌ HF error ${hf.status} : ${hf.message}`;
        }
        const content =
          hf.data.choices?.[0]?.message?.content ?? "(réponse vide)";
        const usage = hf.data.usage
          ? `\n\n\x1b[38;5;245m[hf · tokens: in=${hf.data.usage.prompt_tokens ?? 0} · out=${hf.data.usage.completion_tokens ?? 0}]\x1b[0m`
          : "";
        return `🤗 [${model}]\n${content}${usage}`;
      }

      // Routing Lovable AI Gateway
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

    case "storage": {
      if (!authed) return "❌ Non authentifié.";
      const cfg = getSeaweedConfig();
      if (!cfg)
        return [
          "🟠 Seaweed non configuré côté serveur.",
          "Ajoute SEAWEED_S3_ENDPOINT, SEAWEED_S3_ACCESS_KEY, SEAWEED_S3_SECRET_KEY",
          "(voir /docs#storage).",
        ].join("\n");
      try {
        const objs = await s3List(cfg, userPrefix(authed.user_id), 1000);
        const total = objs.reduce((s, o) => s + o.size, 0);
        return [
          "🟢 Seaweed connecté",
          `  endpoint : ${cfg.endpoint}`,
          `  bucket   : ${cfg.bucket}`,
          `  prefix   : ${userPrefix(authed.user_id)}`,
          `  objets   : ${objs.length}`,
          `  taille   : ${(total / 1e9).toFixed(2)} GB`,
        ].join("\n");
      } catch (e) {
        return `❌ Erreur Seaweed : ${(e as Error).message}`;
      }
    }

    case "ls": {
      if (!authed) return "❌ Non authentifié.";
      const cfg = getSeaweedConfig();
      if (!cfg) return "🟠 Seaweed non configuré (tape: storage).";
      const sub = args[0] ? `${userPrefix(authed.user_id)}${args[0]}` : userPrefix(authed.user_id);
      try {
        const objs = await s3List(cfg, sub, 200);
        if (!objs.length) return "(vide)";
        return objs
          .map((o) => {
            const name = o.key.replace(userPrefix(authed.user_id), "");
            const size = o.size > 1e9
              ? `${(o.size / 1e9).toFixed(2)} GB`
              : o.size > 1e6
                ? `${(o.size / 1e6).toFixed(1)} MB`
                : `${o.size} B`;
            return `  ${name.padEnd(50)} ${size.padStart(10)}  ${o.lastModified}`;
          })
          .join("\n");
      } catch (e) {
        return `❌ ${(e as Error).message}`;
      }
    }

    case "push": {
      if (!authed) return "❌ Non authentifié.";
      const name = args[0];
      if (!name) return 'Usage : push <nom-fichier>   (ex: push mistral-119b.gguf)';
      const cfg = getSeaweedConfig();
      if (!cfg) return "🟠 Seaweed non configuré (tape: storage).";
      try {
        const key = userObjectKey(authed.user_id, name);
        const { url, expiresAt } = await presignPut(cfg, key, 7200);
        const supabase = getServerSupabase();
        await supabase.from("user_models").insert({
          user_id: authed.user_id,
          name,
          source: "upload",
          storage_provider: "seaweed",
          storage_bucket: cfg.bucket,
          storage_path: key,
        });
        const expIso = new Date(expiresAt).toISOString();
        return [
          `📤 URL d'upload Seaweed (valide jusqu'à ${expIso}) :`,
          ``,
          `  ${url}`,
          ``,
          `Depuis ta machine locale :`,
          `  curl -X PUT "${url}" \\`,
          `       -H "Content-Type: application/octet-stream" \\`,
          `       --data-binary @${name}`,
          ``,
          `Vérifie ensuite avec : ls`,
        ].join("\n");
      } catch (e) {
        return `❌ ${(e as Error).message}`;
      }
    }

    case "pull": {
      if (!authed) return "❌ Non authentifié.";
      const name = args[0];
      if (!name) return "Usage : pull <nom-fichier>";
      const cfg = getSeaweedConfig();
      if (!cfg) return "🟠 Seaweed non configuré.";
      try {
        const key = userObjectKey(authed.user_id, name);
        const head = await s3Head(cfg, key);
        if (!head) return `❌ Introuvable : ${name}`;
        const { url, expiresAt } = await presignGet(cfg, key, 3600);
        return [
          `📥 URL de download (valide 1h) :`,
          ``,
          `  ${url}`,
          ``,
          `Taille : ${(head.size / 1e6).toFixed(2)} MB · ETag : ${head.etag}`,
          `Expire : ${new Date(expiresAt).toISOString()}`,
        ].join("\n");
      } catch (e) {
        return `❌ ${(e as Error).message}`;
      }
    }

    case "rm": {
      if (!authed) return "❌ Non authentifié.";
      const name = args[0];
      if (!name) return "Usage : rm <nom-fichier>";
      const cfg = getSeaweedConfig();
      if (!cfg) return "🟠 Seaweed non configuré.";
      try {
        const key = userObjectKey(authed.user_id, name);
        await s3Delete(cfg, key);
        const supabase = getServerSupabase();
        await supabase
          .from("user_models")
          .delete()
          .eq("user_id", authed.user_id)
          .eq("storage_path", key);
        return `🗑️  Supprimé : ${name}`;
      } catch (e) {
        return `❌ ${(e as Error).message}`;
      }
    }

    default:
      return `❓ Commande inconnue : "${cmd}". Tape "help".`;
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
