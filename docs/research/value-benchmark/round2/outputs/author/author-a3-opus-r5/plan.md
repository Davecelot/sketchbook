# Plan: Switch (planning gate)

Status: **approved by recommendation** (2026-11-12). No approver was available in the session; per the owner's instruction and SB-0011, every open question below was answered with its recommendation. The owner can revisit any of them before the build starts. Tests and code follow test-first; this session wrote the specification only.

## Scope
`sb-switch`: an on/off setting with built-in label, description and error, sizes `default` and `sm`, form-associated (FormData, reset, state restore, `<fieldset disabled>`, `required`, `<label for>`). Out of scope: a `lg` size, a label-position prop, a loading state, icons in the thumb, a switch group.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/switch/Switch.stories.ts` |
| 2 | `playwright/tests/switch/switch.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/switch/Switch.scss` -> `Switch.styles.ts` (generated) |
| 4 | `src/components/switch/Switch.ts`, `index.ts` |

No new mixin, controller or dependency: `Switch extends FormAssociated(NativeControl(LitElement))`, as Checkbox does (hammock ladder step 2).

## Tokens
All `switch.*` component tokens alias existing semantic tokens (`size.switch.*`, `space.switch.inset`, `size.icon.*`, `color.input|primary|background|primary-foreground|destructive|ring`, …); no semantic token is added. Contrast pairs for track, thumb, text and ring are declared in the contract and pass T6 in every mode.

## Accessibility approach
Native `<input type="checkbox" role="switch">` with `<label for>` in the shadow root; `aria-describedby` to description and error; `aria-invalid`; error as a persistent polite live region with `customError`; Enter calls `form.requestSubmit()` (SB-0009); thumb aria-hidden; state shown by position as well as color; reduced motion disables the slide.

## Test plan (test-first)
`playwright/tests/switch/switch.behavior.spec.ts`, using `playwright/helpers/`, one test per item, each seen failing before implementation:
- Props: `label` is the accessible name and clicking it toggles; `hide-label` keeps the name; `description` is the accessible description; `error` adds to the description, sets `aria-invalid` and the error look; `size` default 32×20 and sm 24×16 tracks; `value` default `on` and custom; `checked` attribute sets the initial state and is not reflected on toggle; `required` adds the aria-hidden asterisk; `disabled` cannot toggle or focus.
- Role and state: role `switch`, `aria-checked` false/true; thumb moves to the inline end when on (and to the start in RTL).
- Keyboard: Tab focuses; Space toggles; Enter submits the owning form and does not toggle; focus-visible ring on keyboard focus only.
- Events: `input` and `change` composed, once per toggle; a `change` listener sees the new value in `FormData`.
- Form: FormData has `name=value` only while on; `form.reset()` returns to the `checked` attribute; `<fieldset disabled>` disables without changing the `disabled` attribute and re-enables; `required` off is `valueMissing` and blocks submit, on is valid; `error` is `customError`; `<label for>` on the host toggles.
- Accessibility: empty `label` warns once; axe clean on every story.

Stories: Default, Checked, Small, With description, With error, Required, Disabled, Hide label, In a form.

## Accessibility deviations from the references
- Unchecked track `color.input` (neutral-500) instead of the reference's neutral-200: 3:1 (WCAG 1.4.11).
- Solid 3px focus ring instead of ring/50 (WCAG 1.4.11).
- Enter submits instead of toggling (APG lists Enter as optional; SB-0009 keeps implicit submission for every control).

## Risks
- `role="switch"` on `input type=checkbox`: some screen readers announce "switch, on" while older ones say "checkbox, checked". Both are correct; the behavior spec checks the role in the accessibility tree.
- The label-row grid duplicates Checkbox's SCSS. Accepted for now (Q9); the first option row extracts the shared row mixin per the form-associated-controls rule.

## Open questions (recommendation first)
All answered with the recommendation on 2026-11-12 (recorded in contract.json `openQuestions`):
1. Q1 Native element: native checkbox input with `role="switch"` (recommended) / button with `aria-checked`. → native input.
2. Q2 Enter: submits the form (recommended) / toggles. → submits.
3. Q3 Reflect `checked`: no, attribute is the reset default (recommended) / yes. → no.
4. Q4 `label` required: yes, with `hide-label` (recommended) / optional. → yes.
5. Q5 Sizes: `default` and `sm` (recommended) / add `lg`. → default and sm.
6. Q6 Label position: track first, no prop (recommended) / `label-position` prop. → no prop.
7. Q7 Invalid look: destructive border plus error text and `aria-invalid` (recommended) / text only. → border, text and `aria-invalid`.
8. Q8 Motion: slide, off under reduced motion (recommended) / no animation. → slide, off under reduced motion.
9. Q9 Shared row mixin now: no, reuse FormAssociated + NativeControl (recommended) / extract now. → no.
