import { describe, it, expect, vi, afterEach } from "vitest";
import { run } from "../src/cli";
import pkg from "../package.json" with { type: "json" };
import * as validateModule from "../src/validate";

const APP = "tests/fixtures/app.schema.yaml";

async function cli(argv: string[], env: Record<string, string> = {}) {
  let stdout = "";
  let stderr = "";
  const code = await run(argv, {
    env,
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
  });
  return { code, stdout, stderr };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("help and version", () => {
  it.each([[[]], [["--help"]], [["-h"]], [["help"]]])("prints help for %j", async (argv) => {
    const { code, stdout, stderr } = await cli(argv);
    expect(code).toBe(0);
    expect(stdout).toContain("envguardr validate <schema> [--format text|json]");
    expect(stdout).toContain("2  could not validate (usage, schema or internal error)");
    expect(stderr).toBe("");
  });

  it.each([[["validate", "--help"]], [["validate", APP, "-h"]], [["validate", APP, "--format", "json", "--help"]]])(
    "prints help when --help or -h appears anywhere: %j",
    async (argv) => {
      const { code, stdout, stderr } = await cli(argv);
      expect(code).toBe(0);
      expect(stdout).toContain("envguardr validate <schema> [--format text|json]");
      expect(stderr).toBe("");
    },
  );

  it("prints the package version", async () => {
    expect(await cli(["--version"])).toEqual({ code: 0, stdout: `${pkg.version}\n`, stderr: "" });
  });
});

describe("validate", () => {
  it("exits 0 when the environment is valid", async () => {
    expect(await cli(["validate", APP], { API_URL: "https://example.com" })).toEqual({
      code: 0,
      stdout: "✅ All environment variables are valid.\n",
      stderr: "",
    });
  });

  it("exits 0 for a schema without variables", async () => {
    expect((await cli(["validate", "tests/fixtures/empty.schema.yaml"])).code).toBe(0);
  });

  it("exits 1 and lists every issue", async () => {
    expect(await cli(["validate", APP], { API_URL: "not-a-url", PORT: "abc" })).toEqual({
      code: 1,
      stdout: "",
      stderr: "❌ API_URL must be a valid URL\n❌ PORT must be a valid number\n",
    });
  });

  it.each([[["--format", "json"]], [["--format=json"]]])("prints JSON with %j", async (flags) => {
    const { code, stdout, stderr } = await cli(["validate", APP, ...flags], { PORT: "abc" });
    expect(code).toBe(1);
    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toEqual({
      ok: false,
      issues: [
        { key: "API_URL", code: "REQUIRED", message: "API_URL is required" },
        { key: "PORT", code: "INVALID_NUMBER", message: "PORT must be a valid number" },
      ],
    });
  });

  it("accepts --format before the schema path", async () => {
    expect((await cli(["validate", "--format", "text", APP], { API_URL: "https://example.com" })).code).toBe(0);
  });

  it("exits 2 for an invalid schema", async () => {
    expect(await cli(["validate", "tests/fixtures/invalid.schema.yaml"])).toEqual({
      code: 2,
      stdout: "",
      stderr: "❌ Invalid schema at variables.PORT: Unknown key 'requred'\n",
    });
  });

  it("exits 2 for a missing schema file", async () => {
    const { code, stdout } = await cli(["validate", "tests/fixtures/nope.yaml", "--format", "json"]);
    expect(code).toBe(2);
    expect(JSON.parse(stdout)).toEqual({
      ok: false,
      error: { code: "SCHEMA_NOT_FOUND", message: "Cannot read schema file: tests/fixtures/nope.yaml" },
    });
  });
});

describe("usage errors", () => {
  it.each([
    [["oops"], "Unknown command: oops"],
    [["validate"], "Missing schema path"],
    [["validate", APP, "extra"], "Unexpected argument: extra"],
    [["validate", APP, "--strict"], "Unknown option: --strict"],
    [["validate", APP, "--format", "yaml"], "Invalid value for --format: expected text or json"],
    [["validate", APP, "--format"], "Invalid value for --format: expected text or json"],
  ])("exits 2 for %j", async (argv, message) => {
    expect(await cli(argv)).toEqual({
      code: 2,
      stdout: "",
      stderr: `❌ ${message}. Run 'envguardr --help' for usage.\n`,
    });
  });

  it("uses the last --format, and text when that one is invalid", async () => {
    expect(await cli(["validate", APP, "--format=json", "--format=xml"])).toEqual({
      code: 2,
      stdout: "",
      stderr: "❌ Invalid value for --format: expected text or json. Run 'envguardr --help' for usage.\n",
    });
    expect((await cli(["validate", "--format", "json", "--format", "text"])).stderr).toBe(
      "❌ Missing schema path. Run 'envguardr --help' for usage.\n",
    );
  });

  it("reports usage errors as JSON when JSON was requested", async () => {
    const { code, stdout } = await cli(["validate", "--format", "json"]);
    expect(code).toBe(2);
    expect(JSON.parse(stdout).error.code).toBe("USAGE_ERROR");
  });
});

describe("internal errors", () => {
  it("exits 2 with a generic message that never includes the original error", async () => {
    vi.spyOn(validateModule, "validate").mockImplementation(() => {
      throw new Error("leaked-secret-value");
    });

    const { code, stdout, stderr } = await cli(["validate", APP, "--format", "json"], {
      API_URL: "leaked-secret-value",
    });

    expect(code).toBe(2);
    expect(stderr).toBe("");
    expect(stdout).not.toContain("leaked-secret-value");
    expect(JSON.parse(stdout)).toEqual({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Internal error" },
    });
  });
});
