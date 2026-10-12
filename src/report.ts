import type { EnvguardrError } from "./errors.js";
import type { Result } from "./validate.js";

export type Format = "text" | "json";

export type Outcome =
  | { kind: "result"; result: Result }
  | { kind: "error"; error: EnvguardrError };

export type Output = { stdout: string; stderr: string };

const SUCCESS = "✅ All environment variables are valid.";

export function render(format: Format, outcome: Outcome): Output {
  return format === "json" ? renderJson(outcome) : renderText(outcome);
}

function renderText(outcome: Outcome): Output {
  if (outcome.kind === "error") {
    const { error } = outcome;
    const message = error.path ? `Invalid schema at ${error.path}: ${error.message}` : error.message;
    return { stdout: "", stderr: `❌ ${message}\n` };
  }
  if (outcome.result.ok) return { stdout: `${SUCCESS}\n`, stderr: "" };
  return {
    stdout: "",
    stderr: outcome.result.issues.map((issue) => `❌ ${issue.message}\n`).join(""),
  };
}

function renderJson(outcome: Outcome): Output {
  const body =
    outcome.kind === "error"
      ? {
          ok: false,
          error: {
            code: outcome.error.code,
            message: outcome.error.message,
            ...(outcome.error.path === undefined ? {} : { path: outcome.error.path }),
          },
        }
      : {
          ok: outcome.result.ok,
          issues: outcome.result.issues.map(({ key, code, message }) => ({ key, code, message })),
        };
  return { stdout: `${JSON.stringify(body)}\n`, stderr: "" };
}
