import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use, info) => {
    if (info.project.name === 'chromium-alt-brand') {
      // Change the stable semantic roles so the built component aliases resolve to different brand values.
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.documentElement.style;
          style.setProperty('--sb-size-control-xs', '28px');
          style.setProperty('--sb-size-control-sm', '38px');
          style.setProperty('--sb-size-control-default', '42px');
          style.setProperty('--sb-size-control-lg', '48px');
          style.setProperty('--sb-motion-duration-normal', '370ms');
        });
      });
    }
    await use(page);
  },
});
