import fc from "fast-check";
import { validateEnv } from "../dist/src/core/validate-env.js";
import { assertResult } from "./assert-result.js";

const schema = {
  API_URL:  { type: "url",     required: false },
  PORT:     { type: "number",  required: false },
  NODE_ENV: { type: { enum: ["development", "production", "test"] }, required: false },
  API_KEY:  { type: "string",  required: false },
  FLAG:     { type: "boolean", required: false },
};

const toStr = (bytes) => Buffer.from(bytes).toString("latin1");

fc.assert(
  fc.property(
    fc.uint8Array({ maxLength: 5000 }),
    fc.uint8Array({ maxLength: 200 }),
    fc.uint8Array({ maxLength: 200 }),
    fc.string(),
    fc.uint8Array({ maxLength: 50 }),
    (apiUrlBytes, portBytes, nodeEnvBytes, apiKey, flagBytes) => {
      const env = {
        API_URL:  toStr(apiUrlBytes),
        PORT:     toStr(portBytes),
        NODE_ENV: toStr(nodeEnvBytes),
        API_KEY:  apiKey,
        FLAG:     toStr(flagBytes),
      };
      const result = validateEnv(schema, env);
      assertResult(result);
    }
  ),
  { numRuns: 10000 }
);
