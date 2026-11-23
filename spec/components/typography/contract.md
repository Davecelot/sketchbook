---
component: Typography
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference shadcn/ui Typography (scale and look); contract-first standard (contract and build process)
---

# Typography

> Styled text for headings, paragraphs, quotes, lists and inline emphasis. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Give running text and headings one consistent look without hand-writing styles. Not for form labels (Label), key hints (Kbd) or status chips (Badge).

## 2. Anatomy
One element, `sb-typography`, with a `kind`. The shadow root holds one native element (part `text`) chosen by the kind: `h1`-`h4`, `p`, `blockquote`, `ul`, `code`, `div` or `small`. The default slot is its content; for `list` the slotted `li` elements are projected into the `ul`.

Decision: one element with a `kind` prop rather than a family of twelve elements. The kinds share one token set and one stylesheet, only the native tag and the style change. It is `kind`, not `variant`: a text role, not an emphasis (spec/api.json). Real tags in the shadow root keep heading and list semantics.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `kind` | h1, h2, h3, h4, p, blockquote, list, inline-code, lead, large, small, muted | p | picks the native element and the style |
| slot | default | — | text; `li` elements for `list` |

## 4. Variant matrix
12 kinds, one dimension.

## 5. Roles and color
Text is `foreground`. `lead` and `muted` use `muted-foreground`. `inline-code` sits on `muted`. The `h2` rule and the `blockquote` bar use `border`.

## 6. States
None: the element is not interactive.

## 7. Dimensions and layout
Block display, except `inline-code` and `small`, which are inline so they sit inside a sentence. Elements that are not the first child of their parent get a top margin (p, blockquote, h2, h3: 24, 24, 40, 32px); `list` has 24px block margin, a 24px indent and 8px between items. `h2` has a 1px bottom rule with 8px padding. `blockquote` has a 2px left bar and 24px padding.

## 8. Typography
| Variant | Size / line height | Weight | Other |
| --- | --- | --- | --- |
| h1 | 36 / 36px | extrabold | balanced wrapping, tight tracking |
| h2 | 30 / 36px | semibold | tight tracking |
| h3 | 24 / 32px | semibold | |
| h4 | 20 / 28px | semibold | |
| p | 16 / 28px | regular | |
| blockquote | 16 / 28px | regular | italic |
| list | 16 / 28px | regular | disc markers |
| inline-code | 14px, mono | semibold | `muted` background, 6px radius |
| lead | 20 / 28px | regular | `muted-foreground` |
| large | 18 / 28px | semibold | |
| small | 14px, line height 1 | medium | |
| muted | 14 / 20px | regular | `muted-foreground` |

## 9. Accessibility
- The kind renders a real native element, so `h1`-`h4` are headings, `list` is a list of list items and `blockquote` is a blockquote. Keep heading levels in order (WCAG 1.3.1, 2.4.6); do not pick a level for its size.
- Sizes are px tokens, so browser zoom works (1.4.4); nothing has a fixed height, so text-spacing overrides (1.4.12) do not clip text.
- Contrast: `foreground` on `background`, `muted-foreground` on `background`, `foreground` on the code background all pass 4.5:1.
- Slotted `li` elements stay list items of the inner `ul` (flattened tree), checked in the behavior spec.

## 10. Usage
### Behavior
Static text. Changing `kind` swaps the native element.
### Composition
Put `inline-code` and `small` inside a `p`. Use one `h1` per page and nest `h2`-`h4` in order. Use Label for form field names, not `small` or `muted`.
### Choosing the props
`lead` for the intro under a title, `muted` for hints and captions, `large` for a callout line that is not a heading.
### Do / Don't
- Do keep one `h1` per page. Don't choose a heading level by its look.
- Don't use `muted` for text people must read to act; it is the lowest-contrast text that still passes.

## Realizations
### Figma
Drawn in the library: axis Kind, one sample per kind from the text styles. Not drawn: the margins between blocks, the monospace family of inline code, and the tightened heading tracking.
### Web
Complete. Files: `src/components/typography/Typography.ts`, `src/components/typography/Typography.scss`, `src/components/typography/Typography.styles.ts`, `src/components/typography/Typography.stories.ts`, `src/components/typography/index.ts`. Parts: `text`. Slots: `default`. Spec: `playwright/tests/typography/typography.behavior.spec.ts`.
### Coverage
- native element per kind; h1-h4 are headings with levels
- default p, kind reflects and swaps the element
- size, line height and weight from component tokens per kind
- inline-code and small inline, others block; inline-code in a sentence
- inline-code mono on muted background; lead and muted foreground
- top margin only when not the first child
- h2 rule, blockquote bar and italic
- slotted li stay list items with disc markers
- not focusable; axe clean (kinds, article)
### Known drift
- inline-code: radius.small (6px), padding 4px / 6px; shadcn rounded (4px), padding 3.2px / 4.8px.
- docs version: classic utility-class examples; current shadcn docs describe the new Typeset system, not reproduced.

## Open questions
- Q1 (answered): one element with `variant`, not a family.
- Q2 (answered): no heading `level` prop; the variant picks the tag.
- Q3 (answered): follow the visual reference's classic type scale; its newer Typeset system is not reproduced.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-typography-*` variables (check T4). Tests first (rule test-first).
