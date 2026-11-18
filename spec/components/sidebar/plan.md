# Plan: Sidebar (planning gate)

Status: **approved** (owner answered Q1–Q6, 2026-11-12: sidebar color, width and backdrop tokens added; breakpoint as a token inlined at build time, no literal; a link closes the drawer; manual screen-reader pass replaced by automated views, SB-0113). Test-first from here. Contract: [contract.json](./contract.json), [contract.md](./contract.md). Decision: SB-0101 (proposed).

## Scope

In v1, what the docs-site shell needs plus what is cheap and coherent with it:
- `sb-sidebar-provider` (layout row, `expanded` state, `sb-toggle` event, context), `sb-sidebar` (`label`, `collapsible` = `offcanvas` | `none`), `sb-sidebar-header`, `sb-sidebar-content`, `sb-sidebar-footer`, `sb-sidebar-group`, `sb-sidebar-group-label`, `sb-sidebar-menu`, `sb-sidebar-menu-item`, `sb-sidebar-menu-button` (`href`, `active`), `sb-sidebar-trigger` (`label`).
- Wide viewports: the panel beside the content, slides out when closed (`offcanvas`) or never hides (`none`).
- Narrow viewports (below the breakpoint, Q4): the panel is a modal drawer opened by the trigger; Escape and the backdrop close it; focus returns to the trigger.
- Logical properties throughout, so right-to-left puts the panel at the right edge.

Non-goals (deferred, recommendation first):
| Deferred | Recommendation |
| --- | --- |
| `side=right` | Add when a layout needs an end-side panel; it is the same component mirrored. |
| `variant` floating / inset and `sb-sidebar-inset` | Defer; the docs shell uses the plain panel. |
| `collapsible=icon` (and menu button `tooltip`) | Defer; needs tooltips, which the system lacks. |
| `sb-sidebar-rail` | Defer; the trigger covers toggling. |
| `sb-sidebar-group-action`, `sb-sidebar-group-content`, `sb-sidebar-menu-action`, `sb-sidebar-menu-badge`, `sb-sidebar-menu-skeleton`, `sb-sidebar-input`, `sb-sidebar-separator` | Defer; use Separator, Skeleton and Input inside header or footer meanwhile. |
| Sub-menus (`sb-sidebar-menu-sub*`) and collapsible groups | Defer; the docs nav is two levels (group, item). Collapsible groups would compose Collapsible later. |
| Menu button `size` and `variant` | Defer; one size (32px) and the default look. |
| Persisting `expanded` (the reference uses a cookie) | Leave to the product: `sb-toggle` fires on every change. |
| Keyboard shortcut (Ctrl/Cmd+B) | Defer: a global shortcut can clash with the page and with assistive technology (WCAG 2.1.4 would require a way to turn it off). |
| Drawer state as a prop | Defer; the trigger, Escape, backdrop and viewport change drive it. |

## Files (in build order)
| Step | File |
| --- | --- |
| 1 | `src/components/sidebar/Sidebar.stories.ts` (Default, Collapsed, NotCollapsible, Narrow drawer, RTL, Dark) |
| 2 | `playwright/tests/sidebar/sidebar.behavior.spec.ts` (written first, must fail) |
| 3 | `src/components/sidebar/Sidebar.scss` -> `Sidebar.styles.ts` (generated) |
| 4 | `src/components/sidebar/SidebarProvider.ts`, `Sidebar.ts`, `SidebarHeader.ts`, `SidebarContent.ts`, `SidebarFooter.ts`, `SidebarGroup.ts`, `SidebarGroupLabel.ts`, `SidebarMenu.ts`, `SidebarMenuItem.ts`, `SidebarMenuButton.ts`, `SidebarTrigger.ts`, `context.ts`, `index.ts` |

Header, content, footer and menu item are layout-only; if they end up identical apart from the part name, they stay four tiny classes (the tag is the API), with no shared base class.

## Tokens

Component tokens (contract `tokens`) alias semantic tokens only: the sidebar surface, text and border colors, accent, muted-foreground, ring, the overlay backdrop, the sidebar widths, the narrow breakpoint, control sizes, inset and stack spacing, control radius, caption and control type, elevation.lg, motion normal/standard.

### Semantic tokens added (owner-approved, Q1 to Q4)
| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| `color.sidebar` | Panel surface (`sidebar.bg`) | `{color.neutral.50}` | `{color.neutral.900}` |
| `color.sidebar-foreground` | Panel text (`sidebar.fg`) | `{color.neutral.950}` | `{color.neutral.50}` |
| `color.sidebar-border` | Panel border (`sidebar.border.color`) | `{color.neutral.200}` | `{color.neutral.800}` |
| `size.sidebar.width` | Panel width, wide viewports (`sidebar.width`) | 256px | same |
| `size.sidebar.drawer-width` | Drawer width (`sidebar.drawer-width`) | 288px | same |
| `color.overlay` | Drawer backdrop, shared with Dialog (`sidebar.backdrop`) | black at 50% | black at 50% |
| `size.breakpoint.narrow` | Drawer below it (`sidebar.breakpoint`) | `{breakpoint.md}` (768px) | same |

