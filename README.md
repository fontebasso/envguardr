# envguardr

[![tests](https://github.com/fontebasso/envguardr/actions/workflows/tests.yml/badge.svg)](https://github.com/fontebasso/envguardr/actions/workflows/tests.yml)
[![npm](https://img.shields.io/npm/v/envguardr)](https://www.npmjs.com/package/envguardr)
[![license](https://img.shields.io/npm/l/envguardr)](LICENSE)

**Catch broken env vars before your app starts.**

```bash
npx envguardr validate ./env.schema.js
```

```
❌ DATABASE_URL is required
❌ PORT must be a valid number
✅ All environment variables are valid.
```

Exits with code `1` on failure — drop it into any CI pipeline and ship with confidence.

---

## Install

```bash
npm install --save-dev envguardr
```

## Schema

```js
// env.schema.js
import { validators } from 'valitype';

export default {
  DATABASE_URL: { type: 'url',    required: true },
  PORT:         { type: 'number', default: 3000 },
  NODE_ENV:     { type: { enum: ['development', 'production', 'test'] }, default: 'development' },
  DEBUG:        { type: 'boolean', default: false },
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
"scripts": {
  "check-env": "envguardr validate ./env.schema.js"
}
```

## Types

| Type | Accepts | Notes |
|---|---|---|
| `string` | Any string | |
| `number` | `"3000"` | Decimal only — rejects `0xff`, `1e5` |
| `boolean` | `"true"` / `"false"` | Strict — no `1`, `yes`, `on` |
| `url` | `"https://..."` | Requires `http` or `https` |
| `{ enum: string[] }` | One of the listed values | |
| `custom` | — | Bring your own logic |

All types accept `required?: boolean` and `default?: T`.

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).