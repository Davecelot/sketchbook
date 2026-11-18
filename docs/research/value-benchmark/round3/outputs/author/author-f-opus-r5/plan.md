# Switch — plan

Planning gate for `sb-switch` (rule planning-gate). Contract: [contract.json](./contract.json), [contract.md](./contract.md). Status: draft; check passes.

**Approval:** recorded as approved by SB-0011 (owner pre-approval); the open questions below were answered with their recommendation and recorded in SB-0101 and the contract's `openQuestions`. Nobody was available to answer them in this session; the owner can revisit any of them.

## Scope
- One element, `sb-switch`: native `<input type="checkbox" role="switch">` with track, thumb, label, required indicator, description and error, sizes `default` and `sm`.
- Form-associated from the first implementation (rule form-associated-controls): FormData, reset, disabled fieldset, `required` validity, `error` customError, `<label for>` activation, form state restore.
- Out of scope: label-before-switch placement, icons in the thumb, a read-only state, an "off value", a loading state. Each waits for a real use case (hammock YAGNI).

## Files
| File | Purpose |
| --- | --- |
| `playwright/tests/switch/switch.behavior.spec.ts` | behavior spec, written first and seen failing |
| `src/components/switch/Switch.stories.ts` | stories: default, sm, checked, with description, required, error, disabled, disabled fieldset, hide-label, in a form, RTL |
| `src/components/switch/Switch.ts` | `FormAssociated(NativeControl(LitElement))` |
| `src/components/switch/Switch.scss` | only `--sb-switch-*` variables (T4) |
| `src/components/switch/Switch.styles.ts`, `index.ts` | generated / barrel entry (`npm run generate`) |

## Tokens
All component tokens alias existing semantic tokens (contract `tokens`); no new semantic or foundation token is needed. `size.switch.*` and `space.switch.inset` already exist and become used. Track dimensions: default 32x20, sm 24x16; thumb `size.icon.default` / `size.icon.sm`; inset 2px.

## Accessibility approach
- Native checkbox with `role="switch"`, named by a native `<label for>` in the same shadow root; description and error by `aria-describedby`; `aria-invalid` while invalid; error in a persistent polite live region.
- Keyboard: Tab, Space toggles (native), Enter calls `form.requestSubmit()` (SB-0009).
- State is shown by thumb position, not only color (1.4.1); 3:1 for the off track, on thumb vs on track, invalid outline and focus ring (1.4.11).
- `:dir(rtl)` flips thumb travel; `prefers-reduced-motion: reduce` removes the transition; forced-colors keeps a visible track border and thumb.
- Dev-only warning when `label` is empty (NativeControl).

## Test plan (test-first)
Behavior spec, all failing before the implementation:
1. Role `switch`, named by `label`; label click toggles; `hide-label` keeps the name.
2. Space toggles; Enter does not toggle and submits the enclosing form; keyboard focus shows the ring.
3. `aria-checked` follows `checked`; thumb moves to the inline end when on (and the inline start under RTL).
4. `input` and `change` fire once per user toggle, composed; neither fires on programmatic `checked` or on reset.
5. FormData: nothing while off; `value` (default `on`, and a custom value) while on; nothing without `name`.
6. `form.reset()` restores the `checked` attribute default in both directions.
7. `<fieldset disabled>`: not focusable, not toggleable, not submitted, `disabled` attribute untouched; re-enabling restores it.
8. `required`: `valueMissing` while off, valid when on, form submission blocked, asterisk aria-hidden, invalid look after blur.
9. `error`: `customError`, `aria-invalid`, text in the accessible description, announced through the live region; clearing it restores validity.
10. `<label for>` pointing at the host toggles it.
11. `disabled`: cannot toggle, skipped by Tab, dimmed via `:host(:disabled)`.
12. Sizes: track 32x20 / 24x16, thumb 16 / 12.
13. axe clean on every story.

## Risks
- Shadow-DOM form gaps (SB-0009): Enter submission without a submitter, ID references not crossing the boundary — covered by tests 2 and 9.
- Contrast of the off track and on thumb in dark mode and other brands: T6 checks the declared pairs; verify after generate.
- 20px track below the 24px target minimum: relies on the clickable label row and spacing; covered by test 1 and the a11y audit.

## Open questions (recommendation first)
- Q1 Native checkbox with role switch or a button? → **Native checkbox.** Answered (SB-0101).
- Q2 What does off submit? → **Nothing.** Answered (SB-0101).
- Q3 Enter toggles or submits? → **Submits; Space toggles.** Answered (SB-0101).
- Q4 Reflect `checked`? → **No; the attribute is the reset default.** Answered (SB-0101).
- Q5 Label required, and where? → **Required, after the switch.** Answered (SB-0101).
- Q6 Which sizes? → **default and sm.** Answered (SB-0101).
- Q7 Manual screen-reader pass → **Run it in the a11y audit before beta.** Open (needs a person with VoiceOver/NVDA).
