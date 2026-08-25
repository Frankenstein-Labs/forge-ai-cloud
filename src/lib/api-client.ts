import { supabase } from "@/integrations/supabase/client";

/** fetch avec le jeton de session Supabase attaché (routes /api/* internes). */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export async function authJson<T>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await authFetch(input, init);
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const err = (body as { error?: string })?.error;
    throw new Error(err || `HTTP ${res.status}`);
  }
  return body as T;
}
