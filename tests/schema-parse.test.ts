import { describe, it, expect } from "vitest";
import { parseSchema } from "../src/schema/parse";
import { parseSchemaText } from "../src/schema/load";
import { EnvguardrError } from "../src/errors";

function schemaWith(definition: unknown, name = "X") {
  return { version: 1, variables: { [name]: definition } };
}

function expectInvalid(raw: unknown, path: string, message: string) {
  try {
    parseSchema(raw);
  } catch (err) {
    expect(err).toBeInstanceOf(EnvguardrError);
    expect(err).toMatchObject({ code: "SCHEMA_INVALID", path, message });
    return;
  }
  throw new Error("expected parseSchema to throw");
}

describe("parseSchema: valid schemas", () => {
  it("accepts an empty variables mapping", () => {
    expect(parseSchema({ version: 1, variables: {} })).toEqual({ version: 1, variables: [] });
  });

  it("keeps variables in file order", () => {
    const schema = parseSchema({
      version: 1,
      variables: { B: { type: "string" }, A: { type: "string" } },
    });
    expect(schema.variables.map((variable) => variable.name)).toEqual(["B", "A"]);
  });

  it("parses every type and its constraints", () => {
    expect(
      parseSchema({
        version: 1,
        variables: {
          API_KEY: {
            type: "string",
            required: true,
            pattern: "^[A-Za-z0-9]{32}$",
            minLength: 32,
            maxLength: 32,
            message: "API_KEY must be 32 alphanumeric characters",
          },
          CONFIG: { type: "string", format: "json" },
          PORT: { type: "number", min: 1, max: 65535 },
          WORKERS: { type: "number", default: 4 },
          DEBUG: { type: "boolean", default: false },
          API_URL: { type: "url", required: true },
          NODE_ENV: { type: "enum", values: ["development", "production"], default: "development" },
        },
      }),
    ).toEqual({
      version: 1,
      variables: [
        {
          name: "API_KEY",
          type: "string",
          required: true,
          pattern: "^[A-Za-z0-9]{32}$",
          minLength: 32,
          maxLength: 32,
          message: "API_KEY must be 32 alphanumeric characters",
        },
        { name: "CONFIG", type: "string", required: false, format: "json" },
        { name: "PORT", type: "number", required: false, min: 1, max: 65535 },
        { name: "WORKERS", type: "number", required: false, default: "4" },
        { name: "DEBUG", type: "boolean", required: false, default: "false" },
        { name: "API_URL", type: "url", required: true },
        { name: "NODE_ENV", type: "enum", required: false, values: ["development", "production"], default: "development" },
      ],
    });
  });

  it("leaves the default unset when a boolean has none", () => {
    expect(parseSchema(schemaWith({ type: "boolean" })).variables[0]).toEqual({
      name: "X",
      type: "boolean",
      required: false,
    });
  });

  it("accepts variable names that exist on Object.prototype", () => {
    const schema = parseSchema({
      version: 1,
      variables: Object.fromEntries([
        ["toString", { type: "string" }],
        ["__proto__", { type: "string" }],
      ]),
    });
    expect(schema.variables.map((variable) => variable.name)).toEqual(["toString", "__proto__"]);
  });

  it("keeps on/off enum values from YAML as strings", () => {
    const schema = parseSchema(parseSchemaText("version: 1\nvariables:\n  SWITCH:\n    type: enum\n    values: [on, off]\n"));
    expect(schema.variables[0]).toMatchObject({ values: ["on", "off"] });
  });
});

