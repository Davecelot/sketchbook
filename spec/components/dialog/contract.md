---
component: Dialog
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: [Button]
last_updated: 2026-11-12
source: shadcn/ui Dialog (visual reference and names), WAI-ARIA APG Dialog (Modal) pattern
---

# Dialog

> A modal window over the page: the rest of the page is inert until it closes. Used for a focused task (search, a short form, a confirmation). Typed spec: [contract.json](./contract.json).

## 1. Purpose
Hold a short task that needs a person's full attention, then return them to where they were. The first uses are a search palette (a Command inside a Dialog) and, later, edit and confirm dialogs. For optional detail that can stay on the page, use Collapsible or Accordion.

## 2. Anatomy
Eight elements. `sb-dialog` owns the open state. `sb-dialog-trigger` wraps the control that opens it. `sb-dialog-content` is the surface over a dimmed backdrop, with a built-in close button in its top inline-end corner. Inside it, `sb-dialog-header` stacks `sb-dialog-title` (the name, a level 2 heading) and `sb-dialog-description`; the body is free content; `sb-dialog-footer` holds the actions; `sb-dialog-close` wraps a control that closes the dialog.

## 3. Props / API
| Element | Prop / event | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `sb-dialog` | `open` | boolean | false | showing or not; people and code change it |
| `sb-dialog` | event `sb-toggle` | no detail | | after `open` changes, from a person or code; read `open` (`PROPOSAL`) |
| `sb-dialog` | event `sb-cancel` | cancelable, no detail | | before Escape or a backdrop click closes; `preventDefault()` keeps it open (`PROPOSAL`) |
| `sb-dialog-content` | `hideCloseButton` | boolean | false | hides the built-in close button (`PROPOSAL`) |
| `sb-dialog-content` | `closeLabel` | text | "Close" | name of the built-in close button; translate it (`PROPOSAL`) |

`sb-toggle` fires for changes from code too, like the platform's own dialog and like Collapsible; the alternative (people only) would leave code that sets `open` without a signal. One cancelable `sb-cancel` covers both Escape and the backdrop (`PROPOSAL`); separate events per cause were not needed by any use case yet. The reference's footer option that adds its own Close button is left out (`PROPOSAL`): a Button in `sb-dialog-close` does the same with a label the author writes and translates. Both events bubble and are composed, so a listener on an outer dialog also receives a nested dialog's events: check `event.target` (before calling `preventDefault()` on `sb-cancel`). Collapsible still spells its event `toggle` (a registered alias); Dialog uses the canonical prefixed names.

## 4. Variant matrix
None. There is one look; the kinds deferred by Q2 (alert dialog, sheet) are not in this version.

## 5. Roles and color
Surface `background` with `foreground` text, `border` outline, large elevation. Description `muted-foreground`. Backdrop: the translucent `overlay` scrim (`dialog.backdrop`, black at 50% in both modes). The close button takes Button's ghost look.

## 6. States
- **open**: the surface shows over the dimmed backdrop; the page behind is inert and does not scroll.
- **closed**: nothing is shown; the trigger is the only visible part.
The surface itself has no hover, focus or disabled state; controls inside show their own.

