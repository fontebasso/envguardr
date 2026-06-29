import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { validateEnv } from "../src/validateEnv";

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
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validateEnv", () => {
  it("returns ok: true when all variables are valid", () => {
    const result = validateEnv(
      { PORT: { type: "number", required: true } },
      { PORT: "8080" },
    );
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("returns ok: false with validation issue when variable is missing", () => {
    const result = validateEnv(
      { API_URL: { type: "url", required: true } },
      {},
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].kind).toBe("validation");
    expect(result.issues[0].key).toBe("API_URL");
    expect(result.issues[0].message).toContain("API_URL");
  });

  it("throws when validateValue throws a non-Error", async () => {
    const mod = await import("valitype");
    vi.mocked(mod.validateValue).mockImplementation(() => {
      throw "non-error string";
    });

    expect(() =>
      validateEnv({ PORT: { type: "number", required: true } }, { PORT: "bad" }),
    ).toThrow("non-error string");
  });

  it("does not write to console", () => {
    const consoleError = vi.spyOn(console, "error");
    validateEnv({ API_URL: { type: "url", required: true } }, {});
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("accumulates multiple issues", () => {
    const result = validateEnv(
      {
        API_URL: { type: "url", required: true },
        VERSION: { type: "string", required: true },
      },
      {},
    );
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(2);
  });
});
