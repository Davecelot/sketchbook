// @ts-check
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { configs as litConfigs } from 'eslint-plugin-lit';
import litA11y from 'eslint-plugin-lit-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typedFiles = ['src/**/*.ts', 'playwright/**/*.ts', 'harness/**/*.mts', 'scripts/**/*.mts', 'apps/docs/scripts/**/*.mts', 'apps/docs/content/_assets/docs.ts', '.claude/hooks/**/*.mts', '.claude/skills/*/hooks/**/*.mts'];
// The compiled .mjs beside each .mts: scripts/build-harness.mjs lists them in a .gitignore (absent in a project, which has no harness sources).
const compiled = ['harness', 'scripts', 'apps/docs/scripts', '.claude'].flatMap((dir) => {
  const file = path.join(import.meta.dirname, dir, '.gitignore');
  return existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter((line) => line.startsWith('/')).map((line) => dir + line) : [];
});
const projects = ['./tsconfig.stories.json', './tsconfig.tools.json', './tsconfig.harness.json', './apps/docs/tsconfig.browser.json'].filter((file) => existsSync(path.join(import.meta.dirname, file)));

export default tseslint.config(
  { ignores: ['dist/', 'storybook-static/', 'site-dist/', '.claude/worktrees/', 'generated/', 'playwright/playwright-report/', '**/*.styles.ts', 'src/index.ts', 'harness/test/fixtures/', 'move-to-.claude/', ...compiled] },
  { languageOptions: { parserOptions: { tsconfigRootDir: import.meta.dirname } } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeCheckedOnly.map((config) => ({ ...config, files: typedFiles })),
  { files: typedFiles, languageOptions: { parserOptions: { project: projects } } },
  // node:test collects test() itself; awaiting each top-level call would serialize the file.
  { files: ['harness/test/**/*.mts'], rules: { '@typescript-eslint/no-floating-promises': ['error', { allowForKnownSafeCalls: [{ from: 'package', package: 'node:test', name: ['test', 'describe', 'it'] }] }] } },
  prettier,
  { files: ['src/**/*.ts', '.storybook/**/*.ts'], languageOptions: { globals: globals.browser } },
  { files: ['src/**/*.ts'], ...litConfigs['flat/recommended'] },
  // lit-a11y ships no flat config, so its recommended rules are wired by hand.
  { files: ['src/**/*.ts'], plugins: { 'lit-a11y': litA11y }, rules: litA11y.configs.recommended.rules },
  { files: ['scripts/**/*.{mjs,mts}', 'apps/docs/scripts/**/*.{mjs,mts}', 'harness/**/*.{mjs,mts}', '.claude/**/*.{js,mjs,mts}', '*.config.{js,ts}'], languageOptions: { globals: globals.node } },
  { files: ['harness/templates/project/.storybook/**/*.ts'], languageOptions: { globals: globals.browser } },
  { files: ['apps/docs/content/_assets/docs.ts'], languageOptions: { globals: globals.browser } },
  // Node scripts that also hand functions to page.evaluate, which run in the browser.
  { files: ['docs/research/**/*.mjs', 'harness/lib/design/compare.mts'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
    },
  },
);
