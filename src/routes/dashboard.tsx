import { createFileRoute } from "@tanstack/react-router";
import { DashLayout } from "@/components/dashboard/DashLayout";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EGRATASKS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashLayout,
});