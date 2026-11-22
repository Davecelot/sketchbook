# Self-validation checklist

This is Sketchbook's accessibility self-validation checklist — a set of
actual checkboxes to run through before calling a component's
accessibility work done, organized by **area of a product you're
touching** rather than by WCAG guideline number. [`wcag-checklist.md`](wcag-checklist.md)
already has the full per-success-criterion detail with worked examples;
this file is the other axis — "what do I actually check, in what order,
for the component in front of me" — and it exists specifically to make
one category (Keyboard navigation) an explicit, mandatory, separately
checked-off item instead of an implied afterthought to automated scanning.

Organizing by area rather than by SC number isn't a novel idea — grouping
this way (page structure / semantic markup / keyboard / color / forms /
media / responsive / manual QA) is a pattern several public design
systems' own accessibility guides use. This file's checklist items and
wording are this skill's own, written for this repo's Web Components
stack; the reasoning behind its mandatory keyboard section (see below)
traces to a real incident in a production Web Components library, not a
translation of any other design system's document.

## How to use this

Run the relevant section(s) below for the kind of component you're
building or reviewing — not every section applies to every component (a
static badge has no keyboard section to check; a dropdown has all of
them). Check each box against the real, rendered component, not against
its source alone — several of these (marked "verify live") cannot be
confirmed by reading a shadow template or by an automated scan.

## 1. Page/document structure

