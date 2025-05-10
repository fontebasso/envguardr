import { validateEnvFromSchema } from "./validateEnv.js";

export async function runCli(argv: string[]) {
  const [, , command, schemaPath] = argv;

  if (!command || command === "help" || command === "--help") {
    console.log("Usage:\n  envguardr validate ./env.schema.ts");
    process.exit(0);
  }

  if (command === "validate") {
    if (!schemaPath) {
      console.error(
        "❌ Missing schema path.\nUsage: envguardr validate ./env.schema.ts",
      );
      process.exit(1);
    }

    const success = await validateEnvFromSchema(schemaPath);
    process.exit(success ? 0 : 1);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
  }
}
