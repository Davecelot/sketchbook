import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { screenReaderProblems, screenReaderView } from '../../helpers/a11y';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const folders = (dir: string) =>
  (existsSync(ROOT + dir) ? readdirSync(ROOT + dir, { withFileTypes: true }) : [])
    .filter((d) => d.isDirectory() && readdirSync(`${ROOT}${dir}/${d.name}`).some((f) => f.endsWith('.stories.ts')))
    .map((d) => d.name);

// Story views live beside each component's own spec (and each kit's), so `sketchbook add` carries them with it.
const viewsOf = (kind: 'components' | 'patterns', name: string) =>
  kind === 'components' ? `${ROOT}playwright/tests/${name}/__screen-reader__/stories` : `${ROOT}playwright/tests/patterns/__screen-reader__/${name}`;

interface Entry {
  type: string;
  id: string;
  importPath: string;
}

const settled = async (page: Page) => {
  await page.waitForFunction(() => {
    const phase = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }).__STORYBOOK_PREVIEW__
      ?.currentRender?.phase;
    return phase === 'finished' || phase === 'completed';
  });
  await page.evaluate(async () => {
    const all = [...document.querySelectorAll('#storybook-root *')].filter((el) => el.localName.includes('-'));
    await Promise.all(all.map(async (el) => {
      await customElements.whenDefined(el.localName);
      await (el as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;
    }));
  });
};

// A view is taken once the tree stops changing and is not empty: opening a dialog or a drawer settles a frame
// after render, and the dev server can reload the story while it optimizes dependencies.
const stableView = async (page: Page) => {
  let previous = '';
  for (let i = 0; i < 30; i++) {
    const view = await screenReaderView(page);
    if (view === previous && view.trim()) return view;
    previous = view;
    await page.waitForTimeout(100);
  }
  return previous;
};

const open = async (page: Page, id: string) => {
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto(`/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'load' });
      return;
    } catch (error) {
      if (attempt === 2 || !String(error).includes('ERR_ABORTED')) throw error;
    }
  }
};

// Same rules as toMatchSnapshot: a missing view is written and fails once for review; --update-snapshots rewrites.
const matchesStored = (file: string, view: string) => {
  const update = test.info().config.updateSnapshots;
  if (!existsSync(file) || ((update === 'all' || update === 'changed') && readFileSync(file, 'utf8') !== view)) {
    const missing = !existsSync(file);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, view);
    if (missing && update !== 'all' && update !== 'changed') expect.soft(missing, `${file} was missing and has been written: review it`).toBe(false);
    return;
  }
  expect.soft(view, file).toBe(readFileSync(file, 'utf8'));
};

let stories: Entry[] = [];
test.beforeAll(async ({ request }) => {
  const index = (await (await request.get('/index.json')).json()) as { entries: Record<string, Entry> };
  stories = Object.values(index.entries).filter((e) => e.type === 'story');
});

for (const kind of ['components', 'patterns'] as const) {
  for (const name of folders(`src/${kind}`)) {
    test(`${name}: every story's screen-reader view matches its stored view`, async ({ page }) => {
      const own = stories.filter((s) => s.importPath.startsWith(`./src/${kind}/${name}/`));
      expect(own.length, `no stories found for src/${kind}/${name}`).toBeGreaterThan(0);
      for (const story of own) {
        await open(page, story.id);
        await settled(page);
        const view = await stableView(page);
        expect.soft(screenReaderProblems(view), `${story.id}: unnamed controls`).toEqual([]);
        matchesStored(`${viewsOf(kind, name)}/${story.id}.txt`, view);
      }
    });
  }
}
