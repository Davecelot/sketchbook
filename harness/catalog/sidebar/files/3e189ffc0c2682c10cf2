---
component: Sidebar
status: stable
version: 0.1.0
platforms: [web, design]
dependsOn: []
last_updated: 2026-11-12
source: shadcn/ui Sidebar (docs page and registry entry, UI and API); WAI-ARIA APG (landmarks, disclosure, modal dialog); harness process
---

# Sidebar

> A named navigation panel at the start edge of an app or docs layout: header, groups of links with a group label, the current page marked, footer. It can collapse off-canvas on wide viewports and becomes a modal drawer on narrow ones. Typed spec: [contract.json](./contract.json).

## 1. Purpose

The primary navigation of an app or a documentation site: many pages organized in a few sections, always one click away, with the page the person is on marked. On wide viewports the panel sits beside the content and can be hidden to give the content room. On narrow viewports it does not take space: a trigger opens it as a drawer over the page.

Scope of this version (`PROPOSAL`): what a docs-site shell needs plus what is cheap and coherent with it. Deferred (see the plan): a panel on the end side, floating and inset looks, collapsing to icons, a rail, group and item actions, badges, loading rows, nested items, remembering the open state.

## 2. Anatomy

- **Provider**: wraps the sidebar and the main content, lays them out side by side and owns the expanded state that the sidebar and the trigger share.
- **Sidebar** (root): the panel, a column with an optional **header**, one **content** region and an optional **footer**. Its whole body is one **navigation** landmark. On narrow viewports the same body sits in a **drawer**.
- **Header** and **footer**: regions that do not scroll (product name, search; account, version).
- **Content**: fills the remaining height and scrolls when its groups overflow.
- **Group**: one section: an optional **group label**, then a **menu**.
- **Menu**: a list of **menu items**, each holding one **menu button**: a link (or a button when it has no address), with an optional leading icon and its text.
- **Trigger**: an icon button, placed in the main content's header, that toggles the panel or opens the drawer.

## 3. Props / API

Sidebar:
- `label` (text, default "Sidebar", `PROPOSAL`): name of the navigation and of the drawer. Set a specific one ("Documentation").
- `collapsible` (`offcanvas` | `none`, default `offcanvas`): on wide viewports, `offcanvas` slides the panel out of the layout when the provider is closed; `none` never hides it. Narrow viewports always use the drawer (`PROPOSAL`: the reference turns the drawer off too with `none`; a docs site still needs navigation on a phone). A third value that collapses to icons is deferred.

Provider:
- `expanded` (boolean, default true): whether the panel is shown on wide viewports. The reference spells it `open`; it is the shared `expanded` meaning, as in Collapsible. The drawer has its own state, which always starts closed.
- The default of true differs from Collapsible's `expanded` on purpose: the navigation is visible until someone hides it.
- Event `sb-toggle`: after `expanded` changes, from the trigger or from code. Not for the drawer.
- The `sb-toggle` name and shape (no detail, read `host.expanded`) mirror Collapsible's and Dialog's `sb-toggle` on purpose.

Menu button:
- `href` (text): the page the item links to; `javascript:`, `vbscript:` and `data:` URLs are dropped (SB-0115).
- `active` (boolean): the current page. Same name as on the pagination link; at most one per sidebar; ignored without `href`.

Trigger:
- `label` (text, default "Toggle Sidebar"): the button's name, since it shows only an icon.

Header, content, footer, group, group label, menu and menu item have no props.

## 4. Variant matrix

One dimension: `collapsible` (`offcanvas`, `none`). It changes behavior on wide viewports only; the look is the same.

## 5. Roles and color

- Panel: the sidebar surface and its text, with a border in the sidebar border color on the inline-end edge (Q1).
- Group label: muted text.
- Menu button: panel text at rest; on hover the accent fill and accent text; the current page keeps the accent fill and uses the label weight.
- Trigger: foreground icon, accent fill on hover.
- Focus ring: the ring color.
- Drawer: the panel surface with the large elevation, over a backdrop in the overlay color, shared with Dialog (Q3).

