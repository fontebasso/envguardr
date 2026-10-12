import { cp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { addMajor } from "./docs/versions.mjs";

const major = process.argv[2];
const versions = JSON.parse(await readFile("docs/versions.json", "utf8"));
const next = addMajor(versions, major);

const source = `docs/v${versions.find((entry) => entry.latest).version}`;
const target = `docs/v${major}`;
if (existsSync(target)) throw new Error(`${target} already exists`);

await cp(source, target, { recursive: true });
await writeFile("docs/versions.json", `${JSON.stringify(next, null, 2)}\n`);

console.log(`Created ${target} from ${source}; v${major} is now the latest.`);
