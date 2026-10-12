import { validateValue, validators, ValidationError } from "valitype";
import type { CustomValidatorFn, Rule } from "valitype";
import type { Variable } from "./schema/types.js";
import { calendarDate, lengthAtLeast, lengthAtMost, matchesPattern } from "./validators.js";

export type Issue = { key: string; code: string; message: string };

type Step = { code?: string; rule: Rule };

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

  for (const { code, rule } of steps(variable)) {
    try {
      validateValue(variable.name, effective, rule);
    } catch (err) {
      if (!(err instanceof ValidationError)) throw err;
      return {
        key: variable.name,
        code: code ?? err.code,
        message: variable.message ?? err.message,
      };
    }
  }
  return null;
}

// The type rule first, then each constraint as a valitype custom rule. A
// custom rule is skipped by valitype when the value is absent.
function steps(variable: Variable): Step[] {
  const { name } = variable;
  const result: Step[] = [{ rule: typeRule(variable) }];
  const add = (code: string, validator: CustomValidatorFn) =>
    result.push({ code, rule: { type: "custom", validator } });

  if (variable.type === "string") {
    const { pattern, minLength, maxLength, format } = variable;
    if (pattern !== undefined) {
      add("PATTERN_MISMATCH", matchesPattern(pattern, `${name} must match the pattern ${pattern}`));
    }
    if (minLength !== undefined) {
      add("TOO_SHORT", lengthAtLeast(minLength, `${name} must be at least ${minLength} characters long`));
    }
    if (maxLength !== undefined) {
      add("TOO_LONG", lengthAtMost(maxLength, `${name} must be at most ${maxLength} characters long`));
    }
    if (format === "json") {
      add("INVALID_FORMAT", validators.json(`${name} must be valid JSON`));
    }
    if (format === "date") {
      add("INVALID_FORMAT", calendarDate(`${name} must be a valid date in YYYY-MM-DD format`));
    }
  }

  if (variable.type === "number") {
    const { min, max } = variable;
    if (min !== undefined) {
      add("BELOW_MIN", validators.range(min, Infinity, `${name} must be greater than or equal to ${min}`));
    }
    if (max !== undefined) {
      add("ABOVE_MAX", validators.range(-Infinity, max, `${name} must be less than or equal to ${max}`));
    }
  }

  return result;
}

function typeRule(variable: Variable): Rule {
  if (variable.type === "enum") {
    return { type: { enum: variable.values }, required: variable.required };
  }
  return { type: variable.type, required: variable.required };
}
