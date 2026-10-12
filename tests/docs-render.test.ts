import { describe, it, expect } from "vitest";
import { buildSite, renderPage } from "../scripts/docs/render.mjs";
import { addMajor, validateVersions } from "../scripts/docs/versions.mjs";

const TEMPLATE =
  '<link href="{{base}}assets/style.css"><ul>{{versions}}</ul>{{banner}}<main>{{content}}</main>';

const VERSIONS = [
  { version: "4", latest: true },
  { version: "3" },
];

describe("validateVersions", () => {
  it("accepts a list with exactly one latest", () => {
    expect(() => validateVersions(VERSIONS)).not.toThrow();
  });

  it("rejects an empty list", () => {
    expect(() => validateVersions([])).toThrow("versions.json must list at least one version");
  });

  it("rejects zero or multiple latest", () => {
    expect(() => validateVersions([{ version: "3" }])).toThrow(
      "versions.json must mark exactly one version as latest",
    );
    expect(() =>
      validateVersions([
        { version: "4", latest: true },
        { version: "3", latest: true },
      ]),
    ).toThrow("versions.json must mark exactly one version as latest");
  });

  it("rejects non-numeric and duplicated versions", () => {
    expect(() => validateVersions([{ version: "v3", latest: true }])).toThrow(
      "Invalid version 'v3' in versions.json",
    );
    expect(() =>
      validateVersions([
        { version: "3", latest: true },
        { version: "3" },
      ]),
    ).toThrow("Duplicated version '3' in versions.json");
  });
});

describe("renderPage", () => {
  it("renders markdown, base paths, versions nav and no banner for latest", () => {
    const html = renderPage({
      template: TEMPLATE,
      markdown: '# Title\n\n<img src="{{base}}assets/logo.png">\n',
      version: "4",
      versions: VERSIONS,
      base: "../",
    });

    expect(html).toContain('<link href="../assets/style.css">');
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain('<img src="../assets/logo.png">');
    expect(html).toContain('<li><a href="../v4/" aria-current="page">v4 (latest)</a></li>');
    expect(html).toContain('<li><a href="../v3/">v3</a></li>');
    expect(html).not.toContain("version-banner");
    expect(html).not.toContain("{{");
  });

  it("shows a banner linking to the latest version on older versions", () => {
    const html = renderPage({
      template: TEMPLATE,
      markdown: "text",
      version: "3",
      versions: VERSIONS,
      base: "../",
    });

    expect(html).toContain(
      '<div class="version-banner">You are viewing the documentation for v3. <a href="../">See the latest version (v4)</a>.</div>',
    );
  });

  it("does not expand $ patterns from the content", () => {
    const html = renderPage({
      template: TEMPLATE,
      markdown: "Costs $& and $1",
      version: "4",
      versions: VERSIONS,
      base: "",
    });

    expect(html).toContain("Costs $&amp; and $1");
  });
});

describe("buildSite", () => {
  it("emits one page per version plus the latest at the root", () => {
    const pages = buildSite({
      template: TEMPLATE,
      versions: VERSIONS,
      pages: { "4": "# Four", "3": "# Three" },
    });

    expect(pages.map((page) => page.path)).toEqual(["v4/index.html", "index.html", "v3/index.html"]);
    expect(pages[1].html).toContain('<link href="assets/style.css">');
    expect(pages[1].html).toContain("<h1>Four</h1>");
    expect(pages[2].html).toContain("<h1>Three</h1>");
  });

  it("fails when a version has no page", () => {
    expect(() =>
      buildSite({ template: TEMPLATE, versions: VERSIONS, pages: { "4": "# Four" } }),
    ).toThrow("Missing page for version 3");
  });
});

describe("addMajor", () => {
  it("adds the new major as the only latest, newest first", () => {
    expect(addMajor([{ version: "3", latest: true }], "4")).toEqual([
      { version: "4", latest: true },
      { version: "3" },
    ]);
  });

  it("rejects a major that is not greater than every existing one", () => {
    expect(() => addMajor([{ version: "3", latest: true }], "3")).toThrow(
      "New major 3 must be greater than 3",
    );
  });

  it("rejects a non-numeric major", () => {
    expect(() => addMajor([{ version: "3", latest: true }], "v4")).toThrow(
      "Invalid version 'v4' in versions.json",
    );
  });
});
