# Plan: Input Group (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-input-group` (invalid, focus tracking), `sb-input-group-addon` (align), `sb-input-group-text`, `sb-input-group-button` (wraps `sb-button`). Works with a slotted `sb-input`, native `input` or `textarea`.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/input-group/InputGroup.stories.ts` |
| 2 | `playwright/tests/input-group/input-group.behavior.spec.ts` (written first, must fail) |
| 3 | `InputGroup.scss` -> `InputGroup.styles.ts` (one sheet, four elements) |
| 4 | `InputGroup.ts`, `InputGroupAddon.ts`, `InputGroupText.ts`, `InputGroupButton.ts`, `index.ts` |

## Test plan (test-first)
- Shell border and height from tokens; the control has no border of its own (native and `sb-input`).
- Addon order for each `align`; block addons stack the shell.
- Focus: shell ring while the control is focused, none when an addon button is focused; the inner control shows no second ring.
- Invalid: shell border color, `aria-invalid` on a native control and its removal.
- Addon click focuses the control, but a button click does not steal activation.
- Button: icon-only named by aria-label; click event reaches the host; disabled; submit inside a form.
- role=group only with aria-label; axe clean per story.

## Accessibility deviations from the references
- Native placeholders keep the browser color (CSS limit).
- Shell ring uses the solid ring color for focus, and color-mix 20% for the invalid ring like Input.

## Open questions (recommendation first)
- Q1 neutralize `sb-input` through its tokens. Q2 `focusin`/`focusout` plus `validation` prop. Q3 no disabled prop yet. Q4 placeholder default. All answered.
