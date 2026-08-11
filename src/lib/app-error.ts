export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "PROJECT_NOT_FOUND"
  | "REVISION_CONFLICT"
  | "PERSISTENCE_ERROR"
  | "THROTTLED";

export type AppError = {
  code: AppErrorCode;
  message: string;
  requestId: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: AppError;
    };
