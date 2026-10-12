<p align="center">
  <img src="assets/logo-envguardr.png" alt="envguardr" width="256" />
</p>
<hr>

<p align="center">
  <a href="https://github.com/fontebasso/envguardr/actions/workflows/tests.yml"><img src="https://github.com/fontebasso/envguardr/actions/workflows/tests.yml/badge.svg" alt="tests" /></a>
  <a href="https://github.com/fontebasso/envguardr/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/fontebasso/envguardr/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" /></a>
  <a href="https://coveralls.io/github/fontebasso/envguardr?branch=main"><img src="https://coveralls.io/repos/github/fontebasso/envguardr/badge.svg?branch=main" alt="Coverage Status" /></a>
  <a href="https://www.npmjs.com/package/envguardr"><img src="https://img.shields.io/npm/v/envguardr" alt="npm" /></a>
  <a href="https://www.npmjs.com/package/envguardr"><img src="https://img.shields.io/npm/dw/envguardr" alt="downloads" /></a>
  <a href="https://www.npmjs.com/package/envguardr"><img src="https://img.shields.io/npm/unpacked-size/envguardr" alt="size" /></a>
  <a href="https://hub.docker.com/r/fontebasso/envguardr"><img src="https://img.shields.io/docker/pulls/fontebasso/envguardr" alt="docker pulls" /></a>
  <a href="https://github.com/fontebasso/envguardr/stargazers"><img src="https://img.shields.io/github/stars/fontebasso/envguardr?style=flat" alt="stars" /></a>
  <a href="https://www.bestpractices.dev/projects/13426"><img src="https://www.bestpractices.dev/projects/13426/badge" alt="OpenSSF Best Practices" /></a>
  <a href="https://scorecard.dev/viewer/?uri=github.com/fontebasso/envguardr"><img src="https://api.scorecard.dev/projects/github.com/fontebasso/envguardr/badge" alt="OpenSSF Scorecard" /></a>
</p>


You deployed. An env var was missing. Prod crashed at 3am.

**envguardr** stops that before it happens: it validates environment variables against a declarative schema, in any language, CI or deploy, and never prints their values.

```bash
npx envguardr validate ./env.schema.yaml
```

```txt
❌ API_URL is required
❌ PORT must be less than or equal to 65535
```

Exits with `0` when the environment is valid, `1` when it is invalid and `2` when it cannot validate.

📖 **Documentation:** https://fontebasso.github.io/envguardr/

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

Or with Docker, without Node.js:

```bash
docker run --rm -v "$PWD:/app:z" -e API_URL -e PORT -e NODE_ENV \
  docker.io/fontebasso/envguardr:4 validate ./env.schema.yaml
```

## Why envguardr

- **Any language**: the schema is a YAML file; nothing is executed
- **Never prints values**: errors name the variable and the rule, never the value
- **Strict by design**: rejects `1e5`, `yes`, `on`; schema typos fail instead of being ignored
- **Composable**: stable exit codes and `--format json`, no integrations baked in
- **No telemetry**: validation runs locally and sends nothing anywhere
- **Supply chain transparency**: signed images, SBOM, provenance — auditable end to end

## Schema

| Type | Constraints |
| --- | --- |
| `string` | `pattern`, `minLength`, `maxLength`, `format` (`json`, `date`) |
| `number` | `min`, `max` |
| `boolean` | — |
| `url` | — (any `scheme://` URL per RFC 3986/3987) |
| `enum` | `values` (required) |

Every variable accepts `required`, `default` and `message`. See the [schema reference](https://fontebasso.github.io/envguardr/#guide).

## Output

```bash
npx envguardr validate ./env.schema.yaml --format json
```

```json
{"ok":false,"issues":[{"key":"PORT","code":"ABOVE_MAX","message":"PORT must be less than or equal to 65535"}]}
```

## Docker

```bash
docker pull docker.io/fontebasso/envguardr:4
docker pull ghcr.io/fontebasso/envguardr:4
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

## Upgrading from v3

v4 replaces the JavaScript schema with YAML. See the [migration guide](https://fontebasso.github.io/envguardr/#migrating) — the v3 documentation stays at https://fontebasso.github.io/envguardr/v3/. v3 receives security fixes only, for six months after the release of v4.0.0.

## Security and supply chain

- Environment values are never printed
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
