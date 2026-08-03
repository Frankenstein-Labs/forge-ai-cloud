import { Link } from "@tanstack/react-router";

const cols = [
  {
    title: "Plateforme",
    links: ["Hub de modèles", "Workspace", "Pipelines", "API"],
  },
  {
    title: "Ressources",
    links: ["Documentation", "CLI", "Status", "Changelog"],
  },
  {
    title: "Entreprise",
    links: ["Partenaires", "Tarifs", "Sécurité", "Contact"],
  },
  {
    title: "Légal",
    links: ["CGU", "Confidentialité", "DPA", "Cookies"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center font-display text-background font-bold text-lg">
                Æ
              </div>
              <span className="font-display text-xl font-semibold">
                Aetheris<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="mt-5 text-sm text-muted-foreground max-w-xs leading-relaxed">
              Le cloud unifié pour déployer, orchestrer et facturer l'IA open source. Construit en
              Europe.
            </p>
            <p className="mt-6 font-mono text-xs text-muted-foreground">
              © 2025 Aetheris Cloud · Made with ⚡ in Paris
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="font-display font-semibold text-sm mb-4">{c.title}</h4>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