Not added: sidebar-specific accent and ring; the shared ones work on the sidebar surface (`color.muted` is rejected because in dark it equals `color.accent`). Contrast pairs (T6, contract `accessibility.contrast`): sidebar-foreground on sidebar (`sidebar.fg` on `sidebar.bg`), muted-foreground on sidebar (`sidebar.group-label.fg` on `sidebar.bg`), accent-foreground on accent (`sidebar.menu-button.active.fg` on `sidebar.menu-button.active.bg`).

## Accessibility approach

- Native first: `<nav aria-label>` for the landmark, `<a>` / `<button>` for menu buttons, `<button>` for the trigger, `<dialog>` with `showModal()` for the drawer (top layer, inert page, Escape via `cancel`, focus restore to the trigger).
- Shadow-DOM boundaries (SB-0009): no ID references. The landmark name lives inside the sidebar's own shadow root. Group name: `ariaLabelledByElements` to its group label (both light DOM), with an aria-label copy fallback (the Tabs pattern). Trigger: `ariaControlsElements` to the `sb-sidebar` host; `aria-expanded` from context.
- Lists: `role=list` / `role=listitem` on the menu and item hosts when the author set none (the Pagination pattern). No menu roles.
- Current page: `aria-current="page"` on the inner link; forced colors draw a `Highlight` marker.
- Hidden states: a collapsed panel and a closed drawer are `display:none` (or `inert` plus hidden after the transition) so nothing hidden is focusable or announced.
- Trigger with `collapsible=none` on wide viewports: hidden.
- Mode switch: the stylesheet writes `@media (width < var(--sb-sidebar-breakpoint))`, which the style build inlines with the resolved length (SB-0109); the script builds its `matchMedia` query from the same token, read with `getComputedStyle`. Crossing to wide closes the drawer.
- Reduced motion: no slide.

### Accessibility deviations from the references
- `collapsible=none` keeps the drawer on narrow viewports (the reference renders a plain block and loses the navigation on phones).
- Groups are `role=group` named by their label (the reference renders a plain block).
- Trigger is 32px, not 28px.
- No global keyboard shortcut in v1.

## Test plan (test-first)

Write `playwright/tests/sidebar/sidebar.behavior.spec.ts` from the contract with the `playwright-worker` skill and `playwright/helpers/`; run `npm run test:component -- tests/sidebar` and record that every test fails for the right reason (element not defined) before any code.
- Props: `label` names the landmark and the drawer; `collapsible=offcanvas` hides the panel when `expanded=false`; `collapsible=none` never hides it and hides the trigger (wide); provider `expanded` reflects; menu button `href` renders a link, without it a button; `active` sets `aria-current=page` only with `href`; trigger `label` names it.
- Events: `sb-toggle` bubbles and composes after `expanded` changes from the trigger and from code; not for the drawer.
- States: hover and current fill from tokens; focus ring keyboard-only in token color; collapsed panel not focusable and not in the accessibility tree.
- Keyboard: Tab order through trigger and links; Enter/Space on the trigger toggle; narrow viewport: Enter opens the drawer, focus moves inside, Tab and Shift+Tab stay inside, Escape closes and focus is back on the trigger; backdrop press closes; resize to wide while open closes the drawer.
- Accessibility tree: navigation landmark with its name; lists and list items; groups named by their labels; trigger `aria-expanded` true/false in both modes and its controls relation; drawer is a modal dialog with the name.
- Right-to-left: panel and drawer at the right edge.
- Forced colors: current item marker and panel border.
- axe clean on every story, wide and narrow.

## Risks

- **Shared backdrop token with Dialog**: one `color.overlay` serves both; a change to it changes both.
- **Moving slotted content into the drawer**: the light-DOM children stay put; only the shadow container changes (inline column vs. `<dialog>`). A dialog that is closed is `display:none`, so the wide layout must not render inside the dialog. Mitigation: two shadow containers, the slot rendered in exactly one, chosen by the mode.
- **`ariaLabelledByElements` / `ariaControlsElements` support**: fallback copy for the group name; `aria-controls` is informative, so absence is tolerable.
- **Breakpoint changes need a rebuild**: the media query holds the length inlined at build time, so a changed breakpoint reaches the styles only after `sketchbook generate` (SB-0109); the script reads the live token, so the two agree only after that rebuild.
- **Sticky full-height panel inside arbitrary layouts**: the provider sets the layout; pages that already have a header bar need the panel below it. Tested in the docs shell before beta.

## Answers (owner, 2026-11-12)

From contract.json `openQuestions`:
- **Q1 Sidebar colors.** `color.sidebar`, `color.sidebar-foreground` and `color.sidebar-border` are added.
- **Q2 Widths.** `size.sidebar.width` (256px) and `size.sidebar.drawer-width` (288px) are added.
- **Q3 Backdrop.** The shared `color.overlay` (also used by Dialog) is the drawer backdrop.
- **Q4 Breakpoint.** A breakpoint token with a build step: `size.breakpoint.narrow` from the breakpoints standard, inlined into the media query at build time and read by the script from the same token; no literal (SB-0109, SB-0110).
- **Q5 Close drawer on link activation.** Yes.
- **Q6 Manual screen-reader pass** is replaced by the automated screen-reader views (SB-0113), stored in playwright/tests/sidebar/__screen-reader__/*.txt.
