# Plan: Switch

Status: approved under SB-0011 (no approver in the 2026-11-12 session; every question taken with its recommendation and recorded in contract.json `openQuestions` and SB-0101). Contract: [contract.json](./contract.json), [contract.md](./contract.md).

## Scope
`sb-switch`: one on/off setting with label, description, error, `size` (`default`, `sm`), form association (`name`, `value`, `checked`, `required`, `disabled`), `input` and `change` events. Out of scope: mixed state, `hide-label`, `lg` size, label-at-start layout, Enter to toggle.

## Files
- `src/components/switch/Switch.ts`: `class Switch extends NativeControl(FormAssociated(LitElement))`, the four hooks only (`formValue`, `formReset`, `formStateRestore`, `validationAnchor` from NativeControl), `size` and `checked` props, `error` → customError.
- `src/components/switch/Switch.scss`: only `--sb-switch-*` and `--_*`; size via `:host([size="sm"])`; dim via `:host(:disabled)`; thumb mirrored with `:dir(rtl)`; transition off under `prefers-reduced-motion`.
- `src/components/switch/Switch.stories.ts`, `src/components/switch/index.ts`.
- `playwright/tests/switch/switch.behavior.spec.ts`.
- Generated (never by hand): `Switch.styles.ts`, `src/index.ts`, component token CSS (`npm run generate`).

Reuse before adding: the two mixins, `submitOnEnter`, the Checkbox field grid. No new mixin, controller or dependency. No new semantic tokens: `size.switch.*` and `space.switch.inset` already exist.

## Tokens
31 component tokens in contract.json `tokens`, all aliasing semantic tokens (one step, T2). Contrast: 9 pairs, all passing in light and dark (lowest 4.18:1 for the off track and thumb in dark, need 3:1).

## Accessibility approach
Native `<input type="checkbox" role="switch">` over the track, `<label for>` in the same shadow root, `aria-describedby` to description and error, `aria-invalid`, polite live error region, aria-hidden thumb and asterisk, 3px solid ring, `delegatesFocus`. Keyboard: Tab, Space toggles, Enter submits (SB-0009).

## Test plan (test-first)
Write the stories and the behavior spec first, run `npm run test:component -- tests/switch`, record that each test fails for the right reason (element not defined), then implement. One test per item:
- props: label is the accessible name; description and error are in the accessible description; `size="sm"` gives a 24x16 track and 12px thumb, default 32x20 and 16px; `value` custom; `checked` attribute starts on and is not reflected after a toggle;
- states: focus-visible ring on keyboard focus only; checked moves the thumb and changes the track color; invalid sets `aria-invalid` and the border; disabled cannot toggle or focus;
- keyboard: Tab focuses; Space toggles; Enter submits the form and does not toggle;
- events: `input` and `change` once per toggle, both composed; a `change` listener reading `FormData` sees the new value;
- form: FormData has `value` only while on; `form.reset()` restores the attribute default; `<fieldset disabled>` disables without adding the attribute, re-enable restores; `required` + off is `valueMissing` and blocks submit, `reportValidity()` focuses the input; `error` gives `customError`; `<label for>` on the host toggles;
- accessibility: role `switch` with `aria-checked`; empty label warns once; RTL thumb mirrored; axe clean on every story.

Then green: `npm run check`, `npm run typecheck`, `npm run test:component`; review-rangers; status `beta`.

## Risks
- Screen readers announce the native switch role from `role="switch"` on a checkbox input; verify the on/off announcement in the a11y pass (VoiceOver, NVDA).
- The invisible input must cover the whole track so pointer hits toggle it; the thumb must not intercept clicks.
- The thumb travel is `track width − thumb size − 2 × inset`; compute it from tokens in CSS, not a literal.

## Open questions
All answered with the recommendation (contract.json Q1–Q6):
1. Native checkbox with `role="switch"` — **yes** (not a button).
2. Enter toggles? — **no**, it submits the form.
3. Sizes — **`default` and `sm`**.
4. Reflect `checked`? — **no**.
5. Label position — **after the control**.
6. `hide-label` — **not in this version**.
