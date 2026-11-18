import type { Page } from '@playwright/test';

export const mountForm = (page: Page, markup: string) =>
  page.evaluate(async (inner) => {
    document.querySelector('form#under-test')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<form id="under-test">${inner}</form>`);
    const form = document.querySelector('form#under-test')!;
    await Promise.all(
      [...form.querySelectorAll('*')].flatMap((el) => (el as Partial<{ updateComplete: Promise<unknown> }>).updateComplete ?? []),
    );
  }, markup);

export const formEntries = (page: Page) =>
  page.evaluate(() => [...new FormData(document.querySelector<HTMLFormElement>('form#under-test')!).entries()]);

export const recordEntriesOnChange = (page: Page) =>
  page.evaluateHandle(() => {
    const seen: [string, FormDataEntryValue][][] = [];
    const form = document.querySelector<HTMLFormElement>('form#under-test')!;
    form.addEventListener('change', () => seen.push([...new FormData(form).entries()]));
    return seen;
  });

// Implicit submission (SB-0009): mount the markup in a form, focus the control, press Enter, count `submit` events.
export async function submitsOnEnter(page: Page, markup: string, control: string): Promise<number> {
  await mountForm(page, markup);
  const submits = await page.evaluateHandle(() => {
    const count = { n: 0 };
    document.querySelector('form#under-test')!.addEventListener('submit', (event) => {
      event.preventDefault();
      count.n++;
    });
    return count;
  });
  await page.locator(`form#under-test ${control}`).first().focus();
  await page.keyboard.press('Enter');
  return submits.evaluate((count) => count.n);
}

// A disabled control cannot take focus, so the Enter is dispatched at it to exercise the handler's own disabled guard.
export async function submitsOnDispatchedEnter(page: Page, markup: string, control: string): Promise<number> {
  await mountForm(page, markup);
  const submits = await page.evaluateHandle(() => {
    const count = { n: 0 };
    document.querySelector('form#under-test')!.addEventListener('submit', (event) => {
      event.preventDefault();
      count.n++;
    });
    return count;
  });
  await page.locator(`form#under-test ${control}`).first().dispatchEvent('keydown', { key: 'Enter', bubbles: true, composed: true });
  return submits.evaluate((count) => count.n);
}
