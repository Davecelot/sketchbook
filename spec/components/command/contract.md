---
component: Command
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Command (visual reference and names), WAI-ARIA APG Combobox (editable, list autocomplete) and Listbox patterns
---

# Command

> A search field that filters a list of grouped actions or destinations; Arrow Up and Down move the active item, Enter selects it. Typed spec: [contract.json](./contract.json).

## 1. Purpose
Let people find and run one item from a known set by typing: jump to a docs page, run an action. It is the content of a command palette (inside a dialog) or an inline filterable list. It does not pick a value for a form; that is a select or a combobox field.

## 2. Anatomy
Eight elements:
- `sb-command` (part `root`): the surface; owns the search text, the active item and the filtering; holds a visually hidden status region for the result count.
- `sb-command-input`: a row with a bottom border, a decorative search icon (`icon`) and the search field (`input`).
- `sb-command-list` (part `list`): scrolls past its maximum height; holds everything below.
- `sb-command-empty` (part `empty`): text shown only while nothing matches.
- `sb-command-group` (parts `group`, `heading`): a titled group of items.
- `sb-command-item` (part `item`): one option; optional leading icon, text, optional shortcut.
- `sb-command-separator` (part `separator`): a line between groups.
- `sb-command-shortcut` (part `shortcut`): a shortcut hint at the end of an item.

The command dialog of the visual reference is not a part: it is the composition `sb-dialog` > `sb-command` (see Composition).

