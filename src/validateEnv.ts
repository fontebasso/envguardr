import { validateValue } from "valitype";
import type { Rule } from "valitype";

export async function validateEnvFromSchema(
  schemaPath: string,
  dynamicImport: (
    path: string,
  ) => Promise<{ default: Record<string, Rule> }> = (p) => import(p),
): Promise<boolean> {
  try {
    const fullPath = new URL(schemaPath, `file://${process.cwd()}/`).href;
    const schemaModule = await dynamicImport(fullPath);

    const schema = schemaModule.default as Record<string, Rule>;

    let ok = true;

    for (const [key, rule] of Object.entries(schema)) {
      try {
        validateValue(key, process.env[key], rule);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(`❌ ${err.message}`);
        } else {
          console.error("❌ Unknown error");
        }
        ok = false;
      }
    }

    if (ok) console.log("✅ All environment variables are valid.");
    return ok;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`❌ Failed to load schema: ${err.message}`);
    } else {
      console.error("❌ Failed to load schema: Unknown error");
    }
    return false;
  }
}
