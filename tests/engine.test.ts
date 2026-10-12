import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { evaluate } from "../src/engine";
import type { Variable } from "../src/schema/types";

vi.mock("valitype", async () => {
  const actual = await vi.importActual<typeof import("valitype")>("valitype");
  return { ...actual, validateValue: vi.fn(actual.validateValue) };
});

let actualValidateValue: typeof import("valitype").validateValue;

beforeAll(async () => {
  actualValidateValue = (await vi.importActual<typeof import("valitype")>("valitype")).validateValue;
});

beforeEach(async () => {
  const mod = await import("valitype");
  vi.mocked(mod.validateValue).mockImplementation(actualValidateValue);
});

const variable = (partial: Record<string, unknown>) =>
  ({ name: "X", required: false, ...partial }) as Variable;

describe("evaluate: types", () => {
  it("ignores an absent optional variable", () => {
    expect(evaluate(variable({ type: "number", min: 1 }), undefined)).toBeNull();
  });

  it("reports an absent required variable", () => {
    expect(evaluate(variable({ type: "string", required: true, minLength: 3 }), undefined)).toEqual({
      key: "X",
      code: "REQUIRED",
      message: "X is required",
    });
  });

  it("treats an empty string as present", () => {
    expect(evaluate(variable({ type: "string", required: true }), "")).toBeNull();
    expect(evaluate(variable({ type: "number" }), "")).toMatchObject({ code: "INVALID_NUMBER" });
  });

  it.each([
    [{ type: "number" }, "abc", "INVALID_NUMBER", "X must be a valid number"],
    [{ type: "number" }, "1e5", "INVALID_NUMBER", "X must be a valid number"],
    [{ type: "boolean" }, "yes", "INVALID_BOOLEAN", 'X must be either "true" or "false"'],
    [{ type: "url" }, "ftp://example.com", "INVALID_URL", "X must be a valid URL"],
    [{ type: "enum", values: ["a", "b"] }, "c", "INVALID_ENUM", "X must be one of: a, b"],
  ])("reports %o with value %s", (partial, value, code, message) => {
    expect(evaluate(variable(partial), value)).toEqual({ key: "X", code, message });
  });

  it("accepts valid values of every type", () => {
    expect(evaluate(variable({ type: "string" }), "anything")).toBeNull();
    expect(evaluate(variable({ type: "number" }), "-3.5")).toBeNull();
    expect(evaluate(variable({ type: "boolean" }), "false")).toBeNull();
    expect(evaluate(variable({ type: "url" }), "https://example.com")).toBeNull();
    expect(evaluate(variable({ type: "enum", values: ["a", "b"] }), "b")).toBeNull();
  });
});

describe("evaluate: constraints", () => {
  it.each([
    [{ type: "string", pattern: "^[a-z]+$" }, "ABC", "PATTERN_MISMATCH", "X must match the pattern ^[a-z]+$"],
    [{ type: "string", minLength: 3 }, "ab", "TOO_SHORT", "X must be at least 3 characters long"],
    [{ type: "string", maxLength: 2 }, "abc", "TOO_LONG", "X must be at most 2 characters long"],
    [{ type: "string", format: "json" }, "{x}", "INVALID_FORMAT", "X must be valid JSON"],
    [{ type: "string", format: "json" }, "", "INVALID_FORMAT", "X must be valid JSON"],
    [{ type: "string", format: "date" }, "2023-02-30", "INVALID_FORMAT", "X must be a valid date in YYYY-MM-DD format"],
    [{ type: "number", min: 1 }, "0", "BELOW_MIN", "X must be greater than or equal to 1"],
    [{ type: "number", max: 10 }, "11", "ABOVE_MAX", "X must be less than or equal to 10"],
  ])("reports %o with value %s", (partial, value, code, message) => {
    expect(evaluate(variable(partial), value)).toEqual({ key: "X", code, message });
  });

  it.each([
    [{ type: "string", pattern: "^[a-z]+$" }, "abc"],
    [{ type: "string", pattern: "a" }, "xax"],
    [{ type: "string", pattern: "^\\p{L}+$" }, "Ção"],
    [{ type: "string", minLength: 3, maxLength: 3 }, "😀😀😀"],
    [{ type: "string", format: "json" }, '{"a":1}'],
    [{ type: "string", format: "date" }, "2024-02-29"],
    [{ type: "number", min: 1, max: 10 }, "1"],
    [{ type: "number", min: 1, max: 10 }, "10"],
  ])("accepts %o with value %s", (partial, value) => {
    expect(evaluate(variable(partial), value)).toBeNull();
  });

  it("checks the type before the constraints", () => {
    expect(evaluate(variable({ type: "number", min: 1 }), "abc")).toMatchObject({ code: "INVALID_NUMBER" });
  });

  it("reports only the first failing constraint, in schema order", () => {
    expect(evaluate(variable({ type: "string", pattern: "^a+$", minLength: 5 }), "b")).toMatchObject({
      code: "PATTERN_MISMATCH",
    });
  });
});

describe("evaluate: defaults and messages", () => {
  it("uses the default when the variable is absent", () => {
    expect(evaluate(variable({ type: "string", minLength: 3, default: "abcd" }), undefined)).toBeNull();
  });

  it("lets the environment win over the default", () => {
    expect(evaluate(variable({ type: "number", default: "3000" }), "abc")).toMatchObject({
      code: "INVALID_NUMBER",
    });
  });

  it("replaces the message but keeps the code, for types and constraints", () => {
    expect(evaluate(variable({ type: "number", message: "X must be numeric" }), "abc")).toEqual({
      key: "X",
      code: "INVALID_NUMBER",
      message: "X must be numeric",
    });
    expect(evaluate(variable({ type: "string", minLength: 3, message: "X is too short" }), "a")).toEqual({
      key: "X",
      code: "TOO_SHORT",
      message: "X is too short",
    });
  });

  it("rethrows errors that are not validation errors", async () => {
    const mod = await import("valitype");
    vi.mocked(mod.validateValue).mockImplementation(() => {
      throw "boom";
    });
    expect(() => evaluate(variable({ type: "string" }), "a")).toThrow("boom");
  });
});
