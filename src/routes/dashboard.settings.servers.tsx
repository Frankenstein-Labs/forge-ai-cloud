import { createFileRoute } from "@tanstack/react-router";
import { DokployScreen } from "@/components/dashboard/DokployScreen";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/settings/servers")({
  head: () => pageMeta("Serveurs distants — Aetheris Cloud", "Serveurs distants de votre instance Dokploy depuis Aetheris."),
  component: Screen,
});
function Screen() { return <DokployScreen screen="settings/servers" />; }
