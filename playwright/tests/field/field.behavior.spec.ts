import { expect, test } from '../../fixtures';
import { axeViolations, axNodes } from '../../helpers/a11y';
import { gotoStory } from '../../helpers/storybook';
import { tokenColor, tokenNumber, tokenPx } from '../../helpers/tokens';

const TAG = 'sb-field';

test.describe('Field', () => {
  test('field set is a native group named by its legend', async ({ page }) => {
    await gotoStory(page, 'components-field--field-set', 'sb-field-set');
    await expect(page.getByRole('group', { name: 'Notifications' })).toBeVisible();
    await expect(page.locator('sb-field-set [part="legend"]')).toHaveText('Notifications');
    await page.locator('sb-field-set').evaluate((el) => el.removeAttribute('legend'));
    await expect(page.locator('sb-field-set [part="legend"]')).toHaveCount(0);
  });

  test('a native input is named by the label and described by description', async ({ page }) => {
    await gotoStory(page, 'components-field--default', TAG);
    const input = page.getByRole('textbox', { name: 'Email' });
    await expect(input).toBeVisible();
    await expect(input).toHaveAccessibleDescription('We only use it to send receipts.');
    await expect(input).not.toHaveAttribute('aria-invalid');
  });

  test('error text joins the description only while it has text', async ({ page }) => {
    await gotoStory(page, 'components-field--default', TAG);
    const input = page.getByRole('textbox', { name: 'Email' });
    await page.locator('sb-field-error').evaluate((el) => { el.textContent = 'Enter a valid address.'; });
    await expect(input).toHaveAccessibleDescription('We only use it to send receipts. Enter a valid address.');
    await page.locator('sb-field-error').evaluate((el) => { el.textContent = ''; });
    await expect(input).toHaveAccessibleDescription('We only use it to send receipts.');
  });

  test('validation error sets aria-invalid, the label color, and shows the error', async ({ page }) => {
    await gotoStory(page, 'components-field--invalid', TAG);
    const input = page.getByRole('textbox', { name: 'Email' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(/Enter an address/);
    const label = page.locator('sb-field-label [part="label"]');
    expect(await label.evaluate((el) => getComputedStyle(el).color)).toBe(await tokenColor(page.locator('sb-field-label'), '--sb-field-label-fg-invalid'));
    await page.locator(TAG).evaluate((el) => el.removeAttribute('validation'));
    await expect(input).not.toHaveAttribute('aria-invalid');
  });

  test('wiring follows later DOM changes', async ({ page }) => {
    await gotoStory(page, 'components-field--default', TAG);
    await page.locator(TAG).evaluate((el) => {
      el.querySelector('sb-field-description')!.remove();
    });
    const input = page.getByRole('textbox', { name: 'Email' });
    await expect(input).toHaveAccessibleDescription('');
  });

  test('clicking the label focuses the input, or toggles a checkbox', async ({ page }) => {
    await gotoStory(page, 'components-field--default', TAG);
    await page.locator('sb-field-label').click();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeFocused();
    await gotoStory(page, 'components-field--horizontal', TAG);
    await page.locator('sb-field-label').click();
    await expect(page.getByRole('checkbox', { name: 'Email me product news' })).toBeChecked();
  });

  test('error is a live region and hidden while empty', async ({ page }) => {
    await gotoStory(page, 'components-field--default', TAG);
    const error = page.locator('sb-field-error');
    await expect(error.locator('[part="error"]')).toHaveAttribute('role', 'alert');
    await expect(error).toBeHidden();
    await error.evaluate((el) => { el.textContent = 'Required'; });
    await expect(error).toBeVisible();
  });

  test('separator keeps its text readable and hides its lines', async ({ page }) => {
    await gotoStory(page, 'components-field--with-separator', TAG);
    const sep = page.locator('sb-field-separator');
    await expect(sep).toContainText('or');
    for (const line of await sep.locator('[part="line"]').all()) await expect(line).toHaveAttribute('aria-hidden', 'true');
    await expect(sep.locator('[part="text"]')).toBeVisible();
    expect(await sep.locator('[part="line"]').first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tokenColor(sep, '--sb-field-separator-line'));
  });

  test('separator lines stay visible in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await gotoStory(page, 'components-field--with-separator', TAG);
    const line = page.locator('sb-field-separator [part="line"]').first();
    const canvas = await line.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.cssText = 'display:block;forced-color-adjust:none;background:Canvas';
      document.body.append(probe);
      const v = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return v;
    });
    expect(await line.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(canvas);
  });

  test('separator without text shows a single line and no text box', async ({ page }) => {
    await gotoStory(page, 'components-field--plain', TAG);
    await expect(page.locator('sb-field-separator [part="text"]')).toBeHidden();
    expect((await page.locator('sb-field-separator [part="line"]').first().boundingBox())?.height).toBe(await tokenPx(page.locator('sb-field-separator'), '--sb-field-separator-thickness'));
  });

  test('vertical field stacks with the token gap; horizontal puts the control beside its text', async ({ page }) => {
    await gotoStory(page, 'components-field--default', TAG);
    const [label, input] = await Promise.all([page.locator('sb-field-label').boundingBox(), page.getByRole('textbox').boundingBox()]);
    expect(input!.y).toBeGreaterThan(label!.y);
    const gap = Math.round(input!.y - (label!.y + label!.height));
    expect(gap).toBe(await tokenPx(page.locator(TAG), '--sb-field-gap'));
    await gotoStory(page, 'components-field--horizontal', TAG);
    const [box, content] = await Promise.all([page.getByRole('checkbox').boundingBox(), page.locator('sb-field-content').boundingBox()]);
    expect(content!.x).toBeGreaterThan(box!.x);
    expect(Math.abs(content!.y - box!.y)).toBeLessThan(20);
  });

  test('group stacks fields with the group gap', async ({ page }) => {
    await gotoStory(page, 'components-field--with-separator', 'sb-field-group');
    const [a, b] = await Promise.all([page.locator(TAG).nth(0).boundingBox(), page.locator('sb-field-separator').boundingBox()]);
    expect(Math.round(b!.y - (a!.y + a!.height))).toBe(await tokenPx(page.locator('sb-field-group'), '--sb-field-group-gap'));
  });

  test('description and title use their token colors', async ({ page }) => {
    await gotoStory(page, 'components-field--choice-title', TAG);
    const desc = page.locator('sb-field-description [part="description"]');
    expect(await desc.evaluate((el) => getComputedStyle(el).color)).toBe(await tokenColor(page.locator('sb-field-description'), '--sb-field-description-fg'));
    const title = page.locator('sb-field-title [part="title"]');
    expect(await title.evaluate((el) => getComputedStyle(el).fontWeight)).toBe(String(await tokenNumber(title, '--sb-field-title-font-weight')));
  });

  test('DS controls keep their own names inside a group', async ({ page }) => {
    await gotoStory(page, 'components-field--with-ds-controls', 'sb-field-group');
    await expect(page.getByRole('textbox', { name: 'Full name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  });

  test('keeps the author ARIA on the control and merges only its own ids', async ({ page }) => {
    await gotoStory(page, `components-field--default`, TAG);
    const attrs = await page.evaluate(async () => {
      const root = document.querySelector('#storybook-root')!;
      root.innerHTML = '<p id="hint">Hint</p><p id="who">Who</p><sb-field><sb-field-label>Name</sb-field-label><input aria-describedby="hint" aria-labelledby="who" aria-invalid="true" /><sb-field-description>Desc</sb-field-description></sb-field>';
      const field = root.querySelector('sb-field') as HTMLElement & { validation: string; updateComplete: Promise<unknown> };
      const input = root.querySelector('input')!;
      await field.updateComplete;
      field.validation = 'error';
      await field.updateComplete;
      field.validation = 'none';
      await field.updateComplete;
      const ids = (a: string) => (input.getAttribute(a) ?? '').split(/\s+/).filter(Boolean);
      const own = (el: string) => root.querySelector(el)!.id;
      return { described: ids('aria-describedby'), labelled: ids('aria-labelledby'), invalid: input.getAttribute('aria-invalid'), desc: own('sb-field-description'), label: own('sb-field-label') };
    });
    expect(attrs.described).toEqual(['hint', attrs.desc]);
    expect(attrs.labelled).toEqual(['who', attrs.label]);
    expect(attrs.invalid).toBe('true');
  });

  test('a description directly in a field set describes the group', async ({ page }) => {
    await gotoStory(page, 'components-field--field-set', 'sb-field-set');
    const cdp = await page.context().newCDPSession(page);
    await expect.poll(async () => (await axNodes(cdp, 'group')).find((n) => n.name === 'Notifications')?.description).toBe('Choose what we send you.');
  });

  test('warns once when a field set has no legend, and not when it has one', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => m.type() === 'warning' && m.text().includes('<sb-field-set> has no accessible name') && warnings.push(m.text()));
    await gotoStory(page, 'components-field--field-set', 'sb-field-set');
    await page.evaluate(async () => {
      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const bare = document.createElement('sb-field-set');
      document.body.append(bare);
      await frames();
      (bare as unknown as { requestUpdate: () => void }).requestUpdate();
      await frames();
    });
    expect(warnings).toHaveLength(1);
  });

  for (const id of ['default', 'invalid', 'horizontal', 'field-set', 'with-separator', 'choice-title', 'with-ds-controls']) {
    test(`axe clean: ${id}`, async ({ page }) => {
      const root = id === 'field-set' ? 'sb-field-set' : id === 'with-separator' || id === 'with-ds-controls' ? 'sb-field-group' : TAG;
      await gotoStory(page, `components-field--${id}`, root);
      expect(await axeViolations(page, root, ['sb-input'])).toEqual([]);
    });
  }
});
