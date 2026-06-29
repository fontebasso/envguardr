import { loadSchemaFromPath } from "./core/load-schema.js";
import { validateEnv } from "./core/validate-env.js";
import type { DynamicImport } from "./core/load-schema.js";
import type { EnvSchema } from "./core/validate-env.js";

export type { EnvSchema, EnvValues, EnvValidationIssue, EnvValidationResult } from "./core/validate-env.js";
export { validateEnv } from "./core/validate-env.js";
export { loadSchemaFromPath } from "./core/load-schema.js";
export type { DynamicImport } from "./core/load-schema.js";

export async function validateEnvFromSchema(
  schemaPath: string,
  dynamicImport?: DynamicImport,
): Promise<boolean> {
  let schema: EnvSchema;
  try {
    schema = await loadSchemaFromPath(schemaPath, dynamicImport);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`❌ Failed to load schema: ${err.message}`);
    } else {
      console.error("❌ Failed to load schema: Unknown error");
    }
    return false;
  }

  const result = validateEnv(schema, process.env);
  for (const issue of result.issues) {
    console.error(`❌ ${issue.message}`);
  }
  if (result.ok) console.log("✅ All environment variables are valid.");
  return result.ok;
}
