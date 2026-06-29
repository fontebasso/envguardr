import { beforeEach, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { validateEnvFromSchema, loadSchemaFromPath } from "../src/validateEnv";

vi.mock("valitype", async () => {
  const actual = await vi.importActual<typeof import("valitype")>("valitype");
  return {
    ...actual,
    validateValue: vi.fn(actual.validateValue),
  };
});

let actualValidateValue: typeof import("valitype").validateValue;

beforeAll(async () => {
  const actual = await vi.importActual<typeof import("valitype")>("valitype");
  actualValidateValue = actual.validateValue;
});

beforeEach(async () => {
  const mod = await import("valitype");
  vi.mocked(mod.validateValue).mockImplementation(actualValidateValue);
  process.env = {
    API_URL: "https://api.example.com",
    NODE_ENV: "production",
    PORT: "8080",
    DEBUG: "true",
    VERSION: "1.2.3",
    API_KEY: "12345678901234567890123456789012",
    CACHE_TTL: "3600",
    AWS_S3_BUCKET: "arn:aws:s3:us-east-1:123456789012:my-bucket",
    CONFIG_JSON: '{"key": "value"}',
    RELEASE_DATE: "2023-10-01",
  };
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("validateEnvFromSchema", () => {
  it("returns true for valid environment variables", async () => {
    const ok = await validateEnvFromSchema("./tests/fixtures/env.schema.ts");
    expect(ok).toBe(true);
  });

  it("returns false and prints errors when variables are invalid", async () => {
    delete process.env.API_URL;
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

  it("propagates non-Error thrown inside validation loop", async () => {
    const { validateValue } = await import("valitype");

    // @ts-ignore
    (validateValue as unknown as vi.Mock).mockImplementation(() => {
      throw "non-error thrown";
    });

    await expect(
      validateEnvFromSchema("./tests/fixtures/env.schema.ts"),
    ).rejects.toBe("non-error thrown");
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

describe("loadSchemaFromPath", () => {
  it("loads schema using provided dynamicImport", async () => {
    const fakeSchema = { PORT: { type: "number" as const, required: true } };
    const fakeImport = vi.fn().mockResolvedValue({ default: fakeSchema });

    const schema = await loadSchemaFromPath("./any.ts", fakeImport);

    expect(schema).toBe(fakeSchema);
    expect(fakeImport).toHaveBeenCalledWith(expect.stringContaining("any.ts"));
  });

  it("throws when dynamicImport rejects", async () => {
    const fakeImport = vi.fn().mockRejectedValue(new Error("not found"));

    await expect(
      loadSchemaFromPath("./missing.ts", fakeImport),
    ).rejects.toThrow("not found");
  });
});
