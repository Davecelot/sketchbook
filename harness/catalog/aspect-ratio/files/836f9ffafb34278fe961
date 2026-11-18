import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';

const TAG = 'sb-aspect-ratio';
const size = async (page: import('@playwright/test').Page) => {
  const box = await page.locator(TAG).boundingBox();
  return { width: box!.width, height: box!.height };
};

test.describe('Aspect Ratio', () => {
  test('is square by default', async ({ page }) => {
    await gotoStory(page, 'components-aspectratio--square', TAG);
    expect(await size(page)).toEqual({ width: 192, height: 192 });
  });

  test('a numeric ratio sets the height from the width', async ({ page }) => {
    await gotoStory(page, 'components-aspectratio--default', TAG);
    const { width, height } = await size(page);
    expect(width).toBe(320);
    expect(height).toBeCloseTo(320 / 1.7778, 0);
  });

  test('a fraction ratio works', async ({ page }) => {
    await gotoStory(page, 'components-aspectratio--fraction', TAG);
    expect(await size(page)).toEqual({ width: 320, height: 180 });
  });

  test('changing ratio updates the box', async ({ page }) => {
    await gotoStory(page, 'components-aspectratio--fraction', TAG);
    const host = page.locator(TAG);
    await host.evaluate((el) => el.setAttribute('ratio', '2'));
    await expect.poll(async () => (await size(page)).height).toBe(160);
    await host.evaluate((el) => ((el as unknown as { ratio: number }).ratio = 4));
    await expect.poll(async () => (await size(page)).height).toBe(80);
  });

  test('invalid ratios fall back to 1', async ({ page }) => {
    await gotoStory(page, 'components-aspectratio--fraction', TAG);
    const host = page.locator(TAG);
    for (const bad of ['0', '-2', 'abc', '16/0']) {
      await host.evaluate((el, v) => el.setAttribute('ratio', v), bad);
      await expect.poll(async () => (await size(page)).height, bad).toBe(320);
    }
  });

  test('the slotted child fills the box exactly', async ({ page }) => {
    await gotoStory(page, 'components-aspectratio--fraction', TAG);
    const host = await page.locator(TAG).boundingBox();
    const child = await page.locator(`${TAG} > img`).boundingBox();
    expect(child).toEqual(host);
  });

  test('tall content does not stretch the box', async ({ page }) => {
    await gotoStory(page, 'components-aspectratio--tall-content', TAG);
    expect(await size(page)).toEqual({ width: 192, height: 96 });
  });

  test('adds no role and no focus stop; the child keeps its name', async ({ page }) => {
    await gotoStory(page, 'components-aspectratio--fraction', TAG);
    expect(await page.locator(TAG).getAttribute('role')).toBeNull();
    await expect(page.getByRole('img', { name: 'Striped placeholder' })).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });

  for (const id of ['default', 'square', 'fraction', 'tall-content']) {
    test(`has no axe violations (${id})`, async ({ page }) => {
      await gotoStory(page, `components-aspectratio--${id}`, TAG);
      expect(await axeViolations(page, '#storybook-root')).toEqual([]);
    });
  }
});
