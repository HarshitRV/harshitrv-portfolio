import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "./site-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-5 sm:px-8">
      <SiteHeader />
      <nav aria-label="Primary" className="flex gap-6 pt-8">
        <NavigationLink to="/">Home</NavigationLink>
        <NavigationLink to="/portfolio">Portfolio</NavigationLink>
      </nav>
      <main className="py-10 sm:py-14">{children}</main>
    </div>
  );
}

function NavigationLink({ children, to }: { children: ReactNode; to: "/" | "/portfolio" }) {
  return (
    <Link
      activeOptions={{ exact: true }}
      activeProps={{
        className: "border-primary text-foreground",
      }}
      className="border-b-2 border-transparent pb-2 text-lg font-semibold text-muted-foreground transition-colors hover:text-foreground"
      to={to}
    >
      {children}
    </Link>
  );
}
