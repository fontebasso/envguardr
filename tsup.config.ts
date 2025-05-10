import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cliHandler.ts', 'bin/cli.ts'],
  outDir: 'dist',
  target: 'node18',
  format: ['esm'],
  splitting: false,
  shims: false,
  clean: true,
  dts: {
    entry: 'src/cliHandler.ts'
  },
  minify: true,
})
