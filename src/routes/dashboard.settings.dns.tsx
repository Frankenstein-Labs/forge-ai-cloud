import { createFileRoute } from "@tanstack/react-router";
import { DokployScreen } from "@/components/dashboard/DokployScreen";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/settings/dns")({
  head: () => pageMeta("Fournisseurs DNS — Aetheris Cloud", "Fournisseurs DNS de votre instance Dokploy depuis Aetheris."),
  component: Screen,
});
function Screen() { return <DokployScreen screen="settings/dns" />; }
