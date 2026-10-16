import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { connectionInput, projectInput } from "@/lib/dokploy-validation";

export type DokployProject = { projectId: string; name: string; description?: string | null; createdAt?: string; environments?: { environmentId: string; name: string }[] };

export const getDokploy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("dokploy_connections").select("endpoint,verified_at,account_label").eq("user_id", context.userId).maybeSingle();
  if (error) throw new Error("Impossible de lire la connexion Dokploy.");
  return { configured: !!data, endpoint: data?.endpoint ?? null, verifiedAt: data?.verified_at ?? null, label: data?.account_label ?? null };
});

export const saveDokploy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => connectionInput.parse(input)).handler(async ({ context, data }) => {
  const { dokployRequest, encryptKey } = await import("@/lib/dokploy.server");
  await dokployRequest(data.endpoint, data.apiKey, "project.all");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("dokploy_connections").upsert({ user_id: context.userId, endpoint: data.endpoint, encrypted_api_key: await encryptKey(data.apiKey, context.userId), verified_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  if (error) throw new Error("Connexion vérifiée, mais enregistrement impossible.");
  return { ok: true };
});

export const removeDokploy = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("dokploy_connections").delete().eq("user_id", context.userId);
  if (error) throw new Error("Impossible de supprimer la connexion.");
  return { ok: true };
});

export const listDokployProjects = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("dokploy_connections").select("endpoint,encrypted_api_key").eq("user_id", context.userId).maybeSingle();
  if (error) throw new Error("Impossible de lire la connexion.");
  if (!data) return { configured: false, items: [] as DokployProject[] };
  const { decryptKey, dokployRequest } = await import("@/lib/dokploy.server");
  const result = await dokployRequest(data.endpoint, await decryptKey(data.encrypted_api_key, context.userId), "project.all");
  return { configured: true, items: result as DokployProject[] };
});

export const createDokployProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => projectInput.parse(input)).handler(async ({ context, data }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: connection, error } = await supabaseAdmin.from("dokploy_connections").select("endpoint,encrypted_api_key").eq("user_id", context.userId).maybeSingle();
  if (error || !connection) throw new Error("Connectez votre instance Dokploy avant de créer un projet.");
  const { decryptKey, dokployRequest } = await import("@/lib/dokploy.server");
  await dokployRequest(connection.endpoint, await decryptKey(connection.encrypted_api_key, context.userId), "project.create", data);
  return { ok: true };
});