## 3. Props / API
| Element | Prop / event | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-command` | `label` | text | "" | required; names the search field and the list |
| `sb-command` | `filter` | auto, manual | auto | `PROPOSAL`; auto hides non-matching items, manual leaves filtering to the consumer |
| `sb-command` | `loop` | boolean | false | `PROPOSAL`; arrows wrap |
| `sb-command` | `results-label` | text | "{count} results" | `PROPOSAL`; template of the announced count |
| `sb-command-input` | `placeholder`, `value` | text | "" | hint; the search text |
| `sb-command-input` | event `input` | native | | every edit |
| `sb-command-group` | `label` | text | "" | heading and group name |
| `sb-command-item` | `value` | text | "" | matched and reported; empty means the item's text |
| `sb-command-item` | `keywords` | text | "" | `PROPOSAL`; hidden extra words that match |
| `sb-command-item` | `disabled` | boolean | false | cannot become active or be selected |
| `sb-command-item` | event `sb-select` | detail `{ value: string }` | | a person chose the item |

`sb-select` bubbles and crosses shadow roots, so one listener on `sb-command` handles every item. The event carries the element prefix because `select` is already a native event of text fields.

## 4. Variant matrix
No visual variants. Item states: rest, active (`selected`), disabled; and with or without icon and shortcut.

## 5. Roles and color
Surface `popover` with `popover-foreground` text. Search row bottom border `border`; placeholder and search icon `muted-foreground`. Group heading `muted-foreground`. Separator `border`. Active item `accent` fill with `accent-foreground` text and a 2px inset `ring` line (`PROPOSAL`, so the active item does not depend on a fill below 3:1). Item icons and shortcuts `muted-foreground`; on the active item the shortcut takes `accent-foreground`, since `muted-foreground` on `accent` is below 4.5:1.

## 6. States
- **selected (active):** the item Enter would choose. Set by the arrows, by pointer hover, and after each change of the search text (the first matching enabled item). Not the same as chosen.
- **disabled:** dimmed to the disabled opacity, skipped by the arrows and hover, not selectable, still listed. It is never active, so `aria-activedescendant` never announces it; screen-reader users find it, as unavailable, in browse mode.
- **empty:** no item matches; the empty text shows and is announced.
- Hover alone does nothing beyond making the item active.

## 7. Dimensions and layout
Search row 36px high, 12px inline padding, 8px gap, 16px icon. List maximum height 300px (`size.list.max-height`), 4px scroll padding. Shortcut letter spacing 0.1em (`font.letter-spacing.key`). Group padding 4px; heading 8px by 6px. Item 8px by 6px padding, 8px gap, small radius, 16px icon. Empty state 24px block padding, centered. Separator 1px, full list width. The root fills its container's width and height; corners use the control radius. Sizes are the same inline and inside a dialog.

## 8. Typography
Search text and items: control size (14px) and line height. Group heading: caption size (12px), label weight. Shortcut: caption size, `font.letter-spacing.key` (0.1em).

## 9. Accessibility
- The search field is a native text field with `role="combobox"`, `aria-expanded="true"` (the list is always shown), `aria-autocomplete="list"` and the `label` as its name. It is the command's only tab stop; DOM focus never leaves it while people move through the list (APG combobox: people keep typing).
- The list is a `listbox` named by `label`; each item is an `option`; each titled group is a `group` named by its label, whose visible heading is hidden from assistive technology so it is not read twice.
- The active item is exposed with `aria-activedescendant` from the search field and `aria-selected="true"` on that option. ID references do not cross shadow roots (SB-0009), so both `aria-activedescendant` and `aria-controls` are set as element references from the field to the items and list, which do resolve from inside a shadow root to the content around it (the same mechanism Tabs uses). Moving focus between the items instead was discarded: typing would need focus to jump back to the field on each key.
- References are re-resolved whenever items are added, removed or filtered; with no match, `aria-activedescendant` is cleared.
- Disabled items carry `aria-disabled="true"`. The arrows skip them, so a disabled item is never active and is not announced through `aria-activedescendant`; screen-reader users find it, as unavailable, in browse mode. Filtered-out items, empty groups and separators while searching are removed from the accessibility tree, not only hidden.
- Separators and the empty text are not exposed inside the listbox (a listbox only owns options and groups); the empty text reaches people through the status announcement.
- After the search text changes and typing pauses, a polite status announces the number of matches (`results-label`), or the empty text when there is none (WCAG 4.1.3).
- Shortcut hints are hidden from assistive technology, because the command does not register them; when the app does register one, put `aria-keyshortcuts` on the item.
- Escape is not handled, so inside a dialog it closes the dialog. Home and End move the caret in the field, as the APG editable combobox says.
- Focus indication: the field shows its caret and no ring; the active item shows its fill and inset ring (Q4, accepted). With focus in the field and no active item (a search with no match), the search row shows the same ring as the active item (`command.item.active.ring-color`, `command.item.active.ring-width`), so focus is never invisible (owner decision, 2026-11-12).
- Browser floor: element reflection (`ariaActiveDescendantElement`, `ariaControlsElements`). Where the browser lacks it, `sb-command-input` logs a console warning once, since assistive technology cannot follow the active option there.
- Forced colors: the active item is `Highlight` on `HighlightText`.
- A console warning fires once when `label` is empty.

## 10. Usage
### Behavior
- Typing filters with `filter="auto"`: an item matches when every space-separated term of the search text appears in its `value` or `keywords`, ignoring case and accents (`PROPOSAL`). Matching items keep their order; non-matching items hide; a group with no matching item hides; separators hide while there is search text; the empty state shows when nothing matches.
- After each change of the search text, the first matching enabled item becomes active. Arrow Down and Arrow Up move the active item over enabled visible items, stopping at the ends unless `loop`. The active item scrolls into view.
- Enter, or a click on an item, fires `sb-select` with the item's value. Disabled items never fire it. Enter never submits a surrounding form.
- Moving the pointer over an enabled item makes it active.
- With `filter="manual"` nothing hides: the consumer reads the search text on `input` and renders the items that match (remote or custom search). The empty state, the active item and the announcement still follow the items present.
### Composition
- Inline: `sb-command` > `sb-command-input` + `sb-command-list` > (`sb-command-empty`, `sb-command-group` > `sb-command-item` (> `sb-command-shortcut`), `sb-command-separator`). Give the inline command a boundary from its container (a card or a bordered box) when the surface color alone does not separate it.
- Command palette: put `sb-command` as the only content of `sb-dialog`, with no padding around it. Give the dialog a title (visually hidden is fine) that names it. The dialog's initial focus lands in the search field because the field takes focus for its element. Escape closes the dialog. Opening it with a global shortcut (such as Cmd+K), clearing the search text when it reopens and closing it after `sb-select` are the app's work. Command does not depend on the dialog's internals.
- Docs search: one group per section (`label` = section name), one item per page (`value` = page title, `keywords` = section and synonyms); navigate in the `sb-select` listener.
### Choosing the props
- `label`: always; say what is searched ("Search documentation").
- `filter`: `auto` for a known, local set; `manual` when results come from a server or need ranking.
- `loop`: on for short lists where wrapping is quicker; off (default) for long lists, where reaching an end is useful information.
- `results-label`: set it whenever the page is not in English.
- `keywords`: when people may type a word that is not in the visible text.
- Group `label`: whenever items fall into sections; leave groups out for a flat list.
- Shortcut: only for actions that really have a global shortcut.
### Do / Don't
- Don't put buttons, links or other controls inside an item: an option cannot hold interactive content (APG Listbox) and focus stays in the search field, so the inner control is unreachable. Use one action per item.

## Realizations
### Figma
Not realized yet.
### Web
Complete. Lit elements in `src/components/command/` sharing state through context; the search field in `sb-command-input`'s shadow root with `delegatesFocus`; `ariaActiveDescendantElement` and `ariaControlsElements` set on the inner input; roles as host attributes on list, group and item; the roving-focus controller does not apply (DOM focus never moves to the items). Enter is ignored while an input method is composing text. Behavior spec: `playwright/tests/command/command.behavior.spec.ts` (34 tests, written and seen failing before the code).
### Coverage
Every line of `realizations.web.coverage` in contract.json: roles and names, filtering (auto and manual), active item and keys, selection and events, element references, empty state and status, tokens, right to left, scrolling, dialog and autofocus, forced colors, axe in every story. Parity audit: `docs/parity-audits/command-2026-11-12.md`. The manual screen-reader pass (Q5) is replaced by the automated screen-reader views (SB-0113), stored in playwright/tests/command/__screen-reader__/*.txt.
### Known drift
- Home and End: the visual reference's library moves to the first and last item.
- Match order: the visual reference's library ranks matches by a fuzzy score.
- Active item indicator: the visual reference uses the accent fill only (about 1.1:1 against the surface).
- Shortcut on the active item: the visual reference keeps the muted color.
- Search icon: the visual reference uses foreground at 50% opacity.
- Dialog sizing: the visual reference enlarges the field (48px) and items inside its dialog.
- axe `scrollable-region-focusable`: filtered on the list scroller only in the behavior spec; axe sees the combobox link only through an ID, and element references (SB-0103) are invisible to it. The search field stays the only tab stop (owner decision).
- Empty state: also `aria-hidden="true"` (axe flags the listbox otherwise); the status region announces it.
- Initial active item: the first enabled item is active on load.
- Pointer: mousedown on an item is prevented, so the field keeps focus.
- Manual filter: groups and separators are never hidden.
- Focus with no active item: the search row shows the active item's ring; the visual reference shows the caret only.
- Announcement delay: 500ms after typing pauses (`PROPOSAL`, confirmed in review).
- Input method composition: Enter is ignored while `isComposing`, so confirming an IME candidate never selects an item.
- Browser floor: `sb-command-input` logs a console warning once where `Element.prototype` has no `ariaActiveDescendantElement`.

## Open questions
Q1 to Q7 in contract.json, all answered by the owner on 2026-11-12: tokens added (SB-0106, SB-0107), substring filter in document order, not form-associated (SB-0103), caret plus inset ring, deferred features left out of 0.1, one anti-pattern. The manual screen-reader pass for element-reference `aria-activedescendant` (Q5) is replaced by the automated screen-reader views (SB-0113), stored in playwright/tests/command/__screen-reader__/*.txt.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-command-*` variables (check T4). Tests first (rule test-first).
