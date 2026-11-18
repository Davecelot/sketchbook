# Composition Patterns

Component APIs tend to rot the same way: someone adds one boolean attribute
to handle a special case, then another, then another, until the element has
five booleans and thirty-two possible states — most of them impossible or
untested. The fix is almost always composition (slots, variants), not more
attributes.

## 1. Avoid boolean-attribute proliferation (CRITICAL)

Each boolean attribute that changes internal branching doubles the
component's state space. A `sb-button`-style element that grew
organically ends up like this:

```ts
// Incorrect — internal branching on booleans
static observedAttributes = ["icon-only", "destructive", "loading", "compact"];
#render() {
  const isIconOnly = this.hasAttribute("icon-only");
  const isDestructive = this.hasAttribute("destructive");
  const isCompact = this.hasAttribute("compact");
  // ...four independent booleans, sixteen combinations, most untested
}
```

Every new requirement ("icon-only + loading", "destructive + compact")
means checking combinations that were never designed together. Prefer an
explicit `variant` attribute that a shared shadow template branches on
once, plus a dedicated element for a genuinely different shape:

```ts
// Correct — explicit variant, no combinatorial branching
static observedAttributes = ["variant"]; // "primary" | "secondary" | "ghost"

// A structurally different case (icon-only) is its own element, not a
// boolean on this one:
customElements.define("sb-icon-button", SbIconButton);
```

Each variant/element is self-documenting at the call site — `<sb-icon-button>`
tells you exactly what renders, where `<sb-button icon-only>` doesn't.

## 2. Named slots + a shared lightweight controller (HIGH)

When a component has several parts that need to coordinate (open/closed
state, active index), reaching for a monolithic element with `header-html`/
`footer-html` string attributes gets unwieldy fast. Structure it as
independent custom elements that share a plain controller object instead of
React-style context — Web Components has no built-in context propagation,
so the controller is passed by reference (a shared property, or resolved by
each child from its closest ancestor):

```ts
// Correct — a plain controller object, not a framework context
class TabsController extends EventTarget {
  #activeValue: string;
  constructor(defaultValue: string) {
    super();
    this.#activeValue = defaultValue;
  }
  get activeValue() {
    return this.#activeValue;
  }
  setActive(value: string) {
    this.#activeValue = value;
    this.dispatchEvent(new CustomEvent('change', { detail: { value } }));
  }
}

class SbTabsRoot extends HTMLElement {
  controller: TabsController;
  connectedCallback() {
    this.controller = new TabsController(this.getAttribute('default-value')!);
    // hand the controller to descendants, e.g. by assigning it once
    // they're connected: this.querySelectorAll("sb-tab").forEach(
    //   (tab) => (tab.controller = this.controller)
    // );
  }
}

class SbTab extends HTMLElement {
  controller?: TabsController;
  connectedCallback() {
    this.controller?.addEventListener('change', () => this.#render());
    this.addEventListener('click', () => this.controller?.setActive(this.getAttribute('value')!));
  }
  #render() {
    const isActive = this.controller?.activeValue === this.getAttribute('value');
    this.toggleAttribute('active', isActive);
  }
}
```

Consumers compose exactly the parts they need, in whatever DOM structure
they need — the controller, not visual nesting or a framework context tree,
is what coordinates them.

## 3. Define a generic `state`/`actions` controller interface (HIGH)

If a shared controller's public shape is opaque and generic — rather than
tied to one specific implementation — any controller can drive the same
UI. That makes the same custom elements reusable against completely
different state sources (an in-memory controller today, one synced from a
URL query param later) without touching the UI elements at all:

```ts
interface AccordionController {
  readonly openItems: ReadonlySet<string>;
  toggle(id: string): void;
  addEventListener(type: 'change', listener: () => void): void;
}

// Implementation A: local, ephemeral state
class LocalAccordionController extends EventTarget implements AccordionController {
  #openItems = new Set<string>();
  get openItems() {
    return this.#openItems;
  }
  toggle(id: string) {
    this.#openItems.has(id) ? this.#openItems.delete(id) : this.#openItems.add(id);
    this.dispatchEvent(new Event('change'));
  }
}

// Implementation B: state synced from a URL query param, same interface —
// SbAccordionItem never knows which one is driving it.
```

`SbAccordionItem`, `SbAccordionTrigger`, etc. only ever read the
controller's public shape and call its methods — they never know which
concrete controller is above them.

## 4. Lift shared state into a controller, not scattered event listeners (HIGH)

A common anti-pattern when a sibling needs another element's internal
state: reach into it via `querySelector` and read a property, or dispatch
ad hoc custom events with no single source of truth. Both add indirection
and timing bugs. Lift the state into a shared controller instead (§2/§3),
and let any element that holds a reference to it read or act on it:

```ts
// Incorrect — reaching across the DOM tree and hoping the sibling exists
function handleSelectionChange(selected: string[]) {
  const summary = document.querySelector('sb-selection-summary');
  if (summary) (summary as any).selected = selected; // untyped, fragile
}

// Correct — a shared controller both elements hold a reference to
const controller = new SelectionController();
picker.controller = controller;
summary.controller = controller; // reads controller.selected directly, no reaching-in
```

`sb-selection-summary` doesn't need to be a DOM sibling/child of
`sb-item-picker` — it only needs a reference to the same controller.
Controller ownership matters, not DOM nesting.

## 5. Prefer slot composition over configuration attributes (MEDIUM)

A `header-html`/`footer-html` string attribute works, but it's harder to
read at the call site than plain slotted markup, and string-typed HTML
attributes can't hold real elements or event listeners:

```html
<!-- Incorrect -->
<sb-card header-html="<h2>Plan</h2>" footer-html="<button>Upgrade</button>"></sb-card>

<!-- Correct -->
<sb-card>
  <h2 slot="header">Plan</h2>
  <button slot="footer">Upgrade</button>
</sb-card>
```

A named slot is still the right tool even when the parent needs to hand
data to the slotted content at render time — read the light-DOM node via
`slotchange`/`assignedElements()` and mutate it directly, rather than
serializing data into an attribute string.
