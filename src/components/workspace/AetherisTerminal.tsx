import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

/**
 * Terminal interactif Aetheris (xterm.js).
 * - login <api-key>     : stocke la clé en mémoire + valide via /api/terminal
 * - help / whoami / models / run / upload / clear / logout / export-key
 */
export function AetherisTerminal() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily:
        '"JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      theme: {
        background: "#0a0e1a",
        foreground: "#e6f1ff",
        cursor: "#22d3ee",
        black: "#0a0e1a",
        brightBlack: "#475569",
        red: "#f43f5e",
        green: "#22d3ee",
        yellow: "#facc15",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#22d3ee",
        white: "#e6f1ff",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;

    let apiKey: string | null = null;
    let authedBadge = false;
    let buffer = "";
    let busy = false;

    // Origin absolu pour éviter les soucis de proxy preview (lovable.js)
    const ORIGIN =
      typeof window !== "undefined" ? window.location.origin : "";
    const ENDPOINT = `${ORIGIN}/api/terminal`;
    const CHAT_ENDPOINT = `${ORIGIN}/api/v1/chat/completions`;

    const PROMPT = () =>
      authedBadge
        ? "\x1b[38;5;82m●\x1b[0m \x1b[38;5;51maetheris\x1b[0m:\x1b[38;5;213m~\x1b[0m$ "
        : "\x1b[38;5;240m○\x1b[0m \x1b[38;5;51maetheris\x1b[0m:\x1b[38;5;213m~\x1b[0m$ ";

    const writeln = (s: string) => term.writeln(s);
    const prompt = () => term.write(PROMPT());

    writeln("\x1b[38;5;51m⚡ Aetheris Terminal\x1b[0m  v0.2");
    writeln(
      "Tape \x1b[38;5;213mhelp\x1b[0m pour la liste des commandes. Commence par \x1b[38;5;213mlogin <ta-clé-api>\x1b[0m.\n",
    );
    prompt();

    async function callTerminal(command: string): Promise<{
      output?: string;
      authenticated?: boolean;
    } | null> {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) headers["X-API-Key"] = apiKey;

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({ command }),
        });
        const text = await res.text();
        try {
          return JSON.parse(text) as { output?: string; authenticated?: boolean };
        } catch {
          return { output: text || `(HTTP ${res.status})` };
        }
      } catch (e) {
        writeln(
          `\x1b[38;5;203m✖ Erreur réseau : ${(e as Error).message}\x1b[0m`,
        );
        return null;
      }
    }

    async function runRemote(command: string) {
      busy = true;
      const data = await callTerminal(command);
      if (data) {
        // Met à jour l'indicateur d'auth
        if (typeof data.authenticated === "boolean") {
          authedBadge = data.authenticated;
        }
        if (data.output) {
          data.output.split("\n").forEach((line) => writeln(line));
        }
      }
      busy = false;
      prompt();
    }

    function exportKeySnippet() {
      if (!apiKey) {
        writeln(
          "\x1b[38;5;203m✖ Aucune clé chargée. Fais d'abord : login sk-aeth-...\x1b[0m",
        );
        return;
      }
      const py = [
        "# 🔑 Snippet Aetheris pour Google Colab / Python",
        "import requests",
        "",
        `AETHERIS_API_KEY = "${apiKey}"`,
        `AETHERIS_BASE_URL = "${ORIGIN}"`,
        "",
        "def chat(prompt, model='google/gemini-2.5-flash'):",
        `    r = requests.post(`,
        `        f"{AETHERIS_BASE_URL}/api/v1/chat/completions",`,
        `        headers={`,
        `            "Authorization": f"Bearer {AETHERIS_API_KEY}",`,
        `            "Content-Type": "application/json",`,
        `        },`,
        `        json={`,
        `            "model": model,`,
        `            "messages": [{"role": "user", "content": prompt}],`,
        `        },`,
        `        timeout=60,`,
        `    )`,
        `    r.raise_for_status()`,
        `    return r.json()["choices"][0]["message"]["content"]`,
        "",
        "print(chat('Bonjour Aetheris !'))",
      ];
      writeln(
        "\x1b[38;5;82m📋 Copie le snippet ci-dessous dans Google Colab :\x1b[0m\n",
      );
      py.forEach((l) => writeln(`\x1b[38;5;250m${l}\x1b[0m`));
      writeln("");
      writeln(
        `\x1b[38;5;245mEndpoint OpenAI-compatible : ${CHAT_ENDPOINT}\x1b[0m`,
      );
    }

    async function execute(cmdLine: string) {
      const trimmed = cmdLine.trim();
      if (!trimmed) {
        prompt();
        return;
      }

      // Commandes locales (n'appellent pas le serveur)
      if (trimmed === "clear") {
        term.clear();
        prompt();
        return;
      }
      if (trimmed === "export-key" || trimmed === "export") {
        exportKeySnippet();
        prompt();
        return;
      }
      if (trimmed.startsWith("login ")) {
        apiKey = trimmed.slice(6).trim();
        writeln(
          `\x1b[38;5;245m→ Vérification de la clé (${apiKey.slice(0, 12)}…)…\x1b[0m`,
        );
        const data = await callTerminal("whoami");
        if (data?.authenticated) {
          authedBadge = true;
          writeln(
            `\x1b[38;5;82m✅ Clé valide — session authentifiée.\x1b[0m`,
          );
          if (data.output) data.output.split("\n").forEach(writeln);
        } else {
          authedBadge = false;
          apiKey = null;
          writeln(
            `\x1b[38;5;203m✖ Clé refusée. Vérifie sur /dashboard/api-keys.\x1b[0m`,
          );
        }
        prompt();
        return;
      }
      if (trimmed === "logout") {
        apiKey = null;
        authedBadge = false;
        writeln("\x1b[38;5;245m👋 Clé oubliée.\x1b[0m");
        prompt();
        return;
      }

      await runRemote(trimmed);
    }

    const dataDisp = term.onData((data) => {
      if (busy) return;
      switch (data) {
        case "\r": // Enter
          term.write("\r\n");
          execute(buffer);
          buffer = "";
          break;
        case "\u007F": // Backspace
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            term.write("\b \b");
          }
          break;
        case "\u0003": // Ctrl+C
          term.write("^C\r\n");
          buffer = "";
          prompt();
          break;
        default:
          if (data >= " " || data === "\t") {
            buffer += data;
            term.write(data);
          }
      }
    });

    const onResize = () => {
      try {
        fit.fit();
      } catch {
        /* noop */
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      dataDisp.dispose();
      term.dispose();
      termRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[560px] w-full rounded-2xl border border-border bg-[#0a0e1a] p-3 shadow-glow-cyan"
    />
  );
}
