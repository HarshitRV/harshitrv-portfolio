import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAdminSession } from "@/server/auth/auth.functions";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    throw redirect({
      to: session.authenticated ? "/admin/projects" : "/admin/login",
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  },
});
