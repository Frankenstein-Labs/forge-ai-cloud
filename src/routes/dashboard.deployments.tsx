import { createFileRoute } from "@tanstack/react-router";
import { DokployScreen } from "@/components/dashboard/DokployScreen";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/deployments")({
  head: () => pageMeta("Déploiements — Aetheris Cloud", "Gérez déploiements de votre instance Dokploy depuis Aetheris."),
  component: Screen,
});
function Screen() { return <DokployScreen screen="deployments" />; }
