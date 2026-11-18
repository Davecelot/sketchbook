import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // Library build: ESM + types; lit stays a dependency.
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
  },
  {
    // Browser bundle for no-bundler consumers: registers every element on load, lit inlined.
    // Load generated/css/tokens.css (published as ./tokens.css) in the host document.
    entry: { 'sketchbook': 'src/index.ts' },
    format: ['iife'],
    globalName: 'Sketchbook',
    noExternal: ['lit'],
    minify: true,
    dts: false,
    outExtension: () => ({ js: '.js' }),
  },
]);
