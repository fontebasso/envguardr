# Security Policy

## Usage Guidelines

`envguardr` is a CLI tool designed to validate environment variables at runtime or build time using strict type checking. While it is built to be safe and transparent, security depends on how it's integrated into your workflows.

- Do not embed secrets or credentials in `.env.example` or validation schemas.
- Never commit actual `.env` files or production values to version control.
- Use `envguardr` as part of your CI/CD pipeline to fail fast when misconfigurations occur.
- Make sure schemas only define the structure, not sensitive data.
- Prefer minimal privileges and tight scopes in credentials managed via environment variables.

## Reporting Vulnerabilities

If you discover a security issue, please do **not** open a GitHub issue. Instead, contact:

**[samuel.txd@gmail.com](mailto:samuel.txd@gmail.com)**

We will respond promptly and handle disclosures responsibly.
