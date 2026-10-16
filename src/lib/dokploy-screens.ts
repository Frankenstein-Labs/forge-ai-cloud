import {
  Activity,
  Box,
  CalendarClock,
  Container,
  FileCode2,
  FolderKanban,
  Globe,
  Layers,
  Network,
  Settings,
  Shield,
  Server,
} from "lucide-react";

export const DOKPLOY_REVISION = "53464e9096a0976e8e4a8f3a1908bc1054e45a37";
export const infrastructureScreens = [
  { id: "projects", label: "Projets", icon: FolderKanban },
  { id: "overview", label: "Vue d’ensemble", icon: Layers },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "deployments", label: "Déploiements", icon: Box },
  { id: "schedules", label: "Tâches planifiées", icon: CalendarClock },
  { id: "traefik", label: "Fichiers Traefik", icon: FileCode2 },
  { id: "docker", label: "Docker", icon: Container },
  { id: "swarm", label: "Swarm", icon: Server },
  { id: "networks", label: "Réseaux", icon: Network },
  { id: "requests", label: "Requêtes", icon: Globe },
] as const;
export const settingsScreens = [
  ["server", "Serveur web"],
  ["servers", "Serveurs distants"],
  ["deployments", "Déploiements"],
  ["users", "Utilisateurs"],
  ["ssh-keys", "Clés SSH"],
  ["ai", "Intelligence artificielle"],
  ["tags", "Étiquettes"],
  ["git-providers", "Fournisseurs Git"],
  ["registry", "Registres Docker"],
  ["logs-and-metrics", "Journaux et mesures"],
  ["secrets", "Secrets"],
  ["dns", "Fournisseurs DNS"],
  ["destinations", "Destinations S3"],
  ["certificates", "Certificats"],
  ["notifications", "Notifications"],
  ["sessions", "Sessions Dokploy"],
] as const;
export const licensedScreens = [
  ["audit-logs", "Journal d’audit"],
  ["sso", "Authentification SSO"],
  ["whitelabeling", "Marque blanche"],
  ["license", "Licence Enterprise"],
] as const;
export function findScreen(id: string) {
  const main = infrastructureScreens.find((s) => s.id === id);
  if (main)
    return { label: main.label, icon: main.icon, path: `/dashboard/${id}`, licensed: false };
  const setting = settingsScreens.find(([key]) => `settings/${key}` === id);
  if (setting)
    return { label: setting[1], icon: Settings, path: `/dashboard/${id}`, licensed: false };
  const licensed = licensedScreens.find(([key]) => `settings/${key}` === id);
  if (licensed)
    return { label: licensed[1], icon: Shield, path: `/dashboard/${id}`, licensed: true };
  return null;
}
