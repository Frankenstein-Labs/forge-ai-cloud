/** Server-only environment helpers. Do not import this module from client components. */

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function requireServerEnv(name: string): string {
  const value = read(name);
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
}

export function configured(name: string): boolean {
  return Boolean(read(name));
}

export function allowedOrigins(): string[] {
  return (read("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => {
      try {
        return new URL(origin).origin === origin;
      } catch {
        return false;
      }
    });
}

export function providerConfiguration() {
  return {
    huggingface: configured("HF_TOKEN"),
    lovable: configured("LOVABLE_API_KEY"),
    together: configured("TOGETHER_API_KEY"),
    replicate: configured("REPLICATE_API_TOKEN"),
    openrouter: configured("OPENROUTER_API_KEY"),
  } as const;
}
