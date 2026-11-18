// Which Foundations page shows which tokens. A token belongs to the page whose prefix matches the
// longest leading part of its path (`size.icon.sm` -> Icon sizes, `size.32` -> Density), so new tokens
// under a known family appear on their page with no list to update. Shared with the behavior specs.

export type FoundationPage = { id: string; title: string; prefixes: string[] };

export const PAGES: FoundationPage[] = [
  { id: 'color', title: 'Color', prefixes: ['color'] },
  { id: 'typography', title: 'Typography', prefixes: ['font'] },
  { id: 'spacing', title: 'Spacing', prefixes: ['space'] },
  { id: 'radius', title: 'Radius', prefixes: ['radius'] },
  { id: 'border-width', title: 'Border width', prefixes: ['border', 'border-width', 'focus'] },
  { id: 'opacity', title: 'Opacity', prefixes: ['opacity'] },
  { id: 'elevation', title: 'Elevation', prefixes: ['shadow', 'elevation'] },
  { id: 'motion', title: 'Motion', prefixes: ['duration', 'easing', 'motion'] },
  { id: 'density', title: 'Density', prefixes: ['size'] },
  { id: 'icon-sizes', title: 'Icon sizes', prefixes: ['size.icon', 'icon'] },
  { id: 'layout-grid', title: 'Layout grid', prefixes: ['grid', 'layout', 'breakpoint', 'container'] },
  { id: 'z-index', title: 'Z-index', prefixes: ['z', 'layer'] },
];

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}.`);

export function pageOf(path: string): string | undefined {
  let best: { id: string; length: number } | undefined;
  for (const page of PAGES)
    for (const prefix of page.prefixes) if (matches(path, prefix) && (!best || prefix.length > best.length)) best = { id: page.id, length: prefix.length };
  return best?.id;
}

// Storybook story id of a page: title "Foundations/<title>", one story named Page.
export const storyId = (page: FoundationPage) => `foundations-${page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}--page`;

// WCAG 2.x thresholds per contrast kind in spec/tokens/contrast.json.
export const CONTRAST_MIN: Record<string, number> = { text: 4.5, 'large-text': 3, ui: 3 };
