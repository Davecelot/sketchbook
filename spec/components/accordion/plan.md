---
stage: ready
basis: SB-0011
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-08
approved-contract: sha256:735104404a2c2963996ed47ad7d5433581f3f2935299704f0532cd50d3207db2
approved-plan: sha256:00ea28edcd8ec5a372d1156a5656a57751a1bffba058a8de9abfbb5dba76292b
---

# Plan: Accordion (planning gate)

Status: Approved under SB-0011 (owner pre-approval, 2026-11-08).

## Scope
`sb-accordion`, `-item`, `-trigger`, `-content` following the visual reference: selection single|multiple, collapsible, value, disabled, chevron rotation, animated height, arrow-key navigation between triggers. Out of scope: lazy content, per-item `defaultValue` (use `value`).

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/accordion/Accordion.stories.ts` |
| 2 | `playwright/tests/accordion/accordion.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/accordion/Accordion.scss` -> `Accordion.styles.ts` (generated, shared) |
| 4 | `Accordion.ts`, `AccordionItem.ts`, `AccordionTrigger.ts`, `AccordionContent.ts`, `context.ts`, `index.ts` |

## Test plan (test-first)
- Heading + native button per item; trigger name is its text; `aria-level` follows `level`.
- single: opening one closes the other; collapsible closes the open one; without it the open trigger is `aria-disabled` and stays open.
- multiple: several open; `value` is a space-separated list and reflects.
- `change` detail, bubbles and composed; not fired for programmatic `value`.
- Arrow Up/Down wrap, Home/End, disabled items skipped; every trigger stays tabbable.
- `aria-controls` property and panel name from its trigger; panel is a region.
- Chevron rotates; focus ring keyboard-only; disabled (root and item); transition token and reduced motion.
- axe in several states.

## Accessibility deviations from the references
- 3px solid focus ring (the reference's translucent ring is below 3:1, SB-0005).
- Arrow-key navigation added; Tab order unchanged.

## Open questions (recommendation first)
All five answered with the recommendation (see contract.openQuestions): multiple `value` as a space-separated string; all triggers in the tab order; `level` prop; `value-change` event name; aria-disabled on the sole open trigger.
