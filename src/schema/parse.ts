import { RE2JS } from "re2js";
import { evaluate } from "../engine.js";
import { EnvguardrError } from "../errors.js";
import { hasOwn } from "../own.js";
import type { Schema, Variable, VariableType } from "./types.js";

type Mapping = Record<string, unknown>;

const VARIABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TYPES: readonly VariableType[] = ["string", "number", "boolean", "url", "enum"];
const COMMON_KEYS = ["type", "required", "default", "message"];
const TYPE_KEYS: Record<VariableType, readonly string[]> = {
  string: ["pattern", "minLength", "maxLength", "format"],
  number: ["min", "max"],
  boolean: [],
  url: [],
  enum: ["values"],
};
const ALL_TYPE_KEYS = new Set(Object.values(TYPE_KEYS).flat());

function isMapping(value: unknown): value is Mapping {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isString = (value: unknown): value is string => typeof value === "string";
const isNonEmptyString = (value: unknown): value is string => isString(value) && value.length > 0;
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;
const isFormat = (value: unknown): value is "json" | "date" => value === "json" || value === "date";

function invalid(path: string, message: string): never {
  throw new EnvguardrError("SCHEMA_INVALID", message, path);
}

function optional<T>(
  definition: Mapping,
  key: string,
  path: string,
  check: (value: unknown) => value is T,
  expected: string,
): T | undefined {
  if (!hasOwn(definition, key)) return undefined;
  const value = definition[key];
  if (!check(value)) invalid(`${path}.${key}`, `'${key}' must be ${expected}`);
  return value;
}

export function parseSchema(raw: unknown): Schema {
  if (!isMapping(raw)) invalid("(root)", "Schema must be a mapping");

  for (const key of Object.keys(raw)) {
    if (key !== "version" && key !== "variables") invalid("(root)", `Unknown key '${key}'`);
  }
  if (!hasOwn(raw, "version")) invalid("(root)", "Missing required key 'version'");
  if (raw.version !== 1) invalid("version", "Unsupported schema version; expected 1");
  if (!hasOwn(raw, "variables")) invalid("(root)", "Missing required key 'variables'");
  if (!isMapping(raw.variables)) invalid("variables", "'variables' must be a mapping");

  return {
    version: 1,
    variables: Object.entries(raw.variables).map(([name, definition]) =>
      parseVariable(name, definition),
    ),
  };
}

function parseVariable(name: string, definition: unknown): Variable {
  const variable = buildVariable(name, definition);
  if (variable.default !== undefined) {
    const issue = evaluate(variable, variable.default);
    if (issue) {
      invalid(
        `variables.${name}.default`,
        `'default' does not satisfy the variable rules: ${issue.message}`,
      );
    }
  }
  return variable;
}

function buildVariable(name: string, definition: unknown): Variable {
  const path = `variables.${name}`;
  if (!VARIABLE_NAME.test(name)) invalid("variables", `Invalid variable name '${name}'`);
  if (!isMapping(definition)) invalid(path, "Variable definition must be a mapping");
  if (!hasOwn(definition, "type")) invalid(path, "Missing required key 'type'");

  const type = definition.type;
  if (!isString(type) || !(TYPES as readonly string[]).includes(type)) {
    invalid(`${path}.type`, `Unknown type '${String(type)}'; expected one of: ${TYPES.join(", ")}`);
  }
  const variableType = type as VariableType;

  const allowed = new Set([...COMMON_KEYS, ...TYPE_KEYS[variableType]]);
  for (const key of Object.keys(definition)) {
    if (allowed.has(key)) continue;
    if (ALL_TYPE_KEYS.has(key)) {
      invalid(path, `Key '${key}' is not allowed for type '${variableType}'`);
    }
    invalid(path, `Unknown key '${key}'`);
  }

  const required = optional(definition, "required", path, isBoolean, "a boolean") ?? false;
  const message = optional(definition, "message", path, isNonEmptyString, "a non-empty string");
  const defaultValue = parseDefault(definition, variableType, path);
  if (required && defaultValue !== undefined) {
    invalid(path, "'required' and 'default' cannot be used together");
  }

  const base = { name, required, default: defaultValue, message };

  switch (variableType) {
    case "string": {
      const pattern = optional(definition, "pattern", path, isString, "a string");
      if (pattern !== undefined) assertPatternCompiles(pattern, `${path}.pattern`);
      const minLength = optional(definition, "minLength", path, isNonNegativeInteger, "a non-negative integer");
      const maxLength = optional(definition, "maxLength", path, isNonNegativeInteger, "a non-negative integer");
      if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) {
        invalid(path, "'minLength' must be less than or equal to 'maxLength'");
      }
      const format = optional(definition, "format", path, isFormat, "one of: json, date");
      return { ...base, type: "string", pattern, minLength, maxLength, format };
    }
    case "number": {
      const min = optional(definition, "min", path, isFiniteNumber, "a number");
      const max = optional(definition, "max", path, isFiniteNumber, "a number");
      if (min !== undefined && max !== undefined && min > max) {
        invalid(path, "'min' must be less than or equal to 'max'");
      }
      return { ...base, type: "number", min, max };
    }
    case "boolean":
      return { ...base, type: "boolean" };
    case "url":
      return { ...base, type: "url" };
    case "enum":
      return { ...base, type: "enum", values: parseValues(definition, path) };
  }
}

function parseDefault(definition: Mapping, type: VariableType, path: string): string | undefined {
  if (type === "number") {
    const value = optional(definition, "default", path, isFiniteNumber, "a number");
    return value === undefined ? undefined : String(value);
  }
  if (type === "boolean") {
    const value = optional(definition, "default", path, isBoolean, "a boolean");
    return value === undefined ? undefined : String(value);
  }
  return optional(definition, "default", path, isString, "a string");
}

function parseValues(definition: Mapping, path: string): string[] {
  if (!hasOwn(definition, "values")) invalid(path, "Missing required key 'values'");
  const values = definition.values;
  if (!Array.isArray(values) || values.length === 0 || !values.every(isString)) {
    invalid(`${path}.values`, "'values' must be a non-empty list of strings");
  }
  if (new Set(values).size !== values.length) {
    invalid(`${path}.values`, "'values' must not contain duplicates");
  }
  return values;
}

function assertPatternCompiles(pattern: string, path: string): void {
  try {
    RE2JS.compile(pattern);
  } catch {
    invalid(path, "'pattern' is not a valid regular expression");
  }
}
