import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { EnvSchema } from "./validate-env.js";

export type DynamicImport = (path: string) => Promise<{ default: EnvSchema }>;

export async function loadSchemaFromPath(
  schemaPath: string,
  dynamicImport: DynamicImport = (p) => import(p),
): Promise<EnvSchema> {
  const fullPath = pathToFileURL(resolve(schemaPath)).href;
  const schemaModule = await dynamicImport(fullPath);
  return schemaModule.default;
}
