import { FuzzedDataProvider } from "@jazzer.js/core";
import { validateEnv } from "../dist/src/core/validate-env.js";
import { assertResult } from "./assert-result.js";

const ENUM_VALUES = ["development", "production", "test", "staging"];

const TYPE_COUNT = 5;

function pickRule(provider) {
  const idx = provider.consumeIntegralInRange(0, TYPE_COUNT - 1);
  const required = provider.consumeBoolean();

  switch (idx) {
    case 0: return { type: "string",  required };
    case 1: return { type: "number",  required };
    case 2: return { type: "boolean", required };
    case 3: return { type: "url",     required };
    case 4: return { type: { enum: ENUM_VALUES }, required };
    default: return { type: "string", required };
  }
}

export function fuzz(data) {
  const provider = new FuzzedDataProvider(data);

  const keyCount = provider.consumeIntegralInRange(1, 8);
  const schema = {};
  const env = {};

  for (let i = 0; i < keyCount; i++) {
    const key = `KEY_${i}`;
    schema[key] = pickRule(provider);
    env[key] = provider.consumeString(200);
  }

  const result = validateEnv(schema, env);
  assertResult(result);
}