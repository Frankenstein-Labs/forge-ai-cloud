import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

/**
 * Terminal interactif Aetheris (xterm.js).
 * - login <api-key>  : stocke la clé en mémoire (envoyée à chaque requête)
 * - help / whoami / models / run / upload / clear : géré côté /api/terminal
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
    let buffer = "";
    let busy = false;

    const PROMPT = "\x1b[38;5;51maetheris\x1b[0m:\x1b[38;5;213m~\x1b[0m$ ";

    const writeln = (s: string) => term.writeln(s);
    const prompt = () => term.write(PROMPT);

    writeln("\x1b[38;5;51m⚡ Aetheris Terminal\x1b[0m  v0.1");
    writeln(
      "Tape \x1b[38;5;213mhelp\x1b[0m pour la liste des commandes. Commence par \x1b[38;5;213mlogin <ta-clé-api>\x1b[0m.\n",
    );
    prompt();

    async function runRemote(command: string) {
      busy = true;
      try {
        const res = await fetch("/api/terminal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({ command }),
        });
        const data = (await res.json()) as { output?: string };
        if (data.output) {
          data.output.split("\n").forEach((line) => writeln(line));
        }
      } catch (e) {
        writeln(`\x1b[38;5;203mErreur réseau : ${(e as Error).message}\x1b[0m`);
      } finally {
        busy = false;
        prompt();
      }
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
      if (trimmed.startsWith("login ")) {
        apiKey = trimmed.slice(6).trim();
        writeln(
          `\x1b[38;5;82m✅ Clé API enregistrée localement (${apiKey.slice(0, 8)}…)\x1b[0m`,
        );
        await runRemote("whoami");
        return;
      }
      if (trimmed === "logout") {
        apiKey = null;
        writeln("👋 Clé oubliée.");
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
