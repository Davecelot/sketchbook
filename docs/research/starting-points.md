# Starting points and staying current

**Answer.** Established tools offer four entry doors: start from an existing system (Terrazzo's `tz init` can base a project on an open-source system; shadcn's `init` writes a preset), copy components in from a registry or block gallery (shadcn `add`, blocks such as dashboard-01 or login-03), import tokens from a design tool (Tokens Studio, Specify, Figma variables, Penpot JSON), or pull from a design file into docs and code (zeroheight, Supernova). Maintenance splits the same way: copy-in gives you ownership plus a diff command; packages give upgrades but little room to edit; Storybook shows a good upgrade pattern (one major at a time, automigrations, a doctor check). Sketchbook should offer ten starters and keep the spec file as the only thing a user must preserve; everything else can be regenerated and diffed.

As of: 2026-11-08. Evidence is limited to opened pages; Mobbin was available but not queried for this file (template kits below come from the component list you gave, informed by the shadcn blocks gallery, not from sampled screens).

## What the sources show

- **Blank.** Tailwind v4 lets you wipe defaults (`--*: initial`) and define your own (`--spacing: 4px`), so "blank" is a real mode, not an absence.
- **Full library.** Web Awesome, Spectrum Web Components, Carbon Web Components, Lion. Lion is unstyled and meant to be extended; Carbon's v3 will change how elements register, a breaking change users must be told about.
- **Templates/blocks.** shadcn's gallery shows featured sidebar, login and signup blocks, with examples dashboard-01, sidebar-07 (collapses to icons), sidebar-03 (submenus), login-03, login-04. Each lists required files and installs by CLI or copy-paste. (The `/docs/blocks` URL returned 404; the gallery page `/blocks` worked.)
- **Import tokens.** Terrazzo reads DTCG; Style Dictionary v4 reads DTCG and converts the old `value/type` form (but does not rename types like `size` to `dimension`); Tokens Studio reads and writes DTCG or legacy and syncs with GitHub, GitLab, Bitbucket, Azure DevOps; Penpot imports one JSON, ZIP or folder.
- **Extract from design file.** zeroheight syncs variables from several Figma files and compares brands and modes; Supernova keeps Figma and code in sync and opens PRs. Specify did the same but its homepage shows an "End of Specify" banner.
- **Multi-brand.** Penpot themes in groups (one active per group, active themes across groups combine); Figma collections have modes and an "extend collections" guide for multi-brand (linked, not read); Panda presets merge under your config and should use `extend`; Tailwind shared themes are plain CSS files in a package.
- **Upstream updates.** shadcn: `add --diff`, `--dry-run`, `--overwrite`, `eject` (irreversible, later updates to that file no longer apply); `migrate` exists for cn, icons, base-color, rtl, radix. Storybook: `upgrade`, `automigrate`, `doctor`; no codemods mentioned. Panda: preset values lose to yours.

## Starters for Sketchbook

| Starter | What the user gets | Model from sources | Edit and update story |
|---|---|---|---|
| blank | Empty spec, schema, one theme | Tailwind `--*: initial` | Spec is everything |
| foundations | Pick presets for spacing, type, color... (see standards-draft.json) | Open Props, Tailwind defaults | Change a preset id, rebuild |
| library | Full set of Web Components with default tokens | Web Awesome, Lion | Component files copied in; version stamp in spec |
| library+kits | Library plus page/block kits (below) | shadcn blocks | Kits are separate items that import components |
| pick | Choose components and foundations from a catalog | Terrazzo `tz init` from a system | Registry item list in spec |
| import | DTCG JSON / Tokens Studio / Penpot JSON in | Style Dictionary, Terrazzo, Penpot | Validate then map unknown types to a report |
| from-design-file | Read Figma variables or Penpot tokens | zeroheight, Supernova | Show a diff of design vs spec before accepting |
| from-codebase | Scan CSS variables and repeated literal values and propose tokens | Knapsack's idea of measuring conformance | Propose, never overwrite silently |
| multi-brand | Brand and mode layers over one semantic set | Penpot themes, Figma modes, Panda `extend` | Brand files override base files |
| upgrade | Compare installed version to new release; show diff; apply | shadcn diff/overwrite, Storybook automigrate | Keep user edits as patches; offer eject |

