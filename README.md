# envguardr

[![tests](https://github.com/fontebasso/envguardr/actions/workflows/tests.yml/badge.svg)](https://github.com/fontebasso/envguardr/actions/workflows/tests.yml)
[![npm](https://img.shields.io/npm/v/envguardr)](https://www.npmjs.com/package/envguardr)
[![npm audit signatures](https://img.shields.io/badge/npm%20audit-signed%20%26%20attested-brightgreen?logo=npm)](https://docs.npmjs.com/generating-provenance-statements)
[![license](https://img.shields.io/npm/l/envguardr)](LICENSE)

**Fail-fast CLI to validate environment variables using a strict schema.**

`envguardr` is a lightweight CLI that validates environment variables at build-time or runtime using a schema authored in TypeScript and compiled to JavaScript. Built on top of [valitype](https://www.npmjs.com/package/valitype), it helps catch misconfigurations early and integrate safely into CI/CD pipelines or local builds.

## Features

- CLI for validating `process.env`
- Built with strict runtime types (string, number, boolean, url, enum)
- Validates required variables or applies defaults
- Fails fast with clear error messages
- Ideal for CI/CD pipelines or local builds

## Installation

```bash
npm install --save-dev envguardr
```

## Usage

```bash
npx envguardr validate ./env.schema.js
```

You can also add it as a script in your `package.json`:

```json
"scripts": {
  "check-env": "envguardr validate ./env.schema.js"
}
```

### Example Schema

```js
export default {
  API_URL: { type: 'url', required: true },
  NODE_ENV: {
    type: { enum: ['development', 'production'] },
    default: 'development'
  },
  PORT: { type: 'number', default: 3000 },
  DEBUG: { type: 'boolean', default: false },
  VERSION: { type: 'string', required: true }
}
```

### What it does

- Validates all variables defined in the schema
- Fails if any required variable is missing or invalid
- Uses defaults if provided
- Logs output like:

```bash
❌ API_URL is required and must be a valid URL
❌ VERSION is required
✅ All environment variables are valid.
```

> Returns exit code 1 on failure — perfect for CI pipelines.

## Types

```ts
type Rule =
  | { type: 'string'; required?: boolean; default?: string }
  | { type: 'number'; required?: boolean; default?: number }
  | { type: 'boolean'; required?: boolean; default?: boolean }
  | { type: 'url'; required?: boolean; default?: string }
  | { type: { enum: string[] }; required?: boolean; default?: string }
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
