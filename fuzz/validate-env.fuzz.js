import { FuzzedDataProvider } from "@jazzer.js/core";
import { validateEnv } from "../dist/src/core/validate-env.js";

const schema = {
  API_URL: { type: "url", required: true },
  PORT: { type: "number", required: true },
  NODE_ENV: {
    type: { enum: ["development", "production", "test"] },
    default: "production",
  },
  API_KEY: { type: "string", required: true },
};

export function fuzz(data) {
  const provider = new FuzzedDataProvider(data);

  const env = {
    API_URL: provider.consumeString(300),
    PORT: provider.consumeString(100),
    NODE_ENV: provider.consumeString(100),
    API_KEY: provider.consumeString(300),
  };

  const result = validateEnv(schema, env);

  if (typeof result !== "object" || result === null) {
    throw new Error("validateEnv returned a non-object result");
  }

  if (typeof result.ok !== "boolean") {
    throw new Error("validateEnv returned invalid ok value");
  }

  if (!Array.isArray(result.issues)) {
    throw new Error("validateEnv returned invalid issues value");
  }

  if (result.ok && result.issues.length > 0) {
    throw new Error("ok is true but issues is not empty");
  }

  if (!result.ok && result.issues.length === 0) {
    throw new Error("ok is false but issues is empty");
  }

  for (const issue of result.issues) {
    if (typeof issue.key !== "string") {
      throw new Error("validateEnv returned issue with invalid key");
    }

    if (typeof issue.message !== "string") {
      throw new Error("validateEnv returned issue with invalid message");
    }

    if (issue.kind !== "validation") {
      throw new Error(`validateEnv returned unexpected issue kind: ${issue.kind}`);
    }
  }
}