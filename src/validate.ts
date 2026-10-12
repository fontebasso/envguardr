import { evaluate } from "./engine.js";
import type { Issue } from "./engine.js";
import { hasOwn } from "./own.js";
import type { Schema } from "./schema/types.js";

export type Env = Record<string, string | undefined>;

export type Result = { ok: boolean; issues: Issue[] };

export function validate(schema: Schema, env: Env): Result {
  const issues: Issue[] = [];
  for (const variable of schema.variables) {
    const value = hasOwn(env, variable.name) ? env[variable.name] : undefined;
    const issue = evaluate(variable, value);
    if (issue) issues.push(issue);
  }
  return { ok: issues.length === 0, issues };
}
