import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

const bootstrapMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, pathname }) => {
    const [{ validateAuthEnvironment }, { getProjectRepository }, { setResponseHeader }] =
      await Promise.all([
        import("@/server/auth/auth.server"),
        import("@/server/projects/project-repository"),
        import("@tanstack/react-start/server"),
      ]);
    validateAuthEnvironment();
    await getProjectRepository();
    setResponseHeader("X-Content-Type-Options", "nosniff");
    setResponseHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    setResponseHeader("X-Frame-Options", "DENY");
    setResponseHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (pathname.startsWith("/admin")) {
      setResponseHeader("Cache-Control", "no-store");
      setResponseHeader("X-Robots-Tag", "noindex, nofollow");
    }
    return next();
  },
);

const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType, request }) => handlerType === "serverFn" && request.method !== "GET",
  origin: (origin) => {
    if (import.meta.env.DEV) {
      return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    }

    return origin === process.env.APP_ORIGIN;
  },
  secFetchSite: "same-origin",
  referer: true,
  allowRequestsWithoutOriginCheck: false,
});

export const startInstance = createStart(() => ({
  requestMiddleware: [bootstrapMiddleware, csrfMiddleware],
}));
