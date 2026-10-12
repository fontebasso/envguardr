export function assertResult(result) {
  if (typeof result !== "object" || result === null) {
    throw new Error("validate returned a non-object result");
  }

  if (typeof result.ok !== "boolean") {
    throw new Error("validate returned invalid ok value");
  }

  if (!Array.isArray(result.issues)) {
    throw new Error("validate returned invalid issues value");
  }

  if (result.ok !== (result.issues.length === 0)) {
    throw new Error("ok does not match issues");
  }

  for (const issue of result.issues) {
    for (const field of ["key", "code", "message"]) {
      if (typeof issue[field] !== "string") {
        throw new Error(`validate returned issue with invalid ${field}`);
      }
    }
  }
}

// Each bundle in dist/ has its own EnvguardrError class, so match by name.
export function assertEnvguardrError(err, code) {
  if (err?.name !== "EnvguardrError" || err.code !== code) {
    throw err;
  }
}
