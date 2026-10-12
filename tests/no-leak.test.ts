import { describe, it, expect, vi, afterEach } from "vitest";
import fc from "fast-check";
import { run } from "../src/cli";
import * as validateModule from "../src/validate";

const SCHEMA = "tests/fixtures/leak.schema.yaml";
const NAMES = [
  "A_STRING", "A_NUMBER", "A_BOOLEAN", "A_URL", "A_ENUM", "A_REQUIRED", "A_MESSAGE",
  "A_PATTERN", "A_LENGTH", "A_RANGE", "A_JSON", "A_DATE",
];

// Values either carry a marker character that no output text contains, or are
// long digit runs that pass number validation. Both are unmistakable if leaked.
const secret = fc.oneof(
  fc.string({ minLength: 1, maxLength: 64 }).map((text) => `⁣${text}⁣`),
  fc.stringMatching(/^[0-9]{12,24}$/),
);

const model = Object.fromEntries(NAMES.map((name) => [name, secret]));
const envArb = fc.record(model, { requiredKeys: [] });
const fullEnvArb = fc.record(model);
const formatArb = fc.constantFrom("text", "json");

// Every way to end with exit 2 that does not need a mock.
const EXIT_2_ARGS: Record<string, string[]> = {
  "usage error": ["validate"],
  "unknown option": ["validate", SCHEMA, "--strict"],
  "missing schema": ["validate", "tests/fixtures/nope.yaml"],
  "malformed schema": ["validate", "tests/fixtures/malformed.schema.yaml"],
  "invalid schema": ["validate", "tests/fixtures/invalid.schema.yaml"],
};

async function cliOutput(argv: string[], env: Record<string, string>) {
  let output = "";
  const code = await run(argv, {
    env,
    stdout: (text) => (output += text),
    stderr: (text) => (output += text),
  });
  return { code, output };
}

function expectNoValue(output: string, env: Record<string, string>) {
  for (const value of Object.values(env)) {
    expect(output.includes(value)).toBe(false);
    // JSON output would show the value escaped (" becomes \").
    expect(output.includes(JSON.stringify(value).slice(1, -1))).toBe(false);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("no environment value ever reaches the output", () => {
  it("holds for every result path (exit 0 and 1) in text and JSON", async () => {
    await fc.assert(
      fc.asyncProperty(envArb, formatArb, async (env, format) => {
        const { code, output } = await cliOutput(["validate", SCHEMA, "--format", format], env);
        expect([0, 1]).toContain(code);
        expectNoValue(output, env);
      }),
      { numRuns: 300 },
    );
  });

  it("holds for every exit 2 path in text and JSON", async () => {
    await fc.assert(
      fc.asyncProperty(fullEnvArb, fc.constantFrom(...Object.keys(EXIT_2_ARGS)), formatArb, async (env, path, format) => {
        const { code, output } = await cliOutput([...EXIT_2_ARGS[path], "--format", format], env);
        expect(code).toBe(2);
        expectNoValue(output, env);
      }),
      { numRuns: 200 },
    );
  });

  it("holds for an internal error whose message carries environment values", async () => {
    vi.spyOn(validateModule, "validate").mockImplementation((_, env) => {
      throw new Error(`unexpected failure with ${JSON.stringify(env)}`);
    });

    await fc.assert(
      fc.asyncProperty(fullEnvArb, formatArb, async (env, format) => {
        const { code, output } = await cliOutput(["validate", SCHEMA, "--format", format], env);
        expect(code).toBe(2);
        expectNoValue(output, env);
      }),
      { numRuns: 100 },
    );
  });
});
