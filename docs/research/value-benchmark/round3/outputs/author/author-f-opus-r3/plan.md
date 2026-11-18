# Switch — plan

Planning gate for `sb-switch` (contract: [contract.md](./contract.md), [contract.json](./contract.json)). Status `draft`. Nobody was available to approve this plan; every open question was answered with its recommendation and recorded in the contract's `openQuestions` and in SB-0101 (as SB-0011 does for earlier waves), so the owner can revisit any of them.

## Scope
- One element, `sb-switch`: label, hide-label, description, error, name, value, checked, required, disabled, size (`default`, `sm`).
- Form-associated from the first implementation (rule form-associated-controls): FormData, form reset, form state restore, `<fieldset disabled>`, `required` validity, `<label for>` activation, Enter submits (SB-0009).
- Out of scope: a label-position prop, an "off value", a loading state, read-only, icons inside the thumb (none in the reference; YAGNI).

## Files
| File | What |
| --- | --- |
| `playwright/tests/switch/switch.behavior.spec.ts` | behavior spec, written first |
| `src/components/switch/Switch.stories.ts` | stories: Default, Checked, Small, WithDescription, Invalid, Required, Disabled, HiddenLabel, InForm, RTL |
| `src/components/switch/Switch.ts` | `FormAssociated(NativeControl(LitElement))`; hooks `formValue`, `formReset`, `formStateRestore`, `validationAnchor` |
| `src/components/switch/Switch.scss` | only `--sb-switch-*` variables (T4) |
| `src/components/switch/Switch.styles.ts`, `src/index.ts` | generated (`npm run generate`), never by hand |
| `src/components/switch/index.ts` | registers the element |

No new mixin or controller: Checkbox already proves `FormAssociated` + `NativeControl` over a native checkbox.

## Tokens
All 31 component tokens in `contract.json` alias existing semantic tokens; no semantic or foundation token is added. Sizes use the existing `size.switch.width|height(-sm)` and `space.switch.inset`; thumbs use `size.icon.default|sm`. Colors: off track `color.input`, off thumb `color.background`, on track `color.primary`, on thumb `color.primary-foreground`, invalid border and error `color.destructive`, ring `color.ring`. Every color pair is declared in `accessibility.contrast` and passes T6 in light and dark.

## Accessibility approach
- `<input type="checkbox" role="switch">` with a native `<label for>` in the same shadow root; `delegatesFocus`; state exposed as aria-checked by the browser.
- Space toggles natively; Enter calls `form.requestSubmit()`.
- `aria-describedby` → description and error; `aria-invalid` when invalid; persistent polite live region for the error; `error` sets `customError`.
- Track and thumb `aria-hidden`; the input covers the track, so the whole track is the hit area.
- Solid 3px focus ring through `:state(focus-visible)`; dimmed through `:host(:disabled)`; reduced motion removes the thumb transition; `:dir(rtl)` mirrors it.

## Test plan (test-first)
Write the spec and stories, run `npm run test:component -- tests/switch`, record that every test fails because `sb-switch` is not defined, then implement.

1. Name: role `switch` named by `label`; hide-label keeps the name; empty label warns once.
2. Description and error in the accessible description; `aria-invalid` when `error` is set.
3. Click on the track and on the label toggles; aria-checked follows.
4. Space toggles; Enter does not toggle and submits the enclosing form.
5. Focus ring visible on keyboard focus only.
6. `input` and `change` fire once per user toggle, composed; neither fires when `checked` is set from code.
7. Size: default track 32×20 and thumb 16; `sm` 24×16 and thumb 12; label size unchanged.
8. Checked look differs from off (track color and thumb position); RTL mirrors the thumb.
9. FormData: nothing while off, `on` while on, custom `value`; no `name` → nothing.
10. `form.reset()` restores the `checked` attribute (both from on and from off).
11. `<fieldset disabled>`: not submitted, cannot toggle, own `disabled` attribute untouched; re-enabling restores it.
12. `disabled`: cannot be focused or toggled, not submitted.
13. `required`: `valueMissing` while off, valid when on, `reportValidity()` focuses it, invalid look only after blur or submit attempt, asterisk aria-hidden.
14. `error` blocks submission (`customError`); clearing it unblocks.
15. `<label for>` pointing at the host toggles it.
16. axe clean on every story.

Then green: `npm run check`, `npm run typecheck`, `npm run test:component`; parity audit and review-rangers before `beta`.

## Risks
- `role="switch"` on a checkbox input: some older screen readers announce "checkbox". Mitigation: manual VoiceOver/NVDA pass (Q9) before beta.
- The `sm` track is 16px high, below 24px; it relies on the WCAG 2.5.8 spacing exception and the clickable label. Guidance says to keep 24px between neighbours.
- The transparent input must cover exactly the track at both sizes, or clicks on the track edge miss; covered by test 3 at both sizes.
- Enter not toggling differs from some switch libraries; recorded as SB-0101.

## Open questions (recommendation first; all answered with it on 2026-11-12)
| Id | Question | Answer |
| --- | --- | --- |
| Q0 | Draft from the APG switch pattern and the visual reference? | Yes |
| Q1 | Native element? | `<input type="checkbox" role="switch">`, not a button |
| Q2 | Enter toggles or submits? | Submits (SB-0009); Space toggles |
| Q3 | Value while off? | Nothing submitted; `value` only while on |
| Q4 | Reflect `checked`? | No; the attribute is the reset default |
| Q5 | `label` required? | Yes; `hide-label` keeps the name |
| Q6 | Sizes? | `default` 32×20 / thumb 16, `sm` 24×16 / thumb 12 |
| Q7 | Invalid look? | Destructive track border + error text + aria-invalid |
| Q8 | Label side? | After the switch; no label-position prop |
| Q9 | Manual screen-reader pass | Still open: run before beta |

## Approval
Recorded as approved under SB-0011 and SB-0101 (no approver available in this session). Implementation has not started.
