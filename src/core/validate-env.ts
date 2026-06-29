import { validateValue, ValidationError } from "valitype";
import type { Rule } from "valitype";

export type EnvSchema = Record<string, Rule>;

export type EnvValues = Record<string, string | undefined>;

export type EnvValidationIssue = {
  key: string;
  message: string;
  kind: "validation";
};

export type EnvValidationResult = {
  ok: boolean;
  issues: EnvValidationIssue[];
};

export function validateEnv(
  schema: EnvSchema,
  env: EnvValues = process.env,
): EnvValidationResult {
  const issues: EnvValidationIssue[] = [];

  for (const [key, rule] of Object.entries(schema)) {
    try {
      validateValue(key, env[key], rule);
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        issues.push({ key, message: err.message, kind: "validation" });
      } else {
        throw err;
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
