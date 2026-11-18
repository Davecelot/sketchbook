# Plan: Switch (planning gate)

Status: **draft, open questions answered with the recommendation (no reviewer was available)**. Tests and code start only after the person confirms this plan (planning gate, then test-first).

## Scope
A form-associated on/off control: native `<input type="checkbox" role="switch">`, label, hide-label, description, error, `size` default|sm, `name`, `value`, `checked`, `required`, `disabled`. Not in scope: On/Off text, read-only, groups.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

## Tokens
All `switch.*` component tokens are in contract.json and alias semantic tokens only (existing `size.switch.*` and `space.switch.inset`); no new semantic token is needed.

## Accessibility approach
Native control first: role=switch on a checkbox, label through native `<label for>` in the shadow root, `aria-describedby` to description and error, `aria-invalid`, persistent polite live region for the error, `isDisabled` on the inner input, solid 3px focus ring, thumb position (not color alone) shows the state. Enter submits the form (SB-0009).

## Test plan (test-first)
One test per item; each must fail first for the right reason (element missing).
- Props: label is the name; hide-label keeps the name; description and error in the accessible description; `size` sm gives a 24x16 track and default 32x20; `value` default `on` and custom; `checked`, `required`, `disabled`.
- States: keyboard focus ring; checked paints differently; invalid look and `aria-invalid`; disabled cannot toggle.
- Keyboard: Tab focuses, Space toggles, Enter does not toggle and submits the form.
- Events: `input` and `change` composed, once per toggle; a `change` listener reading FormData sees the new value.
- Form: FormData has the value only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables, is not submitted, and re-enable restores without touching the `disabled` attribute; `required` off is invalid (`valueMissing`) and on is valid; error gives `customError`; `<label for>` click toggles.
- Accessibility: role switch, accessible name, description, invalid, axe clean on all stories.

## Accessibility deviations from the references
- Solid 3px focus ring instead of ring/50 (WCAG 1.4.11).
- Track border at 3:1 instead of a translucent one (WCAG 1.4.11).
- Error announced when it appears, and blocks submission (SB-0005, SB-0009).

## Risks
- `sm` track (16px tall) is under 24px: relies on the label row and gap (WCAG 2.5.8).
- The thumb must mirror in RTL (`:dir(rtl)`, SB-0007).
- Checked fill vs thumb contrast must hold in both modes (contrast pairs in the contract).

## Open questions (recommendation first)
All answered with the recommendation; the person can revisit them (SB-0011 style). Full text in contract.json Q0-Q6.
- Q1 Native checkbox with role=switch (answered: yes).
- Q2 label required, description and error inside (answered: yes).
- Q3 Sizes default|sm (answered: yes).
- Q4 required means must be on; checked not reflected (answered: yes).
- Q5 Enter does not toggle, it submits (answered: yes).
- Q6 No On/Off text and no read-only (answered: yes).
