import { z } from "zod";

export const connectionInput = z.object({
  endpoint: z.string().url().transform((value, context) => {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "") || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host.includes(":") || /^\d+(\.\d+){3}$/.test(host) || !host.includes(".")) {
      context.addIssue({ code: "custom", message: "Utilisez un domaine public HTTPS, sans chemin, port ou identifiants." });
      return z.NEVER;
    }
    return url.origin;
  }),
  apiKey: z.string().trim().min(10).max(4096),
});
export const projectInput = z.object({ name: z.string().trim().min(1).max(100), description: z.string().max(1000).default("") });