import { describe, expect, it } from "vitest";
import { hashPassword, hashResetToken, verifyPassword } from "@/lib/auth";

describe("auth utils", () => {
  it("hashes and verifies passwords", async () => {
    const password = "Secret123";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("Wrong123", passwordHash)).resolves.toBe(false);
  });

  it("hashes reset tokens deterministically", () => {
    const token = "abc-123-token";
    expect(hashResetToken(token)).toBe(hashResetToken(token));
    expect(hashResetToken(token)).not.toBe(hashResetToken("different-token"));
  });
});
