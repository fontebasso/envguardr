import { describe, it, expect } from "vitest";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pkg from "../package.json" with { type: "json" };

const CLI_PATH = join(dirname(fileURLToPath(import.meta.url)), "../bin/cli.ts");
const APP = "tests/fixtures/app.schema.yaml";

function runCli(args: string[], env: Record<string, string> = {}) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const proc = spawn("tsx", [CLI_PATH, ...args], { env: { PATH: process.env.PATH ?? "", ...env } });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    proc.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

describe("envguardr binary contract", () => {
  it("exits 0 with the success line", async () => {
    expect(await runCli(["validate", APP], { API_URL: "https://example.com" })).toEqual({
      code: 0,
      stdout: "✅ All environment variables are valid.\n",
      stderr: "",
    });
  });

  it("exits 1 with the exact JSON contract", async () => {
    expect(await runCli(["validate", APP, "--format", "json"], { API_URL: "not-a-url", PORT: "abc" })).toEqual({
      code: 1,
      stdout:
        '{"ok":false,"issues":[{"key":"API_URL","code":"INVALID_URL","message":"API_URL must be a valid URL"},{"key":"PORT","code":"INVALID_NUMBER","message":"PORT must be a valid number"}]}\n',
      stderr: "",
    });
  });

  it("exits 2 with the exact JSON contract for an invalid schema", async () => {
    expect(await runCli(["validate", "tests/fixtures/invalid.schema.yaml", "--format", "json"])).toEqual({
      code: 2,
      stdout:
        '{"ok":false,"error":{"code":"SCHEMA_INVALID","message":"Unknown key \'requred\'","path":"variables.PORT"}}\n',
      stderr: "",
    });
  });

  it("exits 2 on usage errors", async () => {
    const { code, stderr } = await runCli(["validate"]);
    expect(code).toBe(2);
    expect(stderr).toBe("❌ Missing schema path. Run 'envguardr --help' for usage.\n");
  });

  it("prints help and version", async () => {
    expect((await runCli(["--help"])).code).toBe(0);
    expect(await runCli(["--version"])).toEqual({ code: 0, stdout: `${pkg.version}\n`, stderr: "" });
  });
});
