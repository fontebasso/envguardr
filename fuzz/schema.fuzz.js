import fc from "fast-check";
import { parseSchema } from "../dist/src/schema/parse.js";
import { assertEnvguardrError } from "./assert-result.js";

const key = fc.constantFrom(
  "type", "required", "default", "message", "pattern", "minLength",
  "maxLength", "format", "min", "max", "values", "extra",
);
const typeName = fc.constantFrom("string", "number", "boolean", "url", "enum", "other");
const definition = fc.dictionary(key, fc.oneof(typeName, fc.jsonValue()), { maxKeys: 6 });
const raw = fc.oneof(
  fc.jsonValue(),
  fc.record(
    {
      version: fc.oneof(fc.constant(1), fc.jsonValue()),
      variables: fc.dictionary(fc.string({ maxLength: 12 }), definition, { maxKeys: 5 }),
    },
    { requiredKeys: [] },
  ),
);

fc.assert(
  fc.property(raw, (input) => {
    try {
      parseSchema(input);
    } catch (err) {
      assertEnvguardrError(err, "SCHEMA_INVALID");
    }
  }),
  { numRuns: 10000 },
);
