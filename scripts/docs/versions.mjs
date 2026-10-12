const VERSION = /^[0-9]+$/;

export function validateVersions(versions) {
  if (!Array.isArray(versions) || versions.length === 0) {
    throw new Error("versions.json must list at least one version");
  }

  const seen = new Set();
  for (const { version } of versions) {
    if (typeof version !== "string" || !VERSION.test(version)) {
      throw new Error(`Invalid version '${version}' in versions.json`);
    }
    if (seen.has(version)) {
      throw new Error(`Duplicated version '${version}' in versions.json`);
    }
    seen.add(version);
  }

  if (versions.filter((entry) => entry.latest === true).length !== 1) {
    throw new Error("versions.json must mark exactly one version as latest");
  }
}
