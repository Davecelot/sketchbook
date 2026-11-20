import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`homepage introduction video at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const videoRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('/assets/sketchbook-film.mp4')) videoRequests.push(request.url());
    });
    await page.goto('/');

    const video = page.locator('video[aria-label="Introduction to Sketchbook"]');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('preload', 'none');
    await expect(video).toHaveAttribute('poster', '/assets/sketchbook-film-poster.jpg');
    expect(videoRequests).toHaveLength(0);
    const poster = await page.request.get('/assets/sketchbook-film-poster.jpg');
    expect(poster.ok()).toBe(true);
    expect(poster.headers()['content-type']).toContain('image/jpeg');
    expect(await video.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth;
    })).toBe(true);
    expect(await video.evaluate((element) => {
      const heading = [...document.querySelectorAll('h2')].find((item) => item.textContent === 'What you get');
      return Boolean(heading && (element.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING));
    })).toBe(true);
    const response = await page.request.get('/assets/sketchbook-film.mp4', { headers: { Range: 'bytes=0-1023' } });
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('video/mp4');
  });
}
