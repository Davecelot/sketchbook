import type { Config } from 'prettier';

const config: Config = {
  arrowParens: 'always',
  printWidth: 120,
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  tabWidth: 2,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: ['<TYPES>', '<THIRD_PARTY_MODULES>', '', '^[../]', '^[./]'],
  importOrderParserPlugins: ['typescript', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.9.0',
};

export default config;
