import { describe, it, expect } from "vitest";
import { render } from "../src/report";
import { EnvguardrError } from "../src/errors";

const invalid = {
  kind: "result" as const,
  result: {
    ok: false,
    issues: [
      { key: "API_URL", code: "INVALID_URL", message: "API_URL must be a valid URL" },
      { key: "PORT", code: "INVALID_NUMBER", message: "PORT must be a valid number" },
    ],
  },
};
const valid = { kind: "result" as const, result: { ok: true, issues: [] } };
const schemaError = {
  kind: "error" as const,
  error: new EnvguardrError("SCHEMA_INVALID", "Unknown key 'requred'", "variables.PORT"),
};
const usageError = {
  kind: "error" as const,
  error: new EnvguardrError("USAGE_ERROR", "Missing schema path. Run 'envguardr --help' for usage."),
};

describe("render text", () => {
  it("prints success to stdout", () => {
    expect(render("text", valid)).toEqual({
      stdout: "✅ All environment variables are valid.\n",
      stderr: "",
    });
  });

  it("prints every issue to stderr", () => {
    expect(render("text", invalid)).toEqual({
      stdout: "",
      stderr: "❌ API_URL must be a valid URL\n❌ PORT must be a valid number\n",
    });
  });

  it("prints schema errors with their path", () => {
    expect(render("text", schemaError)).toEqual({
      stdout: "",
      stderr: "❌ Invalid schema at variables.PORT: Unknown key 'requred'\n",
    });
  });

  it("prints other errors without a path", () => {
    expect(render("text", usageError)).toEqual({
      stdout: "",
      stderr: "❌ Missing schema path. Run 'envguardr --help' for usage.\n",
    });
  });
});

describe("render json", () => {
  it("prints success", () => {
    expect(render("json", valid)).toEqual({ stdout: '{"ok":true,"issues":[]}\n', stderr: "" });
  });

  it("prints issues", () => {
    expect(render("json", invalid)).toEqual({
      stdout:
        '{"ok":false,"issues":[{"key":"API_URL","code":"INVALID_URL","message":"API_URL must be a valid URL"},{"key":"PORT","code":"INVALID_NUMBER","message":"PORT must be a valid number"}]}\n',
      stderr: "",
    });
  });

  it("prints schema errors with their path", () => {
    expect(render("json", schemaError)).toEqual({
      stdout:
        '{"ok":false,"error":{"code":"SCHEMA_INVALID","message":"Unknown key \'requred\'","path":"variables.PORT"}}\n',
      stderr: "",
    });
  });

  it("omits the path when there is none", () => {
    expect(JSON.parse(render("json", usageError).stdout)).toEqual({
      ok: false,
      error: { code: "USAGE_ERROR", message: "Missing schema path. Run 'envguardr --help' for usage." },
    });
  });
});
