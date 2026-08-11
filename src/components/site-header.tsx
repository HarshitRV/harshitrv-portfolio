import { AtSignIcon, BriefcaseIcon, CodeIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";

const socialLinks = [
  {
    href: "https://github.com/harshitrv",
    label: "GitHub",
    icon: CodeIcon,
  },
  {
    href: "https://twitter.com/hrv_vishwakarma",
    label: "X / Twitter",
    icon: AtSignIcon,
  },
  {
    href: "https://www.linkedin.com/in/harshitrv",
    label: "LinkedIn",
    icon: BriefcaseIcon,
  },
];

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-6 border-b py-5">
      <Link className="text-lg font-semibold tracking-tight text-primary" to="/">
        harshitRV
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        {socialLinks.map(({ href, label, icon: Icon }) => (
          <a
            aria-label={label}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            href={href}
            key={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon className="size-4" aria-hidden="true" />
          </a>
        ))}
      </div>
    </header>
  );
}
