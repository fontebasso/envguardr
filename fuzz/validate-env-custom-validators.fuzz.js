import fc from "fast-check";
import { validateEnv } from "../dist/src/core/validate-env.js";
import { validators } from "valitype";
import { assertResult } from "./assert-result.js";

const schema = {
  REGEX_FIELD: {
    type: "custom",
    validator: validators.regex(/^[A-Za-z0-9]{32}$/, "Must be 32 alphanumeric chars"),
    required: false,
  },
  RANGE_FIELD: {
    type: "custom",
    validator: validators.range(0, 86400, "Must be between 0 and 86400"),
    required: false,
  },
  DATE_FIELD: {
    type: "custom",
    validator: validators.date("YYYY-MM-DD", "Must be valid date in YYYY-MM-DD format"),
    required: false,
  },
  JSON_FIELD: {
    type: "custom",
    validator: validators.json("Must be valid JSON"),
    required: false,
  },
  ARN_FIELD: {
    type: "custom",
    validator: validators.awsArn("s3", "Must be valid S3 ARN"),
    required: false,
  },
};

fc.assert(
  fc.property(
    fc.string({ maxLength: 300 }),
    fc.string({ maxLength: 100 }),
    fc.string({ maxLength: 100 }),
    fc.string({ maxLength: 1000 }),
    fc.string({ maxLength: 300 }),
    (regexField, rangeField, dateField, jsonField, arnField) => {
      const env = {
        REGEX_FIELD: regexField,
        RANGE_FIELD: rangeField,
        DATE_FIELD: dateField,
        JSON_FIELD: jsonField,
        ARN_FIELD: arnField,
      };
      const result = validateEnv(schema, env);
      assertResult(result);
    }
  ),
  { numRuns: 10000 }
);
