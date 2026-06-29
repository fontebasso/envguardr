<p>
  <img src="assets/logo-envguardr.png" alt="envguardr" width="256" />
</p>
<hr>

# envguardr

[![tests](https://github.com/fontebasso/envguardr/actions/workflows/tests.yml/badge.svg)](https://github.com/fontebasso/envguardr/actions/workflows/tests.yml)
[![stars](https://img.shields.io/github/stars/fontebasso/envguardr?style=flat)](https://github.com/fontebasso/envguardr/stargazers)
[![npm](https://img.shields.io/npm/v/envguardr)](https://www.npmjs.com/package/envguardr)
[![downloads](https://img.shields.io/npm/dw/envguardr)](https://www.npmjs.com/package/envguardr)
[![size](https://img.shields.io/npm/unpacked-size/envguardr)](https://www.npmjs.com/package/envguardr)
[![license](https://img.shields.io/npm/l/envguardr)](LICENSE)

You deployed. An env var was missing. Prod crashed at 3am.

**envguardr** catches that before it happens — fail-fast environment variable validation that blocks bad deploys at the source.

```bash
npx envguardr validate ./env.schema.js
```

```txt
❌ API_URL is required
❌ PORT must be a valid number
✅ All environment variables are valid.
```

Exits with code `1` on failure. Drop it into any CI pipeline, Dockerfile, or npm script and ship with confidence.

## Quick start

Create an `env.schema.js` file:

```js
export default {
  API_URL: { type: 'url', required: true },
  PORT: { type: 'number', default: 3000 },
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

## Why envguardr

- **Blocks bad deploys**: fails CI before a misconfigured app ever reaches production
- **Strict by design**: rejects `1e5`, `yes`, `on` — no silent type coercion surprises
- **Zero config overhead**: one plain JS file, no classes, decorators, or build steps
- **Works everywhere**: npm script, CI step, Docker image (amd64 + arm64), or `npx`
- **No telemetry**: validation runs locally and does not send environment data anywhere
- **Supply chain transparency**: signed images, SBOM, provenance — auditable end to end

## Install

```bash
npm install --save-dev envguardr
```

Or just use:

```bash
npx envguardr validate ./env.schema.js
```

## Schema

Schemas are plain JavaScript:

```js
import { validators } from 'valitype'

export default {
  API_URL: { type: 'url', required: true },
  PORT: { type: 'number', default: 3000 },
  NODE_ENV: {
    type: { enum: ['development', 'production', 'test'] },
    default: 'development',
  },
  DEBUG: { type: 'boolean', default: false },
  API_KEY: {
    type: 'custom',
    validator: validators.regex(/^[A-Za-z0-9]{32}$/, 'Must be 32 alphanumeric characters'),
    required: true,
  },
}
```

Validate:

```bash
npx envguardr validate ./env.schema.js
```

## CI/CD

```yaml
- name: Validate environment
  run: npx envguardr validate ./env.schema.js
```

Or:

```json
{
  "scripts": {
    "check-env": "envguardr validate ./env.schema.js"
  }
}
```

## Docker

```bash
docker pull docker.io/fontebasso/envguardr
docker pull ghcr.io/fontebasso/envguardr
```

```bash
docker run --rm \
  --env-file .env \
  -v "$PWD:/app:z" \
  docker.io/fontebasso/envguardr validate ./env.schema.js
```

| Platform      | Status    |
| ------------- | --------- |
| `linux/amd64` | Supported |
| `linux/arm64` | Supported |

## Node.js support

| Node.js | Status    |
| ------- | --------- |
| 22      | Supported |
| 24      | Supported |
| 26      | Supported |

## Validation types

| Type                 | Accepts              | Notes                                  |
| -------------------- | -------------------- | -------------------------------------- |
| `string`             | Any string           |                                        |
| `number`             | `"3000"`             | Decimal only; rejects `0xff` and `1e5` |
| `boolean`            | `"true"` / `"false"` | Strict; rejects `1`, `yes`, `on`       |
| `url`                | `"https://..."`      | Requires `http` or `https`             |
| `{ enum: string[] }` | One listed value     |                                        |
| `custom`             | Custom validator     |                                        |

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

## Security and supply chain

- npm Trusted Publishing with provenance
- Docker images with provenance + SBOM
- Signed images (cosign / Sigstore)
- Distroless, non-root containers
- GitHub Actions pinned by SHA
- CodeQL scanning enabled

## Verifying container images

```bash
cosign verify \
  --certificate-identity-regexp "https://github.com/fontebasso/envguardr/.github/workflows/.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  docker.io/fontebasso/envguardr:latest
```

```bash
cosign verify \
  --certificate-identity-regexp "https://github.com/fontebasso/envguardr/.github/workflows/.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  ghcr.io/fontebasso/envguardr:latest
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Found a bug? [Open an issue](https://github.com/fontebasso/envguardr/issues/new).

## Security

See [SECURITY.md](SECURITY.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT — see [LICENSE](LICENSE).

---

If envguardr helps you prevent a bad deploy, consider leaving a star.
