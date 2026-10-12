<section class="hero">
  <img src="{{base}}assets/logo-envguardr.png" alt="envguardr" class="hero-logo" />
  <p class="tagline">You deployed. An env var was missing. Prod crashed at 3am.<br>envguardr stops that before it happens — in any language, CI or deploy, without ever printing a value.</p>
  <div class="terminal">
    <div class="terminal-bar">
      <span></span><span></span><span></span>
    </div>
    <pre><code><span class="dim">$</span> npx envguardr validate ./env.schema.yaml&#10;
<span class="error">❌ API_URL is required</span>
<span class="error">❌ PORT must be less than or equal to 65535</span></code></pre>
  </div>
  <div class="hero-actions">
    <a href="#guide" class="btn btn-primary">Get Started</a>
    <a href="https://www.npmjs.com/package/envguardr" target="_blank" rel="noopener" class="btn btn-secondary">npm</a>
    <a href="https://hub.docker.com/r/fontebasso/envguardr" target="_blank" rel="noopener" class="btn btn-secondary">Docker Hub</a>
  </div>
</section>

<section class="features">
  <div class="features-grid">
    <div class="feature">
      <h3>Blocks bad deploys</h3>
      <p>Exits with <code>1</code> when the environment is invalid and <code>2</code> when it cannot validate. Any CI or deploy step can gate on it.</p>
    </div>
    <div class="feature">
      <h3>Any language</h3>
      <p>The schema is a YAML file. No JavaScript to write, nothing executed.</p>
    </div>
    <div class="feature">
      <h3>Never prints values</h3>
      <p>Errors name the variable and the rule, never the value. Safe to run next to secrets.</p>
    </div>
    <div class="feature">
      <h3>Strict by design</h3>
      <p>Rejects <code>1e5</code>, <code>yes</code>, <code>on</code>. A typo in the schema fails instead of being ignored.</p>
    </div>
    <div class="feature">
      <h3>Machine-readable</h3>
      <p><code>--format json</code> gives a stable contract for annotations, alerts or custom gates.</p>
    </div>
    <div class="feature">
      <h3>Supply chain transparency</h3>
      <p>Signed images, SBOM, and provenance — fully auditable end to end.</p>
    </div>
  </div>
</section>

<section id="guide" class="docs">
<div class="container">

## Quick start

Create an `env.schema.yaml` file:

```yaml
version: 1

variables:
  API_URL:
    type: url
    required: true

  PORT:
    type: number
    default: 3000
    min: 1
    max: 65535

  NODE_ENV:
    type: enum
    values: [development, production, test]
    default: development
```

Validate the current environment:

```bash
npx envguardr validate ./env.schema.yaml
```

Or, without Node.js:

```bash
docker run --rm -v "$PWD:/app:z" -e API_URL -e PORT -e NODE_ENV \
  docker.io/fontebasso/envguardr:4 validate ./env.schema.yaml
```

envguardr only validates the environment of its own process. Load the variables any way you already do — CI secrets, `docker run -e`, an orchestrator — and run it there.

## Install

```bash
npm install --save-dev envguardr
```

```bash
docker pull docker.io/fontebasso/envguardr:4
```

## Schema

A schema has a `version` and a `variables` mapping. JSON files are accepted too.

```yaml
version: 1

variables:
  API_KEY:
    type: string
    required: true
    pattern: '^[A-Za-z0-9]{32}$'
    message: API_KEY must be 32 alphanumeric characters

  CONFIG:
    type: string
    format: json

  DEBUG:
    type: boolean
    default: false
```

### Types and constraints

| Type | Accepts | Constraints |
| --- | --- | --- |
| `string` | Any string | `pattern`, `minLength`, `maxLength`, `format` |
| `number` | Decimal numbers; rejects `0xff`, `1e5` | `min`, `max` |
| `boolean` | `true` or `false` only | — |
| `url` | `http` or `https` URLs | — |
| `enum` | One of `values` (required) | — |

| Constraint | Meaning |
| --- | --- |
| `pattern` | JavaScript regular expression. Not anchored: use `^...$` to match the whole value. |
| `minLength`, `maxLength` | Inclusive, counted in Unicode characters. |
| `format` | `json` (valid JSON text) or `date` (a real calendar date, `YYYY-MM-DD`). |
| `min`, `max` | Inclusive. |

Every variable also accepts:

| Key | Meaning |
| --- | --- |
| `required` | `true` makes a missing variable an error. Defaults to `false`. |
| `default` | Value used when the variable is missing. Cannot be combined with `required: true`. |
| `message` | Fixed text that replaces the error message for this variable. |

### Rules

- A variable is missing only when it is not set at all. `VAR=` (empty) is set and is validated.
- A missing optional variable without a `default` is not validated.
- A `default` must satisfy the variable's own rules; otherwise the schema is invalid.
- The schema is strict: unknown keys, constraints that do not belong to the type and invalid values are errors (exit `2`), never ignored.
- YAML 1.2 is used, so `yes`, `no`, `on` and `off` are plain strings.

## Output and exit codes

| Exit code | Meaning |
| --- | --- |
| `0` | The environment is valid |
| `1` | The environment is invalid |
| `2` | Could not validate: usage error, missing or malformed schema, invalid schema, internal error |

