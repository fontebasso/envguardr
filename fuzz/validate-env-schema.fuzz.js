import fc from "fast-check";
import { validateEnv } from "../dist/src/core/validate-env.js";
import { validators } from "valitype";
import { assertResult } from "./assert-result.js";

const ENUM_VALUES = ["development", "production", "test", "staging"];
const CUSTOM_VALIDATORS = [
  validators.regex(/^[A-Za-z0-9]+$/, "Must be alphanumeric"),
  validators.range(0, 86400, "Must be 0–86400"),
  validators.date("YYYY-MM-DD", "Must be valid date"),
  validators.json("Must be valid JSON"),
];

function buildRule({ typeIdx, required }) {
  switch (typeIdx) {
    case 0: return { type: "string",  required };
    case 1: return { type: "number",  required };
    case 2: return { type: "boolean", required };
    case 3: return { type: "url",     required };
    case 4: return { type: { enum: ENUM_VALUES }, required };
    case 5: return { type: "custom", validator: CUSTOM_VALIDATORS[0], required };
    case 6: return { type: "custom", validator: CUSTOM_VALIDATORS[1], required };
    case 7: return { type: "custom", validator: CUSTOM_VALIDATORS[2], required };
    case 8: return { type: "custom", validator: CUSTOM_VALIDATORS[3], required };
    default: return { type: "string", required };
  }
}

const ruleArb = fc.record({
  typeIdx: fc.integer({ min: 0, max: 8 }),
  required: fc.boolean(),
});

fc.assert(
  fc.property(
    fc.array(fc.tuple(ruleArb, fc.string({ maxLength: 200 })), { minLength: 1, maxLength: 8 }),
    (entries) => {
      const schema = {};
      const env = {};
      entries.forEach(([rule, value], i) => {
        const key = `KEY_${i}`;
        schema[key] = buildRule(rule);
        env[key] = value;
      });
      const result = validateEnv(schema, env);
      assertResult(result);
    }
  ),
  { numRuns: 10000 }
);
