import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import type { AppError } from "@/lib/app-error";
import { AuthenticationError } from "./auth/auth.server";
import { ProjectRepositoryError } from "./projects/project-repository";

export function toAppError(error: unknown): AppError {
  const requestId = randomUUID();

  if (error instanceof ZodError) {
    const flattened = error.flatten();
    return {
      code: "VALIDATION_ERROR",
      message: "Check the highlighted fields and try again.",
      requestId,
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      code:
        error.code === "THROTTLED"
          ? "THROTTLED"
          : error.code === "UNAUTHENTICATED"
            ? "UNAUTHENTICATED"
            : "UNAUTHENTICATED",
      message: error.message,
      requestId,
    };
  }

  if (error instanceof ProjectRepositoryError) {
    const code = {
      NOT_FOUND: "PROJECT_NOT_FOUND",
      REVISION_CONFLICT: "REVISION_CONFLICT",
      INVALID_ORDER: "VALIDATION_ERROR",
      PERSISTENCE_ERROR: "PERSISTENCE_ERROR",
    } as const;
    return {
      code: code[error.code],
      message:
        error.code === "PERSISTENCE_ERROR"
          ? "Project data could not be saved. Try again."
          : error.message,
      requestId,
    };
  }

  console.error("Unexpected server error", { requestId, error });
  return {
    code: "PERSISTENCE_ERROR",
    message: "An unexpected server error occurred.",
    requestId,
  };
}
