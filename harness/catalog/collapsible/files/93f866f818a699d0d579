---
component: Collapsible
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference and names), WAI-ARIA APG Disclosure pattern
---

# Collapsible

> A disclosure that shows or hides one panel from a trigger. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Keep secondary detail out of the way until a person asks for it. For a set of sibling sections use Accordion. Never hide information that is needed to complete a task.

## 2. Anatomy
A family of three elements: `sb-collapsible` (state owner, no visuals), `sb-collapsible-trigger` (native `<button>`, part `trigger`) and `sb-collapsible-content` (parts `content` and `inner`). The family is deliberately unstyled; the author supplies the look of the trigger content and the panel.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-collapsible` | `expanded` | boolean | false | reflects; toggled by the trigger |
| `sb-collapsible` | `disabled` | boolean | false | disables the trigger |
| `sb-collapsible` | event `sb-toggle` | Event | | after `expanded` changes; bubbles and is composed |

## 4. Variant matrix
None.

## 5. Roles and color
The trigger inherits text color and font; only the focus ring has a token (`ring`).

## 6. States
open (height animates 0 to natural), closed (content `visibility: hidden`), focus-visible (3px solid ring), disabled (opacity 0.5).

## 7. Dimensions and layout
`sb-collapsible` and its content are `display: block`. The trigger is at least 24px square (`size.control.xs`). Content height animates with `grid-template-rows` 0fr to 1fr over `motion.duration.normal`; `prefers-reduced-motion` turns the animation off.

## 8. Typography
Inherited from the page.

## 9. Accessibility
- Native `<button>` with `aria-expanded`. Enter and Space toggle it natively.
- `aria-controls` is set with the `ariaControlsElements` property, because an ID reference cannot leave a shadow root but an element reference from the shadow root to the light DOM above it can. Without browser support only `aria-expanded` remains, which still carries the state.
- The reference is re-resolved when content is added or removed after the trigger.
- Closed content is `visibility: hidden` once the animation ends, so it leaves the tab order and the accessibility tree.
- The content is not a landmark: the disclosure pattern has no role for it.
- `aria-label` on `sb-collapsible-trigger` is forwarded to the button (icon-only triggers).

## 10. Usage
### Behavior
The trigger toggles `expanded`; setting `expanded` from code works too. `sb-toggle` fires after every change.
### Composition
Put one `sb-collapsible-trigger` and one `sb-collapsible-content` inside `sb-collapsible`. Keep the trigger to text and decorative icons.
### Choosing the props
Use `expanded` for content that should start visible. Use `disabled` only with a visible reason.
### Do / Don't
- Do name an icon-only trigger with `aria-label`. Don't put a button inside the trigger.

## Realizations
### Figma
Drawn in the library: axes State, Open and Disabled: a trigger with sample text and the content.
### Web
Complete. src/components/collapsible/Collapsible.ts, src/components/collapsible/CollapsibleTrigger.ts, src/components/collapsible/CollapsibleContent.ts, src/components/collapsible/context.ts. Parts: trigger, content, inner.
### Coverage
- native button trigger named by forwarded aria-label
- aria-expanded follows expanded; expanded reflects
- content hidden until opened
- Enter/Space toggle
- sb-toggle event bubbles, composed, also for programmatic changes
- disabled: native disabled, no toggle, dimmed
- ariaControlsElements resolves to the content host
- closed content out of the tab order
- focus ring keyboard-only in token color
- height transition from motion token; none under reduced motion
- axe clean (closed, open, text trigger)
### Known drift
- focus ring: the visual reference leaves the trigger unstyled; the ring is added so the trigger meets WCAG 2.4.7 and 1.4.11
- aria-controls: set through the ariaControlsElements property; Chromium lists it in the accessibility tree only when the target has an accessibility node

## Open questions
- Q1: aria-controls across shadow roots (recommendation: `ariaControlsElements`).
- Q2: root events (recommendation: `toggle`).
- Q3: content landmark (recommendation: none).

## Spec for agents
Build from contract.json only. CSS uses only `--sb-collapsible-*` variables (check T4). Tests first (rule test-first).
