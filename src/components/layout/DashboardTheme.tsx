import { createContext, useContext, useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({ theme: "system", setTheme: () => {} });

export function DashboardTheme({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("aetheris-dashboard-theme");
    if (saved === "light" || saved === "dark" || saved === "system") setTheme(saved);
    const media = matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(media.matches);
    const change = () => setSystemDark(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const update = (value: Theme) => {
    setTheme(value);
    localStorage.setItem("aetheris-dashboard-theme", value);
  };
  const dark = theme === "dark" || (theme === "system" && systemDark);
  return <ThemeContext.Provider value={{ theme, setTheme: update }}><div className={`dokploy-shell ${dark ? "dark" : ""}`} data-theme={dark ? "dark" : "light"}>{children}</div></ThemeContext.Provider>;
}

export function ThemePicker() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Changer le thème" title="Changer le thème"><Sun className="size-4 dark:hidden" /><Moon className="hidden size-4 dark:block" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{([
    ["light", "Clair", Sun], ["dark", "Sombre", Moon], ["system", "Système", Monitor],
  ] as const).map(([value, label, Icon]) => <DropdownMenuItem key={value} onSelect={() => setTheme(value)}><Icon className="mr-2 size-4" />{label}<span className="ml-auto">{theme === value ? "✓" : ""}</span></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
}