Mostly out of scope for an individual component (this is an app-shell
concern — see this skill's own "Don't use this skill for" note on `lang`),
but check when a component renders its own internal heading or landmark
structure (e.g. a Dialog's own title, a Side sheet's own sectioning):

- [ ] Any heading a component renders internally fits the surrounding
      page's own heading sequence rather than assuming it starts at `h1`
      — Success Criterion 2.4.6, Level AA.
- [ ] A component that introduces its own distinct region (a Dialog, a
      Side sheet, a Snackbar) exposes it as a real landmark or dialog role,
      not a generic unlabeled `<div>` — 1.3.1, Level A.

## 2. Semantic markup — HTML and ARIA

See this skill's own [Pattern 2](../SKILL.md#pattern-2-native-controls-first)
for the full native-first rule; the checklist version:

- [ ] Native HTML elements are used wherever one exists for the job
      (`<button>`, `<a>`, `<input>`, `<label>`) — 4.1.2, Level A.
- [ ] ARIA roles/attributes are added only where native HTML genuinely
      can't express the semantics — a role stacked on top of an element
      that already carries the right implicit role (e.g. a native
      `<input type="radio">`) is redundant, not extra-safe.
- [ ] Any custom widget that isn't a native element defines its role,
      keyboard behavior, accessible name, and relevant state
      (`aria-expanded`, `aria-selected`, etc.) explicitly — 4.1.2, Level A.

## 3. Content clarity

- [ ] Link/button text (or its accessible name) describes the destination
      or action on its own, without depending on surrounding prose — 2.4.4,
      Level A.
- [ ] Instructions and error copy don't rely solely on shape, position, or
      color ("the button on the right", "the red field") — 1.3.3, Level A.
- [ ] Copy the component renders (labels, placeholders, helper/error text)
      stays plain language, not internal jargon a consumer's own end user
      wouldn't recognize — 3.1.5.

## 4. Keyboard navigation — mandatory, verify live

This is the section this checklist exists to make impossible to skip.

### Why keyboard navigation gets its own mandatory section

A real bug shipped in a production Web Components library: its list,
dropdown menu, dropdown input and dropdown multiselect composed rows with
**zero of them reachable by keyboard at all** — not "arrow keys didn't
move between rows," Tab never even reached a row's control in the first
place. The cause was a `tabindex="-1"` set on the composed radio/checkbox
control, accompanied by a comment incorrectly claiming it stayed
Tab-reachable. Two things that normally catch accessibility regressions
both missed it completely:

- Reading the shadow template — the markup looked like an ordinary
  composed control; nothing about the source itself looked wrong.
- `@storybook/addon-a11y` (axe-core) — a static/rendered-DOM scanner has
  no way to observe keyboard interaction; it can confirm a role exists,
  not that Tab or an arrow key actually moves focus anywhere.

It was only found by someone physically tabbing into the live component
and noticing nothing happened. That's the gap this section closes: treat
every item below as something to verify by actually operating the
rendered component, every time, for any component with more than one
interactive part. This repo doesn't have a List or Dropdown component yet,
but the checklist below is binding for any composite widget added here
going forward.

### Checklist

- [ ] **(verify live)** Tab reaches every interactive part of the
      component from outside it, in a logical order — 2.1.1 / 2.4.3,
      Level A.
- [ ] **(verify live)** For a component composing multiple
      selectable/actionable rows or options (a list, menu, dropdown,
      combobox, tab set, accordion, grid): Arrow keys (and Home/End where
      applicable) move real focus between them — confirmed by actually
      pressing the keys and observing which element receives focus, never
      inferred from a `tabindex` value or a comment describing what it's
      supposed to do — 2.1.1, Level A.
- [ ] **(verify live)** Enter/Space activates the focused control where a
      native element would — 2.1.1, Level A.
- [ ] **(verify live)** Escape closes anything the component opened (a
      popover, panel, or menu) and returns focus somewhere sensible — never
      left stranded on an element that just became hidden — 2.1.2, Level A.
- [ ] Focus never gets trapped somewhere a keyboard-only user can't leave,
      except deliberately (a modal, until dismissed) — 2.1.2, Level A.
- [ ] The visible focus indicator has at least 3:1 contrast against its
      background and isn't removed without a visible replacement — 2.4.7,
      Level AA.

## 5. Color and contrast

- [ ] Body text meets at least 4.5:1 contrast; large text (≥18pt, or
      ≥14pt bold) meets at least 3:1 — 1.4.3, Level AA.
- [ ] Non-text UI components (borders, icons, focus rings) meet at least
      3:1 contrast — 1.4.11, Level AA.
- [ ] Color is never the only signal for state or meaning (an error, a
      selected row, a disabled control) — always paired with an icon,
      text, or a non-color visual change — 1.4.1, Level A.
- [ ] Interactive states (hover, active, focus) have a non-color visual
      cue in addition to any color change.

## 6. Forms and fields

- [ ] Every field has a `<label>` genuinely associated with it (`for`, or
      an explicit `aria-labelledby` reaching the right ID — see this
      skill's own [Pattern 5](../SKILL.md#pattern-5-aria-id-references-dont-cross-a-shadow-boundary)
      for the Shadow DOM ID-reference gotcha) — 1.3.1 / 3.3.2, Level A.
- [ ] A required field is marked with visible text (not color alone), and
      `aria-required`/`required` is set on the real control — 3.3.2,
      Level A.
- [ ] An invalid field sets `aria-invalid` and is associated with a
      descriptive, correction-suggesting error message via
      `aria-describedby` — 3.3.1 / 3.3.3, Level A/AA.

## 7. Media

- [ ] Images have meaningful `alt` text, or `alt=""` if purely decorative
      — 1.1.1, Level A.
- [ ] An icon-only control has an accessible name from the wrapping
      button/label, not from the icon alone — 1.1.1 / 4.1.2, Level A.
- [ ] Video/audio content has captions, a transcript, or an audio
      description as applicable — 1.2.2, Level A.
- [ ] Anything that autoplays audio/video can be paused, stopped, or
      muted — 1.4.2, Level A.

## 8. Responsive and zoom

- [ ] Content reflows without introducing horizontal scrolling at 320px
      viewport width — 1.4.10, Level AA.
- [ ] The component stays usable at 200% browser zoom, with no lost
      functionality or clipped content — 1.4.4, Level AA.

## 9. Manual verification (beyond automated scanning)

`@storybook/addon-a11y` (axe-core) is this skill's own automated scanning
tool — see `SKILL.md`'s own "Automated scanning" section — but it cannot
see everything. Before calling a component's accessibility work done:

- [ ] Section 4 (Keyboard navigation) above has been verified live, not
      assumed from source.
- [ ] The screen-reader views are stored and reviewed: one per story, and
      a `screen-reader view` test in the behavior spec when the keys change
      what is announced. Check S1 passes. Limits (SB-0113): no speech,
      Chromium only, no position in set.
- [ ] Every axe-core finding from the Storybook Accessibility panel has
      been triaged into this skill's own [priority table](../SKILL.md#pattern-3-prioritize-by-user-impact)
      and either fixed or explicitly deferred with a reason.
