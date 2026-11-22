# Public API & Framework-Interop Conventions

`platform-fundamentals.md` covers the platform _mechanics_ (lifecycle,
reflection, styling hooks); this file covers the _conventions_ a design
system layers on top so its components present one consistent, framework-
agnostic public surface. Sourced from Nord Health's production web-components
docs (nordhealth.design/docs/developer/web-components) and design-system
practitioner writing (Rob Eisenberg / FAST, and others). Nord Health is a
Lit-free native-custom-elements design system with the same architecture as
this repo, so its documented conventions and hard-won anti-patterns carry
the most weight here.

## 1. The public API is attributes + properties + events + slots — nothing else (CRITICAL)

A design-system component's contract to consumers is exactly: its
attributes, its properties, the events it dispatches, and its slots. Keep
that surface small and stable and the same component works unchanged across
React, Vue, Angular, or no framework — that framework-agnostic reach is the
entire reason this repo derives from a contract instead of shipping per-
framework components. Don't leak internal shadow structure, private
methods, or implementation classes into what consumers depend on.

## 2. Naming conventions: dash-case attributes, camelCase properties (HIGH)

Attributes are `dash-case` in markup; the mirroring property is `camelCase`
in JS. This is the platform's own convention (`tab-index` ↔ `tabIndex`) and
consumers expect it:

```html
<sb-input hide-label></sb-input>
```

```ts
el.hideLabel = true; // same state, camelCase property
```

Boolean attributes follow presence semantics — absent = false, present
(even valueless) = true — so never write `hide-label="false"` expecting it
to disable (see reflection rules in `platform-fundamentals.md` §3).

## 3. Attributes for simple declarative config; properties for complex data (HIGH)

HTML attributes are strings only. Simple, declarative, initial-state config
(`variant`, `disabled`, `label`) belongs in attributes so it works from
plain markup and SSR. Rich data — objects, arrays, functions — must go
through a JS **property**; do not JSON-serialize an object into an
attribute string:

```ts
// Correct — complex data via a property, never an attribute
picker.options = [{ id: 1, label: 'A' }];

// Incorrect — object stringified into an attribute
picker.setAttribute('options', JSON.stringify([{ id: 1, label: 'A' }]));
```

## 4. Event naming: mirror native events; prefix genuinely custom ones (HIGH)

When a component emits something with a native analogue, reuse the native
name (`change`, `input`, `focus`, `blur`) so consumers apply familiar
patterns. Only genuinely component-specific events get a `sb-` prefix so
their custom nature is explicit. Design-system events bubble and cross the
shadow boundary — dispatch them `{ bubbles: true, composed: true }` so
consumers can delegate (see `platform-fundamentals.md` §8 on
`composed`):

```ts
this.dispatchEvent(
  new CustomEvent('sb-select', {
    bubbles: true,
    composed: true,
    detail: { value },
  }),
);
```

## 5. Theming is via a token layering; component token variables are the public override hook (MEDIUM)

This repo themes components through two token layers: semantic tokens
(`spec/tokens/semantic/*.tokens.json`) and a component layer. A component's
SCSS declares only its own component token variables, `--sb-<component>-*`
(for example `--sb-button-bg`), each aliasing a semantic token; component
styles read those variables. Overriding a semantic token re-themes globally;
overriding a component variable re-themes one component. Treat the
`--sb-<component>-*` names as public API, and never expose an unprefixed or
`--_`-prefixed internal variable, which stays free to change. Steer
consumers to a component's own attributes/properties _first_; a
custom-property override is the escape hatch for what the API doesn't
already cover, not the primary path (mirrors §4 of
`composition-patterns.md`: prefer the real API over reaching around it).
See `platform-fundamentals.md` §4 for the `::part()`-vs-custom-property
split.

## 6. Methods are callable only after the element is defined (MEDIUM)

Properties set on an element before its class is registered are retained
and applied on upgrade; **method calls are not** — calling `el.open()`
before definition throws. Guard imperative calls with
`customElements.whenDefined()`:

```ts
await customElements.whenDefined('sb-dialog');
dialog.open();
```

## 7. Framework interop caveats to document, not to paper over (MEDIUM)

The component stays native; the friction lives in each framework's binding
model, and consumers hit it — so document it rather than shipping wrapper
packages that rot (Nord Health deprecated its React/Vue wrappers in favor
of native use plus type definitions):

- **React 19+** passes props to custom elements as properties and binds
  events by their **verbatim** name — `onds-select`, not a camelCased
  `onDsSelect`. (React <19 needs a `ref` + `addEventListener`, since it
  set everything as attributes and never listened for custom events.)
- **Vue** treats bindings as attributes unless told otherwise — pass
  objects/arrays/functions with the `.prop` modifier: `:options.prop="..."`.
- Ship **TypeScript definitions** for the elements (and JSX typings) so
  consumers get autocomplete and type-checking without a wrapper layer.

## 8. Anti-patterns Nord Health / practitioners call out from production (HIGH)

- **Flash of unstyled component:** load the design-system CSS _before_ the
  component scripts, and keep an element hidden until defined
  (`:not(:defined)`, see `platform-fundamentals.md` §10) — otherwise
  consumers see a flash on every load.
- **Don't SSR the shadow DOM naively:** a native custom element shallow-
  renders on the server (tag + attributes only); reflecting default
  property values to attributes _after_ definition causes hydration
  mismatches. This repo has no SSR pipeline today (see
  `performance-rules.md` §3) — the takeaway is don't half-build SSR
  support that produces mismatches.
- **Don't use web components for app-level logic:** they're a UI-component
  layer. Routing, global state, and application architecture belong in the
  consuming app, not inside custom elements — components that absorb app
  logic stop being portable, which defeats the framework-agnostic goal.
