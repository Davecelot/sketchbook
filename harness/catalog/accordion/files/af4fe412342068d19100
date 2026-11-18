---
component: Accordion
status: beta
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-08
source: shadcn/ui (visual reference and names), WAI-ARIA APG Accordion pattern
---

# Accordion

> Sections behind headings: people open only the parts they need, which keeps long pages short. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Let people scan a list of section titles and open only the ones they need. For a single optional section use Collapsible.

## 2. Anatomy
Four elements. `sb-accordion` owns which items are open; `sb-accordion-item` is the bordered block; `sb-accordion-trigger` is a heading (part `header`) around a native button (part `trigger`) with `label` and `chevron`; `sb-accordion-content` (parts `content`, `inner`) is the animated panel.

## 3. Props / API
| Element | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-accordion` | `selection` | single, multiple | single | one or many open at once |
| `sb-accordion` | `collapsible` | boolean | false | single only: allow closing the open item |
| `sb-accordion` | `value` | text | "" | open item value; space-separated for multiple |
| `sb-accordion` | `disabled` | boolean | false | all items |
| `sb-accordion` | event `change` | detail `{ value: string[] }` | | after a person opens or closes an item; a slotted control's own `change` also bubbles here: check `event.target === host` |
| `sb-accordion-item` | `value`, `disabled` | text, boolean | "", false | unique value per item |
| `sb-accordion-trigger` | `level` | number | 3 | heading level 2 to 6 |

## 4. Variant matrix
None; `selection` changes behavior, not appearance.

## 5. Roles and color
Text `foreground`, item divider `border`, chevron `muted-foreground`, focus ring `ring`.

## 6. States
open (chevron rotated, panel visible), hover (underlined trigger text), focus-visible (3px solid ring), disabled (opacity 0.5).

## 7. Dimensions and layout
Trigger padding 16px vertical, gap 16px, label left and chevron right (16px). Item has a 1px bottom border, none on the last item. Panel has 16px bottom padding. Height animates over `motion.duration.normal`; reduced motion turns it off.

## 8. Typography
14px body, trigger weight 500.

## 9. Accessibility
- Each trigger is a native button inside a heading (`role="heading"`, `aria-level` from `level`).
- `aria-expanded` mirrors the item. `aria-controls` is set with `ariaControlsElements` (element references cross from a shadow root to the light DOM above it; ID references do not).
- Forced colors: the chevron takes `ButtonText`.
- Heading `level` is clamped to 2-6. Item values must not contain whitespace because the accordion `value` is space-separated; a console warning fires once per item otherwise.
- References are re-resolved when a trigger or content is added or removed later.
- The panel is `role="region"` named by its trigger through ElementInternals `ariaLabelledByElements`, with an `aria-label` copy where the property is missing.
- Arrow Up/Down, Home and End move focus between enabled triggers; every enabled trigger also stays in the tab order (APG).
- A single, non-collapsible accordion marks the open trigger `aria-disabled="true"`.
- Closed panels are `visibility: hidden`, so they leave the tab order and the accessibility tree.

## 10. Usage
### Behavior
Opening an item in single mode closes the others. `change` fires only for people's actions, on the host; a `change` from a form control inside the content bubbles too, with another target and no detail.
### Composition
`sb-accordion` > `sb-accordion-item` > `sb-accordion-trigger` + `sb-accordion-content`.
### Choosing the props
Use `single` with `collapsible` for independent topics; use `multiple` when people compare sections side by side.
### Do / Don't
- Do keep trigger text short. Do not put controls in a trigger.

## Realizations
### Figma
Drawn in the library: axes State, Open and Disabled: trigger, chevron (up when open), content and the item border. The content text uses the body style (its line height is the body's; the styles use the control's). The trigger label fills the row so the chevron sits at the end with the trigger gap (the styles' space-between). Not drawn: the hover underline.
### Web
Complete. src/components/accordion/Accordion.ts, src/components/accordion/AccordionItem.ts, src/components/accordion/AccordionTrigger.ts, src/components/accordion/AccordionContent.ts, src/components/accordion/context.ts. Parts: header, trigger, label, chevron, content, inner, body.
### Coverage
- heading around a native button named by its text; level prop
- single: opening closes others; collapsible closes the open item
- non-collapsible single: open trigger aria-disabled, stays open
- multiple: value list reflects
- change detail, bubbles, composed, not fired for code changes; a slotted control's change has no detail
- Arrow Up/Down wrap, Home/End, tab order intact
- Enter/Space toggle
- disabled item skipped; disabled accordion dims every trigger
- ariaControlsElements and region named by trigger (accessibility tree)
- chevron rotation
- focus ring keyboard-only in token color
- height transition from token; none under reduced motion
- axe clean (five states)
### Known drift
- focus ring: the visual reference uses a translucent ring below 3:1 (WCAG 1.4.11)
- keyboard: added to the reference's markup following the APG; plain focus management, not the roving-focus controller, because triggers must stay in the tab order
- panel role: ElementInternals ariaLabelledByElements; aria-label copy of the trigger text where unsupported

## Open questions
All answered; see contract.json.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-accordion-*` variables (check T4). Tests first (rule test-first).
