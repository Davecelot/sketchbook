---
component: Switch
status: draft
version: 0.1.0
platforms: [web]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui (look and sizes), WAI-ARIA APG switch pattern, contract-first standard (contract and build process)
---

# Switch

> A toggle for an on/off setting with its label, description and error laid out beside it, taking part in forms. Typed spec: [contract.json](./contract.json).

## 1. Purpose
A single setting that is on or off and takes effect as it changes. Not for a choice recorded only on submit (Checkbox) or one choice among several (Radio Group).

## 2. Anatomy
`field` (grid) holds `control` (the track, with the native `<input type="checkbox" role="switch">` and the `thumb`), `label` (+ `required-indicator`), `description` (optional) and `error` (live region).

## 3. Props / API
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `label` | text | — | required; visible label and accessible name |
| `hide-label` | boolean | false | visually hidden, still the name |
| `description` | text | — | help text under the label |
| `error` | text | — | marks the field invalid |
| `name` | text | — | form field name |
| `value` | text | on | submitted while on |
| `checked` | boolean | false | current state; the attribute is the reset default |
| `required`, `disabled` | boolean | false | native; required means must be on |
| `size` | `default` \| `sm` | default | track 32x20px or 24x16px |

## 4. Variant matrix
`size` only: `default`, `sm`. States below.

## 5. Roles and color
Track `input` when off, `primary` when on; thumb `background`; label `foreground`; description `muted-foreground`; error and invalid outline `destructive`; focus ring `ring`.

## 6. States
focus-visible (3px solid ring), checked (primary track, thumb at the end), invalid, disabled (opacity 0.5, not-allowed cursor; also under `<fieldset disabled>`).

## 7. Dimensions and layout
Track 32x20px (sm 24x16px), pill radius, thumb 16px (sm 12px) inset evenly. 12px gap to the label; 6px between label and description. The thumb mirrors in RTL.

## 8. Typography
Label 14px, weight 500, line-height 1.43; description and error 14px, line-height 1.5.

## 9. Accessibility
- Native `<input type="checkbox" role="switch">` with a native `<label for>` in one shadow root. Space toggles; `aria-checked` follows the native state.
- Form association through `FormAssociated` + `NativeControl` (rule form-associated-controls): value submitted only while on, `form.reset()` restores the attribute default, `<fieldset disabled>` disables and re-enable restores, `required` gives `valueMissing`, `<label for>` on the page activates the host.
- Enter submits the form (implicit submission): the inner control has no form owner in its shadow root, so the component calls `form.requestSubmit()` (SB-0009).
- Description and error through `aria-describedby`; `aria-invalid` when invalid; a prop that shows an error also sets a `customError` validity (SB-0009); the error is a persistent polite live region.
- Track at 3:1 against the background and a solid focus ring (WCAG 1.4.11); the thumb meets 3:1 against both track colors.

## 10. Usage
### Behavior
`input` and `change` on each toggle, composed. The value is submitted only while on.
### Composition
One per setting; groups of them go in a Field set (later).
### Choosing the props
`size="sm"` for dense rows. `required` only when the form cannot be sent with the setting off. `hide-label` only when other visible text names the switch.
### Do / Don't
- Don't use a switch for a choice that only counts once the form is submitted; use Checkbox.
- Don't use vague labels.

## Realizations
### Web
Planned. Parts `field`, `control`, `input`, `thumb`, `label`, `required-indicator`, `description`, `error`. Tests in `playwright/tests/switch/switch.behavior.spec.ts`.
### Known drift
- API shape: shadcn composes Field parts around Switch; shadow DOM requires them inside
- track color: shadcn's unchecked track is neutral-200; changed for WCAG 1.4.11
- focus ring: shadcn uses ring/50, below 3:1 (WCAG 1.4.11)
- checked state: not reflected: the attribute is the default restored by form reset

## Open questions
All answered with the recommendation on 2026-11-12 (no approver available; SB-0012): checked not reflected (Q1), label required (Q2), native input with role=switch (Q3), sizes default and sm (Q4), required means on (Q5), web only for now (Q6).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-switch-*` variables (check T4). Tests first. Use `FormAssociated` + `NativeControl`.
