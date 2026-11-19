# Docs article

Help readers follow a guide with a contents sidebar, diagram, code sample, and links to what comes next.

## When to use
Guides, help articles and any page that is mostly reading. Use it to check line length, line height and the heading scale with your brand.

## What to replace
- The text, the contents links and the section ids they point at.
- The diagram with your media, inside the same aspect ratio box; keep a text alternative.
- The code sample, the callout and the FAQ entries.
- The previous and next article links.

## How to adapt
- Keep one h1 (`sb-typography kind="h1"`), h2 per section and level 3 for FAQ triggers.
- Each section is named by its heading through `aria-labelledby`.
- Wrap the page in `sb-direction dir="rtl"` for right-to-left languages; the layout mirrors on its own.
- The sidebar wraps above the article on narrow screens; change its width in `docs-article.css`.
