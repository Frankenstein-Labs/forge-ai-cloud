import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

/**
 * Terminal interactif Aetheris (xterm.js).
 * - login <api-key>     : stocke la clé en mémoire + valide via /api/terminal
 * - help / whoami / models / run / upload / clear / logout / export-key
 * Fonctions UI : historique (↑/↓), édition de ligne, autoscroll, Ctrl+C / Ctrl+L,
 * gestion d'erreurs réseau détaillée.
 */
export function AetherisTerminal() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      scrollback: 5000,
      convertEol: true,
      fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      theme: (() => {
        const css = getComputedStyle(containerRef.current);
        const color = (name: string) => css.getPropertyValue(`--terminal-${name}`).trim();
        return {
          background: color("background"),
          foreground: color("foreground"),
          cursor: color("foreground"),
          black: color("background"),
          brightBlack: color("muted"),
          red: color("red"),
          green: color("green"),
          yellow: color("yellow"),
          blue: color("blue"),
          magenta: color("magenta"),
          cyan: color("cyan"),
          white: color("foreground"),
        };
      })(),
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;

    let apiKey: string | null = null;
    let authedBadge = false;
    let buffer = "";
    let cursor = 0;
    let busy = false;
    const history: string[] = [];
    let histIndex = -1;

    const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
    const ENDPOINT = `${ORIGIN}/api/terminal`;
    const CHAT_ENDPOINT = `${ORIGIN}/api/v1/chat/completions`;

    const PROMPT = () =>
      authedBadge
        ? "\x1b[38;5;82m●\x1b[0m \x1b[38;5;51maetheris\x1b[0m:\x1b[38;5;213m~\x1b[0m$ "
        : "\x1b[38;5;240m○\x1b[0m \x1b[38;5;51maetheris\x1b[0m:\x1b[38;5;213m~\x1b[0m$ ";

    const writeln = (s: string) => {
      term.writeln(s);
      term.scrollToBottom();
    };
    const prompt = () => {
      term.write(PROMPT());
      term.scrollToBottom();
    };

    /** Réaffiche la ligne courante (après historique / édition). */
    const redraw = () => {
      term.write("\x1b[2K\r");
      term.write(PROMPT() + buffer);
      const back = buffer.length - cursor;
      if (back > 0) term.write(`\x1b[${back}D`);
    };

    writeln("\x1b[38;5;51m⚡ Aetheris Terminal\x1b[0m  v0.3");
    writeln(
      "Tape \x1b[38;5;213mhelp\x1b[0m pour la liste des commandes. Commence par \x1b[38;5;213mlogin <ta-clé-api>\x1b[0m.",
    );
    writeln(
      "\x1b[38;5;245mAstuce : ↑/↓ pour l'historique, Ctrl+L pour nettoyer, Ctrl+C pour annuler.\x1b[0m\n",
    );
    prompt();

    async function callTerminal(command: string): Promise<{
      output?: string;
      authenticated?: boolean;
    } | null> {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
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
          if (!res.ok) {
            writeln(`\x1b[38;5;203m✖ HTTP ${res.status} — ${res.statusText || "erreur"}\x1b[0m`);
            if (text) writeln(`\x1b[38;5;245m${text.slice(0, 400)}\x1b[0m`);
            return null;
          }
          return { output: text };
        }
      } catch (e) {
        writeln(`\x1b[38;5;203m✖ Erreur réseau : ${(e as Error).message}\x1b[0m`);
        writeln("\x1b[38;5;245m  Vérifie ta connexion puis réessaie.\x1b[0m");
        return null;
      }
    }

    async function runRemote(command: string) {
      busy = true;
      term.write("\x1b[38;5;245m… exécution\x1b[0m\r");
      const data = await callTerminal(command);
      term.write("\x1b[2K\r");
      if (data) {
        if (typeof data.authenticated === "boolean") authedBadge = data.authenticated;
        if (data.output) data.output.split("\n").forEach((line) => writeln(line));
      }
      busy = false;
      prompt();
    }

    function exportKeySnippet() {
      if (!apiKey) {
        writeln("\x1b[38;5;203m✖ Aucune clé chargée. Fais d'abord : login sk-aeth-...\x1b[0m");
        return;
      }
      const py = [
        "# 🔑 Snippet Aetheris pour Google Colab / Python",
        "# Documentation complète : " + ORIGIN + "/docs",
        "import requests",
        "",
        `AETHERIS_API_KEY = "${apiKey}"`,
        `AETHERIS_BASE_URL = "${ORIGIN}"`,
        "",
        "def chat(prompt, model='google/gemini-2.5-flash'):",
        '    """model peut être : google/gemini-2.5-flash, openai/gpt-5-mini,',
        '       ou hf/<owner>/<repo> pour n\'importe quel modèle HuggingFace."""',
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
        `        timeout=120,`,
        `    )`,
        `    r.raise_for_status()`,
        `    return r.json()["choices"][0]["message"]["content"]`,
        "",
        "# Exemples :",
        "print(chat('Bonjour Aetheris !'))",
        "print(chat('Salut', model='hf/mistralai/Mistral-7B-Instruct-v0.3'))",
      ];
      writeln("\x1b[38;5;82m📋 Copie le snippet ci-dessous dans Google Colab :\x1b[0m\n");
      py.forEach((l) => writeln(`\x1b[38;5;250m${l}\x1b[0m`));
      writeln("");
      writeln(`\x1b[38;5;245mEndpoint OpenAI-compatible : ${CHAT_ENDPOINT}\x1b[0m`);
      writeln(`\x1b[38;5;245mDocumentation : ${ORIGIN}/docs\x1b[0m`);
      return py.join("\n");
    }

    async function openColab() {
      const code = exportKeySnippet();
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        writeln("\x1b[38;5;82m✅ Code copié dans le presse-papiers.\x1b[0m");
      } catch {
        writeln("\x1b[38;5;214m⚠ Copie automatique impossible — copie le code ci-dessus.\x1b[0m");
      }
      window.open("https://colab.research.google.com/#create=true", "_blank", "noopener");
      writeln(
        "\x1b[38;5;82m🚀 Colab ouvert : colle le code (Ctrl+V) dans une cellule puis Shift+Entrée.\x1b[0m",
      );
    }

    async function execute(cmdLine: string) {
      const trimmed = cmdLine.trim();
      if (!trimmed) {
        prompt();
        return;
      }
      if (history[history.length - 1] !== trimmed) history.push(trimmed);
      histIndex = -1;

      if (trimmed === "clear") {
        term.clear();
        prompt();
        return;
      }
      if (trimmed === "history") {
        history.forEach((h, i) =>
          writeln(`\x1b[38;5;245m${String(i + 1).padStart(3)}\x1b[0m  ${h}`),
        );
        prompt();
        return;
      }
      if (trimmed === "colab") {
        await openColab();
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
        writeln(`\x1b[38;5;245m→ Vérification de la clé (${apiKey.slice(0, 12)}…)…\x1b[0m`);
        const data = await callTerminal("whoami");
        if (data?.authenticated) {
          authedBadge = true;
          writeln(`\x1b[38;5;82m✅ Clé valide — session authentifiée.\x1b[0m`);
          if (data.output) data.output.split("\n").forEach(writeln);
        } else {
          authedBadge = false;
          apiKey = null;
          writeln(`\x1b[38;5;203m✖ Clé refusée. Vérifie sur /dashboard/api-keys.\x1b[0m`);
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
          cursor = 0;
          break;
        case "\u007F": // Backspace
          if (cursor > 0) {
            buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
            cursor--;
            redraw();
          }
          break;
        case "\u0003": // Ctrl+C
          term.write("^C\r\n");
          buffer = "";
          cursor = 0;
          prompt();
          break;
        case "\u000c": // Ctrl+L
          term.clear();
          redraw();
          break;
        case "\u001b[A": // ↑
          if (history.length) {
            histIndex = histIndex < 0 ? history.length - 1 : Math.max(0, histIndex - 1);
            buffer = history[histIndex] ?? "";
            cursor = buffer.length;
            redraw();
          }
          break;
        case "\u001b[B": // ↓
          if (histIndex >= 0) {
            histIndex++;
            if (histIndex >= history.length) {
              histIndex = -1;
              buffer = "";
            } else {
              buffer = history[histIndex] ?? "";
            }
            cursor = buffer.length;
            redraw();
          }
          break;
        case "\u001b[D": // ←
          if (cursor > 0) {
            cursor--;
            term.write("\x1b[D");
          }
          break;
        case "\u001b[C": // →
          if (cursor < buffer.length) {
            cursor++;
            term.write("\x1b[C");
          }
          break;
        default:
          if (data >= " " || data === "\t") {
            buffer = buffer.slice(0, cursor) + data + buffer.slice(cursor);
            cursor += data.length;
            redraw();
            term.scrollToBottom();
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
    const ro = new ResizeObserver(onResize);
    ro.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      dataDisp.dispose();
      term.dispose();
      termRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-[560px] w-full bg-terminal-background p-3" />;
}
