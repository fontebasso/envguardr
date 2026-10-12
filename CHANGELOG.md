# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-10-12

### BREAKING

* The schema is now a declarative YAML (or JSON) file with `version: 1`. JavaScript schemas are no longer loaded or executed.
* Removed `type: 'custom'` validator functions and `validators.awsArn`; use `pattern` instead.
* `type: url` now follows RFC 3986 with RFC 3987 international characters and requires `scheme://`: any scheme is accepted (`postgres://`, `redis://`…), while values the old parser tolerated, such as unencoded spaces, are rejected.
* `required: true` now also rejects an empty value (`VAR=`), so an unset CI secret no longer passes.
* Exit code `2` now means the environment could not be validated (usage error, missing, malformed or invalid schema, internal error). Exit code `1` only means an invalid environment.
* The Docker `latest` tag now points to v4. Pin `docker.io/fontebasso/envguardr:3` to stay on v3.

### Added

* `--format json` with a stable contract: `issues` with `key`, `code` and `message`, or an `error` with `code` and, for schema errors, `path`.
* Constraints `pattern`, `minLength`, `maxLength`, `format` (`json`, `date`), `min` and `max`, and a per-variable `message`.
* `pattern` uses RE2 syntax (via `re2js`): linear time, Unicode classes such as `\p{L}`, no lookahead or backreferences.
* Strict schema validation: unknown keys, misplaced constraints and defaults that break their own rules are errors.
* `--version`.
* Versioned documentation site, with v3 kept at `/v3/`.

### Changed

* The npm package now ships only the CLI binary (`dist/bin/`).
* Updated `typescript-eslint` to `8.71.1`, `brace-expansion` to `5.0.12` and the `ossf/scorecard-action` pin to `v2.5.0`.

### Security

* Environment values are never printed, in any output or error; covered by a property-based test, including every exit `2` path.
* The Docker image runs as the distroless non-root user (uid `65532`); the release checks it.
* `pattern` cannot hang on values from the environment: RE2 matches in linear time.

### Maintenance

* Maintenance releases of an older major are published under the npm dist-tag `release-<major>` and no longer move the npm or Docker `latest` tags.
* The release smoke test fails if an environment value appears in the output.

### Support

* v3 receives security fixes only, for six months after the release of v4.0.0.

## [3.1.8] - 2026-10-11

### Changed

* Updated `vitest` and `@vitest/coverage-v8` to `5.0.3`.
* Updated `eslint` to `10.12.0`, `@typescript-eslint/*` to `8.70.0`, `prettier` to `3.9.10`, `tsx` to `4.23.15`, `fast-check` to `4.10.2` and `@types/node` to `26.6.5`.
* Updated the `distroless/nodejs24-debian13` and `node` base image digests.
* Updated GitHub Actions pins (`codeql-action`, `setup-node`, `upload-artifact`, `deploy-pages`, `build-push-action`, `setup-buildx-action`, `setup-qemu-action`).

### Maintenance

* Added Coveralls coverage reporting with enforced thresholds.
* No changes to the public API, CLI behavior, Docker usage, or validation logic.

## [3.1.7] - 2026-08-24

### Changed

* Updated `eslint` to `10.9.0`.
* Updated `vitest` and `@vitest/coverage-v8` to `4.1.11`.
* Updated `highlight.js` to `11.12.0` on the documentation page.
* Updated the `distroless/nodejs24-debian13` base image digest.

### Maintenance

* Added the OpenSSF Best Practices badge to the README.
* Kept development tooling and base image up to date.
* No changes to the public API, CLI behavior, Docker usage, or validation logic.

## [3.1.6] - 2026-08-12

### Changed

* Updated `esbuild` to `0.28.2`.
* Updated `@types/node` to `26.2.0`.
* Updated `typescript-eslint` to `8.67.0`.
* Updated `tsx` to `4.23.12`.
* Updated `eslint` to `10.8.1`.
* Updated `prettier` to `3.9.6`.
* Updated `fast-check` to `4.9.0`.
* Updated `vitest` to `4.1.10`.
* Updated the `distroless/nodejs24-debian13` base image digest.

### Maintenance

* Kept development tooling, base image and Node.js type definitions up to date.
* No changes to the public API, CLI behavior, Docker usage, or validation logic.

## [3.1.5] - 2026-07-05

### Changed

* Updated `tsx` to `4.23.0`.
* Updated `@types/node` to `26.1.0`.

### Maintenance

* Kept development tooling and Node.js type definitions up to date.
* No changes to the public API, CLI behavior, Docker usage, or validation logic.

## [3.1.4] - 2026-06-30

### Added

- Property-based fuzz tests with fast-check (4 targets: validation, custom validators, arbitrary schema, encoding edge cases)
- `fuzz` CI workflow running property-based tests against Node.js 22, 24 and 26

## [3.1.3] - 2026-06-29

> 3.1.0, 3.1.1 and 3.1.2 were tagged but not published due to Docker build errors.

### Added

- `validateEnv(schema, env)` as a pure validation function
- `loadSchemaFromPath(schemaPath, dynamicImport?)` for schema loading
- New exported types: `EnvSchema`, `EnvValues`, `EnvValidationIssue`, `EnvValidationResult`
- OpenSSF Scorecard workflow
- Renovate Bot configuration
- `CODEOWNERS`
- Jazzer.js fuzzing with 4 targets: validation, custom validators, arbitrary schema, encoding edge cases

### Changed

- Updated `valitype` from `2.0.2` to `3.0.0`
- Docker images pinned by SHA digest
- SRI hashes added to documentation assets
- GitHub Actions permissions scoped at job level

## [3.0.0] - 2026-06-28

### Breaking

- Drop Node.js 20 support (end-of-life)

### Added

- Node.js 26 support

## [2.2.1] - 2026-06-28

### Changed

- Project logo added to README

## [2.2.0] - 2026-06-28

### Added

- Multi-architecture Docker image: `linux/amd64` and `linux/arm64`

## [2.1.0] - 2026-06-28

### Added

- Docker image published to Docker Hub (`docker.io/fontebasso/envguardr`) and GHCR (`ghcr.io/fontebasso/envguardr`)
- Distroless, non-root container image (`gcr.io/distroless/nodejs24-debian12:nonroot`)
- Release workflow with parallel npm and Docker publishing jobs
- Preflight job: version check, build, tests, npm pack dry-run, Docker smoke tests
- SLSA Build Level 2 provenance and SBOM for Docker images
- Keyless image signing via cosign / Sigstore

## [2.0.0] - 2026-06-28

### Breaking

- Minimum Node.js version raised to 20

### Added

- npm Trusted Publishing via OIDC (no long-lived tokens)
- Monthly Node.js version audit workflow (opens issue on version drift)

## [1.x]

See [GitHub releases](https://github.com/fontebasso/envguardr/releases) for earlier history.
