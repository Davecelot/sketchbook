# Performance Rules

Ordered by impact. Fix a CRITICAL waterfall before touching a LOW-priority
micro-optimization — the ordering is the point.

## 1. Eliminating async waterfalls (CRITICAL)

A sequential chain of `await`s that don't depend on each other is the
single most common source of slow page loads. Whenever two async calls
don't need each other's result, run them concurrently. This is
framework-agnostic — applies identically inside a custom element's
lifecycle callback:

```ts
// Incorrect — sequential, each await blocks the next
async function loadDashboard(userId: string) {
  const profile = await fetchProfile(userId);
  const settings = await fetchSettings(userId);
  const notifications = await fetchNotifications(userId);
  return { profile, settings, notifications };
}

// Correct — independent fetches run in parallel
async function loadDashboard(userId: string) {
  const [profile, settings, notifications] = await Promise.all([
    fetchProfile(userId),
    fetchSettings(userId),
    fetchNotifications(userId),
  ]);
  return { profile, settings, notifications };
}
```

Other moves in this category: defer an `await` into the branch where its
result is actually used (don't await something up front if a cheap sync
check might make it unnecessary); use `Promise.all` for independent work
even when results have partial dependencies (start what you can before
awaiting what you must).

## 2. Bundle size optimization (CRITICAL)

Every KB shipped to the client costs parse/execute time on every visit.

```ts
// Incorrect — barrel import registers every custom element up front
import 'sketchbook';
// Correct — import only the specific component's module, so a page using
// just sb-button doesn't register/parse every other component too
import 'sketchbook/button';
```

```ts
// Incorrect — heavy, rarely-used component always in the initial bundle
import './RichEditor.js';

// Correct — loaded only when the editor is actually opened
async function openEditor() {
  await import('./RichEditor.js');
}
```

Also: defer loading third-party scripts (analytics, chat widgets) until
after the page is interactive; gate heavy modules behind the feature flag
that activates them instead of importing unconditionally at the top of the
file.

## 3. Declarative Shadow DOM / SSR (HIGH — currently deferred)

Server-rendering a custom element's shadow tree requires **Declarative
Shadow DOM** (`<template shadowrootmode="open">`) rather than React's
RSC/streaming model — there is no equivalent mechanism otherwise, since a
client-only `attachShadow()` call can't run before the browser has the
element in the DOM. This repo's components currently render client-side
only (Storybook/Vite, no SSR pipeline), so this category is **out of
scope until SSR is actually needed** — don't build Declarative Shadow DOM
support speculatively. When it is needed: emit the `<template
shadowrootmode="open">` markup server-side with the same shadow content the
client constructor would build, and skip the constructor's own
`attachShadow()` call when a declarative shadow root is already present
(`this.shadowRoot` is non-null before your code runs).

## 4. Client-side data fetching (MEDIUM-HIGH)

```ts
// Incorrect — every instance fires its own fetch, no dedup
class SbUserBadge extends HTMLElement {
  connectedCallback() {
    fetchUser(this.getAttribute('user-id')!).then((user) => this.#render(user));
  }
}

// Correct — a small in-memory cache keyed by id dedupes identical concurrent requests
const userCache = new Map<string, Promise<User>>();
function fetchUserCached(id: string) {
  if (!userCache.has(id)) userCache.set(id, fetchUser(id));
  return userCache.get(id)!;
}
class SbUserBadge extends HTMLElement {
  connectedCallback() {
    fetchUserCached(this.getAttribute('user-id')!).then((user) => this.#render(user));
  }
}
```

Also: attach scroll/touch listeners with `{ passive: true }` so the browser
doesn't wait on the handler before scrolling; version any schema you
persist to `localStorage` so a future shape change can migrate or discard
old data instead of crashing on read.

## 5. Attribute-driven re-render optimization (MEDIUM)

There is no VDOM diffing model here — `attributeChangedCallback` fires
once per changed attribute, and `#render()` should stay a cheap, idempotent
sync of a handful of DOM properties/classes onto a **fixed** shadow
template, not a rebuild of the tree:

```ts
// Incorrect — rebuilds the whole shadow tree on every attribute change
attributeChangedCallback() {
  this.shadowRoot!.innerHTML = this.#buildTemplateString(); // re-parses HTML every time
}

// Correct — template built once in the constructor; #render() only
// syncs the attributes/classes that actually need to change
attributeChangedCallback() {
  this.#render(); // toggles a few attributes/classes on already-existing nodes
}
```

Also: batch multiple attribute writes from calling code where possible
(setting `variant`, then `loading`, then `disabled` back-to-back triggers
three `attributeChangedCallback` calls — each cheap here since `#render()`
is idempotent, but avoid doing genuinely expensive work per-attribute
inside `#render()` if the callback count grows); prefer CSS `:host([attr])`
selectors over JS-toggled classes when the only effect is a style change
(§ see `composition-patterns.md`) — that moves work from JS into the CSS
engine entirely.

## 6. Rendering performance (MEDIUM)

```ts
// Incorrect — reflows/repaints an off-screen list unnecessarily
list.style.display = 'block'; // triggers layout even while fully scrolled out of view

// Correct — content-visibility skips layout/paint for off-screen content
```

```css
.sb-list-section {
  content-visibility: auto;
}
```

Also: hoist a static SVG/template `<template>` element to module scope
instead of re-parsing an HTML string on every instance construction (this
component library's shared `template.content.cloneNode(true)` pattern is
exactly this); reuse one constructed `CSSStyleSheet` across all instances
via `adoptedStyleSheets` rather than one inline `<style>` per instance.

## 7. JavaScript hot-path performance (LOW-MEDIUM)

```ts
// Incorrect — O(n) lookup inside a loop makes the whole thing O(n²)
function attachAuthors(posts: Post[], users: User[]) {
  return posts.map((post) => ({
    ...post,
    author: users.find((u) => u.id === post.authorId),
  }));
}

// Correct — build the lookup map once, O(1) per post
function attachAuthors(posts: Post[], users: User[]) {
  const usersById = new Map(users.map((u) => [u.id, u]));
  return posts.map((post) => ({ ...post, author: usersById.get(post.authorId) }));
}
```

Also: return early from a function once its answer is known instead of
nesting the rest of the body in an `else`; cache a value read repeatedly
from the same object/array index inside a loop instead of re-reading it
each iteration.

## 8. Advanced patterns (LOW)

These add real complexity — reach for them only after profiling shows a
specific, measured problem, not preemptively:

- Guard `connectedCallback` setup against re-running redundant work when an
  element is moved within the DOM (which fires `disconnectedCallback` then
  `connectedCallback` again, not just once on first mount) — e.g. track
  whether long-lived listeners are already attached instead of
  unconditionally re-adding them.
- Storing an event handler reference so `disconnectedCallback` can
  `removeEventListener` the exact same function identity that
  `connectedCallback` added, avoiding either a listener leak or an
  accidental double-listener on reconnection.
