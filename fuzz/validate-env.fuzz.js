import fc from "fast-check";
import { validateEnv } from "../dist/src/core/validate-env.js";
import { assertResult } from "./assert-result.js";

const schema = {
  API_URL: { type: "url", required: true },
  PORT: { type: "number", required: true },
  NODE_ENV: {
    type: { enum: ["development", "production", "test"] },
    default: "production",
  },
  API_KEY: { type: "string", required: true },
};

fc.assert(
  fc.property(
    fc.string({ maxLength: 300 }),
    fc.string({ maxLength: 100 }),
    fc.string({ maxLength: 100 }),
    fc.string({ maxLength: 300 }),
    (apiUrl, port, nodeEnv, apiKey) => {
      const env = { API_URL: apiUrl, PORT: port, NODE_ENV: nodeEnv, API_KEY: apiKey };
      const result = validateEnv(schema, env);
      assertResult(result)
    }
  ),
  { numRuns: 10000 }
);
