import '../generated/css/fonts.css'; // font source (typography.source) before the tokens that name the family
import '../generated/css/tokens.css';
import '../src/index.ts';
import type { Preview } from '@storybook/web-components-vite';

// Brands (sketchbook brand build): brands.css scopes each brand under [data-brand]. Both globs are empty with a single brand.
import.meta.glob('../generated/css/brands.css', { eager: true });
const brands = Object.keys(import.meta.glob('../brands/*.brand.json')).map((p) => p.replace(/^.*\//, '').replace('.brand.json', ''));

/** Mode switch in the toolbar sets data-theme on <html>, the same hook consumers use. */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode',
      toolbar: { title: 'Mode', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
    ...(brands.length ? { brand: { description: 'Brand', toolbar: { title: 'Brand', icon: 'paintbrush', items: ['default', ...brands], dynamicTitle: true } } } : {}),
  },
  initialGlobals: { theme: 'light', ...(brands.length ? { brand: 'default' } : {}) },
  decorators: [
    (story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme || 'light');
      const brand = context.globals.brand;
      if (brand && brand !== 'default') document.documentElement.setAttribute('data-brand', brand);
      else document.documentElement.removeAttribute('data-brand');
      document.body.style.background = 'var(--sb-color-background)';
      document.body.style.color = 'var(--sb-color-foreground)';
      document.body.style.fontFamily = 'var(--sb-font-family-body)';
      return story();
    },
  ],
  parameters: {
    a11y: { test: 'error' },
    controls: { expanded: true },
  },
  tags: ['autodocs'],
};
export default preview;
