import { afterEach, describe, expect, it, vi } from "vitest";
import { isMockMode, isRealKey } from "@/config/ai";

describe("AI config helpers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("treats placeholders and empty values as missing keys", () => {
    expect(isRealKey(undefined)).toBe(false);
    expect(isRealKey("")).toBe(false);
    expect(isRealKey("PASTE_YOUR_GEMINI_KEY_HERE")).toBe(false);
    expect(isRealKey("FAKE-test-key-1234567890")).toBe(true);
  });

  it("only enables mock mode outside production", () => {
    vi.stubEnv("MOCK_AI", "true");
    vi.stubEnv("NODE_ENV", "development");
    expect(isMockMode()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(isMockMode()).toBe(false);
  });
});
