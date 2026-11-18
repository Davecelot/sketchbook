import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoPattern, headings, landmarks, outlineProblems } from '../../helpers/patterns';

const STATES = ['default', 'right-to-left'];
const FIRST = 'sb-typography';

test.describe('Pattern: Docs article', () => {
  for (const state of STATES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${state} (${mode}): main, contents and breadcrumb, a sound outline and no axe violations`, async ({ page }) => {
        await gotoPattern(page, `patterns-docs-article--${state}`, FIRST, mode);
        const found = await landmarks(page);
        expect(found.filter((l) => l.role === 'main')).toHaveLength(1);
        expect(found.filter((l) => l.role === 'navigation').map((l) => l.name).sort()).toEqual(['Article pages', 'Breadcrumb', 'On this page']);
        expect(outlineProblems(await headings(page))).toEqual([]);
        expect(await axeViolations(page, '#storybook-root')).toEqual([]);
      });
    }
  }

  test('the outline is the article: h1, then sections, with FAQ questions one level down', async ({ page }) => {
    await gotoPattern(page, 'patterns-docs-article--default', FIRST);
    const list = await headings(page);
    expect(list[0]).toEqual({ level: 1, name: 'Getting started' });
    expect(list.filter((h) => h.level === 3).map((h) => h.name)).toEqual(expect.arrayContaining(['Does it work offline?', 'Can I change the colors?']));
  });

  test('contents links come first in the tab order and point at the sections', async ({ page }) => {
    await gotoPattern(page, 'patterns-docs-article--default', FIRST);
    const contents = page.getByRole('navigation', { name: 'On this page' });
    await page.keyboard.press('Tab');
    await expect(contents.getByRole('link', { name: 'Install' })).toBeFocused();
    for (const link of await contents.getByRole('link').all()) {
      const target = (await link.getAttribute('href'))!.slice(1);
      expect(await page.locator(`[id="${target}"]`).count()).toBe(1);
    }
  });

  test('the FAQ opens with Enter and the collapsible with Space', async ({ page }) => {
    await gotoPattern(page, 'patterns-docs-article--default', FIRST);
    const question = page.getByRole('button', { name: 'Does it work offline?' });
    await question.focus();
    await page.keyboard.press('Enter');
    await expect(question).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Yes. Everything runs in the browser')).toBeVisible();
    const more = page.getByRole('button', { name: 'Show advanced options' });
    await more.focus();
    await page.keyboard.press('Space');
    await expect(page.getByText('Pass --verbose to see every step.')).toBeVisible();
  });

  test('the code sample scrolls by keyboard when it overflows', async ({ page }) => {
    await gotoPattern(page, 'patterns-docs-article--default', FIRST);
    await page.setViewportSize({ width: 480, height: 800 });
    const region = page.getByRole('region', { name: 'Install command' });
    await expect(region).toHaveAttribute('tabindex', '0');
  });

  test('previous and next name the neighbouring articles', async ({ page }) => {
    await gotoPattern(page, 'patterns-docs-article--default', FIRST);
    const pages = page.locator('sb-pagination');
    await expect(pages.getByRole('link', { name: /Introduction/ })).toBeVisible();
    await expect(pages.getByRole('link', { name: /Theming/ })).toBeVisible();
  });

  test('right to left mirrors the whole page', async ({ page }) => {
    await gotoPattern(page, 'patterns-docs-article--right-to-left', FIRST);
    expect(await page.getByRole('main').evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
    const [main, contents] = await Promise.all([page.getByRole('main').boundingBox(), page.getByRole('navigation', { name: 'On this page' }).boundingBox()]);
    expect(contents!.x).toBeGreaterThan(main!.x);
  });
});
