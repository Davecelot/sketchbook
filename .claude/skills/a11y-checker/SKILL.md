---
name: a11y-checker
description: >
  Checks Sketchbook's Lit Web Components against WCAG 2.2 AA in POUR order:
  native controls before ARIA, findings by user impact, axe via Storybook
  and the behavior specs, a live keyboard pass for composite widgets; owns
  the a11y-auditor brief. Trigger: writing or reviewing an interactive
  component, fixing an a11y finding, or auditing before stable.
metadata:
  author: sketchbook
  version: '1.5.0'
  changelog: >
    Shorter description; the a11y-auditor brief declares its model and is
    launched with it (SB-0114); affects audit runs.
  auto-invoke: Writing, reviewing, or auditing a Web Component for accessibility
  allowed-tools: [Read, Edit, Write, Glob, Grep, Bash, Agent]
---

# Accessibility Checker (WCAG 2.2)

## When to use

Use this skill when:

- Writing a new interactive component (buttons, dialogs, menus, form controls).
- Reviewing or refactoring `src/components/` code for accessibility.
- Auditing a component against WCAG 2.2 Level A + AA before it moves to
  stable (launch [`agents/a11y-auditor.md`](agents/a11y-auditor.md)).
- Fixing an issue flagged by axe (Storybook addon or a behavior spec), QA,
  review-rangers or a parity audit.

Do not use this skill for:

- Token compliance (literal colors or spacing in component CSS): that is
  the `spec-is-source` rule and checks T2/T5.
- Contrast pairs of the theme: check T6 and the `foundations` skill own them.
- Web Component composition or performance: use `web-components-best-practices`.
- The document's `lang` attribute: an app-shell concern (Storybook's
  shell or the consuming app), not something a component controls.

A component's `accessibility` object in
`spec/components/<name>/contract.json` (schema:
`spec/schemas/contract.schema.json`) is authoritative for that component:
read it before auditing (contract-first). Form controls also follow
`.claude/rules/form-associated-controls.md`.

---

## Critical patterns

The standard is **WCAG 2.2, Level AA** (all A + AA criteria) and the
WAI-ARIA Authoring Practices pattern the contract names.

### Pattern 1: Audit in POUR order

1. **Perceivable**: text alternatives, structure, contrast.
2. **Operable**: keyboard, focus, target size, predictable interaction.
3. **Understandable**: labels, errors, clear behavior.
4. **Robust**: roles, names, states and relationships in the accessibility tree.

### Pattern 2: Native controls first

Use native elements before ARIA-built widgets; it holds inside a shadow
template as much as in light DOM.

```html
<!-- ❌ custom widget with manual ARIA -->
<div role="button" tabindex="0" class="save-action">Save</div>

<!-- ✅ native element in the shadow template: keyboard, focus and semantics are free -->
<button type="button" part="button">Save</button>
```

If a custom widget is unavoidable, define its **role**, **keyboard
behavior**, **accessible name**, **state** (`aria-expanded`,
`aria-selected`…) and **relationships** (`aria-controls`, `aria-owns`).
Never remove a focus indicator without a visible replacement.

### Pattern 3: Prioritize by user impact

| Priority   | Category                                  | Examples                                                                     |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| **HIGH**   | Blocks screen reader or keyboard entirely | Non-focusable interactive elements, missing accessible names, keyboard traps |
| **MEDIUM** | Degrades keyboard or AT experience        | Missing labels on inputs, insufficient contrast, no focus-visible style      |
| **LOW**    | Best practice / informational             | Non-sequential headings, missing alt on decorative images                    |

Axe impacts map as `critical`/`serious` → HIGH, `moderate` → MEDIUM, `minor` → LOW.

### Pattern 4: One finding format

```text
[SC {number}] {Finding title} — {HIGH | MEDIUM | LOW}
Location: {file path}:{line, if known}
Issue: {What is wrong and why it fails WCAG}
Fix: {Specific recommended change}
```

```text
[SC 2.1.1] Non-interactive div used as clickable element — HIGH
Location: src/components/card/Card.ts:34
Issue: A <div> in the shadow template has a click listener but no role,
tabindex or keydown handler; it can't be reached or used by keyboard.
Fix: Render a <button part="card">, or add role="button", tabindex="0"
and Enter/Space handling.
```

### Pattern 5: ARIA ID references don't cross a shadow boundary

