---
stage: ready
basis: plan Status line (2026-11-12)
test-first: unverified (pre-record)
approved-by: Davecelot
approved-on: 2026-11-12
approved-contract: sha256:7c42b3c2d9326e10c5fb75dce42ca3caf67d277096a2a1e36fb9481b8ecfb9a8
approved-plan: sha256:8c186227c6960dc38c4f788f197ea09a303685a56b4707ae6e0eeaef4546f77c
---

# Plan: Dialog (planning gate)

Status: **approved** (owner answered Q1–Q6, 2026-11-12: tokens added, defer non-modal/alert/sheet/animation/sticky regions, built-in hideable close, native Tab behavior, Command composes as-is; manual screen-reader pass replaced by automated views, SB-0113). Test-first from here.

## Scope
In: the eight elements in contract.json (`sb-dialog`, `-trigger`, `-content`, `-header`, `-footer`, `-title`, `-description`, `-close`); `open`, `sb-toggle`, cancelable `sb-cancel`; the built-in close button (`hideCloseButton`, `closeLabel`); modal behavior (inert page, Escape, light dismiss, focus on open and return, scroll lock); naming through the title or `aria-label`; narrow-viewport sizing; the search-palette, form and confirm compositions as stories.

Out (Q2): non-modal, alert dialog, sheet/drawer, enter/exit animation, sticky header/footer with a scrolling body, the footer's built-in Close option, `returnValue`.

## Files (in build order)
| Step | File |
| --- | --- |
| 0 | `color.overlay`/`size.dialog.max-width` (added, Q1) aliased as `dialog.backdrop`/`dialog.max-width` in contract.json, then `npm run generate` |
| 1 | `src/components/dialog/Dialog.stories.ts` (default, no close button, custom close in footer, form, long content, search palette composing `sb-command`, nested, RTL, narrow viewport) |
| 2 | `playwright/tests/dialog/dialog.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/dialog/Dialog.scss` -> `Dialog.styles.ts` (generated) |
| 4 | `src/components/dialog/Dialog.ts`, `DialogTrigger.ts`, `DialogContent.ts`, `DialogHeader.ts`, `DialogFooter.ts`, `DialogTitle.ts`, `DialogDescription.ts`, `DialogClose.ts`, `context.ts`, `index.ts` |

One stylesheet for the family, as Accordion and Collapsible do. Context with `@lit/context` (SB-0007). The close button reuses `sb-button` (ghost, `icon-small`) and the existing icon set; no new controller or mixin. Dialog is not a form control, so the form-associated rule does not apply.

## Tokens
Component tokens alias semantic tokens (contract.json `tokens`): backdrop `color.overlay`, max width `size.dialog.max-width`, surface `color.background`/`color.foreground`, `color.border`, `border-width.default`, `radius.surface`, `elevation.lg`, `space.inset.surface` padding, `space.stack.loose` gap, `space.inset.md` viewport margin and close inset, `space.stack.sm` header/footer gaps, `size.control.sm` header space kept clear for the close button, title `font.size.heading-lg`/`font.weight.heading`/`font.line-height.heading`, description `color.muted-foreground`/`font.size.body`/`font.line-height.body`. No `layer.*` token: the top layer stacks above everything without a z-index.

