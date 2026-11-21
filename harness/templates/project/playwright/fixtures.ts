import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use, info) => {
    if (info.project.name === 'chromium-alt-brand') {
      // Change foundation values, leaving the semantic and component aliases in the built CSS intact.
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.documentElement.style;
          style.setProperty('--sb-size-24', '28px');
          style.setProperty('--sb-size-32', '38px');
          style.setProperty('--sb-size-36', '42px');
          style.setProperty('--sb-size-40', '48px');
          style.setProperty('--sb-duration-200', '370ms');
        });
      });
    }
    await use(page);
  },
});
