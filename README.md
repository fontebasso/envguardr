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
- Support for custom validators with helpful utilities
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
import { validators } from 'valitype';

export default {
  // Basic types
  API_URL: { type: 'url', required: true },
  NODE_ENV: {
    type: { enum: ['development', 'production'] },
    default: 'development'
  },
  PORT: { type: 'number', default: 3000 },
  DEBUG: { type: 'boolean', default: false },
  VERSION: { type: 'string', required: true },
  
  // Custom validators
  API_KEY: { 
    type: 'custom', 
    validator: validators.regex(/^[A-Za-z0-9]{32}$/, 'API_KEY must be a 32-character alphanumeric string'),
    required: true
  },
  
  CACHE_TTL: {
    type: 'custom',
    validator: validators.range(0, 86400, 'Cache TTL must be between 0 and 86400 seconds'),
    default: '3600'
  },
  
  AWS_S3_BUCKET: {
    type: 'custom',
    validator: validators.awsArn('s3', 'Must be a valid S3 bucket ARN'),
    required: true
  }
}
```

### What it does

- Validates all variables defined in the schema
- Fails if any required variable is missing or invalid
- Uses defaults if provided
- Logs output like:

```bash
❌ API_URL is required and must be a valid URL
❌ API_KEY must be a 32-character alphanumeric string
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
  | { type: 'custom'; validator: CustomValidatorFn; required?: boolean; default?: string; errorMessage?: string }
```

## Custom Validators

The library includes several built-in validator utilities:

### Regex Validator
```typescript
validators.regex(/^[A-Z]{3}$/, 'Must be 3 uppercase letters')
```

### Range Validator
```typescript
validators.range(1, 100, 'Value must be between 1 and 100')
```

### OneOf Validator
```typescript
validators.oneOf(['apple', 'banana', 'orange'], 'Must be a valid fruit')
```

### Date Validator
```typescript
validators.date('YYYY-MM-DD', 'Must be a valid date')
```

### JSON Validator
```typescript
validators.json('Must be valid JSON')
```

### AWS ARN Validator
```typescript
validators.awsArn('lambda', 'Must be a valid Lambda ARN')
```

### Combining Validators
```typescript
validators.all(
  validators.regex(/^[A-Z]/),
  validators.oneOf(['Alpha', 'Beta', 'Gamma'])
)
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This library is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
