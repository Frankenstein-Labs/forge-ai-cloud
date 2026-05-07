// Client typé pour le proxy MongoDB hébergé sur ton VPS.
// Endpoints attendus : POST /find, /insert, /update, /delete
// Auth : header x-proxy-token

import { getServerSupabase } from "@/lib/api-auth";

export type MongoConfig = { url: string; token: string };

export function getMongoConfigFromEnv(): MongoConfig | null {
  const url = process.env.MONGO_PROXY_URL;
  const token = process.env.MONGO_PROXY_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

/**
 * Charge la config Mongo de l'utilisateur (table user_mongo_config),
 * puis fallback sur les variables d'environnement.
 */
export async function getMongoConfigForUser(
  userId: string,
): Promise<MongoConfig | null> {
  try {
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from("user_mongo_config" as never)
      .select("url, token")
      .eq("user_id", userId)
      .maybeSingle();
    const row = data as { url?: string; token?: string } | null;
    if (row?.url && row?.token) {
      return { url: row.url.replace(/\/$/, ""), token: row.token };
    }
  } catch {
    // ignore — fallback env
  }
  return getMongoConfigFromEnv();
}

// Compat : version synchrone basée env (utilisée hors contexte user)
export function getMongoConfig(): MongoConfig | null {
  return getMongoConfigFromEnv();
}

async function call<T>(
  cfg: MongoConfig,
  path: string,
  body: unknown,
): Promise<T> {
  const r = await fetch(`${cfg.url}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-proxy-token": cfg.token,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Mongo proxy ${path} → ${r.status} ${txt}`);
  }
  return (await r.json()) as T;
}

export type MongoDoc = Record<string, unknown> & { _id?: string };

export const mongo = {
  find: <T = MongoDoc>(
    cfg: MongoConfig,
    collection: string,
    filter: Record<string, unknown> = {},
    opts: { limit?: number; sort?: Record<string, 1 | -1> } = {},
  ) =>
    call<{ docs: T[] }>(cfg, "/find", { collection, filter, ...opts }).then(
      (r) => r.docs,
    ),

  insert: (
    cfg: MongoConfig,
    collection: string,
    doc: MongoDoc,
  ) => call<{ insertedId: string }>(cfg, "/insert", { collection, doc }),

  update: (
    cfg: MongoConfig,
    collection: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ) =>
    call<{ matched: number; modified: number }>(cfg, "/update", {
      collection,
      filter,
      update,
    }),

  delete: (
    cfg: MongoConfig,
    collection: string,
    filter: Record<string, unknown>,
  ) => call<{ deleted: number }>(cfg, "/delete", { collection, filter }),
};
