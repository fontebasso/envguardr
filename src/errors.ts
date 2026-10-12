export type ErrorCode =
  | "USAGE_ERROR"
  | "SCHEMA_NOT_FOUND"
  | "SCHEMA_PARSE_ERROR"
  | "SCHEMA_INVALID"
  | "INTERNAL_ERROR";

export class EnvguardrError extends Error {
  readonly code: ErrorCode;
  readonly path?: string;

  constructor(code: ErrorCode, message: string, path?: string) {
    super(message);
    this.name = "EnvguardrError";
    this.code = code;
    this.path = path;
  }
}
