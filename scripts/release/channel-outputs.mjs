// Usage: node scripts/release/channel-outputs.mjs <version> <current npm latest>
// Prints GitHub Actions outputs for the release workflow.
import { releaseChannel } from "./channel.mjs";

const [version, currentLatest = ""] = process.argv.slice(2);
const { latest, npmTag } = releaseChannel(version, currentLatest);

console.log(`latest=${latest}`);
console.log(`npm-tag=${npmTag}`);