## 7. Dimensions and layout
- The surface is centered in the viewport. Its width is the max width (`dialog.max-width`, from `size.dialog.max-width`, 512px) or the viewport minus a 16px margin on each side, whichever is smaller. Its height is its content, up to the viewport minus the same margin; taller content scrolls inside the surface, so the page never needs to. The whole surface scrolls, header and footer included (Q2); a header and footer that stay in view while only the body scrolls (the reference's sticky-footer and scrollable-content examples) is deferred (Q2).
- Padding 24px, 16px between the surface's children, radius `surface`, 1px border.
- The close button sits 16px from the top and inline-end edges (mirrors in right-to-left), after the content in focus order. While it is shown, the header keeps 32px clear at its inline end (`dialog.header.close-space`), so a long title wraps before the button. It scrolls away with long content, since sticky regions are deferred (Q2).
- Header: 8px between title and description. Centered on narrow screens, start-aligned from 40em.
- Footer: 8px between actions. Narrow screens stack the actions full width in DOM order, so the visual order matches the focus order (WCAG 1.3.2, 2.4.3; the visual reference puts the last one on top); from 40em they sit in a row aligned to the end.
- No enter or exit animation in this version (Q2). Any animation added later is removed under reduced motion.

## 8. Typography
Body font. Title 18px (`heading-lg`), semibold, line height none. Description 14px body, muted.

## 9. Accessibility
- Modal dialog (`PROPOSAL`: the platform's own modal dialog). While open, the page behind is inert: not focusable, not clickable, not in the accessibility tree.
- **Name**: the title names the dialog. With no title, an `aria-label` on `sb-dialog-content` names it (the search palette case). A dev-only warning fires when the dialog opens with neither. The title is linked by element reference, not by ID, because ID references do not cross shadow roots (SB-0009); where element references are unsupported, the title text is copied into the name when the content renders, so a later change to the title text is not followed live.
- **Description**: the description, when present, is the accessible description (where element references are unsupported there is no fallback and it is omitted); it stays one short line, because structured content is lost when read as a description (APG).
- **Focus on open**: the first element with `autofocus` inside the content; otherwise the first focusable element; otherwise the close button (APG). For long or read-first content, put `autofocus` on a static start element with `tabindex="-1"` so the start is read and stays in view (APG).
- **Focus on close**: back to the element focused before opening, normally the trigger's control; if it is gone, to the document.
- **Keyboard**: Escape closes (after `sb-cancel`), except while an input method is composing text; Tab and Shift+Tab move through the dialog's controls only and wrap at either end inside the page, as the APG asks (Q4, revised 2026-11-16).
- **Light dismiss**: a press and release both on the backdrop close the dialog (after `sb-cancel`); a text selection dragged from inside the surface to the backdrop does not.
- **Visible close**: the built-in close button is on by default (APG strongly recommends a visible close). Hiding it requires another visible close, such as Cancel in `sb-dialog-close`.
- The trigger and close wrappers add no role; the control inside keeps its own role and name.
- **Scroll lock**: the page does not scroll while a dialog is open; nested dialogs keep it locked until the last closes.
- **Narrow viewports and zoom**: the surface never exceeds the viewport and scrolls inside, so content reflows at 320px wide (WCAG 1.4.10).
- **Forced colors**: the surface keeps a visible border.
- Contrast pairs: text and description on the surface.

## 10. Usage
### Behavior
- The trigger's control opens the dialog; the close button, any `sb-dialog-close` control, Escape and a backdrop click close it. Code opens and closes it with `open`, for example from a keyboard shortcut; a trigger is optional.
- `sb-cancel` lets a page keep the dialog open, for example to confirm discarding unsaved input. Closing from the close button, `sb-dialog-close` or code is not cancelable: those are explicit choices.
- A dialog opened from inside another dialog stacks on top; Escape closes the top one first.

### Composition
- `sb-dialog` > `sb-dialog-trigger` (one control, usually a Button) + `sb-dialog-content` > `sb-dialog-header` (`sb-dialog-title`, `sb-dialog-description`), the body, `sb-dialog-footer` (actions, the dismissive one in `sb-dialog-close`).
- **Form**: a form in the body submits and validates as usual. To close after a successful submit, set `open = false` in the submit handler; put Cancel in `sb-dialog-close`. A form's built-in "close the dialog" submit method does not apply here (see Realizations).
- **Search palette (Command)**: `sb-dialog` opened from code or a search-styled trigger; `sb-dialog-content` with `aria-label` (for example "Search documentation") and `hide-close-button`; a Command inside with `autofocus`, so typing starts at once. Choosing a result closes the dialog from the page (set `open = false` on the Command's selection). Escape inside the Command closes the dialog unless the Command uses that Escape itself (then it prevents the key's default). Dialog relies only on these two platform behaviors, not on Command's internals (Q5).
- **Confirm**: until the alert dialog exists (Q2), a Dialog with a title, a one-line description and a footer with Cancel and the action is the stopgap; prefer focusing Cancel (`autofocus`) for an irreversible action (APG).

### Choosing the props
1. Give it a name: a title for every dialog with visible heading text; `aria-label` on the content only when there is no visible title.
2. Keep the close button unless the content has its own visible close (search palette: Escape plus the page's own affordance, or a Cancel button).
3. Translate `closeLabel` with the rest of the page.

### Do / Don't
- Do give every dialog a name (a title, or `aria-label`). Don't leave both out: the dialog needs a name (APG).
- Do keep a visible way to close. Don't hide the close button without a Cancel or Done in `sb-dialog-close` (APG).
- Do keep the description to one short line. Don't put lists or several paragraphs in it: they are read as one flat string; put them in the body (APG).
- Don't use a dialog for optional detail that can stay on the page: use Collapsible or Accordion.

## Realizations
### Figma
Not realized yet.
### Web
Complete. src/components/dialog/Dialog.ts, src/components/dialog/DialogTrigger.ts, src/components/dialog/DialogContent.ts, src/components/dialog/DialogHeader.ts, src/components/dialog/DialogFooter.ts, src/components/dialog/DialogTitle.ts, src/components/dialog/DialogDescription.ts, src/components/dialog/DialogClose.ts, src/components/dialog/context.ts. Parts: dialog, close. One stylesheet for the family (Dialog.scss).
### Coverage
- open reflects; set in markup opens on connect; set from code opens and closes
- hideCloseButton removes the built-in close button; closeLabel names it ("Close" by default), icon aria-hidden
- sb-toggle bubbles, composed, after each change from a person or code
- sb-cancel bubbles, composed, cancelable on Escape and on a backdrop press and release; not on the close button, sb-dialog-close or code
- a prevented sb-cancel keeps the dialog open (Escape twice, backdrop); the close button still closes it after
- trigger opens on click, Enter and Space; trigger and close wrappers add no role (display contents)
- sb-dialog-close control and the built-in close button close
- native modal dialog in the accessibility tree; the page behind cannot be clicked or focused
- page does not scroll on wheel while open, scrolls again after; nested dialogs keep the lock until the last closes
- moved to another container while open: stays modal with its backdrop and scroll lock; the lock is released on close
- nested: Escape closes the top dialog first
- focus on open: autofocus element, a Command with autofocus, else the first focusable, else the close button
- focus on close returns to the trigger control; a removed trigger raises no error and focus falls to the document
- Escape inside a Command closes the dialog (Q5)
- Tab and Shift+Tab stay among the dialog controls, close button last
- Tab from the last control wraps to the first, Shift+Tab from the first wraps to the last, also with the close button hidden
- without element references, the copied title name follows a title text change
- a drag from inside the surface released on the backdrop and a click on the surface padding do not close and fire no sb-cancel; a backdrop click still closes after
- name from the title and description from the description (element references, accessibility tree)
- name from aria-label on sb-dialog-content without a title
- title is a level 2 heading (ElementInternals, accessibility tree)
- a title and description added after opening are linked again
- missing-name warning once
- axe clean: default, open in markup, no close button, form, long content, search palette, nested, RTL (opened through the trigger), dark mode
- 320px wide: viewport margin kept, surface scrolls inside, no horizontal page scroll; wide: max-width token
- from 40em header start-aligned and footer a row at the end; below, header centered and footer stacked in DOM order
- close button at the inline end, mirrors in RTL
- a long title on a narrow screen does not run under the close button
- forced colors: CanvasText border
- form inside: required blocks submit, FormData values, open = false in the submit handler closes and returns focus
- surface, backdrop, title and description read their component tokens
### Known drift
- surface element: A native <dialog part="dialog"> in sb-dialog-content's shadow root, shown with showModal(), with a default slot; it provides the top layer, inertness and focus restore. Backdrop via ::backdrop. The reference uses a portal and a focus-trap script.
- name and description: ariaLabelledByElements / ariaDescribedByElements on the inner <dialog> pointing at the title and description hosts; aria-label copy of the title text where element references are unsupported (the title is observed, so a later change to its text is copied again; the description has no fallback and is omitted there); host aria-label on sb-dialog-content forwarded when there is no title. The title host is role heading, level 2 through ElementInternals (Playwright's role engine does not read it; the spec reads the browser's accessibility tree).
- trigger and close: display:contents wrappers listening for click on the host (the reference's asChild). aria-haspopup is not set: attributes on an sb-button host do not reach its inner button (SB-0009), and the APG does not require it.
- initial focus: The platform's dialog focusing steps do not look for autofocus in slotted content, so after showModal() the content focuses its own first [autofocus] element; the first-focusable and close-button fallbacks are the platform's.
- Escape: Handled on keydown inside the dialog (preventDefault, then sb-cancel), not on the platform cancel event, which is cancelable only once per user activation; an Escape that a control inside already prevented is left alone. The platform cancel and close events are still handled for close requests that do not come from the key.
- sb-toggle on first render: open set in markup opens on connect without an sb-toggle (not a change), as Collapsible's sb-toggle.
- scroll lock: overflow hidden and scrollbar-gutter stable on the document element while any sb-dialog is open (counted for nested dialogs), the author's inline values restored on close. Blocks user scrolling (wheel, keys, touch); script can still call scrollBy, as with any overflow hidden. A native modal dialog does not lock scrolling.
- light dismiss: pointerdown and click both outside the surface's box. closedby=any is not used: not in every supported browser.
- form method=dialog: A form in the light DOM has no ancestor dialog (the dialog is in a shadow root), so method=dialog does not close it.
- header and footer at 40em: A wider-viewport rule (media query at 40em, as Breadcrumb); the design file draws the wide layout.
- footer order on narrow screens: footer on narrow screens stacks in DOM order (owner, WCAG 1.3.2/2.4.3); the visual reference reverses it
- close button and title: The button is absolutely positioned; a slotted sb-dialog-header reserves inline-end space for it (dialog.header.close-space) while it is shown, so a long title wraps before it. The reference does not reserve the space.
- motion: The reference fades and zooms; deferred (Q2).

## Open questions
All answered by the owner (2026-11-12, contract.json `openQuestions`): Q1 `color.overlay` and `size.dialog.max-width` added and used; Q2 non-modal, alert dialog, sheet, animation and sticky regions deferred; Q3 built-in close button with `hideCloseButton` and `closeLabel`; Q4 native Tab behavior, revised by the owner on 2026-11-16 to wrap inside the page; Q5 Command composes as is (autofocus on its host, never consumes Escape); Q6 the manual screen-reader pass is replaced by the automated screen-reader views (SB-0113), stored in playwright/tests/dialog/__screen-reader__/*.txt.

## Spec for agents
Build from contract.json only. CSS uses only `--sb-dialog-*` variables (check T4). Tests first (rule test-first).
