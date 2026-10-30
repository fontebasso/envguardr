import { RE2JS } from "re2js";
import { validateValue, ValidationError } from "valitype";
import type { Matcher, Rule } from "valitype";
import type { Variable } from "./schema/types.js";

export type Issue = { key: string; code: string; message: string };

export function evaluate(variable: Variable, value: string | undefined): Issue | null {
  const effective = value ?? variable.default;

  // An empty secret is the usual way a "set" variable is actually missing.
  if (variable.required && effective === "") {
    return {
      key: variable.name,
      code: "REQUIRED",
      message: variable.message ?? `${variable.name} is required and must not be empty`,
    };
  }

  try {
    validateValue(variable.name, effective, rule(variable));
  } catch (err) {
    if (!(err instanceof ValidationError)) throw err;
    return { key: variable.name, code: err.code, message: err.message };
  }
  return null;
}

function rule(variable: Variable): Rule {
  const { required, message } = variable;
  switch (variable.type) {
    case "enum":
      return { type: { enum: variable.values }, required, message };
    case "string": {
      const { pattern, minLength, maxLength, format } = variable;
      return {
        type: "string",
        required,
        message,
        pattern: pattern === undefined ? undefined : re2(pattern),
        minLength,
        maxLength,
        format,
      };
    }
    case "number":
      return { type: "number", required, message, min: variable.min, max: variable.max };
    default:
      return { type: variable.type, required, message };
  }
}

// RE2 instead of RegExp: linear time (no catastrophic backtracking on values
// from the environment), Unicode classes without flags, and the same dialect
// as Go and Rust. Not anchored, like RegExp.test.
function re2(pattern: string): Matcher {
  const re = RE2JS.compile(pattern);
  return { test: (value) => re.matcher(value).find() };
}
