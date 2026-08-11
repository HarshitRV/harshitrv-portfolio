import { createServerFn } from "@tanstack/react-start";

export const getThemePreference = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const theme = getCookie("theme");
  return theme === "light" || theme === "dark" ? theme : null;
});
