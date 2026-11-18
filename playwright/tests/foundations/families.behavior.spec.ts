import { pageOf } from '../../../src/stories/foundations/families';
import { expect, test } from '../../fixtures';
import { loadTokens } from '../../helpers/foundations';

// Catch-all: every foundation and semantic token in spec/tokens/**/*.tokens.json belongs to a
// Foundations page. A new token family (a new leading path segment) fails here until families.ts
// maps it, so it is noticed instead of silently missing from Storybook. No browser needed.
test.describe('Foundations families', () => {
  test('every token in spec/tokens belongs to a page', async () => {
    const all = await loadTokens();
    const orphans = [
      ...new Set(
        all.sets
          .filter((s) => s.layer !== 'component')
          .flatMap((s) => s.tokens)
          .filter((t) => !pageOf(t.path))
          .map((t) => t.path),
      ),
    ];
    expect(orphans, 'Map these token families to a page in src/stories/foundations/families.ts').toEqual([]);
  });

  test('a token of an unknown family belongs to no page', () => {
    expect(pageOf('brand-new-family.step')).toBeUndefined();
    expect(pageOf('colorful.red')).toBeUndefined();
    expect(pageOf('color.red.500')).toBe('color');
  });
});
