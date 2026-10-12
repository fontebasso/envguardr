import { describe, it, expect } from "vitest";
import { validate } from "../src/validate";
import { parseSchema } from "../src/schema/parse";

const schema = parseSchema({
  version: 1,
  variables: {
    API_URL: { type: "url", required: true },
    PORT: { type: "number", default: 3000, min: 1, max: 65535 },
  },
});

describe("validate", () => {
  it("returns ok when every variable is valid", () => {
    expect(validate(schema, { API_URL: "https://example.com" })).toEqual({ ok: true, issues: [] });
  });

  it("collects every issue in schema order", () => {
    expect(validate(schema, { PORT: "70000" })).toEqual({
      ok: false,
      issues: [
        { key: "API_URL", code: "REQUIRED", message: "API_URL is required" },
        { key: "PORT", code: "ABOVE_MAX", message: "PORT must be less than or equal to 65535" },
      ],
    });
  });

  it("treats Object.prototype names as absent, including in process.env", () => {
    const prototypeNames = parseSchema({
      version: 1,
      variables: Object.fromEntries(
        ["toString", "constructor", "__proto__"].map((name) => [name, { type: "string", required: true }]),
      ),
    });

    for (const env of [{}, process.env]) {
      expect(validate(prototypeNames, env).issues.map((issue) => issue.code)).toEqual([
        "REQUIRED",
        "REQUIRED",
        "REQUIRED",
      ]);
    }
  });
});
