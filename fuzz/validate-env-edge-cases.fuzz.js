import { FuzzedDataProvider } from "@jazzer.js/core";
import { validateEnv } from "../dist/src/core/validate-env.js";
import { assertResult } from "./assert-result.js";

// All optional: the focus is on parser/encoder edge cases, not required-field logic
const schema = {
  API_URL:  { type: "url",     required: false },
  PORT:     { type: "number",  required: false },
  NODE_ENV: { type: { enum: ["development", "production", "test"] }, required: false },
  API_KEY:  { type: "string",  required: false },
  FLAG:     { type: "boolean", required: false },
};

export function fuzz(data) {
  const provider = new FuzzedDataProvider(data);

  // consumeBytes returns raw byte values (0-255), converted via latin1
  // to produce strings with null bytes, high bytes, and control characters
  // that consumeString (UTF-8 only) would otherwise skip
  const toStr = (bytes) => Buffer.from(bytes).toString("latin1");

  const env = {
    API_URL:  toStr(provider.consumeBytes(5000)),
    PORT:     toStr(provider.consumeBytes(200)),
    NODE_ENV: toStr(provider.consumeBytes(200)),
    API_KEY:  provider.consumeRemainingAsString(),
    FLAG:     toStr(provider.consumeBytes(50)),
  };

  const result = validateEnv(schema, env);
  assertResult(result);
}