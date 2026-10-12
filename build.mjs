import { build } from 'esbuild'
import { rmSync } from 'fs'

rmSync('dist', { recursive: true, force: true })

await build({
  entryPoints: ['bin/cli.ts'],
  outfile: 'dist/bin/cli.js',
  bundle: true,
  external: ['valitype', 'yaml'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
  minify: true,
})

await build({
  entryPoints: ['src/validate.ts'],
  outfile: 'dist/src/validate.js',
  bundle: true,
  external: ['valitype', 'yaml'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
})

await build({
  entryPoints: ['src/schema/parse.ts'],
  outfile: 'dist/src/schema/parse.js',
  bundle: true,
  external: ['valitype', 'yaml'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
})

await build({
  entryPoints: ['src/schema/load.ts'],
  outfile: 'dist/src/schema/load.js',
  bundle: true,
  external: ['valitype', 'yaml'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
})
