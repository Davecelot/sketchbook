// eslint-plugin-lit-a11y ships no types; this is the part eslint.config.js uses.
declare module 'eslint-plugin-lit-a11y' {
  import type { ESLint, Linter } from 'eslint';

  const plugin: ESLint.Plugin & { configs: { recommended: { rules: Linter.RulesRecord } } };
  export default plugin;
}
