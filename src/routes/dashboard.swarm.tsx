import { createFileRoute } from "@tanstack/react-router";
import { DokployScreen } from "@/components/dashboard/DokployScreen";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/swarm")({
  head: () => pageMeta("Swarm — Aetheris Cloud", "Gérez swarm de votre instance Dokploy depuis Aetheris."),
  component: Screen,
});
function Screen() { return <DokployScreen screen="swarm" />; }