An ID inside one tree (a shadow root, or light DOM) can't be referenced by
`aria-labelledby`/`aria-describedby`/`aria-owns` from another tree
(SB-0009 records what crosses). Forward the host's values onto the inner
control, or use the component's own `label`/`description` props.

```ts
// ❌ aria-labelledby stays on the host; the inner <button> never gets a name
// ✅ forward on every render, so the reference resolves where it lives
for (const attr of ['aria-label', 'aria-labelledby', 'aria-describedby']) {
  const value = this.getAttribute(attr);
  if (value === null) this.internalButton.removeAttribute(attr);
  else this.internalButton.setAttribute(attr, value);
}
```

When the label and the component are both in light DOM (a `<label>` for a
slotted control) this doesn't apply.

### Pattern 6: Composite widgets need a live keyboard pass

A composite widget (tabs, toggle group, radio group, accordion, list,
menu, select, combobox, grid: anything composing several focusable or
selectable parts) can't be verified for keyboard access by reading its
template or by axe. Both stay clean while the widget is unreachable: a
known failure is a `tabindex="-1"` on the composed control, with a comment
claiming it stayed Tab-reachable, that left every row unreachable; only a
person tabbing into the live story found it.

The gate, in the real Storybook story, before the work is called done:

1. Tab in from outside: focus lands on it.
2. Keep tabbing through every interactive part: nothing skipped, no trap.
3. With rows or options: Arrow keys (Home/End where the APG pattern has
   them) move real focus. Never trust a `tabindex` value or a comment
   about it without checking live.
4. Enter/Space activate; Escape closes anything that opened and returns
   focus somewhere sensible, never to an element that just hid.

The behavior spec then encodes each step (`playwright-worker`).
[`references/self-validation-checklist.md`](references/self-validation-checklist.md)
§4 repeats it as a mandatory section.

---

## Decision tree

```text
<img>?                                        → alt (1.1.1); decorative → alt="" role="presentation"
Icon-only control?                            → aria-label on the wrapping button (1.1.1)
<input>/<select>/<textarea>?                  → <label for> or the component's label prop (1.3.1)
Validation?                                   → aria-invalid + described error text (3.3.1)
Interactive?                                  → native element possible? yes: use it (Pattern 2)
                                                no: role + tabindex + keys + aria states (2.1.1, 4.1.2)
Clickable <div>/<span>?                       → <button> (2.1.1)
Opens a popup or dialog?                      → aria-expanded + aria-haspopup (4.1.2)
Host reflects aria-* into a shadow control?   → forward them (Pattern 5)
CSS removes :focus outline?                   → visible :focus-visible style (2.4.7)
Target < 24×24 CSS px?                        → at least 24px (2.5.8)
Headings out of sequence?                     → fix (1.3.1)
Text contrast < 4.5:1 (large < 3:1)?          → fix through tokens (1.4.3)
UI parts / focus ring < 3:1?                  → fix through tokens (1.4.11)
Contract stricter than WCAG?                  → the contract wins
Composite widget?                             → live keyboard pass (Pattern 6), then spec it
Moving to stable?                             → launch agents/a11y-auditor.md (Audit mode)
```

---

## POUR reference

### P — Perceivable

**1.1 Text alternatives (1.1.1, A).** Meaningful images get `alt`;
decorative ones `alt=""`; icon-only controls are a labeled `<button>` with
the icon `aria-hidden="true"`.

**1.3 Info and relationships (1.3.1, A).** Headings are real headings in
sequence; every input has an associated label.

**1.4 Distinguishable (1.4.3, 1.4.11, AA).**

| Element                                       | Ratio   |
| --------------------------------------------- | ------- |
| Normal text (< 18pt or < 14pt bold)           | ≥ 4.5:1 |
| Large text (≥ 18pt or ≥ 14pt bold)            | ≥ 3:1   |
| UI components & graphical objects (SC 1.4.11) | ≥ 3:1   |

Component CSS uses its component tokens only; the semantic pairs behind
them are verified by check T6 (`spec/tokens/contrast.json`) in light and
dark. Nothing may rely on color alone; handle `prefers-reduced-motion`
and `forced-colors`.

### O — Operable

**2.1 Keyboard (2.1.1, 2.1.2, A).** Everything works by keyboard as the
APG pattern says; a non-native widget handles Enter and Space itself.
Dialogs trap focus while open and return it to the trigger on close.

**2.4 Focus visible (2.4.7, AA).** Never `outline: none` without a
`:focus-visible` replacement on the real inner control (Sketchbook
components sync `:state(focus-visible)` through `NativeControl`).

