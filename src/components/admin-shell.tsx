import { LogOutIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { logout } from "@/server/auth/auth.functions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

export function AdminShell({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await logout();
      window.location.assign("/admin/login");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-5 sm:px-8">
      <header className="flex items-center justify-between gap-4 border-b py-5">
        <div className="flex items-center gap-4">
          <Link className="font-semibold text-primary" to="/admin/projects">
            Portfolio admin
          </Link>
          <Link className="text-sm text-muted-foreground hover:text-foreground" to="/">
            View site
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button disabled={pending} size="sm" type="button" variant="ghost" onClick={handleLogout}>
            <LogOutIcon data-icon="inline-start" />
            Log out
          </Button>
        </div>
      </header>
      <main className="py-8">{children}</main>
    </div>
  );
}
