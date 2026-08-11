import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import {
  getRequestIP,
  setResponseHeader,
  setResponseStatus,
  useSession as getRequestSession,
  type SessionConfig,
} from "@tanstack/react-start/server";
import { z } from "zod";

const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const SCRYPT_KEY_LENGTH = 32;
const SCRYPT_OPTIONS = {
  N: 2 ** 17,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
} as const;

const runtimeEnvironmentSchema = z.strictObject({
  ADMIN_USERNAME: z.string().trim().min(1).max(128),
  ADMIN_PASSWORD_HASH: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  APP_ORIGIN: z.url(),
  TRUST_PROXY: z.enum(["true", "false"]).optional(),
});

const loginInputSchema = z.strictObject({
  username: z.string().trim().min(1).max(128),
  password: z.string().min(1).max(256),
});

const sessionDataSchema = z.strictObject({
  version: z.literal(1),
  role: z.literal("admin"),
  username: z.string(),
  issuedAt: z.number().int(),
  expiresAt: z.number().int(),
});

type SessionData = z.infer<typeof sessionDataSchema>;
type LoginInput = z.infer<typeof loginInputSchema>;

type LoginAttempt = {
  failures: number;
  blockedUntil: number;
  expiresAt: number;
};

const loginAttempts = new Map<string, LoginAttempt>();
const DUMMY_HASH = `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${Buffer.alloc(16).toString("base64url")}$${Buffer.alloc(SCRYPT_KEY_LENGTH).toString("base64url")}`;
let cachedEnvironment: z.infer<typeof runtimeEnvironmentSchema> | undefined;

export class AuthenticationError extends Error {
  constructor(
    readonly code: "UNAUTHENTICATED" | "THROTTLED" | "INVALID_CREDENTIALS",
    message: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function parseLoginInput(input: unknown) {
  return loginInputSchema.parse(input);
}

export function validateAuthEnvironment() {
  return getRuntimeEnvironment();
}

export async function loginAdmin(input: LoginInput) {
  setPrivateResponseHeaders();
  const environment = getRuntimeEnvironment();
  const normalizedUsername = input.username.trim();
  const attemptKey = getAttemptKey(normalizedUsername);
  enforceLoginLimit(attemptKey);

  const usernameMatches = normalizedUsername === environment.ADMIN_USERNAME;
  const passwordMatches = await verifyPassword(
    input.password,
    usernameMatches ? environment.ADMIN_PASSWORD_HASH : DUMMY_HASH,
  );

  if (!usernameMatches || !passwordMatches) {
    recordLoginFailure(attemptKey);
    await fixedFailureDelay();
    throw new AuthenticationError("INVALID_CREDENTIALS", "Invalid username or password");
  }

  loginAttempts.delete(attemptKey);
  const now = Date.now();
  const data: SessionData = {
    version: 1,
    role: "admin",
    username: environment.ADMIN_USERNAME,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const session = await getRequestSession<SessionData>(getSessionConfig());
  await session.update(data);
  return data;
}

export async function logoutAdmin() {
  setPrivateResponseHeaders();
  const session = await getRequestSession<SessionData>(getSessionConfig());
  await session.clear();
}

export async function getAdmin() {
  setPrivateResponseHeaders();
  const session = await getRequestSession<SessionData>(getSessionConfig());
  const parsed = sessionDataSchema.safeParse(session.data);

  if (!parsed.success || parsed.data.expiresAt <= Date.now()) {
    if (session.id) {
      await session.clear();
    }
    return null;
  }

  return parsed.data;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) {
    setResponseStatus(401);
    throw new AuthenticationError("UNAUTHENTICATED", "Administrator authentication is required");
  }
  return admin;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const parsed = parsePasswordHash(encodedHash);
  const derivedKey = await deriveScryptKey(password, parsed.salt, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
  });
  return timingSafeEqual(derivedKey, parsed.hash);
}

export async function createPasswordHash(password: string) {
  if (password.length < 12 || password.length > 256) {
    throw new Error("Password must contain between 12 and 256 characters");
  }

  const salt = randomBytes(16);
  const hash = await deriveScryptKey(password, salt, SCRYPT_OPTIONS);
  return [
    "scrypt",
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

function getSessionConfig(): SessionConfig {
  const environment = getRuntimeEnvironment();
  const production = process.env.NODE_ENV === "production";
  return {
    name: production ? "__Host-harshitrv-admin" : "harshitrv-admin-dev",
    password: environment.SESSION_SECRET,
    maxAge: SESSION_MAX_AGE_SECONDS,
    cookie: {
      httpOnly: true,
      secure: production,
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  };
}

function getRuntimeEnvironment() {
  if (cachedEnvironment) return cachedEnvironment;

  const developmentDefaults =
    process.env.NODE_ENV === "production"
      ? {}
      : {
          ADMIN_USERNAME: "admin",
          ADMIN_PASSWORD_HASH: DUMMY_HASH,
          SESSION_SECRET: "development-only-session-secret-change-before-production",
          APP_ORIGIN: "http://localhost:3000",
        };

  const environment = runtimeEnvironmentSchema.parse({
    ...developmentDefaults,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? developmentDefaults.ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ?? developmentDefaults.ADMIN_PASSWORD_HASH,
    SESSION_SECRET: process.env.SESSION_SECRET ?? developmentDefaults.SESSION_SECRET,
    APP_ORIGIN: process.env.APP_ORIGIN ?? developmentDefaults.APP_ORIGIN,
    TRUST_PROXY: process.env.TRUST_PROXY,
  });

  if (
    process.env.NODE_ENV === "production" &&
    new URL(environment.APP_ORIGIN).protocol !== "https:"
  ) {
    throw new Error("APP_ORIGIN must use HTTPS in production");
  }

  cachedEnvironment = environment;
  return environment;
}

function parsePasswordHash(encodedHash: string) {
  const [algorithm, NValue, rValue, pValue, saltValue, hashValue, ...rest] = encodedHash.split("$");
  const N = Number(NValue);
  const r = Number(rValue);
  const p = Number(pValue);
  const salt = Buffer.from(saltValue ?? "", "base64url");
  const hash = Buffer.from(hashValue ?? "", "base64url");

  if (
    algorithm !== "scrypt" ||
    rest.length > 0 ||
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    N < 2 ** 14 ||
    r < 1 ||
    p < 1 ||
    salt.length < 16 ||
    hash.length !== SCRYPT_KEY_LENGTH
  ) {
    throw new Error("ADMIN_PASSWORD_HASH has an invalid format");
  }

  return { N, r, p, salt, hash };
}

function deriveScryptKey(
  password: string,
  salt: Buffer,
  options: { N: number; r: number; p: number },
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      {
        ...options,
        maxmem: SCRYPT_OPTIONS.maxmem,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
        } else {
          resolve(derivedKey);
        }
      },
    );
  });
}

