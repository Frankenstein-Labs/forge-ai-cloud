import { createFileRoute } from "@tanstack/react-router";
import { DokployScreen } from "@/components/dashboard/DokployScreen";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/settings/logs-and-metrics")({
  head: () => pageMeta("Journaux et mesures — Aetheris Cloud", "Journaux et mesures de votre instance Dokploy depuis Aetheris."),
  component: Screen,
});
function Screen() { return <DokployScreen screen="settings/logs-and-metrics" />; }
