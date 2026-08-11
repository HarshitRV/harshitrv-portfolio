import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { getAdminSession } from "@/server/auth/auth.functions";

export const Route = createFileRoute("/admin/projects")({
  beforeLoad: async ({ location }) => {
    const session = await getAdminSession();
    if (!session.authenticated) {
      throw redirect({
        to: "/admin/login",
        search: { returnTo: location.pathname },
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
  },
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
