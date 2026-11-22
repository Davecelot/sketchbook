---
name: playwright-worker
description: >
  Real-browser behavior tests for Sketchbook Web Components with Playwright
  against the built Storybook: keyboard, hover/focus/disabled states, events
  and attributes across the shadow DOM. No visual regression. Trigger:
  creating, updating or running Playwright tests for a component, or browser
  QA of its rendered states.
metadata:
  author: sketchbook
  version: "1.0.0"
  changelog: Rendered from the shared workflow
  auto-invoke: See description
  allowed-tools: Governed by the client and user
---

# Playwright Worker

> **Setup:** the infrastructure lives under `playwright/` at the repo root:
> the Playwright config, `fixtures.ts`, `helpers/` and
> `tests/<name>/<name>.behavior.spec.ts`. Specs run against the built
> Storybook (`npm run test:component`). There is no coverage tooling and no
> visual regression (see "Visual regression" below).

---

## When to use

Use this skill when:

- Testing browser-level behavior code review can't catch: hover states,
  keyboard navigation, focus, disabled/loading states, attribute
  reflection, click/event dispatch across the shadow DOM boundary.
- Validating a component's behavior across its Storybook story variants.
- Doing interactive browser QA of a component's rendered states.

Do not use this skill for:

- Contract or schema validation (use `npm run check`).
- Accessibility auditing as the primary method (use `a11y-checker` first;
  Playwright supplements it with real keyboard/focus behavior, it doesn't
  replace the WCAG audit).
- Logic/unit testing: this repo has no unit test runner; don't invent one
  here as a side effect of this skill.

Prerequisites:

- Built Storybook: `npm run build-storybook` (the behavior specs run against
  the build; `npm run test:component` is the entry point), or `npm run
  storybook` (port 6006) for interactive work.
- `@playwright/test` is a dev dependency (see `package.json`).
- Chromium installed: `npx playwright install chromium` (first-time only).

---

## Critical patterns

### 1. Story URL Construction

