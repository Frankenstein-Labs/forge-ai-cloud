// Client S3 minimal compatible SeaweedFS / Cloudflare Workers (edge).
// Implémente AWS Signature V4 (presign + signed requests) en pur Web Crypto.
// Pas de SDK aws-sdk ; tout passe par fetch().
//
// Variables d'environnement attendues :
//   SEAWEED_S3_ENDPOINT      ex: https://s3.tondomaine.com
//   SEAWEED_S3_ACCESS_KEY
//   SEAWEED_S3_SECRET_KEY
//   SEAWEED_S3_REGION        (optionnel, défaut: "us-east-1" — Seaweed s'en moque mais SigV4 en exige une)
//   SEAWEED_S3_BUCKET        (optionnel, défaut: "aetheris-models")

const DEFAULT_BUCKET = "aetheris-models";
const DEFAULT_REGION = "us-east-1";
const SERVICE = "s3";

export interface SeaweedConfig {
  endpoint: string; // sans slash final
  accessKey: string;
  secretKey: string;
  region: string;
  bucket: string;
}

export class SeaweedNotConfiguredError extends Error {
  constructor() {
    super(
      "SeaweedFS non configuré. Ajoute SEAWEED_S3_ENDPOINT / SEAWEED_S3_ACCESS_KEY / SEAWEED_S3_SECRET_KEY (voir /docs#storage).",
    );
    this.name = "SeaweedNotConfiguredError";
  }
}

export function getSeaweedConfig(): SeaweedConfig | null {
  const endpoint = process.env.SEAWEED_S3_ENDPOINT;
  const accessKey = process.env.SEAWEED_S3_ACCESS_KEY;
  const secretKey = process.env.SEAWEED_S3_SECRET_KEY;
  if (!endpoint || !accessKey || !secretKey) return null;
  return {
    endpoint: endpoint.replace(/\/+$/, ""),
    accessKey,
    secretKey,
    region: process.env.SEAWEED_S3_REGION ?? DEFAULT_REGION,
    bucket: process.env.SEAWEED_S3_BUCKET ?? DEFAULT_BUCKET,
  };
}

export function requireSeaweedConfig(): SeaweedConfig {
  const cfg = getSeaweedConfig();
  if (!cfg) throw new SeaweedNotConfiguredError();
  return cfg;
}

// ─── Helpers crypto ───────────────────────────────────────────────────────────

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data: BufferSource =
    typeof input === "string" ? enc.encode(input) : new Uint8Array(input);
  const h = await crypto.subtle.digest("SHA-256", data);
  return toHex(h);
}

async function hmac(
  key: ArrayBuffer | Uint8Array,
  data: string,
): Promise<ArrayBuffer> {
  const keyBuf: BufferSource =
    key instanceof Uint8Array ? new Uint8Array(key) : key;
  const k = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", k, enc.encode(data));
}

