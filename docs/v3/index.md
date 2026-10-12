<section class="hero">
  <img src="{{base}}assets/logo-envguardr.png" alt="envguardr" class="hero-logo" />
  <p class="tagline">You deployed. An env var was missing. Prod crashed at 3am.<br>envguardr stops that before it happens.</p>
  <div class="terminal">
    <div class="terminal-bar">
      <span></span><span></span><span></span>
    </div>
    <pre><code><span class="dim">$</span> npx envguardr validate ./env.schema.js&#10;
<span class="error">❌ API_URL is required</span>
<span class="error">❌ PORT must be a valid number</span>
<span class="success">✅ All environment variables are valid.</span></code></pre>
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
      <p>Fails CI before a misconfigured app ever reaches production. Exits with code 1 on failure.</p>
    </div>
    <div class="feature">
      <h3>Strict by design</h3>
      <p>Rejects <code>1e5</code>, <code>yes</code>, <code>on</code> — no silent type coercion surprises.</p>
    </div>
    <div class="feature">
      <h3>Zero config overhead</h3>
      <p>One plain JS file, no classes, decorators, or build steps required.</p>
    </div>
    <div class="feature">
      <h3>Works everywhere</h3>
      <p>npm script, CI step, Docker image (amd64 + arm64), or <code>npx</code>.</p>
    </div>
    <div class="feature">
      <h3>No telemetry</h3>
      <p>Validation runs locally. Environment data never leaves your machine.</p>
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

Create an `env.schema.js` file:

```js
export default {
  API_URL: { type: 'url', required: true },
  PORT:    { type: 'number', default: 3000 },
  NODE_ENV: {
    type: { enum: ['development', 'production', 'test'] },
    default: 'development',
  },
}
```

Run validation:

```bash
npx envguardr validate ./env.schema.js
```

## Install

```bash
npm install --save-dev envguardr
```

## Schema

Schemas are plain JavaScript modules with full access to built-in validators:

```js
import { validators } from 'valitype'

export default {
  API_URL: { type: 'url', required: true },
  PORT:    { type: 'number', default: 3000 },
  NODE_ENV: {
    type: { enum: ['development', 'production', 'test'] },
    default: 'development',
  },
  DEBUG:   { type: 'boolean', default: false },
  API_KEY: {
    type: 'custom',
    validator: validators.regex(/^[A-Za-z0-9]{32}$/, 'Must be 32 alphanumeric characters'),
    required: true,
  },
}
```

## CI/CD

```yaml
- name: Validate environment
  run: npx envguardr validate ./env.schema.js
```

Or as an npm script:

```json
{
  "scripts": {
    "check-env": "envguardr validate ./env.schema.js"
  }
}
```

<h2 id="docker">Docker</h2>

```bash
docker run --rm \
  --env-file .env \
  -v "$PWD:/app" \
  docker.io/fontebasso/envguardr validate ./env.schema.js
```

| Platform | Status |
| --- | --- |
| `linux/amd64` | Supported |
| `linux/arm64` | Supported |

## Validation types

| Type | Accepts | Notes |
| --- | --- | --- |
| `string` | Any string | |
| `number` | `"3000"` | Decimal only; rejects `0xff`, `1e5` |
| `boolean` | `"true"` / `"false"` | Strict; rejects `1`, `yes`, `on` |
| `url` | `"https://..."` | Requires http or https |
| `{ enum: string[] }` | One listed value | |
| `custom` | Custom validator | |

All types support `required` and `default`.

## Built-in validators

```ts
validators.regex(/^[A-Z]{3}$/, 'Must be 3 uppercase letters')
validators.range(1, 65535, 'Must be a valid port')
validators.oneOf(['us-east-1', 'eu-west-1'], 'Unsupported region')
validators.date('YYYY-MM-DD', 'Invalid date format')
validators.json('Must be valid JSON')
validators.awsArn('lambda', 'Must be a valid Lambda ARN')
validators.all(validators.regex(/^[A-Z]/), validators.oneOf(['Alpha', 'Beta']))
```

</div>
</section>

<section id="security" class="security-section">
<div class="container">

## Security & supply chain

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
