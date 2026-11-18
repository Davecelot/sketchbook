import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { countSubmits, gotoPattern, headings, landmarks, outlineProblems } from '../../helpers/patterns';

const STATES = ['default', 'first-run', 'setting-up'];
const FIRST = 'sb-card';

test.describe('Pattern: Onboarding', () => {
  for (const state of STATES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${state} (${mode}): one main, a sound outline and no axe violations`, async ({ page }) => {
        await gotoPattern(page, `patterns-onboarding--${state}`, FIRST, mode);
        expect((await landmarks(page)).filter((l) => l.role === 'main')).toHaveLength(1);
        expect(outlineProblems(await headings(page))).toEqual([]);
        expect(await axeViolations(page, '#storybook-root')).toEqual([]);
      });
    }
  }

  // WCAG 1.4.10 Reflow: at 320 CSS px the page never scrolls sideways.
  for (const state of STATES) {
    test(`${state}: reflows at 320px without horizontal scrolling`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await gotoPattern(page, `patterns-onboarding--${state}`, FIRST);
      const doc = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(doc.scroll).toBeLessThanOrEqual(doc.client);
    });
  }

  test('the step shows its place in the flow', async ({ page }) => {
    await gotoPattern(page, 'patterns-onboarding--default', FIRST);
    const progress = page.getByRole('progressbar', { name: 'Step 2 of 3' });
    await expect(progress).toHaveAttribute('aria-valuenow', '2');
    await expect(progress).toHaveAttribute('aria-valuemax', '3');
  });

  test('keyboard path: pick a role, tick interests, continue', async ({ page }) => {
    await gotoPattern(page, 'patterns-onboarding--default', FIRST);
    const submits = await countSubmits(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Designer' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Engineer' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Designer' })).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('checkbox', { name: 'Design reviews' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox', { name: 'Design reviews' })).toBeChecked();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Back' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await submits.evaluate((c) => c.n)).toBe(1);
  });

  test('first run: an empty state with one main action and next steps as links', async ({ page }) => {
    await gotoPattern(page, 'patterns-onboarding--first-run', FIRST);
    await expect(page.getByRole('heading', { level: 2, name: 'No projects yet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create project' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Invite your team/ })).toHaveAttribute('href', '#invite');
  });

  test('setting up: one status message while placeholders hold the layout', async ({ page }) => {
    await gotoPattern(page, 'patterns-onboarding--setting-up', FIRST);
    await expect(page.getByRole('status', { name: 'Setting up your workspace' })).toBeVisible();
    expect(await page.locator('sb-skeleton').count()).toBeGreaterThan(0);
    for (const s of await page.locator('sb-skeleton').all()) await expect(s).toHaveAttribute('aria-hidden', 'true');
  });
});
