---
component: Button
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: [Spinner]
last_updated: 2026-11-08
source: shadcn/ui Button (UI and API), contract-first standard (contract and build process)
---

# Button

> The control people press to do one thing now: run an action, submit or reset a form, or (with href) go somewhere. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Start an action in the current view (save, send, create, confirm, cancel), or submit a form. For navigation use `href`: it renders a real link styled as a button, so open-in-new-tab and link semantics keep working (Q4).

## 2. Anatomy
`button` (native `<button>`, or a native `<a>` when `href` is set; part `button` either way) holds, in order: `leading-icon` (optional) or `spinner` (`sb-spinner`, decorative, while loading), `label` (default slot), `trailing-icon` (optional). Icons are 16px and decorative.

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | primary, destructive, tertiary, secondary, ghost, link | primary | emphasis levels |
| `size` | medium, tiny, small, large, icon, icon-tiny, icon-small, icon-large | medium | 36 / 24 / 32 / 40px (medium / tiny / small / large); icon sizes are square and need `aria-label` |
| `type` | button, submit, reset | button | never submits by accident |
| `disabled` | boolean | false | native disabled, out of tab order; with `href` the link loses its href; wins over loading |
| `loading` | boolean | false | harness addition; spinner + label, focus kept |
| `name`, `value` | text | — | submitted with type=submit |
| `href` | text | — | renders a native link styled as a button; `type`, `name` and `value` are ignored; `javascript:`, `vbscript:` and `data:` URLs are dropped (SB-0115) |
| slots | default, leading-icon, trailing-icon | — | |

## 4. Variant matrix
6 variants × 8 sizes = 48, minus `link` with the four icon sizes (no affordance) = 44 combinations.

## 5. Roles and color
| Variant | Background | Text | Hover |
| --- | --- | --- | --- |
| primary | `primary` | `primary-foreground` | background at 90% |
| destructive | `destructive` | `destructive-foreground` | background at 90% |
| tertiary | `background`, 1px `border`, shadow-xs | `foreground` | `accent` / `accent-foreground` |
| secondary | `secondary` | `secondary-foreground` | background at 80% |
| ghost | transparent | `foreground` | `accent` / `accent-foreground` |
| link | transparent | `primary` | underline |

## 6. States
hover, focus-visible (3px solid ring in `ring`), disabled (opacity 0.5), loading (spinner, opacity 0.5, still focusable). Disabled wins over loading.

## 7. Dimensions and layout
Heights 24 / 32 / 36 / 40px for tiny / small / medium / large (`size.control.*`, density in brand.config); icon sizes are squares of the same heights. Padding-x and gap shrink per size, and padding-x reduces further when an icon is present. Icons are 16px (12px at tiny and icon-tiny). Radius `radius.control` (8px). Inline-flex, no wrapping.

## 8. Typography
14px (`font.size.control`; `font.size.control-xs` at xs), weight 500, line-height 20px, `font.family.body`.

## 9. Accessibility
- Native `<button>` with `delegatesFocus`. Enter and Space activate it natively.
- Name from the label text. Only host `aria-label` is forwarded to the inner control: ID references (`aria-labelledby`, `aria-describedby`) don't resolve across shadow roots (SB-0009). Icon sizes require `aria-label` (dev warning once otherwise).
- Loading: `aria-busy="true"` and `aria-disabled="true"`; it keeps focus (deviation from the reference implementation, which uses native disabled and drops focus).
- Focus ring on `:focus-visible`, 3px, solid `ring` color (deviation from the visual reference's translucent ring, which falls below 3:1).
- With `href`: native `<a>`; disabled gives `role="link"` without href and `aria-disabled="true"`.
- Target size at least 24px in every size (WCAG 2.5.8). Form-associated through ElementInternals: submit calls `form.requestSubmit()`, reset calls `form.reset()`. A custom element is never the form's default button, so the first `type=submit` sb-button handles Enter in a native text field of its form (implicit submission), once, with its name and value, and not while disabled or loading; a native submit button in the form keeps that role.

## 10. Usage
### Behavior
Clicks are ignored while disabled or loading, including `host.click()`. `type` defaults to `button`. With `href` it is a link and `type` is ignored.
### Composition
Use Button Group for related actions in a row. For icon-only actions use `size="icon"` with `aria-label`.
### Choosing the props
One `primary` per view; `tertiary` or `secondary` for alternatives; `ghost` in toolbars; `destructive` for irreversible actions, with confirmation; `link` for low-emphasis inline actions that still act, not navigate.
### Do / Don't
- Do start labels with a verb ("Save changes"). Don't use "OK" or "Click here".
- Do explain why an action is unavailable. Don't leave a disabled button unexplained.

## Realizations
### Figma
Drawn in the library. Axes, values and property names come from the API vocabulary (`sketchbook api figma button`): Variant, Size, State and Disabled, with Label text, Left icon and Right icon (each an icon swap plus a switch). Not drawn: the link underline on hover (Figma shares a label's text decoration across every variant) and the smaller padding when an icon is shown (auto layout cannot depend on a child's visibility).
### Web
Complete. Files: `src/components/button/Button.ts`, `Button.scss`, `Button.styles.ts` (generated), `Button.stories.ts`, `index.ts`. Parts: `button`, `leading-icon`, `spinner`, `label`, `trailing-icon`. Slots: default, `leading-icon`, `trailing-icon`. Spec: `playwright/tests/button/button.behavior.spec.ts`.
### Coverage
- native button + name
- variant colors from component tokens
- contract heights, square icon sizes
- Enter/Space, keyboard-only focus ring
- focus ring on every variant (tertiary included)
- implicit submission from native fields: once, name/value, blocked while disabled, native submit button wins
- disabled: no click, out of tab order, dimmed
- loading: no click, focusable, aria-busy/aria-disabled, spinner + label
- submit with name/value, reset, default type
- href renders a link; disabled removes href
- icon size named by forwarded aria-label
- one-time missing-name warning
- axe clean (matrix, loading)
### Known drift
- Dark outline background: `color.background`; shadcn uses `input/30` in dark, not reproduced yet.
- Focus ring: solid 3px; shadcn uses ring/50 plus border-ring, changed for WCAG 1.4.11.
- Sizes: `tiny` and `icon-tiny` (24px) included; current shadcn Button also has xs, older shadcn did not.
- Form association: own ElementInternals code, not the shared `FormAssociated` mixin (a button has no value or validity of its own).
- Spinner size: Button sets `--sb-spinner-size` to its icon size; shadcn sizes the spinner with utility classes.

## Open questions
- Q1 (answered): icon-only buttons use `size=icon*` on Button, named with `aria-label`; no separate Icon Button.
- Q2 (answered): loading keeps the label with a spinner, dimmed, still focusable, with `aria-busy` and `aria-disabled`.
- Q3 (answered): sizes are medium, tiny, small, large, icon, icon-tiny, icon-small, icon-large (SB-0006).
- Q4 (answered): yes, `href` renders `<a part="button">` and links keep link semantics (SB-0006).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-button-*` variables (check T4). Tests first (rule test-first). Variant hover uses `color-mix(in oklab, <bg> 90%, transparent)` (80% for secondary).
