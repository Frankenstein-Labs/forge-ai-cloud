import { createFileRoute } from "@tanstack/react-router";
import { DokployProjects } from "@/components/dashboard/DokployProjects";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/dashboard/projects/")({ head: () => pageMeta("Projets — Aetheris Cloud", "Vos projets et environnements Dokploy."), component: DokployProjects });
