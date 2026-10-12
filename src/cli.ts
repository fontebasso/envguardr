import pkg from "../package.json" with { type: "json" };
import { EnvguardrError } from "./errors.js";
import { render } from "./report.js";
import type { Format, Output } from "./report.js";
import { loadSchemaFile } from "./schema/load.js";
import { parseSchema } from "./schema/parse.js";
import { validate } from "./validate.js";
import type { Env } from "./validate.js";

export type CliIO = {
  env: Env;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

type Command =
  | { name: "help" }
  | { name: "version" }
  | { name: "validate"; schemaPath: string; format: Format };

const HELP = `Usage:
  envguardr validate <schema> [--format text|json]
  envguardr --help
  envguardr --version

Exit codes:
  0  environment is valid
  1  environment is invalid
  2  could not validate (usage, schema or internal error)
`;

const HELP_ARGS = new Set(["help", "--help", "-h"]);

export async function run(argv: string[], io: CliIO): Promise<number> {
  const format = requestedFormat(argv);
  try {
    const command = parseArgs(argv);
    if (command.name === "help") {
      io.stdout(HELP);
      return 0;
    }
    if (command.name === "version") {
      io.stdout(`${pkg.version}\n`);
      return 0;
    }

    const schema = parseSchema(await loadSchemaFile(command.schemaPath));
    const result = validate(schema, io.env);
    write(io, render(command.format, { kind: "result", result }));
    return result.ok ? 0 : 1;
  } catch (err) {
    // Unexpected errors may carry environment data in their message: never print it.
    const error =
      err instanceof EnvguardrError ? err : new EnvguardrError("INTERNAL_ERROR", "Internal error");
    write(io, render(format, { kind: "error", error }));
    return 2;
  }
}

function requestedFormat(argv: string[]): Format {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--format=json") return "json";
    if (argv[i] === "--format" && argv[i + 1] === "json") return "json";
  }
  return "text";
}

function parseArgs(argv: string[]): Command {
  if (argv.length === 0 || (argv.length === 1 && HELP_ARGS.has(argv[0]))) return { name: "help" };
  if (argv.length === 1 && argv[0] === "--version") return { name: "version" };

  const [command, ...rest] = argv;
  if (command !== "validate") usage(`Unknown command: ${command}`);

  let format: Format = "text";
  const positionals: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--format" || arg.startsWith("--format=")) {
      const value = arg === "--format" ? rest[++i] : arg.slice("--format=".length);
      if (value !== "text" && value !== "json") {
        usage("Invalid value for --format: expected text or json");
      }
      format = value;
    } else if (arg.startsWith("-")) {
      usage(`Unknown option: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }

  if (positionals.length === 0) usage("Missing schema path");
  if (positionals.length > 1) usage(`Unexpected argument: ${positionals[1]}`);
  return { name: "validate", schemaPath: positionals[0], format };
}

function usage(message: string): never {
  throw new EnvguardrError("USAGE_ERROR", `${message}. Run 'envguardr --help' for usage.`);
}

function write(io: CliIO, output: Output): void {
  if (output.stdout) io.stdout(output.stdout);
  if (output.stderr) io.stderr(output.stderr);
}
