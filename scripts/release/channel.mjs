// Decides where a release goes: only the newest version moves the npm and
// Docker "latest" tags. A maintenance release of an older line (for example a
// 3.x security fix after 4.0.0) is published under "release-<major>" instead.
// npm refuses dist-tags that are semver ranges, so "v3" or "3.x" cannot be used.

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

function parse(version) {
  const match = VERSION.exec(version);
  if (!match) throw new Error(`Invalid version: ${version}`);
  return match.slice(1).map(Number);
}

function isNewer(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

export function releaseChannel(version, currentLatest) {
  const next = parse(version);
  if (currentLatest === "") return { latest: true, npmTag: "latest" };
  if (isNewer(next, parse(currentLatest))) return { latest: true, npmTag: "latest" };
  return { latest: false, npmTag: `release-${next[0]}` };
}