All tests navigate to Storybook iframe URLs via a `gotoStory()` helper —
it navigates and waits for the target custom element to be defined and
upgraded before assertions run (the Web Components equivalent of waiting
for a framework's render cycle to settle):

```typescript
import { expect, test } from '../../fixtures';
import { gotoStory } from '../../helpers/storybook';

await gotoStory(page, 'components-button--default', 'sb-button');
```

`test` and `expect` come from `playwright/fixtures.ts`, not `@playwright/test`.

Story ID convention: title `Components/Button` + story export `Default` →
`components-button--default`. Multi-word story names kebab-case (`export
const WithIcon` with `name: "With icon"` → `components-button--with-icon`).

### 2. Test File Naming

```text
playwright/tests/<name>/
└── <name>.behavior.spec.ts   # click, keyboard, attribute assertions
```

One folder per component. Component tests are TDD (`features.testFirst`):
write the behavior spec first, watch it fail, then implement. Story IDs as string literals, not extracted into
shared constants across files — each spec should read standalone.

Helpers are the exception: a helper used by more than one spec, or more
than once in the same spec, lives in `playwright/helpers/`, parametrized
by tag name or role instead of hard-coding one component. Check there
before writing one inline:

- `storybook.ts`: `gotoStory(page, storyId, tagName)`
- `events.ts`: `countHostChanges(page, tagName)` counts bubbling,
  composed `change` events from that tag
- `a11y.ts`: `axNodes(cdp, role)` returns `{ name, description }` for
  every node with that role in Chromium's accessibility tree;
  `axeViolations(page, tagName, exclude?)` runs axe-core on the component's
  subtree (other DS components it composes go in `exclude`: they have
  their own specs). Every new spec asserts it returns `[]` on the default
  story and on each story that changes the structure (loading, empty);
  existing specs adopt it as their component gets touched
- `a11y.ts` also has `expectScreenReaderView(page, name)`: see pattern 7
- `forms.ts`: `mountForm(page, markup)`, `formEntries(page)` and
  `recordEntriesOnChange(page)` (the `FormData` seen by each `change`
  listener) for form-association tests

### 3. Behavior Test Structure (Given-When-Then)

Assert against the real rendered shadow DOM per story. For an interactive
component like `sb-button` the structure covers focus/keyboard/click; for a
non-interactive one it covers attribute reflection and rendered output.

```typescript
test.describe('Button — behavior', () => {
  test('does not fire click while disabled', async ({ page }) => {
    // Given
    await gotoStory(page, 'components-button--disabled', 'sb-button');
    // When
    await page.locator('sb-button').click({ force: true });
    // Then
    await expect(page.locator('sb-button')).toHaveAttribute('disabled', '');
  });
});
```

### 4. Locators Pierce the Shadow DOM

sketchbook Web Components render their internal markup inside an open
shadow root (see `src/components/button/Button.ts`). Playwright's locator
engine pierces open shadow DOM automatically — chain locators through the
host element rather than trying to reach into `shadowRoot` manually:

```typescript
// Host-level state (reflected attributes)
await expect(page.locator('sb-button')).toHaveAttribute('variant', 'primary');

// Internal control state
await expect(page.locator('sb-button').locator('button')).toBeEnabled();
```

### 5. Click/Event Assertions Across the Shadow Boundary

Native DOM events are `composed: true` by default and retarget to the host
element when crossing a shadow boundary, so a listener attached to the
custom element (not its internal markup) will still fire:

```typescript
const clicked = page.evaluate((tag) => {
  return new Promise<boolean>((resolve) => {
    document.querySelector(tag)!.addEventListener('click', () => resolve(true), { once: true });
  });
}, 'sb-button');
await page.locator('sb-button').click();
await expect(clicked).resolves.toBe(true);
```

### 6. Playwright MCP — Exploratory QA

The repo's `.mcp.json` configures a Playwright MCP server named
`playwright` (`npx @playwright/mcp@<pinned>`). Use it for exploratory,
chat-driven browser QA (navigate to a story at `http://localhost:6006`,
inspect rendered states, take a screenshot). Anything worth keeping must be
turned into a committed spec file under `playwright/tests/`; MCP sessions
are not a substitute for tests.

### 7. Screen-reader views

`expectScreenReaderView(page, '<name>-<state>')` reads Chrome's computed
accessibility tree (roles, names, descriptions, states, focus, the active
item) as text, fails on an unnamed control, and compares it with a stored
view. Add a `screen-reader view: ...` test to the behavior spec when the
contract binds keys beyond Tab and Enter: press the keys, wait for the UI
to settle, then call it once per state that changes what is announced.

```typescript
await page.keyboard.press('ArrowDown');
await expectScreenReaderView(page, 'command-arrow-down');
```

Views live in `playwright/tests/<name>/__screen-reader__/<name>-<state>.txt`.
Story views (every story of every component and kit) are written by
`tests/screen-reader/stories.spec.ts` into `__screen-reader__/stories/`.
A new view is written and fails once, so someone reads it.

```bash
npm run test:component -- tests/screen-reader --update-snapshots
npm run test:component -- tests/<name> -g "screen-reader view" --update-snapshots
```

Read the view diff before updating: a changed view is a review item, not
a pass (SB-0113). Check S1 fails if a shipped component has no story views.

---

## Decision tree

```text
Testing rendered DOM / attribute reflection? → .behavior.spec.ts + toHaveText/toHaveAttribute
Testing keyboard/focus/click (interactive)?  → .behavior.spec.ts + keyboard/click assertions
Keys that change what is announced?    → add a screen-reader view test, see pattern 7
Testing visual appearance?              → not set up (see "Visual regression" below)
Want interactive chat-driven QA?        → Playwright MCP, see pattern 6
```

---

## Visual regression — not set up

There is no visual regression in this repo: no `toHaveScreenshot()` specs
and no tracked screenshot baselines. Pixel baselines are
rendering-environment-specific (antialiasing, font hinting), so they only
help when generated and diffed in one consistent environment. Don't add
screenshot specs as a side effect of this skill.

---

## Relationship to other skills

| Skill                           | Relationship                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `web-components-best-practices` | Upstream — the composition/performance patterns Playwright verifies actually hold at runtime        |
| `a11y-checker`                  | Sequential — WCAG audit first, then Playwright for real keyboard/focus/ARIA validation in a browser |
| `figma-worker`                  | Upstream — design states/variants inform what a component's stories should cover                    |

Position in the component-verification chain: after implementation and
`a11y-checker`, as the last check that exercises the component in a real
browser rather than reading its source.

---

## Commands

```bash
# Run the Playwright tests (runs against the built Storybook).
npm run test:component

# Interactive Playwright UI — step-through debugging
npm run test:component -- --ui

# Run with a visible browser — good for initial debugging
npm run test:component -- --headed

# Open the HTML test report after a run
npx playwright show-report

# Run tests for a single component (arguments pass through to Playwright)
npm run test:component -- tests/button/

# Install the Chromium browser (first-time setup)
npx playwright install chromium
```

---

## Resources

- Config: the Playwright config under `playwright/`
- Shared helpers: `playwright/helpers/` (see Critical patterns, 2: Test File Naming)
- Storybook: `http://localhost:6006`
- Tests: `playwright/tests/<name>/<name>.behavior.spec.ts`
