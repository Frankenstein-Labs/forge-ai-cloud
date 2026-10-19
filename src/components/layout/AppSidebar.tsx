import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KeyRound,
  Boxes,
  Terminal,
  CreditCard,
  Settings,
  LogOut,
  HardDrive,
  Bot,
  Rocket,
  ChevronsUpDown,
  Home,
  Server,
  GitBranch,
  Globe,
  Bell,
  Shield,
  CalendarClock,
  Container,
  Network,
  FileCode2,
  Layers,
  Activity,
  FolderKanban,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Accueil", items: [
    { to: "/dashboard", label: "Accueil", icon: Home, exact: true },
    { to: "/dashboard/projects", label: "Projets", icon: FolderKanban },
    { to: "/dashboard/overview", label: "Vue d’ensemble", icon: Layers },
    { to: "/dashboard/monitoring", label: "Monitoring", icon: Activity },
    { to: "/dashboard/deployments", label: "Déploiements", icon: Rocket },
    { to: "/dashboard/schedules", label: "Tâches planifiées", icon: CalendarClock },
    { to: "/dashboard/traefik", label: "Fichiers Traefik", icon: FileCode2 },
    { to: "/dashboard/docker", label: "Docker", icon: Container },
    { to: "/dashboard/swarm", label: "Swarm", icon: Server },
    { to: "/dashboard/networks", label: "Réseaux", icon: Network },
    { to: "/dashboard/requests", label: "Requêtes", icon: Globe },
  ] },
  { label: "Intelligence artificielle", items: [
    { to: "/dashboard/workspace", label: "Workspace", icon: Terminal },
    { to: "/dashboard/marketplace", label: "Marketplace IA", icon: Bot },
    { to: "/dashboard/models", label: "Mes modèles", icon: Boxes },
    { to: "/dashboard/engines", label: "Mes Moteurs Cloud", icon: Rocket },
    { to: "/dashboard/storage", label: "Stockage", icon: HardDrive },
  ] },
  { label: "Paramètres", items: [
    { to: "/dashboard/settings", label: "Profil & connexions", icon: Settings, exact: true },
    { to: "/dashboard/settings/servers", label: "Serveurs distants", icon: Server },
    { to: "/dashboard/settings/server", label: "Serveur web", icon: Server },
    { to: "/dashboard/settings/git-providers", label: "Fournisseurs Git", icon: GitBranch },
    { to: "/dashboard/settings/registry", label: "Registres Docker", icon: Container },
    { to: "/dashboard/settings/ssh-keys", label: "Clés SSH", icon: KeyRound },
    { to: "/dashboard/settings/secrets", label: "Secrets", icon: Shield },
    { to: "/dashboard/settings/destinations", label: "Destinations S3", icon: HardDrive },
    { to: "/dashboard/settings/dns", label: "Fournisseurs DNS", icon: Globe },
    { to: "/dashboard/settings/certificates", label: "Certificats", icon: Shield },
    { to: "/dashboard/settings/notifications", label: "Notifications", icon: Bell },
    { to: "/dashboard/settings/users", label: "Utilisateurs", icon: Home },
    { to: "/dashboard/settings/sessions", label: "Sessions Dokploy", icon: Shield },
    { to: "/dashboard/settings/deployments", label: "Réglages déploiement", icon: Rocket },
    { to: "/dashboard/settings/logs-and-metrics", label: "Journaux & mesures", icon: Activity },
    { to: "/dashboard/settings/ai", label: "IA Dokploy", icon: Bot },
    { to: "/dashboard/settings/tags", label: "Étiquettes", icon: Boxes },
  ] },
  { label: "Compte", items: [
    { to: "/dashboard/api-keys", label: "Clés API Aetheris", icon: KeyRound },
    { to: "/dashboard/subscription", label: "Abonnement & Facturation", icon: CreditCard },
  ] },
  { label: "Enterprise", items: [
    { to: "/dashboard/settings/audit-logs", label: "Journal d’audit", icon: Shield },
    { to: "/dashboard/settings/sso", label: "SSO", icon: Shield },
    { to: "/dashboard/settings/whitelabeling", label: "Marque blanche", icon: Settings },
    { to: "/dashboard/settings/license", label: "Licence", icon: KeyRound },
  ] },
];

export function useActiveNavLabel() {
  const location = useLocation();
  const all = NAV_GROUPS.flatMap((g) => g.items);
  const match = all.find((i) =>
    i.exact
      ? location.pathname === i.to
      : location.pathname === i.to || location.pathname.startsWith(`${i.to}/`),
  );
  return match?.label ?? "Console";
}

export function AppSidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  const isActive = (to: string, exact?: boolean) =>
    exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  const initials = (profile?.full_name || profile?.email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const tierLabel = { free: "Free", pro: "Pro", business: "Business" }[
    profile?.subscription_tier ?? "free"
  ];

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/dashboard" className="gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground">
                  Æ
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-base font-semibold">
                    Aetheris
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    Cloud IA · {tierLabel}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.to, item.exact)}
                      tooltip={item.label}
                    >
                      <Link to={item.to} onClick={() => setOpenMobile(false)}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="bg-sidebar-accent text-sidebar-accent-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md text-xs font-semibold">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">
                      {profile?.full_name ?? "Développeur"}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">{profile?.email}</span>
                  </div>
                  {!collapsed && <ChevronsUpDown className="ms-auto size-4" />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings">
                    <Settings className="me-2 size-4" /> Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/subscription">
                    <CreditCard className="me-2 size-4" /> Abonnement
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="me-2 size-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
