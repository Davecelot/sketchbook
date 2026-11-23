---
component: Kbd
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: visual reference shadcn/ui Kbd (look, names); contract-first standard (contract and build process)
---

# Kbd

> Marks up a key or shortcut people should press, such as Ctrl + K. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Show a key or shortcut (Ctrl, Esc, a command symbol) in text or next to a menu item. Not interactive: for something people press, use Button.

## 2. Anatomy
`sb-kbd`: a native `<kbd>` (part `key`) holding the default slot. `sb-kbd-group` (family element): a native `<kbd>` (part `group`) that lays several keys out in a row with an even gap.

## 3. Props / API
No props on either element. Slots: default (key text or an svg icon in `sb-kbd`; keys and separator text in `sb-kbd-group`).

## 4. Variant matrix
None.

## 5. Roles and color
Text `muted-foreground` on `muted`.

## 6. States
None; not interactive and not focusable.

## 7. Dimensions and layout
Inline-flex, height and minimum width 20px, 4px horizontal padding, 4px gap, radius `radius.small`. Icons are 12px. A group is inline-flex with a 4px gap.

## 8. Typography
12px (`font.size.caption`), weight 500, `font.family.body`.

## 9. Accessibility
- Native `<kbd>`; the text is read as written. The element has no ARIA role and is not focusable.
- An icon-only key needs a text alternative on its svg (`role="img"` and `aria-label`), or it is announced as nothing.
- `muted-foreground` on `muted` passes 4.5:1 in both modes (checked by T6). Sizes are px tokens, so zoom works.

## 10. Usage
### Behavior
Static. Text selection and pointer events are off, because a key label is not content to act on.
### Composition
`sb-kbd-group` around several `sb-kbd`. Place a group beside the action it triggers.
### Choosing the props
There are none; pick the key text. Use platform symbols only with an accessible name.
### Do / Don't
- Do write keys as users see them on their keyboard. Don't use Kbd for buttons that can be clicked.

## Realizations
### Figma
Drawn in the library: one key with a sample letter, and the element set KbdGroup (two Kbd instances at the group gap). Not drawn: an icon in the key (`realizations.design`).
### Web
Complete. Files: `src/components/kbd/Kbd.ts`, `src/components/kbd/Kbd.scss`, `src/components/kbd/Kbd.styles.ts`, `src/components/kbd/Kbd.stories.ts`, `src/components/kbd/index.ts`, `src/components/kbd/KbdGroup.ts`. Parts: `key`, `group`. Slots: `default`. Spec: `playwright/tests/kbd/kbd.behavior.spec.ts`.
### Coverage
- native kbd with slotted text; 20px high, 20px minimum width, grows with text
- color, background, font, radius, padding from tokens; slotted svg 12px
- group: inline-flex, gap token, keys in order and on one line
- inline in a sentence; not focusable, no role added
- axe clean (default, group, icon, in text)
### Known drift
- tooltip content styling: one look everywhere; the visual reference restyles Kbd inside tooltip content, not reproduced until Tooltip exists.

## Open questions
- Q1 (answered): `sb-kbd-group` is its own element.
- Q2 (answered): the visual reference's tooltip restyle is not reproduced (no Tooltip yet).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-kbd-*` variables (check T4). Tests first (rule test-first).
