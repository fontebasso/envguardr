import fc from "fast-check";
import { parseSchema } from "../dist/src/schema/parse.js";
import { validate } from "../dist/src/validate.js";
import { assertResult } from "./assert-result.js";

const schema = parseSchema({
  version: 1,
  variables: {
    API_URL: { type: "url", required: true },
    PORT: { type: "number", default: 3000, min: 1, max: 65535 },
    NODE_ENV: { type: "enum", values: ["development", "production", "test"], default: "production" },
    API_KEY: { type: "string", required: true, pattern: "^[A-Za-z0-9]+$", minLength: 32, maxLength: 32 },
    CONFIG: { type: "string", format: "json" },
    RELEASE_DATE: { type: "string", format: "date" },
    FLAG: { type: "boolean" },
  },
});

const value = fc.oneof(
  fc.string({ maxLength: 300 }),
  fc.uint8Array({ maxLength: 300 }).map((bytes) => Buffer.from(bytes).toString("latin1")),
);

fc.assert(
  fc.property(
    fc.record(
      {
        API_URL: value,
        PORT: value,
        NODE_ENV: value,
        API_KEY: value,
        CONFIG: value,
        RELEASE_DATE: value,
        FLAG: value,
      },
      { requiredKeys: [] },
    ),
    (env) => {
      assertResult(validate(schema, env));
    },
  ),
  { numRuns: 10000 },
);
