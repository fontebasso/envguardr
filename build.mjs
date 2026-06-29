import { build } from 'esbuild'
import { rmSync } from 'fs'

rmSync('dist', { recursive: true, force: true })

await build({
  entryPoints: ['src/cliHandler.ts'],
  outfile: 'dist/src/cliHandler.js',
  bundle: true,
  external: ['valitype'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
  minify: true,
})

await build({
  entryPoints: ['bin/cli.ts'],
  outfile: 'dist/bin/cli.js',
  bundle: true,
  external: ['valitype'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
  minify: true,
})

await build({
  entryPoints: ['src/core/validate-env.ts'],
  outfile: 'dist/src/core/validate-env.js',
  bundle: true,
  external: ['valitype'],
  format: 'esm',
  platform: 'node',
  target: 'node18',
})