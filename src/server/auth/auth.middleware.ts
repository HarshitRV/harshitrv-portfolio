import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { requireAdmin } = await import("./auth.server");
  const admin = await requireAdmin();
  return next({ context: { admin } });
});