By default, problems go to stderr, one per line, and success to stdout. With `--format json`, a single JSON object goes to stdout:

```json
{ "ok": true, "issues": [] }
```

```json
{
  "ok": false,
  "issues": [
    { "key": "PORT", "code": "ABOVE_MAX", "message": "PORT must be less than or equal to 65535" }
  ]
}
```

```json
{
  "ok": false,
  "error": { "code": "SCHEMA_INVALID", "message": "Unknown key 'requred'", "path": "variables.PORT" }
}
```

| Issue code | When |
| --- | --- |
| `REQUIRED` | A required variable is missing |
| `INVALID_NUMBER`, `INVALID_BOOLEAN`, `INVALID_URL`, `INVALID_ENUM` | The value does not match the type |
| `PATTERN_MISMATCH` | `pattern` does not match |
| `TOO_SHORT`, `TOO_LONG` | `minLength` / `maxLength` |
| `BELOW_MIN`, `ABOVE_MAX` | `min` / `max` |
| `INVALID_FORMAT` | `format` |

| Error code | When |
| --- | --- |
| `USAGE_ERROR` | Wrong command, option or arguments |
| `SCHEMA_NOT_FOUND` | The schema file cannot be read |
| `SCHEMA_PARSE_ERROR` | The file is not a single valid YAML document |
| `SCHEMA_INVALID` | The schema breaks a rule above; `path` points to it |
| `INTERNAL_ERROR` | Unexpected failure; no details are printed |

Codes are part of the public contract and only change in a major version.

<h2 id="docker">Docker</h2>

```bash
docker run --rm \
  --env-file .env \
  -v "$PWD:/app:z" \
  docker.io/fontebasso/envguardr:4 validate ./env.schema.yaml
```

| Platform | Status |
| --- | --- |
| `linux/amd64` | Supported |
| `linux/arm64` | Supported |

## Recipes

envguardr has no integrations of its own. These are ways to run it where your variables already are.

### GitHub Actions

```yaml
- name: Validate environment
  run: npx envguardr validate ./env.schema.yaml
  env:
    API_URL: ${{ vars.API_URL }}
    API_KEY: ${{ secrets.API_KEY }}
```

### GitLab CI

```yaml
validate-env:
  image: node:24
  script:
    - npx envguardr validate ./env.schema.yaml
```

The envguardr image is distroless and has no shell, so it cannot run a `script:` block.

### Kubernetes

Run it as an init container with the same variables as the app. If validation fails, the pod never starts and the rollout stops.

```yaml
initContainers:
  - name: envguardr
    image: docker.io/fontebasso/envguardr:4
    args: ["validate", "/schema/env.schema.yaml"]
    envFrom:
      - configMapRef: { name: app-config }
      - secretRef: { name: app-secrets }
    volumeMounts:
      - { name: env-schema, mountPath: /schema, readOnly: true }
```

### .env files

envguardr does not read `.env` files. Load them with the tool you already use:

```bash
npx dotenv-cli -e .env.production -- npx envguardr validate ./env.schema.yaml
docker run --rm --env-file .env.production -v "$PWD:/app:z" docker.io/fontebasso/envguardr:4 validate ./env.schema.yaml
```

<h2 id="migrating">Migrating from v3</h2>

| v3 (`env.schema.js`) | v4 (`env.schema.yaml`) |
| --- | --- |
| `type: { enum: [...] }` | `type: enum` + `values: [...]` |
| `validators.regex(/re/)` | `pattern: 're'` |
| `validators.range(a, b)` | `min: a`, `max: b` |
| `validators.oneOf([...])` | `type: enum` + `values: [...]` |
| `validators.json()` | `format: json` |
| `validators.date('YYYY-MM-DD')` | `format: date` |
| `validators.awsArn(...)` | `pattern: '^arn:aws:...'` |
| `type: 'custom'` with a function | No equivalent: use `pattern`, or stay on v3 |

Other changes:

- The schema is data, not code: envguardr no longer imports a JavaScript file.
- Exit code `2` now means "could not validate"; `1` only means an invalid environment.
- The Docker `latest` tag points to v4. Pin `docker.io/fontebasso/envguardr:3` to stay on v3.

v3 receives security fixes only, for six months after the release of v4.0.0. Its documentation stays at [v3]({{base}}v3/).

</div>
</section>

<section id="security" class="security-section">
<div class="container">

## Security & supply chain

- Environment values are never printed, in any output format or error
- The schema is never executed
- npm Trusted Publishing with provenance (OIDC-based, no long-lived tokens)
- Docker images with provenance and SBOM
- Signed images via cosign / Sigstore (keyless, OIDC)
- Distroless, non-root containers
- GitHub Actions pinned by SHA
- CodeQL scanning enabled

### Verifying container images

```bash
cosign verify \
  --certificate-identity-regexp "https://github.com/fontebasso/envguardr/.github/workflows/.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  docker.io/fontebasso/envguardr:latest
```

To report a vulnerability, see <a href="https://github.com/fontebasso/envguardr/blob/main/SECURITY.md" target="_blank" rel="noopener">SECURITY.md</a>.

</div>
</section>
