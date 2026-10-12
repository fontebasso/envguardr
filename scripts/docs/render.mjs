import { marked } from "marked";
import { validateVersions } from "./versions.mjs";

// split/join instead of String.replace: no special handling of $& or $1.
function fill(text, placeholder, value) {
  return text.split(placeholder).join(value);
}

function versionsNav(versions, current, base) {
  return versions
    .map(({ version, latest }) => {
      const label = latest ? `v${version} (latest)` : `v${version}`;
      const ariaCurrent = version === current ? ' aria-current="page"' : "";
      return `<li><a href="${base}v${version}/"${ariaCurrent}>${label}</a></li>`;
    })
    .join("");
}

function banner(versions, current, base) {
  const latest = versions.find((entry) => entry.latest);
  if (latest.version === current) return "";
  return `<div class="version-banner">You are viewing the documentation for v${current}. <a href="${base}">See the latest version (v${latest.version})</a>.</div>`;
}

export function renderPage({ template, markdown, version, versions, base }) {
  const content = fill(marked.parse(markdown), "{{base}}", base);
  let html = fill(template, "{{base}}", base);
  html = fill(html, "{{versions}}", versionsNav(versions, version, base));
  html = fill(html, "{{banner}}", banner(versions, version, base));
  // Content last, so placeholders written in the docs are never expanded.
  return fill(html, "{{content}}", content);
}

export function buildSite({ template, versions, pages }) {
  validateVersions(versions);

  const output = [];
  for (const { version, latest } of versions) {
    const markdown = pages[version];
    if (markdown === undefined) throw new Error(`Missing page for version ${version}`);

    output.push({
      path: `v${version}/index.html`,
      html: renderPage({ template, markdown, version, versions, base: "../" }),
    });
    if (latest) {
      output.push({
        path: "index.html",
        html: renderPage({ template, markdown, version, versions, base: "" }),
      });
    }
  }
  return output;
}
