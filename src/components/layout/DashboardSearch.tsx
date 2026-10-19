import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NAV_GROUPS } from "./AppSidebar";

export function DashboardSearch() {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  const items = NAV_GROUPS.flatMap((g) => g.items).filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  return <><Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Rechercher une page"><Search /><span className="hidden sm:inline">Rechercher…</span></Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Rechercher</DialogTitle><DialogDescription>Pages Aetheris</DialogDescription></DialogHeader><Input autoFocus placeholder="Nom de la page…" value={query} onChange={(e) => setQuery(e.target.value)} /><div className="max-h-80 overflow-auto">{items.map((item) => <Button key={item.to} asChild variant="ghost" className="w-full justify-start"><Link to={item.to} onClick={() => setOpen(false)}><item.icon className="size-4" />{item.label}</Link></Button>)}{!items.length && <p className="p-4 text-sm text-muted-foreground">Aucune page correspondante.</p>}</div></DialogContent></Dialog></>;
}