## 6. States

- **Hover**: menu button and trigger take the accent fill.
- **Selected (current page)**: the menu button with `active` keeps the accent fill and a heavier weight, and is announced as the current page.
- **Focus visible**: a ring, keyboard focus only.
- **Open / closed (wide)**: the panel slides along the inline axis; while closed it is out of the layout, the tab order and the accessibility tree.
- **Drawer open / closed (narrow)**: the drawer slides in from the inline start over a backdrop; the rest of the page is inert while it is open.
- Motion is removed when the person asks for reduced motion.

## 7. Dimensions and layout

- Panel width `sidebar.width` (256px) on wide viewports, `sidebar.drawer-width` (288px) in the drawer (Q2). The panel is as tall as the viewport and stays in place while the page scrolls; only the content region scrolls.
- Header, content groups and footer: small inset padding, small stack gap. Menu: tight gap between items.
- Menu button and group label: at least 32px high, small inset padding, control gap between icon and text, control radius; the text wraps and the row grows, so text spacing and zoom never clip it (WCAG 1.4.12, 1.4.10). One line stays 32px high.
- Trigger: 32px square (`PROPOSAL`: the reference is 28px; 32px is the system's small control size).
- Narrow viewport: below `sidebar.breakpoint` (the semantic `size.breakpoint.narrow`, 768px with the default brand; Q4, SB-0109, SB-0110). The stylesheet's media query gets the token inlined at build time; the provider reads `--sb-sidebar-breakpoint` at runtime, so there is no second constant. If the token resolves empty, the provider warns once and stays wide. The token is read once when the provider connects, so the token stylesheet must be loaded by then. Crossing to a wide viewport while the drawer is open closes the drawer and shows the panel per `open`.
- The panel follows the writing direction: at the right edge in right-to-left, and the drawer slides from there.

## 8. Typography

- Menu button: control size and line height, body weight; label weight for the current page.
- Group label: caption size, label weight.
- Header and footer content brings its own type.

## 9. Accessibility

- The panel is one **navigation landmark** named by `label` (APG landmarks: name every navigation when there are several, uniquely). Header and footer sit inside it.
- Menus are **lists of links**, not menus: site navigation uses list and link semantics, never menu or menuitem roles (APG). Tab moves through the links; there are no arrow-key bindings.
- Each **group** is a group named by its group label (`PROPOSAL`: a heading was the alternative; it would add every section to the page's heading outline). A group without a label, or an author `aria-label`/`aria-labelledby`, has no group role: an unnamed group adds nothing but noise.
- The **current page** is exposed as the current page of the set (`aria-current="page"`), not only by its look; forced-colors mode keeps a visible marker.
- The **trigger** is a disclosure button: it reports expanded or collapsed for whatever it controls in the current mode, and references the panel it controls directly, never through an ID (SB-0009; see Realizations). With `collapsible=none` on a wide viewport it controls nothing and is hidden there (`PROPOSAL`).
- The **drawer** is a modal dialog (APG): named by `label`; the page behind is inert; Tab and Shift+Tab stay inside; focus goes to the first focusable element inside on open (`PROPOSAL`: the current link was the alternative; it is often far down the list) and back to the trigger on close; Escape and a press-and-release on the backdrop close it.
- A link that closes the drawer returns focus to the trigger, as Escape and the backdrop do. A modified or non-primary click (opening the link in a new tab or window) leaves the drawer open.
- When the viewport crosses the breakpoint while focus is inside the sidebar, focus moves to the trigger (or to the first menu button when the trigger is hidden), so it never drops to the page. The same holds when code closes the panel (`open = false`) while focus is inside it: focus moves to the trigger.
- **Keyboard shortcut**: Control+B (Meta+B on macOS) toggles the sidebar as the trigger does: the panel on wide viewports (not with `collapsible=none`), the drawer on narrow ones. It is ignored while typing in a text field or editable region, where the same keys mean bold, and the trigger announces it with `aria-keyshortcuts`. It has a modifier, so WCAG 2.1.4 (single-key shortcuts) does not apply.
- A collapsed panel and a closed drawer are hidden from assistive technology and the tab order.
- Target size: menu buttons at least 32px high and full width, trigger 32px square (WCAG 2.5.8). Reflow: at narrow widths the drawer replaces the side-by-side layout (WCAG 1.4.10).
- Contrast pairs and WCAG criteria: [contract.json](./contract.json) `accessibility`.

## 10. Usage

### Behavior
- The provider owns the wide-viewport expanded state; the trigger flips it and code can set it. `sb-toggle` fires after every change, so a product can remember it.
- On narrow viewports the trigger opens the drawer instead; the drawer always starts closed and its state is not a prop.
- Activating a link inside the open drawer closes it (Q5).
- Only the content region scrolls; header and footer stay put.

### Composition
- One provider per layout. Inside it: one sidebar (one per provider; a sidebar added later is picked up), and the main content, whose header holds the trigger.
- Sidebar: header (optional), content, footer (optional).
- Content: one or more groups; group: a group label (optional) then a menu; menu: items; item: one menu button.
- Icons in a menu button are decorative and come before the text.

### Choosing the props
1. `label`: name the navigation after what it navigates ("Documentation", "Settings").
2. `collapsible`: `offcanvas` (default) when the content benefits from the full width (reading, tables); `none` when the navigation must always be visible on wide screens.
3. On each menu button: `href`, and `active` on the one for the current page.
4. Provider `expanded`: false to start with the panel hidden on wide screens.

### Do / Don't
- Do mark exactly one item as the current page.
- Do keep the trigger outside the sidebar, in the content's header: it must stay reachable while the panel is hidden or the drawer closed.
- Don't use menu or menuitem roles for the site links: they promise application-menu keyboard behavior; keep the list of links.
- Don't give two navigations on a page the same name: they cannot be told apart in a landmark list; set a distinct `label`.

## Realizations

### Figma
Drawn in the library and read back (`realizations.design`).

### Web
Complete. Lit custom elements per part, state shared through context from the provider (SB-0007); the drawer is a native modal dialog in the sidebar's shadow root; the landmark is a native `<nav>` with `aria-label` in the same shadow root; groups are named through `ariaLabelledByElements` and the trigger references the panel through `ariaControlsElements` (SB-0009); list roles on the menu and item hosts when the author set none. The breakpoint is inlined into the stylesheet's media query at build time (`(width < var(--sb-sidebar-breakpoint))`, SB-0109) and read at runtime by the provider from `--sb-sidebar-breakpoint` with getComputedStyle; it is not a build-time script constant. Where `ariaControlsElements` is missing the trigger warns once; where `ariaLabelledByElements` is missing the group copies its label text and observes it (SB-0108). Files: `src/components/sidebar/` SidebarProvider.ts, Sidebar.ts, SidebarHeader.ts, SidebarContent.ts, SidebarFooter.ts, SidebarGroup.ts, SidebarGroupLabel.ts, SidebarMenu.ts, SidebarMenuItem.ts, SidebarMenuButton.ts, SidebarTrigger.ts, context.ts, index.ts, Sidebar.scss, Sidebar.styles.ts, Sidebar.stories.ts. Parts: wrapper, root, nav, drawer, header, content, footer, group, label, menu, item, button, trigger, icon. Slots: default. Spec: `playwright/tests/sidebar/sidebar.behavior.spec.ts`.

### Coverage
- native nav landmark named by label; label and collapsible reflect their defaults
- empty label warns once in the console
- menus are role=list with role=listitem items; an author role is kept; no menu roles
- groups named by their group label through ariaLabelledByElements (Chromium accessibility tree), including a label added later
- menu button renders a link with href, a button without; click is native, bubbles and composes
- active sets aria-current=page only with href; one current item
- trigger: native button named by label, aria-expanded per mode, ariaControlsElements to sb-sidebar, no ID
- provider expanded reflects, defaults to true; sb-toggle bubbles and composes from the trigger and from code
- offcanvas: collapsed panel has zero width, is hidden from the accessibility tree and the tab order; Enter and Space toggle
- Collapsed story starts hidden; collapsible=none never hides and hides the trigger (wide)
- Tab order: links in document order, then the trigger
- focus ring keyboard-only in the focus-ring token; hover and current fill, color and weight from tokens
- panel width, height, colors and border, menu button height and trigger size from tokens
- the media query equals (width < sidebar.breakpoint), inlined at build time
- RTL: panel at the right edge (wide), drawer at the right edge (narrow)
- dark mode panel color; forced colors: Highlight marker on the current item, panel border kept; reduced motion: no transition
- narrow: panel out of the layout; trigger opens a modal dialog drawer named by label; Enter opens it; focus moves inside
- Tab wraps from the last focusable to the first and Shift+Tab back, inside the open drawer; a summary counts, hidden candidates do not
- Escape and a press and release on the backdrop close it and return focus to the trigger; a drag from inside does not
- activating a menu link closes the drawer; crossing to wide closes it and shows the panel
- focus inside the sidebar moves to the trigger when the viewport crosses the breakpoint, both ways
- an empty breakpoint token warns once and keeps the wide layout
- trigger re-links to a sidebar added later; warns once without ariaControlsElements
- without ariaLabelledByElements, the copied group name follows a label text change
- a long menu button or group label wraps without clipping and grows the row
- the drawer leaves expanded and sb-toggle alone; drawer width, surface and backdrop from tokens; collapsible=none still gives a drawer
- axe clean: Default, Collapsed, Not collapsible, Narrow drawer open, RTL, Dark

### Known drift
- trigger size: the visual reference is 28px; 32px is the system small control size (WCAG 2.5.8 target size)
- collapsible=none on narrow viewports: the visual reference renders a plain block and loses the navigation on phones; here the trigger still opens the drawer
- drawer focus wrap: the native modal lets Tab leave the last control for the browser UI, so a keydown handler on the drawer wraps from last to first and back; custom elements count as focusable only when their shadow root delegates focus, and hidden or inert candidates are skipped
- drawer motion: it slides in on open (@starting-style) and closes without an exit slide
- menu button and group label text (the text wraps and the row grows past 32px): the visual reference truncates on one line; wrapping keeps text spacing and zoom readable (WCAG 1.4.12, 1.4.10), and one line still renders 32px high
- aria-controls: set through ariaControlsElements; Chromium reflects it as an empty aria-controls attribute; where the property is missing there is no aria-controls (informative only) and the trigger warns once in the console (SB-0108)
- href default: a menu button without an address carries href="" on the host and renders a native button

## Answers (owner, 2026-11-12)

From contract.json `openQuestions`:
- **Q1 Sidebar colors**: `color.sidebar`, `color.sidebar-foreground` and `color.sidebar-border` are added; the panel uses them.
- **Q2 Widths**: `size.sidebar.width` (256px) and `size.sidebar.drawer-width` (288px) are added.
- **Q3 Backdrop**: the shared `color.overlay` (also used by Dialog) is the drawer backdrop.
- **Q4 Breakpoint**: a breakpoint token with a build step: `size.breakpoint.narrow` from the breakpoints standard, inlined into the stylesheet's media query at build time and read at runtime by the provider from `--sb-sidebar-breakpoint`; no literal and no script constant (SB-0109, SB-0110).
- **Q5 Link closes the drawer**: yes, activating a menu link in the open drawer closes it.
- **Q6 Screen-reader pass**: the manual pass is replaced by the automated screen-reader views (SB-0113), stored in playwright/tests/sidebar/__screen-reader__/*.txt.

## Spec for agents
Build from contract.json only. CSS uses only --sb-sidebar-* variables (check T4). Tests first (rule test-first).
