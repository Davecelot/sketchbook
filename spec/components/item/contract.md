---
component: Item
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference (shadcn/ui Item), harness process (contract-first standard)
---

# Item

> A flexible row for one entry: media, text, actions. A family of eleven elements. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Present one entry in a list or stack (a file, a person, a setting) with a leading visual, a title and description, and trailing actions. Not for tabular data (use Table) and not for menus.

## 2. Anatomy
`sb-item` is the row; its shadow root holds a wrapper (`item`, a div or an anchor) around a slot. Inside: `sb-item-media`, `sb-item-content` (with `sb-item-title` and `sb-item-description`), `sb-item-actions`, and optional full-width `sb-item-header` and `sb-item-footer`. `sb-item-group` stacks items; `sb-item-separator` draws a rule between them.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-item` | `variant` | primary, tertiary, muted | primary | surface |
| `sb-item` | `size` | medium, small | medium | padding and gap |
| `sb-item` | `href` | text | none | whole row is a native link; `javascript:`, `vbscript:` and `data:` URLs are dropped (SB-0115) |
| `sb-item-media` | `variant` | primary, icon, image | primary | frame |
| other elements | none | | | content only |

## 4. Variant matrix
`variant` x `size`: 3 x 2 = 6 combinations.

## 5. Roles and color
Default: transparent. Outline: 1px `border`. Muted: `muted` at half strength. Linked rows tint to `accent` at half strength on hover. Description is `muted-foreground`; icon media sits on `muted` with a `border`.

## 6. States
With `href`: hover (tint) and focus-visible (border and solid ring in `ring`). Otherwise static.

## 7. Dimensions and layout
Flex row that wraps; radius `radius.control`; padding and gap 16px (`small`: 12px block, 16px inline, 10px gap). Content grows to fill; media aligns to the top (nudged 2px) when a description exists. Header and footer take the full row. Icon media 32px, image media 40px, both with `radius.small`.

## 8. Typography
14px. Title weight 500. Description 14px muted, not clamped.

## 9. Accessibility
- With `href` the row is one native link; its name is everything inside. Do not nest buttons or links in it; drop `href` and use `sb-item-actions` instead.
- List semantics need explicit roles across elements: `sb-item-group` is `role="list"`, a `sb-item` directly inside it becomes `role="listitem"`, and `sb-item-separator` is `role="presentation"` so the list has only items as children (checked in the accessibility tree and with axe). The role is recomputed when an item is moved in or out of a group; an author `role` is never touched. An empty `href` renders no link.
- Focus ring is solid and appears for keyboard focus only.
- Description is not truncated (WCAG 1.4.10).
- The tertiary border is decorative: the text identifies the item, so it is not held to 3:1.

## 10. Usage
### Behavior
Linked rows navigate; others are static containers for their own controls.
### Composition
Icon media, content with title and description, actions with buttons. Wrap several in `sb-item-group` and separate them with `sb-item-separator`.
### Choosing the props
`tertiary` or `muted` to lift a row off the page; `small` for dense lists; `href` when the whole row is one destination.
### Do / Don't
- Do keep the title short and let the description carry detail. Don't place controls inside a linked item.

## Realizations
### Figma
Drawn in the library: axes Variant, Size and State, with an icon media box, title and description. Hover and focus are drawn for the link form. Element set ItemGroup: two Item instances with an item separator between them. Not drawn: actions, header, footer, image media, the media offset, and the description link states (`realizations.design`).
### Web
Complete. `src/components/item/`: `Item.ts` (`sb-item`), `ItemGroup.ts`, `ItemSeparator.ts`, `ItemMedia.ts`, `ItemContent.ts`, `ItemTitle.ts`, `ItemDescription.ts`, `ItemActions.ts`, `ItemHeader.ts`, `ItemFooter.ts`; one shared `Item.scss`. Part `item` (in `sb-item`).
### Coverage
Behavior spec `playwright/tests/item/item.behavior.spec.ts`: all ten elements registered; default layout, padding, gap, radius, transparent border; variant and size reflect; small padding and gap; tertiary border and muted surface in light and dark; plain row is a div, no link, no role; href renders a native link named by the row text; Enter follows; solid focus ring and border for keyboard focus only; hover tint on links only; group is a list of listitems in the accessibility tree; separator presentational; standalone item has no role; roles set before first render; separator rule; media frames (icon 32px, image 40px, default); media moves to the top while a description exists; second content block does not grow; title weight, description muted and unclamped; actions, header and footer layout; description links underlined; axe clean (all stories).
### Known drift
- Solid focus ring.
- No description clamp.
- Explicit list roles with a presentational separator.
- Own separator rule instead of the Separator component.
- `href` instead of render-as-child.

## Open questions
None open (Q1 to Q4 answered in the contract).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-item-*` variables (check T4). Tests first.
