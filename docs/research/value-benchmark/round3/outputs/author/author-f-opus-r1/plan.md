# Plan: Switch (`sb-switch`)

Planning gate for [contract.json](./contract.json). **Approval:** no owner was available in the drafting session (2026-11-12); every open question was taken with its recommendation and recorded in the contract's `openQuestions` and in SB-0101 (status proposed), as SB-0011 allows. Implementation has not started.

## Scope
- One element, `sb-switch`: track with thumb, built-in label, description and error; `size` `default` | `sm`.
- Form-associated from the first commit (rule form-associated-controls): FormData, reset, state restore, disabled fieldset, `required` validity, `error` customError, `<label for>` activation.
- Out of scope: indeterminate, read-only, in-track text or icons, a loading state, a switch group element.

## Files (to be created when implementing)
- `src/components/switch/Switch.ts` — `class extends NativeControl(FormAssociated(LitElement))`.
- `src/components/switch/Switch.scss`, `Switch.styles.ts`, `index.ts`.
- `src/components/switch/Switch.stories.ts` — Default, Checked, Small, With description, Required, Error, Disabled, In a form, Disabled fieldset, RTL.
- `playwright/tests/switch/switch.behavior.spec.ts`.
- Registry status moves draft → wip → beta; `realizations.web` filled in as files land.

## Tokens
Component layer only, every one aliasing a semantic token already in `spec/tokens/semantic/` (listed in contract.json `tokens`). It reuses `size.switch.width|height|width-sm|height-sm` and `space.switch.inset`, which existed unused; thumbs reuse `size.icon.default|sm`. No new semantic tokens. The nine contrast pairs in the contract already pass T6 in every mode.

## Accessibility approach
- Native `<input type="checkbox" role="switch">` covering the track; native `<label for>` in the same shadow root; `aria-describedby` to description and error; `aria-invalid` while invalid.
- Space toggles natively. Enter calls `form.requestSubmit()` (SB-0009), never toggles.
- `?disabled=${this.isDisabled}` on the input; dim with `:host(:disabled)`.
- Host click whose `composedPath()[0]` is the host is forwarded to the input (external `<label for>`).
- `syncFormState()` runs in the change handler before `change` is re-dispatched.
- Thumb transition removed under `prefers-reduced-motion: reduce`; thumb position mirrors with `:dir(rtl)`.

## Test plan (written first, seen failing)
1. Name: label is the accessible name; role switch; `aria-checked` false/true; hide-label keeps the name; empty label warns once.
2. Pointer: clicking the track and the label toggles; the thumb moves to the inline end (and to the left in RTL).
3. Keyboard: Tab focuses; Space toggles; Enter submits the form and leaves the state unchanged; focus ring only on keyboard focus.
4. Events: one composed `input` and one composed `change` per toggle; none on programmatic `checked` or reset; FormData read in a `change` listener already has the new value.
5. Form: `name=value` only while on; custom `value`; nothing without `name`; `form.reset()` returns to the `checked` attribute; form state restore.
6. Disabled: `disabled` cannot toggle, is skipped by Tab, not submitted; `<fieldset disabled>` does the same without setting the attribute, and re-enabling restores it.
7. Validation: `required` and off → `valueMissing`, form blocked, `:invalid`; invalid look after blur or a submit attempt; `reportValidity()` focuses the switch; `error` → `customError`, `aria-invalid`, message announced via the live region, cleared when `error` is emptied.
8. `<label for>` outside the component toggles it.
9. Sizes: default track 32×20 / thumb 16; sm 24×16 / 12.
10. axe clean on every story.

## Risks
- Shadow DOM: an input inside a shadow root has no form owner — covered by Enter handling and the mixin (SB-0009).
- Thumb contrast in dark mode: the off pair is mode-free by choice; T6 guards it, and a brand change that drops it below 3:1 fails the check.
- The 24×16 small target depends on the label row; with `hide-label` in dense rows the spacing exception must still hold (story + axe).

## Open questions (recommendation first; answered by default)
- Q1 Enter toggles or submits? → **Submit** (answered, SB-0101).
- Q2 Value while off? → **Nothing** (answered, SB-0101).
- Q3 Reflect `checked`? → **No** (answered, SB-0101).
- Q4 Sizes? → **`default`, `sm`** (answered, SB-0101).
- Q5 Label required; in-track text? → **Required; no text** (answered, SB-0101).
- Q6 Manual screen-reader pass → **before beta** (open; needs a person).