Rules to copy: always dry-run first; keep user edits separate from generated files so regeneration cannot erase them; run a doctor/lint pass after every change (Storybook doctor, Terrazzo lint); make ejecting an explicit one-way choice.

## Recommended initial template kits (8)
All use only: Accordion, Alert, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Card, Checkbox, Collapsible, Direction, Empty, Field, Input, Input Group, Item, Kbd, Label, Native Select, Pagination, Progress, Radio Group, Scroll Area, Separator, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toggle, Toggle Group, Typography. (Sidebar and Dialog are not in your list, so kits avoid them; navigation is Tabs, Breadcrumb, Button Group.)

1. **Sign in / sign up page.** Card, Field, Label, Input, Input Group (password with show toggle), Checkbox, Button, Separator, Alert (error), Typography. Why: forms and error states are the first thing every product needs; it exercises Field + validation + focus rings. (shadcn gallery lists login/signup as featured, so this is a proven first kit.)
2. **Settings page.** Tabs, Card, Field, Switch, Native Select, Radio Group, Textarea, Slider, Button Group, Separator, Alert. Why: tests dense form layout and density settings; shows toggles and every control state.
3. **Data table list page.** Table, Input Group (search), Toggle Group (view filter), Badge, Avatar, Checkbox, Pagination, Skeleton (loading), Empty (no results), Scroll Area, Kbd (shortcut hint). Why: loading, empty and error are where design systems usually fail; also tests type scale at small sizes.
4. **Dashboard overview.** Card, Progress, Badge, Tabs, Table, Avatar, Item, Separator, Spinner, Typography, Aspect Ratio. Why: stat cards and lists exercise neutral surfaces, elevation and semantic colors.
5. **Profile / account page.** Avatar, Card, Item, Field, Input, Textarea, Button, Badge, Separator, Breadcrumb. Why: a short, readable page for checking type hierarchy and spacing rhythm.
6. **Content / docs article page.** Typography, Breadcrumb, Accordion (FAQ), Collapsible, Kbd, Separator, Scroll Area (code or TOC), Aspect Ratio (media), Alert (callouts), Pagination (prev/next). Why: tests long-form line length, line height and heading scale; Direction lets you check right-to-left here.
7. **Empty states and onboarding.** Empty, Card, Progress (steps), Button, Item, Toggle Group (choose a role), Checkbox, Spinner, Skeleton. Why: first-run is where people start; shows tone, illustrations space and progress feedback.
8. **Form field gallery (states matrix).** Field, Label, Input, Input Group, Textarea, Native Select, Checkbox, Radio Group, Switch, Slider, Toggle, Toggle Group with default, hover, focus, disabled, invalid. Why: a single page to verify tokens (focus ring 2px, border widths, contrast) and Direction (RTL) in one place; use it as the visual regression anchor.

Optional 9: **Pricing / list of options** (Card, Badge, Item, Button, Toggle Group for billing period, Accordion for FAQ) for marketing-style layouts.

## Not verified
Mobbin screens, Figma "extend collections" details, shadcn `registry.json` schema, any codemod behavior outside Storybook and shadcn `migrate` (named only).

## Sources (pages opened)
- https://ui.shadcn.com/docs/cli
- https://ui.shadcn.com/docs/registry
- https://ui.shadcn.com/blocks
- https://terrazzo.app/docs/
- https://styledictionary.com/info/dtcg/
- https://docs.tokens.studio/
- https://help.penpot.app/user-guide/design-systems/design-tokens/
- https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
- https://zeroheight.com/
- https://www.supernova.io/
- https://www.specifyapp.com/
- https://www.knapsack.cloud/
- https://panda-css.com/docs/customization/presets
- https://tailwindcss.com/docs/theme
- https://storybook.js.org/docs/releases/upgrading
- https://github.com/carbon-design-system/carbon/tree/main/packages/web-components
- https://lion.js.org/
- https://webawesome.com/docs/
