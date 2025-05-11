import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateEnvFromSchema } from "../src/validateEnv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Custom validators in envguardr", () => {
  const originalEnv = process.env;
  const mockConsoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  it("should validate regex pattern for API_KEY", async () => {
    process.env.API_URL = "https://example.com";
    process.env.VERSION = "1.0.0";
    process.env.API_KEY = "abc123"; // Invalid - not 32 chars

    const schemaPath = path.join(__dirname, "fixtures/env.schema.ts");
    const result = await validateEnvFromSchema(schemaPath);

    expect(result).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        "API_KEY must be a 32-character alphanumeric string",
      ),
    );
  });

  it("should validate range for CACHE_TTL", async () => {
    process.env.API_URL = "https://example.com";
    process.env.VERSION = "1.0.0";
    process.env.API_KEY = "abcdefghijklmnopqrstuvwxyz123456"; // Valid
    process.env.CACHE_TTL = "100000"; // Invalid - over max

    const schemaPath = path.join(__dirname, "fixtures/env.schema.ts");
    const result = await validateEnvFromSchema(schemaPath);

    expect(result).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("Cache TTL must be between 0 and 86400 seconds"),
    );
  });

  it("should validate AWS ARN format", async () => {
    process.env.API_URL = "https://example.com";
    process.env.VERSION = "1.0.0";
    process.env.API_KEY = "abcdefghijklmnopqrstuvwxyz123456"; // Valid
    process.env.CACHE_TTL = "3600"; // Valid
    process.env.AWS_S3_BUCKET = "not-an-arn"; // Invalid ARN

    const schemaPath = path.join(__dirname, "fixtures/env.schema.ts");
    const result = await validateEnvFromSchema(schemaPath);

    expect(result).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("Must be a valid S3 bucket ARN"),
    );
  });

  it("should validate JSON format", async () => {
    process.env.API_URL = "https://example.com";
    process.env.VERSION = "1.0.0";
    process.env.API_KEY = "abcdefghijklmnopqrstuvwxyz123456"; // Valid
    process.env.CACHE_TTL = "3600"; // Valid
    process.env.CONFIG_JSON = "{invalid json}"; // Invalid JSON

    const schemaPath = path.join(__dirname, "fixtures/env.schema.ts");
    const result = await validateEnvFromSchema(schemaPath);

    expect(result).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("CONFIG_JSON must be valid JSON"),
    );
  });

  it("should validate date format", async () => {
    process.env.API_URL = "https://example.com";
    process.env.VERSION = "1.0.0";
    process.env.API_KEY = "abcdefghijklmnopqrstuvwxyz123456"; // Valid
    process.env.CACHE_TTL = "3600"; // Valid
    process.env.RELEASE_DATE = "not-a-date"; // Invalid date

    const schemaPath = path.join(__dirname, "fixtures/env.schema.ts");
    const result = await validateEnvFromSchema(schemaPath);

    expect(result).toBe(false);
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        "Release date must be a valid date in YYYY-MM-DD format",
      ),
    );
  });

  it("should pass when all custom validators are satisfied", async () => {
    process.env.API_URL = "https://example.com";
    process.env.VERSION = "1.0.0";
    process.env.API_KEY = "abcdefghijklmnopqrstuvwxyz123456"; // Valid
    process.env.CACHE_TTL = "3600"; // Valid
    process.env.AWS_S3_BUCKET =
      "arn:aws:s3:us-east-1:123456789012:bucket:my-bucket"; // Valid
    process.env.CONFIG_JSON = '{"name":"test"}'; // Valid
    process.env.RELEASE_DATE = "2023-05-10"; // Valid

    const schemaPath = path.join(__dirname, "fixtures/env.schema.ts");
    const result = await validateEnvFromSchema(schemaPath);

    expect(result).toBe(true);
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "✅ All environment variables are valid.",
    );
  });
});
