import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getAdminSession, login } from "@/server/auth/auth.functions";

const searchSchema = z.object({
  returnTo: z.string().optional(),
});

export const Route = createFileRoute("/admin/login")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (session.authenticated) {
      throw redirect({
        to: "/admin/projects",
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { returnTo } = Route.useSearch();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);

    try {
      const result = await login({
        data: {
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
          returnTo,
        },
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      window.location.assign(result.data.returnTo);
    } catch {
      setError("Sign in could not be completed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 px-5 py-12">
      <div className="flex items-center justify-between">
        <Link className="font-semibold text-primary" to="/">
          harshitRV
        </Link>
        <ThemeToggle />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Portfolio admin</CardTitle>
          <CardDescription>Sign in to manage the projects shown on your portfolio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Sign in failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  aria-invalid={Boolean(error)}
                  autoComplete="username"
                  autoFocus
                  disabled={pending}
                  id="username"
                  name="username"
                  required
                />
              </Field>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  aria-invalid={Boolean(error)}
                  autoComplete="current-password"
                  disabled={pending}
                  id="password"
                  name="password"
                  required
                  type="password"
                />
                {error && <FieldError>{error}</FieldError>}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button disabled={pending} form="login-form" type="submit">
            {pending && <Spinner data-icon="inline-start" />}
            Sign in
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