### Semantic tokens added (Q1)
| Name | Role | Suggested mapping |
| --- | --- | --- |
| `color.overlay` | Scrim behind modal surfaces (Dialog now, Sheet/Alert dialog later) | light and dark: `#00000080` (black at 50%, as the reference) |
| `size.dialog.max-width` | Widest a dialog surface grows | base `512px` (the reference's 32rem) |

## Accessibility approach
- Platform modal dialog in the content's shadow root, content slotted: role dialog, modal, inert page, top layer, Escape cancel and focus restore come from the platform (SB-0007).
- Name: `ariaLabelledByElements` -> `sb-dialog-title` host (ElementInternals role heading, level 2); fallback `aria-label` copy of the title text; host `aria-label` on the content forwarded when there is no title; dev warning once when neither. Description: `ariaDescribedByElements` -> `sb-dialog-description`. Re-resolved when a title or description is added or removed (SB-0009).
- Focus on open: platform dialog focusing steps (autofocus first, then the first focusable, the close button last since it renders after the slot). Focus on close: platform restore to the previously focused element.
- `sb-cancel` re-dispatched on the host from the inner dialog's `cancel` (Escape) and from light dismiss; prevented -> stays open.
- Light dismiss: pointerdown and click both outside the surface's rectangle.
- Scroll lock: counted `overflow: hidden` on the document element.
- Forced colors: surface border in `CanvasText`.

## Test plan (test-first)
One test per item; each must fail first for the right reason (element not defined, attribute absent).
- **Props**: `open` reflects; set in markup opens on connect; set from code opens and closes; `hideCloseButton` removes the close button; `closeLabel` names it (default "Close").
- **Events**: `sb-toggle` bubbles, composed, fires on open and close from a person and from code; `sb-cancel` bubbles, composed, cancelable, fires on Escape and backdrop, not on the close button, `sb-dialog-close` or code; prevented `sb-cancel` keeps it open (Escape and backdrop).
- **Trigger / close**: clicking, Enter and Space on the trigger's `sb-button` opens; a control in `sb-dialog-close` closes; the close button closes.
- **Modal**: role dialog in the accessibility tree, modal; a button behind the dialog cannot be clicked or focused; the page does not scroll (wheel and `scrollBy`) while open and scrolls again after; nested dialog: Escape closes the top one, scroll stays locked until the last closes.
- **Focus**: on open to the `autofocus` element; else the first focusable; else the close button; on close back to the trigger's control; trigger removed while open -> no error, focus on the document.
- **Keyboard**: Escape closes; Tab and Shift+Tab stay among the dialog's controls (asserted in the page; leaving to browser UI is not observable in the test).
- **Light dismiss**: press and release on the backdrop closes; a drag from inside the surface released on the backdrop does not.
- **Accessibility**: name from the title (accessibility tree); name from host `aria-label` with no title; description from the description; title is heading level 2; title added after open re-resolves; missing-name warning once; axe clean (default, no title with aria-label, long content, dark mode).
- **Layout**: at 320px wide the surface fits with the 16px margin and scrolls inside; at 40em the header is start-aligned and the footer is a row at the end, below it the footer stacks in DOM order (owner, WCAG 1.3.2/2.4.3); close button at inline-end in RTL; forced colors keep the border.
- **Form**: a required field inside blocks submit; values reach `FormData`; `open = false` in the submit handler closes and returns focus.
- **Tokens**: surface background, border, radius, shadow, padding read from the component tokens.

## Risks
- Element-reference ARIA (`ariaLabelledByElements`) support differs per browser and screen reader; fallback copy covers the name but not the description (Q6, covered by the automated screen-reader views).
- Platform focusing steps and `autofocus` inside slotted content and inside another component's shadow root (the Command's input) behave slightly differently across engines; tests pin the expected target.
- Chromium lets only the first Escape be cancelled without a user activation in between (close watcher rules), so a prevented `sb-cancel` may not hold on a second quick Escape. Document, test the first Escape only.
- Scroll lock touches the document element; restoring must keep any author value. Scrollbar removal can shift layout; `scrollbar-gutter: stable` is applied only while locked.
- Forced colors may override the backdrop; the surface border keeps the edge visible.
- The palette story composes `sb-command`; Dialog relies only on its `autofocus` host and on it not consuming Escape (Q5).

## Accessibility deviations from the references
- Tab from the last control may visit browser UI before wrapping (native), where the APG and the reference wrap in the page (Q4).
- `aria-haspopup` is not set on the trigger (would not reach the inner button, SB-0009; not required by the APG).
- One `sb-cancel` for Escape and backdrop, where the reference has separate handlers per cause.

## Answers (owner, 2026-11-12)
- **Q1** Yes: `color.overlay` and `size.dialog.max-width` are added; the contract uses them as `dialog.backdrop` and `dialog.max-width`.
- **Q2** Defer all five (non-modal, alert dialog, sheet, animation, sticky header and footer); the whole surface scrolls.
- **Q3** Built-in close button, hideable with `hideCloseButton`, translatable with `closeLabel`.
- **Q4** Native modal Tab behavior: no script focus trap; the page stays inert.
- **Q5** `sb-command` focuses its search field through `autofocus` on its host and never consumes Escape, so a dialog around it closes on Escape.
- **Q6** The manual screen-reader pass is replaced by the automated screen-reader views (SB-0113), stored in playwright/tests/dialog/__screen-reader__/*.txt.
