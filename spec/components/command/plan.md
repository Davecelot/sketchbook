---
stage: ready
basis: plan Status line (2026-11-12)
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-12
approved-contract: sha256:d1e02a9b7a9a5a8ec3a766571806ce1b8fc54a02dac8c6343bba2084783b0211
approved-plan: sha256:03c264dbac998601a40e3b0ec1d8046418afd57d54a0cc65ee8128f9ccb45980
---

# Plan: Command (planning gate)

Status: **approved** (owner answered Q1–Q7, 2026-11-12). Test-first from here. Decisions: SB-0103, SB-0106, SB-0107 (accepted).

## Scope
In: the eight elements of the contract (`sb-command`, `-input`, `-list`, `-empty`, `-group`, `-item`, `-separator`, `-shortcut`); built-in filtering (`filter="auto"`) and `filter="manual"`; active item by arrows, hover and first match; `loop`; `sb-select`; result-count announcement (`results-label`); stories inline and inside `sb-dialog` (only if Dialog is built by then, otherwise a native `<dialog>` in the story).

Out (contract Q6): async loading state, nested pages, multi-select, global shortcut registration (Cmd+K), item `href`, a controlled active value, Ctrl+N/P keys, dialog-specific sizing, ranking.

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/command/Command.stories.ts` (Default, Groups and shortcuts, Disabled item, Empty, Manual filter, Scrollable, In a dialog, RTL) |
| 2 | `playwright/tests/command/command.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/command/Command.scss` -> `Command.styles.ts` (generated) |
| 4 | `src/components/command/context.ts`, `Command.ts`, `CommandInput.ts`, `CommandList.ts`, `CommandEmpty.ts`, `CommandGroup.ts`, `CommandItem.ts`, `CommandSeparator.ts`, `CommandShortcut.ts`, `index.ts` |
| 5 | `npm run generate` (styles, `src/index.ts`, component tokens), then `contract.json` realizations filled |

One stylesheet for the family, as Tabs does. No new mixin or controller: `RovingFocusController` moves DOM focus, which this pattern must not do, so the arrow handling (a few lines over the visible enabled items) lives in `sb-command`. Not form-associated (Q3), so no `FormAssociated` mixin.

## Tokens
All 40 component tokens alias existing semantic tokens (contract `tokens`); no literal in the CSS. The two that were missing (Q1) are added: `size.list.max-height` (300px, base) behind `command.list.max-height`, and `font.letter-spacing.key` (`font.letter-spacing.widest`, 0.1em, from the tailwind letter-spacing preset, SB-0106/SB-0107) behind `command.shortcut.letter-spacing`.

No color token is missing (light and dark use popover, accent, muted-foreground, border, ring).

## Accessibility approach
- Search field: native `<input type="text">` in `sb-command-input`'s shadow root, `delegatesFocus`, `role="combobox"`, `aria-expanded="true"`, `aria-autocomplete="list"`, `aria-label` from `sb-command`'s `label`; autocomplete/autocorrect/spellcheck off.
- Cross-root references by element reflection, never IDs (SB-0009): `input.ariaControlsElements = [list]`, `input.ariaActiveDescendantElement = activeItem` (light-DOM hosts, reached outward from the shadow root). Re-set on every filter, add or remove.
- Roles as host attributes: `listbox` (list, `aria-label` = label), `group` (named by its label; visible heading `aria-hidden`), `option` (item, `aria-selected` on the active one, `aria-disabled`). Separator and empty: `role="none"`. Hidden items: `hidden` (out of the a11y tree).
- Status: visually hidden `role="status"` in `sb-command`'s shadow root, updated after typing pauses (a short debounce in code; the delay is a `PROPOSAL` confirmed in review).
- Keyboard: ArrowDown/ArrowUp (loop optional), Enter selects and `preventDefault` (no form submit, SB-0009 point 1 in reverse), Home/End left to the field, Escape not handled.
- Forced colors: active item `Highlight`/`HighlightText`.
- The manual screen-reader pass (Q5) is replaced by the automated screen-reader views (SB-0113), stored in playwright/tests/command/__screen-reader__/*.txt.

## Test plan (test-first)
One test per contract item in `command.behavior.spec.ts`, with the helpers in `playwright/helpers/`; each must fail first (element not defined), recorded before implementing.
- Props: `label` names the combobox and the listbox; `filter=auto` hides non-matching items, groups and separators and keeps order; accent- and case-insensitive multi-term match against `value` and `keywords`; `filter=manual` hides nothing; `loop` off stops at ends, on wraps; `results-label` template used in the status text; item `value` defaults to trimmed text; `disabled` item skipped by arrows and hover, no `sb-select`.
- States: first enabled match is active after typing; hover makes active; active item has `aria-selected=true`, accent fill and ring from tokens; disabled opacity from tokens; empty state shown only with zero matches.
- Keyboard: ArrowDown/ArrowUp; Enter fires `sb-select`; Enter inside a `<form>` does not submit; Home/End move the caret; Escape propagates (a listener on an ancestor sees it); Tab leaves.
- Events: `sb-select` detail `{ value }`, bubbles, composed, target is the item, not fired from code; native `input` reaches `sb-command`.
- Accessibility: combobox/listbox/option/group roles in the accessibility snapshot; `ariaActiveDescendantElement` and `ariaControlsElements` point at the right elements after filtering; status text after typing pauses (count, then empty text); shortcut not in the option name; console warning without `label`; forced colors; axe clean on every story; inside a dialog, opening focuses the search field.
- RTL story: layout mirrors (shortcut at the inline end).

## Risks
- Element-reflection `aria-activedescendant` support and announcement differ across browser and screen-reader pairs (Q5); Playwright only proves the property, not speech.
- Keeping references and the status in sync with light-DOM changes (items added by a manual filter) needs a slot-change/mutation path; tested with the manual-filter story.
- `role` attributes on hosts nested in custom elements: axe must see option ownership through `sb-command-group`; Tabs hit a similar ownership issue (tabindex on the host).
- Dialog is being authored at the same time; the dialog story waits for it or uses a native `<dialog>`.

## Answers (owner, 2026-11-12)
- Q1 Tokens: **added** (`size.list.max-height`, `font.letter-spacing.key`).
- Q2 Filter rule: **all-terms substring, case/accent-insensitive, document order**; ranking later behind `filter=manual`.
- Q3 **Not form-associated**, an explicit exception to rule form-associated-controls (SB-0103).
- Q4 **Caret-only field, inset ring on the active item.**
- Q5 **Manual screen-reader pass** is replaced by the automated screen-reader views (SB-0113), stored in playwright/tests/command/__screen-reader__/*.txt; fallback is mirroring the active name into the status region.
- Q6 Deferred features **left out of 0.1** (list in Scope).
- Q7 **One anti-pattern** (APG Listbox).

## Documentation (check M1 and the plan's definition of done)
Before beta: `site/_examples/command.html` (curated example; the page comes from `npm run docs:components`), batch in `spec/design-docs.json`, design library (`sync library command`, verify, realize), doc page stamped `checked`, parity audit, catalog rebuilt.