**2.5 Target size (2.5.8, AA).** At least 24×24 CSS px; the contract may
ask for more.

### U — Understandable

**3.2 Predictable (3.2.1, 3.2.2, A).** No navigation or context change on
focus or on `change`; act on an explicit user action.

**3.3 Input assistance (3.3.1, 3.3.2, AA).** Errors are identified in
text, exposed (`aria-invalid` + description), and say how to fix them.

### R — Robust

**4.1 Name, role, value (4.1.2, A).** Roles, states and properties stay in
sync from JS whenever the component's state changes.

| Widget          | Role                           | Key attributes                                    |
| --------------- | ------------------------------ | ------------------------------------------------- |
| Dropdown/Select | `combobox` + `listbox`         | `aria-expanded`, `aria-haspopup`, `aria-selected` |
| Modal/Dialog    | `dialog`                       | `aria-modal`, `aria-labelledby`                   |
| Tabs            | `tablist` + `tab` + `tabpanel` | `aria-selected`, `aria-controls`                  |
| Accordion       | `button` (header)              | `aria-expanded`, `aria-controls`                  |
| Tooltip         | `tooltip`                      | `aria-describedby` on trigger                     |
| Alert/Toast     | `alert` or `status`            | `aria-live="assertive"` or `"polite"`             |
| Progress        | `progressbar`                  | `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |

Verify in Chromium's accessibility tree, across shadow roots
(`ariaSnapshot()`, or `axNodes()` in `playwright/helpers/a11y.ts`).

---

## Scanning: the Storybook addon and the spec helper, no custom scanner

Markup lives in Lit `html` templates and most accessibility is dynamic
(aria set from JS, focus, computed contrast), so a static scanner over
`.ts` sees little. Axe on the rendered shadow DOM is the scanner; don't
write another one.

1. **Storybook**: `@storybook/addon-a11y` is on in `.storybook/main.ts`,
   and `.storybook/preview.ts` sets `a11y: { test: 'error' }`. Open a
   story's Accessibility panel; map each violation with Pattern 3 and file
   it with Pattern 4.
2. **Behavior specs**: `axeViolations(page, tagName, exclude?)` in
   `playwright/helpers/a11y.ts` runs the same axe on the component's own
   subtree (composed Sketchbook components excluded by tag). Every spec
   asserts `[]` on the default story and on the stories that change
   structure, so a violation fails `npm run test:component`.
3. Axe can't see keyboard behavior (tab order, traps, Space/Enter on
   custom widgets): verify it by hand (Pattern 6) and in the spec.
4. **Screen reader**: stored views of Chrome's accessibility tree (names,
   roles, states, descriptions, focus, the active item), plus check S1.
   Every story has a view; a component whose keys change what is announced
   has a `screen-reader view` test in its behavior spec
   (`expectScreenReaderView`). Read a changed view before updating it.
   Limits (SB-0113): no speech, Chromium only, no position in set.

---

## Audit mode (before stable)

Launch [`agents/a11y-auditor.md`](agents/a11y-auditor.md) with the `Agent`
tool: a general-purpose agent with the brief's `model`, no conversation history, prompt = the brief
plus the component name and today's date. It may only read and run tests
(its declared `tools`); it never edits source, contracts, tests or tokens.
It writes `docs/a11y-audits/<name>-<YYYY-MM-DD>.md` ending in
`Verdict: ready` or `Verdict: not ready`. Check R1 reads that line; a
person who reviewed the component adds `Approved-by: <name>` below it
before the status moves to stable.

---

## Commands

```bash
npm run storybook                                  # addon panel per story
npm run test:component -- tests/<name>             # behavior spec, axe and screen-reader views included
npm run check                                      # T6 contrast, R1 audit verdict
```

---

## Resources

- [`agents/a11y-auditor.md`](agents/a11y-auditor.md): fresh-context audit before stable.
- [`references/wcag-checklist.md`](references/wcag-checklist.md): full Level A + AA checklist.
- [`references/self-validation-checklist.md`](references/self-validation-checklist.md):
  area-organized self-check; §4 is the mandatory keyboard pass.
- `playwright/helpers/a11y.ts`: `axeViolations`, `axNodes`, `expectScreenReaderView`.
- `.storybook/main.ts`, `.storybook/preview.ts`: the a11y addon and its `test: 'error'` mode.
- `spec/decisions/DECISIONS.md` SB-0009: what crosses shadow boundaries.
- `.claude/rules/form-associated-controls.md`: form control semantics.