async function signingKey(
  secret: string,
  date: string, // YYYYMMDD
  region: string,
): Promise<ArrayBuffer> {
  const kDate = await hmac(enc.encode("AWS4" + secret), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}

// ─── Encodage URI strict (RFC3986) ────────────────────────────────────────────

function encodeRfc3986(s: string, encodeSlash = true): string {
  return s
    .split("")
    .map((c) => {
      if (
        (c >= "A" && c <= "Z") ||
        (c >= "a" && c <= "z") ||
        (c >= "0" && c <= "9") ||
        c === "-" ||
        c === "_" ||
        c === "." ||
        c === "~"
      ) {
        return c;
      }
      if (c === "/" && !encodeSlash) return c;
      return encodeURIComponent(c).replace(/[!'()*]/g, (ch) =>
        "%" + ch.charCodeAt(0).toString(16).toUpperCase(),
      );
    })
    .join("");
}

// ─── Construction d'URL bucket+key ────────────────────────────────────────────

function buildObjectUrl(cfg: SeaweedConfig, key: string): URL {
  // path-style : https://endpoint/bucket/key  (le plus compatible avec Seaweed)
  const safeKey = key.split("/").map((p) => encodeRfc3986(p, true)).join("/");
  return new URL(`${cfg.endpoint}/${cfg.bucket}/${safeKey}`);
}

function buildBucketUrl(cfg: SeaweedConfig): URL {
  return new URL(`${cfg.endpoint}/${cfg.bucket}/`);
}

// ─── Validation des noms ──────────────────────────────────────────────────────

const SAFE_NAME = /^[A-Za-z0-9._\-/]{1,200}$/;

export function sanitizeObjectName(name: string): string {
  const trimmed = name.trim().replace(/^\/+/, "");
  if (!trimmed || trimmed.includes("..") || !SAFE_NAME.test(trimmed)) {
    throw new Error(
      "Nom de fichier invalide (autorisé: lettres/chiffres/._-/, max 200 chars, pas de '..')",
    );
  }
  return trimmed;
}

export function userPrefix(userId: string): string {
  return `users/${userId}/`;
}

export function userObjectKey(userId: string, name: string): string {
  return `${userPrefix(userId)}${sanitizeObjectName(name)}`;
}

// ─── Presign (Query string SigV4) ─────────────────────────────────────────────

interface PresignOpts {
  method: "GET" | "PUT" | "DELETE";
  key: string;
  expiresInSeconds?: number; // max 7 jours
  contentType?: string;
}

export async function presignS3Url(
  cfg: SeaweedConfig,
  opts: PresignOpts,
): Promise<{ url: string; expiresAt: number }> {
  const expires = Math.min(opts.expiresInSeconds ?? 3600, 7 * 24 * 3600);
  const url = buildObjectUrl(cfg, opts.key);
  const now = new Date();
  const amzDate =
    now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z"; // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${cfg.region}/${SERVICE}/aws4_request`;

  const host = url.host;
  const signedHeaders = "host";

  const params = new URLSearchParams();
  params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
  params.set("X-Amz-Credential", `${cfg.accessKey}/${credentialScope}`);
  params.set("X-Amz-Date", amzDate);
  params.set("X-Amz-Expires", String(expires));
  params.set("X-Amz-SignedHeaders", signedHeaders);

  // Tri alpha pour canonical query
  const sortedQs = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(
      ([k, v]) =>
        `${encodeRfc3986(k, true)}=${encodeRfc3986(v, true)}`,
    )
    .join("&");

  const canonicalRequest = [
    opts.method,
    url.pathname, // déjà encodé via buildObjectUrl
    sortedQs,
    `host:${host}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const key = await signingKey(cfg.secretKey, dateStamp, cfg.region);
  const sig = toHex(await hmac(key, stringToSign));

  const finalUrl = `${url.origin}${url.pathname}?${sortedQs}&X-Amz-Signature=${sig}`;
  return { url: finalUrl, expiresAt: Date.now() + expires * 1000 };
}

// ─── Requête signée (en-têtes SigV4) — pour list/delete côté serveur ──────────

async function signedRequest(
  cfg: SeaweedConfig,
  method: "GET" | "DELETE" | "HEAD",
  url: URL,
  query: Record<string, string> = {},
): Promise<Response> {
  const now = new Date();
  const amzDate =
    now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${cfg.region}/${SERVICE}/aws4_request`;
  const payloadHash = await sha256Hex("");

  const qs = new URLSearchParams(query);
  const sortedQs = [...qs.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(
      ([k, v]) =>
        `${encodeRfc3986(k, true)}=${encodeRfc3986(v, true)}`,
    )
    .join("&");

  const canonicalHeaders =
    `host:${url.host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    method,
    url.pathname,
    sortedQs,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const key = await signingKey(cfg.secretKey, dateStamp, cfg.region);
  const sig = toHex(await hmac(key, stringToSign));

  const auth =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${sig}`;

  const finalUrl = sortedQs ? `${url.origin}${url.pathname}?${sortedQs}` : url.toString();
  return fetch(finalUrl, {
    method,
    headers: {
      Host: url.host,
      Authorization: auth,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
  });
}

// ─── Opérations de haut niveau ────────────────────────────────────────────────

export interface S3Object {
  key: string;
  size: number;
  etag: string;
  lastModified: string;
}

export async function s3List(
  cfg: SeaweedConfig,
  prefix: string,
  maxKeys = 1000,
): Promise<S3Object[]> {
  const url = buildBucketUrl(cfg);
  const res = await signedRequest(cfg, "GET", url, {
    "list-type": "2",
    prefix,
    "max-keys": String(maxKeys),
  });
  if (!res.ok) {
    throw new Error(`S3 list failed (${res.status}): ${await res.text()}`);
  }
  const xml = await res.text();
  const objects: S3Object[] = [];
  const re =
    /<Contents>\s*<Key>([^<]+)<\/Key>\s*<LastModified>([^<]+)<\/LastModified>\s*<ETag>([^<]+)<\/ETag>\s*<Size>(\d+)<\/Size>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    objects.push({
      key: m[1],
      lastModified: m[2],
      etag: m[3].replace(/&quot;|"/g, ""),
      size: Number(m[4]),
    });
  }
  return objects;
}

export async function s3Delete(cfg: SeaweedConfig, key: string): Promise<void> {
  const url = buildObjectUrl(cfg, key);
  const res = await signedRequest(cfg, "DELETE", url);
  if (!res.ok && res.status !== 404) {
    throw new Error(`S3 delete failed (${res.status}): ${await res.text()}`);
  }
}

export async function s3Head(
  cfg: SeaweedConfig,
  key: string,
): Promise<{ size: number; etag: string } | null> {
  const url = buildObjectUrl(cfg, key);
  const res = await signedRequest(cfg, "HEAD", url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`S3 head failed (${res.status})`);
  return {
    size: Number(res.headers.get("content-length") ?? 0),
    etag: (res.headers.get("etag") ?? "").replace(/"/g, ""),
  };
}

export async function presignGet(
  cfg: SeaweedConfig,
  key: string,
  expiresInSeconds = 3600,
) {
  return presignS3Url(cfg, { method: "GET", key, expiresInSeconds });
}

export async function presignPut(
  cfg: SeaweedConfig,
  key: string,
  expiresInSeconds = 7200,
) {
  return presignS3Url(cfg, { method: "PUT", key, expiresInSeconds });
}
