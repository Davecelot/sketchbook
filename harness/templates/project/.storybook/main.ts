import { existsSync } from 'node:fs';
import type { StorybookConfig } from '@storybook/web-components-vite';

/** Preview adapter (default: Storybook). Stories live next to each component (src/components/<name>/<Name>.stories.ts). */
const config: StorybookConfig = {
  framework: { name: '@storybook/web-components-vite', options: {} },
  staticDirs: existsSync(new URL('../brand', import.meta.url)) ? ['../brand'] : [],
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  core: { disableTelemetry: true },
};
export default config;
