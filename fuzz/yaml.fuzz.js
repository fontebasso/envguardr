import fc from "fast-check";
import { parseSchemaText } from "../dist/src/schema/load.js";
import { assertEnvguardrError } from "./assert-result.js";

fc.assert(
  fc.property(fc.string({ maxLength: 2000 }), (text) => {
    try {
      parseSchemaText(text);
    } catch (err) {
      assertEnvguardrError(err, "SCHEMA_PARSE_ERROR");
    }
  }),
  { numRuns: 10000 },
);
