import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ActionResult } from "@/lib/app-error";
import { authMiddleware } from "./auth.middleware";

const loginRequestSchema = z.strictObject({
  username: z.string().trim().min(1).max(128),
  password: z.string().min(1).max(256),
  returnTo: z
    .string()
    .refine(
      (value) => value.startsWith("/admin") && !value.startsWith("//"),
      "Return path must be an admin route",
    )
    .optional(),
});

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdmin } = await import("./auth.server");
  const admin = await getAdmin();
  return admin
    ? { authenticated: true as const, username: admin.username }
    : { authenticated: false as const };
});

export const login = createServerFn({ method: "POST" })
  .validator(loginRequestSchema)
  .handler(async ({ data }): Promise<ActionResult<{ returnTo: string }>> => {
    try {
      const { loginAdmin } = await import("./auth.server");
      await loginAdmin(data);
      return {
        ok: true,
        data: { returnTo: data.returnTo ?? "/admin/projects" },
      };
    } catch (error) {
      const { toAppError } = await import("../errors.server");
      return { ok: false, error: toAppError(error) };
    }
  });

export const logout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { logoutAdmin } = await import("./auth.server");
    await logoutAdmin();
    return { ok: true as const };
  });
