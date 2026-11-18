import { expect, test } from '../../fixtures';
import { axeViolations } from '../../helpers/a11y';
import { countSubmits, gotoPattern, headings, landmarks, outlineProblems } from '../../helpers/patterns';

const STATES = ['default', 'with-error', 'loading', 'sign-up'];
const FIRST = 'sb-card';

test.describe('Pattern: Sign in', () => {
  for (const state of STATES) {
    for (const mode of ['light', 'dark'] as const) {
      test(`${state} (${mode}): one main with a named form, a sound outline and no axe violations`, async ({ page }) => {
        await gotoPattern(page, `patterns-sign-in--${state}`, FIRST, mode);
        const found = await landmarks(page);
        expect(found.filter((l) => l.role === 'main')).toHaveLength(1);
        expect(found.find((l) => l.role === 'form')?.name).toBeTruthy();
        expect(outlineProblems(await headings(page))).toEqual([]);
        expect(await axeViolations(page, '#storybook-root')).toEqual([]);
      });
    }
  }

  test('the page heading names the form', async ({ page }) => {
    await gotoPattern(page, 'patterns-sign-in--default', FIRST);
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('form', { name: 'Sign in' })).toBeVisible();
  });

  test('Tab walks the form in reading order', async ({ page }) => {
    await gotoPattern(page, 'patterns-sign-in--default', FIRST);
    const order = [
      page.getByRole('textbox', { name: 'Email' }),
      page.getByLabel('Password', { exact: true }),
      page.getByRole('button', { name: 'Show password' }),
      page.getByRole('checkbox', { name: 'Keep me signed in' }),
      page.getByRole('link', { name: 'Forgot password?' }),
      page.getByRole('button', { name: 'Sign in' }),
      page.getByRole('button', { name: 'Continue with single sign-on' }),
      page.getByRole('link', { name: 'Create an account' }),
    ];
    for (const target of order) {
      await page.keyboard.press('Tab');
      await expect(target).toBeFocused();
    }
  });

  test('Enter submits from the email and from the password field', async ({ page }) => {
    await gotoPattern(page, 'patterns-sign-in--default', FIRST);
    const submits = await countSubmits(page);
    await page.getByRole('textbox', { name: 'Email' }).fill('ada@example.com');
    await page.getByLabel('Password', { exact: true }).fill('correct horse');
    await page.getByLabel('Password', { exact: true }).press('Enter');
    expect(await submits.evaluate((c) => c.n)).toBe(1);
    await page.getByRole('textbox', { name: 'Email' }).press('Enter');
    expect(await submits.evaluate((c) => c.n)).toBe(2);
  });

  test('an empty form does not submit', async ({ page }) => {
    await gotoPattern(page, 'patterns-sign-in--default', FIRST);
    const submits = await countSubmits(page);
    await page.getByRole('button', { name: 'Sign in' }).click();
    expect(await submits.evaluate((c) => c.n)).toBe(0);
  });

  test('the reveal button shows and hides the password and says which', async ({ page }) => {
    await gotoPattern(page, 'patterns-sign-in--default', FIRST);
    const password = page.getByLabel('Password', { exact: true });
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).press('Enter');
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('with an error, a danger alert leads the form and the values stay', async ({ page }) => {
    await gotoPattern(page, 'patterns-sign-in--with-error', FIRST);
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('We could not sign you in');
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('ada@example.com');
    const [alertBox, emailBox] = await Promise.all([alert.boundingBox(), page.getByRole('textbox', { name: 'Email' }).boundingBox()]);
    expect(alertBox!.y).toBeLessThan(emailBox!.y);
  });

  test('while loading, the submit button keeps focus but does not submit again', async ({ page }) => {
    await gotoPattern(page, 'patterns-sign-in--loading', FIRST);
    const submits = await countSubmits(page);
    await expect(page.locator('sb-button[type="submit"]')).toHaveAttribute('loading', '');
    await expect(page.getByRole('form', { name: 'Sign in' })).toHaveAttribute('aria-busy', 'true');
    await page.getByRole('button', { name: 'Sign in' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
    expect(await submits.evaluate((c) => c.n)).toBe(0);
  });

  test('sign up asks for a name, a new password and the terms', async ({ page }) => {
    await gotoPattern(page, 'patterns-sign-in--sign-up', FIRST);
    await expect(page.getByRole('heading', { level: 1, name: 'Create an account' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveAttribute('autocomplete', 'name');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAccessibleDescription('Use at least 12 characters.');
    const submits = await countSubmits(page);
    await page.getByRole('textbox', { name: 'Full name' }).fill('Ada Example');
    await page.getByRole('textbox', { name: 'Email' }).fill('ada@example.com');
    await page.getByLabel('Password', { exact: true }).fill('a long enough secret');
    await page.getByRole('button', { name: 'Create account' }).click();
    expect(await submits.evaluate((c) => c.n)).toBe(0);
    await page.getByRole('checkbox', { name: 'I agree to the terms of service' }).check();
    await page.getByRole('button', { name: 'Create account' }).click();
    expect(await submits.evaluate((c) => c.n)).toBe(1);
  });
});