function getAttemptKey(username: string) {
  const trustProxy = getRuntimeEnvironment().TRUST_PROXY === "true";
  const clientAddress = getRequestIP({ xForwardedFor: trustProxy }) ?? "unknown";
  return `${username.toLocaleLowerCase("en-US")}:${clientAddress}`;
}

function enforceLoginLimit(key: string) {
  pruneLoginAttempts();
  const attempt = loginAttempts.get(key);
  if (attempt && attempt.failures >= LOGIN_MAX_FAILURES) {
    throw new AuthenticationError("THROTTLED", "Too many login attempts. Try again later.");
  }
}

function recordLoginFailure(key: string) {
  const now = Date.now();
  const current = loginAttempts.get(key);
  const failures = (current?.failures ?? 0) + 1;
  loginAttempts.set(key, {
    failures,
    blockedUntil: failures >= LOGIN_MAX_FAILURES ? now + LOGIN_WINDOW_MS : 0,
    expiresAt: now + LOGIN_WINDOW_MS,
  });
}

function pruneLoginAttempts() {
  const now = Date.now();
  for (const [key, attempt] of loginAttempts) {
    if (attempt.expiresAt <= now || (attempt.blockedUntil > 0 && attempt.blockedUntil <= now)) {
      loginAttempts.delete(key);
    }
  }
}

function fixedFailureDelay() {
  return new Promise((resolve) => setTimeout(resolve, 400));
}

function setPrivateResponseHeaders() {
  setResponseHeader("Cache-Control", "no-store");
  setResponseHeader("X-Robots-Tag", "noindex, nofollow");
}
