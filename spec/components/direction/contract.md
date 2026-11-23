---
component: Direction
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference and names), HTML dir attribute and CSS :dir()
---

# Direction

> Sets the reading direction for everything inside it. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Mix left-to-right and right-to-left content on one page, or scope a direction to a region, without each component taking a direction prop.

## 2. Anatomy
A single element, `sb-direction`, with no shadow content except a slot. Its host is `display: contents`.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `dir` | ltr, rtl | ltr | reflects the native `dir` attribute |

## 4. Variant matrix
None.

## 5. Roles and color
None.

## 6. States
None.

## 7. Dimensions and layout
No box of its own. Descendants lay out as if its children were children of its parent, in the chosen direction.

## 8. Typography
Inherited.

## 9. Accessibility
- Uses the platform's `dir` attribute, so bidi text, assistive technology and logical CSS properties agree.
- Components read direction from the platform (`:dir()`, computed `direction`), so Tabs arrows reverse and Pagination chevrons mirror inside it, and also outside it when `dir` is set on the page.

## 10. Usage
### Behavior
Inner `sb-direction` elements override outer ones. Changing `dir` updates the subtree immediately.
### Composition
Wrap a region, or the whole app. For a whole page, `dir` on `html` works as well.
### Choosing the props
Set `dir` to the language's direction; keep `lang` on the content in step.
### Do / Don't
- Do use logical CSS properties in your own markup. Do not flip layouts with transforms.

## Realizations
### Figma
Drawn in the library as an empty sample frame. It has no look: it only sets the reading direction of what it holds.
### Web
Complete. src/components/direction/Direction.ts. Parts: .
### Coverage
- dir reflects and sets subtree direction
- live change
- nested override
- display: contents
- sb-tabs roving focus reverses under rtl and flips back (also story starting in rtl)
- tabs lay out from the right
- pagination chevrons mirror only in rtl
- axe clean (three stories)
### Known drift
- mechanism: the visual reference provides a React context; no context is needed in Web Components

## Open questions
All answered; see contract.json.

## Spec for agents
Build from contract.json only. No component tokens. Tests first (rule test-first).
