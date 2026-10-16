import { connectionInput } from "@/lib/dokploy-validation";

async function encryptionKey() {
  const secret = process.env.DOKPLOY_CONFIG_ENCRYPTION_KEY;
  if (!secret) throw new Error("Le stockage sécurisé Dokploy n’est pas configuré.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptKey(value: string, owner: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(owner) },
    await encryptionKey(),
    new TextEncoder().encode(value),
  );
  return JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) });
}
export async function decryptKey(value: string, owner: string) {
  const parsed = JSON.parse(value) as { iv: number[]; data: number[] };
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(parsed.iv),
      additionalData: new TextEncoder().encode(owner),
    },
    await encryptionKey(),
    new Uint8Array(parsed.data),
  );
  return new TextDecoder().decode(decrypted);
}
export async function dokployRequest(
  endpoint: string,
  apiKey: string,
  procedure: "project.all" | "project.create",
  body?: { name: string; description: string },
) {
  connectionInput.parse({ endpoint, apiKey });
  let response: Response;
  try {
    response = await fetch(`${endpoint}/api/${procedure}`, {
      method: body ? "POST" : "GET",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "Instance Dokploy inaccessible. Vérifiez son domaine HTTPS et sa disponibilité.",
    );
  }
  if (!response.ok)
    throw new Error(
      `Dokploy HTTP ${response.status} — ${response.status === 401 || response.status === 403 ? "clé refusée ou accès insuffisant" : "requête refusée par l’instance"}.`,
    );
  const result: unknown = await response.json();
  if (procedure === "project.all" && !Array.isArray(result))
    throw new Error("Réponse Dokploy incompatible : liste de projets attendue.");
  return result;
}
