import { describe, it, expect } from "vitest";
import { validateEnv } from "@/lib/env";

describe("P1 Environment Validation", () => {
  it("should validate required environment variables or defaults", () => {
    const env = validateEnv({
      NEXT_PUBLIC_APP_NAME: "SH103 Lab",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(env.NEXT_PUBLIC_APP_NAME).toBe("SH103 Lab");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("should fail validation if required public key is invalid", () => {
    expect(() =>
      validateEnv({
        NEXT_PUBLIC_APP_NAME: "",
      })
    ).toThrow();
  });
});
