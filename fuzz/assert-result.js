export function assertResult(result) {
  if (typeof result !== "object" || result === null) {
    throw new Error("validateEnv returned a non-object result");
  }

  if (typeof result.ok !== "boolean") {
    throw new Error("validateEnv returned invalid ok value");
  }

  if (!Array.isArray(result.issues)) {
    throw new Error("validateEnv returned invalid issues value");
  }

  if (result.ok && result.issues.length > 0) {
    throw new Error("ok is true but issues is not empty");
  }

  if (!result.ok && result.issues.length === 0) {
    throw new Error("ok is false but issues is empty");
  }

  for (const issue of result.issues) {
    if (typeof issue.key !== "string") {
      throw new Error("validateEnv returned issue with invalid key");
    }

    if (typeof issue.message !== "string") {
      throw new Error("validateEnv returned issue with invalid message");
    }

    if (issue.kind !== "validation") {
      throw new Error(`validateEnv returned unexpected issue kind: ${issue.kind}`);
    }
  }
}