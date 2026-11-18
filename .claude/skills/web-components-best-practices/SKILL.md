---
name: web-components-best-practices
description: >
  Composition and performance guidance for native Web Components: slots over
  boolean props, shared controllers, re-render and bundle cost by impact.
  Trigger: before writing a new custom element, reviewing or refactoring Web
  Components code, or a question about Shadow DOM composition, slotting or
  shared state.
metadata:
  author: sketchbook
  version: '1.4.0'
  changelog: >
    Shorter description (at most 400 characters); descriptions are in
    context every session (SB-0114); affects context cost only.
  auto-invoke: Writing, reviewing, or refactoring Web Components (custom elements)
  allowed-tools: [Read, Edit, Write, Glob, Grep, Bash]
---

# Web Components Best Practices

Practical, prioritized guidance for writing native Web Components that stay
fast and easy to change as they grow. This skill does not replace
judgment — it gives you a ranked checklist so effort goes where it actually
matters (a waterfall fix beats a micro-optimization every time).

---

## When to use

Use this skill when:

- Writing a new custom element
- Reviewing or refactoring an existing custom element's source
- Designing a custom element's public API (attributes, properties, slots)
- Investigating a reported performance issue in a page using these components

Do not use this skill for:

- Replacing the `contract-first` rule: a new component still needs its contract before implementation (see Critical patterns, 2).
- Micro-optimizing before the higher-priority issues in the Priority index are fixed.

---

## Critical patterns

### 1. Stack: Lit, not vanilla custom elements

Every component in this repo (`src/components/<name>`) extends
`LitElement`, not `HTMLElement` directly. Components declare
`@property({ reflect: true })` and never touch `observedAttributes` or
`attributeChangedCallback` by hand.
`platform-fundamentals.md` §1–§3 (constructor restrictions,
`observedAttributes` completeness, attribute/property reflection) describe
what the platform requires and are sourced from MDN's vanilla
custom-elements docs — Lit's reactive property system already satisfies
those three for you, so they're marked **Lit-covered** below. Everything
from §4 onward (styling API, forms, accessibility, slotted content) is
unaffected by Lit and stays the author's responsibility exactly as
written.

### 2. Relationship to this repo's contract-first flow

This skill governs **how** to write a custom element once you're writing
one. It does not replace the
[`contract-first`](../../rules/contract-first.md) rule: a new
component under `src/components/<name>` still needs a
`spec/components/<name>/contract.json` before implementation begins.

---

## Decision tree

```text
Writing or changing a component's public API (attributes, properties, slots)?  -> references/api-and-interop-conventions.md
Lifecycle, reflection, styling hooks, forms, shadow-boundary accessibility?    -> references/platform-fundamentals.md
Boolean flags piling up, slots, shared state across elements?                  -> references/composition-patterns.md
Slow render, bundle size, waterfalls, re-render cost?                          -> references/performance-rules.md
Several issues found?                                                          -> fix the highest priority first (Priority index)
```

---

## Priority index

Fix higher-priority issues first — a CRITICAL bundle-size or waterfall
problem outweighs a dozen LOW-priority micro-optimizations.

### Platform fundamentals — [`references/platform-fundamentals.md`](references/platform-fundamentals.md)

| Priority   | Category                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRITICAL   | Constructor restrictions (no attribute/DOM work before `connectedCallback`) — **Lit-covered**                                                           |
| CRITICAL   | `observedAttributes` must list every attribute the component reacts to — **Lit-covered** (generated from `@property()`)                                 |
| HIGH       | Attribute/property reflection must go both directions — **Lit-covered** (`@property({ reflect: true })`)                                                |
| HIGH       | `::part()` + CSS custom properties as the public styling API                                                                                            |
| HIGH       | Form-associated elements need `ElementInternals` (form controls only)                                                                                   |
| HIGH       | Accessibility crosses the shadow boundary; focus delegation doesn't happen automatically                                                                |
| MEDIUM     | `::slotted()` for base styles on projected content                                                                                                      |
| MEDIUM     | `:state()`/`CustomStateSet` for internal-state styling hooks                                                                                            |
| MEDIUM     | `slotchange` for validating/reacting to projected content                                                                                               |
| LOW-MEDIUM | `:defined` to avoid a flash of unstyled/un-upgraded content                                                                                             |
| HIGH       | Observers set up in `firstUpdated` re-attach in `connectedCallback`; values derived from slotted content are read at render, not cached on `slotchange` |

### Public API & framework interop — [`references/api-and-interop-conventions.md`](references/api-and-interop-conventions.md)

| Priority | Convention                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------ |
| CRITICAL | Public API is attributes + properties + events + slots — nothing else                            |
| HIGH     | dash-case attributes, camelCase properties                                                       |
| HIGH     | Attributes for simple declarative config; properties for complex data                            |
| HIGH     | Event naming — mirror native events, prefix custom ones, bubble + compose                        |
| HIGH     | Production anti-patterns (FOUC, naive shadow-DOM SSR, app-level logic in components)             |
| MEDIUM   | Theming via the token layering; `--sb-<component>-*` component variables are the public override hook |
| MEDIUM   | Methods callable only after `customElements.whenDefined()`                                       |
| MEDIUM   | Framework interop caveats (React 19 verbatim events, Vue `.prop`, ship TS defs)                  |

### Composition & component architecture — [`references/composition-patterns.md`](references/composition-patterns.md)

| Priority | Pattern                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------ |
| CRITICAL | Avoid boolean-attribute proliferation — use explicit variants / slots instead                          |
| HIGH     | Use named slots + a shared lightweight controller instead of a monolithic element with config props    |
| HIGH     | Define a generic `state` / `actions` controller interface so a component's UI is state-source-agnostic |
| HIGH     | Lift shared state into a controller object, not scattered cross-element event listeners                |
| MEDIUM   | Prefer explicit variant attributes over boolean-driven modes                                           |
| MEDIUM   | Prefer slot composition over configuration attributes                                                  |

### Performance — [`references/performance-rules.md`](references/performance-rules.md)

| Priority    | Category                                                              |
| ----------- | --------------------------------------------------------------------- |
| CRITICAL    | Eliminating async waterfalls                                          |
| CRITICAL    | Bundle size optimization                                              |
| HIGH        | Declarative Shadow DOM / SSR (currently deferred — see reference doc) |
| MEDIUM-HIGH | Client-side data fetching                                             |
| MEDIUM      | Attribute-driven re-render optimization                               |
| MEDIUM      | Rendering performance                                                 |
| LOW-MEDIUM  | JavaScript hot-path performance                                       |
| LOW         | Advanced patterns (only once profiling justifies them)                |

---

## Commands

None: this skill is guidance only.

---

## Resources

- [`references/platform-fundamentals.md`](references/platform-fundamentals.md) — lifecycle correctness, attribute/property reflection, styling API surface (`::part`, custom properties, `:state()`), forms participation, cross-shadow-boundary accessibility (sourced from MDN's Web Components docs)
- [`references/api-and-interop-conventions.md`](references/api-and-interop-conventions.md) — public API surface conventions, naming/event conventions, framework interop caveats, production anti-patterns (sourced from Nord Health's dev docs and design-system practitioner writing)
- [`references/composition-patterns.md`](references/composition-patterns.md) — component architecture, slotting, controller-object design
- [`references/performance-rules.md`](references/performance-rules.md) — the 8-category performance rule set with examples
