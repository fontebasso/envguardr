import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { run } from "../src/cli";

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

const envArb = fc.record(Object.fromEntries(NAMES.map((name) => [name, secret])), {
  requiredKeys: [],
});

describe("no environment value ever reaches the output", () => {
  it("holds for every result path in text and JSON", async () => {
    await fc.assert(
      fc.asyncProperty(envArb, fc.constantFrom("text", "json"), async (env, format) => {
        let output = "";
        const code = await run(["validate", SCHEMA, "--format", format], {
          env: env as Record<string, string>,
          stdout: (text) => (output += text),
          stderr: (text) => (output += text),
        });

        expect([0, 1]).toContain(code);
        for (const value of Object.values(env) as string[]) {
          expect(output.includes(value)).toBe(false);
          expect(output.includes(JSON.stringify(value).slice(1, -1))).toBe(false);
        }
      }),
      { numRuns: 300 },
    );
  });
});
