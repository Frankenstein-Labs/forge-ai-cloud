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
  {
    label: "Général",
    items: [
      { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
      { to: "/dashboard/workspace", label: "Workspace", icon: Terminal },
    ],
  },
  {
    label: "Plateforme",
    items: [
      { to: "/dashboard/marketplace", label: "Marketplace IA", icon: Bot },
      { to: "/dashboard/engines", label: "Mes Moteurs Cloud", icon: Rocket },
      { to: "/dashboard/models", label: "Mes modèles", icon: Boxes },
      { to: "/dashboard/storage", label: "Stockage", icon: HardDrive },
    ],
  },
  {
    label: "Compte",
    items: [
      { to: "/dashboard/subscription", label: "Abonnement & Facturation", icon: CreditCard },
      { to: "/dashboard/api-keys", label: "Clés API", icon: KeyRound },
      { to: "/dashboard/settings", label: "Paramètres", icon: Settings },
    ],
  },
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
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/dashboard" className="gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-primary font-display text-lg font-bold text-primary-foreground">
                  Æ
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-display truncate text-base font-semibold italic">
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
                  <div className="bg-sidebar-accent text-sidebar-accent-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold">
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
                  {!collapsed && <ChevronsUpDown className="ml-auto size-4" />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings">
                    <Settings className="mr-2 size-4" /> Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/subscription">
                    <CreditCard className="mr-2 size-4" /> Abonnement
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 size-4" /> Déconnexion
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
