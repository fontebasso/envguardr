import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateEnvFromSchema } from "../src/validateEnv";

// define um mock de process.env para cada teste
beforeEach(() => {
  vi.resetModules();
  vi.mock("valitype", async () => {
    const actual = await vi.importActual<typeof import("valitype")>("valitype");
    return {
      ...actual,
      validateValue: vi.fn(actual.validateValue),
    };
  });
  process.env = {
    API_URL: "https://api.example.com",
    NODE_ENV: "production",
    PORT: "8080",
    DEBUG: "true",
    VERSION: "1.2.3",
  };
});

describe("validateEnvFromSchema", () => {
  it("returns true for valid environment variables", async () => {
    const ok = await validateEnvFromSchema("./tests/fixtures/env.schema.ts");
    expect(ok).toBe(true);
  });

  it("returns false and prints errors when variables are invalid", async () => {
    delete process.env.API_URL; // força erro
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const ok = await validateEnvFromSchema("./tests/fixtures/env.schema.ts");

    expect(ok).toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("API_URL is required"),
    );
  });

  it("returns false when schema cannot be loaded", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const ok = await validateEnvFromSchema(
      "./tests/fixtures/missing.schema.ts",
    );
    expect(ok).toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to load schema"),
    );
  });

  it("handles non-Error thrown inside validation loop", async () => {
    const { validateValue } = await import("valitype");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (validateValue as unknown as vi.Mock).mockImplementation(() => {
      throw "non-error thrown";
    });

    const ok = await validateEnvFromSchema("./tests/fixtures/env.schema.ts");

    expect(ok).toBe(false);
    expect(consoleError).toHaveBeenCalledWith("❌ Unknown error");
  });

  it("prints 'Unknown error' when schema import throws non-Error", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const fakeImport = () => Promise.reject("non-error thrown");

    const ok = await validateEnvFromSchema("irrelevant.ts", fakeImport);

    expect(ok).toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      "❌ Failed to load schema: Unknown error",
    );
  });
});
