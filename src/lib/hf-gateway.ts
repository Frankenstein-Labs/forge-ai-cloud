// Helper pour appeler la HuggingFace Inference API au format OpenAI-compatible.
// HF expose /v1/chat/completions sur api-inference.huggingface.co/models/<repo>/v1/chat/completions
// pour les modèles instruct/chat. On supporte aussi le router HF (router.huggingface.co/v1).

export interface HFChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface HFChatRequest {
  model: string; // ex: "mistralai/Mistral-7B-Instruct-v0.3"
  messages: HFChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface HFChatResponse {
  id?: string;
  choices?: Array<{
    index?: number;
    message?: { role: string; content: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Appelle la HuggingFace Inference API. Retourne la réponse au format OpenAI.
 * Lance une Error avec status pour les codes 401/402/429/5xx.
 */
export async function callHuggingFace(
  repo: string,
  body: HFChatRequest,
): Promise<{ ok: true; data: HFChatResponse } | { ok: false; status: number; message: string }> {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return {
      ok: false,
      status: 500,
      message: "HF_TOKEN non configuré côté serveur.",
    };
  }

  // Endpoint OpenAI-compatible de HuggingFace (router unifié)
  // Doc: https://huggingface.co/docs/inference-providers/index
  const url = "https://router.huggingface.co/v1/chat/completions";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: repo, // HF accepte "owner/name" directement
        messages: body.messages,
        ...(typeof body.temperature === "number" ? { temperature: body.temperature } : {}),
        ...(typeof body.max_tokens === "number" ? { max_tokens: body.max_tokens } : {}),
        stream: false,
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      return {
        ok: false,
        status: r.status,
        message: txt.slice(0, 500),
      };
    }

    const data = (await r.json()) as HFChatResponse;
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      message: `Erreur réseau HuggingFace : ${(e as Error).message}`,
    };
  }
}

/**
 * Vérifie qu'un repo HF existe et est utilisable (HEAD sur l'API model card).
 * Léger, sans charger le modèle.
 */
export async function checkHuggingFaceRepo(repo: string): Promise<{
  exists: boolean;
  pipeline_tag?: string;
  error?: string;
}> {
  try {
    const r = await fetch(`https://huggingface.co/api/models/${encodeURIComponent(repo)}`, {
      headers: process.env.HF_TOKEN ? { Authorization: `Bearer ${process.env.HF_TOKEN}` } : {},
    });
    if (r.status === 404) return { exists: false, error: "Repo introuvable" };
    if (!r.ok) return { exists: false, error: `HTTP ${r.status}` };
    const j = (await r.json()) as { pipeline_tag?: string };
    return { exists: true, pipeline_tag: j.pipeline_tag };
  } catch (e) {
    return { exists: false, error: (e as Error).message };
  }
}
