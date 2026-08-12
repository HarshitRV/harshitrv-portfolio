import { describe, expect, it } from "vitest";
import { createPasswordHash, verifyPassword } from "./auth.server";

describe("administrator password hashing", () => {
  it("round-trips a valid password through the versioned scrypt format", async () => {
    const encoded = await createPasswordHash("a strong test password");

    await expect(verifyPassword("a strong test password", encoded)).resolves.toBe(true);
    await expect(verifyPassword("the wrong password", encoded)).resolves.toBe(false);
  });

  it("rejects malformed password hashes", async () => {
    await expect(verifyPassword("a strong test password", "not-a-valid-hash")).rejects.toThrow(
      "invalid format",
    );
  });
});
