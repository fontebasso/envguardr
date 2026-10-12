import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { buildSite } from "./docs/render.mjs";

const OUT = "_site";

const versions = JSON.parse(await readFile("docs/versions.json", "utf8"));
const template = await readFile("docs/template.html", "utf8");

const pages = {};
for (const { version } of versions) {
  pages[version] = await readFile(`docs/v${version}/index.md`, "utf8");
}

await rm(OUT, { recursive: true, force: true });

for (const { path, html } of buildSite({ template, versions, pages })) {
  const file = join(OUT, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

await cp("docs/assets", join(OUT, "assets"), { recursive: true });
await cp("assets/logo-envguardr.png", join(OUT, "assets", "logo-envguardr.png"));

console.log(`Built ${versions.length} version(s) into ${OUT}/`);
