import { randomBytes, scrypt } from "node:crypto";

const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 12 || password.length > 256) {
  console.error("Set ADMIN_PASSWORD to a value between 12 and 256 characters.");
  process.exitCode = 1;
} else {
  const N = 2 ** 17;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const hash = await new Promise((resolve, reject) => {
    scrypt(password, salt, 32, { N, r, p, maxmem: 256 * 1024 * 1024 }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });

  console.log(
    ["scrypt", N, r, p, salt.toString("base64url"), hash.toString("base64url")].join("$"),
  );
}
