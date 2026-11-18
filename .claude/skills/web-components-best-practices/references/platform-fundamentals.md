# Platform Fundamentals

Composition patterns and performance rules assume the component is already
lifecycle-correct, reflects state consistently, and exposes a stable public
styling/forms/accessibility surface. This file covers that foundation —
the platform contracts native custom elements must honor regardless of
what they compose or how they're optimized. Source: MDN's Web Components
documentation (https://developer.mozilla.org/en-US/docs/Web/API/Web_components).

## 1. Constructor restrictions (CRITICAL)

The constructor runs before the element is connected to the DOM — before
attributes are guaranteed set and before children exist. Attribute reads,
shadow DOM writes, and children access belong in `connectedCallback`, not
the constructor:

```ts
// Incorrect — attribute may not be set yet when the parser hasn't finished
class SbBadge extends HTMLElement {
  constructor() {
    super();
    this.#variant = this.getAttribute('variant'); // can be null even when the
    // attribute is present in markup
  }
}

// Correct — constructor only wires up shadow root + static template;
// attribute-dependent work waits for connectedCallback
class SbBadge extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
  }
  connectedCallback() {
    this.#variant = this.getAttribute('variant');
    this.#render();
  }
}
```

**Lit-covered in this repo:** `LitElement`'s own constructor and
`connectedCallback` already defer attribute-dependent work for you — a
subclass declaring `@property()` fields (as every component here does)
rarely needs to override either. This section matters only if you touch
the constructor directly for something outside Lit's reactive system.

## 2. `observedAttributes` must list every attribute you react to (CRITICAL)

`attributeChangedCallback` only fires for attributes named in `static get
observedAttributes()`. An attribute missing from that list changes silently
— no callback, no re-render, a component that looks broken instead of
throwing:

```ts
static get observedAttributes() {
  return ["variant", "disabled", "loading"]; // every attribute #render() reads
}
```

**Lit-covered in this repo:** `observedAttributes` is generated for you
from every `@property()` declaration (for example `src/components/badge/Badge.ts`).
Don't hand-maintain this list; declare the property and Lit derives it.

## 3. Attribute/property reflection must go both directions (HIGH)

A consumer setting `el.disabled = true` in JS and a consumer writing
`disabled` in HTML must produce the same observable state. Reflect one
direction only and the two call sites drift:

```ts
// Correct — property setter reflects to the attribute; attributeChangedCallback
// re-syncs the property, so either entry point converges on the same state
get disabled() {
  return this.hasAttribute("disabled");
}
set disabled(value: boolean) {
  this.toggleAttribute("disabled", Boolean(value));
}
attributeChangedCallback(name: string) {
  if (name === "disabled") this.#render(); // reads via the getter above
}
```

**Lit-covered in this repo:** `@property({ reflect: true, type: ... })`
handles both directions declaratively — no manual getter/setter/
`attributeChangedCallback` needed unless you're doing something Lit's
type converters can't express.

## 4. `::part()` and CSS custom properties are the public styling API (HIGH)

Shadow DOM blocks descendant selectors from outside — that's the point.
Consumers still need _some_ sanctioned way to theme a component without
reaching into its shadow tree. `part` + `::part()` exposes specific
internal elements; CSS custom properties expose specific style values.
Don't leave consumers no path but `!important` on `::shadow` hacks or, worse,
a growing list of one-off style attributes.

In this repo, both mechanisms are already in use — grounded in the actual
code, not hypothetically:

- `::part()` is the per-element styling hook. a component marks its internal elements with `part`
  (for example `part="button|content|icon|label|spinner"` on `sb-button`),
  so a consumer
  restyles a specific internal element without piercing the shadow root:

  ```css
  /* consumer's stylesheet, outside the shadow root */
  sb-button::part(button) {
    border-radius: 4px;
  }
  ```

- CSS custom properties pierce the shadow boundary. Each component's SCSS
  declares only its component token variables, `--sb-<component>-*` (for
  example `--sb-button-bg`), each aliasing a semantic token, and its styles
  read those variables. Overriding a semantic token re-themes globally;
  overriding a component variable re-themes one component. Treat the
  `--sb-<component>-*` names as public API:

  ```css
  /* inside the component's own stylesheet */
  :host {
    --sb-button-bg: var(--primary);
  }
  button {
    background: var(--sb-button-bg);
  }
  ```

Only mark `part="..."` on elements you intend to be a stable public
contract — every `part` name is an API surface you now support across
versions, same as an exported prop.

## 5. `::slotted()` for base styles on projected content (MEDIUM)

Slotted (light DOM) children keep their own styles, but the host component
can still apply baseline styling to whatever ends up in a slot via
`::slotted()` from inside its own shadow stylesheet — useful for spacing/
typography resets that shouldn't require every consumer to repeat them:

```css
/* inside the component's shadow stylesheet */
::slotted(p) {
  margin: 0;
}
```

## 6. `:state()` / `CustomStateSet` for internal-state styling hooks (MEDIUM)

Before `ElementInternals.states`, exposing "is this open/expanded/invalid"
to CSS meant a boolean attribute (`open`, `expanded`) that's indistinguishable
from a public API attribute a consumer might set directly. `:state()` gives
a styling hook that's read-only from outside — closer to `:hover`/`:checked`
than to a settable attribute:

```ts
connectedCallback() {
  this.#internals ??= this.attachInternals();
}
#setExpanded(expanded: boolean) {
  this.#internals.states[expanded ? "add" : "delete"]("expanded");
}
```

```css
sb-accordion-item:state(expanded) svg {
  transform: rotate(180deg);
}
```

Reach for this once a component needs a state-driven styling hook that
should NOT also be settable as a plain attribute by the consumer; a normal
reflected boolean attribute (§3) is still correct when the consumer is
meant to set it directly (e.g. `disabled`).

Simpler alternative (ladder step 2): a component can keep this
kind of internal state as `data-*` attributes on the _inner_ shadow
element (`this.#button.dataset.state = "loading"`,
`this.#button.dataset.role = variant`), styled with `[data-state]` /
`[data-role]` selectors — not on the host, so consumers can't set it
either. That's a valid, simpler pattern already established here; prefer
matching it over introducing `:state()` unless you specifically need a
state hook _on the host_ for consumers to target from outside.

## 7. Form-associated custom elements need `ElementInternals` (HIGH — only for form controls)

A custom element standing in for a native form control (`sb-input`,
`sb-checkbox`) must participate in form submission and constraint
validation the same way `<input>` does, or it silently breaks every
`<form>` that contains it (no value in `FormData`, no `:invalid` styling,
no native validation message):

```ts
class SbInput extends HTMLElement {
  static formAssociated = true; // required before attachInternals() is allowed
  #internals = this.attachInternals();

  #setValue(value: string) {
    this.#internals.setFormValue(value);
    this.#internals.setValidity(value ? {} : { valueMissing: true }, 'This field is required');
  }
}
```

This only applies to components that stand in for form controls — don't
add `formAssociated` to a component with no form semantics (§1 of the
decision ladder: not requested, skip it).

## 8. Accessibility crosses the shadow boundary; focus delegation doesn't happen automatically (HIGH)

The accessibility tree is NOT blocked by Shadow DOM the way CSS/JS
encapsulation is — native semantic elements and `aria-*` attributes inside
a shadow tree are visible to assistive tech exactly as if they weren't
shadowed. That means the fix for an accessibility gap in a custom element
is almost always "use the right native element inside the shadow root,"
not "add ARIA to the host." Two things ARE shadow-boundary-specific and
worth checking explicitly:

- Focus does not automatically land inside the shadow root when the host
  receives focus/click — pass `delegatesFocus: true` to `attachShadow()`
  for a component like `sb-input` where clicking anywhere on the host
  should focus the inner control, instead of wiring a manual click handler
  that calls `.focus()` on the internal element.
- An `id`-based `aria-labelledby`/`aria-describedby` reference cannot cross
  a shadow boundary (an `id` inside one shadow root is invisible to an
  element in another). Keep the referenced element and the referencing
  element in the same shadow root, or fall back to `aria-label` /
  `ElementInternals.ariaLabel` when the label genuinely lives outside.

```ts
this.attachShadow({ mode: 'open', delegatesFocus: true });
```

## 9. `slotchange` for validating/reacting to projected content (MEDIUM)

When a component has requirements on its slotted content (e.g. exactly one
`slot="trigger"` element, or "re-run layout when slotted items change"),
`slotchange` is the correct signal — it fires on the `<slot>` element
whenever its assigned nodes change, including on initial assignment:

```ts
this.shadowRoot!.querySelector("slot[name='trigger']")!.addEventListener('slotchange', (e) => {
  const assigned = (e.target as HTMLSlotElement).assignedElements();
  // validate/react here — e.g. warn in dev if assigned.length !== 1
});
```

## 10. `:defined` to avoid a flash of unstyled/un-upgraded content (LOW-MEDIUM)

Between an element landing in markup and its class being registered (async
script load, code-split component bundle — see `performance-rules.md` §2),
the browser renders it as an unstyled generic inline element. Style the
pre-upgrade state deliberately instead of leaving it to flash:

```css
sb-tooltip:not(:defined) {
  visibility: hidden; /* avoid an unstyled flash before upgrade */
}
```

## 11. Subscriptions must survive a reconnect; light-DOM-derived values are read at render (HIGH)

`firstUpdated` runs once per element, `connectedCallback` runs every time
the element is inserted. An observer or listener set up in `firstUpdated`
and torn down in `disconnectedCallback` is gone for good the moment a
consumer moves the element in the DOM (a framework re-parenting it, a
drag-and-drop, a `replaceWith`): the element keeps rendering but stops
reacting. Tear down in `disconnectedCallback` and re-attach in
`connectedCallback` once `hasUpdated` is true:

```ts
#overflow = new ResizeObserver(() => this.#syncScrollFocus());

connectedCallback() {
  super.connectedCallback();
  if (this.hasUpdated) this.#overflow.observe(this.body);
}

firstUpdated() {
  this.#overflow.observe(this.body);
}

disconnectedCallback() {
  super.disconnectedCallback();
  this.#overflow.disconnect();
}
```

The same reasoning applies to values derived from slotted content. A
`slotchange` handler fires when a slotted element enters or leaves the
slot, not when that element's own children or attributes change, so a
value cached there (the number of columns, which cells hug) goes stale as
soon as the consumer edits the slotted subtree. Read it from the light DOM
at render time instead; `slotchange` only needs to `requestUpdate()`.

```ts
// Incorrect — cached on slotchange, stale when the header row's cells change
@state() private hugColumns: boolean[] = [];
#onHeaderChange = (e: Event) => {
  this.hugColumns = cellsOf(e.target).map((cell) => cell.hasAttribute('hug'));
};

// Correct — derived when rendering, slotchange just schedules a render
get #hugColumns() {
  return Array.from(this.querySelectorAll(':scope > [slot="header"] > sb-table-cell'), (c) => c.hasAttribute('hug'));
}
#onHeaderChange = () => this.requestUpdate();
```
