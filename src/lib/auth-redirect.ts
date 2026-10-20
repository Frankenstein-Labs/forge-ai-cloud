export function safeAuthRedirect(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/dashboard";
  const url = new URL(value, "https://aetheris.invalid");
  if (url.origin !== "https://aetheris.invalid" || url.pathname === "/auth" || url.pathname.startsWith("/auth/")) return "/dashboard";
  return url.pathname + url.search + url.hash;
}

export function googleCallbackUrl(origin: string, destination: unknown): string {
  const url = new URL("/auth", origin);
  url.searchParams.set("redirect", safeAuthRedirect(destination));
  return url.href;
}