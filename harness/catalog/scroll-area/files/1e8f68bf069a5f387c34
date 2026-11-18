---
component: Scroll Area
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference and names), WCAG 2.1.1 (keyboard), native overflow
---

# Scroll Area

> A bounded region that scrolls natively with themed thin scrollbars. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Keep a long list, log or block of text inside a fixed-size panel. The browser keeps doing the scrolling; the component themes it and makes sure keyboard users can reach it.

## 2. Anatomy
`sb-scroll-area` renders `viewport` (the native scroll container) around `content`. Optional `sb-scroll-bar` children name the axes to scroll on; they draw nothing.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-scroll-area` | `label` | text | "" | names the region while scrollable |
| `sb-scroll-bar` | `orientation` | vertical, horizontal | vertical | axis to enable |

## 4. Variant matrix
None.

## 5. Roles and color
Thumb `input` (3:1 on the background), track transparent, focus ring `ring`.

## 6. States
scrollable (focus stop and region), focus-visible (3px solid ring on the viewport).

## 7. Dimensions and layout
The host is a block; give it a `height` or `max-height` (and a width if needed). Without `sb-scroll-bar` children the area scrolls vertically; with them, on exactly the named axes. Scrollbars use the browser's thin width.

## 8. Typography
Inherited.

## 9. Accessibility
- A scroller that cannot receive focus cannot be used from the keyboard. While content overflows, the viewport gets `tabindex="0"`, `role="region"` and `aria-label` (from `label`); when it does not overflow, none of these are set.
- Native keys scroll it: arrows, Page Up and Down, Home, End.
- Overflow is re-checked when the viewport or the content changes size.
- Without a `label` the viewport stays focusable but is not a region, and a console warning fires once per element.

## 10. Usage
### Behavior
Scrolling is the browser's, including touch and the wheel.
### Composition
Place content directly inside. Add `<sb-scroll-bar orientation="horizontal">` for wide content.
### Choosing the props
Always set `label` to what the region holds.
### Do / Don't
- Do set a height. Do not nest scroll areas.

## Realizations
### Figma
Drawn in the library: axis State (Rest, Focus): the viewport with the focus ring. Not drawn: the scrollbar thumb (the browser draws it with the `thumb` color).
### Web
Complete. src/components/scroll-area/ScrollArea.ts, src/components/scroll-area/ScrollBar.ts. Parts: viewport, content.
### Coverage
- native vertical scrolling by default
- sb-scroll-bar chooses axes, updates when removed
- scrollable: focus stop and region named by label
- nothing to scroll: no tabindex, no region
- overflow re-checked on content growth and shrink
- Tab focus, arrow/Page/End scrolling, keyboard-only ring
- thin scrollbar and thumb color from token
- one-time missing-label warning
- axe clean (four stories)
### Known drift
- scrollbars: the visual reference draws its own scrollbar parts; native bars keep wheel, touch, drag and keyboard behavior
- thumb color: the visual reference uses the border color, below 3:1 (WCAG 1.4.11)
- keyboard: the reference has no keyboard stop (WCAG 2.1.1)
- scrollbar thickness: CSS offers keywords only, so no dimension token applies

## Open questions
All answered; see contract.json.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-scroll-area-*` variables (check T4). Tests first (rule test-first).
