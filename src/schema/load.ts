import { readFile } from "node:fs/promises";
import { parseAllDocuments } from "yaml";
import { EnvguardrError } from "../errors.js";

// YAML 1.2 core schema: no 1.1 booleans (yes/on), no !!binary, !!set, etc.
const YAML_OPTIONS = {
  version: "1.2",
  schema: "core",
  uniqueKeys: true,
  resolveKnownTags: false,
} as const;

const MAX_ALIAS_COUNT = 100;

export async function loadSchemaFile(path: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    throw new EnvguardrError("SCHEMA_NOT_FOUND", `Cannot read schema file: ${path}`);
  }
  return parseSchemaText(text);
}

export function parseSchemaText(text: string): unknown {
  const documents = parseAllDocuments(text, YAML_OPTIONS);
  if (documents.length === 0) {
    throw new EnvguardrError("SCHEMA_PARSE_ERROR", "Schema file is empty");
  }
  if (documents.length > 1) {
    throw new EnvguardrError("SCHEMA_PARSE_ERROR", "Schema must contain exactly one YAML document");
  }

  const [document] = documents;
  const problem = document.errors[0] ?? document.warnings[0];
  if (problem) {
    // First line only (the rest is a source excerpt), without its trailing colon.
    throw new EnvguardrError("SCHEMA_PARSE_ERROR", problem.message.split("\n")[0].replace(/:$/, ""));
  }

  try {
    return document.toJS({ maxAliasCount: MAX_ALIAS_COUNT });
  } catch {
    throw new EnvguardrError("SCHEMA_PARSE_ERROR", "Schema uses too many aliases");
  }
}