describe("parseSchema: invalid schemas", () => {
  it.each([
    ["root is null", null, "(root)", "Schema must be a mapping"],
    ["root is a list", [], "(root)", "Schema must be a mapping"],
    ["unknown root key", { version: 1, variables: {}, extra: 1 }, "(root)", "Unknown key 'extra'"],
    ["missing version", { variables: {} }, "(root)", "Missing required key 'version'"],
    ["unsupported version", { version: 2, variables: {} }, "version", "Unsupported schema version; expected 1"],
    ["version as string", { version: "1", variables: {} }, "version", "Unsupported schema version; expected 1"],
    ["missing variables", { version: 1 }, "(root)", "Missing required key 'variables'"],
    ["empty variables (YAML null)", { version: 1, variables: null }, "variables", "'variables' must be a mapping"],
    ["variables as list", { version: 1, variables: [] }, "variables", "'variables' must be a mapping"],
    ["name starting with digit", schemaWith({ type: "string" }, "1X"), "variables", "Invalid variable name '1X'"],
    ["name with dash", schemaWith({ type: "string" }, "MY-VAR"), "variables", "Invalid variable name 'MY-VAR'"],
    ["definition is a string", schemaWith("string"), "variables.X", "Variable definition must be a mapping"],
    ["definition is null", schemaWith(null), "variables.X", "Variable definition must be a mapping"],
    ["missing type", schemaWith({}), "variables.X", "Missing required key 'type'"],
    [
      "unknown type",
      schemaWith({ type: "integer" }),
      "variables.X.type",
      "Unknown type 'integer'; expected one of: string, number, boolean, url, enum",
    ],
    ["typo in key", schemaWith({ type: "string", requred: true }), "variables.X", "Unknown key 'requred'"],
    [
      "constraint of another type",
      schemaWith({ type: "boolean", min: 1 }),
      "variables.X",
      "Key 'min' is not allowed for type 'boolean'",
    ],
    ["required not boolean", schemaWith({ type: "string", required: "yes" }), "variables.X.required", "'required' must be a boolean"],
    ["required empty", schemaWith({ type: "string", required: null }), "variables.X.required", "'required' must be a boolean"],
    ["empty message", schemaWith({ type: "string", message: "" }), "variables.X.message", "'message' must be a non-empty string"],
    ["number default as string", schemaWith({ type: "number", default: "3000" }), "variables.X.default", "'default' must be a number"],
    ["number default infinite", schemaWith({ type: "number", default: Infinity }), "variables.X.default", "'default' must be a number"],
    ["boolean default yes", schemaWith({ type: "boolean", default: "yes" }), "variables.X.default", "'default' must be a boolean"],
    ["string default as number", schemaWith({ type: "string", default: 1 }), "variables.X.default", "'default' must be a string"],
    [
      "required with default",
      schemaWith({ type: "string", required: true, default: "a" }),
      "variables.X",
      "'required' and 'default' cannot be used together",
    ],
    ["pattern not a string", schemaWith({ type: "string", pattern: 1 }), "variables.X.pattern", "'pattern' must be a string"],
    ["pattern does not compile", schemaWith({ type: "string", pattern: "(" }), "variables.X.pattern", "'pattern' is not a valid regular expression"],
    ["negative minLength", schemaWith({ type: "string", minLength: -1 }), "variables.X.minLength", "'minLength' must be a non-negative integer"],
    ["fractional maxLength", schemaWith({ type: "string", maxLength: 1.5 }), "variables.X.maxLength", "'maxLength' must be a non-negative integer"],
    [
      "minLength above maxLength",
      schemaWith({ type: "string", minLength: 5, maxLength: 2 }),
      "variables.X",
      "'minLength' must be less than or equal to 'maxLength'",
    ],
    ["unknown format", schemaWith({ type: "string", format: "email" }), "variables.X.format", "'format' must be one of: json, date"],
    ["min as string", schemaWith({ type: "number", min: "1" }), "variables.X.min", "'min' must be a number"],
    ["min above max", schemaWith({ type: "number", min: 10, max: 1 }), "variables.X", "'min' must be less than or equal to 'max'"],
    ["enum without values", schemaWith({ type: "enum" }), "variables.X", "Missing required key 'values'"],
    ["enum with empty values", schemaWith({ type: "enum", values: [] }), "variables.X.values", "'values' must be a non-empty list of strings"],
    ["enum with numeric values", schemaWith({ type: "enum", values: [1, 2] }), "variables.X.values", "'values' must be a non-empty list of strings"],
    ["enum values as string", schemaWith({ type: "enum", values: "a" }), "variables.X.values", "'values' must be a non-empty list of strings"],
    ["enum with duplicates", schemaWith({ type: "enum", values: ["a", "a"] }), "variables.X.values", "'values' must not contain duplicates"],
  ])("%s", (_, raw, path, message) => {
    expectInvalid(raw, path, message);
  });
});

describe("parseSchema: default must satisfy the variable rules", () => {
  it.each([
    [
      "enum default outside values",
      schemaWith({ type: "enum", values: ["a", "b"], default: "c" }),
      "'default' does not satisfy the variable rules: X must be one of: a, b",
    ],
    [
      "url default with another protocol",
      schemaWith({ type: "url", default: "ftp://example.com" }),
      "'default' does not satisfy the variable rules: X must be a valid URL",
    ],
    [
      "number default that does not print as a decimal",
      schemaWith({ type: "number", default: 1e21 }),
      "'default' does not satisfy the variable rules: X must be a valid number",
    ],
    [
      "number default below min",
      schemaWith({ type: "number", default: 0, min: 1 }),
      "'default' does not satisfy the variable rules: X must be greater than or equal to 1",
    ],
    [
      "string default shorter than minLength",
      schemaWith({ type: "string", default: "abc", minLength: 5 }),
      "'default' does not satisfy the variable rules: X must be at least 5 characters long",
    ],
    [
      "custom message",
      schemaWith({ type: "url", default: "ftp://example.com", message: "X must use https" }),
      "'default' does not satisfy the variable rules: X must use https",
    ],
  ])("%s", (_, raw, message) => {
    expectInvalid(raw, "variables.X.default", message);
  });

  it("accepts a default that satisfies the constraints", () => {
    expect(parseSchema(schemaWith({ type: "number", default: 3000, min: 1, max: 65535 })).variables[0]).toMatchObject({
      default: "3000",
    });
  });
});
