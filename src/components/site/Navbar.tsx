import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Plateforme", href: "#platform" },
  { label: "Modèles", href: "#models" },
  { label: "Partenaires", href: "#partners" },
  { label: "Tarifs", href: "#pricing" },
  { label: "Docs", href: "#docs" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="container mx-auto px-6">
        <div
          className={`flex items-center justify-between rounded-2xl transition-all duration-300 ${
            scrolled ? "glass px-5 py-3" : "px-2 py-2"
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9">
              <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 rounded-xl shadow-glow-cyan opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full w-full rounded-xl flex items-center justify-center font-display text-background font-bold text-lg">
                Æ
              </div>
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">
              Aetheris<span className="text-primary">.</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-surface-elevated/40"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Connexion
            </a>
            <a
              href="#signup"
              className="relative group rounded-xl px-5 py-2.5 text-sm font-medium text-primary-foreground bg-gradient-primary shadow-glow-cyan hover:shadow-glow-plasma transition-all"
            >
              Démarrer gratuitement
            </a>
          </div>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden mt-3 glass rounded-2xl p-5 space-y-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50 rounded-xl transition"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-2 mt-2 border-t border-border space-y-2">
              <a
                href="#login"
                className="block px-4 py-3 text-sm text-center text-foreground rounded-xl hover:bg-surface-elevated/50"
              >
                Connexion
              </a>
              <a
                href="#signup"
                className="block px-4 py-3 text-sm text-center text-primary-foreground bg-gradient-primary rounded-xl font-medium"
              >
                Démarrer gratuitement
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
