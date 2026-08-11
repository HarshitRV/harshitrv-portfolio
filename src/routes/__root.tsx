import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getThemePreference } from "@/server/theme.functions";
import appCss from "../index.css?url";

export const Route = createRootRoute({
  loader: () => getThemePreference(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Harshit Kr Vishwakarma" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/android-chrome-512x512.svg",
      },
    ],
  }),
  component: RootDocument,
  errorComponent: ({ error }) => (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
      <meta content="noindex, nofollow" name="robots" />
      <p className="text-sm font-medium text-destructive">Something went wrong</p>
      <h1 className="text-3xl font-semibold tracking-tight">The page could not be loaded.</h1>
      <p className="text-muted-foreground">
        {import.meta.env.DEV ? error.message : "Please try again in a moment."}
      </p>
      <Link className="text-primary underline underline-offset-4" to="/">
        Return home
      </Link>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
      <meta content="noindex, nofollow" name="robots" />
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <Link className="text-primary underline underline-offset-4" to="/">
        Return home
      </Link>
    </main>
  ),
});

function RootDocument() {
  const theme = Route.useLoaderData();

  return (
    <html className={theme ?? undefined} lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script src="/theme-init.js" />
        {import.meta.env.PROD && (
          <>
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-5VMYV7QF4M" />
            <script src="/analytics-init.js" />
            <script
              async
              crossOrigin="anonymous"
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8403238281513435"
            />
          </>
        )}
      </head>
      <body>
        <TooltipProvider>
          <Outlet />
          <Toaster />
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  );
}
