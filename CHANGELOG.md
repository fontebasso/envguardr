# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
